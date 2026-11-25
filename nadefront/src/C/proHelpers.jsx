// Shared helpers for the pro pages. Keep slug logic identical to the backend's slugMatch
// so URLs the frontend builds resolve correctly when hit directly.

export const API = import.meta.env.VITE_API_URL;

export function slugify(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const MAPS = ["Anubis", "Mirage", "Dust2", "Ancient", "Inferno", "Nuke", "Overpass", "Train"];
export const UTILS = ["Smoke", "Flash", "HE", "Molotov"];
// parser stores lowercase types; map to the title-case the UI shows
export const TYPE_LABEL = { smoke: "Smoke", flash: "Flash", he: "HE", molotov: "Molotov" };

// Apply client-side map/utility/side filters + sort to a lineup list.
export function applyFilters(lineups, { map, utility, side, sortBy }) {
  let out = lineups.filter((l) => {
    const mapOk = !map || map === "all" || (l.map || "").toLowerCase() === map.toLowerCase();
    const utilOk = !utility || (l.type || "").toLowerCase() === utility.toLowerCase();
    const sideOk = !side || (l.side || "").toLowerCase() === side.toLowerCase();
    return mapOk && utilOk && sideOk;
  });
  out = [...out].sort((a, b) => {
    if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); // newest default
  });
  return out;
}

export const GRID =
  "grid p-2 min-[1770px]:p-0 grid-cols-1 min-[550px]:grid-cols-2 min-[820px]:grid-cols-3 min-[1150px]:grid-cols-4 min-[1550px]:grid-cols-5 min-[1760px]:grid-cols-6 gap-x-4 gap-y-2";