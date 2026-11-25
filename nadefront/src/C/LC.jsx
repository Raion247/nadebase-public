export function getLevelRGB(level) {
  const clamped = Math.min(Math.max(level, 1), 100);
  const stops = [
    [1,   [100, 100, 100]],
    [10,  [74,  222, 128]],
    [25,  [59,  130, 246]],
    [50,  [168, 85,  247]],
    [75,  [239, 68,  68]],
    [100, [250, 204, 21]],
  ];
  let lower = stops[0], upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i][0] && clamped <= stops[i + 1][0]) {
      lower = stops[i]; upper = stops[i + 1]; break;
    }
  }
  const t = (clamped - lower[0]) / (upper[0] - lower[0]);
  return [
    Math.round(lower[1][0] + (upper[1][0] - lower[1][0]) * t),
    Math.round(lower[1][1] + (upper[1][1] - lower[1][1]) * t),
    Math.round(lower[1][2] + (upper[1][2] - lower[1][2]) * t),
  ];
}