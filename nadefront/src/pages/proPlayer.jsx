import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PC from "../C/PC";
import PF from "../C/PF";
import { API, slugify, applyFilters, GRID } from "../C/proHelpers";

// Handles two routes:
//   /pro/:tournamentSlug/:teamSlug/:playerSlug  -> player at one tournament (with team)
//   /pro/players/:playerSlug                    -> player across ALL tournaments
// Distinguished by which params are present.
export default function ProPlayer() {
  const { tournamentSlug, teamSlug, playerSlug } = useParams();
  const navigate = useNavigate();
  const [lineups, setLineups] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ map: null, utility: null, side: null, sortBy: "newest" });

  const crossTournament = !tournamentSlug; // /pro/players/:playerSlug

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (tournamentSlug) params.append("tournament", tournamentSlug);
        if (teamSlug) params.append("team", teamSlug);
        const qs = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`${API}/api/pro-lineups/player/${playerSlug}${qs}`, { credentials: "include" });
        const data = await res.json();
        setLineups(data.lineups || []);
        // resolve display name from the first matching thrower
        const first = (data.lineups || [])
          .flatMap((l) => l.allThrowers || [])
          .find((p) => slugify(p.name) === playerSlug);
        setPlayerName(first?.name || playerSlug);
        setTeamName(data.lineups?.[0]?.throwerTeam || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [tournamentSlug, teamSlug, playerSlug]);

  const filtered = useMemo(() => applyFilters(lineups, filters), [lineups, filters]);

  if (loading) return <div className="py-10 text-center text-gray-500 text-sm font-mono">Loading…</div>;

  return (
    <div className="pt-18 sm:pt-25 min-h-screen text-white font-mono px-3 pb-12">
      <div className="max-w-[110rem] mx-auto">
        <button
          onClick={() => navigate(crossTournament ? "/pro" : `/pro/${tournamentSlug}/${teamSlug}`)}
          className="text-gray-400 hover:text-white text-sm mb-3"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          {!crossTournament && teamSlug && (
            <>
              <button
                onClick={() => navigate(`/pro/${tournamentSlug}/${teamSlug}`)}
                className="text-gray-400 hover:text-white hover:underline font-bold"
              >
                {teamName || teamSlug}
              </button>
              <span className="text-gray-600">/</span>
            </>
          )}
          <span>{playerName}</span>
        </h1>
        <p className="text-gray-400 text-sm mb-5">
          {filtered.length} lineups{crossTournament ? " across all tournaments" : ""}
        </p>

        <PF filters={filters} setFilters={setFilters} />
        {filtered.length === 0 && <div className="text-gray-500 text-center py-10">No lineups match these filters.</div>}
        <div className={GRID}>
          {filtered.map((l, i) => (
            <PC
              key={l._id}
              lineup={l}
              index={i}
              onPlayerClick={(name) =>
                navigate(crossTournament
                  ? `/pro/players/${slugify(name)}`
                  : `/pro/${tournamentSlug}/${slugify(l.throwerTeam)}/${slugify(name)}`)
              }
              onTeamClick={(team) =>
                navigate(crossTournament ? `/pro/teams/${slugify(team)}` : `/pro/${tournamentSlug}/${slugify(team)}`)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}