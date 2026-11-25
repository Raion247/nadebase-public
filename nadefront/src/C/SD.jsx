import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { FaStar, FaRegStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { TbTargetArrow } from 'react-icons/tb';
import { FiInfo } from "react-icons/fi";
import { MD } from "../C/MD";
import throwTypes from "./TT";
import useAuth from "../hooks/UA";
import { useTheme } from '../C/TC';
import { getNameStyle } from '../C/UC';
import { getLevelRGB } from '../C/LC';

const buildImageUrl = (rawKey) =>
  `${import.meta.env.VITE_API_URL}/api/i?key=${encodeURIComponent(rawKey)}`;

export default function SD({ showNotification }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isMobile = MD();
  const [items, setItems] = useState([]);
  const [likedIDs, setLikedIDs] = useState([]);
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favorites")) || []
  );
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const [openInfoId, setOpenInfoId] = useState(null);
  const [displayMap, setDisplayMap] = useState({});
  const [levelMap, setLevelMap] = useState({});

  const fadeMaskColor = theme === 'light' ? 'from-gray-900' : 'from-[#0e0e1a]';

  // hide likes when not logged in
  useEffect(() => {
    if (user) {
      const storedLikes = JSON.parse(localStorage.getItem("likedIDs")) || [];
      setLikedIDs(storedLikes);
    } else {
      setLikedIDs([]);
    }
  }, [user]);

  // --- Fetch top 3 most liked lineups ---
  useEffect(() => {
    const fetchTopLineups = async () => {
        try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/top`);
        const { total, top3 } = await res.json();

        setItems(
          top3.map(item => ({
            ...item,
            id: item._id, // standardize field name
          }))
        );
        setTotalCount(total);
        const ids = top3.map(item => item._id);
        fetchLevels(ids);
          fetch(`${import.meta.env.VITE_API_URL}/api/lineups/display`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineupIds: ids }),
          }).then(r => r.json()).then(data => setDisplayMap(data)).catch(() => {});
        } catch (err) {
        console.error("Error fetching top lineups:", err);
        } finally {
        setLoading(false);
        }
    };

    fetchTopLineups();
  }, []);

  const fetchLevels = async (ids) => {
    if (!ids.length) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lineups/levels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineupIds: ids }),
      });
      const data = await res.json();
      setLevelMap(data);
    } catch (e) {}
  };

  const handleLike = async (item) => {
    if (!user) return showNotification("Please login to like", "warning");
    if (likedIDs.includes(item.id)) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineupId: item.id }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to like");
      const data = await res.json();

      // Update likedIDs locally
      const newIDs = [...likedIDs, item.id];
      setLikedIDs(newIDs);
      localStorage.setItem("likedIDs", JSON.stringify(newIDs));

      // Update local state
      const updatedItems = items.map(i =>
        i.id === item.id ? { ...i, likeCount: data.likeCount } : i
      );
      setItems(updatedItems);

    } catch (err) {
      console.error(err);
      showNotification(err.message || "Error liking item", "error");
    }
  };

  const handleUnlike = async (item) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/unlike`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineupId: item.id }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to unlike");
      const data = await res.json();

      // Update likedIDs locally
      const newIDs = likedIDs.filter(id => id !== item.id);
      setLikedIDs(newIDs);
      localStorage.setItem("likedIDs", JSON.stringify(newIDs));

      // Update local state
      const updatedItems = items.map(i =>
        i.id === item.id ? { ...i, likeCount: data.likeCount } : i
      );
      setItems(updatedItems);

    } catch (err) {
      console.error(err);
      showNotification(err.message || "Error unliking item", "error");
    }
  };

  // masking used for the images
  useEffect(() => {
    const container = document.getElementById("lineup-scroll");
    const maskRight = document.getElementById("fade-mask-right");
    const maskLeft = document.getElementById("fade-mask-left");

    if (!container || !maskRight || !maskLeft) return;

    const handleScroll = () => {
        const { scrollLeft, scrollWidth, clientWidth } = container;

        // Right fade: show if content is overflowing to the right
        maskRight.style.opacity = scrollLeft + clientWidth >= scrollWidth - 1 ? "0" : "1";

        // Left fade: show if scrolled past the start
        maskLeft.style.opacity = scrollLeft > 1 ? "1" : "0";
    };

    handleScroll(); // initial check
    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
        container.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
    };
    }, [items]);

  // --- Favorites ---
  const toggleFavorite = (item) => {
    const isFavorite = favorites.some((fav) => fav.id === item.id);
    let updated;

    if (isFavorite) {
      updated = favorites.filter((fav) => fav.id !== item.id);
    } else {
      if (favorites.length >= 25) {
        showNotification('You can only have up to 25 favorites.', 'warning');
        return;
      }
      updated = [...favorites, item];
    }

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  // --- Image Navigation ---
  const handleNextImage = (id, total) => {
    setCurrentImageIndices((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 1) % total,
    }));
  };
  const handlePrevImage = (id, total) => {
    setCurrentImageIndices((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) - 1 + total) % total,
    }));
  };

  useEffect(() => {
    const close = () => setOpenInfoId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const getCurrentImageData = (item) => {
    const imageKeys = ["src", "src2"].filter((k) => item[k]);
    const descKeys = ["desc", "desc2"].filter((k) => item[k]);

    if (imageKeys.length === 0) {
      return { image: null, description: "" };
    }

    const currentIndex = currentImageIndices[item.id] || 0;
    const rawKey = item[imageKeys[currentIndex]];
    const imageUrl = buildImageUrl(rawKey);

    return {
      image: imageUrl,
      description: item[descKeys[currentIndex]] || "",
    };
  };
  // preloads src2
  useEffect(() => {
    if (!items.length) return;

    items.forEach((item) => {
      if (!item.src2) return;
      const img2 = new Image();
      img2.src = buildImageUrl(item.src2);
    });
  }, [items]);

  return (
    <div className="relative w-full mt-15 lg:mt-20">
      <div className="flex flex-col md:flex-row items-center justify-center gap-10 px-6 md:px-20">
        <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 100 }} transition={{ duration: 1, type: "spring" }} className="w-full lg:w-1/2 max-w-2xl -mt-15 md:mt-0 text-center md:text-left">
            <h2 className="text-2xl sm:text-4xl font-bold font-mono">Start your own collection</h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed mt-5 font-mono">
                Find your favorite from <span className="text-white font-bold">{totalCount}</span> different lineups 
                and add them to your collections page by clicking the star icon! Can't find a lineup you like? Add your own! Check out the premade collection below!
            </p>
            <div className="relative inline-block group">
                <svg
                    viewBox="-6 1.2 74 16"
                    className="pointer-events-none absolute top-0 -left-2 w-full h-full overflow-visible"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                    d="M 36 24.2 L 8 24.2 C 0 24.2 0 24.2 0 15.2 S 0 5.2 8 5.2 L 36 5"
                    stroke="#555"   /* gray outline */
                    fill="none"
                    strokeWidth="1"
                    opacity="0.4"
                    />
                    <path
                    d="M 36 24.2 L 64 24.2 C 72 24.2 72 24.2 72 14.6 L 72 14.6 C 72 5 72 5 64 5 L 36 5"
                    stroke="#555"
                    fill="none"
                    strokeWidth="1"
                    opacity="0.4"
                    />
                </svg>
                <svg
                    viewBox="-6 1.2 74 16"
                    className="pointer-events-none absolute top-0 -left-2 w-full h-full overflow-visible"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <filter id="orangeGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur className="blur" result="coloredBlur" stdDeviation="3"></feGaussianBlur>
                            <feMerge>
                                <feMergeNode in="coloredBlur"></feMergeNode>
                                <feMergeNode in="coloredBlur"></feMergeNode>
                                <feMergeNode in="coloredBlur"></feMergeNode>
                                <feMergeNode in="SourceGraphic"></feMergeNode>
                            </feMerge>
                        </filter>
                    </defs>
                    <path
                        d="M 36 24.2 L 8 24.2 C 0 24.2 0 24.2 0 15.2 S 0 5.2 8 5.2 L 36 5"
                        stroke="#f57f18"
                        fill="none"
                        strokeWidth="1"
                        strokeDasharray="200"
                        className="path-draw"
                        style={{ filter: 'url(#orangeGlow)' }}
                    />
                    <path
                        d="M 36 24.2 L 64 24.2 C 72 24.2 72 24.2 72 14.6 L 72 14.6 C 72 5 72 5 64 5 L 36 5"
                        stroke="#f57f18"
                        fill="none"
                        strokeWidth="1"
                        strokeDasharray="200"
                        className="path-draw"
                        style={{ filter: 'url(#orangeGlow)' }}
                    />
                </svg>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("favorites", JSON.stringify([]));
                    localStorage.setItem("imageData", JSON.stringify({}));
                    localStorage.setItem("zOrderMap", JSON.stringify({}));
                    localStorage.setItem("currentImageIndices", JSON.stringify({}));
                    localStorage.setItem("zoomed", JSON.stringify({}));
                    navigate("/collections", { state: { premadeSlug: "premade1" } });
                  }}
                  className="mt-5 px-5 py-2 text-sm sm:text-base text-white font-semibold rounded-xl transition duration-500 group-hover:text-orange-400 group-hover:drop-shadow-[0_0_6px_rgba(247,147,26,0.7)] cursor-pointer"
                >
                  Mirage Basics
                </button>
              </div>
        </motion.div>

        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 100 }} transition={{ duration: 1, type: "spring" }} className="w-full md:w-1/2 max-w-[1050px] mx-auto md:mx-0">
          {loading ? (
            <div className="flex justify-center items-center text-center text-gray-500 text-sm h-[280px]">
              Loading top lineups...
            </div>
          ) : items.length === 0 ? (
            // --- Placeholder shown when no data fetched ---
            <div className="relative">
              <div
                id="lineup-scroll"
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
              >
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="relative group w-[280px] h-[280px] flex flex-col items-center justify-center bg-gray-800/40 border border-gray-700 rounded-md animate-pulse"
                  >
                    <div className="absolute top-4 right-4 w-5 h-5 bg-gray-600 rounded-full"></div>
                    <div className="w-3/4 h-4 bg-gray-700 rounded mb-3"></div>
                    <div className="w-2/3 h-4 bg-gray-700 rounded"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-[32px] bg-black/30 rounded-b-md"></div>
                  </div>
                ))}
              </div>

              <div
                id="fade-mask-right"
                className="pointer-events-none absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-gray-900 to-transparent transition-opacity duration-300 opacity-0 z-20"
              />
              <div
                id="fade-mask-left"
                className="pointer-events-none absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-gray-900 to-transparent transition-opacity duration-300 opacity-0 z-20"
              />
            </div>
          ) : (
            <div className="relative">
                <div
                    id="lineup-scroll" // has pb-3 for name glow
                    className="overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3"
                >
                <div className="flex w-max mx-auto gap-4">
                {items.map((item) => {
                      const nameStyle = getNameStyle(displayMap[item.id]?.nameColor);
                    const { image, description } = getCurrentImageData(item);
                    const imageKeys = ["src", "src2"].filter((k) => item[k]);
                    const hasMultiple = imageKeys.length > 1;
                    const isFavorite = favorites.some((f) => f.id === item.id);

                    return (
                    <div key={item.id} className="relative group"> {/* pb and desc bg connected */}
                        <div className={`relative pb-12 ${item.title.length > 30 ? '' : 'top-5.5'}`}>
                            <span className="absolute font-bold pr-13">{item.title}</span>
                        </div>
                        {item.exp?.trim() && (
                          <div className="absolute top-6 right-1 z-10 group/info">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenInfoId(prev => (prev === item.id ? null : item.id));
                              }}
                              className="text-gray-400 hover:text-gray-200"
                              aria-label="Info"
                            >
                              <FiInfo size={18} />
                            </button>

                            <div
                              className={`
                                pointer-events-none absolute right-0 top-full mt-2 w-56
                                translate-y-1 transition-all duration-150
                                ${openInfoId === item.id ? "opacity-100 translate-y-0" : "opacity-0"}
                                group-hover/info:opacity-100 group-hover/info:translate-y-0
                              `}
                            >
                              <div className="rounded-md bg-black/80 text-white text-xs p-2 shadow-lg">
                                {item.exp}
                              </div>
                            </div>
                          </div>
                        )}
                          {item.hasPosition && (
                            <div className="absolute top-6 z-10 group/tracked" style={{ right: item.exp?.trim() ? '1.75rem' : '0.25rem' }}>
                              <TbTargetArrow size={20} className="text-teal-400" />
                              <div className="pointer-events-none absolute right-0 mt-2 w-24 translate-y-1 transition-all duration-150 opacity-0 group-hover/tracked:opacity-100 group-hover/tracked:translate-y-0">
                                <div className="rounded-md bg-black/80 text-white text-xs p-2 shadow-lg">
                                  Tracked lineup
                                </div>
                              </div>
                            </div>
                          )}
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            likedIDs.includes(item.id)
                            ? handleUnlike(item)
                            : handleLike(item);
                        }}
                        className="absolute bottom-0 right-0 z-10 text-red-500 flex items-center"
                        >
                        {likedIDs.includes(item.id) ? (
                            <FaHeart size={18} />
                        ) : (
                            <FaRegHeart size={18} />
                        )}
                        <span className="ml-1 text-xs">
                            {item.likeCount || 0}
                        </span>
                        </button>

                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item);
                        }}
                        className="absolute bottom-0 right-8.5 z-10 text-yellow-400"
                        aria-label="Favorite"
                        >
                        {isFavorite ? (
                            <FaStar size={20} />
                        ) : (
                            <FaRegStar size={20} />
                        )}
                        </button>

                        {/* Image */}
                        <div className="aspect-square relative w-[280px] h-[280px]">
                        {image && (
                            <img
                            src={image}
                            alt={item.name}
                            loading="eager"
                            decoding="async"
                            className="w-full h-full object-cover rounded-md border-1 md:border-2 border-slate-600"
                            />
                        )}

                        {hasMultiple && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrevImage(item.id, imageKeys.length);
                              }}
                              className={
                                `absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full transition-opacity ` +
                                (isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
                              }
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.293 4.293a1 1 0 010 1.414L8.414 10l3.879 4.293a1 1 0 01-1.415 1.414l-4.586-5.071a1 1 0 010-1.414l4.586-5.071a1 1 0 011.415 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNextImage(item.id, imageKeys.length);
                              }}
                              className={
                                `absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full transition-opacity ` +
                                (isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')
                              }
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.707 4.293a1 1 0 000 1.414L11.586 10l-3.879 4.293a1 1 0 001.415 1.414l4.586-5.071a1 1 0 000-1.414l-4.586-5.071a1 1 0 00-1.415 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </>
                        )}
                        </div>
                        {/* username display */}
                          <div className="mt-2 text-xs flex items-center gap-1 overflow-visible">
                            <span className="text-gray-600">By:</span>

                            {item.official ? (
                              <span className="text-green-500 font-bold">nadebase</span>
                            ) : (
                              <>
                                <span
                                  className={`font-bold ${nameStyle.className || ''}`}
                                  style={nameStyle.className ? undefined : { color: nameStyle.color }}
                                >
                                  {item.anonymous
                                    ? 'Anonymous'
                                    : (item.username?.length > 25
                                      ? `${item.username.slice(0, 25)}...`
                                      : item.username || 'Unknown')}
                                </span>
                                {levelMap[item.id] && !item.anonymous && (() => {
                                  const [r, g, b] = getLevelRGB(levelMap[item.id]);
                                  return (
                                    <span
                                      className="text-[9px] font-bold font-mono w-5 h-4 rounded-sm border flex items-center justify-center shrink-0"
                                      style={{
                                        color: `rgb(${r},${g},${b})`,
                                        borderColor: `rgb(${r},${g},${b})`,
                                        backgroundColor: `rgba(${r},${g},${b},0.15)`,
                                      }}
                                    >
                                      {levelMap[item.id]}
                                    </span>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                          <div className="absolute bottom-6 left-0 right-0 h-[32px] text-white bg-black/30 text-xs p-1 px-2 flex justify-between rounded-b-md items-center">
                        <div className="flex gap-1">
                            {description
                            .replace(/Line up/gi, "Line_up")
                            .split(" ")
                            .map((word, idx) => {
                              const displayWord = word.replace(/Line_up/gi, "Line up");
                              const throwType = throwTypes.find((t) => t.id === displayWord);
                              return (
                                <span
                                  key={`${item.id}-${idx}-${word}`}
                                  className="truncate font-extrabold text-[12px] h-[22px] outline-1 outline-gray-300 px-2 py-1 mr-1 rounded-md flex items-center cursor-default"
                                >
                                  {throwType ? throwType.icon : displayWord}
                                </span>
                              );
                            })}
                        </div>
                        <div className="flex items-center">
                        <span
                            className={`ml-2 font-bold px-1.5 py-0.5 rounded cursor-default ${
                            item.side === "T"
                                ? "bg-orange-500/90"
                                : "bg-blue-500/90"
                            }`}
                        >
                            {item.side}
                        </span>
                        </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
            <div
                id="fade-mask-right"
              className={`pointer-events-none absolute top-0 right-0 w-16 h-full bg-gradient-to-l ${fadeMaskColor} to-transparent transition-opacity duration-300 opacity-0 z-20`}
            />
            <div
                id="fade-mask-left"
              className={`pointer-events-none absolute top-0 left-0 w-16 h-full bg-gradient-to-r ${fadeMaskColor} to-transparent transition-opacity duration-300 opacity-0 z-20`}
            />
        </div>
        )}
        </motion.div>
      </div>
    </div>
  );
}
