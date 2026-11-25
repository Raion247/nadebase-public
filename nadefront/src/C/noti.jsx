import { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const Notification = ({ message, type = 'error', duration = 5000, onClose }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = {
    error: 'bg-red-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  }[type];

  const icon = {
    error: <FaExclamationTriangle className="mr-2" />,
    success: <FaCheck className="mr-2" />,
    warning: <FaExclamationTriangle className="mr-2" />,
    info: <FaInfoCircle className="mr-2" />
  }[type];

  return (
    <div className={`fixed top-24 right-4 z-50 ${bgColor} text-white px-4 py-3 rounded-md shadow-lg flex items-center`}>
      {icon}
      <span>{message}</span>
      <button 
        onClick={() => onClose?.()}
        className="ml-4 hover:text-gray-200"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'error', duration = 5000) => {
    setNotification({ message, type, duration });
  };

  const NotificationComponent = () => (
    <>
      {notification && (
        <Notification
          key={Date.now()}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );

  return { showNotification, NotificationComponent };
};