import { useState, useEffect } from 'react';
import useAuth from '../hooks/UA';

const maps = ["Anubis", "Mirage", "Dust2", "Ancient", "Inferno", "Nuke", "Overpass", "Train", "Cache"];
const teams = ["T", "CT"];
const nades = ["Smoke", "Molotov", "HE", "Flash"];

export default function UF({ uploadType = 'public', currentImageIndex, isImageCropped, croppedImages, onClose, showNotification }) {
    const { user } = useAuth();
    const [selectedMap, setSelectedMap] = useState("");
    const [team, setTeam] = useState("");
    const [nadeType, setNadeType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [anonymous, setAnonymous] = useState(false);
    const [exp, setExp] = useState("");
    const movementKeys = ["W", "A", "S", "D"];
    const [selectedMovementKey, setSelectedMovementKey] = useState("");
    const [withShift, setWithShift] = useState(false);
    const throwTypes = [
        {
            id: "LMB",
            icon: (
                <svg width="45" height="23" viewBox="3 -4 24 24" fill="none">
                    <path d="M 0 15 C 0 6 0 0 15 0 C 30 0 30 6 30 15 L 30 15 L 18 15 C 18 11 18 10 15 10 C 12 10 12 11 12 15 L 0 15 L 18 15" stroke="currentColor" strokeWidth="2" />
                    <path d="M 0 15 C 0 6 0 0 15 0 L 15 10 C 12 10 12 11 12 15 L 0 15" fill="currentColor" />
                </svg>
            )
        },
        {
            id: "RMB",
            icon: (
                <svg width="45" height="23" viewBox="3 -4 24 24" fill="none">
                    <path d="M 0 15 C 0 6 0 0 15 0 C 30 0 30 6 30 15 L 30 15 L 18 15 C 18 11 18 10 15 10 C 12 10 12 11 12 15 L 0 15 L 18 15" stroke="currentColor" strokeWidth="2" />
                    <path d="M 30 15 C 30 6 30 0 15 0 L 15 10 C 18 10 18 13 18 15 L 30 15" fill="currentColor" />
                </svg>
            )
        },
        {
            id: "MMB",
            icon: (
                <svg width="45" height="23" viewBox="3 -4 24 24" fill="none">
                    <path d="M 0 15 C 0 6 0 0 15 0 C 30 0 30 6 30 15 L 30 15 L 18 15 C 18 11 18 10 15 10 C 12 10 12 11 12 15 L 0 15 L 18 15" stroke="currentColor" strokeWidth="2" />
                    <path d="M 0 15 C 0 6 0 0 14 0 L 14 10 C 12 10 12 11 12 15 L 0 15 M 16 10 C 18 10 18 11 18 15 L 30 15 C 30 6 30 0 16 0 L 16 10" fill="currentColor" />
                </svg>
            )
        },
        {
            id: "JUMP",
            icon: <span className='p-2'>JUMP</span>
        }
    ];
    const [selectedThrows, setSelectedThrows] = useState([]);
    const [withCrouch, setWithCrouch] = useState(false);
    const [customTitle, setCustomTitle] = useState("");
    const [flashTitle, setFlashTitle] = useState(false);
    const [flashThrow, setFlashThrow] = useState(false);
    const [page, setPage] = useState(1);

    const handleMovementKeySelect = (key) => {
        if (selectedMovementKey === key) {
            setSelectedMovementKey("");
            setWithShift(false);
        } else {
            setSelectedMovementKey(key);
        }
    };

    const handleShiftSelect = () => {
        if (!selectedMovementKey) {
            setWithShift(false);
            return;
        }
        setWithShift(prev => !prev);
    };

    const handleThrowSelect = (throwType) => {
        const mouseButtons = ["LMB", "RMB", "MMB"];

        setSelectedThrows(prev => {
            const mouseSelectedBefore = prev.some(t => mouseButtons.includes(t));

            // Block selecting JUMP if no mouse button is active
            if (throwType === "JUMP" && !mouseSelectedBefore) {
            return prev;
            }

            let next;

            // Toggle logic
            if (prev.includes(throwType)) {
            // deselect
            next = prev.filter(t => t !== throwType);
            } else {
            if (mouseButtons.includes(throwType)) {
                // only one mouse button at a time
                next = [
                ...prev.filter(t => !mouseButtons.includes(t)),
                throwType
                ];
            } else {
                next = [...prev, throwType];
            }
            }

            const mouseSelectedAfter = next.some(t => mouseButtons.includes(t));

            // If there is no mouse button selected anymore,
            // turn off CROUCH and remove JUMP
            if (!mouseSelectedAfter) {
            setWithCrouch(false);
            next = next.filter(t => t !== "JUMP");
            }

            return next;
        });
    };

    const handleCrouchSelect = () => {
        if (!selectedThrows.some(t => ["LMB", "RMB", "MMB"].includes(t))) {
            setWithCrouch(false);
            return;
        }
        setWithCrouch(prev => !prev);
    };

    const handleMapSelect = (map) => {
        setSelectedMap(prev => prev === map ? "" : map);
    };

    const handleTeamSelect = (t) => {
        setTeam(prev => prev === t ? "" : t);
    };

    const handleNadeTypeSelect = (nade) => {
        setNadeType(prev => prev === nade ? "" : nade);
    };

    const goNext = () => {
      const missingTitle = customTitle.length < 3;
      const missingThrow = selectedThrows.length === 0;

      if (missingTitle || missingThrow) {
            showNotification("Fill the required fields before continuing", "warning");

        if (missingTitle) {
          setFlashTitle(true);
          setTimeout(() => setFlashTitle(false), 1000);
        }
        if (missingThrow) {
          setFlashThrow(true);
          setTimeout(() => setFlashThrow(false), 1000);
        }
            return;
        }

        setPage(2);
    };

    const goBack = () => setPage(1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            showNotification("Please login first", 'warning');
            return;
        }

        setIsSubmitting(true);

        if (!isImageCropped || !croppedImages || croppedImages.length === 0) {
            showNotification("Please upload at least one image", 'warning');
            setIsSubmitting(false);
            return;
        }

        if (!selectedMap || !team || selectedThrows.length === 0 || !nadeType) {
            showNotification("Please fill all required fields", 'warning');
            setIsSubmitting(false);
            return;
        }

        // New clean description builder
        const mouseBtn = selectedThrows.find(t => ["LMB", "RMB", "MMB"].includes(t));
        const hasJump = selectedThrows.includes("JUMP");

        const tokens = [];
        if (mouseBtn) tokens.push(mouseBtn);
        if (selectedMovementKey) tokens.push(selectedMovementKey);
        if (hasJump) tokens.push("JUMP");
        if (withShift) tokens.push("SHIFT");
        if (withCrouch) tokens.push("CROUCH");

        const combinedDescription = tokens.join(" ");

        const descriptionFields = {
            description: croppedImages.length > 1 ? "LINE UP" : combinedDescription,
            description2: croppedImages.length > 1 ? combinedDescription : ""
        };

        const title = customTitle.trim() || `${nadeType}`;

        try {
            const formData = new FormData();

            for (let i = 0; i < Math.min(croppedImages.length, 2); i++) {
                const blob = await dataURLtoBlob(croppedImages[i]);
                formData.append(`image${i + 1}`, blob, `${title.replace(/\s+/g, '-')}-${i + 1}.png`);
            }

            formData.append('title', title);
            formData.append('description', descriptionFields.description);
            if (croppedImages.length > 1) {
                formData.append('description2', descriptionFields.description2);
            }
            if (exp.trim()) {
                formData.append('exp', exp.trim());
            }
            formData.append('map', selectedMap);
            formData.append('team', team);
            formData.append('nadeType', nadeType);
            formData.append('anonymous', anonymous.toString());

            const endpoint =
                uploadType === 'private'
                    ? `${import.meta.env.VITE_API_URL}/api/submit-lineup/private`
                    : `${import.meta.env.VITE_API_URL}/api/submit-lineup`;

            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save lineup');
            }

            showNotification("Lineup saved successfully!", 'success');

            setSelectedMap("");
            setTeam("");
            setCustomTitle("");
            setNadeType("");
            setSelectedMovementKey("");
            setExp("");
            setSelectedThrows([]);
            setPage(1);
            setAnonymous(false);
            if (window.refreshLineups) {
                window.refreshLineups();
            }
            if (onClose) onClose();

        } catch (error) {
            console.error("Submission error:", error);
            showNotification(error.message || "Error saving lineup", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        return () => {
            setSelectedMap("");
            setTeam("");
            setCustomTitle("");
            setNadeType("");
            setSelectedMovementKey("");
            setExp("");
            setSelectedThrows([]);
            setPage(1);
            setAnonymous(false);
        };
    }, []);

    return (
        <form
            onSubmit={handleSubmit}
            className="w-2xl mx-auto p-4 pt-18 bg-gray-700 rounded-r-2xl space-y-2 font-mono"
        >
            {/* Page indicator */}
            <div className="flex items-center justify-between mb-1">
                <div className="text-white font-semibold">Step {page} / 2</div>
                <div className="flex gap-2">
                {page === 2 && (
                    <button
                    type="button"
                    onClick={goBack}
                    className="px-3 py-1 rounded-xl border-2 border-blue-600/40 bg-blue-600/30 hover:bg-blue-500/30 text-white"
                    >
                    Back
                    </button>
                )}
                </div>
            </div>
            {/* Preview bar */}
            {(selectedMovementKey || selectedThrows.length > 0) && (
                <div className="absolute flex left-6 bottom-[81.5px] bg-black/50 w-[500px] h-[30px] px-2 text-white text-sm font-medium items-center rounded-b-sm">
                    <span className="flex items-center">
                        {croppedImages.length > 1 && currentImageIndex !== 1 ? (
                            <span className="flex items-center ml-2 mb-0.5">LINE UP</span>
                        ) : (
                            <>
                                {(() => {
                                const mouseBtn = selectedThrows.find(t => ["LMB", "RMB", "MMB"].includes(t));
                                const hasJump = selectedThrows.includes("JUMP");
                                const tailExists = withShift || withCrouch || hasJump;

                                const core = [];

                                // core part: MOUSE + MOVEMENT  (with + between)
                                if (mouseBtn) {
                                    const mouseIcon = throwTypes.find(t => t.id === mouseBtn)?.icon;
                                    core.push(
                                    <span key="mouse" className="flex items-center">
                                        {mouseIcon}
                                    </span>
                                    );
                                }
                                if (selectedMovementKey) {
                                    core.push(
                                    <span key="move" className="flex items-center">
                                        {selectedMovementKey}
                                    </span>
                                    );
                                }

                                return (
                                    <>
                                    {core.map((node, i) => (
                                        <span key={i} className="flex items-center mb-0.5">
                                        {node}
                                        {i < core.length - 1 && <span>&nbsp;+&nbsp;</span>}
                                        </span>
                                    ))}

                                    {/* if movement exists and tail exists → add one + */}
                                    {selectedMovementKey && tailExists && (
                                        <span className="flex items-center ml-1 mb-0.5">&nbsp;+&nbsp;</span>
                                    )}

                                    {/* tail part: SHIFT CROUCH JUMP (in that order, no extra +) */}
                                    {withShift && (
                                        <span className="ml-2 mb-0.5">
                                        SHIFT
                                        </span>
                                    )}

                                    {withCrouch && (
                                        <span className="ml-2 mb-0.5">
                                        CROUCH
                                        </span>
                                    )}

                                    {selectedThrows.includes("JUMP") && (() => {
                                        const jumpIcon = throwTypes.find(t => t.id === "JUMP")?.icon;
                                        return (
                                        <span className="mb-0.5 flex items-center">
                                            {jumpIcon}
                                        </span>
                                        );
                                    })()}
                                    </>
                                );
                                })()}
                            </>
                        )}
                    </span>
                </div>
            )}
            {/* PAGE 1 */}
            {page === 1 && (
            <>
                <div>
                    <div className='flex items-center font-medium'>
                        <label className={`block mb-1 font-medium transition-colors duration-150 ${flashTitle ? 'text-red-500' : 'text-white'}`}>
                            Title
                        </label>
                        <span className="text-xs text-gray-300 ml-2 mb-1">({customTitle.length}/40)</span>
                    </div>
                    <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value.slice(0, 40))}
                    placeholder="Add a descriptive title"
                    maxLength={40}
                    className="w-xs px-3 py-2 rounded border"
                    />
                </div>

                {/* Throw Type Selection */}
                <div className='mt-5'>
                    <label className={`block font-medium mb-1 transition-colors duration-150 ${flashThrow ? 'text-red-500' : 'text-white'}`}>
                    Throw Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {throwTypes.map(({ id, icon }) => {
                        const mouseSelected = selectedThrows.some(t => ["LMB", "RMB", "MMB"].includes(t));
                        const jumpDisabled = id === "JUMP" && !mouseSelected;

                        return (
                            <button
                            type="button"
                            key={id}
                            onClick={() => handleThrowSelect(id)}
                            disabled={jumpDisabled}
                            className={`px-1 py-1 rounded-full border-2 border-blue-600 transition ${
                                selectedThrows.includes(id) ? "bg-blue-500 text-white" : "bg-blue-600/10 hover:bg-blue-500/30 text-white"
                            } ${jumpDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                            {icon}
                            </button>
                        );
                        })}
                    </div>

                    <div className="flex flex-col w-fit mt-2">
                        <button
                            type="button"
                            onClick={handleCrouchSelect}
                            disabled={!selectedThrows.some(t => ["LMB", "RMB", "MMB"].includes(t))}
                            className={`px-3 py-1 rounded-full border-2 border-blue-600 transition ${withCrouch
                                ? "bg-blue-500 text-white"
                                : selectedThrows.some(t => ["LMB", "RMB", "MMB"].includes(t))
                                    ? "bg-blue-600/10 hover:bg-blue-500/30 text-white"
                                    : "opacity-50 cursor-not-allowed"
                                }`}
                        >
                            + CROUCH
                        </button>
                    </div>
                </div>

                <div className='mt-5'>
                    <label className="block font-medium mb-1 text-white">Movement</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {movementKeys.map((key) => (
                            <button
                                type="button"
                                key={key}
                                onClick={() => handleMovementKeySelect(key)}
                                className={`px-3 py-1 rounded-full border-2 border-blue-600 transition ${selectedMovementKey === key ? "bg-blue-500 text-white" : "bg-blue-600/10 hover:bg-blue-500/30 text-white"}`}
                            >
                                {key}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={handleShiftSelect}
                            disabled={!selectedMovementKey}
                            className={`px-3 py-1 rounded-full border-2 border-blue-600 transition ${withShift
                                ? "bg-blue-500 text-white"
                                : selectedMovementKey
                                    ? "bg-blue-600/10 hover:bg-blue-500/30 text-white"
                                    : "opacity-50 cursor-not-allowed"
                                }`}
                        >
                            + SHIFT
                        </button>
                    </div>
                </div>

                <div className='mt-5'>
                    <label className="block font-medium mb-1 text-white">
                    Extra description (optional)
                    <span className="text-xs text-gray-300 ml-2">({exp.length}/180)</span>
                    </label>
                    <textarea
                    value={exp}
                    onChange={(e) => setExp(e.target.value.slice(0, 180))}
                    placeholder="Anything extra: crosshair placement, timing, specifics, etc."
                    rows={3}
                    className="w-xs px-3 py-2 rounded border resize-none"
                    />
                </div>

                {/* Next button */}
                <button
                    type="button"
                    onClick={goNext}
                    className="absolute cursor-pointer bottom-6 w-76 text-white py-2 bg-blue-600/30 hover:bg-blue-500/30 border-2 border-blue-600/40 rounded-xl transition"
                >
                    Next
                </button>
            </>
        )}

        {/* PAGE 2 */}
        {page === 2 && (
            <>
                <div>
                    <label className="block font-medium mb-1 text-white">Map</label>
                    <div className="flex flex-wrap gap-2">
                        {maps.map((map) => (
                            <button
                                type="button"
                                key={map}
                                onClick={() => handleMapSelect(map)}
                                className={`px-3 py-1 rounded-full border-2 border-blue-600 transition ${selectedMap === map ? "bg-blue-500 text-white" : "bg-blue-600/10 hover:bg-blue-500/30 text-white"}`}
                            >
                                {map}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block font-medium mb-1 text-white">Team</label>
                    <div className="flex gap-2">
                        {teams.map((t) => {
                            const isSelected = team === t;
                            const selectedColor =
                                t === "T"
                                ? "bg-orange-500 text-white"
                                : "bg-blue-500 text-white";

                            return (
                                <button
                                type="button"
                                key={t}
                                onClick={() => handleTeamSelect(t)}
                                className={`px-3 py-1 rounded-full border-2 border-blue-600 transition
                                    ${isSelected ? selectedColor : ""}
                                `}
                                >
                                {t}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="block font-medium mb-1 text-white">Nade Type</label>
                    <div className="flex flex-wrap gap-2">
                        {nades.map((nade) => (
                            <button
                                type="button"
                                key={nade}
                                onClick={() => handleNadeTypeSelect(nade)}
                                className={`px-3 py-1 rounded-full border-2 border-blue-600 transition ${nadeType === nade ? "bg-blue-500 text-white" : "bg-blue-600/10 hover:bg-blue-500/30 text-white"}`}
                            >
                                {nade}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={anonymous}
                            onChange={(e) => setAnonymous(e.target.checked)}
                            className="mr-2"
                        />
                        <span className="text-white font-medium">Post anonymously</span>
                    </label>
                    <p className="text-xs text-gray-300 mt-1">
                        Your username will be hidden and displayed as "Anonymous"
                    </p>
                </div>
                {/* Submit only on page 2 */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`absolute cursor-pointer bottom-6 w-76 text-white py-2 bg-orange-400/30 hover:bg-orange-300/30 border-2 border-orange-400/40 rounded-xl transition ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-500'}`}
                >
                    {isSubmitting ? 'Saving...' : 'Submit'}
                </button>
            </>
        )}
        </form>
    );

    function dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
}