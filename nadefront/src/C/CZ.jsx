import { useState, useEffect } from 'react';
import useAuth from '../hooks/UA';
import { NAME_COLORS, getNameStyle } from '../C/UC';

export default function CZ({ showNotification }) {
  const { user } = useAuth();
  const [ownedColors, setOwnedColors] = useState([]);
  const [activeColor, setActiveColor] = useState('default');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/colors`, {
          credentials: 'include',
        });
        const data = await res.json();
        setOwnedColors(data.ownedNameColors || ['default']);
        setActiveColor(data.activeNameColor || 'default');
      } catch (e) {}
    };
    fetch_();
  }, []);

  const handleSelect = async (id) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/name-color`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ color: id }),
      });
      if (!res.ok) throw new Error();
      setActiveColor(id);
      window.dispatchEvent(new CustomEvent('nameColorChanged', { detail: { colorId: id } }));
      showNotification('Name color updated!', 'success');
    } catch (e) {
      showNotification('Failed to update color', 'error');
    } finally {
      setSaving(false);
    }
  };

  const ownedColorEntries = NAME_COLORS.filter(c => ownedColors.includes(c.id));

  // Split into groups of 5, then arrange into rows of 4 columns
  const ITEMS_PER_COL = 5;
  const COLS_PER_ROW = 4;
  const groups = [];
  for (let i = 0; i < ownedColorEntries.length; i += ITEMS_PER_COL) {
    groups.push(ownedColorEntries.slice(i, i + ITEMS_PER_COL));
  }
  // Chunk groups into rows of 4 columns
  const rows = [];
  for (let i = 0; i < groups.length; i += COLS_PER_ROW) {
    rows.push(groups.slice(i, i + COLS_PER_ROW));
  }

  return (
    <div className="px-2 sm:px-0 mt-6">
      <h2 className="text-lg font-bold text-white mb-1">Name Color</h2>
      <p className="text-gray-400 text-sm mb-6">Choose how your name appears on lineup cards.</p>

      <div className="flex flex-col gap-8">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-2 sm:grid-cols-6 gap-x-4 gap-y-0">
            {row.map((group, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-0.5">
                {group.map((c) => {
                  const isActive = activeColor === c.id;
                  const nameStyle = getNameStyle(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c.id)}
                      disabled={saving}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/60 transition-colors text-left cursor-pointer w-full"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 border-2 border-slate-200 transition-all"
                        style={{ backgroundColor: isActive ? 'transparent' : '#e2e8f0' }}
                      />
                      <span
                        className={`text-sm font-bold shrink-0 ${nameStyle.className || ''}`}
                        style={nameStyle.className ? undefined : { color: c.color }}
                      >
                        {user?.displayName || 'Your Name'}
                      </span>
                      <span className="text-xs text-gray-700 ml-auto truncate">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}