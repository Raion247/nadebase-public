import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PC from "../C/PC";
import PF from "../C/PF";
import { useTheme } from '../C/TC';
import { API, slugify, applyFilters, GRID } from "../C/proHelpers";

// /pro/teams/:teamSlug — a team's lineups across ALL tournaments.
export default function ProTeamAll() {
  const { teamSlug } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [lineups, setLineups] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ map: null, utility: null, side: null, sortBy: "newest" });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/pro-lineups/team/${teamSlug}`, { credentials: "include" });
        const data = await res.json();
        setLineups(data.lineups || []);
        setTeamName(data.lineups?.[0]?.throwerTeam || teamSlug);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [teamSlug]);

  const filtered = useMemo(() => applyFilters(lineups, filters), [lineups, filters]);

  if (loading) return <div className="py-10 text-center text-gray-500 text-sm font-mono">Loading…</div>;

  return (
    <div className={`pt-18 sm:pt-25 min-h-screen text-white font-mono px-3 pb-12 ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <div className="max-w-[110rem] mx-auto">
        <button onClick={() => navigate("/pro")} className="text-gray-400 hover:text-white text-sm mb-3">← All tournaments</button>
        <h1 className="text-2xl font-bold mb-1">{teamName}</h1>
        <p className="text-gray-400 text-sm mb-5">{filtered.length} lineups across all tournaments</p>

        <PF filters={filters} setFilters={setFilters} />
        {filtered.length === 0 && <div className="text-gray-500 text-center py-10">No lineups match these filters.</div>}
        <div className={GRID}>
          {filtered.map((l, i) => (
            <PC
              key={l._id}
              lineup={l}
              index={i}
              onPlayerClick={(name) => navigate(`/pro/players/${slugify(name)}`)}
              onTeamClick={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}