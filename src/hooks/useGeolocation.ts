import { useState, useEffect } from 'react';

// Enhanced geolocation options for mobile devices
const getGeolocationOptions = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return {
    enableHighAccuracy: true,
    timeout: isMobile ? 15000 : 10000, // Longer timeout for mobile
    maximumAge: isMobile ? 30000 : 60000, // Cache position longer on mobile
  };
};

export const useGeolocation = () => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser.',
      } as GeolocationPositionError);
      setLoading(false);
      return;
    }

    const options = getGeolocationOptions();

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos);
        setError(null);
        setLoading(false);
        setRetryCount(0);
      },
      (err) => {
        console.error('Geolocation error:', err);
        
        // Retry logic for mobile devices
        if (retryCount < 3 && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            // Don't set error yet, keep trying
          }, 2000);
        } else {
          setError(err);
          setLoading(false);
        }
      },
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [retryCount]);

  return { position, error, loading };
};