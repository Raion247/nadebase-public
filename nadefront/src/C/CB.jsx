import { useState, useEffect } from "react";

const STORAGE_KEY = "analyticsConsent";

export default function CookieBanner({ onAccept }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, "false");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-gray-800 text-gray-200 p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm">
          We use optional analytics (Google Analytics) to understand how Nadebase is used and
          improve the site. You can continue without enabling analytics.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDecline}
            className="text-gray-400 border border-gray-500 text-sm px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="bg-orange-500 text-white text-sm px-4 py-2 rounded-md"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}