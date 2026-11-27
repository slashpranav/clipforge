'use client';

import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = '',
}: ShinyTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text ${
        disabled ? '' : 'animate-shine'
      } ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(190, 18, 60, 0.94) 35%, rgba(255, 241, 242, 0.98) 50%, rgba(234, 88, 12, 0.92) 65%)',
        backgroundSize: '220% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animationDuration: `${speed}s`,
      }}
    >
      {text}
    </span>
  );
}
