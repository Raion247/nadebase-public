import { useState, useEffect } from 'react';
import FL from './FL';
import IL from './IL';
import { useNotification } from '../C/noti';

const FM = () => {
  const [filters, setFilters] = useState({ 
    map: 'all', 
    utility: null, 
    side: null,
    searchTerm: "",
    sortBy: 'mostLiked'
  });
  const [availableFilters, setAvailableFilters] = useState({
    utilities: [],
    sides: []
  });
  const { showNotification, NotificationComponent } = useNotification();

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        let url = `${import.meta.env.VITE_API_URL}/api/filter-options`;
        if (filters.map && filters.map !== 'all') {
          url += `?map=${filters.map}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        setAvailableFilters(data);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, [filters.map]);

  return (
    <>
      <NotificationComponent />
      <FL 
        filters={filters}
        onFilterSelect={setFilters} 
        availableFilters={availableFilters}
      />
      <IL 
        filters={filters}
        showNotification={showNotification}
      />
    </>
  );
};

export default FM;