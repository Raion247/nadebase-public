import { useEffect, useState, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import AuthContext from './AC';

const TIER_TARGETS = {
  Beginner:     { avgUtilityDamage: 50,  avgEnemiesFlashed: 5,  avgFlashBlind: 1.0, flashSuccessRate: 30, avgAccuracy: 40, avgTrackedLineups: 2 },
  Intermediate: { avgUtilityDamage: 120, avgEnemiesFlashed: 15, avgFlashBlind: 2.4, flashSuccessRate: 70, avgAccuracy: 75, avgTrackedLineups: 7 },
  Advanced:     { avgUtilityDamage: 200, avgEnemiesFlashed: 25, avgFlashBlind: 3.5, flashSuccessRate: 85, avgAccuracy: 88, avgTrackedLineups: 12 },
  Expert:       { avgUtilityDamage: 300, avgEnemiesFlashed: 35, avgFlashBlind: 4.5, flashSuccessRate: 95, avgAccuracy: 95, avgTrackedLineups: 18 },
};

function getFaceitTier(level) {
  if (!level) return "Beginner";
  if (level >= 10) return "Expert";
  if (level >= 8) return "Advanced";
  if (level >= 6) return "Intermediate";
  return "Beginner";
}

function barColor(value, target) {
  if (value == null || target == null) return '#6b7280';
  if (value >= target) return '#4ade80';
  if (value >= target * 0.5) return '#f59e0b';
  return '#f87171';
}

function barWidth(value, target) {
  if (value == null || target == null) return 0;
  const max = target / 0.75;
  return Math.min(100, Math.round((value / max) * 100));
}

function AtRow({ label, value, color = 'text-white', sub = false }) {
  return (
    <div className={`flex items-center justify-between py-2 border-b border-gray-700/40 last:border-0 ${sub ? 'pl-3' : ''}`}>
      <span className={`${sub ? 'text-[11px] text-gray-600' : 'text-xs text-gray-500'}`}>{label}</span>
      <span className={`font-bold ${sub ? 'text-xs text-gray-500' : `text-sm ${color}`}`}>{value ?? '—'}</span>
    </div>
  );
}

export default function US() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const tier = getFaceitTier(user?.faceitLevel);
  const TARGETS = TIER_TARGETS[tier];

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/user/stats`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm mt-8 text-center">Loading...</div>;

  if (!stats || stats.totalMatches === 0) return (
    <div className="mt-8 text-center">
      <p className="text-gray-400 text-sm">No match data yet.</p>
      <button onClick={() => navigate('/matches')} className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors">
        Parse your first demo →
      </button>
    </div>
  );

  const r = stats.recent;

  const rows = [
    { label: 'Util damage', value: r.avgUtilityDamage, target: TARGETS.avgUtilityDamage, unit: '' },
    { label: 'Blinded', value: r.avgEnemiesFlashed, target: TARGETS.avgEnemiesFlashed, unit: '' },
    { label: 'Blind time', value: r.avgFlashBlind, target: TARGETS.avgFlashBlind, unit: 's' },
    { label: 'Flash rate', value: r.flashSuccessRate, target: TARGETS.flashSuccessRate, unit: '%' },
    { label: 'Accuracy', value: r.avgAccuracy, target: TARGETS.avgAccuracy, unit: '%' },
    { label: 'Lineups hit', value: r.avgTrackedLineups, target: TARGETS.avgTrackedLineups, unit: '' },
  ];

  return (
    <div className="mt-6 pb-12 px-3 pt-5 font-mono">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-4">
          <div className="flex justify-between">
            <div className="flex flex-col items-baseline gap-2">
              <p className="text-sm font-bold text-white">Last 30 days</p>
              <span className="text-[10px] text-gray-600">{r.matches} {r.matches === 1 ? 'match' : 'matches'}</span>
            </div>
            <span className="text-[10px] text-gray-600 mt-6">Recommended</span>
          </div>
          {r.matches === 0 ? (
            <p className="text-gray-500 text-xs py-4 text-center">No matches in the last 30 days</p>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-0">
                {rows.map(({ label, value, target, unit }) => {
                  const color = barColor(value, target);
                  const width = barWidth(value, target);
                  return (
                    <div key={label} className="flex items-center gap-3 py-2.5">
                      <div className="w-20 shrink-0">
                        <p className="text-[11px] text-gray-500 mb-0.5">{label}</p>
                        <p className="text-base font-bold" style={{ color }}>
                          {value != null ? `${value}${unit}` : '—'}
                        </p>
                      </div>
                      <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${width}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-900/60 rounded-lg px-2.5 flex flex-col w-15 shrink-0">
                <div className="flex-1 flex flex-col justify-around">
                  {rows.map(({ label, target, unit }) => (
                    <p key={label} className="text-base font-bold text-gray-500 text-center">{target}{unit}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-4">
          <p className="text-sm font-bold text-white mb-3">All time</p>
          <AtRow label="Matches parsed" value={stats.totalMatches} />
          <AtRow label="Utility thrown" value={stats.totalThrows?.toLocaleString()} />
          <AtRow label="Avg utility / match" value={stats.avgThrowsPerMatch} />
          <AtRow label="Smokes" value={stats.avgSmokes} sub />
          <AtRow label="Flashes" value={stats.avgFlashes} sub />
          <AtRow label="HE grenades" value={stats.avgHE} sub />
          <AtRow label="Molotovs" value={stats.avgMolotovs} sub />
          <AtRow label="Total util damage" value={stats.totalUtilityDamage?.toLocaleString()} />
          <AtRow
            label="Lineup accuracy"
            value={stats.avgLineupAccuracy != null ? `${stats.avgLineupAccuracy}%` : '—'}
            color={stats.avgLineupAccuracy >= 75 ? 'text-green-400' : stats.avgLineupAccuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}
          />
          <AtRow label="Lineups hit" value={stats.totalLineupHits?.toLocaleString()} />
        </div>

      </div>
    </div>
  );
}