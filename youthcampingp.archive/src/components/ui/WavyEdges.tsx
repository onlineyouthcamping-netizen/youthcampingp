"use client";

import React from "react";

interface WavyEdgesProps {
  color?: string;
  position: 'top' | 'bottom';
}

export function WavyEdges({ color = "#ffffff", position }: WavyEdgesProps) {
  const isTop = position === 'top';
  
  return (
    <div className={`absolute ${isTop ? 'top-0' : 'bottom-0'} left-0 w-full h-[10px] ${isTop ? '-mt-[0.5px]' : '-mb-[0.5px]'} pointer-events-none z-10`}>
      <svg 
        width="100%" 
        height="10" 
        xmlns="http://www.w3.org/2000/svg" 
        className="block w-full h-full"
      >
        <defs>
          <pattern id={isTop ? "waveTop" : "waveBottom"} x="0" y="0" width="40" height="10" patternUnits="userSpaceOnUse">
            <path 
              d={isTop 
                ? "M0 10 C 10 10 10 0 20 0 S 30 10 40 10 V 0 H 0 Z" 
                : "M0 0 C 10 0 10 10 20 10 S 30 0 40 0 V 10 H 0 Z"
              } 
              fill={color} 
            />
          </pattern>
        </defs>
        <rect width="100%" height="10" fill={`url(#${isTop ? "waveTop" : "waveBottom"})`} />
      </svg>
    </div>
  );
}
