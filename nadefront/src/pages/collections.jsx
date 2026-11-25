import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '../C/TC';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/UA';
import { FaStar, FaRedo, FaPlus, FaLock } from 'react-icons/fa';
import { MdOutlinePlaylistAdd, MdOutlinePlaylistRemove, MdClose } from 'react-icons/md';
import { IoClose } from "react-icons/io5";
import { FiInfo, FiZoomIn, FiZoomOut, FiEdit2, FiEye } from "react-icons/fi";
import IC from '../C/IC';
import UF from '../C/UF';
import SC from '../C/SC';
import UP from '../C/UP';
import NC from '../C/NC';
import D from '../C/D';
import { MD } from '../C/MD';
import throwTypes from "../C/TT";
import { useNotification } from '../C/noti';

// Safe localStorage wrapper
const safeLocalStorage = {
    setItem: (key, value) => {
        try {
        localStorage.setItem(key, value);
        } catch (e) {
        console.error('LocalStorage error:', e);
        if (e.name === 'QuotaExceededError') {
            alert('Storage full - some settings may not be saved');
        }
        }
    },
    getItem: (key) => {
        try {
        return localStorage.getItem(key);
        } catch (e) {
        console.error('LocalStorage error:', e);
        return null;
        }
    }
};

const getPointFromEvent = (e) => {
  // React synthetic event -> use nativeEvent
  const evt = e?.nativeEvent || e;

  // Touch events
  if ('touches' in evt && evt.touches.length > 0) {
    return evt.touches[0];
  }
  if ('changedTouches' in evt && evt.changedTouches.length > 0) {
    return evt.changedTouches[0];
  }

  // Mouse / pointer
  return evt;
};

export default function Collections() {
    const { user, paymentInfo, loading } = useAuth();
    const canPrivateUploads =
        !!user &&
        (paymentInfo?.tier === "Supporter" ||
            (Array.isArray(paymentInfo?.activeAddons) &&
            paymentInfo.activeAddons.includes("private_uploads")));
    const isMobile = MD();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [allItems, setAllItems] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [currentImageIndices, setCurrentImageIndices] = useState(() => {
        const saved = localStorage.getItem("currentImageIndices");
        return saved ? JSON.parse(saved) : {};
    });
    const [isImageCropped, setIsImageCropped] = useState(false);
    const [addingNewImage, setAddingNewImage] = useState(false);
    const [imageData, setImageData] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [croppedImage, setCroppedImage] = useState(null);
    const [croppedImages, setCroppedImages] = useState([]);
    const [activeAction, setActiveAction] = useState({ type: null, id: null });
    const [actionStart, setActionStart] = useState({ x: 0, y: 0, data: {} });
    const [zOrderMap, setZOrderMap] = useState(() => {
        const saved = localStorage.getItem("zOrderMap");
        return saved ? JSON.parse(saved) : {};
    });
    const [showAllDescriptions, setShowAllDescriptions] = useState(() => {
        const saved = localStorage.getItem("showAllDescriptions");
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [steamUser, setSteamUser] = useState(null);
    //for upload page
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [savedCollections, setSavedCollections] = useState([]);
    const location = useLocation();
    useEffect(() => {
        if (location.state?.openUploadPopup) {
            setShowUploadTypePopup(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);
    const layoutData = location.state?.layoutData;
    const premadeSlug = location.state?.premadeSlug;
    const [premadeLayout, setPremadeLayout] = useState(null);
    const [showNamePopup, setShowNamePopup] = useState(false);
    const [pendingLayoutData, setPendingLayoutData] = useState(null);
    const [showUpgradePopup, setShowUpgradePopup] = useState(false);
    const [isUpgradePopupReady, setIsUpgradePopupReady] = useState(false);
    const [showUploadTypePopup, setShowUploadTypePopup] = useState(false);
    const [uploadType, setUploadType] = useState(null);
    const [openInfoId, setOpenInfoId] = useState(null);
    const [showClearPopup, setShowClearPopup] = useState(false);
    const [showHowTo, setShowHowTo] = useState(false);
    const HOWTO_KEY = "hasSeenDemo";
    const [mobileMode, setMobileMode] = useState("view");
    const [mobileFocusedId, setMobileFocusedId] = useState(null);
    const [selectedMobileId, setSelectedMobileId] = useState(null);
    const getNextFreeMPos = (usedSet) => {
        let p = 1;
        while (usedSet.has(p)) p++;
        return p;
    };
    const { showNotification, NotificationComponent } = useNotification();

    // Load data from localStorage
    useEffect(() => {
        const savedFavorites = JSON.parse(safeLocalStorage.getItem('favorites')) || [];
        setFavorites(savedFavorites);
        const savedImageData = JSON.parse(safeLocalStorage.getItem('imageData')) || {};
        setImageData(savedImageData);
    }, []);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "favorites") {
            const next = e.newValue ? JSON.parse(e.newValue) : [];
            setFavorites(next);
            }
        };

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    useEffect(() => {
        if (favorites.length === 0 && Object.keys(zOrderMap).length > 0) {
            setZOrderMap({});
            safeLocalStorage.setItem('zOrderMap', JSON.stringify({}));
        }
    }, [favorites.length, zOrderMap]);

    // Check steam login
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user`, {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    setIsLoggedIn(true);
                    setSteamUser(userData);
                } else {
                    setIsLoggedIn(false);
                    setSteamUser(null);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setIsLoggedIn(false);
            }
        };
        
        checkAuth();
    }, []);
    
    useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api`)
        .then((res) => res.json())
        .then((data) => {
        const transformedItems = data.items.map((item) => {
            const transformed = {
            id: item._id?.$oid || item._id,
            code: item.code,
            title: item.title,
            src: item.src,
            ...(item.src2 && { src2: item.src2 }),
            map: item.map,
            pos: item.pos,
            name: item.name,
            desc: item.desc || '',
            ...(item.desc2 && { desc2: item.desc2 }),
            side: item.side,
            };

            return transformed;
        });
        setAllItems(transformedItems);
        })
        .catch((err) => console.error('Failed to load data:', err));
    }, []);

    useEffect(() => {
    if (!premadeSlug) return;

    const run = async () => {
        try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/premade/${premadeSlug}`);
        if (!res.ok) throw new Error("Failed to fetch premade");
        const data = await res.json();
        setPremadeLayout(data.layoutData || null);
        } catch (e) {
        console.error(e);
        showNotification("Failed to load premade collection", "error");
        }
    };

    run();
    }, [premadeSlug]);

    // checks for new favourites and aligns them
    useEffect(() => {
        const updatedData = { ...imageData };
        let needsUpdate = false;

        const screenWidth = window.innerWidth;
        const imageWidth = 320; // width + margin
        const imageHeight = 320; // height + margin
        const imagesPerRow = Math.floor(screenWidth / imageWidth);
        const maxImagesBeforeStack = imagesPerRow * 2;

        favorites.forEach((item, index) => {
            if (!updatedData[item.id]) {
                const blockIndex = Math.floor(index / maxImagesBeforeStack);
                const indexInBlock = index % maxImagesBeforeStack;

                const row = Math.floor(indexInBlock / imagesPerRow);
                const col = indexInBlock % imagesPerRow;

                // offsets so each block after the first is shifted down-right
                const blockOffset = blockIndex * 10;

                if (screenWidth < imageWidth * 2) {
                    updatedData[item.id] = {
                        x: col * imageWidth + blockOffset,
                        y: row * imageHeight + 80 + blockOffset,
                        width: 200,
                        height: 200
                    };
                } else {
                    updatedData[item.id] = {
                        x: col * imageWidth + blockOffset,
                        y: row * imageHeight + 80 + blockOffset,
                        width: 300,
                        height: 300
                    };
                }

                needsUpdate = true;
            }
        });

        if (needsUpdate) {
            setImageData(updatedData);
            safeLocalStorage.setItem('imageData', JSON.stringify(updatedData));
        }
    }, [favorites]);

    // Reset positions and sizes
    const resetImages = () => {
        if (isMobile) {
            const newData = {};
            favorites.forEach((item, idx) => {
            newData[item.id] = {
                ...(imageData[item.id] || {}),
                MPos: idx + 1,
            };
            });
            setImageData(newData);
            safeLocalStorage.setItem("imageData", JSON.stringify(newData));
            return;
        }

        const screenWidth = window.innerWidth;
        const imageWidth = 320;
        const imageHeight = 320;
        const imagesPerRow = Math.floor(screenWidth / imageWidth);
        const maxImagesBeforeStack = imagesPerRow * 2;

        const newData = {};
        favorites.forEach((item, index) => {
            // which "block" of 2 rows are we in?
            const blockIndex = Math.floor(index / maxImagesBeforeStack);
            const indexInBlock = index % maxImagesBeforeStack;

            // within that block, calculate row/col like normal
            const row = Math.floor(indexInBlock / imagesPerRow);
            const col = indexInBlock % imagesPerRow;

            // offsets so each block after the first is shifted down-right
            const blockOffset = blockIndex * 10;

            if (screenWidth < imageWidth * 2) {
                newData[item.id] = {
                    x: col * imageWidth + blockOffset,
                    y: row * imageHeight + 80 + blockOffset,
                    width: 200,
                    height: 200
                };
            } else {
                newData[item.id] = {
                    x: col * imageWidth + blockOffset,
                    y: row * imageHeight + 80 + blockOffset,
                    width: 300,
                    height: 300
                };
            }
        });

        setImageData(newData);
        safeLocalStorage.setItem('imageData', JSON.stringify(newData));
    };

    const getImageUrlForKey = (key, itemVisibility) => {
        const isPrivate = itemVisibility === 'private' || String(key || '').startsWith('pimages/');
        const route = isPrivate ? 'pi' : 'i';
        return `${import.meta.env.VITE_API_URL}/api/${route}?key=${encodeURIComponent(key)}`;
    };

    useEffect(() => {
        if (!isMobile) return;
        setSelectedMobileId(null);
        setMobileFocusedId(null);
    }, [isMobile, mobileMode]);
    
    // Get current image data
    const getCurrentImageData = (item) => {
    if (!item || typeof item !== 'object') {
        return { image: null, description: '' };
    }

    const imageKeys = Object.keys(item).filter(key => key.startsWith('src'));
    const descKeys = Object.keys(item).filter(key => key.startsWith('desc'));

    if (imageKeys.length === 0) return { image: null, description: '' };

    const currentIndex = currentImageIndices[item.id] || 0;
    const rawKey = item[imageKeys[currentIndex]];

    const imageUrl = rawKey ? getImageUrlForKey(rawKey, item.visibility) : null;
    const baseDesc = item[descKeys[currentIndex]] || item.desc || '';

    return { image: imageUrl, description: baseDesc };
    };

    const getCurrentTitle = (item) => {
    if (!item || typeof item !== "object") return "";

    const titleKeys = Object.keys(item).filter((k) => k.startsWith("title"));
    const idx = currentImageIndices[item.id] || 0;

    if (titleKeys.length === 0) return item.title || item.name || "";

    return item[titleKeys[idx]] || item.title || item.name || "";
    };

    // Image navigation
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
    // Desc toggle
    const toggleAllDescriptions = () => {
        setShowAllDescriptions(prev => !prev);
    };

    // Zoom toggle
    const [zoomed, setZoomed] = useState(() => {
        const saved = safeLocalStorage.getItem("zoomed");
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        safeLocalStorage.setItem("zoomed", JSON.stringify(zoomed));
    }, [zoomed]);

    const toggleZoom = (itemId) => {
        setZoomed((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    // Title toggle
    const [hiddenTitles, setHiddenTitles] = useState(() => {
    const saved = safeLocalStorage.getItem("hiddenTitles");
    return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
    safeLocalStorage.setItem("hiddenTitles", JSON.stringify(hiddenTitles));
    }, [hiddenTitles]);

    const hideTitle = (itemId) => {
    setHiddenTitles((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    // Action handlers
    const startAction = (type, id, e) => {
        if (isMobile) return;
        e.preventDefault();
        e.stopPropagation();

        const point = getPointFromEvent(e);
        const clientX = point.clientX;
        const clientY = point.clientY;

        setActiveAction({ type, id });

        // Use functional updates to ensure we have the latest state
        const currentMaxZ = Math.max(...Object.values(zOrderMap), 0);
        const newZ = currentMaxZ + 1;

        setZOrderMap(prevZOrderMap => {
            const newZOrderMap = {
                ...prevZOrderMap,
                [id]: newZ
            };
            
            // Check if optimization is needed
            const itemCount = Object.keys(newZOrderMap).length;
            const maxAllowedZ = itemCount * 2;
            const currentMaxZ = Math.max(...Object.values(newZOrderMap), 0);
            
            if (currentMaxZ > maxAllowedZ) {
                const sortedItems = Object.keys(newZOrderMap).sort((a, b) => newZOrderMap[a] - newZOrderMap[b]);
                const optimizedZOrderMap = {};
                sortedItems.forEach((itemId, index) => {
                    optimizedZOrderMap[itemId] = index + 1;
                });
                
                localStorage.setItem("zOrderMap", JSON.stringify(optimizedZOrderMap));
                return optimizedZOrderMap;
            }
            
            localStorage.setItem("zOrderMap", JSON.stringify(newZOrderMap));
            return newZOrderMap;
        });

        // Rest of your existing code for actionStart...
        if (type === 'resize') {
            setActionStart({
                x: clientX,
                y: clientY,
                data: {
                    x: imageData[id]?.x ?? 0,
                    y: imageData[id]?.y ?? 0,
                    width: imageData[id]?.width ?? 300,
                    height: imageData[id]?.height ?? 300
                }
            });
        } else {
            setActionStart({
                x: clientX - (imageData[id]?.x || 0),
                y: clientY - (imageData[id]?.y || 0),
                data: {
                    x: imageData[id]?.x ?? 0,
                    y: imageData[id]?.y ?? 0,
                    width: imageData[id]?.width ?? 300,
                    height: imageData[id]?.height ?? 300
                }
            });
        }
    };

    const handleAction = (e) => {
        if (isMobile) return;
        e.preventDefault();
        if (!activeAction.type) return;

        const point = getPointFromEvent(e);
        const clientX = point.clientX;
        const clientY = point.clientY;
        
        const { id, type } = activeAction;
        let newData = { ...imageData[id] };
        
        if (type === 'drag') {
            newData.x = clientX - actionStart.x;
            newData.y = clientY - actionStart.y;
        } 
        else if (type === 'resize') {
            const deltaX = clientX - actionStart.x;
            const deltaY = clientY - actionStart.y;
            newData.width = Math.max(200, actionStart.data.width + deltaX);
            newData.height = Math.max(200, actionStart.data.height + deltaY);
        }
        
        setImageData(prev => ({ ...prev, [id]: newData }));
    };

    const endAction = () => {
        if (activeAction.type) {
            safeLocalStorage.setItem('imageData', JSON.stringify(imageData));
            setActiveAction({ type: null, id: null });
            document.body.style.userSelect = '';
        }
    };

    useEffect(() => {
        if (!isMobile) return;
        if (!favorites?.length) return;

        setImageData(prev => {
            const next = { ...prev };
            const used = new Set();

            // collect existing positions
            favorites.forEach(f => {
            const mp = next[f.id]?.MPos;
            if (Number.isInteger(mp) && mp > 0) used.add(mp);
            });

            let changed = false;

            // assign missing MPos
            favorites.forEach(f => {
            if (!next[f.id]) next[f.id] = {};
            const mp = next[f.id].MPos;

            if (!Number.isInteger(mp) || mp <= 0) {
                const newPos = getNextFreeMPos(used);
                used.add(newPos);
                next[f.id] = { ...next[f.id], MPos: newPos };
                changed = true;
            }
            });

            if (changed) safeLocalStorage.setItem("imageData", JSON.stringify(next));
            return next;
        });
    }, [isMobile, favorites]);

    const moveMobileToPos = (fromId, targetPos) => {
        setImageData(prev => {
            const next = { ...prev };
            if (!next[fromId]) next[fromId] = {};

            const fromPos = next[fromId].MPos;

            // find if someone is already in targetPos
            const occupantId = favorites.find(f => next[f.id]?.MPos === targetPos)?.id;

            // move
            next[fromId] = { ...next[fromId], MPos: targetPos };

            // if occupied, swap them back into fromPos (or clear if fromPos missing)
            if (occupantId && occupantId !== fromId) {
            if (!next[occupantId]) next[occupantId] = {};
            next[occupantId] = { ...next[occupantId], MPos: fromPos ?? null };
            }

            safeLocalStorage.setItem("imageData", JSON.stringify(next));
            return next;
        });

        setSelectedMobileId(null);
    };

    const onMobileCardTap = (tappedId) => {
        if (mobileMode === "view") {
            // fullscreen open/close
            setMobileFocusedId(prev => (prev === tappedId ? null : tappedId));
            return;
        }

        // EDIT MODE (your current swap/select behavior)
        if (!selectedMobileId) {
            setSelectedMobileId(tappedId);
            return;
        }

        if (selectedMobileId === tappedId) {
            setSelectedMobileId(null);
            return;
        }

        const a = selectedMobileId;
        const posB = imageData[tappedId]?.MPos;

        if (Number.isInteger(posB)) {
            moveMobileToPos(a, posB);
        } else {
            setSelectedMobileId(null);
        }
    };

    useEffect(() => {
        localStorage.setItem("showAllDescriptions", JSON.stringify(showAllDescriptions));
    }, [showAllDescriptions]);

    useEffect(() => {
        localStorage.setItem("zOrderMap", JSON.stringify(zOrderMap));
    }, [zOrderMap]);

    useEffect(() => {
        localStorage.setItem("currentImageIndices", JSON.stringify(currentImageIndices));
    }, [currentImageIndices]);

    const confirmClearBoard = () => {
        // clear UI state
        setFavorites([]);
        setImageData({});
        setZOrderMap({});
        setCurrentImageIndices({});
        setOpenInfoId(null);
        setZoomed({});

        // clear persisted state
        safeLocalStorage.setItem("favorites", JSON.stringify([]));
        safeLocalStorage.setItem("imageData", JSON.stringify({}));
        safeLocalStorage.setItem("zOrderMap", JSON.stringify({}));
        safeLocalStorage.setItem("currentImageIndices", JSON.stringify({}));
        safeLocalStorage.setItem("zoomed", JSON.stringify({}));

        showNotification("Cleared all favorites.", "info");
    };

    useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
        const handleChange = () => {
            if (mq.matches) {
            setShowForm(false);
            setShowUploadTypePopup(false);
            setUploadType(null);
            setCroppedImages([]);
            setCroppedImage(null);
            setIsImageCropped(false);
            setAddingNewImage(false);
            showNotification('Use desktop to upload images', 'info');
            }
        };
        mq.addEventListener('change', handleChange);
        return () => mq.removeEventListener('change', handleChange);
    }, []);

    // Remove favorite
    const removeFavorite = (itemId) => {
        const newFavorites = favorites.filter(fav => fav.id !== itemId);
        setFavorites(newFavorites);
        safeLocalStorage.setItem('favorites', JSON.stringify(newFavorites));
        
        setImageData(prev => {
            const newData = { ...prev };
            delete newData[itemId];
            return newData;
        });
    };

    const handleSaveCollection = async () => {
        if (!user) {
            showNotification("Please login to save collections", 'warning');
            return;
        }
        if (favorites.length === 0) {
            showNotification("Can't save an empty collection", 'error');
            return;
        }

        if (favorites.length > 25) {
            showNotification(`You can only have up to 25 favorites in a collection.`, 'error');
            return;
        }

        const hasPendingFavorites = favorites.some(fav => fav.isPending);
        if (hasPendingFavorites) {
            showNotification("You cannot save lineups that are pending approval", "error");
            return;
        }

        const collectionsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/my-collections`, {
            credentials: 'include',
        });
        const collectionsData = await collectionsResponse.json();

        const currentCount = collectionsData?.meta?.currentCount || 0;
        const limit = collectionsData?.meta?.limit || 5;

        if (currentCount >= limit) {
            showNotification(`You have reached your collection limit (${limit}). Redirecting…`, 'warning', 2000);

            navigate('/upgrade', { replace: true, state: { reason: 'collections-limit', limit } });

            return;
        }

        setPendingLayoutData({
            imageData,
            favorites: favorites.map((fav) => fav.id),
            zOrderMap,
            currentImageIndices,
            showAllDescriptions,
            zoomed,
        });
        setShowNamePopup(true);
    };
    // custom popup for saving col
    const saveCollectionToServer = async (title) => {
        setShowNamePopup(false);
        if (!pendingLayoutData) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                layoutData: pendingLayoutData,
                title,
            }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Save failed");

            showNotification(`Collection "${title}" saved!`, "success");
            fetchUserCollections();
        } catch (error) {
            console.error("Save failed:", error);
            showNotification(`Error: ${error.message}`, "error");
        } finally {
            setPendingLayoutData(null);
        }
    };

    const fetchUserCollections = async () => {
    if (!user) return;

    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/my-collections`, {
        credentials: 'include'
        });

        if (!response.ok) throw new Error("Failed to fetch collections");

        const data = await response.json();

        // Fetch favorites for each collection by ids
        const mappedCollections = await Promise.all(
        data.collections.map(async (col) => {
            const ids = col.layoutData?.favorites || [];
            const favObjs = await fetchLineupsByIds(ids);

            return {
            ...col,
            favorites: favObjs,
            imageData: col.layoutData?.imageData || {},
            zOrderMap: col.layoutData?.zOrderMap || {},
            currentImageIndices: col.layoutData?.currentImageIndices || {},
            showAllDescriptions: col.layoutData?.showAllDescriptions ?? false,
            zoomed: col.layoutData?.zoomed || {}
            };
        })
        );

        setSavedCollections(mappedCollections);
    } catch (error) {
        console.error('Failed to fetch collections:', error);
        setSavedCollections([]);
    }
    };

    const fetchLineupsByIds = async (ids) => {
        if (!ids?.length) return [];

        const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/by-ids?ids=${encodeURIComponent(ids.join(','))}`
        );

        if (!res.ok) throw new Error('Failed to fetch lineups by ids');

        const data = await res.json();

        return (data.items || []).map((item) => ({
            id: item._id?.$oid || item._id,
            code: item.code,
            title: item.title,
            src: item.src,
            ...(item.src2 && { src2: item.src2 }),
            map: item.map,
            pos: item.pos,
            name: item.name,
            desc: item.desc || '',
            ...(item.desc2 && { desc2: item.desc2 }),
            side: item.side,
            exp: item.exp || '',
            visibility: item.visibility || 'public'
        }));
    };

    const activeLayout = layoutData || premadeLayout;

    useEffect(() => {
        if (!isMobile) return;
        document.body.style.overflow = mobileFocusedId ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobile, mobileFocusedId]);

    // Load data from saved collections
    useEffect(() => {
        if (!activeLayout) return;

        const run = async () => {
            try {
            const ids = activeLayout.favorites || [];
            const mappedFavorites = await fetchLineupsByIds(ids);

            const incomingImageData = activeLayout.imageData || {};
            const incomingZOrderMap = activeLayout.zOrderMap || {};
            const incomingCurrentImageIndices = activeLayout.currentImageIndices || {};
            const incomingShowAllDescriptions = activeLayout.showAllDescriptions ?? false;
            const incomingZoomed = activeLayout.zoomed || {};

            setImageData(incomingImageData);
            setFavorites(mappedFavorites);
            setZOrderMap(incomingZOrderMap);
            setCurrentImageIndices(incomingCurrentImageIndices);
            setShowAllDescriptions(incomingShowAllDescriptions);
            setZoomed(incomingZoomed);

            // now safe to persist (because mapping is complete)
            safeLocalStorage.setItem('favorites', JSON.stringify(mappedFavorites));
            safeLocalStorage.setItem('imageData', JSON.stringify(incomingImageData));
            safeLocalStorage.setItem('zOrderMap', JSON.stringify(incomingZOrderMap));
            safeLocalStorage.setItem('currentImageIndices', JSON.stringify(incomingCurrentImageIndices));
            safeLocalStorage.setItem('showAllDescriptions', JSON.stringify(incomingShowAllDescriptions));
            safeLocalStorage.setItem('zoomed', JSON.stringify(incomingZoomed));
            } catch (e) {
            console.error('Failed to apply layoutData:', e);
            }
        };

        run();
    }, [activeLayout]);

    // Event listeners
    useEffect(() => {
        if (activeAction.type) {
            window.addEventListener('mousemove', handleAction);
            window.addEventListener('mouseup', endAction);
            window.addEventListener('touchmove', handleAction, { passive: false });
            window.addEventListener('touchend', endAction);
            window.addEventListener('touchcancel', endAction);
            return () => {
                window.removeEventListener('mousemove', handleAction);
                window.removeEventListener('mouseup', endAction);
                window.removeEventListener('touchmove', handleAction);
                window.removeEventListener('touchend', endAction);
                window.removeEventListener('touchcancel', endAction);
            };
        }
    }, [activeAction, actionStart]);

    useEffect(() => {
    let seen = false;
    try {
        seen = localStorage.getItem(HOWTO_KEY) === "true";
    } catch {
        seen = false;
    }

    if (!seen) {
        setShowHowTo(true);
    }
    }, []);

    useEffect(() => {
        const close = () => setOpenInfoId(null);
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, []);

    const isPrivateUpload = uploadType === "private";
    const showUF =
        !addingNewImage &&
        (isPrivateUpload ? croppedImages.length >= 1 : croppedImages.length >= 2);

    const showPreview =
        !addingNewImage && croppedImages.length > 0 && !showUF;

    return (
        <div className={`min-h-screen overflow-hidden relative ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`} onMouseUp={endAction} onTouchEnd={endAction}>
            <Helmet>
                <title>Nadebase – Your CS2 Utility Sandbox</title>
            </Helmet>
            <NotificationComponent />
            <D
            open={showHowTo}
            onClose={() => setShowHowTo(false)}
            storageKey={HOWTO_KEY}
            videoSrc={`${import.meta.env.VITE_API_URL}/api/v?key=videos/demo.mp4`}
            />
            {showClearPopup && (
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                onClick={() => setShowClearPopup(false)}
            >
                <div
                className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-6 w-80 text-center"
                onClick={(e) => e.stopPropagation()}
                >
                <h2 className="text-xl font-semibold mb-4 text-white">Clear board</h2>

                <p className="text-gray-300 mb-6">
                    This will remove <span className="text-red-400 font-semibold">all your favorites</span>{" "}
                    without saving.
                </p>

                <div className="flex justify-between gap-3">
                    <button
                    onClick={() => setShowClearPopup(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                    type="button"
                    >
                    Cancel
                    </button>

                    <button
                    onClick={() => {
                        confirmClearBoard();
                        setShowClearPopup(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                    type="button"
                    >
                    Clear
                    </button>
                </div>
                </div>
            </div>
            )}
            {isMobile && mobileMode === "view" && mobileFocusedId && (() => {
                const item = favorites.find(f => f.id === mobileFocusedId);
                if (!item) return null;

                const { image, description } = getCurrentImageData(item);
                const currentTitle = getCurrentTitle(item);
                const imageKeys = Object.keys(item).filter(k => k.startsWith("src"));
                const hasMultipleImages = imageKeys.length > 1;

                return (
                    <div
                    className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3"
                    onClick={() => setMobileFocusedId(null)}
                    >
                    <div
                        className="relative w-full max-w-md aspect-square bg-gray-800 rounded-xl overflow-hidden border border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* close */}
                        <button
                        className="absolute bottom-2 right-2 z-30 text-white/90 bg-black/40 rounded-full p-2"
                        onClick={() => setMobileFocusedId(null)}
                        type="button"
                        aria-label="Close"
                        >
                        <MdClose size={18} />
                        </button>

                        {/* remove fav */}
                        <button
                        onClick={() => removeFavorite(item.id)}
                        className="absolute top-2 right-2 z-30 text-yellow-400 hover:text-yellow-300"
                        type="button"
                        >
                        <FaStar size={20} />
                        </button>

                        {/* image */}
                        <img
                        src={image}
                        alt={item.name}
                        className={`w-full h-full object-cover pointer-events-none select-none transition-transform duration-200 ${
                            zoomed[item.id] ? "scale-[2]" : "scale-100"
                        }`}
                        style={{ transformOrigin: "center center" }}
                        />

                        {/* title */}
                        {currentTitle && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 max-w-[80%] px-2 py-1 rounded text-white/80 text-xs font-semibold truncate">
                            {currentTitle}
                        </div>
                        )}

                        {/* nav + zoom */}
                        {hasMultipleImages && (
                        <>
                            <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePrevImage(item.id, imageKeys.length);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full z-20"
                            type="button"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            </button>

                            <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleZoom(item.id);
                            }}
                            className="absolute left-2 top-2 bg-black/40 text-white p-1 rounded-md z-20"
                            type="button"
                            title={zoomed[item.id] ? "Zoom out" : "Zoom in"}
                            >
                            {zoomed[item.id] ? <FiZoomOut size={16} /> : <FiZoomIn size={16} />}
                            </button>

                            <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNextImage(item.id, imageKeys.length);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full z-20"
                            type="button"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            </button>
                        </>
                        )}

                        {/* description */}
                        {description && showAllDescriptions && (
                        <div className="absolute bottom-0 left-0 right-0 min-h-[40px] text-white bg-black/40 text-xs p-2 flex flex-wrap gap-2">
                            {description
                            .replace(/Line up/gi, "Line_up")
                            .split(" ")
                            .map((word, idx) => {
                                const displayWord = word.replace(/Line_up/gi, "Line up");
                                const throwType = throwTypes.find(t => t.id === displayWord);
                                return (
                                <span key={idx} className="font-bold px-2 py-1 rounded-md bg-black/20 flex items-center">
                                    {throwType ? throwType.icon : displayWord}
                                </span>
                                );
                            })}
                        </div>
                        )}
                    </div>
                    </div>
                );
            })()}
            <div> {/* Remove fixed */}
            {isMobile && (
            <div className="group relative">
                <button
                onClick={() => setMobileMode((m) => (m === "view" ? "edit" : "view"))}
                className="fixed top-[73px] md:top-[81px] right-40 z-10 text-white p-2 rounded-full shadow-lg"
                title={mobileMode === "edit" ? "Edit mode" : "View mode"}
                type="button"
                >
                {mobileMode === "edit" ? <FiEdit2 size={18} /> : <FiEye size={18} />}
                </button>
                <svg
                height="75"
                width="75"
                xmlns="http://www.w3.org/2000/svg"
                className="fixed top-14 md:top-16 right-[143px] overflow-visible pointer-events-none"
                >
                <circle
                    r="19"
                    cx="40.5"
                    cy="34"
                    fill="none"
                    stroke="gray"
                    strokeWidth={2}
                    opacity="0.3"
                />
                <path
                    className="half-arc half-arc-left"
                    d="M40.5 53 A19 19 0 0 0 40.5 15"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    style={{ filter: "url(#blueGlow)" }}
                />
                <path
                    className="half-arc half-arc-right"
                    d="M40.5 53 A19 19 0 0 1 40.5 15"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    style={{ filter: "url(#glow)" }}
                />
                </svg>
            </div>
            )}
            <div className="group relative">
            <button 
                onClick={resetImages}
                className="fixed top-18 md:top-19 right-4 z-10 text-white p-2 rounded-full shadow-lg"
                title="Reset positions and sizes"
            >
                <FaRedo size={20} />
            </button>
            <svg
                height="75"
                width="75"
                xmlns="http://www.w3.org/2000/svg"
                className="fixed top-14 md:top-15 right-0 overflow-visible pointer-events-none"
            >
                <circle
                r="19"
                cx="40.5"
                cy="34"
                fill="none"
                stroke="gray"
                strokeWidth={2}
                opacity="0.3"
                />
                <path
                className="half-arc half-arc-left"
                d="M40.5 53 A19 19 0 0 0 40.5 15"
                fill="none"
                stroke="#f7931a"
                strokeWidth={2.5}
                strokeLinecap="round"
                style={{ filter: 'url(#blueGlow)' }}
                />
                <path
                className="half-arc half-arc-right"
                d="M40.5 53 A19 19 0 0 1 40.5 15"
                fill="none"
                stroke="#f7931a"
                strokeWidth={2.5}
                strokeLinecap="round"
                style={{ filter: 'url(#glow)' }}
                />
            </svg>
            </div>
            <div className="group relative">
            <button 
                onClick={toggleAllDescriptions}
                className="fixed top-18 md:top-19 right-16 z-10 text-white px-2 py-2 rounded-full shadow-lg"
                title="Toggle all descriptions"
            >
                {showAllDescriptions ? <MdOutlinePlaylistRemove size={20} /> : <MdOutlinePlaylistAdd size={20} />}
            </button>

            <svg
                height="75"
                width="75"
                xmlns="http://www.w3.org/2000/svg"
                className="fixed top-14 md:top-15 right-12 overflow-visible pointer-events-none"
            >
                <circle r="19" cx="40.5" cy="34" fill="none" stroke="gray" strokeWidth="2" opacity="0.3" />
                <path
                d="M40.5 53 A19 19 0 0 0 40.5 15"
                className="half-arc half-arc-left"
                fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'url(#glow)' }}
                />
                <path
                d="M40.5 53 A19 19 0 0 1 40.5 15"
                className="half-arc half-arc-right"
                fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'url(#glow)' }}
                />
            </svg>
            </div>
            <div className="group relative">
            <button
                onClick={() => setShowClearPopup(true)}
                className="fixed top-18 md:top-19 right-28 z-10 text-white p-[6px] rounded-full shadow-lg"
                title="Clear board"
                type="button"
            >
                <IoClose size={24} />
            </button>

            <svg
                height="75"
                width="75"
                xmlns="http://www.w3.org/2000/svg"
                className="fixed top-14 md:top-15 right-24 overflow-visible pointer-events-none"
            >
                <circle r="19" cx="40.5" cy="34" fill="none" stroke="gray" strokeWidth="2" opacity="0.3" />
                <path
                d="M40.5 53 A19 19 0 0 0 40.5 15"
                className="half-arc half-arc-left"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ filter: "url(#glow)" }}
                />
                <path
                d="M40.5 53 A19 19 0 0 1 40.5 15"
                className="half-arc half-arc-right"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ filter: "url(#glow)" }}
                />
            </svg>
            </div>
            {user ? (
                <div className="invisible lg:visible group relative">
                <button 
                    onClick={() => setShowUploadTypePopup(true)}
                    className="invisible lg:visible fixed top-19 right-40 z-10 text-white px-2.5 py-2.5 rounded-full shadow-lg"
                    title="Add a lineup"
                >
                    <FaPlus />
                </button>
                <svg
                    height="75"
                    width="75"
                    xmlns="http://www.w3.org/2000/svg"
                    className="fixed top-15 right-36 overflow-visible pointer-events-none"
                >
                    <circle r="19" cx="40.5" cy="34" fill="none" stroke="gray" strokeWidth="2" opacity="0.3" />
                    <path
                    d="M40.5 53 A19 19 0 0 0 40.5 15"
                    className="half-arc half-arc-left"
                    fill="none" stroke="#48A860" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'url(#glow)' }}
                    />
                    <path
                    d="M40.5 53 A19 19 0 0 1 40.5 15"
                    className="half-arc half-arc-right"
                    fill="none" stroke="#48A860" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'url(#glow)' }}
                    />
                </svg>
                </div>
            ) : (
                <div className='invisible lg:visible group relative'>
                <button 
                    onClick={() => showNotification('Please login via Steam to add lineups', 'warning')}
                    className="invisible lg:visible fixed top-19 right-40 z-10 text-white px-2.5 py-2.5 rounded-full shadow-lg"
                    title="Login to add lineups"
                >
                    <FaPlus />
                </button>
                <svg
                    height="75"
                    width="75"
                    xmlns="http://www.w3.org/2000/svg"
                    className="fixed top-15 right-36 overflow-visible pointer-events-none"
                >
                    <circle r="19" cx="40.5" cy="34" fill="none" stroke="gray" strokeWidth="2" opacity="0.3" />
                    <path
                    d="M40.5 53 A19 19 0 0 0 40.5 15"
                    className="half-arc half-arc-left"
                    fill="none" stroke="#48A860" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'url(#glow)' }}
                    />
                    <path
                    d="M40.5 53 A19 19 0 0 1 40.5 15"
                    className="half-arc half-arc-right"
                    fill="none" stroke="#48A860" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'url(#glow)' }}
                    />
                </svg>
                </div>
            )}
            <SC
                onSave={handleSaveCollection} 
                user={user}
                showNotification={showNotification}
            />
            </div>
            {showNamePopup && (
                <NC
                    onClose={() => setShowNamePopup(false)}
                    onSave={saveCollectionToServer}
                />
            )}
            {showUploadTypePopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-3xl bg-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-start justify-between px-6 py-4">
                        <div className='w-[24px]'></div>
                        <h3 className="text-xl font-semibold font-mono text-white">Choose upload type</h3>
                        <button
                        onClick={() => setShowUploadTypePopup(false)}
                        className="right-0 text-slate-900 hover:text-black"
                        aria-label="Close"
                        >
                        <MdClose size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                        {/* Private card */}
                        <div className="relative border rounded-xl p-4 bg-slate-900 flex flex-col justify-between min-h-[260px]">
                            <div className="relative">
                                <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-mono font-semibold text-slate-300">Private upload</h4>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Instant</span>
                                </div>
                                <ul className="text-sm text-slate-300/80 space-y-1 ml-2">
                                <li>• Visible only to you</li>
                                <li>• Instantly available</li>
                                <li>• Fewer restrictions on content</li>
                                <li>• No Daily / Monthly limit</li>
                                <li>• Private uploads can not be shared</li>
                                </ul>
                            </div>

                            {/* disabled button */}
                            <button
                            type="button"
                            disabled={!canPrivateUploads}
                            onClick={() => {
                                if (!canPrivateUploads) {
                                showNotification("Private uploads require the Private Uploads addon (or Supporter).", "warning");
                                return;
                                }

                                setUploadType("private");
                                setShowUploadTypePopup(false);
                                setCurrentImageIndex(0);
                                setCroppedImages([]);
                                setCroppedImage(null);
                                setIsImageCropped(false);
                                setAddingNewImage(false);
                                setShowForm(true);
                            }}
                            className={`mt-4 w-full font-mono rounded-lg py-2 transition flex items-center justify-center gap-2
                                ${canPrivateUploads
                                ? "bg-slate-700 text-white hover:bg-slate-500"
                                : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                                }`}
                            >
                            {!canPrivateUploads && <FaLock className="opacity-80" />}
                            <span>{canPrivateUploads ? "Continue as Private" : "Upgrade for Private"}</span>
                            </button>
                        </div>

                        {/* Public card */}
                        <div className="border rounded-xl p-4 bg-slate-900 flex flex-col justify-between min-h-[260px]">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-mono font-semibold text-slate-200">Public upload</h4>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Reviewed</span>
                                </div>
                                <ul className="text-sm text-slate-300 space-y-1 ml-2">
                                <li>• Visible to everyone after approval</li>
                                <li>• Must follow content & formatting rules</li>
                                <li>• Approval may take some time</li>
                                <li>• Anybody can save and share your uploads</li>
                                </ul>
                            </div>

                            <button
                                onClick={() => {
                                setUploadType('public');
                                setShowUploadTypePopup(false);
                                setCurrentImageIndex(0);
                                setCroppedImages([]);
                                setCroppedImage(null);
                                setIsImageCropped(false);
                                setAddingNewImage(false);
                                setShowForm(true);
                                }}
                                className="mt-4 w-full bg-slate-700 font-mono text-white rounded-lg py-2 transition hover:bg-slate-500"
                            >
                                Continue as Public
                            </button>
                        </div>

                    </div>

                    <div className="px-6 pb-5 -mt-2">
                        <p className="text-xs text-slate-500">
                        You can not change upload type after upload. Public submissions may be edited or declined during review.
                        </p>
                    </div>
                </div>
            </div>
            )}
            {showForm && (
            <div className="fixed inset-0 z-40 flex items-center justify-center">
                <div
                className={`relative rounded-2xl shadow-2xl w-full transition-all duration-300 ${
                    showUF
                    ? "flex flex-row max-w-[920px] shadow-none"
                    : showPreview
                        ? "flex flex-row max-w-[550px] shadow-none"
                        : "max-w-md"
                }`}
                >
                    <button
                        onClick={() => {
                            setShowForm(false);
                            setCroppedImages([]);
                            setShowUploadTypePopup(false);
                            setUploadType(null);
                            setCroppedImage(null);
                            setIsImageCropped(false);
                            setAddingNewImage(false);
                            setCurrentImageIndex(0);
                        }}
                        className="absolute right-4 top-4 text-slate-900 hover:text-black cursor-pointer"
                    >
                        <MdClose size={24}/>
                    </button>
                    <IC 
                    onImageCropped={(imgs) => {
                        setCroppedImages(imgs); // Store all images
                        setCroppedImage(imgs[0]); // Current image (for backward compatibility)
                        setIsImageCropped(!!imgs.length);
                    }}
                    onAddingNewImage={(adding) => setAddingNewImage(adding)}
                    currentImageIndex={currentImageIndex}
                    setCurrentImageIndex={setCurrentImageIndex}
                    visibility={uploadType === "private" ? "private" : "public"}
                    ufOpen={showUF}
                    />
                    {showUF && (
                        <UF
                        uploadType={uploadType}
                        currentImageIndex={currentImageIndex}
                        isImageCropped={isImageCropped}
                        croppedImages={croppedImages}
                        onClose={() => {
                            setShowForm(false);
                            setCroppedImages([]);
                            setCroppedImage(null);
                            setIsImageCropped(false);
                            setAddingNewImage(false);
                            setUploadType(null);
                        }}
                        showNotification={showNotification}
                        />
                    )}
                </div>
            </div>
            )}

            <div className="relative w-full h-full mt-4 ml-4">
                {favorites.length === 0 ? (
                    <p className="flex justify-center mt-120 text-gray-500">
                        No favorites yet. Find lineups{' '}
                        <span
                            className='font-bold cursor-pointer hover:text-white transition-colors'
                            onClick={() => navigate('/nades')}
                        >
                            &nbsp;here&nbsp;
                        </span>
                        OR add your own!
                    </p>
                ) : isMobile ? (
                    (() => {
                    // build slots: 1..N (you can make it bigger if you want "empty space")
                    const slotCount = favorites.length;
                    const slots = Array.from({ length: slotCount }, (_, i) => i + 1);

                    const byPos = new Map();
                    favorites.forEach(f => {
                        const pos = imageData[f.id]?.MPos;
                        if (Number.isInteger(pos)) byPos.set(pos, f);
                    });

                    return (
                        <div className="grid grid-cols-2 -ml-4 mt-32 gap-3 pr-4 pb-6">
                        {slots.map((pos) => {
                            const item = byPos.get(pos);
                            const isEmpty = !item;

                            if (isEmpty) {
                            return (
                                <button
                                key={`slot-${pos}`}
                                type="button"
                                className={`h-44 rounded-lg border border-dashed border-gray-700 bg-gray-900/30 flex items-center justify-center text-gray-500
                                    ${selectedMobileId ? "hover:border-gray-400" : ""}
                                `}
                                onClick={() => {
                                if (mobileMode !== "edit") return;
                                if (!selectedMobileId) return;
                                moveMobileToPos(selectedMobileId, pos);
                                }}
                                >
                                <span className="text-xs">Slot #{pos}</span>
                                </button>
                            );
                            }

                            const { image, description } = getCurrentImageData(item);
                            const currentTitle = getCurrentTitle(item);
                            const imageKeys = Object.keys(item).filter(key => key.startsWith("src"));
                            const hasMultipleImages = imageKeys.length > 1;
                            const selected = selectedMobileId === item.id;

                            return (
                            <div
                                key={item.id}
                                className={`relative rounded-lg overflow-hidden border bg-gray-800 border-gray-700 ${
                                selected ? "ring-2 ring-white/60" : ""
                                }`}
                                onClick={() => onMobileCardTap(item.id)}
                            >
                                {/* remove favorite */}
                                <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFavorite(item.id);
                                }}
                                className="absolute top-2 right-2 z-30 text-yellow-400 hover:text-yellow-300"
                                >
                                <FaStar size={20} />
                                </button>

                                {/* image */}
                                <div className="w-full aspect-square relative">
                                <img
                                    src={image}
                                    alt={item.name}
                                    className={`w-full h-full object-cover pointer-events-none select-none transition-transform duration-200 ${
                                    zoomed[item.id] ? "scale-[2]" : "scale-100"
                                    }`}
                                    style={{ transformOrigin: "center center" }}
                                />
                                </div>

                                {/* title toggle (still works) */}
                                {currentTitle && (
                                <button
                                    onClick={(e) => {
                                    e.stopPropagation();
                                    hideTitle(item.id);
                                    }}
                                    type="button"
                                    className={`absolute top-1 left-1/2 -translate-x-1/2 z-30 max-w-[60%] px-1 h-7 rounded-md flex items-center justify-center ${
                                        showAllDescriptions ? "border border-white/70" : ""
                                    }`}
                                    title={hiddenTitles[item.id] ? "Click to show title" : "Click to hide title"}
                                >
                                    <span
                                    className={`block text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${
                                        hiddenTitles[item.id] ? "opacity-0" : "text-white/70 opacity-100"
                                    }`}
                                    >
                                    {currentTitle}
                                    </span>
                                </button>
                                )}

                                {/* nav + zoom buttons (still work) */}
                                {hasMultipleImages && (
                                <>
                                    <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrevImage(item.id, imageKeys.length);
                                    }}
                                    className={`absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full z-20 hover:bg-black/70 ${
                                        showAllDescriptions ? "" : "opacity-0"
                                    }`}
                                    >
                                    {/* left chevron */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    </button>

                                    <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleZoom(item.id);
                                    }}
                                    className={`absolute left-2 top-2 bg-black/30 text-white p-1 rounded-sm z-20 hover:bg-black/50 ${
                                        showAllDescriptions ? "" : "opacity-0"
                                    }`}
                                    title={zoomed[item.id] ? "Zoom out" : "Zoom in"}
                                    type="button"
                                    >
                                    {zoomed[item.id] ? <FiZoomOut size={14} /> : <FiZoomIn size={14} />}
                                    </button>

                                    <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNextImage(item.id, imageKeys.length);
                                    }}
                                    className={`absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full z-20 hover:bg-black/70 ${
                                        showAllDescriptions ? "" : "opacity-0"
                                    }`}
                                    >
                                    {/* right chevron */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                    </button>
                                </>
                                )}

                                {/* description (still works) */}
                                {description && showAllDescriptions && (
                                <div className="absolute bottom-0 left-0 right-0 h-[32px] text-white bg-black/30 text-xs p-1 px-2 flex rounded-b-md items-center gap-2">
                                    {description
                                    .replace(/Line up/gi, "Line_up")
                                    .split(" ")
                                    .map((word, idx) => {
                                        const displayWord = word.replace(/Line_up/gi, "Line up");
                                        const throwType = throwTypes.find(t => t.id === displayWord);
                                        return (
                                        <span key={idx} className="font-bold h-[22px] px-2 py-1 outline-1 outline-gray-300 rounded-md flex items-center">
                                            {throwType ? throwType.icon : displayWord}
                                        </span>
                                        );
                                    })}
                                </div>
                                )}
                            </div>
                            );
                        })}
                        </div>
                    );
                    })()                
                ) : (
                    favorites.map((item) => {
                        const { image, description } = getCurrentImageData(item);
                        const currentTitle = getCurrentTitle(item);
                        const imageKeys = Object.keys(item).filter(key => key.startsWith('src'));
                        const hasMultipleImages = imageKeys.length > 1;
                        const fallback = { x: 0, y: 0, width: 300, height: 300 };
                        const data = { ...fallback, ...imageData[item.id] };

                        return (
                            <div
                                key={item.id}
                                className="absolute group"
                                style={{
                                    left: `${data.x}px`,
                                    top: `${data.y}px`,
                                    width: `${data.width}px`,
                                    height: `${data.height}px`,
                                    zIndex: zOrderMap[item.id] || 1,
                                    transform: activeAction.id === item.id ? 'scale(1.01)' : 'none',
                                    transition: activeAction.id === item.id ? 'none' : 'transform 0.1s ease, left 0.2s ease, top 0.2s ease, width 0.2s ease, height 0.2s ease'
                                }}
                            >
                                {/* Info tooltip */}
                                {item.exp && (
                                    <div className="absolute top-[11px] right-8 z-30 group/info">
                                        <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenInfoId(prev => (prev === item.id ? null : item.id));
                                        }}
                                        className="text-gray-300 hover:text-white"
                                        >
                                        <FiInfo size={18} />
                                        </button>

                                        <div
                                        className={`
                                            pointer-events-none absolute right-0 mt-2 w-56
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
                                <div 
                                    className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700 select-none"
                                >
                                    {/* Drag handle (entire image except resize area) */}
                                    {!isMobile && (
                                    <div 
                                        className="absolute inset-0 cursor-move"
                                        style={{
                                            right: '12px',
                                            bottom: '12px'
                                        }}
                                        onMouseDown={(e) => startAction('drag', item.id, e)}
                                        onTouchStart={(e) => startAction('drag', item.id, e)}
                                    />
                                    )}
                                    
                                    {/* Favorite Star */}
                                    <button 
                                        onClick={() => removeFavorite(item.id)}
                                        className="absolute top-2 right-2 z-30 text-yellow-400 hover:text-yellow-300"
                                    >
                                        <FaStar size={20} />
                                    </button>
                                    
                                    {/* Image */}
                                    <img
                                    src={image}
                                    alt={item.name}
                                    className={`w-full h-full object-cover pointer-events-none select-none transition-transform duration-200 ${
                                        zoomed[item.id] ? "scale-[2]" : "scale-100"
                                    }`}
                                    style={{ transformOrigin: "center center" }}
                                    />

                                    {currentTitle && (
                                    <button
                                        onClick={(e) => {
                                        e.stopPropagation();
                                        hideTitle(item.id); // toggles
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        type="button"
                                        className="absolute top-1 left-1/2 -translate-x-1/2 z-90
                                        max-w-[50%]
                                        w-[50%] md:w-auto
                                        h-7
                                        px-2
                                        rounded-md
                                        flex items-center justify-center
                                        outline outline-1 outline-transparent
                                        hover:outline-white/60
                                        transition-[outline-color] duration-150
                                        pointer-events-auto"
                                        title={hiddenTitles[item.id] ? "Click to show title" : "Click to hide title"}
                                    >
                                        {/* Keep space even when hidden */}
                                        <span
                                        className={`block text-xs font-semibold
                                            whitespace-nowrap overflow-hidden text-ellipsis
                                            ${hiddenTitles[item.id] ? "opacity-0" : "text-white/50 opacity-100"}`}
                                        >
                                        {currentTitle}
                                        </span>
                                    </button>
                                    )}
                                    
                                    {/* Navigation Arrows */}
                                    {hasMultipleImages && (
                                        <>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePrevImage(item.id, imageKeys.length);
                                                }}
                                                className={`absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full z-20 hover:bg-black/70
                                                    ${
                                                    isMobile
                                                        ? (showAllDescriptions ? '' : 'opacity-0')
                                                        : 'opacity-0 group-hover:opacity-100 transition-opacity'
                                                    }
                                                `}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleZoom(item.id);
                                                }}
                                                className={`absolute left-2 top-2 bg-black/30 text-white p-1 rounded-sm z-20 hover:bg-black/50
                                                    ${
                                                    isMobile
                                                        ? (showAllDescriptions ? '' : 'opacity-0')
                                                        : 'opacity-0 group-hover:opacity-100 transition-opacity'
                                                    }
                                                `}
                                                title={zoomed[item.id] ? "Zoom out" : "Zoom in"}
                                                type="button"
                                                >
                                                {zoomed[item.id] ? (
                                                    <FiZoomOut size={14}/>
                                                ) : (
                                                    <FiZoomIn size={14} />
                                                )}
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleNextImage(item.id, imageKeys.length);
                                                }}
                                                className={`absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full z-20 hover:bg-black/70
                                                    ${
                                                    isMobile
                                                        ? (showAllDescriptions ? '' : 'opacity-0')
                                                        : 'opacity-0 group-hover:opacity-100 transition-opacity'
                                                    }
                                                `}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                    
                                    {/* Description */}
                                    {description && showAllDescriptions && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[32px] text-white bg-black/30 text-xs p-1 px-2 flex rounded-b-md items-center gap-2">
                                        {description
                                        .replace(/Line up/gi, "Line_up")
                                        .split(" ")
                                        .map((word, idx) => {
                                            const displayWord = word.replace(/Line_up/gi, "Line up");
                                            const throwType = throwTypes.find(t => t.id === displayWord);

                                            return (
                                            <span
                                                key={idx}
                                                className="font-bold h-[22px] px-2 py-1 outline-1 outline-gray-300 rounded-md flex items-center"
                                            >
                                                {throwType ? throwType.icon : displayWord}
                                            </span>
                                            );
                                        })}
                                    </div>
                                    )}
                                    
                                    {/* Resize Handle */}
                                    {!isMobile && (
                                    <div
                                        onMouseDown={(e) => {
                                            // ensure resize start doesn't trigger parent drag
                                            e.stopPropagation();
                                            startAction('resize', item.id, e);
                                        }}
                                        onTouchStart={(e) => {
                                            e.stopPropagation();
                                            startAction('resize', item.id, e);
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
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur result="coloredBlur" stdDeviation="3" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
            </filter>
        </defs>
        </svg>
        </div>
    );
}