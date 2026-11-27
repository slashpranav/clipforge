'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  separator?: string;
}

export function CountUp({
  to,
  from = 0,
  duration = 1.1,
  className = '',
  separator = ',',
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px' });
  const motionValue = useMotionValue(from);

  const damping = 22 + 30 * (1 / Math.max(duration, 0.2));
  const stiffness = 120 * (1 / Math.max(duration, 0.2));

  const springValue = useSpring(motionValue, { damping, stiffness });
  const [display, setDisplay] = useState(from.toString());

  useEffect(() => {
    if (inView) {
      motionValue.set(to);
    }
  }, [inView, to, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      const rounded = Math.round(latest);
      setDisplay(
        separator ? rounded.toLocaleString('en-US') : String(rounded)
      );
    });
    return () => unsubscribe();
  }, [springValue, separator]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
