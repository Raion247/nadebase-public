import { useEffect, useState, Fragment } from "react";
import { useTheme } from '../C/TC';

export default function TR() {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(() => new Set());
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const ADDON_LABELS = {
    public_uploads: "Public Uploads",
    save_collections: "More Collections",
  };

  const toggleExpanded = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/payment/transactions?page=${page}&limit=${limit}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Unknown error");

        const base = data.transactions || [];
        const related = data.related || [];

        // Process with both so status can be computed correctly
        const processed = processTransactions([...base, ...related]);

        // But only DISPLAY the paginated base rows (avoid page bleed)
        const baseIds = new Set(base.map((x) => String(x._id)));
        const visibleOnly = processed.filter((row) => baseIds.has(String(row._id)));

        setTransactions(visibleOnly);
        setTotalPages(Math.ceil((data.totalCount || 1) / limit));

        if (processed.length === 0 && page > 0) {
          setPage(0);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [page]);

  const processTransactions = (txs) => {
    const sorted = [...txs].sort(
      (a, b) => new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date)
    );

    const result = [];
    const purchasesById = {};
    const cancelEventRowById = {};
    const pushed = new Set(); // dedupe rows by (action + id + time)

    const getStripeId = (row) =>
      row?.details?.stripeSubscriptionId ||
      row?.details?.stripePaymentIntentId ||
      row?.details?.stripeCheckoutSessionId ||
      row?.__idKey ||
      null;

    const pushOnce = (row) => {
      const when = row.timestamp || row.date || row.__timestamp;
      const id =
        row.details?.stripeSubscriptionId ||
        row.details?.stripePaymentIntentId ||
        row.details?.stripeCheckoutSessionId ||
        row.__idKey ||
        "noid";
      const key = `${row.action}|${id}|${new Date(when).getTime()}`;
      if (pushed.has(key)) return;
      pushed.add(key);
      result.push(row);
    };

    for (const tx of sorted) {
      const { action, details = {} } = tx;
      const date = tx.timestamp || tx.date;

      const idKey =
        details.stripeSubscriptionId ||
        details.stripePaymentIntentId ||
        details.stripeCheckoutSessionId ||
        null;

      // --- Purchases ---
      if (action === "PAYMENT_UPGRADE" || action === "PAYMENT_ONE_TIME") {
        const newTx = {
          ...tx,
          __inactive: false,
          __idKey: idKey,
          __timestamp: new Date(date).getTime(),
        };

        // New main purchase replaces previously active ones
        for (const existing of Object.values(purchasesById)) {
          const existingAction = existing.action;
          const isMain =
            existingAction === "PAYMENT_UPGRADE" || existingAction === "PAYMENT_ONE_TIME";

          if (isMain && !existing.__inactive) {
            existing.__inactive = true;
            existing.__replacedBy = idKey;
          }
        }

        pushOnce(newTx);
        if (idKey) purchasesById[idKey] = newTx;
        continue;
      }

      if (action === "PAYMENT_ADDON_PURCHASE") {
        const newTx = {
          ...tx,
          __inactive: false,
          __idKey: idKey,
          __timestamp: new Date(date).getTime(),
        };

        pushOnce(newTx);
        if (idKey && !purchasesById[idKey]) purchasesById[idKey] = newTx;
        continue;
      }

      // --- Cancel (scheduled end of period) ---
      if (action === "PAYMENT_CANCEL" || action === "PAYMENT_ADDON_CANCEL") {
        const targetId =
          details.stripeSubscriptionId ||
          details.stripePaymentIntentId ||
          details.stripeCheckoutSessionId;

        const target = purchasesById[targetId];

        // mark the purchase as "cancelled" but still ACTIVE until end date
        if (target && new Date(date) >= new Date(target.timestamp || target.date)) {
          target.__cancelled = true;

          if (details.subscriptionEnds) {
            target.details = {
              ...target.details,
              subscriptionEnds: details.subscriptionEnds,
            };
          }
        }

        const cancelRow = {
          ...tx,
          __inactive: false,      // scheduled cancel row itself = still active until end
          __cancelEvent: true,
          __cancelled: true,
          __idKey: targetId,
          __timestamp: new Date(date).getTime(),
        };

        pushOnce(cancelRow);

        if (targetId) cancelEventRowById[targetId] = cancelRow;

        continue;
      }

      if (action === "SUBSCRIPTION_EXPIRED_AUTO_CANCELLED") {
        const targetId =
          details.stripeSubscriptionId ||
          details.stripePaymentIntentId ||
          details.stripeCheckoutSessionId;

        const target = purchasesById[targetId];

        // Mark the original purchase row inactive too
        if (target && new Date(date) >= new Date(target.timestamp || target.date)) {
          target.__inactive = true;
          target.__cancelled = true;
        }

        if (targetId && cancelEventRowById[targetId]) {
          cancelEventRowById[targetId].__inactive = true;
        }

        // Show the ended event itself
        pushOnce({
          ...tx,
          __inactive: true,
          __cancelEvent: true,
          __idKey: targetId,
          __timestamp: new Date(date).getTime(),
        });

        continue;
      }

      // --- Ended (subscription.deleted actually happened) ---
      if (action === "PAYMENT_ADDON_ENDED") {
        const targetId =
          details.stripeSubscriptionId ||
          details.stripePaymentIntentId ||
          details.stripeCheckoutSessionId;

        const target = purchasesById[targetId];

        // mark purchase INACTIVE immediately
        if (target && new Date(date) >= new Date(target.timestamp || target.date)) {
          target.__inactive = true;
          target.__cancelled = true;

          // optional end date if provided
          if (details.subscriptionEnds) {
            target.details = {
              ...target.details,
              subscriptionEnds: details.subscriptionEnds,
            };
          }
        }

        // show ended event itself as inactive
        pushOnce({
          ...tx,
          __inactive: true,
          __endedEvent: true,
          __idKey: targetId,
          __timestamp: new Date(date).getTime(),
        });

        continue;
      }

      // --- Renewals ---
      if (action === "SUBSCRIPTION_RENEWED") {
        const targetId =
          details.stripeSubscriptionId ||
          details.stripePaymentIntentId ||
          details.stripeCheckoutSessionId;

        const target = purchasesById[targetId];

        if (target && new Date(date) >= new Date(target.timestamp || target.date)) {
          if (details.newEnd) {
            target.details = { ...target.details, subscriptionEnds: details.newEnd };
          }
        }

        pushOnce({
          ...tx,
          __inactive: false,
          __idKey: targetId,
          __timestamp: new Date(date).getTime(),
        });
      }
    }

    const endedIds = new Set(
      result
        .filter(
          (r) =>
            r.action === "PAYMENT_ADDON_ENDED" ||
            r.action === "SUBSCRIPTION_EXPIRED_AUTO_CANCELLED"
        )
        .map(getStripeId)
        .filter(Boolean)
    );

    for (const row of result) {
      const rid = getStripeId(row);
      if (rid && endedIds.has(rid)) {
        row.__inactive = true;
        row.__cancelled = true;
      }
    }
    // Newest first
    return result.sort(
      (a, b) =>
        new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
    );
  };

  const friendlyAction = (action, details) => {
    if (action === "PAYMENT_ONE_TIME") return "One-Time Purchase";
    if (action === "PAYMENT_UPGRADE")
      return `Subscription (${details?.tier || ""})`;
    if (action === "SUBSCRIPTION_EXPIRED_AUTO_CANCELLED")
      return "Subscription Ended";
    if (action === "PAYMENT_ADDON_PURCHASE") return "Feature Subscription";
    if (action === "PAYMENT_ADDON_CANCEL") return "Feature Subscription Cancelled";
    if (action === "PAYMENT_CANCEL") return "Subscription Cancelled";
    if (action === "SUBSCRIPTION_RENEWED") return "Subscription Renewed";
    if (action === "PAYMENT_ADDON_ENDED") return "Feature Subscription Ended";
    return "Transaction";
  };

  const formatDate = (val) => {
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? "Unknown Date" : d.toLocaleDateString('en-GB');
    } catch {
      return "Unknown Date";
    }
  };

  const prettyAddon = (id) =>
    ADDON_LABELS[id] || String(id).replace(/_/g, " ");

  const formatDetails = (details = {}, tx) => {
    const isCancelled = tx.__cancelled === true;

    const cleaned = { ...details };
    delete cleaned.provider;
    delete cleaned.reason;
    delete cleaned.previousEnd;
    const isEndedEvent =
      tx.action === "PAYMENT_ADDON_ENDED" ||
      tx.action === "SUBSCRIPTION_EXPIRED_AUTO_CANCELLED";
    let isInactive = isEndedEvent || tx.__inactive === true;

    let rawEndDate = null;
    if (cleaned.subscriptionEnds || cleaned.newEnd) {
      rawEndDate = new Date(cleaned.subscriptionEnds || cleaned.newEnd);
    }

    if (rawEndDate && rawEndDate < new Date()) {
      isInactive = true;
    }

    const endDate = rawEndDate ? rawEndDate.toLocaleDateString('en-GB') : null;

    const id =
      cleaned.stripeSubscriptionId ||
      cleaned.stripePaymentIntentId ||
      cleaned.stripeCheckoutSessionId ||
      "—";

    const isOneTime = tx.action === "PAYMENT_ONE_TIME";

    let endLabel = "Next Renewal:";
    if (isInactive) endLabel = "Ended On:";
    else if (isCancelled) endLabel = "Ends On:";
    else if (isOneTime) endLabel = "Ends On:";

    const addonsPurchased = cleaned.addonsPurchased || cleaned.addons || [];
    const removedAddons = cleaned.removedAddons || [];
    const remainingAddons = cleaned.remainingAddons || [];

    return (
      <div className="flex flex-col gap-1">
        <div>
          <span className="font-semibold">Status:</span>{" "}
          <span className={isInactive ? "text-red-400" : "text-green-400"}>
            {isInactive ? "Inactive" : "Active"}
          </span>
        </div>

        {cleaned.tier && (
          <div>
            <span className="font-semibold">Tier:</span> {cleaned.tier}
          </div>
        )}

        <div>
          <span className="font-semibold">Subscription ID:</span>{" "}
          <span className="text-gray-400 text-xs break-all">{id}</span>
        </div>

        {endDate && (
          <div>
            <span className="font-semibold">{endLabel}</span> {endDate}
          </div>
        )}

        {addonsPurchased.length > 0 && (
          <div>
            <span className="font-semibold">Features purchased:</span>{" "}
            <span className="text-gray-300 text-xs">
              {addonsPurchased.map(prettyAddon).join(", ")}
            </span>
          </div>
        )}

        {removedAddons.length > 0 && (
          <div>
            <span className="font-semibold">Features cancelled:</span>{" "}
            <span className="text-gray-300 text-xs">
              {removedAddons.map(prettyAddon).join(", ")}
            </span>
          </div>
        )}

        {remainingAddons.length > 0 && (
          <div>
            <span className="font-semibold">Features remaining:</span>{" "}
            <span className="text-gray-300 text-xs">
              {remainingAddons.map(prettyAddon).join(", ")}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (error) return <div className="text-red-400">Error: {error}</div>;

  if (loading && transactions.length === 0)
    return (
      <div className={`${theme === 'light' ? 'bg-gray-800' : 'bg-[#161625]'} p-6 rounded-xl shadow-lg`}>
        <h2 className="text-xl font-bold text-white mb-4">
          Transaction History
        </h2>
        <div className="text-gray-400">Loading transactions...</div>
      </div>
    );

  if (transactions.length === 0)
    return (
      <div className={`${theme === 'light' ? 'bg-gray-800' : 'bg-[#161625]'} p-6 rounded-xl shadow-lg`}>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
          Transaction History
        </h2>
        <div className="text-gray-400 text-sm sm:text-base">
          No transactions found.
        </div>
      </div>
    );

  return (
    <div className={`${theme === 'light' ? 'bg-gray-800' : 'bg-[#161625]'} p-6 rounded-xl shadow-lg`}>
      <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
        Transaction History
      </h2>

      <table className="w-full text-gray-300 border-collapse">
        <thead>
          <tr className="border-b border-gray-700 text-left">
            <th className="py-2 px-2">Date</th>
            <th className="py-2 px-2">Action</th>

            {/* Hide details header on mobile */}
            <th className="py-2 px-2 hidden sm:table-cell">Details</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((tx) => {
            const key = String(tx._id || tx.id);
            const isOpen = expanded.has(key);

            return (
              <Fragment key={key}>
                <tr
                  key={key}
                  className="border-b border-gray-700 hover:bg-gray-700 transition"
                >
                  <td className="py-2 px-2 align-top">
                    {formatDate(tx.timestamp || tx.date)}
                  </td>

                  <td className="py-2 px-2 align-top">
                    <div className="font-semibold text-white">
                      {friendlyAction(tx.action, tx.details)}
                    </div>

                    {/* Mobile toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(key)}
                      className="sm:hidden mt-1 text-xs text-gray-300 underline underline-offset-2 hover:text-white"
                    >
                      {isOpen ? "Hide details" : "View details"}
                    </button>
                  </td>

                  {/* Desktop details */}
                  <td className="py-2 px-2 text-sm text-gray-400 hidden sm:table-cell align-top">
                    {formatDetails(tx.details, tx)}
                  </td>
                </tr>

                {/* Mobile expanded row */}
                {isOpen && (
                  <tr className="sm:hidden border-b border-gray-700 bg-gray-900/30">
                    <td colSpan={2} className="py-2 px-2 text-sm text-gray-300">
                      {formatDetails(tx.details, tx)}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          className={`px-3 py-1 rounded-md ${
            page === 0
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`px-3 py-1 rounded-md ${
              i === page
                ? "bg-blue-600 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className={`px-3 py-1 rounded-md ${
            page + 1 >= totalPages
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
        >
          Next
        </button>
      </div>

      {loading && (
        <div className="text-gray-400 mt-2 text-center">Loading...</div>
      )}
    </div>
  );
}