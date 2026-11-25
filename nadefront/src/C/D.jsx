import { useEffect, useRef } from "react";
import { MdClose } from "react-icons/md";

export default function D({
  open,
  onClose,
  videoSrc,
  title = "How to use",
  description = "Position lineups however you want. Clicking an image moves it to the front. If you need more space, zoom out on your browser",
  storageKey = "hasSeenDemo",
}) {
  const videoRef = useRef(null);

  // When it opens, try to autoplay (some browsers require muted + playsInline).
  useEffect(() => {
    if (!open) return;

    const v = videoRef.current;
    if (!v) return;

    // Reset and play
    try {
      v.currentTime = 0;
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      // ignore
    }
  }, [open]);

  const handleClose = () => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // ignore
    }
    onClose?.();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-slate-800 shadow-2xl overflow-hidden border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="w-[24px]" />
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button
            onClick={handleClose}
            className="text-slate-300 hover:text-white"
            aria-label="Close"
            type="button"
          >
            <MdClose size={24} />
          </button>
        </div>

        <div className="px-6 pb-4">
          <div className="rounded-xl overflow-hidden border border-slate-700 bg-black">
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted
              playsInline
              loop
              controls={false}
              preload="auto"
              className="w-full h-auto"
            />
          </div>

          <p className="mt-3 text-sm sm:text-base text-slate-300">{description}</p>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition"
              type="button"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}