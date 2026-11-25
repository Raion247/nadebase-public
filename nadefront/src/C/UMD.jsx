import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from '../C/TC';
import MT from '../C/MT';

const NADE_LABELS = {
  smoke: "Smoke",
  flash: "Flash",
  he: "HE Grenade",
  molotov: "Molotov",
};

const NADE_COLORS = {
  smoke: "bg-gray-600",
  flash: "bg-yellow-600",
  he: "bg-red-700",
  molotov: "bg-orange-600",
};

function AccuracyBar({ accuracy }) {
  const color =
    accuracy >= 80 ? "bg-green-500" :
    accuracy >= 50 ? "bg-yellow-500" :
    "bg-red-500";

  const label =
    accuracy >= 80 ? "text-green-400" :
    accuracy >= 50 ? "text-yellow-400" :
    "text-red-400";

  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-gray-500">Accuracy</span>
      <div className="flex flex-row items-center gap-1 mt-[1px]">
        <div className="flex-1 bg-gray-700 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${accuracy}%` }} />
        </div>
        <span className={`text-xs font-bold w-8 text-right ${label}`}>{accuracy}%</span>
      </div>
    </div>
  );
}

function StatBox({ label, value, color = "text-white" }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3 text-center">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function killColor(kills) {
  if (kills >= 2) return "text-green-400";
  if (kills === 1) return "text-yellow-400";
  return "text-red-400";
}

function flashColor(flashes) {
  if (flashes >= 15) return "text-green-400";
  if (flashes >= 8) return "text-yellow-400";
  return "text-red-400";
}

function flashSuccessColor(successful, total) {
  if (!total) return "text-gray-400";
  const pct = successful / total;
  return pct >= 0.7 ? "text-green-400" : pct >= 0.5 ? "text-yellow-400" : "text-red-400";
}

function damageColor(damage) {
  if (damage >= 200) return "text-green-400";
  if (damage >= 100) return "text-yellow-400";
  return "text-red-400";
}

function ThrowCard({ t, lineup, allTimeStats, isChallenge }) {
  return (
    <div className={`bg-gray-800/60 border rounded-xl flex flex-col transition-all ${
      isChallenge
        ? "border-yellow-400/70 shadow-[0_0_12px_2px_rgba(250,204,21,0.25)]"
        : "border-gray-700/50"
    }`}>
      {(lineup?.src2 || lineup?.src) && (
        <img
          src={`${import.meta.env.VITE_API_URL}/api/i?key=${lineup.src2 || lineup.src}`}
          alt={lineup.title}
          className="w-full aspect-square object-cover border-b border-gray-700/50 rounded-t-xl overflow-hidden"
        />
      )}
      <div className="p-3 flex-1 flex flex-col gap-2 rounded-b-xl overflow-hidden">
        <div>
          <p className={`text-sm font-bold truncate ${ isChallenge ? 'text-yellow-400' : 'text-white' }`}>{lineup?.title || t.lineupCode}</p>
          <p className="text-gray-400 text-xs">
            {lineup?.map} · {lineup?.side} side
          </p>
        </div>

        {t.accuracy != null && <AccuracyBar accuracy={t.accuracy} />}

        <div className="flex flex-wrap gap-1.5">
          {t.enemiesFlashed > 0 && (
            <span className="-mt-1 text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">
              {t.enemiesFlashed} flashed
            </span>
          )}
          {t.enemyDamage > 0 && (
            <span className="-mt-1 text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full">
              {t.enemyDamage} dmg
            </span>
          )}
          {t.enemyKills > 0 && (
            <span className="-mt-1 text-xs bg-orange-900/50 text-orange-300 px-2 py-0.5 rounded-full">
              {t.enemyKills} kill{t.enemyKills > 1 ? "s" : ""}
            </span>
          )}
          {t.enemyVictims > 0 && (
            <span className="-mt-1 text-xs bg-gray-700/80 text-gray-300 px-2 py-0.5 rounded-full">
              {t.enemyVictims} hit
            </span>
          )}
          {t.noZoneLabel && (
            <span className="-mt-1 text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">
              {t.noZoneLabel}
            </span>
          )}
        </div>

        {allTimeStats && (
          <div className="mt-auto pt-2 border-t border-gray-700/50 flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <p className="text-gray-500">
                {t.type === 'flash' ? 'Avg blind' : t.type === 'smoke' ? 'Avg accuracy' : 'Avg damage'}
              </p>
              <div className="flex items-center">
                <p className={`font-bold ${
                  allTimeStats.throwCount >= 1
                    ? allTimeStats.trend === 'up' ? 'text-green-400'
                    : allTimeStats.trend === 'down' ? 'text-red-400'
                    : 'text-gray-300'
                    : 'text-gray-300'
                }`}>
                  {t.type === 'flash'
                    ? allTimeStats.avgFlashDuration != null ? `${allTimeStats.avgFlashDuration}s` : '—'
                    : t.type === 'smoke'
                    ? allTimeStats.avgAccuracy != null ? `${allTimeStats.avgAccuracy}%` : '—'
                    : allTimeStats.avgDamage != null ? `${allTimeStats.avgDamage}` : '—'
                  }
                </p>
                {allTimeStats.throwCount >= 2 && (
                  <span className={`ml-1 text-base font-bold ${
                    allTimeStats.trend === 'up' ? 'text-green-400' :
                    allTimeStats.trend === 'down' ? 'text-red-400' :
                    'text-gray-500'
                  }`}>
                    {allTimeStats.trend === 'up' ? '↑' : allTimeStats.trend === 'down' ? '↓' : '→'}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Thrown</p>
              <p className="text-gray-300 font-bold">{allTimeStats.throwCount}×</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompletionCard({ c, index }) {
  const [flipped, setFlipped] = useState(false);
  const [shine, setShine] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFlipped(true);

      const shineTimer = setTimeout(() => {
        setShine(true);

        setTimeout(() => setShine(false), 700);
      }, 150);

    }, 500 + index * 300);

    return () => clearTimeout(timer);
  }, [index]);

  const challenge = c.challengeId || c.challengeSnapshot;
  if (!challenge) return null;

  return (
    <div className="h-36" style={{ perspective: '1000px' }}>
      <div
        className="relative w-full h-full rounded-xl border-[1.5px] border-yellow-500/50 transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
        }}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-10">
          <div
            className={`absolute inset-0 ${shine ? 'opacity-100' : 'opacity-0'}`}
          >
            <div
              className={`absolute top-0 left-[-60%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] transition-all duration-1000 ${
                shine ? 'translate-x-[360%]' : ''
              }`}
            />
          </div>
        </div>
        <div className={`flex justify-center items-center h-12 rounded-t-xl inset-0 top-12 transition-colors duration-300 delay-150 ${ flipped ? 'bg-yellow-500/30' : ''}`}>
          <p className={`text-yellow-300 text-md font-bold truncate transition-opacity duration-150 ${flipped ? 'opacity-100 delay-400' : 'opacity-0 delay-0'}`}>
            {challenge.title}
          </p>
        </div>
        {/* Front — challenge info */}
        <div
          className="absolute bg-yellow-600/10 inset-0 top-12 p-3 flex flex-col justify-between overflow-hidden inset-shadow-xs inset-shadow-black"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex flex-col text-center items-center gap-5">
            <p className="text-gray-300 text-[14px] line-clamp-2">{challenge.description}</p>
          </div>
          <div className="flex text-xs text-gray-500 border-t border-gray-600 pt-[7px] mb-0">
            {c.evidence?.accuracy != null && (
              <span>Accuracy: <span className="text-green-400 font-bold">{c.evidence.accuracy}%</span></span>
            )}
            {c.xpAwarded > 0 && (
              <span className={`text-yellow-500 font-bold ${ c.evidence?.accuracy != null ? 'ml-auto' : 'mx-auto' } `}>
                +{c.xpAwarded.toLocaleString()} XP
              </span>
            )}
          </div>
        </div>

        {/* Back — star */}
        <div
          className="absolute inset-0 bg-yellow-600/10 rounded-xl flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-yellow-400 text-5xl">★</span>
        </div>
      </div>
    </div>
  );
}

export default function UMD() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [match, setMatch] = useState(null);
  const [lineups, setLineups] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [completions, setCompletions] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/${matchId}`, {
          credentials: "include",
        });
        if (!res.ok) return navigate("/matches");
        const data = await res.json();
        const m = data.match;
        setMatch(m);

        const codes = [...new Set((m.throws || []).map(t => t.lineupCode).filter(Boolean))];

        const completionRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/challenges/completions?matchId=${matchId}`,
          { credentials: "include" }
        );
        const completionData = await completionRes.json();
        setCompletions(completionData.completions || []);

        if (codes.length > 0) {
          const [lineupRes, statsRes] = await Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/api/by-codes?codes=${codes.join(",")}`, { credentials: "include" }),
            fetch(`${import.meta.env.VITE_API_URL}/api/lineup-stats/batch`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ codes }),
            }),
          ]);

          const lineupData = await lineupRes.json();
          const statsData = await statsRes.json();
          setLineups(lineupData.lineups || {});
          setStats(statsData.stats || {});
        }
      } catch (e) {
        navigate("/matches");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [matchId]);

  if (loading) return (
    <div className={`pt-18 sm:pt-25 text-white min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <div className="text-gray-400">Loading...</div>
    </div>
  );

  if (!match) return null;

  const won = match.playerScore != null && match.opponentScore != null && match.playerScore > match.opponentScore;
  const lost = match.playerScore != null && match.opponentScore != null && match.playerScore < match.opponentScore;

  const throwsByRound = (match.throws || []).reduce((acc, t) => {
    const round = t.round ?? 0;
    if (!acc[round]) acc[round] = [];
    acc[round].push(t);
    return acc;
  }, {});

  const sortedRounds = Object.keys(throwsByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const totalThrown = match.counts?.total || 0;
  const totalMatched = match.throws?.length || 0;
  const untracked = totalThrown - totalMatched;

  const avgAccuracy = totalMatched > 0
    ? Math.round(match.throws.reduce((sum, t) => sum + (t.accuracy || 0), 0) / totalMatched)
    : null;

  const hasUtilityStats = match.totalUtilityDamage > 0 || match.totalUtilityKills > 0 || match.totalEnemiesFlashed > 0;

  return (
    <div className={`pt-18 sm:pt-25 text-white min-h-screen font-mono px-3 pb-12 ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <div className="max-w-5xl mx-auto">

        <button
          onClick={() => navigate("/matches")}
          className="text-gray-400 hover:text-white text-sm mb-4 transition-colors cursor-pointer"
        >
          ← Back to matches
        </button>

        {/* Match header — score, win/loss, date */}
        <div className="relative rounded-2xl overflow-hidden mb-4">
          {match.mapImage && (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${match.mapImage})` }} />
          )}
          <div className={`absolute inset-0 ${match.mapImage ? "bg-black/75" : "bg-gray-800"}`} />
          <div className="relative p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{match.map}</h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  {new Date(match.playedAt || match.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 ${
                won ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                lost ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                "bg-gray-700 text-gray-400"
              }`}>
                {won ? "WIN" : lost ? "LOSS" : "DRAW"}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-gray-400 text-xs mb-1">Score</p>
                <p className="text-lg font-bold">
                  <span className={won ? "text-green-400" : lost ? "text-red-400" : "text-white"}>
                    {match.playerScore}
                  </span>
                  <span className="text-gray-500 mx-1">-</span>
                  <span className={lost ? "text-green-400" : won ? "text-red-400" : "text-white"}>
                    {match.opponentScore}
                  </span>
                </p>
              </div>

              {avgAccuracy != null && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Avg lineup accuracy</p>
                  <p className={`text-lg font-bold ${
                    avgAccuracy >= 80 ? "text-green-400" :
                    avgAccuracy >= 50 ? "text-yellow-400" : "text-red-400"
                  }`}>{avgAccuracy}%</p>
                </div>
              )}
            </div>

            {/* Nade type counts */}
            {match.counts && (
              <div className="mt-4 flex gap-4 flex-wrap">
                {["smoke", "flash", "he", "molotov"].map(type => (
                  match.counts[type] > 0 && (
                    <div key={type} className="text-xs text-gray-400">
                      <span className="text-gray-500">{NADE_LABELS[type]}: </span>
                      <span className="text-white font-bold">{match.counts[type]}</span>
                    </div>
                  )
                ))}
                {totalThrown > 0 && (
                  <div className="text-xs text-gray-400">
                    <span className="text-gray-500">Total: </span>
                    <span className="text-white font-bold">{totalThrown}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats panel — outside image */}
        <div className="mb-6 bg-gray-800/40 border border-gray-700/40 rounded-xl overflow-hidden">
          <button
            onClick={() => setStatsExpanded(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <span className="font-bold">Match stats</span>
            <span className="text-gray-500 text-xs">{statsExpanded ? "▲ Hide" : "▼ Show"}</span>
          </button>

          {statsExpanded && (
            <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatBox label="Utility thrown" value={totalThrown} />
              {totalMatched > 0 && (
                <StatBox label="Lineups tracked" value={`${totalMatched}${untracked > 0 ? ` / ${totalThrown}` : ""}`} />
              )}
              {match.totalUtilityDamage > 0 && (
                <StatBox label="Utility damage" value={match.totalUtilityDamage} color="text-red-400" />
              )}
              {match.totalUtilityKills > 0 && (
                <StatBox label="Utility kills" value={match.totalUtilityKills} color={killColor(match.totalUtilityKills)} />
              )}
              {match.totalEnemiesFlashed > 0 && (
                <StatBox label="Enemies flashed" value={match.totalEnemiesFlashed} color={flashColor(match.totalEnemiesFlashed)} />
              )}
              {match.avgFlashDuration > 0 && (
                <StatBox label="Avg flash blind" value={`${match.avgFlashDuration}s`} color="text-yellow-400" />
              )}
              {match.counts?.flash > 0 && (
                <StatBox label="Successful flashes" value={`${match.successfulFlashes} / ${match.counts.flash}`} color={flashSuccessColor(match.successfulFlashes, match.counts.flash)} />
              )}
              {avgAccuracy != null && (
                <StatBox label="Avg accuracy" value={`${avgAccuracy}%`} color={avgAccuracy >= 80 ? "text-green-400" : avgAccuracy >= 50 ? "text-yellow-400" : "text-red-400"} />
              )}
            </div>
          )}
        </div>

        {/* TIPS SECTION */}
        <MT
          match={match}
          totalThrown={totalThrown}
          totalMatched={totalMatched}
          avgAccuracy={avgAccuracy}
          navigate={navigate}
        />

        {completions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-yellow-400 mb-3">
              {completions.length === 1 ? "Challenge completed!" : `${completions.length} Challenges completed!`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {completions.map((c, index) => (
                <CompletionCard key={c._id} c={c} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Throws by round */}
        {sortedRounds.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">No lineup matches found for this match.</div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedRounds.map(round => {
              const throws = throwsByRound[round];
              return throws.map((t, i) => {
                const isChallenge = completions.some(c =>
                  c.challengeId?.type === "lineup" &&
                  c.challengeId?.lineupCode === t.lineupCode
                );
                return (
                  <div key={t.uid} className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2.5 py-1 rounded-full text-white font-bold bg-gray-700">
                        Round {round}
                      </span>
                      <span className="text-gray-500 text-xs">{throws.length} lineup{throws.length > 1 ? 's' : ''}</span>
                    </div>
                    <ThrowCard
                      t={t}
                      lineup={lineups[t.lineupCode]}
                      allTimeStats={stats[t.lineupCode]}
                      isChallenge={isChallenge}
                    />
                  </div>
                );
              });
            })}
          </div>
        )}
      </div>
    </div>
  );
}