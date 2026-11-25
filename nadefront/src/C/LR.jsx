import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { getNameStyle } from '../C/UC';
import useAuth from '../hooks/UA';

const TIERS = [
  {
    level: 25,
    label: "Beginner",
    color: [74, 222, 128],
    rewards: [
      { label: "Name color", value: "toxic" },
      { label: "Daily uploads", value: "+1" },
      { label: "Monthly uploads", value: "+2" },
      { label: "Collection slots", value: "+1" },
    ],
  },
  {
    level: 50,
    label: "Intermediate",
    color: [59, 130, 246],
    rewards: [
      { label: "Name color", value: "ocean" },
      { label: "Daily uploads", value: "+1" },
      { label: "Monthly uploads", value: "+3" },
      { label: "Collection slots", value: "+1" },
    ],
  },
  {
    level: 75,
    label: "Advanced",
    color: [239, 68, 68],
    rewards: [
      { label: "Name color", value: "rose" },
      { label: "Daily uploads", value: "+1" },
      { label: "Monthly uploads", value: "+5" },
      { label: "Collection slots", value: "+1" },
    ],
  },
  {
    level: 100,
    label: "Expert",
    color: [250, 204, 21],
    rewards: [
      { label: "Name color", value: "gold" },
      { label: "Daily uploads", value: "+2" },
      { label: "Monthly uploads", value: "+5" },
      { label: "Collection slots", value: "+2" },
    ],
  },
];

export default function LR() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selected, setSelected] = useState(TIERS[0]);
  const [r, g, b] = selected.color;

  return (
    <div ref={ref} className="relative w-full font-mono -mt-20">
      <div className="flex flex-col md:flex-row items-center justify-center gap-5 sm:gap-15 px-6 md:px-25 w-full">

        {/* Left — interactive panel */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 1, type: "spring" }}
          className="flex justify-center items-center h-65 sm:h-80 w-full md:w-[80%] md:max-w-[900px]"
        >
          <div
            className="w-full h-full rounded-xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-4 transition-all duration-500"
            style={{
              border: `3px solid rgba(${r},${g},${b},0.25)`,
              backgroundColor: `rgba(${r},${g},${b},0.04)`,
              boxShadow: `inset 0 0 40px -10px rgba(${r},${g},${b},0.08)`
            }}
          >
            {/* Level buttons */}
            <div className="flex gap-2 sm:gap-3">
              {TIERS.map((tier) => {
                const [tr, tg, tb] = tier.color;
                const isActive = selected.level === tier.level;
                return (
                  <button
                    key={tier.level}
                    onClick={() => setSelected(tier)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] xs:text-xs font-bold transition-all duration-200"
                    style={{
                      border: `1px solid rgba(${tr},${tg},${tb},${isActive ? 0.7 : 0.2})`,
                      backgroundColor: isActive ? `rgba(${tr},${tg},${tb},0.15)` : `transparent`,
                      color: `rgb(${tr},${tg},${tb})`,
                    }}
                  >
                    Level {tier.level}
                  </button>
                );
              })}
            </div>

            {/* Title */}
            <div className="flex flex-col items-baseline">
              <span
                className="text-2xl font-bold tracking-tight"
                style={{ color: `rgb(${r},${g},${b})` }}
              >
                {selected.label}
              </span>
              <span 
                className="text-xs top-26 opacity-50"
                style={{ color: `rgb(${r},${g},${b})` }}
              >
                Rewards
              </span>
            </div>
            {/* Reward rows */}
            <div className="flex flex-col mt-0 sm:-mt-4 gap-1 sm:gap-1.5 flex-1 justify-center">
            {selected.rewards.map((reward, i) => {
              const isNameColor = reward.label === "Name color";
              const nameStyle = isNameColor ? getNameStyle(reward.value) : null;
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-300 text-[12px] xs:text-sm">{reward.label}</span>
                  <div className="flex items-center gap-3">
                    {isNameColor ? (
                      <span
                        className={`text-[12px] xs:text-sm font-bold ${nameStyle.className || ''}`}
                        style={nameStyle.className ? undefined : { color: nameStyle.color }}
                      >
                        {user ? user.displayName : reward.value.charAt(0).toUpperCase() + reward.value.slice(1)}
                      </span>
                    ) : (
                      <>
                        <div
                          className="h-px flex-1 w-24 sm:w-40"
                          style={{ background: `linear-gradient(to right, transparent, rgba(${r},${g},${b},0.3))` }}
                        />
                        <span
                          className="text-sm xs:text-lg font-bold tabular-nums w-10 text-right"
                          style={{ color: `rgb(${r},${g},${b})` }}
                        >
                          {reward.value}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </motion.div>

        {/* Right — text */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 1, type: "spring" }}
          className="flex flex-col justify-center h-70 w-full md:max-w-4xl text-center md:text-left"
        >
          <h2 className="text-2xl sm:text-4xl font-bold">Level up and unlock more</h2>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed mt-5">
            Upload lineups or parse your Faceit demos to complete challenges and earn XP.
            Unlock rewards and permanent bonuses to uploads and collections.
          </p>
          <button
            onClick={() => navigate("/challenges")}
            className="mt-6 self-center md:self-start px-4 py-2 bg-blue-600/30 hover:bg-blue-500/30 border border-blue-600/40 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            View challenges →
          </button>
        </motion.div>

      </div>
    </div>
  );
}