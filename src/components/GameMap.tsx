import React from 'react';
import { Location } from '../types';
import { MapPin, Target, Check } from 'lucide-react';

interface GameMapProps {
  locations: Location[];
  currentNodeIndex: number;
  visitedNodes: boolean[];
  userLocation: GeolocationPosition | null;
}

export const GameMap: React.FC<GameMapProps> = ({ 
  locations, 
  currentNodeIndex, 
  visitedNodes, 
  userLocation 
}) => {
  // Simple projection for local coordinates (not suitable for large areas)
  const getMapPosition = (lat: number, lon: number) => {
    const minLat = Math.min(...locations.map(l => l.latitude));
    const maxLat = Math.max(...locations.map(l => l.latitude));
    const minLon = Math.min(...locations.map(l => l.longitude));
    const maxLon = Math.max(...locations.map(l => l.longitude));
    
    const x = ((lon - minLon) / (maxLon - minLon)) * 250 + 25;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 200 + 25;
    
    return { x, y };
  };

  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
      <h3 className="text-lg font-bold text-purple-300 mb-3 text-center">Trail Map</h3>
      <div className="relative w-full h-64 bg-gray-900/50 rounded border border-purple-500/20">
        {/* Trail connections */}
        <svg className="absolute inset-0 w-full h-full">
          {locations.slice(0, -1).map((location, index) => {
            const current = getMapPosition(location.latitude, location.longitude);
            const next = getMapPosition(locations[index + 1].latitude, locations[index + 1].longitude);
            return (
              <line
                key={index}
                x1={current.x}
                y1={current.y}
                x2={next.x}
                y2={next.y}
                stroke={visitedNodes[index] ? '#06b6d4' : '#6b21a8'}
                strokeWidth="2"
                strokeDasharray={visitedNodes[index] ? '0' : '5,5'}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        
        {/* Location markers */}
        {locations.map((location, index) => {
          const pos = getMapPosition(location.latitude, location.longitude);
          const isVisited = visitedNodes[index];
          const isCurrent = index === currentNodeIndex;
          
          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: pos.x, top: pos.y }}
            >
              <div className={`p-2 rounded-full ${
                isVisited 
                  ? 'bg-green-500 text-white' 
                  : isCurrent 
                    ? 'bg-cyan-400 text-black animate-pulse' 
                    : 'bg-purple-600 text-white'
              }`}>
                {isVisited ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Target className="w-4 h-4" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </div>
              <div className="text-xs text-center mt-1 text-purple-300 font-medium">
                {location.name}
              </div>
            </div>
          );
        })}
        
        {/* User location */}
        {userLocation && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: getMapPosition(userLocation.coords.latitude, userLocation.coords.longitude).x,
              top: getMapPosition(userLocation.coords.latitude, userLocation.coords.longitude).y,
            }}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
};