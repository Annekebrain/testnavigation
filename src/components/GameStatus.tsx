import React from 'react';
import { MapPin, Clock, User } from 'lucide-react';
import { Location } from '../types';

interface GameStatusProps {
  currentLocation: Location;
  visitedCount: number;
  totalLocations: number;
  accuracy: number;
}

export const GameStatus: React.FC<GameStatusProps> = ({ 
  currentLocation, 
  visitedCount, 
  totalLocations,
  accuracy 
}) => {
  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30 mb-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <MapPin className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <div className="text-lg font-bold text-cyan-400">{currentLocation.name}</div>
          <div className="text-xs text-purple-300">Next Destination</div>
        </div>
        
        <div className="text-center">
          <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-lg font-bold text-purple-400">{visitedCount}/{totalLocations}</div>
          <div className="text-xs text-purple-300">Locations Found</div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <User className="w-5 h-5 text-green-400 inline-block mr-2" />
        <span className="text-sm text-green-400">
          GPS Accuracy: ±{accuracy.toFixed(0)}m
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="mt-4 bg-gray-700 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-purple-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
          style={{ width: `${(visitedCount / totalLocations) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};