import { useState, useEffect } from 'react';
import useAuth from '../hooks/UA';
import { Routes, Route, useLocation } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import UU from '../C/UU';
import US from '../C/US';
import ULI from '../C/ULI';
import CH from '../C/CH';
import CZ from '../C/CZ';
import S from '../C/S';
import F from '../C/F';
import PH from '../C/PH';
import { useTheme } from '../C/TC';
import NotFound from '../pages/notfound';
import { useNotification } from '../C/noti';
const VALID_SUBROUTES = ['', 'likes', 'challenges', 'settings', 'customize', 'stats'];

export default function Profile() {
    const { user } = useAuth();
    const { showNotification, NotificationComponent } = useNotification();
    const [items, setItems] = useState([]);
    const location = useLocation();
    const { theme } = useTheme();
    const subroute = location.pathname.replace('/profile', '').replace(/^\//, '');
    if (!VALID_SUBROUTES.includes(subroute)) {
        return <NotFound />;
    }
    const activePage = location.pathname.endsWith('/likes') ? 'likes'
        : location.pathname.endsWith('/challenges') ? 'challenges'
        : location.pathname.endsWith('/settings') ? 'settings'
        : location.pathname.endsWith('/customize') ? 'customize'
        : location.pathname.endsWith('/stats') ? 'stats'
        : 'uploads';

    if (!user) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4 ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
            <div className="w-16 h-16 rounded-2xl bg-[#1a1a2e] border border-white/10 flex items-center justify-center">
                <FaLock size={24} className="text-orange-400" />
            </div>
            <p className="text-white font-bold text-xl">Sign in to continue</p>
            <p className="text-gray-400 text-sm max-w-xs">
                Sign in to view your profile, uploads, and stats.
            </p>
            </div>
        );
    }

    useEffect(() => {
        const fetchUserUploads = async () => {
        try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user-uploads`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setItems(data);
                }
        } catch (err) {
                console.error('Error fetching uploads for settings page:', err);
        }
        };
        fetchUserUploads();
    }, []);

    return (
        <div className={`flex flex-col min-h-screen text-white ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
        <NotificationComponent />

        {/* Main content expands to fill space */}
        <main className="flex-grow">
                <div className="max-w-[110rem] mx-auto md:px-5 font-mono pt-16 md:pt-20">
                    <PH activePage={activePage} />
            <Routes>
            <Route path="/" element={<UU showNotification={showNotification} />} />
                        <Route path="stats" element={<US />} />
                        <Route path="likes" element={<ULI showNotification={showNotification} items={items.length} />} />
                        <Route path="challenges" element={<CH showNotification={showNotification} />} />
                        <Route path="customize" element={<CZ showNotification={showNotification} />} />
                        <Route path="settings" element={<S items={items.length} />} />
            </Routes>
                </div>
        </main>
        <F />
        </div>
    );
}