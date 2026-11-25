export const NAME_COLORS = [
  { id: 'default', color: '#9ca3af', label: 'Default', requirement: 'Free', style: { color: '#9ca3af' } },
  // altenating non animated
  { id: 'ocean', color: '#38bdf8', label: 'Ocean', requirement: 'Special', style: { className: 'ocean-name' } },
  { id: 'sunset', color: '#f97316', label: 'Sunset', requirement: 'Special', style: { className: 'sunset-name' } },
  { id: 'forest', color: '#4ade80', label: 'Forest', requirement: 'Special', style: { className: 'forest-name' } },
  { id: 'lightning', color: '#fbbf24', label: 'Lightning', requirement: 'Special', style: { className: 'lightning-name' } },
  { id: 'rose', color: '#fb7185', label: 'Rose', requirement: 'Special', style: { className: 'rose-name' } },
  { id: 'toxic', color: '#a3e635', label: 'Toxic', requirement: 'Special', style: { className: 'toxic-name' } },
  // animated
  { id: 'gold', color: '#facc15', label: 'Gold', requirement: 'Supporter', style: { className: 'gold-glow-name' } },
  { id: 'rainbow', color: null, label: 'Rainbow', requirement: 'Special', style: { className: 'rainbow-name' } },
  { id: 'inferno', color: '#ef4444', label: 'Inferno', requirement: 'Special', style: { className: 'inferno-name' } },
  { id: 'arctic', color: '#7dd3fc', label: 'Arctic', requirement: 'Special', style: { className: 'arctic-name' } },
  { id: 'plasma', color: '#e879f9', label: 'Plasma', requirement: 'Special', style: { className: 'plasma-name' } },
  { id: 'glacier', color: '#34d399', label: 'Glacier', requirement: 'Special', style: { className: 'glacier-name' } },
  { id: 'lava', color: '#f97316', label: 'Lava', requirement: 'Special', style: { className: 'lava-name' } },
  { id: 'void', color: '#1e1b4b', label: 'Void', requirement: 'Special', style: { className: 'void-name' } },
];

export function getNameStyle(colorId) {
  const found = NAME_COLORS.find(c => c.id === colorId);
  if (!found) return { color: '#9ca3af' };
  return found.style;
}