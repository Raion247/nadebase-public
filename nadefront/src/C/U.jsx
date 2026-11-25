import { useState, useEffect, useRef, useContext } from "react";
import { motion, useInView } from "motion/react";
import { FaCheck, FaSteam, FaAngleDoubleRight } from "react-icons/fa";
import '../index.css';
import AuthContext from "./AC";

const U = ({ showNotification }) => {
  const { user, paymentInfo } = useContext(AuthContext);
  const ownedAddons = Array.isArray(paymentInfo?.activeAddons)
    ? paymentInfo.activeAddons
    : [];
  const [selectedTier, setSelectedTier] = useState(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [voidColorCount, setVoidColorCount] = useState(null);

  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const supporterFeatures = [
    "Daily uploads: 50",
    "Monthly uploads: 250",
    "Save Collections: 50",
    "Private Uploads: 250",
    "Premium Challenges",
    "Limited Name Color",
  ];

  const col1 = supporterFeatures.slice(0, 4);
  const col2 = supporterFeatures.slice(4);

  const freeTier = {
    id: "Free",
    features: [
      "Daily uploads: 3",
      "Monthly uploads: 10",
      "Save Collections: 5",
    ],
  };

  const currentTier = paymentInfo?.tier === "Supporter"
    ? { id: "Supporter", features: supporterFeatures }
    : freeTier;

  const normalizeFeatureKey = (str) =>
    str.toLowerCase().replace(/collections|uploads|:/g, "").trim();

  const getCurrentTierFeatureValue = (featureLabel) => {
    const matchInCurrent = currentTier.features.find((f) =>
      normalizeFeatureKey(f).includes(normalizeFeatureKey(featureLabel))
    );
    const currentMatch = matchInCurrent?.match(/(\d+)/);
    return currentMatch ? parseInt(currentMatch[1], 10) : null;
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/user/void-count`)
      .then(r => r.json())
      .then(data => setVoidColorCount(data.remaining ?? null))
      .catch(() => {});
  }, []);

  const handleSteamLogin = (e) => {
    e.preventDefault();

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      `${import.meta.env.VITE_API_URL}/auth/steam`,
      "SteamLogin",
      `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no,location=no`
    );

    const listener = (event) => {
      if (event.origin !== import.meta.env.VITE_API_URL) return;
      if (event.data === "steam-auth-success") {
        popup.close();
        window.location.reload();
        window.removeEventListener("message", listener);
      }
    };

    window.addEventListener("message", listener);
  };

  const handleStripeCheckout = async () => {
    if (!selectedTier) return;
    setIsCreatingCheckout(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stripe/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tier: selectedTier
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Missing checkout url:", data);
        showNotification?.("Failed to start checkout. Please try again.", "error");
      }
    } catch (err) {
      console.error("Stripe checkout error:", err);
      showNotification?.("Failed to start checkout. Please try again.", "error");
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const isSupporter = paymentInfo?.tier === "Supporter";

  const numericFeatures = supporterFeatures.filter(f => f.match(/(.+?):\s*(\d+)/));
  const nonNumericFeatures = supporterFeatures.filter(f => !f.match(/(.+?):\s*(\d+)/));

  const renderFeature = (feature, i) => {
    if (feature === "Limited Name Color") {
      const remaining = voidColorCount ?? 0;
      const soldOut = remaining <= 0;
      const displayName = user?.displayName || 'Void';
      return (
        <li key={i} className={`relative flex items-center gap-2 ${soldOut ? 'sm:right-11.5' : 'sm:right-10'}`}>
          <span className={`text-xs px-1 py-0.5 font-mono font-semibold rounded-sm ${soldOut ? 'outline-[1.5px] outline-red-400/40 bg-red-400/15 text-red-400' : 'outline-[1.5px] outline-green-600 bg-green-500/30 text-white'}`}>
            {soldOut ? 'Sold out' : `${remaining} left`}
          </span>
          <span className={soldOut ? 'text-gray-500 line-through' : 'text-white'}>
            Limited Name Color: <span className={`font-bold ml-1 ${soldOut ? '' : 'void-name'}`}>{displayName}</span>
          </span>
        </li>
      );
    }

    const match = feature.match(/(.+?):\s*(\d+)/);
    const featureLabel = match ? match[1].trim() : feature.trim();
    const supporterValue = match ? parseInt(match[2], 10) : null;

    if (supporterValue === null) {
      return (
        <li key={i} className="flex items-center gap-2">
          <FaCheck className="text-green-400 shrink-0" />
          <span className="text-white">{feature}</span>
        </li>
      );
    }

    const currentValue = getCurrentTierFeatureValue(featureLabel);
    const currentColorClass = currentTier.id === "Free" ? "text-red-400 font-semibold" : "text-green-400 font-semibold";

    if (currentValue !== null && currentValue === supporterValue) {
      return (
        <li key={i} className="flex items-center gap-2">
          <FaCheck className="text-green-400 shrink-0" />
          <span className="text-white">{featureLabel}:</span>
          <span className="text-green-400 font-bold">{supporterValue}</span>
        </li>
      );
    }

    return (
      <li key={i} className="flex items-center gap-2 flex-wrap">
        <FaCheck className="text-green-400 shrink-0" />
        <span className="text-white">{featureLabel}:</span>
        {currentValue !== null && (
          <>
            <span className={currentColorClass}>{currentValue}</span>
            <FaAngleDoubleRight className="text-green-400" />
          </>
        )}
        <span className="text-green-400 font-bold">{supporterValue}</span>
      </li>
    );
  };

  return (
    <div className="mt-25 -mb-15 flex flex-col items-center">
      <motion.div
        ref={sectionRef}
        initial={{ y: 100, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 1, type: "spring" }}
        className="w-full max-w-6xl px-4 md:px-6"
      >
        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold font-mono mb-5 text-center text-white">
          Choose your option
        </h2>
        <p className="text-sm md:text-base text-center text-gray-300 mb-6">
          Support Nadebase and get access to all features with the Supporter Pack.
        </p>

        {/* Centered Supporter Pack */}
        <div className="flex justify-center mb-3">
            <button
            type="button"
            onClick={() => !isSupporter && setSelectedTier(prev => prev === "Supporter" ? null : "Supporter")}
            disabled={isSupporter}
            className={`
            relative border rounded-lg p-6 text-left transition-all
            border-amber-400 bg-gradient-to-b from-gray-800 to-gray-900 shadow-[0_0_25px_rgba(255,191,0,0.3)] 
            ${!isSupporter ? 'hover:shadow-[0_0_40px_rgba(255,191,0,0.6)] hover:scale-104 cursor-pointer' : 'cursor-default'}
            ${selectedTier === "Supporter" ? "ring-2 ring-blue-500" : ""}
            w-full max-w-2xl
            `}
            >
            {/* RECOMMENDED LABEL FOR WHEN MORE THAN ONE
                <div className="absolute z-1 -top-2.5 right-3 bg-amber-500 text-xs font-bold text-black px-2 py-0.5 rounded-full">
                {isSupporter ? "Active" : "Recommended"}
                </div>
            */}

                <h4 className="text-xl font-bold text-white mb-1">Supporter Pack</h4>

                <div className="relative text-3xl font-extrabold text-amber-400 mb-2">
                    <span className="absolute left-42 bottom-7 rotate-16 text-gray-400 line-through decoration-2 decoration-red-700 text-2xl">$7.96</span>
                    <span className="text-shadow-[0_0_15px_rgba(255,191,0,1)]">$4.99</span> / month
                    <div className="absolute z-0 -top-[11.5px] -right-[59px] rotate-45">
                      <div className="bg-red-600/80 text-white text-xs font-bold px-12 py-1 clip-ribbon shadow-lg">
                      SALE • 37% OFF
                      </div>
                    </div>
                </div>

            <div className="flex flex-col sm:flex-row gap-1 sm:gap-15 mb-2">
              <ul className="text-sm text-gray-300 space-y-1">
                {col1.map((f, i) => renderFeature(f, i))}
            </ul>
              <ul className="text-sm text-gray-300 space-y-1">
                {col2.map((f, i) => renderFeature(f, i))}
              </ul>
            </div>

            <span className="text-xs text-gray-400 border-t border-gray-700/60 pt-2 block">
              {/* Payment logos */}
              <div className="flex gap-1">
                <img src="/uploads/visa.svg" alt="Visa" className="rounded-md h-5" />
                <img src="/uploads/mastercard.svg" alt="Mastercard" className="rounded-md h-5" />
                <img src="/uploads/apple_pay.svg" alt="Apple Pay" className="rounded-md h-5" />
                <img src="/uploads/google-pay.svg" alt="Google Pay" className="rounded-md h-5" />
                <img src="/uploads/paypal.svg" alt="PayPal" className="rounded-md h-5" />
              </div>
            </span>
          </button>
        </div>

        {/* Summary & action */}
        <div className="flex flex-col font-mono items-center w-full justify-center">
          <div className="border border-gray-700 rounded-lg w-full max-w-2xl min-h-[120px] flex flex-col items-center justify-center text-center transition-all hover:scale-104 px-4 py-4 bg-gray-900/60">
            {isSupporter ? (
              <p className="text-green-400 font-bold text-xl">You're already a Supporter — thank you!</p>
            ) : !selectedTier ? (
                <p className="text-md sm:text-xl md:text-2xl font-bold text-blue-400">
                Select the Supporter Pack
                </p>
            ) : (
              <>
                <p className="text-md sm:text-xl md:text-2xl font-bold text-green-400 mb-1">
                  You selected the Supporter Pack.
                </p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  This subscription includes multiple features and helps support development.
                </p>
              </>
            )}

            {!isSupporter && selectedTier && (
              !user ? (
                <button
                  onClick={handleSteamLogin}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all shadow-md hover:scale-105 mt-5"
                >
                  <FaSteam size={20} />
                  Log in with Steam to Subscribe
                </button>
              ) : (
                <button
                  onClick={handleStripeCheckout}
                  disabled={isCreatingCheckout}
                  className={`flex items-center justify-center px-3 py-2 rounded-full font-semibold transition-all mt-5 backdrop-blur-sm
                    ${isCreatingCheckout
                        ? "border border-gray-600 text-gray-400 bg-gray-700/20 cursor-not-allowed opacity-60"
                        : "border border-amber-400 text-amber-400 bg-amber-400/10 hover:text-orange-400 hover:border-orange-400 hover:bg-orange-400/10 shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_12px_rgba(255,165,0,0.5)] hover:scale-[1.03] active:scale-[0.98]"
                    }`}
                >
                  {isCreatingCheckout ? "Redirecting..." : "Subscribe to Supporter Pack"}
                </button>
              )
            )}

            <p className="text-gray-500 text-[10px] sm:text-xs pb-1 pt-5">
              Stripe will handle your subscription. You can manage or cancel it via the billing portal.
            </p>
          </div>
        </div>

        <div className="flex flex-col font-mono items-center w-full justify-center pt-3 px-0 md:px-30">
          <div className="border border-gray-700/50 rounded-xl w-full max-w-[470px] md:max-w-2xl flex flex-col bg-gray-900/60 overflow-hidden transition-all hover:scale-[1.02]">
            <div className="flex justify-center px-6 py-4 border-b border-gray-700/50">
              <h2 className="text-base sm:text-xl font-bold text-white">Your support helps fund these future updates</h2>
            </div>
            <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: 'Private uploads', done: true },
                { label: 'Expanded leveling system', done: true },
                { label: 'Faceit browser extension', done: false },
                { label: 'More tracked lineups', done: false },
                { label: 'More challenges', done: false },
                { label: 'Easy collection sharing', done: false },
                { label: 'Public user profiles', done: false },
                { label: 'Feedback panel in user profile', done: false },
                { label: 'Mobile friendly view', done: false },
                { label: 'Premade collections for each map', done: false },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2">
                  {done
                    ? <FaCheck className="text-green-400 text-xs shrink-0" />
                    : <div className="w-3 h-3 rounded-full border border-gray-600 shrink-0" />
                  }
                  <span className={`text-sm ${done ? 'text-emerald-400' : 'text-gray-400'}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default U;