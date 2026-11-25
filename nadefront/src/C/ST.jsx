import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaFireFlameCurved, FaChevronRight } from "react-icons/fa6";

export default function ST({ streak, layout = "row", ownedNameColors = [], displayName = null }) {
  const [showRewards, setShowRewards] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (showRewards) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showRewards]);

  const XP_PER_DAY = [50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, 275, 300];
  if (streak == null) return null;

  const showSecondRow = streak >= 7;
  const hasSunset = ownedNameColors.includes('sunset');
  const hasLava = ownedNameColors.includes('lava');
  const nameToShow = displayName || null;
  const bonus = streak === 0 ? 0 : XP_PER_DAY[Math.min(streak, 14) - 1];

  const renderDays = (startDay, endDay) =>
    Array.from({ length: endDay - startDay }, (_, i) => {
      const day = startDay + i + 1;
      const isCurrent = day === streak && streak <= endDay;
      const isPast = day < streak || streak >= endDay;

      let tabClass = "flex items-center justify-center rounded-lg border transition-all ";
      tabClass += layout === "sidebar" ? "flex-1 py-2 " : layout === "page" ? "flex-1 py-3 " : "flex-1 py-1.5 mt-2 ";

      if (isCurrent) {
        tabClass += "border-orange-500/50 bg-orange-500/10 shadow-[0_0_10px_2px_rgba(249,115,22,0.2)]";
      } else if (isPast) {
        tabClass += "border-orange-500/20 bg-orange-500/4";
      } else {
        tabClass += "border-white/10 bg-white/[0.02]";
      }

      const flameColor = isCurrent
        ? "text-orange-400 drop-shadow-[0_0_3px_rgba(249,115,22,0.6)]"
        : isPast ? "text-orange-400/50"
        : "text-gray-700";

      return (
        <div key={day} className={tabClass}>
          <FaFireFlameCurved className={`${layout === "page" ? "w-5 h-5" : "w-3.5 h-3.5"} ${flameColor}`} />
        </div>
      );
    });

  const statsRow = (
    <div className="flex gap-1.5 mt-1.5">
      <div className="flex-1 flex flex-col border border-white/10 bg-white/[0.02] rounded-lg px-2.5 py-1.5">
        <span className="text-[10px] text-gray-500 font-mono font-bold">Your Streak</span>
        <span className="inline-flex items-center text-[10px] xs:text-base font-bold text-orange-400 font-mono">
          <FaFireFlameCurved className="w-3.5 h-3.5 text-orange-400 mr-1" />{streak}
        </span>
      </div>
      <div className="flex-1 flex flex-col border border-white/10 bg-white/[0.02] rounded-lg px-2.5 py-1.5">
        <span className="text-[10px] text-gray-500 font-mono font-bold">Your Bonus</span>
        <span className="text-[10px] xs:text-base font-bold text-orange-400 font-mono">{streak === 0 ? 0 : bonus} XP</span>
      </div>
    </div>
  );

  const sunsetCallout = (
    <div className={`mt-1.5 flex items-center justify-center gap-2 border rounded-lg px-2.5 py-1.5 ${
      hasSunset || streak >= 7 ? "border-orange-500/40 bg-orange-500/8" : "border-white/10 bg-white/[0.02]"
    }`}>
      <FaFireFlameCurved className={`-ml-2 w-3 h-3 shrink-0 ${streak >= 7 ? "text-orange-400" : "text-gray-600"}`} />
      {!hasSunset && (
        <span className="text-xs font-bold font-mono">
          <span className="sunset-name">{nameToShow || 'Sunset'}</span>
          {streak < 7 && <span className="text-gray-600 font-normal ml-1.5">— day 7 reward</span>}
        </span>
      )}
    </div>
  );

  const lavaCallout = (
    <div className={`mt-1.5 flex items-center justify-center gap-2 border rounded-lg px-2.5 py-1.5 ${
      hasLava || streak >= 14 ? "border-orange-500/40 bg-orange-500/8" : "border-white/10 bg-white/[0.02]"
    }`}>
      <FaFireFlameCurved className={`w-3 h-3 shrink-0 ${streak >= 14 ? "text-orange-400" : "text-gray-600"}`} />
      {!hasLava && (
        <span className="text-xs font-bold font-mono">
          <span className="lava-name">{nameToShow || 'Lava'}</span>
          {streak < 14 && <span className="text-gray-600 font-normal ml-1.5">— day 14 reward</span>}
        </span>
      )}
    </div>
  );

  if (layout === "sidebar") {
    return (
      <div className="mb-2">
        <div className="flex gap-1.5 mb-1.5">{renderDays(0, 3)}</div>
        <div className="flex gap-1.5 mb-1.5">{renderDays(3, 6)}</div>
        {sunsetCallout}
        {showSecondRow && <div className="flex gap-1.5 mt-1.5 mb-1.5">{renderDays(6, 9)}</div>}
        {showSecondRow && <div className="flex gap-1.5 mb-1.5">{renderDays(9, 12)}</div>}
        {showSecondRow && <div className="flex gap-1.5 mb-1.5">{renderDays(12, 14)}</div>}
        {showSecondRow && lavaCallout}
        {statsRow}
      </div>
    );
  }

  if (layout === "page") {
    const isWeek2 = isMobile ? streak >= 10 : streak >= 8;
    const isTransition = isMobile ? (streak >= 7 && streak < 10) : streak === 7;
    const slotsPerRow = isMobile ? 4 : 6;

    const getWindow = () => {
    if (isWeek2) {
        if (isMobile) {
        return { start: 9, end: 13 };
        }
    return { start: 7, end: 13 };
    }
    if (isMobile) {
        if (streak <= slotsPerRow) return { start: 0, end: slotsPerRow };
        return { start: slotsPerRow - 1, end: 6 };
    }
    return { start: 0, end: 6 };
    };

    const { start, end } = getWindow();
    const showCalloutInline = !isMobile || (isWeek2 ? end >= 13 : end >= 6);

    const inlineCallout = isWeek2 ? (
      <div className={`flex-[0.4] flex items-center justify-center gap-2 border rounded-lg px-2.5 py-3 ${
        hasLava || streak >= 14 ? "border-orange-500/40 bg-orange-500/8" : "border-white/10 bg-white/[0.02]"
      }`}>
        <FaFireFlameCurved className={`w-4 h-4 shrink-0 ${streak >= 14 ? "text-orange-400" : "text-gray-600"}`} />
        {!hasLava && (
          <span className="text-xs font-bold font-mono">
            <span className="lava-name">{nameToShow || 'Lava'}</span>
          </span>
        )}
      </div>
    ) : (
      <div className={`flex-[0.4] flex items-center justify-center gap-2 border rounded-lg px-2.5 py-3 ${
        hasSunset || streak >= 7 ? "border-orange-500/40 bg-orange-500/8" : "border-white/10 bg-white/[0.02]"
      }`}>
        <FaFireFlameCurved className={`-ml-2 w-4 h-4 shrink-0 ${streak >= 7 ? "text-orange-400" : "text-gray-600"}`} />
        {!hasSunset && (
          <span className="text-xs font-bold font-mono">
            <span className="sunset-name">{nameToShow || 'Sunset'}</span>
          </span>
        )}
      </div>
    );

    return (
      <div className="mb-4">
        {/* Stats */}
        <div className="flex gap-2 max-w-sm mt-0 mb-4 lg:mt-2">
          <div className="flex-1 flex flex-col border border-white/10 bg-gray-800/60 rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] text-gray-500 font-mono font-bold">Your Streak</span>
            <span className="inline-flex items-center text-[10px] xs:text-sm font-bold text-orange-400 font-mono mt-0.5">
              <FaFireFlameCurved className="w-3 h-3 text-orange-400 mr-2" />{streak} {streak === 1 ? "Day" : "Days"}
            </span>
          </div>
          <div className="flex-1 flex flex-col border border-white/10 bg-gray-800/60 rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] text-gray-500 font-mono font-bold">Your Bonus</span>
            <span className="text-[10px] xs:text-sm font-bold text-orange-400 font-mono mt-0.5">{streak === 0 ? 0 : bonus} XP</span>
          </div>
          <button
            onClick={() => setShowRewards(true)}
            className="flex flex-col justify-center items-start border border-white/10 bg-gray-800/60 hover:bg-gray-800 hover:border-white/30 rounded-lg px-3 py-2 transition-colors"
          >
            <span className="flex gap-2 text-xs items-center text-gray-500 font-mono font-bold">
              View rewards<FaChevronRight />
            </span>
          </button>
        </div>

        {/* Single sliding row */}
        {isTransition ? (
          <div className="relative flex items-center gap-0">
            <div className="flex-[0.4] flex items-center justify-center gap-2 border rounded-lg px-2.5 py-3 border-orange-500/40 bg-orange-500/8">
              <FaFireFlameCurved className="w-4 h-4 shrink-0 text-orange-400" />
              {!hasSunset && (
                <span className="text-xs font-bold font-mono">
                  <span className="sunset-name">{nameToShow || 'Sunset'}</span>
                </span>
              )}
            </div>
            <div className="h-[1px] w-4 bg-orange-500/20 shrink-0" />
            <div className="flex items-center gap-0 flex-1">
              {renderDays(7, 7 + (slotsPerRow - 1)).flatMap((day, i, arr) =>
                i < arr.length - 1
                    ? [day, <div key={`line-t-${i}`} className="h-[1px] w-4 bg-orange-500/20 shrink-0" />]
                    : [day]
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex items-center gap-0">
            <div className="flex items-center gap-0 flex-1">
              {renderDays(start, end).flatMap((day, i, arr) =>
                i < arr.length - 1
                  ? [day, <div key={`line-${i}`} className="h-[1px] w-4 bg-orange-500/20 shrink-0" />]
                  : [day]
              )}
              {showCalloutInline && <div className="h-[1px] w-4 bg-orange-500/20 shrink-0" />}
            </div>
            {showCalloutInline && inlineCallout}
          </div>
        )}

        {showRewards && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
            onClick={() => setShowRewards(false)}
          >
            <div
              className="relative bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 font-mono"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowRewards(false)} className="absolute top-3 right-3 text-gray-500 hover:text-white text-xs px-2 py-1">✕</button>
              <h3 className="text-white font-bold text-sm mb-4">Streak Rewards</h3>
              <div className="flex flex-col gap-2">
                {[
                { day: "Day 1", xp: 50 },
                { day: "Day 2", xp: 60 },
                { day: "Day 3", xp: 70 },
                { day: "Day 4", xp: 80 },
                { day: "Day 5", xp: 90 },
                { day: "Day 6", xp: 100 },
                { day: "Day 7", xp: 125, reward: "Sunset", rewardClass: "sunset-name" },
                { day: "Day 8", xp: 150 },
                { day: "Day 9", xp: 175 },
                { day: "Day 10", xp: 200 },
                { day: "Day 11", xp: 225 },
                { day: "Day 12", xp: 250 },
                { day: "Day 13", xp: 275 },
                { day: "Day 14+", xp: 300, reward: "Lava", rewardClass: "lava-name" },
                ].map(({ day, xp, reward, rewardClass }, index) => {
                const dayNumber = index + 1;
                const isCurrent = streak >= 14 ? dayNumber === 14 : dayNumber === streak;
                const isPast = dayNumber < streak && !(streak >= 14 && dayNumber === 14);
                return (
                    <div key={day} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                    isCurrent ? "border-orange-500/50 bg-orange-500/10" :
                    isPast ? "border-orange-500/20 bg-orange-500/4" :
                    "border-white/5 bg-white/[0.02]"
                    }`}>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{day}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-orange-400 font-bold">+{xp} XP</span>
                        {reward && (
                        <span className="flex items-center gap-0.5">
                            <span className="text-xs text-orange-400 font-bold">+</span>
                            <span className={`ml-2 text-xs font-bold ${rewardClass}`}>{reward}</span>
                        </span>
                        )}
                    </div>
                    </div>
                );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex gap-1.5 mb-1.5">{renderDays(0, 6)}</div>
      {sunsetCallout}
      {showSecondRow && <div className="flex gap-1.5 mt-1.5">{renderDays(6, 14)}</div>}
      {showSecondRow && lavaCallout}
      {statsRow}
    </div>
  );
}