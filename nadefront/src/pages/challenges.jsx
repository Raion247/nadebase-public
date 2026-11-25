import { useEffect, useState } from "react";
import { useContext } from "react";
import AuthContext from "../C/AC";
import ST from '../C/ST';
import LP from '../C/LP';
import F from '../C/F';
import { useTheme } from '../C/TC';
import { FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getNameStyle, NAME_COLORS } from '../C/UC';

const CADENCE_LABELS = {
  onboarding: "Beginner",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  premium_weekly: "Weekly",
  premium_monthly: "Monthly",
};

const DIFFICULTY_CARD_COLORS = {
  easy: "border-green-700/40 bg-green-900/10",
  medium: "border-yellow-700/40 bg-yellow-900/10",
  hard: "border-red-700/40 bg-red-900/10",
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

const PREMIUM_CARD_COLOR = "border-yellow-700/40 bg-yellow-900/10";
const PREMIUM_LABEL_COLOR = "text-yellow-400";

const XP_REWARDS = {
  onboarding: { easy: 100, medium: 300, hard: 10000 },
  daily: { easy: 200, medium: 300, hard: 500 },
  weekly: { easy: 1150, medium: 1350, hard: 2250 },
  monthly: { easy: 4000, medium: 6000, hard: 10000 },
  premium_weekly: { easy: 2300, medium: 2700, hard: 4500 },
  premium_monthly: { easy: 8000, medium: 12000, hard: 20000 },
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

function ChallengeCard({ challenge, isPremiumUser, allChallenges = [] }) {
  const completedSlots = new Set(
    allChallenges
      .filter(c => c.cadence === "onboarding" && c.completed)
      .map(c => c.slot)
  );
  const prereqsRequired = challenge.requiresAllSlots?.length > 0;
  const prereqsMet = !prereqsRequired ||
    challenge.requiresAllSlots.every(s => completedSlots.has(s));
  const isPrereqLocked = prereqsRequired && !prereqsMet;
  const [showImage, setShowImage] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const navigate = useNavigate();
  const timeLeft = useCountdown(challenge.endsAt);
  const isLocked = challenge.isPremium && !isPremiumUser;
  const progress = challenge.progress || 0;
  const target = challenge.statTarget || 1;
  const xpReward = XP_REWARDS[challenge.cadence]?.[challenge.difficulty] || 0;
  const pct = challenge.type === "stat" && challenge.statScope === "cumulative"
    ? Math.min(100, Math.round((progress / target) * 100))
    : null;

  // Top band color by cadence/premium/difficulty
  const topBandColor =
    challenge.cadence === "onboarding" ? "bg-teal-900/60" :
    challenge.isPremium ? "bg-yellow-900/50" :
    challenge.difficulty === "easy" ? "bg-green-900/50" :
    challenge.difficulty === "medium" ? "bg-yellow-900/50" :
    "bg-red-900/50";

  // Border color (mirrors UMD's isChallenge glow pattern for completed, normal otherwise)
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
    challenge.isPremium ? "text-yellow-400" :
    DIFFICULTY_LABEL_COLORS[challenge.difficulty];

  return (
    <>
      <div className={`relative rounded-xl border overflow-hidden flex flex-col transition-all ${borderColor}`}>

        {/* Top band — mirrors UMD's image/color header */}
        <div className={`${topBandColor} px-4 pt-4 pb-3 border-b border-gray-700/50`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
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
            </div>

            <div className="flex -mt-[1px] items-center gap-2 shrink-0">
              {challenge.cadence !== "onboarding" && (
                <span className="text-gray-500 text-xs">{timeLeft}</span>
              )}
            </div>
          </div>
        </div>

        {/* Body — inset shadow like UMD's flipped CompletionCard front */}
        <div
          className={`flex-1 flex flex-col gap-2 p-4 bg-gray-800/60 inset-shadow-xs inset-shadow-black ${
            isLocked ? "opacity-50 pointer-events-none select-none" : ""
          }`}
        >
          {/* Title + description */}
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
            <p className={`text-gray-400 text-xs mt-1 ${!challenge.nameColorReward || challenge.completed ? 'mb-3' : ''}`}>{challenge.description}</p>

            {/* Name color reward */}
            {challenge.nameColorReward && !challenge.completed && (() => {
              const nameStyle = getNameStyle(challenge.nameColorReward);
              const colorEntry = NAME_COLORS.find(c => c.id === challenge.nameColorReward);
              return (
                <p className="text-xs text-gray-400 mt-2">
                  Name Color Reward:{" "}
                  <span
                    className={`font-bold capitalize ${nameStyle.className || ''}`}
                    style={nameStyle.className ? undefined : { color: nameStyle.color }}
                  >
                    {colorEntry?.label || challenge.nameColorReward}
                  </span>
                </p>
              );
            })()}
          </div>

          {/* Progress bar */}
          {!isLocked && !isPrereqLocked && !challenge.completed && pct !== null && target > 1 && (
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

          {/* Completed row */}
          {!(pct !== null && target > 1 && !challenge.completed && !isLocked && !isPrereqLocked) && (
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

        {/* Lock overlays */}
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

        {isPrereqLocked && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 rounded-xl">
            <div className="text-center px-3">
              <div className="flex flex-row items-center justify-center">
                <FaLock className="mr-2 text-teal-400" size={16} />
                <p className="text-teal-400 text-sm font-bold">Locked</p>
              </div>
              <p className="text-gray-300 text-xs mt-1">Complete all beginner challenges</p>
            </div>
          </div>
        )}
      </div>

      {/* Image modal — unchanged */}
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

export default function Challenges() {
  const { user, paymentInfo } = useContext(AuthContext);
  const { theme } = useTheme();
  const [challenges, setChallenges] = useState([]);
  const hasPremiumChallenges = paymentInfo?.tier === "Supporter" || false;
  const [loading, setLoading] = useState(true);
  const completedIds = new Set(
    challenges?.filter(c => c.completed).map(c => c._id) || []
  );
  const dailyStreak = user?.dailyStreak || 0;

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/challenges`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setChallenges(data.challenges || []);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const onboardingChallenges = challenges.filter(c => c.cadence === "onboarding");
  const freeChallenges = challenges.filter(c => !c.isPremium && c.cadence !== "onboarding");
  const premiumChallenges = challenges.filter(c => c.isPremium);

  return (
    <div className={`flex flex-col pt-22 min-h-screen text-white font-mono px-4 ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <Helmet>
        <title>Challenges — Nadebase</title>
      </Helmet>
      <div className="max-w-7xl mx-auto w-full flex-grow pb-6">
        <h1 className="text-2xl font-bold mb-5">Challenges</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-8 p-4 border border-white/10 bg-gray-800/60 rounded-xl">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-orange-400 text-sm font-bold">1</span>
            </div>
            <div>
              <p className="text-white text-xs font-bold mb-0.5">Connect FACEIT</p>
              <p className="text-gray-400 text-xs">Link your FACEIT account on the matches page to import your recent games.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-orange-400 text-sm font-bold">2</span>
            </div>
            <div>
              <p className="text-white text-xs font-bold mb-0.5">Upload your demo</p>
              <p className="text-gray-400 text-xs">Download your match demo from FACEIT and upload it on the matches page to parse it.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-orange-400 text-sm font-bold">3</span>
            </div>
            <div>
              <p className="text-white text-xs font-bold mb-0.5">Complete challenges</p>
              <p className="text-gray-400 text-xs">Challenges are tracked automatically from your parsed demos. Only FACEIT matches count.</p>
            </div>
          </div>
        </div>

        {loading && <div className="text-gray-500 text-sm">Loading challenges...</div>}

        <div className="mb-5 w-full">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-4">
            {/* Explanation */}
            <div className="flex flex-col h-fit gap-2 border border-white/10 bg-gray-800/60 rounded-xl px-5 py-4 w-full max-w-2xl mx-auto lg:mx-0 lg:w-124 shrink-0">
              <span className="text-xl font-bold text-white">Daily Streak</span>
              <p className="text-sm text-gray-400 font-bold leading-relaxed">
                Complete a challenge every day to build your streak. Increased <span className="text-orange-400">XP bonus</span> for each day you continue the streak. Earn a <span className="text-orange-400">name color reward</span> at the end of the streak week!
              </p>
            </div>

            {/* Streak tabs */}
            <div className="flex-1">
              <ST
                streak={dailyStreak}
                ownedNameColors={user?.ownedNameColors || []}
                displayName={user?.displayName || null}
                layout="page"
              />
            </div>
          </div>
        </div>

        {!loading && freeChallenges.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4 text-white">Basic Challenges</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {freeChallenges.map(c => (
                <ChallengeCard key={c._id} challenge={c} isPremiumUser={hasPremiumChallenges} />
              ))}
            </div>
          </div>
        )}

        {!loading && premiumChallenges.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4 text-yellow-400">★ Premium Challenges</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {premiumChallenges.map(c => (
                <ChallengeCard key={c._id} challenge={c} isPremiumUser={hasPremiumChallenges} />
              ))}
            </div>
          </div>
        )}

        {!loading && onboardingChallenges.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-teal-400">Getting Started</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {onboardingChallenges.map(c => (
                <ChallengeCard 
                  key={c._id} 
                  challenge={c} 
                  isPremiumUser={hasPremiumChallenges}
                  allChallenges={challenges}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && challenges.length === 0 && (
          <div className="text-gray-500 text-sm">No active challenges right now.</div>
        )}

      </div>
      <F />
    </div>
  );
}