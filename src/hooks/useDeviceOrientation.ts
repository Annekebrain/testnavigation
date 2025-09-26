import { useState, useEffect } from 'react';
import { CompassData } from '../types';

// Detect iOS devices
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Detect if device supports orientation
const supportsOrientation = () => {
  return 'DeviceOrientationEvent' in window;
};

export const useDeviceOrientation = () => {
  const [compassData, setCompassData] = useState<CompassData>({ heading: 0, accuracy: 0 });
  const [supported, setSupported] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // iOS returns compass heading, Android returns device orientation
        let heading = event.alpha;
        
        // For iOS, we might need to adjust the heading
        if (isIOS() && event.webkitCompassHeading !== undefined) {
          heading = event.webkitCompassHeading;
        }
        
        setCompassData({
          heading: heading,
          accuracy: event.webkitCompassAccuracy || event.alpha ? 15 : 0,
        });
      }
    };

    const checkSupport = () => {
      if (supportsOrientation()) {
        if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
          // Non-iOS devices - automatically supported
          setSupported(true);
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          // iOS devices - need permission
          setSupported(false);
        }
      } else {
        // Fallback for devices without orientation support
        setSupported(false);
      }
    };

    checkSupport();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const requestPermission = async () => {
    setPermissionRequested(true);
    setPermissionDenied(false);
    
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setSupported(true);
          window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
            if (event.alpha !== null) {
              let heading = event.alpha;
              if (isIOS() && event.webkitCompassHeading !== undefined) {
                heading = event.webkitCompassHeading;
              }
              setCompassData({
                heading: heading,
                accuracy: event.webkitCompassAccuracy || 15,
              });
            }
          });
        } else {
          setPermissionDenied(true);
        }
      } catch (error) {
        console.error('Permission request failed:', error);
        setPermissionDenied(true);
      }
    }
  };

  return { 
    compassData, 
    supported, 
    requestPermission, 
    permissionRequested, 
    permissionDenied,
    isIOS: isIOS()
  };
};