const MIRAGE_T_INSTA_SMOKES = new Set(["OJ9V", "2SY8", "GRU8", "3JZG", "LZM3"]);
const ANCIENT_CT_INSTA_SMOKES = new Set(["45QR", "AEBV", "W7TD", "DBY5", "NCWO"]);

export default function MT({ match, totalThrown, totalMatched, avgAccuracy, navigate }) {
  const tips = [];
  const matchedCodes = new Set((match.throws || []).map(t => t.lineupCode).filter(Boolean));

  const lowImpact = totalThrown >= 5 && (match.totalUtilityDamage || 0) < 100 && totalMatched === 0;
  if (lowImpact) {
    tips.push({
      message: `You threw ${totalThrown} grenades but dealt only ${match.totalUtilityDamage || 0} utility damage with no tracked lineups. Check out lineups for ${match.map} to improve your utility usage.`,
      link: `/nades?map=${match.map?.toLowerCase()}`,
      linkText: `Browse ${match.map} lineups →`,
    });
  }

  if (totalThrown >= 5 && totalMatched < 5) {
    tips.push({
      message: `You only hit ${totalMatched} tracked lineup${totalMatched === 1 ? '' : 's'} this match. Try using more lineups to maximize utility impact.`,
      link: `/nades?map=${match.map?.toLowerCase()}`,
      linkText: `Browse ${match.map} lineups →`,
    });
  }

  if (avgAccuracy != null && avgAccuracy < 50) {
    tips.push({
      message: `Your lineup accuracy was below average this match. Practice your lineups to help your team as much as possible.`,
      link: null,
    });
  }

  if (match.counts?.flash >= 3 && match.successfulFlashes != null) {
    const flashPct = match.successfulFlashes / match.counts.flash;
    if (flashPct < 0.5) {
      tips.push({
        message: `Over half of your flashes had 0 impact. Learn ${match.map} flashes to get your team some rounds.`,
        link: `/nades?map=${match.map?.toLowerCase()}&type=flash`,
        linkText: `Browse ${match.map} flashes →`,
      });
    }
  }

  // Mirage T side insta smokes
  if (match.map === "Mirage") {
    const hasInstSmoke = [...matchedCodes].some(code => MIRAGE_T_INSTA_SMOKES.has(code));
    if (!hasInstSmoke) {
      tips.push({
        message: `You didn't throw any insta window smokes on Mirage. Early window smoke is one of the most impactful utilities on T side — Use it to take mid control!`,
        link: `/nades?map=mirage&type=smoke`,
        linkText: `Browse Mirage smoke lineups →`,
      });
    }
  }

  // Ancient CT side insta smokes
  if (match.map === "Ancient") {
    const hasInstSmoke = [...matchedCodes].some(code => ANCIENT_CT_INSTA_SMOKES.has(code));
    if (!hasInstSmoke) {
      tips.push({
        message: `You didn't throw any insta elbow smokes on Ancient. Early elbow smoke is crucial for controlling middle — Learn it to support your team!`,
        link: `/nades?map=ancient&type=smoke`,
        linkText: `Browse Ancient smoke lineups →`,
      });
    }
  }

  if (tips.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-2">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Tips</p>
      {tips.map((tip, i) => (
        <div key={i} className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 flex gap-3">
          <div className="text-blue-400 shrink-0">!</div>
          <div>
            <p className="text-gray-400 text-xs mt-1">{tip.message}</p>
            {tip.link && (
              <button
                onClick={() => navigate(tip.link)}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {tip.linkText}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}