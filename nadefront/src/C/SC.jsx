import { FaSave } from 'react-icons/fa';
import '../index.css';
import { MD } from '../C/MD';

export default function SC({ onSave, user, showNotification }) {
  const isMobile = MD();

  const handleClick = () => {
    if (user) {
      onSave();
    } else {
      showNotification('Please login via Steam to save collections', 'warning');
    }
  };

  return (
    <div className="group relative">
      <button
        onClick={handleClick}
        className={`fixed top-18 md:top-19 z-10 text-white px-2.5 py-2.5 rounded-full shadow-lg transition-all duration-300 ${isMobile ? 'right-52' : 'right-40 lg:right-52'}`}
        title={user ? 'Save Collection' : 'Login to save collections'}
      >
        <FaSave />
      </button>
      <svg
        height="75"
        width="75"
        xmlns="http://www.w3.org/2000/svg"
        className={`fixed top-14 md:top-15 overflow-visible pointer-events-none ${isMobile ? 'right-48' : 'right-36 lg:right-48'}`}
      >
        <defs>
          <filter id="blueGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur result="coloredBlur" stdDeviation="3" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          r="19"
          cx="40.5"
          cy="34"
          fill="none"
          stroke="gray"
          strokeWidth="2"
          opacity="0.3"
        />
        <path
          d="M40.5 53 A19 19 0 0 0 40.5 15"
          className="half-arc half-arc-left"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ filter: 'url(#blueGlow)' }}
        />
        <path
          d="M40.5 53 A19 19 0 0 1 40.5 15"
          className="half-arc half-arc-right"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ filter: 'url(#blueGlow)' }}
        />
      </svg>
    </div>
  );
}