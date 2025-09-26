import React, { useState, useEffect } from 'react';
import { Play, Smartphone, AlertTriangle, Trophy, MapPin, Camera, Wifi, WifiOff } from 'lucide-react';
import { useGeolocation } from './hooks/useGeolocation';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import { GameStatus } from './components/GameStatus';
import { Compass } from './components/Compass';
import { FootstepTrail } from './components/FootstepTrail';
import { GameMap } from './components/GameMap';
import { GAME_LOCATIONS } from './data/locations';
import { GameState } from './types';
import { calculateDistance, calculateBearing, isNearLocation } from './utils/geolocation';

// Mobile compatibility checks
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const hasRequiredAPIs = () => {
  return 'geolocation' in navigator && 
         'mediaDevices' in navigator && 
         'getUserMedia' in navigator.mediaDevices;
};

function App() {
  const { position, error, loading } = useGeolocation();
  const { compassData, supported, requestPermission, permissionRequested, permissionDenied, isIOS: deviceIsIOS } = useDeviceOrientation();
  
  const [debugInfo, setDebugInfo] = useState('');
  const [gameState, setGameState] = useState<GameState>({
    currentNodeIndex: 0,
    visitedNodes: new Array(GAME_LOCATIONS.length).fill(false),
    userLocation: null,
    gameStarted: false,
    gameCompleted: false,
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showARView, setShowARView] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [compatibilityChecked, setCompatibilityChecked] = useState(false);
  const [compatibilityIssues, setCompatibilityIssues] = useState<string[]>([]);

  // Debug information
  useEffect(() => {
    const info = [
      `Loading: ${loading}`,
      `Position: ${position ? 'Available' : 'None'}`,
      `Error: ${error ? error.message : 'None'}`,
      `Compass supported: ${supported}`,
      `Permission requested: ${permissionRequested}`,
      `Game started: ${gameState.gameStarted}`,
    ].join('\n');
    setDebugInfo(info);
  }, [loading, position, error, supported, permissionRequested, gameState.gameStarted]);

  // Compatibility check
  useEffect(() => {
    const issues: string[] = [];
    
    if (!isMobile()) {
      issues.push('This app is designed for mobile devices');
    }
    
    if (!hasRequiredAPIs()) {
      issues.push('Browser missing required APIs (GPS/Camera)');
    }
    
    if (!('DeviceOrientationEvent' in window)) {
      issues.push('Device orientation not supported');
    }
    
    setCompatibilityIssues(issues);
    setCompatibilityChecked(true);
  }, []);

  // Update user location
  useEffect(() => {
    if (position) {
      setGameState(prev => ({ ...prev, userLocation: position }));
    }
  }, [position]);

  // Check proximity to current target
  useEffect(() => {
    if (!position || !gameState.gameStarted || gameState.gameCompleted) return;

    const currentTarget = GAME_LOCATIONS[gameState.currentNodeIndex];
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;

    if (isNearLocation(userLat, userLon, currentTarget.latitude, currentTarget.longitude, 25)) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      setGameState(prev => {
        const newVisitedNodes = [...prev.visitedNodes];
        newVisitedNodes[prev.currentNodeIndex] = true;
        
        const nextIndex = prev.currentNodeIndex + 1;
        const isCompleted = nextIndex >= GAME_LOCATIONS.length;

        return {
          ...prev,
          visitedNodes: newVisitedNodes,
          currentNodeIndex: isCompleted ? prev.currentNodeIndex : nextIndex,
          gameCompleted: isCompleted,
        };
      });
    }
  }, [position, gameState.gameStarted, gameState.currentNodeIndex, gameState.gameCompleted]);

  const startGame = async () => {
    try {
      // For iOS devices, request orientation permission first
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        await requestPermission();
      }
      setGameState(prev => ({ ...prev, gameStarted: true }));
    } catch (error) {
      console.error('Failed to start game:', error);
      // Start anyway - compass might not be critical
      setGameState(prev => ({ ...prev, gameStarted: true }));
    }
  };

  const resetGame = () => {
    setGameState({
      currentNodeIndex: 0,
      visitedNodes: new Array(GAME_LOCATIONS.length).fill(false),
      userLocation: position,
      gameStarted: false,
      gameCompleted: false,
    });
  };

  // Show compatibility warnings before game starts
  if (compatibilityChecked && compatibilityIssues.length > 0 && !gameState.gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Compatibility Notice</h2>
          <div className="bg-yellow-900/30 rounded-lg p-4 mb-4">
            {compatibilityIssues.map((issue, index) => (
              <p key={index} className="text-yellow-300 text-sm mb-2">• {issue}</p>
            ))}
          </div>
          <p className="text-gray-300 text-sm mb-4">
            The app may not work optimally on this device. For best experience, use a mobile device with GPS and camera support.
          </p>
          <button
            onClick={() => setCompatibilityIssues([])}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center p-4">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-cyan-400 text-lg">Finding your location...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-400 mb-2">Location Access Required</h2>
          <p className="text-gray-300 mb-4">
            This game requires location access to track your progress along the trail. 
            Please enable location services and refresh the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!gameState.gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4">
              Ghost Trail
            </h1>
            <p className="text-gray-300 mb-6">
              Follow the ethereal footsteps to uncover the mystery of the missing person. 
              Use your device's compass and GPS to navigate between {GAME_LOCATIONS.length} key locations.
            </p>
          </div>

          <div className="bg-black/30 rounded-lg p-6 mb-6 border border-purple-500/30">
            <Smartphone className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Requirements</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• GPS/Location services enabled</li>
              <li>• Device orientation access</li>
              <li>• Camera access for AR mode</li>
              <li>• Best played outdoors</li>
            </ul>
          </div>

          {/* Device compatibility info */}
          <div className="bg-black/30 rounded-lg p-4 mb-6 border border-green-500/30">
            <div className="flex items-center justify-center mb-2">
              {hasRequiredAPIs() ? <Wifi className="w-6 h-6 text-green-400" /> : <WifiOff className="w-6 h-6 text-red-400" />}
            </div>
            <h3 className="text-sm font-bold text-center mb-2">Device Status</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Device: {deviceIsIOS ? 'iOS' : isMobile() ? 'Mobile' : 'Desktop'}</li>
              <li>• GPS: {position ? '✓ Ready' : '⏳ Waiting'}</li>
              <li>• Compass: {supported ? '✓ Ready' : permissionDenied ? '✗ Denied' : '⏳ Pending'}</li>
              <li>• Camera: {hasRequiredAPIs() ? '✓ Available' : '✗ Not supported'}</li>
              <li>• Walk between locations to progress</li>
            </ul>
          </div>

          {/* Current location info */}
          {position && (
            <div className="bg-black/30 rounded-lg p-4 mb-4 border border-cyan-500/30">
              <MapPin className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-xs text-cyan-400">
                Current Location: {position.coords.latitude.toFixed(6)}, {position.coords.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-gray-400">
                Accuracy: ±{position.coords.accuracy.toFixed(0)}m
              </p>
            </div>
          )}

          <button
            onClick={startGame}
            className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 flex items-center mx-auto"
          >
            <Play className="w-6 h-6 mr-2" />
            Begin the Hunt
          </button>
        </div>
      </div>
    );
  }

  if (gameState.gameCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-900 to-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400 mb-4">
            Mystery Solved!
          </h2>
          <p className="text-gray-300 mb-6">
            You've successfully followed the ghost trail and uncovered all the clues. 
            The missing person's path has been revealed.
          </p>
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Hunt Again
          </button>
        </div>
      </div>
    );
  }

  if (!position) return null;

  const currentTarget = GAME_LOCATIONS[gameState.currentNodeIndex];
  const userLat = position.coords.latitude;
  const userLon = position.coords.longitude;
  
  const distance = calculateDistance(userLat, userLon, currentTarget.latitude, currentTarget.longitude);
  const bearing = calculateBearing(userLat, userLon, currentTarget.latitude, currentTarget.longitude);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      {/* Success message */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg font-bold animate-bounce">
          Location Found! 🎉
        </div>
      )}

      {/* AR/Map Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowARView(!showARView)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all"
        >
          {showARView ? <MapPin className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
        </button>
      </div>

      {showARView ? (
        /* AR Camera View */
        <div className="fixed inset-0 z-10">
          <ARCamera
            bearing={bearing}
            distance={distance}
            deviceHeading={compassData.heading}
            onCameraReady={setCameraReady}
          />
        </div>
      ) : (
        /* Map View */
        <div className="max-w-md mx-auto">
          {/* Game Status */}
          <GameStatus
            currentLocation={currentTarget}
            visitedCount={gameState.visitedNodes.filter(Boolean).length}
            totalLocations={GAME_LOCATIONS.length}
            accuracy={position.coords.accuracy}
          />

          {/* Compass */}
          <div className="text-center mb-6">
            <Compass
              bearing={bearing}
              distance={distance}
              deviceHeading={compassData.heading}
            />
          </div>

          {/* Game Map */}
          <GameMap
            locations={GAME_LOCATIONS}
            currentNodeIndex={gameState.currentNodeIndex}
            visitedNodes={gameState.visitedNodes}
            userLocation={position}
          />

          {/* Instructions */}
          <div className="bg-black/30 rounded-lg p-4 mt-6 border border-purple-500/20">
            <p className="text-sm text-gray-300 text-center">
              Follow the compass and ghostly footsteps to reach the next location. 
              Get within 25 meters to trigger the next clue.
            </p>
          </div>
        </div>
      )}

      {/* Footstep Trail Overlay */}
      {!showARView && distance > 30 && (
        <FootstepTrail
          bearing={bearing}
          distance={distance}
          deviceHeading={compassData.heading}
        />
      )}
    </div>
  );
}

export default App;