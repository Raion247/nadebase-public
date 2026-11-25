import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FaCog } from 'react-icons/fa';
import useAuth from '../hooks/UA';
import LM from '../C/LM';
import { getLevelRGB } from '../C/LC';
import { getNameStyle } from '../C/UC';
import { useTheme } from '../C/TC';

function getNextReward(level) {
  if (level < 25) return { level: 25, label: "Beginner" };
  if (level < 50) return { level: 50, label: "Intermediate" };
  if (level < 75) return { level: 75, label: "Advanced" };
  if (level < 100) return { level: 100, label: "Expert" };
  return null;
}

export default function PH({ activePage }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [nameStyle, setNameStyle] = useState({ color: '#9ca3af' });

  const navButtons = [
    { label: 'Uploads', path: '/profile' },
    { label: 'Stats', path: '/profile/stats' },
    { label: 'Likes', path: '/profile/likes' }
  ];

  if (!user) return null;

  const nextReward = getNextReward(user.level || 1);
  const [r, g, b] = nextReward ? getLevelRGB(nextReward.level) : [100, 100, 100];

  const activeBg = theme === 'light' ? 'bg-gray-700' : 'bg-[#1e1e30]';
  const inactiveBg = theme === 'light' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-[#161625] hover:bg-[#1e1e30]';

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/user/colors`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setNameStyle(getNameStyle(data.activeNameColor || 'default'));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      setNameStyle(getNameStyle(e.detail.colorId));
    };
    window.addEventListener('nameColorChanged', handler);
    return () => window.removeEventListener('nameColorChanged', handler);
  }, []);

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-5 p-2 md:p-0">
      <div className="flex flex-row">
        <img
          src={user.photos[2].value}
          alt="Profile"
          className="relative my-auto md:my-0 w-20 h-20 md:w-32 md:h-32"
        />
        <div className="flex flex-col w-sm px-4 md:px-5">
          <span
            className={`text-2xl -mb-2 md:mb-0 font-bold ${nameStyle.className || ''}`}
            style={nameStyle.className ? undefined : { color: nameStyle.color }}
          >
            {user.displayName}
          </span>
          <LM />
          {nextReward && (
            <span
              className="text-xs mt-3"
              style={{ color: `rgba(${r},${g},${b},0.7)` }}
            >
              Next reward at level {nextReward.level} — {nextReward.label}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-row justify-center md:justify-normal md:flex-col gap-1 md:gap-2 px-0 md:px-5">
        {navButtons.map(({ label, path, icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`md:mr-auto flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg transition-colors h-10 ${
              activePage === label.toLowerCase() ? activeBg : inactiveBg
            }`}
          >
            {icon && icon}
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-row justify-center md:justify-normal md:flex-col gap-1 md:gap-2 mt-auto mb-auto">
        <button
          onClick={() => navigate('/profile/challenges')}
          className={`md:mr-auto flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg transition-colors h-10 ${
            activePage === 'challenges' ? activeBg : inactiveBg
          }`}
        >
          Completions
        </button>
        <button
          onClick={() => navigate('/profile/settings')}
          className={`md:mr-auto flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg transition-colors h-10 ${
            activePage === 'settings' ? activeBg : inactiveBg
          }`}
        >
          <FaCog /> Settings
        </button>
        <button
          onClick={() => navigate('/profile/customize')}
          className={`md:mr-auto flex cursor-pointer items-center px-4 py-2 rounded-lg transition-colors h-10 ${
            activePage === 'customize' ? activeBg : inactiveBg
          }`}
        >
          Customize
        </button>
      </div>
    </div>
  );
}