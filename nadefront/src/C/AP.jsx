// AuthProvider.js
import { useState, useEffect, useCallback } from 'react';
import AuthContext from './AC';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState({
    tier: 'Free',
    isPaid: false,
    subscriptionEnds: null,
    autoCancel: false,
    activeAddons: [],
  });
  const [collectionCount, setCollectionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        setUser(null);
        setPaymentInfo({
          tier: 'Free',
          isPaid: false,
          subscriptionEnds: null,
          autoCancel: false,
          activeAddons: [],
        });
        setError(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Auth check failed: ${response.status}`);
      }

      const userData = await response.json();
      setUser(userData);
      if (userData?.photos?.[2]?.value) {
        localStorage.setItem("lastProfilePhoto", userData.photos[2].value);
      }
      localStorage.setItem("lastDisplayName", userData.displayName || '');
      setError(null);

      const statusRes = await fetch(`${import.meta.env.VITE_API_URL}/api/user/status`, {
        credentials: 'include'
      });

      if (!statusRes.ok) {
        throw new Error(`Failed to fetch payment status: ${statusRes.status}`);
      }

      const statusData = await statusRes.json();
      setPaymentInfo({
        tier: statusData.paymentTier || 'Free',
        isPaid: statusData.isPaid || false,
        subscriptionEnds: statusData.subscriptionEnds || null,
        autoCancel: statusData.autoCancel || false,
        activeAddons: statusData.activeAddons || [],
      });

    } catch (err) {
      console.error('Auth check error:', err);
      setError(err.message);
      setUser(null);
      setPaymentInfo({
        tier: 'Free',
        isPaid: false,
        subscriptionEnds: null,
        autoCancel: false,
        activeAddons: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCollectionCount = useCallback(async () => {
    if (!user) {
      setCollectionCount(0);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/my-collections`,
        { credentials: "include" }
      );

      if (!res.ok) return;

      const data = await res.json();
      setCollectionCount(data?.meta?.currentCount ?? 0);
    } catch (err) {
      console.error("Failed to fetch collection count:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCollectionCount();
    } else {
      setCollectionCount(0);
    }
  }, [user, fetchCollectionCount]);

  const logout = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error(await response.text());
      
      setUser(null);
      localStorage.removeItem("lastProfilePhoto");
      localStorage.removeItem("nameStyle");
      localStorage.removeItem("lastDisplayName");
      setPaymentInfo({
        tier: 'Free',
        isPaid: false,
        subscriptionEnds: null,
        autoCancel: false,
        activeAddons: [],
      });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Logout failed');
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    user,
    paymentInfo,
    setPaymentInfo,
    loading,
    error,
    logout,
    checkAuth,
    collectionCount,
    fetchCollectionCount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;