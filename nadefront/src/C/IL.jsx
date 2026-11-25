import { useState, useEffect, useCallback } from 'react';
import { FaStar, FaRegStar, FaHeart, FaRegHeart } from 'react-icons/fa';
import { TbTargetArrow } from 'react-icons/tb';
import { FiInfo } from "react-icons/fi";
import { getNameStyle } from '../C/UC';
import throwTypes from "./TT";
import useAuth from '../hooks/UA';
import { MD } from '../C/MD';
import { getLevelRGB } from '../C/LC';
import '../index.css';

const IL = ({ filters = { map: 'all', utility: null, side: null, sortBy: 'mostLiked' }, showNotification }) => {
  const { user } = useAuth();
  const isMobile = MD();
  const cachedLikedIDs = localStorage.getItem('likedIDs');
  const [likedIDs, setLikedIDs] = useState(cachedLikedIDs ? JSON.parse(cachedLikedIDs) : []);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const [favorites, setFavorites] = useState(JSON.parse(localStorage.getItem('favorites')) || []);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [openInfoId, setOpenInfoId] = useState(null);
  const [levelMap, setLevelMap] = useState({});
  const [displayMap, setDisplayMap] = useState({});

  const activeFilters = filters || { map: 'all', utility: null, side: null, sortBy: 'mostLiked' };
  const initialLimit = filters.searchTerm?.trim() ? 24 : 12;
  const [visibleCount, setVisibleCount] = useState(initialLimit);

  const fetchLevels = async (newItems) => {
    const ids = newItems.map(i => i.id);
    if (!ids.length) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lineups/levels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineupIds: ids }),
      });
      const data = await res.json();
      setLevelMap(prev => ({ ...prev, ...data }));
    } catch (e) {}
  };

  const fetchDisplay = async (newItems) => {
    const ids = newItems.map(i => i.id);
    if (!ids.length) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lineups/display`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineupIds: ids }),
      });
      const data = await res.json();
      setDisplayMap(prev => ({ ...prev, ...data }));
    } catch (e) {}
  };

  // Fetch and cache data
  const fetchLineups = useCallback(async (page, limit = 36) => {
    const url = `${import.meta.env.VITE_API_URL}/api/`;
    const params = new URLSearchParams();

    if (activeFilters.map && activeFilters.map !== 'all') {
      params.append('m', activeFilters.map);
    }
    if (activeFilters.utility) params.append('u', activeFilters.utility);
    if (activeFilters.side) params.append('s', activeFilters.side);
    if (activeFilters.sortBy) params.append('o', activeFilters.sortBy);

    if (filters.searchTerm && filters.searchTerm.trim()) {
      params.append('q', filters.searchTerm.trim());
    }
    
    params.append('p', page);
    params.append('l', limit);

    const fullUrl = `${url}?${params.toString()}`;
    const response = await fetch(fullUrl);
    
    if (!response.ok) throw new Error('Failed to fetch lineups');
    
    const data = await response.json();

    return {
      items: data.items.map(item => ({
        id: item._id,
        code: item.code,
        title: item.title,
        src: item.src,
        ...(item.src2 && { src2: item.src2 }),
        map: item.map,
        name: item.name,
        desc: item.desc || '',
        ...(item.desc2 && { desc2: item.desc2 }),
        side: item.side,
        likeCount: item.likeCount,
        createdAt: item.createdAt,
        username: item.username,
        anonymous: item.anonymous,
        official: item.official,
        hasPosition: item.hasPosition || false,
        exp: item.exp || '',
        tier: item.tier
      })),
      page: data.page,
      hasMore: data.hasMore,
    };
  }, [activeFilters.map, activeFilters.utility, activeFilters.side, activeFilters.sortBy, filters.searchTerm]);

  // Update visible count when filters change
  useEffect(() => {
    setVisibleCount(initialLimit);
  }, [filters.map, filters.utility, filters.side, filters.searchTerm, filters.sortBy, initialLimit]);

  const prefetchNextPage = useCallback(async () => {
    if (!hasMore || isFetchingMore) return;

    try {
      setIsFetchingMore(true);
      const nextPage = currentPage + 1;
      const data = await fetchLineups(nextPage, 36);

      if (data.items.length > 0) {
        const combinedItems = [...items, ...data.items];
        setItems(combinedItems);
        setHasMore(data.hasMore);
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error prefetching:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, isFetchingMore, currentPage, fetchLineups, items]);

  useEffect(() => {
    const remainingItems = items.length - visibleCount;
    if (remainingItems <= initialLimit && hasMore && !isFetchingMore) {
      prefetchNextPage();
    }
  }, [visibleCount, items.length, hasMore, isFetchingMore, initialLimit, currentPage, prefetchNextPage]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const data = await fetchLineups(1, 36);
        
        setItems(data.items);
        setHasMore(data.hasMore);
        setCurrentPage(data.page);
        fetchLevels(data.items);
        fetchDisplay(data.items);
      } catch (error) {
        console.error("Error fetching data:", error);
        showNotification('Error loading lineups', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [
    activeFilters.map, 
    activeFilters.utility, 
    activeFilters.side, 
    activeFilters.sortBy,
    filters.searchTerm,
    fetchLineups
  ]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + initialLimit);
  };

  // Handle likes
  const handleLike = async (item) => {
    if (!user) return showNotification('Please login to like', 'warning');
    if (likedIDs.includes(item.id)) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineupId: item.id }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to like');
      const data = await res.json();

      const newIDs = [...likedIDs, item.id];
      setLikedIDs(newIDs);
      localStorage.setItem('likedIDs', JSON.stringify(newIDs));

      // Update items state
      const updatedItems = items.map(i =>
        i.id === item.id ? { ...i, likeCount: data.likeCount } : i
      );
      setItems(updatedItems);
    } catch (err) {
      console.error(err);
      showNotification(err.message || 'Error liking item', 'error');
    }
  };

  const handleUnlike = async (item) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/unlike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineupId: item.id }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        const newIDs = likedIDs.filter(id => id !== item.id);
        setLikedIDs(newIDs);
        localStorage.setItem('likedIDs', JSON.stringify(newIDs));
        
        // Update items state
        const updatedItems = items.map(i =>
          i.id === item.id ? { ...i, likeCount: data.likeCount } : i
        );
        setItems(updatedItems);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sync liked IDs
  useEffect(() => {
    const fetchLikedIDs = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/check-likes`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch liked IDs');
        const data = await res.json();
        const ids = data.likedItems || [];
        setLikedIDs(ids);
        localStorage.setItem('likedIDs', JSON.stringify(ids));
      } catch (err) {
        console.error(err);
        showNotification('Error loading liked items', 'error');
      }
    };

    if (cachedLikedIDs) {
      setLikedIDs(JSON.parse(cachedLikedIDs));
      fetchLikedIDs();
    } else {
      fetchLikedIDs();
    }
  }, [cachedLikedIDs]);

  // Image handling
  const getCurrentImageData = (item) => {
    const imageKeys = ['src', 'src2'].filter(key => item[key]);
    const descKeys = ['desc', 'desc2'].filter(key => item[key]);
    if (imageKeys.length === 0) return { image: null, description: '' };

    const currentIndex = currentImageIndices[item.id] || 0;
    const rawKey = item[imageKeys[currentIndex]];
    const baseDesc = item[descKeys[currentIndex]] || '';

    const imageUrl = `${import.meta.env.VITE_API_URL}/api/i?key=${encodeURIComponent(rawKey)}`;

    return { image: imageUrl, description: baseDesc };
  };

  const handleNextImage = (itemId, totalImages) => {
    setCurrentImageIndices(prev => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) + 1) % totalImages
    }));
  };

  const handlePrevImage = (itemId, totalImages) => {
    setCurrentImageIndices(prev => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  // Favorites
  const toggleFavorite = (item) => {
    const isFavorite = favorites.some(fav => fav.id === item.id);
    if (isFavorite) {
      const newFavorites = favorites.filter(fav => fav.id !== item.id);
      setFavorites(newFavorites);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    } else {
      if (favorites.length >= 25) {
        showNotification('You can only have up to 25 favorites.', 'warning');
        return;
      }
      const newFavorite = { ...item, code: item.code || '', id: item.id };
      const newFavorites = [...favorites, newFavorite];
      setFavorites(newFavorites);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      window.dispatchEvent(new Event("favoritesUpdated"));
    }
  };

  // Info button
  useEffect(() => {
    const close = () => setOpenInfoId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  if (loading) {
    return <div className="py-2 text-center text-gray-500 text-sm">Loading items...</div>;
  }

  // Filters + sorting
  const filteredItems = items.filter(item => {
    const mapMatch = filters.map === 'all' || item.map.toLowerCase() === filters.map.toLowerCase();
    const utilityMatch = !filters.utility || item.name.toLowerCase() === filters.utility.toLowerCase();
    const sideMatch = !filters.side || item.side.toLowerCase() === filters.side.toLowerCase();
    return mapMatch && utilityMatch && sideMatch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case 'mostLiked': return (b.likeCount || 0) - (a.likeCount || 0);
      default: return 0;
    }
  });

  const visibleItems = sortedItems.slice(0, visibleCount);

  return (
    <div className={`max-w-[110rem] mx-auto pt-4 ${visibleCount < sortedItems.length ? 'pb-8' : 'pb-0'} font-mono`}>
      <div className="gpu-isolate grid p-2 min-[1770px]:p-0 grid-cols-1 min-[550px]:grid-cols-2 min-[820px]:grid-cols-3 min-[1150px]:grid-cols-4 min-[1550px]:grid-cols-5 min-[1760px]:grid-cols-6 gap-x-4 gap-y-2">
        {visibleItems.map((item, index) => {
          const { image, description } = getCurrentImageData(item);
          const imageKeys = ['src', 'src2'].filter(key => item[key]);
          const hasMultipleImages = imageKeys.length > 1;
          const isFavorite = favorites.some(fav => fav.id === item.id);
          const nameStyle = getNameStyle(displayMap[item.id]?.nameColor);

          return (
            <div key={item.id} className="relative group">
              <div className={`relative pb-12 ${item.title.length > 26 ? '' : 'top-5.5'}`}>
                <span className="absolute font-bold pr-13">{item.title}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); likedIDs.includes(item.id) ? handleUnlike(item) : handleLike(item); }}
                className="absolute -bottom-[1px] right-0 z-10 text-red-500 flex items-center"
              >
                {likedIDs.includes(item.id) ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
                <span className="ml-1 text-xs">{item.likeCount || 0}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
                className="absolute -bottom-[1px] right-8.5 z-10 text-yellow-400"
                aria-label="Favorite"
              >
                {isFavorite ? <FaStar size={20} /> : <FaRegStar size={20} />}
              </button>

              {item.exp?.trim() && (
                <div className="absolute top-6 right-0 z-10 group/info">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenInfoId(prev => (prev === item.id ? null : item.id));
                    }}
                    className="text-gray-400 hover:text-gray-500"
                    aria-label="Info"
                    type="button"
                  >
                    <FiInfo size={20} />
                  </button>

                  <div className={`
                    pointer-events-none absolute right-0 mt-2 w-56
                    translate-y-1 transition-all duration-150
                    ${openInfoId === item.id ? "opacity-100 translate-y-0" : "opacity-0"}
                    group-hover/info:opacity-100 group-hover/info:translate-y-0
                  `}>
                    <div className="rounded-md bg-black/80 text-white text-xs p-2 shadow-lg">
                      {item.exp}
                    </div>
                  </div>
                </div>
              )}

              {item.hasPosition && (
                <div className="absolute top-6 z-10 group/tracked" style={{ right: item.exp?.trim() ? '1.50rem' : '0rem' }}>
                  <TbTargetArrow size={20} className="text-teal-400" />
                  <div className="pointer-events-none absolute right-0 mt-2 w-32 translate-y-1 transition-all duration-150 opacity-0 group-hover/tracked:opacity-100 group-hover/tracked:translate-y-0">
                    <div className="rounded-md bg-black/80 text-white text-xs p-2 shadow-lg">
                      Tracked lineup
                    </div>
                  </div>
                </div>
              )}

              <div className="gpu-isolate flex flex-col relative">
                <div className="aspect-square relative overflow-hidden rounded-md">
                  {image && (
                    <img
                      loading={index < 12 ? "eager" : "lazy"}
                      src={image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-md border md:border-2 border-slate-600"
                    />
                  )}
                  {hasMultipleImages && (
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
                  <div className="absolute bottom-0 left-0 right-0 h-[32px] text-white bg-black/30 text-xs p-1 px-2 flex justify-between items-center">
                    <div className="flex gap-1">
                      {description
                        .replace(/Line up/gi, 'Line_up')
                        .split(' ')
                        .map((word, idx) => {
                          const displayWord = word.replace(/Line_up/gi, 'Line up');
                          const throwType = throwTypes.find(t => t.id === displayWord);
                          return (
                            <span
                              key={idx}
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
                          item.side === 'T' ? 'bg-orange-500/90' : 'bg-blue-500/90'
                        }`}
                      >
                        {item.side}
                      </span>
                    </div>
                  </div>
                </div>
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
                                  ? `${item.username.substring(0, 25)}...`
                                  : item.username || 'Unknown')}
                        </span>
                        {levelMap[item.id] && !item.anonymous && (() => {
                        const [r, g, b] = getLevelRGB(levelMap[item.id]);
                        return (
                          <span
                            className="text-[9px] font-bold w-5 h-4 rounded-sm border flex items-center justify-center shrink-0"
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
              </div>
            </div>
          );
        })}
      </div>

      {visibleCount < sortedItems.length && (
        <div className="text-center mt-5">
          <button 
            onClick={handleLoadMore}
            disabled={isFetchingMore}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {isFetchingMore ? 'Loading...' : 'See More'}
          </button>
          {isFetchingMore && (
            <div className="text-xs text-gray-500 mt-2">Preloading more items...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default IL;