import { useEffect, useState } from "react";
import { useNotification } from '../C/noti';
import { FiCheckCircle, FiTarget, FiStar } from "react-icons/fi";
import { FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import F from '../C/F';
import ST from '../C/ST';
import LP from '../C/LP';
import { useContext } from "react";
import { useTheme } from '../C/TC';
import AuthContext from "../C/AC";

export default function Matches() {
  const { user, paymentInfo } = useContext(AuthContext);
  const { theme } = useTheme();
  const dailyStreak = user?.dailyStreak || 0;

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [faceitNickname, setFaceitNickname] = useState(null);
  const [faceitLevel, setFaceitLevel] = useState(null);
  const [parsingId, setParsingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showNotification, NotificationComponent } = useNotification();

  const [loadingMore, setLoadingMore] = useState(false);
  const [matchSkip, setMatchSkip] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const MATCH_LIMIT = 10;
  const navigate = useNavigate();

  const dailyStart = challenges.find(c => c.cadence === 'daily' && !c.completed)?.startsAt;
  const weeklyStart = challenges.find(c => c.cadence === 'weekly' && !c.completed)?.startsAt;
  const monthlyStart = challenges.find(c => c.cadence === 'monthly' && !c.completed)?.startsAt;

  function getEligibility(playedAt) {
    if (!playedAt) return [];
    const played = new Date(playedAt);
    const eligible = [];
    if (dailyStart && played >= new Date(dailyStart)) eligible.push('daily');
    if (weeklyStart && played >= new Date(weeklyStart)) eligible.push('weekly');
    if (monthlyStart && played >= new Date(monthlyStart)) eligible.push('monthly');
    return eligible;
  }

  const uploadToS3 = (url, file) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) resolve();
        else reject(new Error("Upload failed"));
      });
      xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.send(file);
    });
  };

  const fetchMatches = async (skip = 0, replace = true) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/matches?limit=${MATCH_LIMIT}&skip=${skip}`,
      { credentials: "include" }
    );
    if (!res.ok) throw new Error("Failed to fetch matches");
    const data = await res.json();
    setTotalMatches(data.total || 0);
    if (replace) {
      setMatches(data.matches || []);
    } else {
      setMatches(prev => [...prev, ...(data.matches || [])]);
    }
  };

  const connectFaceit = async () => {
    setError("");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faceit-connect`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Failed to connect FACEIT");
    setFaceitNickname(data.nickname);
    setFaceitLevel(data.faceitLevel || null);

    // Auto-sync after connecting
    setSyncing(true);
    try {
      const syncRes = await fetch(`${import.meta.env.VITE_API_URL}/api/faceit-sync`, {
        method: "POST",
        credentials: "include",
      });
      const syncData = await syncRes.json();
      if (syncRes.ok && syncData.imported > 0) {
        showNotification(`${syncData.imported} new ${syncData.imported === 1 ? "match" : "matches"} imported`, "success");
        await fetchMatches();
        if (syncData.partial) {
          setTimeout(async () => {
            await fetchMatches();
          }, 8000);
        }
      }
    } catch {
      // fail silently
    } finally {
      setSyncing(false);
    }
  };

  const disconnectFaceit = async () => {
    setError("");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faceit-disconnect`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return setError("Failed to disconnect FACEIT");
    setFaceitNickname(null);
    setFaceitLevel(null);
  };

  const parseLocalDemo = async (file, matchId) => {
    if (!file) return;
    setParsingId(matchId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faceit-demo-upload-url`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, filename: file.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || "Failed to get upload URL", "error");
        setParsingId(null);
        return;
      }

      // upload directly to S3
      await uploadToS3(data.url, file);

      showNotification("Demo uploaded, parsing in progress...", "success");

      // poll for status
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/faceit-parse-status/${matchId}`,
            { credentials: "include" }
          );
          const statusData = await statusRes.json();
          if (statusData.parseStatus === "done") {
            clearInterval(poll);
            showNotification("Demo parsed successfully!", "success");
            setParsingId(null);
            setUploadProgress(0);
            await fetchMatches();
          } else if (statusData.parseStatus === "failed") {
            clearInterval(poll);
            showNotification("Demo parsing failed", "error");
            setParsingId(null);
            setUploadProgress(0);
          }
        } catch {
          clearInterval(poll);
          setParsingId(null);
        }
      }, 3000);

    } catch (e) {
      showNotification(e.message || "Failed to parse demo", "error");
      setParsingId(null);
      setUploadProgress(0);
    }
  };

  function ChallengeRow({ c }) {
    const [showImage, setShowImage] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const isOnboarding = c.cadence === "onboarding";
    const isPremiumLocked = c.isPremium && !hasPremiumChallenges;
    const isPrereqLocked = c.requiresAllSlots?.length > 0 &&
      !c.requiresAllSlots.every(s => completedOnboardingSlots.has(s));
    const isLocked = isPremiumLocked || isPrereqLocked;

    const XP = { daily: { easy: 200, medium: 300, hard: 500 }, weekly: { easy: 1150, medium: 1350, hard: 2250 }, monthly: { easy: 4000, medium: 6000, hard: 10000 }, premium_weekly: { easy: 2300, medium: 2700, hard: 4500 }, premium_monthly: { easy: 8000, medium: 12000, hard: 20000 }, onboarding: { easy: 100, medium: 300, hard: 10000 } };
    const xp = XP[c.cadence]?.[c.difficulty] || 0;

    const topBandColor =
      isOnboarding ? "bg-teal-900/60" :
      c.isPremium ? "bg-yellow-900/50" :
      c.difficulty === "easy" ? "bg-green-900/50" :
      c.difficulty === "medium" ? "bg-yellow-900/50" :
      "bg-red-900/50";

    const borderColor =
      c.completed ? "border-green-500/50 shadow-[0_0_12px_2px_rgba(74,222,128,0.15)]" :
      isOnboarding ? "border-teal-700/40" :
      c.isPremium ? "border-yellow-700/40" :
      c.difficulty === "easy" ? "border-green-700/40" :
      c.difficulty === "medium" ? "border-yellow-700/40" :
      "border-red-700/40";

    const labelColor =
      isOnboarding ? "text-teal-400" :
      c.isPremium ? "text-yellow-400" :
      c.difficulty === "easy" ? "text-green-400" :
      c.difficulty === "medium" ? "text-yellow-400" :
      "text-red-400";

    const cadenceLabel =
      isOnboarding ? "Beginner" :
      c.isPremium ? "★ Premium" :
      c.cadence.charAt(0).toUpperCase() + c.cadence.slice(1);

    return (
      <>
        <div className={`relative rounded-xl border overflow-hidden flex flex-col ${borderColor}`}>
          {/* Top band */}
          <div className={`${topBandColor} px-3 pt-2 pb-2 border-b border-gray-700/50`}>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-xs font-bold ${labelColor}`}>{cadenceLabel}</span>
              </div>
              <span className={`text-[10px] font-bold shrink-0 ${labelColor}`}>+{xp.toLocaleString()} XP</span>
            </div>
          </div>

          {/* Body */}
          <div className={`flex-1 flex flex-col gap-1 p-3 pt-2 bg-gray-800/60 ${isLocked ? "opacity-50 pointer-events-none select-none" : ""}`}>
            <div className="flex items-center gap-1">
              {c.lineupCode ? (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/by-codes?codes=${c.lineupCode}`);
                      const data = await res.json();
                      const lineup = data.lineups?.[c.lineupCode];
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
                  className="text-white text-sm font-bold underline underline-offset-2 hover:text-blue-300 transition-colors text-left truncate"
                  title={c.title}
                >
                  {c.title}
                </button>
              ) : (
                <p className="text-white text-sm font-bold truncate" title={c.title}>{c.title}</p>
              )}
              {c.lineup?.src && (
                <button
                  onClick={() => { setModalImageIndex(0); setShowImage(true); }}
                  className="shrink-0 ml-1 text-gray-300 hover:text-white transition-colors"
                  title="View lineup"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-gray-400 text-xs truncate" title={c.description}>{c.description}</p>
          </div>

          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 rounded-xl">
              <div className="text-center">
                <div className="flex flex-row items-center justify-center">
                  <FaLock className="mr-2 text-yellow-400" size={16} />
                  <p className="text-yellow-400 text-sm font-bold">Premium</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <LP
          lineup={c.lineup}
          show={showImage}
          onClose={() => setShowImage(false)}
          modalImageIndex={modalImageIndex}
          setModalImageIndex={setModalImageIndex}
        />
      </>
    );
  }

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/challenges`, { credentials: "include" })
      .then(r => r.json())
      .then(data => setChallenges(data.challenges || []))
      .catch(() => {});
  }, []);

  const hasPremiumChallenges = paymentInfo?.tier === "Supporter" || false;

  const completedOnboardingSlots = new Set(
    challenges.filter(c => c.cadence === "onboarding" && c.completed).map(c => c.slot)
  );

  const challengesToShow = [
    ...challenges.filter(c => c.cadence === "daily" && !c.isPremium).slice(0, 1),
    ...challenges.filter(c => c.cadence === "weekly" && !c.isPremium).slice(0, 1),
    ...challenges.filter(c => c.cadence === "monthly" && !c.isPremium).slice(0, 1),
    ...challenges.filter(c => c.isPremium).slice(0, 1),
  ].slice(0, 4);

  const challengesToShowRow = challengesToShow.slice(0, 3);

  const canLoadMore = faceitNickname && matches.length < totalMatches;

  const loadMoreFromDB = async () => {
    setLoadingMore(true);
    try {
      const newSkip = matchSkip + MATCH_LIMIT;
      await fetchMatches(newSkip, false);
      setMatchSkip(newSkip);
    } catch (e) {
      showNotification("Failed to load more matches", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setError("");
      try {
        const [faceitRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/faceit-status`, { credentials: "include" }),
          fetchMatches(),
        ]);
        const faceitData = await faceitRes.json();
        const nickname = faceitData.nickname || null;
        setFaceitNickname(nickname);
        setFaceitLevel(faceitData.faceitLevel || null);
        setLoading(false); // show matches immediately

        // sync after matches are already visible
        if (nickname) {
          setSyncing(true);
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/faceit-sync`, {
              method: "POST",
              credentials: "include",
            });
            const data = await res.json();
            if (res.ok && data.imported > 0) {
              showNotification(`${data.imported} new ${data.imported === 1 ? "match" : "matches"} imported`, "success");
              await fetchMatches();
              const statusRes = await fetch(`${import.meta.env.VITE_API_URL}/api/faceit-status`, { credentials: "include" });
              const statusData = await statusRes.json();
              setFaceitLevel(statusData.faceitLevel || null);

              if (data.partial) {
                setTimeout(async () => {
                  await fetchMatches();
                }, 8000);
              }
            }
            if (res.ok && data.failed > 0) {
              showNotification(`${data.failed} ${data.failed === 1 ? "match" : "matches"} failed to import`, "warning");
            }
          } catch (e) {
            // fail silently
          } finally {
            setSyncing(false);
          }
        }
      } catch (e) {
        setError(e.message || "Error");
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className={`pt-22 text-white min-h-screen font-mono px-3 flex flex-col ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <NotificationComponent />
      <div className="max-w-4xl mx-auto w-full flex-grow">
        {challengesToShow.length > 0 && (
          <>
            <div className={`hidden 2xl:flex flex-col gap-2 absolute left-12 w-64 ${dailyStreak >= 7 ? 'top-20' : 'top-35'}`}>
              <span className="text-sm font-bold text-white">Active Challenges</span>
              {challengesToShow.map(c => <ChallengeRow key={c._id} c={c} />)}
              <div>
                <span className="flex mt-2 mb-2 text-white text-sm font-bold">Daily streak</span>
                <ST
                  streak={dailyStreak}
                  layout="sidebar"
                  ownedNameColors={user?.ownedNameColors || []}
                  displayName={user?.displayName || null}
                />
              </div>
              <button onClick={() => navigate("/challenges")} className="text-xs text-gray-400 hover:text-white transition-colors text-left">
                All challenges →
              </button>
            </div>

            {/* Below 2xl: inline row/single — 3 challenges */}
            <div className="2xl:hidden mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">Active Challenges</span>
                <button onClick={() => navigate("/challenges")} className="text-xs text-gray-400 hover:text-white transition-colors">
                  All →
                </button>
              </div>
              <div className="sm:hidden w-full">
                {challengesToShowRow[0] && <ChallengeRow c={challengesToShowRow[0]} />}
              </div>
              <div className="hidden sm:grid grid-cols-3 gap-2">
                {challengesToShowRow.map(c => <ChallengeRow key={c._id} c={c} />)}
              </div>
              <ST
                streak={dailyStreak}
                ownedNameColors={user?.ownedNameColors || []}
                displayName={user?.displayName || null}
              />
            </div>
          </>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Recent Matches</h1>
        <p className="text-gray-400 text-sm mb-1">Connect your FACEIT to track lineups, complete challenges and earn XP.</p>
        <p className="text-[11px] text-gray-600 mb-3">
          Matches played before the challenge start do not count towards challenges. Play and parse a match today to start completing challenges.
        </p>

        {!user ? (
          <div className="flex flex-col items-center justify-center min-h-64 sm:min-h-140 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1a1a2e] border border-white/10 flex items-center justify-center">
              <FaLock size={20} className="text-orange-400" />
            </div>
            <p className="text-white font-bold text-lg">Sign in to continue</p>
            <p className="text-gray-400 text-sm text-center max-w-xs">
              Sign in and connect your FACEIT to track lineups and earn XP.
            </p>
          </div>
        ) : (
        <>
        {/* FACEIT section */}
        <div className={`p-4 rounded-xl mb-3 ${theme === 'light' ? 'bg-gray-800' : 'bg-[#1a1a2e]'}`}>
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3">
            <div className="flex items-center gap-3">
              <div>
                <div className="font-bold">FACEIT {syncing && <span className="text-xs text-gray-500 font-normal ml-1">Syncing...</span>}</div>
                {faceitNickname ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Connected as</span>
                    <div className="flex relative items-center gap-1 top-[1px]">
                      {faceitLevel && (
                        <img
                          src={`/uploads/${faceitLevel}.svg`}
                          alt={`Level ${faceitLevel}`}
                          className="w-5 h-5"
                        />
                      )}
                      <span className="text-orange-400 text-sm ml-[2px]">{faceitNickname}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">Connect your FACEIT account to see your matches.</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {faceitNickname ? (
                <button onClick={disconnectFaceit} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300">
                  Disconnect
                </button>
              ) : (
                <button onClick={connectFaceit} className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white">
                  Connect FACEIT
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <div className="text-red-400 mb-4">{error}</div>}
        {loading && <div className="text-gray-400">Loading...</div>}

        {!loading && faceitNickname && matches.length === 0 && !syncing && (
          <div className="text-gray-400 text-sm text-center py-8">
            No matches found yet. Only matches played after signing up are tracked — play a game on FACEIT and come back.
          </div>
        )}

        <div className="space-y-3">
          {matches.map((m) => {
            const won = m.playerScore != null && m.opponentScore != null && m.playerScore > m.opponentScore;
            const lost = m.playerScore != null && m.opponentScore != null && m.playerScore < m.opponentScore;

            return(
            <div key={m._id} className="relative rounded-xl overflow-hidden">
              {/* Map image background */}
              {m.mapImage && (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${m.mapImage})` }}
                />
              )}
              {/* Dark overlay */}
              <div className={`absolute inset-0 ${m.mapImage ? "bg-black/70" : "bg-gray-800"}`} />

              {/* Content */}
              <div className="relative p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{m.map}</span>
                    {m.playerScore != null && m.opponentScore != null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        won ? "bg-green-500/30 text-green-400 border border-green-500/40" :
                        lost ? "bg-red-500/30 text-red-400 border border-red-500/40" :
                        "bg-gray-700/50 text-gray-400 border border-gray-600/30"
                      }`}>
                        {won ? "W" : lost ? "L" : "D"}
                      </span>
                    )}
                    {m.source === "faceit" && (
                      <span className="text-xs bg-orange-600/30 border border-orange-600/40 text-white font-bold px-2 py-0.5 rounded-full">FACEIT</span>
                    )}
                  </div>
                  <div className="text-gray-300 text-sm">
                    {new Date(m.playedAt || m.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                <div className={`text-sm mt-2 ${won ? "text-green-400" : lost ? "text-red-400" : "text-gray-200"}`}>
                  Score:{" "}
                  <span className={`font-semibold ${won ? "text-green-400" : lost ? "text-red-400" : "text-white"}`}>
                    {m.playerScore}
                  </span>
                  <span className="text-gray-400"> - </span>
                  <span className={`font-semibold ${lost ? "text-green-400" : won ? "text-red-400" : "text-white"}`}>
                    {m.opponentScore}
                  </span>
                </div>

                {m.source === "faceit" && !m.demosParsed && (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      <div className="flex flex-wrap gap-2 items-center">
                        <a
                          href={`https://www.faceit.com/en/cs2/room/${m.faceitMatchId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs bg-orange-600/30 hover:bg-orange-500/30 border border-orange-600/40 text-white rounded-lg font-semibold transition-colors duration-150"
                        >
                          View on FACEIT
                        </a>
                        <label className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer text-white transition-colors duration-150 ${parsingId === m._id ? "bg-gray-700 cursor-not-allowed opacity-60" : "bg-blue-600/40 hover:bg-blue-600/50 border border-blue-600 font-semibold"}`}>
                          {parsingId === m._id ? (
                            uploadProgress > 0 && uploadProgress < 100 
                              ? `Uploading ${uploadProgress}%` 
                              : "Parsing..."
                          ) : "Upload & parse demo"}
                          <input
                            type="file"
                            accept=".dem,.zst"
                            className="hidden"
                            disabled={parsingId === m._id}
                            onChange={(e) => parseLocalDemo(e.target.files?.[0], m._id)}
                          />
                        </label>
                      </div>
                      {(() => {
                        const eligible = getEligibility(m.playedAt);
                        if (eligible.length > 0) {
                          return (
                            <span className="text-[10px] text-green-400 bg-green-900/30 border border-green-700/30 px-2 py-0.5 rounded-full">
                              ✓ Counts toward {eligible.join(', ')} challenges if parsed
                            </span>
                          );
                        }
                        return (
                          <span className="text-[10px] text-gray-500 bg-gray-800/50 border border-gray-700/30 px-2 py-0.5 rounded-full" title="This match was played before the current challenge period started">
                            Will not count towards active challenges
                          </span>
                        );
                      })()}
                    </div>
                    {parsingId === m._id && uploadProgress < 100 && uploadProgress > 0 && (
                      <p className="text-xs text-yellow-500">
                        ⚠ Do not leave this page while uploading.
                      </p>
                    )}
                    {parsingId === m._id && uploadProgress === 100 && (
                      <p className="text-xs text-gray-500">
                        Upload complete — you can now leave this page safely.
                      </p>
                    )}
                  </div>
                )}
                {m.source === "faceit" && m.demosParsed && (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {/* Demo parsed */}
                      <div className="group relative">
                        <div className="w-7 h-7 rounded-md bg-green-900/40 border border-green-700/40 flex items-center justify-center text-green-400">
                          <FiCheckCircle size={14} />
                        </div>
                        <div className="absolute bottom-full left-0 mb-1.5 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          Demo parsed
                        </div>
                      </div>

                      {/* Lineup matches */}
                      {m.throws?.length > 0 && (
                        <div className="group relative">
                          <div className="w-7 h-7 rounded-md bg-blue-900/40 border border-blue-700/40 flex items-center justify-center text-blue-400">
                            <FiTarget size={14} />
                          </div>
                          <div className="absolute bottom-full left-1/4 -translate-x-1/4 mb-1.5 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {m.throws.length} lineup {m.throws.length === 1 ? "match" : "matches"} found
                          </div>
                        </div>
                      )}

                      {/* No matches */}
                      {m.throws?.length === 0 && (
                        <div className="group relative">
                          <div className="w-7 h-7 rounded-md bg-gray-700/40 border border-gray-600/40 flex items-center justify-center text-gray-500">
                            <FiTarget size={14} />
                          </div>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            No lineup matches yet
                          </div>
                        </div>
                      )}

                      {/* Challenge completed — you'd need to pass this data */}
                      {m.challengeCompleted && (
                        <div className="group relative">
                          <div className="w-7 h-7 rounded-md bg-yellow-900/40 border border-yellow-700/40 flex items-center justify-center text-yellow-400">
                            <FiStar size={14} />
                          </div>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Challenge completed
                          </div>
                        </div>
                      )}
                    </div>

                    {m.throws?.length > 0 && (
                      <button
                        onClick={() => navigate(`/matches/${m._id}`)}
                        className="text-xs bg-blue-600/30 cursor-pointer hover:bg-blue-500/30 border border-blue-600/40 text-white px-3 py-1.5 rounded-lg font-semibold transition-all ml-4 shrink-0"
                      >
                        Match details →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
        {canLoadMore && (
          <button
            onClick={loadMoreFromDB}
            disabled={loadingMore}
            className="w-full mt-3 py-2.5 text-xs text-gray-400 hover:text-white border border-gray-700/40 hover:border-gray-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? "Loading..." : "Load more matches"}
          </button>
        )}
        {!canLoadMore && faceitNickname && matches.length > 0 && (
          <div className="text-center mt-3 py-2">
            <p className="text-xs text-gray-600">You've reached the end</p>
            {totalMatches < 30 && (
              <p className="text-xs text-gray-700 mt-1">Only matches played after signing up are shown — play more games to fill your history.</p>
            )}
          </div>
        )}
        </>
      )}
      </div>
      <F/>
    </div>
  );
}