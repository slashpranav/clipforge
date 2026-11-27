'use client';

import React from 'react';

interface StarBorderProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  color?: string;
  speed?: string;
}

export function StarBorder({
  children,
  className = '',
  innerClassName = '',
  color = 'rgba(225, 29, 72, 0.45)',
  speed = '6s',
}: StarBorderProps) {
  return (
    <div className={`relative rounded-3xl p-[1px] overflow-hidden ${className}`}>
      <div
        className="pointer-events-none absolute w-[220%] h-[50%] opacity-75 bottom-[-12px] right-[-180%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 18%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="pointer-events-none absolute w-[220%] h-[50%] opacity-75 top-[-12px] left-[-180%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, rgba(249, 115, 22, 0.38), transparent 18%)`,
          animationDuration: speed,
        }}
      />
      <div className={`relative z-10 rounded-[calc(1.5rem-1px)] ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}
