import { useState } from "react";
import { TbTargetArrow } from "react-icons/tb";
import { FiInfo } from "react-icons/fi";
import throwTypes from "./TT";

// Same image proxy the nades page uses: the lineup stores an S3 key, and /api/i streams
// it from S3 server-side. Passing the raw key straight to <img src> would not load.
const buildImageUrl = (rawKey) =>
  `${import.meta.env.VITE_API_URL}/api/i?key=${encodeURIComponent(rawKey)}`;

// One pro lineup card. Visually mirrors the nades page (IL.jsx): square image with a
// throw-type + side overlay strip, title above, attribution below. Difference: instead
// of a username, it shows the pro player(s) + their team, and links to the player/team
// pages. setupImage = lineup/aim shot, throwImage = the throw.
export default function PC({ lineup, index = 0, onPlayerClick, onTeamClick }) {
  const images = [lineup.setupImage, lineup.throwImage].filter(Boolean);
  const descs = [lineup.description, lineup.description2].filter(Boolean);
  const [imgIdx, setImgIdx] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);

  const rawKey = images[imgIdx] || null;
  const image = rawKey ? buildImageUrl(rawKey) : null;
  const description = descs[imgIdx] || "";
  const hasMultiple = images.length > 1;

  // Sort by tier (1 = top, shown first; null tiers last), then show only the top 3 most
  // notable throwers. The rest still exist in the data, just not displayed.
  const sortedPlayers = [...(lineup.allThrowers?.length
    ? lineup.allThrowers
    : (lineup.thrower ? [lineup.thrower] : [])
  )].sort((a, b) => (a.tier ?? 99) - (b.tier ?? 99));
  const players = sortedPlayers.slice(0, 3);
  const extraCount = sortedPlayers.length - players.length;

  return (
    <div className="relative group">
      <div className={`relative pb-12 ${(lineup.title || "").length > 26 ? "" : "top-5.5"}`}>
        <span className="absolute font-bold pr-13">{lineup.title || lineup.type}</span>
      </div>

      {/* exp tooltip */}
      {lineup.exp?.trim() && (
        <div className="absolute top-6 right-0 z-10 group/info">
          <button
            onClick={(e) => { e.stopPropagation(); setInfoOpen((v) => !v); }}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Info"
            type="button"
          >
            <FiInfo size={20} />
          </button>
          <div className={`pointer-events-none absolute right-0 mt-2 w-56 translate-y-1 transition-all duration-150 ${infoOpen ? "opacity-100 translate-y-0" : "opacity-0"} group-hover/info:opacity-100 group-hover/info:translate-y-0`}>
            <div className="rounded-md bg-black/80 text-white text-xs p-2 shadow-lg">{lineup.exp}</div>
          </div>
        </div>
      )}

      {/* tracked / hasPosition marker */}
      {lineup.hasPosition && (
        <div className="absolute top-6 z-10 group/tracked" style={{ right: lineup.exp?.trim() ? "1.50rem" : "0rem" }}>
          <TbTargetArrow size={20} className="text-teal-400" />
          <div className="pointer-events-none absolute right-0 mt-2 w-32 translate-y-1 transition-all duration-150 opacity-0 group-hover/tracked:opacity-100 group-hover/tracked:translate-y-0">
            <div className="rounded-md bg-black/80 text-white text-xs p-2 shadow-lg">Tracked lineup</div>
          </div>
        </div>
      )}

      <div className="flex flex-col relative">
        <div className="aspect-square relative overflow-hidden rounded-md">
          {image && (
            <img
              loading={index < 12 ? "eager" : "lazy"}
              src={image}
              alt={`${lineup.type} lineup`}
              className="w-full h-full object-cover rounded-md border md:border-2 border-slate-600"
            />
          )}
          {hasMultiple && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + images.length) % images.length); }}
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 4.293a1 1 0 010 1.414L8.414 10l3.879 4.293a1 1 0 01-1.415 1.414l-4.586-5.071a1 1 0 010-1.414l4.586-5.071a1 1 0 011.415 0z" clipRule="evenodd" /></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % images.length); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.707 4.293a1 1 0 000 1.414L11.586 10l-3.879 4.293a1 1 0 001.415 1.414l4.586-5.071a1 1 0 000-1.414l-4.586-5.071a1 1 0 00-1.415 0z" clipRule="evenodd" /></svg>
              </button>
            </>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-[32px] text-white bg-black/30 text-xs p-1 px-2 flex justify-between items-center">
            <div className="flex gap-1">
              {description
                .replace(/Line up/gi, "Line_up")
                .split(" ")
                .filter(Boolean)
                .map((word, idx) => {
                  const displayWord = word.replace(/Line_up/gi, "Line up");
                  const tt = throwTypes.find((t) => t.id === displayWord);
                  return (
                    <span key={idx} className="truncate font-extrabold text-[12px] h-[22px] outline-1 outline-gray-300 px-2 py-1 mr-1 rounded-md flex items-center cursor-default">
                      {tt ? tt.icon : displayWord}
                    </span>
                  );
                })}
            </div>
            <div className="flex items-center">
              <span className={`ml-2 font-bold px-1.5 py-0.5 rounded cursor-default ${lineup.side === "T" ? "bg-orange-500/90" : "bg-blue-500/90"}`}>
                {lineup.side}
              </span>
            </div>
          </div>
        </div>

        {/* attribution: pro players + team, clickable to their pages */}
        <div className="mt-2 text-xs flex items-center gap-1 flex-wrap">
          <span className="text-gray-600">By:</span>
          {players.map((p, i) => (
            <span key={p.name + i} className="flex items-center gap-1">
              <button
                onClick={() => onPlayerClick?.(p.name)}
                className="font-bold text-blue-400 hover:text-blue-300 hover:underline"
              >
                {p.name}
              </button>
              {i < players.length - 1 && <span className="text-gray-600">,</span>}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="text-gray-500 ml-1" title="More pros have thrown this lineup">+{extraCount} more</span>
          )}
        </div>
      </div>
    </div>
  );
}