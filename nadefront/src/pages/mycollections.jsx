import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import useAuth from "../hooks/UA";
import { useNotification } from "../C/noti";
import { useTheme } from '../C/TC';
import AuthContext from "../C/AC";

export default function MC() {
    const [collections, setCollections] = useState([]);
    const { user } = useAuth();
    const { theme } = useTheme();
    const bonus = getLevelBonus(user?.level || 1);
    const { paymentInfo } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState(null);
    const activeAddons = paymentInfo?.activeAddons || [];
    const hasCollectionsAddon = activeAddons.includes("save_collections");
    const { showNotification, NotificationComponent } = useNotification();

    function getLevelBonus(level) {
        if (level >= 100) return { daily: 5, monthly: 15, collections: 5 };
        if (level >= 75) return { daily: 3, monthly: 10, collections: 3 };
        if (level >= 50) return { daily: 2, monthly: 5, collections: 2 };
        if (level >= 25) return { daily: 1, monthly: 2, collections: 1 };
        return { daily: 0, monthly: 0, collections: 0 };
    }

    const getAllowedSlots = () => {
        if (paymentInfo?.tier === "Supporter") return 50 + bonus.collections;
        if (hasCollectionsAddon) return 50 + bonus.collections;
        return 5 + bonus.collections;
    };

    const getDisplaySlots = () => {
        if (paymentInfo?.tier === "Supporter") return 50 + bonus.collections;
        if (hasCollectionsAddon) return 50 + bonus.collections;
        return 20 + bonus.collections;
    };

    const fetchCollections = async () => {
        if (!user) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/my-collections`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch collections");
            const data = await res.json();

            setCollections(
                data.collections.map((col) => ({
                    _id: col._id,
                    title: col.title,
                    layoutData: col.layoutData,
                }))
            );
        } catch (err) {
            console.error(err);
            setCollections([]);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, [user]);

    const openCollection = (collection, locked) => {
        if (locked) return; // prevent interaction
        navigate("/collections", {
            state: {
                title: collection.title,
                layoutData: collection.layoutData,
            },
        });
    };

    const deleteCollection = async (_id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/collections/${_id}`, {
                method: "DELETE",
                credentials: "include",
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Delete failed");

            setCollections((prev) => prev.filter((col) => col._id !== _id));
            showNotification("Collection deleted!", "success");
        } catch (err) {
            console.error(err);
            showNotification(`Error deleting collection: ${err.message}`, "error");
        }
    };

    const allowedSlots = getAllowedSlots();
    const totalSlots = getDisplaySlots();

    // Fill display up to totalSlots, showing all collections first
    const slots = Array.from({ length: totalSlots }, (_, i) => collections[i] || null);

    return (
        <div className={`min-h-screen text-white ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
            <NotificationComponent />
            <div className="max-w-[110rem] mx-auto md:px-5 pt-25 font-mono">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6 ml-10">My Collections</h1>
                <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-2 sm:px-0">
                    {slots.map((slot, i) => {
                        const slotNumber = i + 1;
                        const isLocked = slotNumber > allowedSlots;

                        if (slot) {
                            const totalItems = slot.layoutData?.favorites?.length || 0;

                            return (
                                <li
                                    key={slot._id}
                                    className={`relative flex justify-between items-center p-2 border rounded 
                                        ${
                                            isLocked
                                                ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                                                : "border-gray-700 hover:bg-slate-800 cursor-pointer"
                                        }`}
                                    onClick={() => openCollection(slot, isLocked)}
                                >
                                    <span className="flex flex-col">
                                        <span className="font-semibold">{slot.title}</span>
                                        <span className="text-gray-400 text-sm">
                                            {totalItems} {totalItems === 1 ? "lineup" : "lineups"}
                                        </span>
                                    </span>

                                    {!isLocked && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCollectionToDelete(slot);
                                                setShowDeletePopup(true);
                                            }}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                        >
                                            Delete
                                        </button>
                                    )}

                                    {isLocked && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded pointer-events-none">
                                        <div className="flex items-center gap-2 text-gray-300 backdrop-blur-sm px-3 py-1 rounded-lg bg-black/40">
                                            <FaLock />
                                            <span className="text-sm">Locked - Upgrade to access</span>
                                        </div>
                                    </div>
                                    )}
                                </li>
                            );
                        }

                        return (
                            <li
                                key={`slot-${i}`}
                                className={`flex justify-center items-center p-4 border border-gray-700 rounded ${
                                    i + 1 > allowedSlots
                                        ? "bg-gray-800 text-gray-500"
                                        : "bg-gray-700 text-gray-300"
                                }`}
                            >
                                {i + 1 > allowedSlots ? (
                                    <span className="flex items-center gap-2">
                                        <FaLock /> Upgrade to unlock
                                    </span>
                                ) : (
                                    <span className="text-xs sm:text-base">Empty Slot</span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
            {showDeletePopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 border-gray-700 rounded-lg shadow-xl p-6 w-80 text-center">
                        <h2 className="text-xl font-semibold mb-4">Delete Collection</h2>

                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete{" "}
                            <span className="text-red-400 font-semibold">
                                {collectionToDelete?.title}
                            </span>
                            ?
                        </p>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setShowDeletePopup(false)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={async () => {
                                    await deleteCollection(collectionToDelete._id);
                                    setShowDeletePopup(false);
                                    setCollectionToDelete(null);
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
