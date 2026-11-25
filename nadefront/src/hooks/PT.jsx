import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const MEASUREMENT_ID = 'G-6V1TWZLHCH';

export default function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (!window.gtag) return;
    window.gtag('config', MEASUREMENT_ID, {
      page_path: location.pathname + location.search,
    });
  }, [location]);
}
