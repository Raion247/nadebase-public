import { useState, useEffect, useCallback } from 'react';
import { FaStar, FaRegStar, FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';
import { FiInfo, FiZoomIn } from "react-icons/fi";
import { Tab, TabGroup, TabList } from '@headlessui/react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MD } from '../C/MD';
import throwTypes from "../C/TT"; 
import useAuth from '../hooks/UA';

const UU = ({ showNotification }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isMobile = MD();
    const cachedLikedIDs = localStorage.getItem('likedIDs');
    const [likedIDs, setLikedIDs] = useState(cachedLikedIDs ? JSON.parse(cachedLikedIDs) : []);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentImageIndices, setCurrentImageIndices] = useState({});
    const [favorites, setFavorites] = useState(JSON.parse(localStorage.getItem('favorites')) || []);
    const [error, setError] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [pendingItems, setPendingItems] = useState([]);
    const [openInfoId, setOpenInfoId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const initialLimit = 24;
    const loadMoreStep = 12;
    const [visibleCount, setVisibleCount] = useState(initialLimit);
    const [visibility, setVisibility] = useState('public');
    const [totalUploads, setTotalUploads] = useState(0);

    const fetchUserUploads = useCallback(
      async (page = 1, append = false) => {
        try {
          if (!user) {
            setItems([]);
            setLoading(false);
            return;
          }

          if (!append) {
            setLoading(true);
          } else {
            setIsLoadingMore(true);
          }

          const params = new URLSearchParams();
            params.append('p', page);
            params.append('l', 60);
            if (searchTerm.trim()) params.append('q', searchTerm.trim());

            const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/user-uploads?${params.toString()}`,
            { credentials: 'include' }
          );

          if (!response.ok) {
            if (response.status === 404) {
              if (!append) {
                setItems([]);
                setError('Uploads feature not available');
              }
              return;
            }
            throw new Error(`Failed to fetch user uploads: ${response.status}`);
          }

          const data = await response.json();

          const transformedItems = (data.items || []).map(item => ({
            id: item._id,
            code: item.code,
            title: item.title,
            src: item.src,
            ...(item.src2 && { src2: item.src2 }),
            map: item.map,
            pos: item.pos,
            name: item.name,
            desc: item.desc || '',
            ...(item.desc2 && { desc2: item.desc2 }),
            exp: item.exp || '',
            side: item.side,
            likeCount: item.likeCount,
            visibility: item.visibility || 'public'
          }));

          setItems(prev =>
            append ? [...prev, ...transformedItems] : transformedItems
          );
          setCurrentPage(data.page || page);
          setHasMore(!!data.hasMore);
          setError(null);

          // Load favorites once on initial load
          if (!append) {
            const savedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
            setFavorites(savedFavorites);
          }
        } catch (err) {
          console.error('Error fetching user uploads:', err);
          if (!append) {
            setError(err.message);
            showNotification('Error loading your uploads', 'error');
          } else {
            showNotification('Error loading more uploads', 'error');
          }
        } finally {
          if (!append) {
            setLoading(false);
          } else {
            setIsLoadingMore(false);
          }
        }
      },
      [user, searchTerm]
    );

    useEffect(() => {
      fetchUserUploads(1, false);
    }, [fetchUserUploads]);

    useEffect(() => {
        const fetchPendingUploads = async () => {
            if (!user) return;

            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pending-lineups`, {
                    credentials: 'include'
                });
                if (!res.ok) throw new Error('Failed to fetch pending uploads');
                const data = await res.json();

                // Filter pending uploads for current user
                const userPending = data.filter(item => item.steamid === user.steamid).map(item => ({
                    id: item._id,
                    title: item.title,
                    src: item.src,
                    ...(item.src2 && { src2: item.src2 }),
                    map: item.map,
                    name: item.name,
                    desc: item.desc || '',
                    ...(item.desc2 && { desc2: item.desc2 }),
                    exp: item.exp || '',
                    side: item.side,
                    isPending: true
                }));
                setPendingItems(userPending);
            } catch (err) {
                console.error(err);
            }
        };

        fetchPendingUploads();
    }, [user]);

    useEffect(() => {
        const remaining = items.length - visibleCount;

        if (remaining <= loadMoreStep && hasMore && !isLoadingMore) {
            const nextPage = currentPage + 1;
            fetchUserUploads(nextPage, true);
        }
    }, [
        items.length,
        visibleCount,
        loadMoreStep,
        hasMore,
        isLoadingMore,
        currentPage,
        fetchUserUploads
    ]);

    const handleDeleteClick = (item) => setItemToDelete(item);
    const handleDeleteConfirmed = async (item) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user-uploads/${item.id}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) throw new Error(`Failed to delete lineup: ${res.status}`);
            setItems(prev => prev.filter(i => i.id !== item.id));
            showNotification('Lineup deleted successfully', 'success');
        } catch (err) {
            console.error(err);
            showNotification('Error deleting lineup', 'error');
        } finally {
            setItemToDelete(null);
        }
    };

    const handleLike = async (item) => {
        if (!user) return showNotification("Please login to like", 'warning');
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
            window.dispatchEvent(new Event("likedIDsUpdated"));

            setItems(prev => prev.map(i => i.id === item.id ? { ...i, likeCount: data.likeCount } : i));
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
            if (!res.ok) throw new Error(data.error || "Failed to unlike");

            // Update state for THIS page
            const newIDs = likedIDs.filter(id => id !== item.id);
            setLikedIDs(newIDs);

            setItems(prev =>
            prev.map(i => i.id === item.id ? { ...i, likeCount: data.likeCount } : i)
            );

            // ALSO update global source of truth + notify other components
            const stored = JSON.parse(localStorage.getItem("likedIDs")) || [];
            const next = stored.filter(id => id !== item.id);
            localStorage.setItem("likedIDs", JSON.stringify(next));
            window.dispatchEvent(new Event("likedIDsUpdated"));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const fetchLikedIDs = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/check-likes`, { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to fetch liked IDs');
                const data = await res.json();
                const ids = data.likedItems || [];
                setLikedIDs(ids);
                localStorage.setItem('likedIDs', JSON.stringify(ids));
                window.dispatchEvent(new Event("likedIDsUpdated"));
            } catch (err) {
                console.error(err);
                showNotification('Error loading liked items', 'error');
            }
        };

        if (cachedLikedIDs) setLikedIDs(JSON.parse(cachedLikedIDs));
        fetchLikedIDs();
    }, [cachedLikedIDs]);

    useEffect(() => {
        const onUpdate = () => {
            const ids = JSON.parse(localStorage.getItem("likedIDs")) || [];
            setLikedIDs(ids);
        };

        window.addEventListener("likedIDsUpdated", onUpdate);
        return () => window.removeEventListener("likedIDsUpdated", onUpdate);
    }, []);

    // Info button
    useEffect(() => {
    const close = () => setOpenInfoId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
    }, []);

    const getImageUrlForKey = (key, itemVisibility) => {
        const isPrivate = itemVisibility === 'private' || String(key || '').startsWith('pimages/');
        const route = isPrivate ? 'pi' : 'i';
        return `${import.meta.env.VITE_API_URL}/api/${route}?key=${encodeURIComponent(key)}`;
    };

    const getCurrentImageData = (item) => {
        const imageKeys = ['src', 'src2'].filter(k => item[k]);
        const descKeys = ['desc', 'desc2'].filter(k => item[k]);

        if (!imageKeys.length) return { image: null, description: '' };

        const currentIndex = currentImageIndices[item.id] || 0;
        const rawKey = item[imageKeys[currentIndex]];
        const baseDesc = item[descKeys[currentIndex]] || '';

        const imageUrl = getImageUrlForKey(rawKey, item.visibility);

        return { image: imageUrl, description: baseDesc };
    };

    const handleNextImage = (itemId, totalImages) => setCurrentImageIndices(prev => ({ ...prev, [itemId]: ((prev[itemId] || 0) + 1) % totalImages }));
    const handlePrevImage = (itemId, totalImages) => setCurrentImageIndices(prev => ({ ...prev, [itemId]: ((prev[itemId] || 0) - 1 + totalImages) % totalImages }));

    const toggleFavorite = (item) => {
        const isFavorite = favorites.some(f => f.id === item.id);
        const newFavs = isFavorite ? favorites.filter(f => f.id !== item.id) : [...favorites, { ...item, id: item.id }];
        setFavorites(newFavs);
        localStorage.setItem('favorites', JSON.stringify(newFavs));
    };

    const filterBySearch = (list) => {
      if (!searchTerm.trim()) return list;

      const terms = searchTerm.toLowerCase().split(/\s+/);

      return list.filter(item =>
        terms.every(term =>
          item.title?.toLowerCase().includes(term) ||
          item.map?.toLowerCase().includes(term) ||
          item.name?.toLowerCase().includes(term)
        )
      );
    };

    const filteredPendingItems =
    visibility === 'public'
        ? filterBySearch(pendingItems)
        : [];

    // Filter your saved lineups by selected visibility
    const filteredItems = items.filter(it => {
    const v = it.visibility || 'public';
    return visibility === 'private' ? v === 'private' : v !== 'private';
    });

    const visibleItems = filteredItems.slice(0, visibleCount);

    const canLoadMore = visibleCount < filteredItems.length;

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/upload-stats`, {
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Failed to fetch upload stats');

            const data = await res.json();
            setTotalUploads(data?.stats?.totalUploads || 0);
            } catch (err) {
            console.error(err);
            showNotification('Error loading upload stats', 'error');
            }
        };

        fetchStats();
    }, [user]);

    const handleLoadMore = () => {
        if (!canLoadMore) return;
        setVisibleCount(prev => prev + loadMoreStep);
    };

    useEffect(() => {
        setVisibleCount(initialLimit);
    }, [searchTerm, visibility]);

    useEffect(() => {
        setSearchDraft(searchTerm);
    }, [searchTerm]);

    if (loading && items.length === 0) {
        return (
        <div className="pt-25 text-center text-gray-500 text-sm">
            Loading your uploads...
        </div>
        );
    }

    if (error && items.length === 0) {
        return (
        <div className="pt-25 text-center text-gray-500">
            {error.includes('404') ? (
            <>
                <p>Uploads feature is currently unavailable</p>
                <p className="text-sm">(Endpoint not found)</p>
            </>
            ) : (
            <p>Error: {error}</p>
            )}
        </div>
        );
    }

    const noResults =
      visibleItems.length === 0 && filteredPendingItems.length === 0;

    return (
        <div>
        {/* Custom Delete Modal */}
        {itemToDelete && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                <div className="bg-gray-900 rounded-xl p-6 shadow-xl w-80">
                    <h2 className="text-lg font-bold mb-4 text-center">Confirm Delete</h2>
                    <p className="text-sm text-gray-300 mb-6 text-center">
                        Are you sure you want to delete <span className="text-red-400 font-semibold">"{itemToDelete.title}"</span>?
                    </p>
                    <div className="flex justify-between">
                        <button
                            onClick={() => setItemToDelete(null)}
                            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleDeleteConfirmed(itemToDelete)}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="mt-0 sm:mt-6 -mb-9 px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-10 items-center w-full">

                {/* Search */}
                <input
                    type="text"
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        setSearchTerm(searchDraft.trim());
                    }
                    }}
                    placeholder="Search your lineups by title, map, or utility..."
                    maxLength={60}
                    className="px-3 py-2 w-full max-w-lg rounded-md border-2 border-slate-700 shadow-sm focus:border-white bg-gray-900 text-gray-100"
                />
                <TabGroup
                selectedIndex={visibility === 'public' ? 0 : 1}
                onChange={(index) => setVisibility(index === 0 ? 'public' : 'private')}
                >
                    <TabList className="relative flex space-x-2 bg-gray-900 rounded-full border-2 border-slate-700 p-1 overflow-hidden">
                        {[
                        { label: 'Public', value: 'public' },
                        { label: 'Private', value: 'private' },
                        ].map((option) => (
                        <Tab key={option.value} className="relative z-10 focus:outline-none">
                            {({ selected }) => (
                            <div className="relative py-0.5 px-0.5">
                                {selected && (
                                <motion.div
                                    layoutId="tab-highlight-visibility"
                                    className="absolute inset-0 rounded-full inset-ring-2 inset-ring-slate-300"
                                    animate={{
                                    backgroundColor: option.value === 'private' ? '#f97316' : '#3b82f6',
                                    }}
                                    transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 30,
                                    backgroundColor: { duration: 0.3 },
                                    }}
                                />
                                )}
                                <span
                                className={`relative z-10 rounded-xl px-3 py-1 text-sm/6 font-semibold text-white transition-colors duration-200
                                    ${selected ? "text-white" : "text-gray-300 hover:text-white hover:bg-gray-200/30"}
                                `}
                                >
                                {option.label}
                                </span>
                            </div>
                            )}
                        </Tab>
                        ))}
                    </TabList>
                </TabGroup>
            </div>
        </div>
        {noResults ? (
        <div className="pt-10 text-center text-gray-500">
            {searchTerm.trim()
            ? 'No lineups match your search'
            : visibility === 'private'
                ? 'You have no private uploads yet'
                : 'You have no public uploads yet'}
        </div>
        ) : (
        <div className="grid grid-cols-1 min-[550px]:grid-cols-2 min-[820px]:grid-cols-3 min-[1150px]:grid-cols-4 min-[1550px]:grid-cols-5 min-[1760px]:grid-cols-6 gap-0 min-[550px]:gap-4 px-2 sm:px-0 pt-7">
            {filteredPendingItems.map(item => {
                const { image, description } = getCurrentImageData(item);
                const imageKeys = ['src', 'src2'].filter(key => item[key]);
                const hasMultipleImages = imageKeys.length > 1;
                const isFavorite = favorites.some(fav => fav.id === item.id);

                return (
                <div key={item.id} className="relative group">
                    <div className={`relative pb-12 ${item.title.length > 30 ? '' : 'top-5.5'}`}>
                        <span className="absolute font-bold pr-13">{item.title}</span>
                    </div>

                    {/* Favorite Button */}
                    <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item);
                    }}
                    className="absolute -bottom-[1px] right-0 z-10 text-yellow-400"
                    aria-label="Favorite"
                    >
                    {isFavorite ? <FaStar size={20} /> : <FaRegStar size={20} />}
                    </button>

                    {item.exp?.trim() && (
                    <div className="absolute top-6 right-1 z-50 group/info">
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

                    <div className="aspect-square relative">
                    {image && (
                        <img
                        src={image}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-md border border-gray-200"
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

                    <span className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded z-10">
                        PENDING APPROVAL
                    </span>
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 h-[32px] text-white bg-black/30 text-xs p-1 px-2 flex justify-between rounded-b-md items-center">
                    <div className="flex gap-1 flex-wrap">
                    {description
                        .replace(/Line up/gi, "Line_up")
                        .split(" ")
                        .map((word, idx) => {
                        const displayWord = word.replace(/Line_up/gi, "Line up");
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
                        <span className={`ml-2 font-bold px-1.5 py-0.5 rounded cursor-default
                            ${item.side === 'T' ? 'bg-orange-500/90' : 'bg-blue-500/90'}`}
                        >
                        {item.side}
                        </span>
                    </div>
                    </div>
                </div>
                );
            })}
            {visibleItems.map(item => {
            const { image, description } = getCurrentImageData(item);
            const imageKeys = ['src', 'src2'].filter(key => item[key]);
            const hasMultipleImages = imageKeys.length > 1;
            const isFavorite = favorites.some(fav => fav.id === item.id);

            const showLike = item.visibility !== 'private';
            const favRight = showLike ? 'right-8.5' : 'right-0';
            const trashRight = showLike ? 'right-15' : 'right-6.5'

            return (
                <div key={item.id} className="relative group pb-6">
                <div className={`relative pb-12 ${item.title.length > 30 ? '' : 'top-5.5'}`}>
                    <span className="absolute font-bold pr-13">{item.title}</span>
                </div>
                {showLike && (
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    likedIDs.includes(item.id) ? handleUnlike(item) : handleLike(item);
                    }}
                    className="absolute -bottom-[1px] right-0 z-10 text-red-500 flex items-center"
                >
                    {likedIDs.includes(item.id) ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
                    <span className="ml-1 text-xs">{item.likeCount || 0}</span>
                </button>
                )}

                <button
                onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item);
                }}
                className={`absolute -bottom-[1px] ${favRight} z-10 text-yellow-400`}
                aria-label="Favorite"
                >
                {isFavorite ? <FaStar size={20} /> : <FaRegStar size={20} />}
                </button>

                <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(item);
                }}
                className={`absolute -bottom-[0px] ${trashRight} z-10 text-gray-400 hover:text-red-500 transition-colors`}
                title="Delete this lineup"
                >
                <FaTrash size={16} />
                </button>

                {item.exp?.trim() && (
                <div className="absolute top-6 right-1 z-50 group/info">
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

                <div className="aspect-square relative">
                    {image && (
                    <img
                        src={image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-md border border-gray-200"
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
                </div>

                <div className="absolute bottom-6 left-0 right-0 h-[32px] text-white bg-black/30 text-xs p-1 px-2 flex justify-between rounded-b-md items-center">
                    <div className="flex gap-1 flex-wrap">
                    {description
                        .replace(/Line up/gi, "Line_up")
                        .split(" ")
                        .map((word, idx) => {
                        const displayWord = word.replace(/Line_up/gi, "Line up");
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
                    <span className={`ml-2 font-bold px-1.5 py-0.5 rounded cursor-default
                        ${item.side === 'T' ?
                        'bg-orange-500/90' :
                        'bg-blue-500/90'
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
        )}
        {canLoadMore && (
          <div className="text-center mt-5 mb-4">
            <button
              onClick={handleLoadMore}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading...' : 'See more'}
            </button>
          </div>
        )}
        </div>
    );
};

export default UU;