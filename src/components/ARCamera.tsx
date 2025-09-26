import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, AlertCircle, Smartphone } from 'lucide-react';

interface ARCameraProps {
  bearing: number;
  distance: number;
  deviceHeading: number;
  onCameraReady: (ready: boolean) => void;
}

export const ARCamera: React.FC<ARCameraProps> = ({ 
  bearing, 
  distance, 
  deviceHeading, 
  onCameraReady 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      setIsLoading(true);
      setCameraError(null);
      
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported by this browser');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
          
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current?.play();
              setCameraActive(true);
              setIsLoading(false);
              onCameraReady(true);
            } catch (error) {
              console.error('Video play failed:', error);
              setCameraError('Failed to start video playback');
              setIsLoading(false);
            }
          };
        }
      } catch (error) {
        console.error('Camera access failed:', error);
        setIsLoading(false);
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            setCameraError('Camera access denied. Please allow camera access and try again.');
          } else if (error.name === 'NotFoundError') {
            setCameraError('No camera found on this device.');
          } else {
            setCameraError(`Camera error: ${error.message}`);
          }
        } else {
          setCameraError('Unknown camera error occurred');
        }
        onCameraReady(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onCameraReady]);

  const adjustedBearing = bearing - deviceHeading;
  
  const getFootstepPosition = (stepIndex: number) => {
    const baseDistance = Math.min(distance, 100); // Cap at 100m for visibility
    const stepDistance = 5 + (stepIndex * 8); // Steps every 8 meters starting at 5m
    const maxSteps = Math.min(Math.floor(baseDistance / 8), 6);
    
    if (stepIndex >= maxSteps) return null;
    
    const screenCenterX = 50; // Center of screen
    const screenCenterY = 70; // Lower center for ground level
    
    const bearingOffset = Math.max(-45, Math.min(45, adjustedBearing));
    const horizontalOffset = (bearingOffset / 45) * 30; // Max 30% offset from center
    
    const depthFactor = stepDistance / 50; // Normalize to 0-2 range
    const verticalOffset = depthFactor * 10; // Move up as distance increases (perspective)
    const scale = Math.max(0.3, 1 - (depthFactor * 0.4)); // Smaller as distance increases
    
    return {
      x: screenCenterX + horizontalOffset,
      y: screenCenterY - verticalOffset,
      scale,
      opacity: Math.max(0.3, 1 - (depthFactor * 0.5))
    };
  };

  if (cameraError) {
    return (
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-400 mb-2">Camera Access Required</h3>
          <p className="text-gray-300 text-sm mb-4">
            {cameraError}
          </p>
          <button
            onClick={() => {
              setCameraError(null);
              setIsLoading(true);
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-pulse" />
          <p className="text-cyan-400 mb-2">Starting camera...</p>
          <p className="text-gray-400 text-sm">Please allow camera access when prompted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover bg-black"
      />
      
      {/* AR Footsteps overlay */}
      {cameraActive && distance > 10 && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 6 }, (_, i) => {
            const position = getFootstepPosition(i);
            if (!position) return null;
            
            return (
              <div
                key={i}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: `translate(-50%, -50%) scale(${position.scale})`,
                  opacity: position.opacity,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2s'
                }}
              >
                <div className="relative">
                  <svg 
                    width="40" 
                    height="60" 
                    viewBox="0 0 40 60" 
                    className="drop-shadow-2xl"
                  >
                    <ellipse 
                      cx="20" 
                      cy="55" 
                      rx="15" 
                      ry="4" 
                      fill="rgba(0,0,0,0.3)"
                    />
                    <path
                      d="M20 10 C25 10, 30 15, 30 25 C30 35, 25 45, 20 50 C15 45, 10 35, 10 25 C10 15, 15 10, 20 10 Z"
                      fill="rgba(6, 182, 212, 0.8)"
                      stroke="rgba(6, 182, 212, 1)"
                      strokeWidth="2"
                    />
                    <circle cx="16" cy="20" r="2" fill="rgba(6, 182, 212, 0.9)" />
                    <circle cx="20" cy="18" r="2" fill="rgba(6, 182, 212, 0.9)" />
                    <circle cx="24" cy="20" r="2" fill="rgba(6, 182, 212, 0.9)" />
                    <ellipse cx="20" cy="40" rx="6" ry="8" fill="rgba(6, 182, 212, 0.7)" />
                  </svg>
                  
                  {i === 0 && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-cyan-400 text-xs px-2 py-1 rounded whitespace-nowrap">
                      {(5 + (i * 8))}m ahead
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {cameraActive && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-cyan-400 px-4 py-2 rounded-full">
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 border-t-2 border-r-2 border-cyan-400 transform rotate-45 transition-transform duration-300"
              style={{ transform: `rotate(${adjustedBearing + 45}deg)` }}
            />
            <span className="text-sm font-bold">{distance.toFixed(0)}m</span>
          </div>
        </div>
      )}
    </div>
  );
};