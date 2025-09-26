import React from 'react';
import { Navigation } from 'lucide-react';

interface CompassProps {
  bearing: number;
  distance: number;
  deviceHeading: number;
}

export const Compass: React.FC<CompassProps> = ({ bearing, distance, deviceHeading }) => {
  const adjustedBearing = bearing - deviceHeading;
  
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      {/* Compass circle */}
      <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 bg-black/50 backdrop-blur-sm">
        {/* Cardinal directions */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-bold text-purple-300">N</div>
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs font-bold text-purple-300">E</div>
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-bold text-purple-300">S</div>
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs font-bold text-purple-300">W</div>
      </div>
      
      {/* Direction arrow */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
        style={{ transform: `translate(-50%, -50%) rotate(${adjustedBearing}deg)` }}
      >
        <Navigation className="w-8 h-8 text-cyan-400 drop-shadow-lg" fill="currentColor" />
      </div>
      
      {/* Distance indicator */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-lg font-bold text-cyan-400">{distance.toFixed(0)}m</div>
        <div className="text-xs text-purple-300">to next clue</div>
      </div>
    </div>
  );
};