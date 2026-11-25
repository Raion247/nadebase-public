import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API, slugify } from "../C/proHelpers";
import { useTheme } from '../C/TC';

// /pro — overview of all tournaments. Big tappable cards, the live (Supporter-only)
// tournament highlighted at the top. Each card shows lineup count + total utility
// parsed, then links into its tournament page.
export default function Pro() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [tournaments, setTournaments] = useState([]);
  const [isSupporter, setIsSupporter] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/pro-lineups`, { credentials: "include" });
        const data = await res.json();
        setTournaments(data.tournaments || []);
        setIsSupporter(!!data.isSupporter);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="py-10 text-center text-gray-500 text-sm font-mono">Loading tournaments…</div>;

  return (
    <div className={`pt-18 sm:pt-25 min-h-screen text-white font-mono px-3 pb-12 ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
      <div className="max-w-[90rem] mx-auto">
        <h1 className="text-3xl font-bold mb-1">Pro Lineups</h1>
        <p className="text-gray-400 text-sm mb-8">
          Real utility from pro matches, parsed straight from the demos. Browse by tournament, team, or player.
        </p>

        {tournaments.length === 0 && (
          <div className="text-gray-500 text-center py-10">No tournaments yet.</div>
        )}

        <div className="grid grid-cols-1 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3 gap-5">
          {tournaments.map((t) => {
            const util = t.totalUtility || {};
            return (
              <button
                key={t.slug}
                onClick={() => navigate(`/pro/${t.slug}`)}
                className={`text-left relative overflow-hidden rounded-xl border-2 p-5 transition-all hover:scale-[1.02] ${
                  t.isCurrent
                    ? "border-orange-500/60 bg-gradient-to-br from-orange-500/15 to-gray-800"
                    : "border-slate-700 bg-gradient-to-br from-slate-800 to-gray-800 hover:border-slate-500"
                }`}
              >
                {t.isCurrent && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide bg-orange-500 text-black px-2 py-1 rounded">
                    Live {t.locked && !isSupporter ? "· Supporter" : ""}
                  </span>
                )}
                <h2 className="text-xl font-bold mb-3 pr-20">{t.name}</h2>

                <div className="flex items-baseline gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-extrabold text-teal-400">{t.lineupCount ?? 0}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wide">lineups</div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-200">{util.total ?? 0}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wide">utility parsed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-200">{t.parsedMatchCount ?? 0}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wide">matches</div>
                  </div>
                </div>

                {util.total > 0 && (
                  <div className="flex gap-2 text-[11px] text-gray-300">
                    <span>{util.smoke || 0} smokes</span>·
                    <span>{util.flash || 0} flashes</span>·
                    <span>{util.he || 0} HE</span>·
                    <span>{util.molotov || 0} molly</span>
                  </div>
                )}

                {t.locked && !isSupporter && (
                  <div className="mt-3 text-xs text-orange-300">
                    Live tournament — Supporter access required to view lineups
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}