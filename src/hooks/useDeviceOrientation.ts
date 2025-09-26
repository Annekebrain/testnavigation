import { useState, useEffect } from 'react';
import { CompassData } from '../types';

export const useDeviceOrientation = () => {
  const [compassData, setCompassData] = useState<CompassData>({ heading: 0, accuracy: 0 });
  const [supported, setSupported] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setCompassData({
          heading: event.alpha,
          accuracy: event.webkitCompassAccuracy || 0,
        });
      }
    };

    const checkSupport = () => {
      if ('DeviceOrientationEvent' in window) {
        if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
          // Non-iOS devices - automatically supported
          setSupported(true);
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          // iOS devices - need permission
          setSupported(false);
        }
      }
    };

    checkSupport();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const requestPermission = async () => {
    setPermissionRequested(true);
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setSupported(true);
          window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
            if (event.alpha !== null) {
              setCompassData({
                heading: event.alpha,
                accuracy: event.webkitCompassAccuracy || 0,
              });
            }
          });
        }
      } catch (error) {
        console.error('Permission request failed:', error);
      }
    }
  };

  return { compassData, supported, requestPermission, permissionRequested };
};