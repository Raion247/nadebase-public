import { useEffect, useState } from "react";
import { TbTargetArrow } from "react-icons/tb";
import { FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/UA";
import LP from "./LP";

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
  daily: { easy: 200, medium: 300, hard: 500 },
  weekly: { easy: 1150, medium: 1350, hard: 2250 },
  monthly: { easy: 4000, medium: 6000, hard: 10000 },
  premium_weekly: { easy: 2300, medium: 2700, hard: 4500 },
  premium_monthly: { easy: 8000, medium: 12000, hard: 20000 },
  onboarding: { easy: 100, medium: 300, hard: 500 },
};

function useCountdown(endsAt) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt) - new Date();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h >= 24) {
        const d = Math.floor(h / 24);
        setTimeLeft(`${d}d ${h % 24}h`);
      } else {
        setTimeLeft(`${h}h ${m}m`);
      }
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return timeLeft;
}

function ChallengeCard({ challenge, isPremiumUser, navigate }) {
  const [showImage, setShowImage] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const timeLeft = useCountdown(challenge.endsAt);
  const isLocked = challenge.isPremium && !isPremiumUser;
  const progress = challenge.progress || 0;
  const target = challenge.statTarget || 1;
  const xpReward = XP_REWARDS[challenge.cadence]?.[challenge.difficulty] || 0;
  const pct = challenge.type === "stat" && challenge.statScope === "cumulative"
    ? Math.min(100, Math.round((progress / target) * 100))
    : null;

  // Top band color
  const topBandColor =
    challenge.cadence === "onboarding" ? "bg-teal-900/60" :
    challenge.isPremium ? "bg-yellow-900/50" :
    challenge.difficulty === "easy" ? "bg-green-900/50" :
    challenge.difficulty === "medium" ? "bg-yellow-900/50" :
    "bg-red-900/50";

  // Border + glow
  const borderColor =
    challenge.completed
      ? "border-green-500/50 shadow-[0_0_12px_2px_rgba(74,222,128,0.15)]" :
    challenge.cadence === "onboarding" ? "border-teal-700/40" :
    challenge.isPremium ? "border-yellow-700/40" :
    challenge.difficulty === "easy" ? "border-green-700/40" :
    challenge.difficulty === "medium" ? "border-yellow-700/40" :
    "border-red-700/40";

  // Label color
  const labelColor =
    challenge.cadence === "onboarding" ? "text-teal-400" :
    challenge.isPremium ? PREMIUM_LABEL_COLOR :
    DIFFICULTY_LABEL_COLORS[challenge.difficulty];

  return (
    <>
      <div className={`relative rounded-xl border overflow-hidden flex flex-col transition-all ${borderColor}`}>

        {/* Top band */}
        <div className={`${topBandColor} px-4 pt-4 pb-3 border-b border-gray-700/50`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex -mt-[3px] items-center gap-1.5 flex-wrap">
              <span className={`text-sm font-bold ${labelColor}`}>
                {CADENCE_LABELS[challenge.cadence]}
              </span>
              {challenge.isPremium && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-yellow-600/40 bg-yellow-900/20 text-yellow-400">
                  ★ Premium
                </span>
              )}
              {!challenge.isPremium && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[challenge.difficulty]}`}>
                  {challenge.difficulty}
                </span>
              )}
              <span className={`text-xs font-bold ${labelColor}`}>
                +{xpReward.toLocaleString()} XP
              </span>
            </div>
            {challenge.cadence !== "onboarding" && (
              <span className="-mt-[3px] text-gray-500 text-xs shrink-0">{timeLeft}</span>
            )}
          </div>
        </div>

        {/* Body — inset shadow */}
        <div
          className={`flex-1 flex flex-col gap-2 p-4 bg-gray-800/60 inset-shadow-xs inset-shadow-black ${
            isLocked ? "opacity-50 pointer-events-none select-none" : ""
          }`}
        >
          <div className="flex-1 -mt-1">
            {challenge.lineupCode ? (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/by-codes?codes=${challenge.lineupCode}`);
                    const data = await res.json();
                    const lineup = data.lineups?.[challenge.lineupCode];
                    if (!lineup) return;
                    const item = {
                      id: lineup._id,
                      code: lineup.code,
                      title: lineup.title,
                      src: lineup.src,
                      ...(lineup.src2 && { src2: lineup.src2 }),
                      map: lineup.map,
                      name: lineup.name,
                      desc: lineup.desc || '',
                      exp: lineup.exp || '',
                      ...(lineup.desc2 && { desc2: lineup.desc2 }),
                      side: lineup.side,
                    };
                    const existing = JSON.parse(localStorage.getItem('favorites') || '[]');
                    if (!existing.some(f => f.id === item.id)) {
                      localStorage.setItem('favorites', JSON.stringify([...existing, item]));
                    }
                    navigate('/collections');
                  } catch (e) {}
                }}
                className="text-white font-bold text-sm underline underline-offset-2 hover:text-blue-300 transition-colors text-left"
              >
                {challenge.title}
              </button>
            ) : (
              <p className="text-white font-bold text-sm">{challenge.title}</p>
            )}
            {(challenge.lineup?.src2 || challenge.lineup?.src) && (
              <button
                onClick={() => { setModalImageIndex(0); setShowImage(true); }}
                className="relative top-1 ml-2 text-gray-300 hover:text-white transition-colors shrink-0"
                title="View lineup"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <p className="text-gray-400 text-xs mt-1 mb-3">{challenge.description}</p>
          </div>

          {/* Progress bar */}
          {!isLocked && !challenge.completed && pct !== null && target > 1 && (
            <div className="pt-2 -mb-[6px] border-t border-gray-700/50">
              <div className="flex justify-between text-xs text-gray-500 -mt-1 mb-1">
                <span>Progress</span>
                <span>{typeof progress === 'number' ? Math.floor(progress * 10) / 10 : progress} / {target}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {/* Completed / Not completed row — hidden when progress bar is visible */}
          {!(pct !== null && target > 1 && !challenge.completed && !isLocked) && (
            <div className="pt-2 border-t border-gray-700/50 flex items-center gap-2 text-xs font-bold">
              {challenge.completed ? (
                <>
                  <span className="text-green-400">✓</span>
                  <span className="text-green-400">Completed</span>
                  {challenge.completedAt && (
                    <span className="text-gray-500 font-normal ml-auto">
                      {new Date(challenge.completedAt).toLocaleDateString("en-GB")}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-500 font-normal">Not completed</span>
              )}
            </div>
          )}
        </div>

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 rounded-xl">
            <div className="text-center">
              <div className="flex flex-row items-center justify-center">
                <FaLock className="mr-2 text-yellow-400" size={16} />
                <p className="text-yellow-400 text-sm font-bold">Premium</p>
              </div>
              <p className="text-gray-300 text-xs mt-1">Upgrade to access</p>
            </div>
          </div>
        )}
      </div>
      <LP
        lineup={challenge.lineup}
        show={showImage}
        onClose={() => setShowImage(false)}
        modalImageIndex={modalImageIndex}
        setModalImageIndex={setModalImageIndex}
      />
    </>
  );
}

export default function CS({ showNotification }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState(() => {
    const cached = sessionStorage.getItem('activeChallenges');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(() => {
    return !sessionStorage.getItem('activeChallenges');
  });
  const onboardingToShow = challenges.filter(c => c.cadence === "onboarding" && !c.completed).slice(0, 1);
  const dailyToShow = challenges.filter(c => c.cadence === "daily" && !c.isPremium).slice(0, 1);
  const weeklyToShow = challenges.filter(c => c.cadence === "weekly" && !c.isPremium).slice(0, 1);
  const monthlyToShow = challenges.filter(c => c.cadence === "monthly" && !c.isPremium).slice(0, 1);
  const premiumToShow = challenges.filter(c => c.isPremium).slice(0, 1);

  const toShow = [
    ...onboardingToShow,
    ...dailyToShow,
    ...weeklyToShow,
    ...monthlyToShow,
    ...premiumToShow,
  ].slice(0, 4);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/challenges`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch challenges");
        const data = await res.json();
        const challengeData = data.challenges || [];
        setChallenges(challengeData);
        sessionStorage.setItem('activeChallenges', JSON.stringify(challengeData));
      } catch (e) {
        showNotification?.("Failed to load challenges", "error");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const isPremiumUser = user?.paymentTier === "Supporter";

  if (loading) return (
    <div className="max-w-[110rem] mx-auto px-4 py-8">
      <div className="text-gray-500 text-sm">Loading challenges...</div>
    </div>
  );

  if (!challenges.length) return null;

  return (
    <div className="max-w-[99rem] mx-auto px-5 xs:px-10 -mt-10 mb-30 lg:mb-0 sm:mt-0 lg:mt-10 font-mono">
      <div className="flex flex-col xs:flex-row items-center justify-between mb-4">
        <h2 className="text-white text-center lg:text-left font-bold text-lg">Active Challenges</h2>
        <button
          onClick={() => navigate("/challenges")}
          className="relative z-10 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          All challenges →
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {toShow.map(c => (
          <ChallengeCard
            key={c._id}
            challenge={c}
            isPremiumUser={isPremiumUser}
            navigate={navigate}
          />
        ))}
      </div>

      {/* CTA strip */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-800/50 border border-gray-700/40 rounded-xl px-5 py-3">
        <div className="flex items-start gap-3">
          <TbTargetArrow size={20} className="mt-2 shrink-0" />
          <div className="sm:flex sm:flex-col gap-2 sm:gap-0 ">
            <p className="text-white text-sm font-bold">Complete challenges and earn rewards</p>
            <p className="text-gray-400 text-xs">Upload your match demos to track lineups and complete challenges</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/matches")}
          className="shrink-0 px-4 py-2 bg-blue-600/30 hover:bg-blue-500/30 border border-blue-600/40 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          Upload demo →
        </button>
      </div>
    </div>
  );
}