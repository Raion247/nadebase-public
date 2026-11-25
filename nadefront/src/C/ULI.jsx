import { useState, useEffect } from 'react';
import { FaHeart, FaStar, FaRegStar } from 'react-icons/fa';
import { MD } from '../C/MD';
import throwTypes from "../C/TT";

const ULI = ({ showNotification, count }) => {
    const isMobile = MD();
    const [likedItems, setLikedItems] = useState([]);
    const [unlikedItems, setUnlikedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentImageIndices, setCurrentImageIndices] = useState({});
    const [favorites, setFavorites] = useState([]);

    // Fetch liked items from backend
    useEffect(() => {
        const cached = sessionStorage.getItem('likedItems');
        if (cached) {
            setLikedItems(JSON.parse(cached));
            setLoading(false); // stop loading immediately
            // still optionally fetch in background to update cache
            fetchLikedItems(false); 
        } else {
            fetchLikedItems(true); // no cache, show loading
        }

        async function fetchLikedItems(showLoading = true) {
            if (showLoading) setLoading(true);
            try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/find-likes`, {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to fetch liked items');

            const data = await response.json();
            setLikedItems(data.likedItems || []);
            const savedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
            setFavorites(savedFavorites);
            } catch (err) {
            console.error('Error fetching liked items:', err);
            showNotification('Error loading liked items', 'error');
            } finally {
            setLoading(false);
            }
        }
    }, [showNotification]);

    const handleUnlike = async (item) => {
        if (unlikedItems.includes(item.id)) return;

        try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/unlike`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineupId: item.id }),
            credentials: 'include',
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to unlike');
        }

        const data = await response.json();

        const stored = JSON.parse(localStorage.getItem("likedIDs")) || [];
        const newIDs = stored.filter(id => id !== item.id);
        localStorage.setItem("likedIDs", JSON.stringify(newIDs));
        window.dispatchEvent(new Event("likedIDsUpdated"));

        // Remove from likedItems
        const updatedLiked = likedItems.filter((i) => i.id !== item.id);
        setLikedItems(updatedLiked);

        // Mark as permanently unliked
        setUnlikedItems((prev) => [...prev, item.id]);

        showNotification('Removed from your likes', 'success');
        } catch (err) {
        console.error('Error unliking item:', err);
        showNotification(err.message, 'error');
        }
    };

    const toggleFavorite = (item) => {
        const isFavorite = favorites.some((fav) => fav.id === item.id);

        if (isFavorite) {
            const newFavorites = favorites.filter((fav) => fav.id !== item.id);
            setFavorites(newFavorites);
            localStorage.setItem('favorites', JSON.stringify(newFavorites));
        } else {
            if (favorites.length >= 25) {
                showNotification('You can only have up to 25 favorites.', 'warning');
                return;
            }
            const newFavorite = { ...item };
            const newFavorites = [...favorites, newFavorite];
            setFavorites(newFavorites);
            localStorage.setItem('favorites', JSON.stringify(newFavorites));
        }
    };

    const getCurrentImageData = (item) => {
        const imageKeys = ['src', 'src2'].filter((key) => item[key]);
        const descKeys = ['desc', 'desc2'].filter((key) => item[key]);

        if (imageKeys.length === 0) return { image: null, description: '' };

        const currentIndex = currentImageIndices[item.id] || 0;
        const rawKey = item[imageKeys[currentIndex]];
        const baseDesc = item[descKeys[currentIndex]] || '';

        const imageUrl = `${import.meta.env.VITE_API_URL}/api/i?key=${encodeURIComponent(rawKey)}`;

        return { image: imageUrl, description: baseDesc };
    };

    const handlePrevImage = (itemId, totalImages) => {
        setCurrentImageIndices((prev) => ({
        ...prev,
        [itemId]: ((prev[itemId] || 0) - 1 + totalImages) % totalImages,
        }));
    };

    const handleNextImage = (itemId, totalImages) => {
        setCurrentImageIndices((prev) => ({
        ...prev,
        [itemId]: ((prev[itemId] || 0) + 1) % totalImages,
        }));
    };

    return (
        <div>

        {/* Liked Items Grid */}
        {loading ? (
        <div className="pt-5 sm:pt-10 text-center text-gray-500 text-sm">Loading liked items...</div>
        ) : likedItems.length === 0 ? (
        <div className="pt-5 sm:pt-10 text-center text-gray-500">You have no liked items yet</div>
        ) : (
        <div className="grid grid-cols-1 min-[550px]:grid-cols-2 min-[820px]:grid-cols-3 min-[1150px]:grid-cols-4 min-[1550px]:grid-cols-5 min-[1760px]:grid-cols-6 gap-0 sm:gap-4 px-2 pt-2 sm:pt-7">
            {likedItems.map((item) => {
            const { image, description } = getCurrentImageData(item);
            const imageKeys = ['src', 'src2'].filter((key) => item[key]);
            const hasMultipleImages = imageKeys.length > 1;
            const isFavorite = favorites.some((fav) => fav.id === item.id);

            return (
                <div key={item.id} className="relative group">
                <div className={`relative pb-12 ${item.title.length > 25 ? '' : 'top-5.5'}`}>
                    <span className="absolute font-bold pr-13">{item.title}</span>
                </div>

                {/* Unlike Button */}
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    handleUnlike(item);
                    }}
                    disabled={unlikedItems.includes(item.id)}
                    className={`absolute top-6.5 right-0 z-10 flex items-center ${
                    unlikedItems.includes(item.id) ? 'text-gray-500 cursor-not-allowed' : 'text-red-500'
                    }`}
                >
                    <FaHeart size={18} />
                    <span className="ml-1 text-xs">{item.likeCount || 0}</span>
                </button>

                {/* Favorite Button */}
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item);
                    }}
                    className="absolute top-6 right-8.5 z-10 text-yellow-400"
                    aria-label="Favorite"
                >
                    {isFavorite ? <FaStar size={20} /> : <FaRegStar size={20} />}
                </button>

                {/* Image */}
                <div className="aspect-square relative">
                    {image && (
                    <img
                        src={image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-md border border-gray-200"
                    />
                    )}

                    {/* Multiple Image Arrows */}
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
                            <path
                            fillRule="evenodd"
                            d="M12.293 4.293a1 1 0 010 1.414L8.414 10l3.879 4.293a1 1 0 01-1.415 1.414l-4.586-5.071a1 1 0 010-1.414l4.586-5.071a1 1 0 011.415 0z"
                            clipRule="evenodd"
                            />
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
                            <path
                            fillRule="evenodd"
                            d="M7.707 4.293a1 1 0 000 1.414L11.586 10l-3.879 4.293a1 1 0 001.415 1.414l4.586-5.071a1 1 0 000-1.414l-4.586-5.071a1 1 0 00-1.415 0z"
                            clipRule="evenodd"
                            />
                        </svg>
                        </button>
                    </>
                    )}
                </div>

                {/* Description and Side */}
                <div className="absolute bottom-0 left-0 right-0 h-[32px] text-white bg-black/30 text-xs p-1 px-2 flex justify-between rounded-b-md items-center">
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
                            className="truncate font-extrabold text-[12px] h-[22px] outline-1 outline-gray-300 px-2 py-1 mr-1 rounded-md flex items-center"
                            >
                            {throwType ? throwType.icon : displayWord}
                            </span>
                        );
                        })}
                    </div>
                    <div className="flex items-center">
                    <span
                        className={`ml-2 font-bold px-1.5 py-0.5 rounded ${
                        item.side === 'T' ? 'bg-orange-500/90' : 'bg-blue-500/90'
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
        </div>
    );
};

export default ULI;
