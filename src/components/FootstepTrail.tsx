import React from 'react';

interface FootstepTrailProps {
  bearing: number;
  distance: number;
  deviceHeading: number;
}

export const FootstepTrail: React.FC<FootstepTrailProps> = ({ bearing, distance, deviceHeading }) => {
  const adjustedBearing = bearing - deviceHeading;
  const footsteps = Array.from({ length: Math.min(Math.floor(distance / 10), 8) }, (_, i) => i);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {footsteps.map((step, index) => (
        <div
          key={index}
          className="absolute animate-pulse"
          style={{
            left: '50%',
            top: '70%',
            transform: `translate(-50%, -50%) rotate(${adjustedBearing}deg) translateY(${-30 - index * 40}px)`,
            animationDelay: `${index * 0.2}s`,
          }}
        >
          <div className="w-8 h-12 opacity-60">
            <svg viewBox="0 0 32 48" className="w-full h-full fill-cyan-400/70 drop-shadow-lg">
              <ellipse cx="16" cy="40" rx="12" ry="6" />
              <ellipse cx="16" cy="20" rx="8" ry="12" />
              <circle cx="12" cy="15" r="3" />
              <circle cx="20" cy="15" r="3" />
              <circle cx="16" cy="8" r="2" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};