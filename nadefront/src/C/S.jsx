import { useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import AuthContext from './AC';
import TR from '../C/TR';
import { useNotification } from '../C/noti';
import { useTheme } from '../C/TC';
import useAuth from '../hooks/UA';

const ADDON_LABELS = {
  public_uploads: 'Public Uploads',
  save_collections: 'More Collections',
};

export default function S({ count }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { paymentInfo, checkAuth } = useContext(AuthContext);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteWord, setDeleteWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();

  const activeAddons = paymentInfo?.activeAddons || [];
  const hasMainSub = paymentInfo?.tier && paymentInfo.tier !== 'Free';
  const hasAnyPaidThing = hasMainSub || activeAddons.length > 0;

  const cardBg = theme === 'light' ? 'bg-gray-800' : 'bg-[#161625]';

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Portal request failed");

      const data = await response.json();
      if (!data.url) throw new Error("No portal URL returned");

      window.location.href = data.url;
    } catch (err) {
      console.error("Stripe portal error:", err);
      showNotification("Failed to open subscription management. Please try again.", "error");
    } finally {
      setIsCancelling(false);
      setShowModal(false);
      checkAuth();
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteWord !== "DELETE") return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (response.status === 403) {
        showNotification("For security, please log out and log back in before deleting your account.", "error");
        setShowDeleteModal(false);
        setDeleteWord('');
        return;
      }
      
      if (!response.ok) throw new Error(data.error || "Delete request failed");

      showNotification("Your account has been scheduled for deletion.", "success");
      navigate("/");
    } catch (err) {
      console.error("Delete account error:", err);
      showNotification(err.message || "Failed to delete account. Please try again.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteWord('');
    }
  };

  const formatSubDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB');
  };

  const subEndDate = formatSubDate(paymentInfo?.subscriptionEnds);


  return (
    <div>
      <div className="max-w-4xl px-2 font-mono space-y-8 mt-6">
        <h1 className="text-base sm:text-lg font-bold mb-6">Profile Settings</h1>

        <div className={`${cardBg} p-6 rounded-xl shadow-lg`}>
          <h2 className="text-base sm:text-lg font-bold text-white mb-2">Subscription</h2>
          {hasAnyPaidThing ? (
          <>
            <p className="text-gray-300 text-sm sm:text-base">Current Plan: <span className="font-bold">{paymentInfo.tier || 'Free'}</span></p>
            <p className="text-gray-300 text-sm sm:text-base">
            Your Features:{" "}
            {activeAddons.length > 0 ? (
                <span>
                {activeAddons.map((id, index) => (
                    <span
                    key={id}
                    className="text-sm sm:text-base font-bold"
                    >
                    {ADDON_LABELS[id] || id}
                    {index < activeAddons.length - 1 && ", "}
                    </span>
                ))}
                </span>
            ) : (
                <span className="text-gray-400 text-sm sm:text-base">
                None
                </span>
            )}
            </p>

            {subEndDate && hasMainSub && (
            <p className="text-gray-400 text-sm sm:text-base">
                {paymentInfo.autoCancel
                ? <>Ends on: <span className="font-semibold">{subEndDate}</span> (subscription will not renew)</>
                : <>Next payment on: <span className="font-semibold">{subEndDate}</span></>
                }
            </p>
            )}

            {!user.isAdmin && (
            <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                disabled={isCancelling}
            >
                {isCancelling ? "Opening Stripe..." : "Manage/Cancel Subscriptions"}
            </button>
            )}
            {user.isAdmin && (
            <p className="text-green-400 mt-2 text-sm sm:text-base">
                As an admin, your subscription cannot be cancelled.
            </p>
            )}
        </>
        ) : (
        <>
            <p className="text-gray-400 text-sm sm:text-base mb-2">
            You are currently on the Free plan.
            </p>
            <p className="text-gray-500 text-xs">
            To subscribe, visit the Upgrade page.
            </p>
        </>
        )}
    </div>

        {/* Transaction History */}
        <div className="max-w-4xl font-mono space-y-8">
          <TR />
        </div>

        <div className={`${cardBg} p-6 rounded-xl shadow-lg space-y-4`}>
          <h2 className="text-base sm:text-base font-bold text-white mb-2">Delete Account</h2>
          <p className="text-gray-300 text-sm">Delete your account and all associated data. This action cannot be undone.</p>
          <button onClick={() => setShowDeleteModal(true)} className="text-sm sm:mt-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-red-900 transition">
            Delete Account
          </button>
        </div>
      </div>

      {/* Subscription Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-lg text-center">
            <h3 className="text-lg font-bold text-white mb-4">Manage Subscription</h3>
            <p className="text-gray-300 mb-6">You'll be redirected to Stripe's billing portal where you can update or cancel your subscriptions.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                disabled={isCancelling}
              >
                {isCancelling ? "Opening..." : "Open Stripe Portal"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 pt-20 sm:pt-4 overflow-y-auto">
          <div className={`${cardBg} rounded-lg max-w-md w-full p-6 shadow-lg text-center`}>
            <h3 className="text-xl font-bold text-white mb-4">Confirm Account Deletion</h3>
            <p className="text-gray-300 text-sm mb-4">
              Are you sure you want to delete your account? Your data will be permanently removed after <span className="text-white font-bold">30 days</span>. You can recover your account by logging in within that period.
            </p>
            <div className="bg-gray-700 p-3 rounded mb-4 text-left">
              <p className="text-gray-300 text-sm font-semibold mb-2">What will be removed:</p>
              <ul className="text-gray-400 text-sm list-disc list-outside space-y-1 ml-4">
                <li>Your user profile and account information</li>
                <li>Your saved collections and likes</li>
                <li>Your match history and parsed demo data</li>
                <li>Your lineup stats, challenge progress and completions</li>
                <li>Your active subscriptions will cancel immediately</li>
                <li>Your submitted lineups will remain but all personal information will be removed</li>
              </ul>
              <p className="text-gray-500 text-xs mt-3">You have 30 days to recover your account by logging back in.</p>
            </div>
            <input
              type="text"
              value={deleteWord}
              onChange={(e) => setDeleteWord(e.target.value)}
              className="w-full p-2 rounded-lg text-white bg-gray-800 border-2 border-gray-500 focus:border-white mb-4"
              placeholder="Type DELETE to confirm"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDeleteAccount}
                className={`px-4 py-2 rounded ${
                  deleteWord === "DELETE"
                    ? "text-white bg-red-700 hover:bg-red-800"
                    : "text-gray-500 bg-gray-700 cursor-not-allowed"
                }`}
                disabled={deleteWord !== "DELETE" || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteWord(''); }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <NotificationComponent />
    </div>
  );
}