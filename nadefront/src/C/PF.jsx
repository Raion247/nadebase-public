import { MAPS, UTILS } from "./proHelpers";

// Compact filter row reused across tournament/team/player pages. Default sort is newest.
export default function PF({ filters, setFilters }) {
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: f[k] === v ? null : v }));

  const pill = (active) =>
    `px-3 py-1 rounded-full border-2 text-xs font-bold transition ${
      active ? "bg-blue-500 border-blue-500 text-white" : "border-blue-600/40 text-gray-300 hover:bg-blue-500/20"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5 font-mono">
      <select
        value={filters.map || "all"}
        onChange={(e) => setFilters((f) => ({ ...f, map: e.target.value === "all" ? null : e.target.value }))}
        className="bg-gray-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm"
      >
        <option value="all">All maps</option>
        {MAPS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <div className="flex gap-1.5">
        {UTILS.map((u) => (
          <button key={u} onClick={() => set("utility", u)} className={pill(filters.utility === u)}>{u}</button>
        ))}
      </div>

      <div className="flex gap-1.5">
        <button onClick={() => set("side", "T")} className={pill(filters.side === "T")}>T</button>
        <button onClick={() => set("side", "CT")} className={pill(filters.side === "CT")}>CT</button>
      </div>

      <select
        value={filters.sortBy || "newest"}
        onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
        className="bg-gray-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm ml-auto"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </div>
  );
}