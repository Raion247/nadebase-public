import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PC from "../C/PC";
import PF from "../C/PF";
import { API, slugify, applyFilters, GRID } from "../C/proHelpers";

// /pro/:tournamentSlug — all lineups for one tournament, grouped by source match
// (each match is one demo = one "X vs Y" block). Filters + newest-first default.
export default function ProTournament() {
  const { tournamentSlug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ map: null, utility: null, side: null, sortBy: "newest" });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/pro-lineups/t/${tournamentSlug}`, { credentials: "include" });
        if (!res.ok) return navigate("/pro");
        setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [tournamentSlug, navigate]);

  // group filtered lineups by series (same matchup + same date = same BO series)
  const groups = useMemo(() => {
    if (!data?.lineups) return [];
    const filtered = applyFilters(data.lineups, filters);

    // Normalize matchup so "A vs B" and "B vs A" hash to the same key
    const normalizeMatchup = (m) => (m || "").split(" vs ").map(s => s.trim()).sort().join(" vs ");
    const dateStr = (d) => d ? new Date(d).toISOString().slice(0, 10) : "unknown";

    const byGroup = new Map();
    for (const l of filtered) {
      const key = `${normalizeMatchup(l.matchup)}::${dateStr(l.matchDate)}`;
      if (!byGroup.has(key)) {
        byGroup.set(key, {
          key,
          matchup: l.matchup || l.sourceMatch || "Unknown",
          date: l.matchDate ? new Date(l.matchDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null,
          newest: l.createdAt,
          lineups: [],
        });
      }
      const g = byGroup.get(key);
      g.lineups.push(l);
      if (new Date(l.createdAt) > new Date(g.newest)) g.newest = l.createdAt;
    }
    const arr = [...byGroup.values()];
    arr.sort((a, b) =>
      filters.sortBy === "oldest"
        ? new Date(a.newest) - new Date(b.newest)
        : new Date(b.newest) - new Date(a.newest)
    );
    return arr;
  }, [data, filters]);

  if (loading) return <div className="py-10 text-center text-gray-500 text-sm font-mono">Loading…</div>;
  if (!data) return null;

  return (
    <div className="pt-18 sm:pt-25 min-h-screen text-white font-mono px-3 pb-12">
      <div className="max-w-[110rem] mx-auto">
        <button onClick={() => navigate("/pro")} className="text-gray-400 hover:text-white text-sm mb-3">← All tournaments</button>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">{data.name}</h1>
          {data.isCurrent && <span className="text-[10px] font-bold uppercase bg-orange-500 text-black px-2 py-1 rounded">Live</span>}
        </div>
        <p className="text-gray-400 text-sm mb-6">{data.lineupCount ?? 0} lineups across {data.parsedMatchCount ?? 0} matches</p>

        {data.locked ? (
          <div className="rounded-xl border-2 border-orange-500/50 bg-orange-500/10 p-8 text-center">
            <div className="text-lg font-bold mb-2">Supporter-only while live</div>
            <p className="text-gray-300 text-sm mb-4">This tournament's lineups unlock for everyone once it ends. Supporters get them now.</p>
            <button onClick={() => navigate("/upgrade")} className="px-4 py-2 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400">Become a Supporter</button>
          </div>
        ) : (
          <>
            <PF filters={filters} setFilters={setFilters} />
            {groups.length === 0 && <div className="text-gray-500 text-center py-10">No lineups match these filters.</div>}
            {groups.map((g) => (
              <div key={g.key} className="mb-8">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                  <h2 className="font-bold text-gray-200">
                    {(g.matchup || "").split(" vs ").map((team, ti, arr) => (
                      <span key={team + ti}>
                        <button
                          onClick={() => navigate(`/pro/${tournamentSlug}/${slugify(team.trim())}`)}
                          className="hover:text-white hover:underline"
                        >
                          {team.trim()}
                        </button>
                        {ti < arr.length - 1 && <span className="text-gray-500"> vs </span>}
                      </span>
                    ))}
                  </h2>
                  {g.date && <span className="text-xs text-gray-500">· {g.date}</span>}
                  <span className="text-xs text-gray-500">· {g.lineups.length} lineups</span>
                </div>
                <div className={GRID}>
                  {g.lineups.map((l, i) => (
                    <PC
                      key={l._id}
                      lineup={l}
                      index={i}
                      onPlayerClick={(name) => navigate(`/pro/${tournamentSlug}/${slugify(l.throwerTeam)}/${slugify(name)}`)}
                      onTeamClick={(team) => navigate(`/pro/${tournamentSlug}/${slugify(team)}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}