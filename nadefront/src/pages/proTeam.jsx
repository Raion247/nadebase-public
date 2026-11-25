import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PC from "../C/PC";
import PF from "../C/PF";
import { API, slugify, applyFilters, GRID } from "../C/proHelpers";

// /pro/:tournamentSlug/:teamSlug — one team's lineups at a tournament.
// Shows distinct players on this team as quick links.
export default function ProTeam() {
  const { tournamentSlug, teamSlug } = useParams();
  const navigate = useNavigate();
  const [lineups, setLineups] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ map: null, utility: null, side: null, sortBy: "newest" });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/pro-lineups/team/${teamSlug}?tournament=${tournamentSlug}`, { credentials: "include" });
        const data = await res.json();
        setLineups(data.lineups || []);
        setTeamName(data.lineups?.[0]?.throwerTeam || teamSlug);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [tournamentSlug, teamSlug]);

  const players = useMemo(() => {
    const set = new Map();
    for (const l of lineups) {
      for (const p of (l.allThrowers || [])) {
        // use each player's OWN team, not the lineup's primary throwerTeam
        const onTeam = p.team ? slugify(p.team) === teamSlug : slugify(l.throwerTeam) === teamSlug;
        if (onTeam && p.name) set.set(p.name, true);
      }
    }
    return [...set.keys()];
  }, [lineups, teamSlug]);

  const filtered = useMemo(() => applyFilters(lineups, filters), [lineups, filters]);

  if (loading) return <div className="py-10 text-center text-gray-500 text-sm font-mono">Loading…</div>;

  return (
    <div className="pt-18 sm:pt-25 min-h-screen text-white font-mono px-3 pb-12">
      <div className="max-w-[110rem] mx-auto">
        <button onClick={() => navigate(`/pro/${tournamentSlug}`)} className="text-gray-400 hover:text-white text-sm mb-3">← Tournament</button>
        <h1 className="text-2xl font-bold mb-1">{teamName}</h1>
        <p className="text-gray-400 text-sm mb-4">{filtered.length} lineups</p>

        {players.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="text-xs text-gray-500 self-center">Players:</span>
            {players.map((name) => (
              <button
                key={name}
                onClick={() => navigate(`/pro/${tournamentSlug}/${teamSlug}/${slugify(name)}`)}
                className="px-3 py-1 rounded-full border-2 border-slate-600 text-xs font-bold text-gray-300 hover:bg-slate-700"
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <PF filters={filters} setFilters={setFilters} />
        {filtered.length === 0 && <div className="text-gray-500 text-center py-10">No lineups match these filters.</div>}
        <div className={GRID}>
          {filtered.map((l, i) => (
            <PC
              key={l._id}
              lineup={l}
              index={i}
              onPlayerClick={(name) => navigate(`/pro/${tournamentSlug}/${teamSlug}/${slugify(name)}`)}
              onTeamClick={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}