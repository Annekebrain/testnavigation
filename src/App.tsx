import React, { useState, useEffect } from 'react';
import { Play, Smartphone, AlertTriangle, Trophy } from 'lucide-react';
import { useGeolocation } from './hooks/useGeolocation';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import { GameStatus } from './components/GameStatus';
import { Compass } from './components/Compass';
import { FootstepTrail } from './components/FootstepTrail';
import { GameMap } from './components/GameMap';
import { GAME_LOCATIONS } from './data/locations';
import { GameState } from './types';
import { calculateDistance, calculateBearing, isNearLocation } from './utils/geolocation';

function App() {
  const { position, error, loading } = useGeolocation();
  const { compassData, supported, requestPermission } = useDeviceOrientation();
  
  const [gameState, setGameState] = useState<GameState>({
    currentNodeIndex: 0,
    visitedNodes: new Array(GAME_LOCATIONS.length).fill(false),
    userLocation: null,
    gameStarted: false,
    gameCompleted: false,
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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
    if (supported || (await requestPermission)) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
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
              <li>• Best played outdoors</li>
              <li>• Walk between locations to progress</li>
            </ul>
          </div>

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

      {/* Footstep Trail Overlay */}
      {distance > 30 && (
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