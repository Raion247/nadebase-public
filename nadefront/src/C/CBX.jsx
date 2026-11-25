import { motion } from "motion/react";
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useNotification } from '../C/noti';
import { useTheme } from '../C/TC';
import '../index.css';
import useAuth from '../hooks/UA';

export default function CBX() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const { showNotification, NotificationComponent } = useNotification();
    const [messages, setMessages] = useState([
        {
        id: 1,
        text: (
            <>
            <span className="text-amber-200 font-bold"><span className="relative -top-[1px]">[<span className="relative top-[1px]">T</span>]</span>
                <span className="relative top-[3px] p-1 text-green-400 font-bold text-3xl">•</span>GOFASTLOSE  
            </span>
            <span className="text-green-500 font-bold"> @T Start</span>: Can any of you insta smoke?
            </>
        ),
        delay: 1
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const botRef = useRef(null);
    const getUsername = () => {
        if (user) {
            return user.displayName || "You"; // Use Steam display name if available
        }
        return "You";
    };

    // automatic messages
    useEffect(() => {
        const timers = [
            setTimeout(() => {
                setMessages(prev => [
                    {
                        id: 2,
                        text: (
                            <>
                            <span className="text-amber-200 font-bold"><span className="relative -top-[1px]">[<span className="relative top-[1px]">T</span>]</span>
                                <span className="relative top-[3px] p-1 text-blue-300 font-bold text-3xl">•</span>{getUsername()}
                            </span>
                            <span className="text-green-500 font-bold"> @T Start</span>: Actually... I can!
                            </>
                        ),
                        delay: 0
                    },
                    ...prev
                ]);
            }, 3500),
            
            setTimeout(() => {
                setMessages(prev => [
                    {
                        id: 3,
                        text: (
                            <>
                            <span className="text-amber-200 font-bold"><span className="relative -top-[1px]">[<span className="relative top-[1px]">T</span>]</span>
                                <span className="relative top-[3px] p-1 text-blue-300 font-bold text-3xl">•</span>{getUsername()}
                            </span>
                            <span className="text-green-500 font-bold"> @T Start</span>: and I don't even have to remember it
                            </>
                        ),
                        delay: 0
                    },
                    ...prev
                ]);
            }, 6000)
        ];

        return () => timers.forEach(timer => clearTimeout(timer));
    }, [user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const trimmed = inputValue.trim().toLowerCase();

        if (trimmed === 'dark') {
            setTheme('dark');
            setInputValue('');
            setMessages(prev => [{
            id: Date.now(),
            text: <span className="text-gray-400 text-xs italic">Dark mode enabled.</span>,
            delay: 0
            }, ...prev]);
            return;
        }

        if (trimmed === 'light') {
            setTheme('light');
            setInputValue('');
            setMessages(prev => [{
            id: Date.now(),
            text: <span className="text-gray-400 text-xs italic">Light mode enabled.</span>,
            delay: 0
            }, ...prev]);
            return;
        }

        const newMessage = {
        id: Date.now(),
        text: (
            <>
            <span className="text-amber-200 font-bold"><span className="relative -top-[1px]">[<span className="relative top-[1px]">T</span>]</span>
                <span className="relative top-[3px] p-1 text-blue-300 font-bold text-3xl">•</span>{getUsername()} 
            </span>
            <span className="text-green-500 font-bold"> @T Start</span>: {inputValue}
            </>
        ),
        delay: 0
        };

        setMessages([newMessage, ...messages]);
        setInputValue('');
    };

    return (
        <div className="relative w-full h-175 lg:h-125 -top-8 sm:top-2 md:top-6 lg:top-17 flex flex-col-reverse lg:flex-row items-center justify-center px-6 md:px-25">
            <div className="relative top-10 lg:-top-2 h-fit w-full lg:max-w-3xl text-center lg:text-left">
                <h1 className="text-2xl sm:text-4xl font-mono font-bold min-w-fit">
                    <span className="whitespace-nowrap">Manage Your</span>{" "}
                    <span className="whitespace-nowrap">CS2 Utility</span>{" "}
                    <span className="whitespace-nowrap">Better than Ever</span>
                </h1>
                <h2 className="text-sm sm:text-lg text-white/70 font-mono mt-5">
                    <span className="sm:whitespace-nowrap">Fully utilize your second monitor</span>{" "}
                    <span className="sm:whitespace-nowrap">or your mobile device.</span>{" "}
                    <span className="sm:whitespace-nowrap">Nadebase was designed to fit all map based</span>{" "}
                    <span className="sm:whitespace-nowrap">utility on to one screen.</span>{" "}
                    <span className="sm:whitespace-nowrap">No more memorizing</span>{" "}
                    <span className="sm:whitespace-nowrap">lineups or Alt-Tabbing!</span>
                </h2>
                <div className="relative inline-block group">
                <svg
                    viewBox="-1 1.2 74 16"
                    className="absolute top-0 left-0 w-full h-full overflow-visible"
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
                    viewBox="-1 1.2 74 16"
                    className="absolute top-0 left-0 w-full h-full overflow-visible"
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
                    onClick={() => navigate('/nades')}
                    className="relative mt-5 px-4 py-2 text-sm sm:text-base text-white font-semibold rounded-xl transition-all duration-500 group-hover:text-orange-400 group-hover:drop-shadow-[0_0_6px_rgba(247,147,26,0.7)] cursor-pointer"
                >
                    Start Collecting
                </button>
            </div>
            <div className="relative inline-block group">
                <svg
                    viewBox="-6 1.2 74 16"
                    className="absolute top-0 left-0 w-full h-full overflow-visible"
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
                    className="absolute top-0 left-0 w-full h-full overflow-visible"
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
                    onClick={() => {
                        if (user) {
                        navigate('/collections', { state: { openUploadPopup: true } });
                        } else {
                        showNotification('Please login via Steam to add lineups', 'warning');
                        }
                    }}
                    className="mt-5 ml-5 px-4 py-2 text-sm sm:text-base text-white font-semibold rounded-xl transition-all duration-500 group-hover:text-orange-400 group-hover:drop-shadow-[0_0_6px_rgba(247,147,26,0.7)] cursor-pointer"
                    >
                    Add a lineup
                </button>
                </div>
            </div>
            <div className="relative w-[200px]"></div>
            <div className='relative flex p-3 h-68 sm:h-73 lg:h-93 min-w-[300px] w-[90%] sm:w-fit sm:min-w-[550px] bg-black/30 justify-center'>
                <div className='absolute p-3 h-50 w-[95%] lg:h-70 lg:w-130 bg-black/50 overflow-y-hidden'>
                    <div className='h-full flex flex-col-reverse'>
                    {messages.map((message) => (
                        <motion.div
                        key={message.id}
                        className='font-bold text-xs sm:text-base'
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: message.delay, duration: 0.3 }}
                        >
                        {message.text}
                        </motion.div>
                    ))}
                    <div ref={botRef} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className='absolute bottom-3 h-10 sm:h-15 w-[95%] lg:w-130 bg-black/50 text-xl text-white/50 flex pl-4 items-center'>
                    <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className='bg-transparent outline-none w-full text-white/80 placeholder-white/50 text-xs sm:text-lg'
                    placeholder='Say to team'
                    maxLength={50}
                    />
                </form>
            </div>
            <NotificationComponent/>
        </div>
    );
}