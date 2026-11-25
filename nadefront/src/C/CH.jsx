import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/UA";

const CADENCE_LABELS = {
  onboarding: "Beginner",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  premium_weekly: "Premium Weekly",
  premium_monthly: "Premium Monthly",
};

const DIFFICULTY_COLORS = {
  easy: "text-green-400 bg-green-900/30 border-green-700/40",
  medium: "text-yellow-400 bg-yellow-900/30 border-yellow-700/40",
  hard: "text-red-400 bg-red-900/30 border-red-700/40",
};

const DIFFICULTY_LABEL_COLORS = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

const PREMIUM_LABEL_COLOR = "text-yellow-400";

const XP_REWARDS = {
  onboarding: { easy: 100, medium: 300, hard: 500 },
  daily: { easy: 200, medium: 300, hard: 500 },
  weekly: { easy: 1150, medium: 1350, hard: 2250 },
  monthly: { easy: 4000, medium: 6000, hard: 10000 },
  premium_weekly: { easy: 2300, medium: 2700, hard: 4500 },
  premium_monthly: { easy: 8000, medium: 12000, hard: 20000 },
};

export default function CH({ showNotification }) {
  const navigate = useNavigate();
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/challenges/history`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch challenge history");
        const data = await res.json();
        setCompletions(data.completions || []);
      } catch (e) {
        showNotification?.("Failed to load challenge history", "error");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4 px-2 sm:px-0 mt-6">Challenge History</h2>

      {loading && <div className="text-gray-500 text-sm px-2">Loading...</div>}

      {!loading && completions.length === 0 && (
        <div className="text-gray-500 text-sm px-2">No challenges completed yet. Start parsing demos to complete challenges!</div>
      )}

      {!loading && completions.length > 0 && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5 px-2 sm:px-0">
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs mb-1">Completed</p>
              <p className="text-white text-lg font-bold">{completions.length}</p>
            </div>
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs mb-1">XP Earned</p>
              <p className="text-yellow-400 text-lg font-bold">
                {completions.reduce((sum, c) => sum + (c.xpAwarded || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs mb-1">Latest</p>
              <p className="text-white text-lg font-bold">
                {new Date(completions[0]?.completedAt).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>

          {/* Grid instead of full-width list */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-2 sm:px-0">
            {completions.map((c) => {
              const challenge = c.challengeSnapshot || c.challengeId;
              if (!challenge) return null;

              const isPremium = c.challengeId?.isPremium || challenge.cadence?.includes("premium");
              const labelColor = challenge.cadence === "onboarding"
                ? "text-teal-400"
                : isPremium
                ? PREMIUM_LABEL_COLOR
                : DIFFICULTY_LABEL_COLORS[challenge.difficulty];
              const xpReward = c.xpAwarded || XP_REWARDS[challenge.cadence]?.[challenge.difficulty] || 0;

              return (
                <div key={c._id} className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`text-xs font-bold ${labelColor}`}>
                        {CADENCE_LABELS[challenge.cadence]}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${DIFFICULTY_COLORS[challenge.difficulty]}`}>
                        {challenge.difficulty}
                      </span>
                      {xpReward > 0 && (
                        <span className={`text-[10px] font-bold ${labelColor}`}>
                          +{xpReward.toLocaleString()} XP
                        </span>
                      )}
                    </div>
                    <p className="text-white font-bold text-sm truncate">{challenge.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{challenge.description}</p>
                    <div className="flex gap-2 mt-1.5 text-xs text-gray-500">
                      {c.evidence?.accuracy != null && (
                        <span>Accuracy: <span className="text-green-400 font-bold">{c.evidence.accuracy}%</span></span>
                      )}
                      {c.evidence?.statValue != null && (
                        <span>Value: <span className="text-green-400 font-bold">{c.evidence.statValue}</span></span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-green-400 text-xs font-bold">✓</div>
                    <div className="text-gray-500 text-xs mt-2">
                      {new Date(c.completedAt).toLocaleDateString("en-GB")}
                    </div>
                    {c.matchId && (
                      <button
                        onClick={() => navigate(`/matches/${c.matchId}`)}
                        className="mt-2.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Match →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}