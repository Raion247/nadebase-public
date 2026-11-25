import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import useAuth from '../hooks/UA';
import { MD } from '../C/MD';
import { getLevelRGB } from '../C/LC';
import { getNameStyle } from '../C/UC';
import { useTheme } from '../C/TC';
import { Link, useNavigate } from 'react-router-dom';
import { FaTimes, FaAngleDown, FaTrophy } from "react-icons/fa";
import { HiOutlineMenu } from "react-icons/hi";
import { FaSteam } from "react-icons/fa";


export default function N() {
    const [click, setClick] = useState(false);
    const [profileDropdown, setProfileDropdown] = useState(false);
    const { user, logout, loading, checkAuth, collectionCount } = useAuth();
    const lastPhoto = localStorage.getItem("lastProfilePhoto");
    const lastDisplayName = localStorage.getItem("lastDisplayName");
    const desktopMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const isMobile = MD();
    const navigate = useNavigate();
    const [nameStyle, setNameStyle] = useState(() => {
      const cached = localStorage.getItem('nameStyle');
      return cached ? JSON.parse(cached) : { color: '#9ca3af' };
    });
    const [toolsDropdown, setToolsDropdown] = useState(false);
    const toolsRef = useRef(null);

    const nInitialX = isMobile ? 0 : 59.2;
    const nInitialY = isMobile ? -2 : -11;
    const adeInitialX = isMobile ? 0 : 60;
    const bInitialY = isMobile ? -2 : 5;
    const baseInitialX = isMobile ? 0 : -60;

    const { theme } = useTheme();
    const navBg = theme === 'light' ? 'bg-slate-800' : 'bg-[#1a1a2e]';
    const mobileBg = theme === 'light' ? 'bg-slate-900' : 'bg-[#12121f]';
    const dropdownBg = theme === 'light' ? 'bg-slate-800' : 'bg-[#1e1e30]';
    const dropdownHover = theme === 'light' ? 'hover:bg-slate-700' : 'hover:bg-[#2a2a40]';
    const dropdownBg2 = theme === 'light' ? 'bg-slate-800' : 'bg-[#1e1e30]';
    const dropdownHover2 = theme === 'light' ? 'hover:bg-slate-700' : 'hover:bg-[#2a2a40]';
    const profileHover = theme === 'light' ? 'hover:bg-slate-600/40' : 'hover:bg-[#2a2a40]';

    const handleClick = () => {
        setClick(prev => !prev);
        setProfileDropdown(false);
    };

    const toggleProfileDropdown = () => {
        setProfileDropdown(!profileDropdown);
        setToolsDropdown(false);
    }

    const handleSteamLogin = (e) => {
        e.preventDefault();

        const width = 600;
        const height = 700;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;

        const popup = window.open(
            `${import.meta.env.VITE_API_URL}/auth/steam`,
            "SteamLogin",
            `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no,location=no`
        );

        const listener = (event) => {
            const allowedOrigins = [
                "https://nadebase.com",
                "https://api.nadebase.com"
            ];

            if (!allowedOrigins.includes(event.origin)) return;

            if (event.data === "steam-auth-success") {
                try { popup?.close(); } catch {}
                window.removeEventListener("message", listener);

                // small delay so cookie/session is definitely established
                setTimeout(() => {
                    checkAuth();
                }, 250);
            }
        };

        window.addEventListener("message", listener);

        const poll = setInterval(() => {
        if (!popup || popup.closed) {
            clearInterval(poll);
            window.removeEventListener("message", listener);
            // try auth anyway in case login succeeded
            checkAuth();
        }
        }, 500);
    };

    useEffect(() => {
        if (!user) return;
        
        // Load from cache immediately
        const cached = localStorage.getItem('nameStyle');
        if (cached) setNameStyle(JSON.parse(cached));
        
        fetch(`${import.meta.env.VITE_API_URL}/api/user/colors`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                const style = getNameStyle(data.activeNameColor || 'default');
                setNameStyle(style);
                // Save to cache
                localStorage.setItem('nameStyle', JSON.stringify(style));
            })
            .catch(() => {});
    }, [user]);

    useEffect(() => {
        const handler = (e) => setNameStyle(getNameStyle(e.detail.colorId));
        window.addEventListener('nameColorChanged', handler);
        return () => window.removeEventListener('nameColorChanged', handler);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            // If click is inside either desktop or mobile profile menu, do nothing
            if (
            (desktopMenuRef.current && desktopMenuRef.current.contains(e.target)) ||
            (mobileMenuRef.current && mobileMenuRef.current.contains(e.target)) ||
            (toolsRef.current && toolsRef.current.contains(e.target))
            ) {
                return;
            }
            setProfileDropdown(false);
            setToolsDropdown(false);
        };

        const handleKey = (e) => {
            if (e.key === "Escape") setProfileDropdown(false);
        };

        // Use "click" so React's onClick stopPropagation can actually block it
        document.addEventListener("click", handleClickOutside);
        document.addEventListener("keydown", handleKey);

        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("keydown", handleKey);
        };
    }, []);

    // Mobile menu content
    const content = <>
        <div className={`md:hidden block absolute top-15 w-full left-0 right-0 ${mobileBg} z-40`}>
            <ul className="text-center text-xl p-5">
                <ul className="text-center font-mono text-xl">
                    <Link to="/" onClick={() => setClick(false)}>
                        <li className="my-auto py-4 border-b border-slate-800 hover:bg-slate-800 hover:rounded">Home</li>
                    </Link>
                    <Link to="/nades" onClick={() => setClick(false)}>
                        <li className="my-auto py-4 border-b border-slate-800 hover:bg-slate-800 hover:rounded">Nades</li>
                    </Link>
                    <Link to="/collections" onClick={() => setClick(false)}>
                        <li className="my-auto py-4 border-b border-slate-800 hover:bg-slate-800 hover:rounded">Collections</li>
                    </Link>
                    <Link to="/matches" onClick={() => setClick(false)}>
                        <li className="my-auto py-4 border-b border-slate-800 hover:bg-slate-800 hover:rounded">Matches</li>
                    </Link>
                    <Link to="/challenges" onClick={() => setClick(false)}>
                        <li className="my-auto py-4 border-b border-slate-800 hover:bg-slate-800 hover:rounded">Challenges</li>
                    </Link>
                    {user ? (
                        <div className="flex flex-col items-center my-auto py-4">
                            <div ref={mobileMenuRef} className="relative">
                                <div className="relative cursor-pointer flex items-center gap-2 px-2 py-1 rounded-lg transition-colors" onClick={toggleProfileDropdown}>
                                    <div className="relative flex">
                                        <img 
                                        src={user.photos[2].value}
                                        alt="Profile" 
                                        className="w-8 h-8 rounded-full z-1"
                                        />
                                    </div>
                                    <span
                                        className={`text-sm font-bold truncate max-w-28 ${nameStyle.className || ''}`}
                                        style={nameStyle.className ? undefined : { color: nameStyle.color }}
                                    >
                                        {user.displayName}
                                    </span>
                                    {user.level && (() => {
                                        const [r, g, b] = getLevelRGB(user.level);
                                        return (
                                        <span
                                            className="absolute bottom-[12px] right-31 text-white text-[10px] border font-bold px-1 pr-3 rounded-sm leading-tight whitespace-nowrap"
                                            style={{
                                            color: `rgb(${r},${g},${b})`,
                                            borderColor: `rgb(${r},${g},${b})`,
                                            backgroundColor: `rgba(${r},${g},${b},0.15)`,
                                            }}
                                        >
                                            {user.level}
                                        </span>
                                        );
                                    })()}
                                </div>
                                {profileDropdown && (
                                        <div 
                                        className={`absolute right-0 top-full mt-2 w-48 outline-[1.5px] outline-gray-400 ${dropdownBg} rounded-md shadow-lg z-20`}
                                        onClick={(e) => e.stopPropagation()}
                                        >
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                    setProfileDropdown(false);
                                                    setClick(false);
                                                    navigate("/profile");
                                                    }}
                                                    className={`text-sm px-4 py-2 block w-full text-left text-white hover:text-orange-400 rounded-t-md truncate border-b border-b-gray-400 ${dropdownHover}`}
                                                >
                                                    Profile
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                    setProfileDropdown(false);
                                                    setClick(false);
                                                    navigate("/mycollections");
                                                    }}
                                                className={`text-sm px-4 py-2 block w-full text-left text-white hover:text-orange-400 truncate border-b border-b-gray-400 ${dropdownHover}`}
                                                >
                                                {user ? (
                                                    <>
                                                    <span className="font-bold text-orange-400">
                                                        {collectionCount}
                                                    </span>{" "}
                                                    Saved Collection{collectionCount === 1 ? "" : "s"}
                                                    </>
                                                ) : (
                                                    "Saved Collections"
                                                )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                    setProfileDropdown(false);
                                                    setClick(false);
                                                    navigate("/profile/settings");
                                                    }}
                                                    className={`text-sm px-4 py-2 block w-full text-left text-white hover:text-orange-400 truncate border-b border-b-gray-400 ${dropdownHover}`}
                                                >
                                                    Settings
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                    setProfileDropdown(false);
                                                    setClick(false);
                                                    logout();
                                                    }}
                                                    className={`block w-full px-4 py-2 text-sm text-left text-white hover:text-orange-400 rounded-b-md ${dropdownHover}`}
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    ) : (
                        <a
                        href={`${import.meta.env.VITE_API_URL}/auth/steam`}
                        className={`flex justify-center my-auto py-4 ${dropdownHover}`}
                        onClick={() => setClick(false)}
                        >
                        <FaSteam size={18} /> <span className="relative bottom-[1px] text-sm ml-2">Steam Login</span>
                        </a>
                    )}
                </ul>
            </ul>
        </div>
    </>

    return (
        <nav className="fixed top-0 left-0 w-full z-150">
            <div className={`flex justify-between z-50 text-white px-10 lg:px-15 py-3 transition-colors duration-1000 ${navBg}`}>
                <div className="flex items-center justify-center">
                    <Link to="/"><div className="relative flex items-center justify-center">
                        <div className="flex flex-row text-3xl font-bold text-white">
                            <div className="flex flex-row">
                                <motion.span
                                initial={{ x: nInitialX, y: nInitialY }}
                                animate={{ x: [nInitialX, nInitialX, 0], y: [nInitialY, -2, -2] }}
                                transition={{ delay: 1, times: [0, 0.4, 1], duration: 1, ease: ["anticipate", "linear", "linear"] }}
                                className="overflow-visible"
                                >
                                    n
                                </motion.span>
                                <div
                                    className="flex direct relative overflow-hidden bottom-[2px]"
                                >
                                    <motion.span
                                    initial={{ x: adeInitialX }}
                                    animate={{ x: 0 }}
                                    transition={{ delay: 1.4, duration: 0.6, ease: "linear" }}
                                    >
                                    ade
                                    </motion.span>
                                </div>
                            </div>
                            <div className="flex flex-row">
                                <motion.span
                                initial={{ y: bInitialY }}
                                animate={{ y: [bInitialY, -2, -2] }}
                                transition={{ delay: 1, times: [0, 0.4, 1], duration: 1, ease: "anticipate" }}
                                className="overflow-visible"
                                >
                                    b
                                </motion.span>
                                <div
                                    className="flex direct relative overflow-hidden bottom-[2px]"
                                >
                                    <motion.span
                                    initial={{ x: baseInitialX }}
                                    animate={{ x: 0 }}
                                    transition={{ delay: 1.4, duration: 0.6, ease: "linear" }}
                                    >
                                    ase
                                    </motion.span>
                                </div>
                            </div>
                        </div>
                    </div></Link>
                </div>
                <div className={`lg:flex md:flex items-center justify-end font-normal ${click ? "hidden" : "hidden md:flex"}`}>
                    <div className="flex-10">
                        <ul className="relative flex font-mono left-5 lg:left-8 gap-8 text-[18px]">
                            <Link to="/">
                                <li className="relative mt-[4px] pb-1 border-slate-700 hover:text-orange-400 hover:drop-shadow-[0_0_6px_rgba(247,147,26,0.7)] transition-all duration-300 group translate-y-1">
                                    Home
                                    <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-orange-400 group-hover:w-full group-hover:shadow-[0_0_6px_rgba(247,147,26,0.7)] transition-all duration-300"></span>
                                </li>
                            </Link>
                            <Link to="/nades">
                                <li className="relative mt-[4px] pb-1 border-slate-700 hover:text-orange-400 hover:drop-shadow-[0_0_6px_rgba(247,147,26,0.7)] transition-all duration-300 group translate-y-1">
                                    Nades
                                    <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-orange-400 group-hover:w-full group-hover:shadow-[0_0_6px_rgba(247,147,26,0.7)] transition-all duration-300"></span>
                                </li>
                            </Link>
                            <div ref={toolsRef} className="relative flex items-center">
                                <button
                                    onClick={() => {
                                        setToolsDropdown(prev => !prev);
                                        setProfileDropdown(false);
                                    }}
                                    className="relative mb-[1px] pb-1 border-slate-700 hover:text-orange-400 hover:drop-shadow-[0_0_6px_rgba(247,147,26,0.7)] transition-all duration-300 group translate-y-1 cursor-pointer flex items-center gap-1"
                                >
                                    Hub
                                    <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-orange-400 group-hover:w-full group-hover:shadow-[0_0_6px_rgba(247,147,26,0.7)] transition-all duration-300"></span>
                                    <span className={`relative transition-transform duration-200 ${toolsDropdown ? '-rotate-180' : ''}`}>
                                        <FaAngleDown />
                                    </span>
                                </button>
                                {toolsDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                    className={`absolute right-0 top-full mt-3 w-40 outline-[1.5px] outline-gray-400 ${dropdownBg2} rounded-md shadow-lg z-20`}
                                >
                                    <Link to="/collections" onClick={() => setToolsDropdown(false)} className={`text-sm px-4 py-2 block w-full text-white hover:text-orange-400 rounded-t-md border-b border-b-gray-400 ${dropdownHover2}`}>Collections</Link>
                                    <Link to="/matches" onClick={() => setToolsDropdown(false)} className={`text-sm px-4 py-2 block w-full text-white hover:text-orange-400 border-b border-b-gray-400 ${dropdownHover2}`}>Matches</Link>
                                    <Link to="/challenges" onClick={() => setToolsDropdown(false)} className={`text-sm px-4 py-2 block w-full text-white hover:text-orange-400 border-b border-b-gray-400 ${dropdownHover2}`}>Challenges</Link>
                                    <Link to="/pro" onClick={() => setToolsDropdown(false)} className={`flex whitespace-nowrap items-center text-sm px-4 py-2 block w-full text-white hover:text-orange-400 rounded-b-md ${dropdownHover2}`}><FaTrophy size={14} className="mr-2" />Tournaments</Link>
                                </motion.div>
                                )}
                            </div>
                            <div className="w-40 -ml-4 flex items-center justify-end">
                                {user ? (
                                <div ref={desktopMenuRef} className="flex items-center gap-2 relative">
                                    <div
                                        className={`relative cursor-pointer flex items-center gap-2 px-2 py-1 pl-5 rounded-lg transition-colors duration-300 ${profileHover}`}
                                        onClick={toggleProfileDropdown}
                                    >
                                        <div className="relative flex">
                                            <img 
                                                src={user.photos[2].value} 
                                                alt="Profile" 
                                                className="relative w-8 h-8 rounded-full z-2"
                                            />
                                            {user.level && (() => {
                                                const [r, g, b] = getLevelRGB(user.level);
                                                return (
                                                    <span
                                                    className="absolute bottom-[9px] right-6 text-white text-[10px] border font-bold px-1 pr-3 rounded-sm leading-tight whitespace-nowrap"
                                                    style={{
                                                        color: `rgb(${r},${g},${b})`,
                                                        borderColor: `rgb(${r},${g},${b})`,
                                                        backgroundColor: `rgba(${r},${g},${b},0.15)`,
                                                    }}
                                                    >
                                                    {user.level}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <span
                                            className={`text-sm font-bold truncate max-w-28 ${nameStyle.className || ''}`}
                                            style={nameStyle.className ? undefined : { color: nameStyle.color }}
                                            >
                                            {user.displayName}
                                        </span>
                                    </div>
                                    {profileDropdown && (
                                        <div className={`absolute right-0 top-full mt-2 w-48 outline-[1.5px] outline-gray-400 ${dropdownBg2} rounded-md shadow-lg z-20`}>
                                            <div className="">
                                                <Link to="/profile" onClick={() => setProfileDropdown(false)} className={`text-sm px-4 py-2 block w-full text-white hover:text-orange-400 rounded-t-md truncate border-b border-b-gray-400 flex-grow ${dropdownHover2}`}>Profile</Link>
                                                <Link to="/mycollections" onClick={() => setProfileDropdown(false)} className={`text-sm px-4 py-2 block w-full text-white hover:text-orange-400 truncate border-b border-b-gray-400 flex-grow ${dropdownHover2}`}>{user ? (
                                                    <span>
                                                        <span className="font-bold text-orange-400">
                                                        {collectionCount}
                                                        </span>{" "}
                                                        Saved Collection{collectionCount === 1 ? "" : "s"}
                                                    </span>
                                                    ) : (
                                                    "Saved Collections"
                                                )}</Link>
                                                <Link to="/profile/settings" onClick={() => setProfileDropdown(false)} className={`text-sm px-4 py-2 block w-full text-white hover:text-orange-400 truncate flex-grow border-b border-b-gray-400 ${dropdownHover2}`}>Settings</Link>
                                                <button
                                                    onClick={logout}
                                                    className={`block w-full text-left cursor-pointer px-4 py-2 text-sm text-white hover:text-orange-400 rounded-b-md ${dropdownHover2}`}
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : loading ? (
                                lastPhoto ? (
                                    <div
                                    className={`relative cursor-pointer flex items-center gap-2 px-2 py-1 pl-5 rounded-lg`}
                                    >
                                    <div className="relative flex">
                                        <img src={lastPhoto} alt="Profile" className="relative w-8 h-8 rounded-full z-2" />
                                    </div>
                                    {lastDisplayName && (
                                        <span
                                        className={`text-sm font-bold truncate max-w-28 ${nameStyle.className || ''}`}
                                        style={nameStyle.className ? undefined : { color: nameStyle.color }}
                                        >
                                        {lastDisplayName}
                                        </span>
                                    )}
                                    </div>
                                ) : (
                                    <button className="h-10 items-center whitespace-nowrap backdrop-blur-md bg-blue-400/20 border border-blue-300/30 hover:bg-blue-400/35 hover:border-blue-300/50 shadow-[0_0_12px_rgba(96,165,250,0.2)] hover:shadow-[0_0_18px_rgba(96,165,250,0.35)] transition-all duration-300 rounded-md px-1 py-2 cursor-pointer">
                                        <div className="flex gap-1 opacity-50">
                                            <FaSteam size={18} />
                                            <span className="relative text-sm">Login with Steam</span>
                                        </div>
                                    </button>
                                )
                            ) : (
                                <button 
                                    onClick={handleSteamLogin}
                                    className="h-10 items-center whitespace-nowrap backdrop-blur-md bg-blue-400/20 border border-blue-300/30 hover:bg-blue-400/35 hover:border-blue-300/50 shadow-[0_0_12px_rgba(96,165,250,0.2)] hover:shadow-[0_0_18px_rgba(96,165,250,0.35)] transition-all duration-300 rounded-md px-1 py-2 cursor-pointer"
                                >
                                    {loading ? (
                                        <div style={{ width: 24, height: 24 }} />
                                    ) : (
                                    <div className="flex gap-1">
                                        <FaSteam size={18} />
                                        <span className="relative text-sm">Login with Steam</span>
                                    </div>
                                    )}
                                </button>
                            )}
                            </div>
                        </ul>
                    </div>
                </div>
                <button className="block md:hidden transition" aria-label="Menu" onClick={handleClick}>
                    {click ? <FaTimes size={24} /> : <HiOutlineMenu size={24} />}
                </button>
                
                {click && content}
            </div>
        </nav>
    )
}