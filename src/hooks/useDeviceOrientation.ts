import { useState, useEffect } from 'react';
import { CompassData } from '../types';

export const useDeviceOrientation = () => {
  const [compassData, setCompassData] = useState<CompassData>({ heading: 0, accuracy: 0 });
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setCompassData({
          heading: event.alpha,
          accuracy: event.webkitCompassAccuracy || 0,
        });
      }
    };

    const requestPermission = async () => {
      if ('DeviceOrientationEvent' in window) {
        // Check if permission is needed (iOS 13+)
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          try {
            const permission = await (DeviceOrientationEvent as any).requestPermission();
            if (permission === 'granted') {
              setSupported(true);
              window.addEventListener('deviceorientation', handleOrientation);
            }
          } catch (error) {
            console.error('Device orientation permission denied:', error);
          }
        } else {
          // Non-iOS devices
          setSupported(true);
          window.addEventListener('deviceorientation', handleOrientation);
        }
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setSupported(true);
        }
      } catch (error) {
        console.error('Permission request failed:', error);
      }
    }
  };

  return { compassData, supported, requestPermission };
};