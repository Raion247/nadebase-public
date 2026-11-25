import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import { FaLock, FaImage } from 'react-icons/fa';
import { useTheme } from '../C/TC';

export default function CD() {
  const [visibleSlots, setVisibleSlots] = useState(6);
  const { theme } = useTheme();
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const containerRef = useRef(null);
  const demoRef = useRef(null);
  const stageRef = useRef(null);
  const isInView1 = useInView(ref1, { once: true, margin: "-100px" });
  const isInView2 = useInView(ref2, { once: true, margin: "-100px" });

    // --- Demo block state (movable + resizable) ---
  const [demoData, setDemoData] = useState({
    x: 20,
    y: 20,
    width: 160,
    height: 100
  });
  const [activeAction, setActiveAction] = useState({ type: null });
  const [actionStart, setActionStart] = useState({ x: 0, y: 0, data: {} });
  const MIN_WIDTH = 120;
  const MIN_HEIGHT = 80;

  // helpers
  const getStageRect = () => {
    if (!stageRef.current) return null;
    return stageRef.current.getBoundingClientRect();
  };

  const getPoint = (e) => {
    // TouchEvent
    if ('touches' in e || 'changedTouches' in e) {
      const t = e.touches?.[0] || e.changedTouches?.[0];
      if (!t) return null;
      return { clientX: t.clientX, clientY: t.clientY };
    }
    // MouseEvent
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Start drag or resize
  const startAction = (type, e) => {
    e.preventDefault();
    e.stopPropagation();

    const pt = getPoint(e);
    if (!pt) return;

    setActiveAction({ type });
    // Disable text selection while dragging/resizing
    document.body.style.userSelect = 'none';

    if (type === 'resize') {
      setActionStart({
        x: pt.clientX,
        y: pt.clientY,
        data: { ...demoData } // store original dims
      });
    } else { // drag
      // store pointer offset inside the block so it doesn't jump
      setActionStart({
        x: pt.clientX - demoData.x,
        y: pt.clientY - demoData.y,
        data: { ...demoData }
      });
    }
  };

  // Handle pointer movement
  const handleAction = (clientX, clientY) => {
    if (!activeAction.type) return;

    const stageRect = getStageRect();
    const stageWidth = stageRect?.width ?? window.innerWidth;
    const stageHeight = stageRect?.height ?? window.innerHeight;

    if (activeAction.type === 'drag') {
      const newX = clientX - actionStart.x;
      const newY = clientY - actionStart.y;

      // clamp so block stays inside stage
      const maxX = Math.max(0, Math.floor(stageWidth - demoData.width));
      const maxY = Math.max(0, Math.floor(stageHeight - demoData.height));

      const clampedX = Math.min(Math.max(0, Math.round(newX)), maxX);
      const clampedY = Math.min(Math.max(0, Math.round(newY)), maxY);

      setDemoData(prev => ({
        ...prev,
        x: clampedX,
        y: clampedY
      }));
    } else if (activeAction.type === 'resize') {
      const deltaX = clientX - actionStart.x;
      const deltaY = clientY - actionStart.y;

      const proposedWidth = Math.round(actionStart.data.width + deltaX);
      const proposedHeight = Math.round(actionStart.data.height + deltaY);

      // Prevent growing past stage edge: max width = stageWidth - x, max height = stageHeight - y
      const maxAllowedWidth = Math.max(MIN_WIDTH, Math.floor(stageWidth - demoData.x));
      const maxAllowedHeight = Math.max(MIN_HEIGHT, Math.floor(stageHeight - demoData.y));

      const newWidth = Math.min(Math.max(MIN_WIDTH, proposedWidth), maxAllowedWidth);
      const newHeight = Math.min(Math.max(MIN_HEIGHT, proposedHeight), maxAllowedHeight);

      setDemoData(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight
      }));
    }
  };

  // End action
  const endAction = () => {
    if (activeAction.type) {
      setActiveAction({ type: null });
      document.body.style.userSelect = '';
    }
  };

  // Attach mouse / touch listeners while action active
  useEffect(() => {
    if (!activeAction.type) return;

    const onMouseMove = (e) => {
      handleAction(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      endAction();
    };

    const onMouseLeave = () => {
      endAction();
    };

    const onTouchMove = (e) => {
      e.preventDefault(); // prevent scroll while dragging/resizing
      const pt = getPoint(e);
      if (!pt) return;
      handleAction(pt.clientX, pt.clientY);
    };

    const onTouchEnd = () => {
      endAction();
    };

    const onTouchCancel = () => {
      endAction();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchCancel);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [activeAction, actionStart, demoData]);

  useEffect(() => {
    const handleResize = () => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const screenWidth = window.innerWidth;

      if (containerWidth < 310 || screenWidth < 640) {
        setVisibleSlots(4);
      } else {
        setVisibleSlots(6);
      }

      // also, ensure demo remains inside stage if stage shrinks
      const stageRect = getStageRect();
      if (stageRect) {
        setDemoData(prev => {
          const maxX = Math.max(0, Math.floor(stageRect.width - prev.width));
          const maxY = Math.max(0, Math.floor(stageRect.height - prev.height));
          const x = prev.x > maxX ? maxX : prev.x;
          const y = prev.y > maxY ? maxY : prev.y;
          const maxW = Math.max(MIN_WIDTH, Math.floor(stageRect.width - x));
          const maxH = Math.max(MIN_HEIGHT, Math.floor(stageRect.height - y));
          const width = Math.min(prev.width, maxW);
          const height = Math.min(prev.height, maxH);
          return { ...prev, x, y, width, height };
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative w-full mt-2 lg:mt-33 font-mono">
      <div
        ref={ref1}
        className="flex flex-col-reverse md:flex-row items-center justify-center gap-0 xs:gap-15 px-6 md:px-25 w-full h-fit mb-0 md:mb-15"
      >
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={isInView1 ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 1, type: "spring" }}
          className="flex justify-center items-center h-80 w-full md:w-[80%] md:max-w-[900px]"
        >
          <div className="w-full h-full object-contain rounded-lg inset-shadow-[0_0_40px_-2px] inset-shadow-orange-400 outline-3 outline-gray-400">
            <div ref={stageRef} className="relative w-full h-full" style={{ overflow: activeAction.type ? 'hidden' : 'visible' }}>
              {/* Demo stage (background) */}
              <div className={`w-full h-full rounded-lg p-4 flex items-center justify-center ${theme === 'light' ? 'bg-gradient-to-tr from-gray-800 to-gray-900' : 'bg-gradient-to-tr from-[#161625] to-[#1a1a2e]'}`}>
                <div className="text-center text-gray-400 select-none">
                  Move and resize in any way you want
                </div>
              </div>

              {/* The interactive block */}
              <div
                ref={demoRef}
                onMouseDown={(e) => {
                  // Only start drag if user clicked inside block but not on resize handle (we layer a full-size drag overlay)
                  startAction('drag', e);
                }}
                onTouchStart={(e) => startAction('drag', e)}
                style={{
                  position: 'absolute',
                  left: `${demoData.x}px`,
                  top: `${demoData.y}px`,
                  width: `${demoData.width}px`,
                  height: `${demoData.height}px`,
                  zIndex: 40,
                  touchAction: activeAction.type ? 'none' : 'auto',
                  transition: activeAction.type ? 'none' : 'box-shadow 0.12s ease, transform 0.12s ease'
                }}
                className={`bg-gray-700 rounded-lg shadow-xl border border-gray-600 overflow-hidden cursor-move`}
                role="region"
                aria-label="Demo movable and resizable block"
              >
                {/* Content inside demo block */}
                <div className="w-full h-full relative flex items-center justify-center text-white text-sm">
                  <div className="pointer-events-none select-none">
                    <FaImage size={24} />
                  </div>

                  {/* Resize handle - bottom-right */}
                  <div
                    onMouseDown={(e) => {
                      // ensure resize start doesn't trigger parent drag
                      e.stopPropagation();
                      startAction('resize', e);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      startAction('resize', e);
                    }}
                    style={{
                      position: 'absolute',
                      right: 6,
                      bottom: 6,
                      width: 18,
                      height: 18,
                      cursor: 'se-resize'
                    }}
                    className="bg-blue-500 rounded-sm opacity-90 flex items-center justify-center"
                    title="Resize"
                    aria-hidden="true"
                  >
                    {/* small diagonal lines for affordance */}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 12L12 0M6 12L12 6M0 6L6 0" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={isInView1 ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 1, type: "spring" }}
          className="flex flex-col justify-center h-70 w-full md:max-w-4xl text-center md:text-left"
        >
          <h2 className="text-2xl sm:text-4xl font-bold">You have full control</h2>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed mt-5">
            Position, move and resize your lineups however you want! Keep your
            lineups in view, even when in-game. Run out of space? Just zoom out
            on your browser!
          </p>
        </motion.div>
      </div>
      <div
        ref={ref2}
        className="flex flex-col md:flex-row items-center justify-center gap-0 md:gap-15 px-6 md:px-25 w-full h-fit pb-30"
      >
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={isInView2 ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 1, type: "spring" }}
          className="flex flex-col justify-center h-60 mt-8 md:mt-0 md:h-70 w-full md:w-[50%] md:max-w-2xl text-center md:text-left"
        >
          <h2 className="text-2xl sm:text-4xl font-bold">Save for quick access</h2>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed mt-5">
            Finished with your collection? Save it for quick and easy access. Save
            up to 10 collections for{" "}
            <span className="font-bold text-white">FREE</span> just by logging in!
          </p>
        </motion.div>
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={isInView2 ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 1, type: "spring" }}
          className="flex justify-center -mt-10 items-center h-70 md:h-80 w-full md:w-[50%] md:max-w-2xl"
        >
          <div ref={containerRef} className="grid gap-4 w-full max-w-[600px]" 
          style={{
            gridTemplateColumns:
              (containerRef.current && containerRef.current.offsetWidth < 310) ||
              window.innerWidth < 640
                ? "repeat(2, 1fr)"
                : "repeat(3, 1fr)",
          }}>
            {[...Array(visibleSlots / 2)].map((_, i) => (
              <div key={`top-${i}`} className="flex justify-center items-center border border-gray-700 rounded bg-gray-700 text-gray-300 aspect-[5/2]">
                Empty Slot
              </div>
            ))}
            {[...Array(visibleSlots / 2)].map((_, i) => (
              <div key={`bottom-${i}`} className="flex justify-center items-center border border-gray-700 rounded bg-gray-800 text-gray-500 aspect-[5/2]">
                <FaLock className="mr-2" /> Locked
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}