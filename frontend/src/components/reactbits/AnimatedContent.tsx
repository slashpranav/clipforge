'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedContentProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  scale?: number;
  className?: string;
}

export function AnimatedContent({
  children,
  delay = 0,
  distance = 18,
  direction = 'vertical',
  reverse = false,
  duration = 0.48,
  scale = 0.985,
  className = '',
}: AnimatedContentProps) {
  const offset = reverse ? -distance : distance;
  const initialAxis = direction === 'horizontal' ? { x: offset, y: 0 } : { x: 0, y: offset };

  return (
    <motion.div
      initial={{ opacity: 0, scale, ...initialAxis }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
