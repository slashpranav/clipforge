'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  stepDuration?: number;
}

export function BlurText({
  text,
  delay = 45,
  className = '',
  animateBy = 'words',
  direction = 'bottom',
  stepDuration = 0.38,
}: BlurTextProps) {
  const elements = useMemo(
    () => (animateBy === 'words' ? text.split(' ') : text.split('')),
    [text, animateBy]
  );

  const yOffset = direction === 'top' ? -14 : 14;

  return (
    <span className={`inline-flex flex-wrap ${className}`}>
      {elements.map((segment, index) => (
        <motion.span
          key={`${segment}-${index}`}
          initial={{ filter: 'blur(8px)', opacity: 0, y: yOffset }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{
            duration: stepDuration,
            delay: (index * delay) / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block will-change-[transform,filter,opacity]"
        >
          {segment === ' ' ? '\u00A0' : segment}
          {animateBy === 'words' && index < elements.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}
