import { useState, useEffect } from "react";
import { FiInfo } from "react-icons/fi";
import { createPortal } from "react-dom";
import throwTypes from "./TT";

export default function LP({ lineup, show, onClose, modalImageIndex, setModalImageIndex }) {
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (show) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show || !lineup?.src) return null;

  const images = [lineup.src, lineup.src2].filter(Boolean).map(src => 
    `${import.meta.env.VITE_API_URL}/api/i?key=${src}`
  );
  const descs = [lineup.desc, lineup.desc2].filter(Boolean);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div className="relative max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <img src={images[modalImageIndex]} alt={lineup.title} className="w-full rounded-xl border border-gray-700" />

        {lineup.exp?.trim() && (
            <div className="absolute top-2 right-10 z-10 group/info">
                <button
                onClick={e => { e.stopPropagation(); setShowInfo(prev => !prev); }}
                className="text-gray-200 hover:text-white transition-colors"
                type="button"
                >
                <FiInfo size={26} />
                </button>
                <div className={`pointer-events-none absolute -right-7 w-56 transition-all duration-150 ${
                showInfo ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                } group-hover/info:opacity-100 group-hover/info:translate-y-0`}>
                <div className="rounded-md bg-black/80 text-white text-xs p-2 shadow-lg">
                    {lineup.exp}
                </div>
                </div>
            </div>
        )}

        {descs[modalImageIndex] && (
          <div className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-black/40 px-2 py-1.5 text-xs text-white flex flex-wrap gap-2">
            {descs[modalImageIndex].replace(/Line up/gi, "Line_up").split(" ").map((word, idx) => {
              const displayWord = word.replace(/Line_up/gi, "Line up");
              const throwType = throwTypes.find(t => t.id === displayWord);
              return (
                <span key={idx} className="font-bold px-2 h-[22px] rounded-md border flex items-center">
                  {throwType ? throwType.icon : displayWord}
                </span>
              );
            })}
          </div>
        )}

        {images.length > 1 && (
          <>
            <button onClick={() => setModalImageIndex(i => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 4.293a1 1 0 010 1.414L8.414 10l3.879 4.293a1 1 0 01-1.415 1.414l-4.586-5.071a1 1 0 010-1.414l4.586-5.071a1 1 0 011.415 0z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={() => setModalImageIndex(i => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.707 4.293a1 1 0 000 1.414L11.586 10l-3.879 4.293a1 1 0 001.415 1.414l4.586-5.071a1 1 0 000-1.414l-4.586-5.071a1 1 0 00-1.415 0z" clipRule="evenodd" /></svg>
            </button>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === modalImageIndex ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          </>
        )}

        <button onClick={onClose} className="absolute top-2 right-2 bg-black/60 text-white rounded-sm px-[6px] pb-[2px] hover:bg-black/80">✕</button>
      </div>
    </div>,
    document.body
  );
}