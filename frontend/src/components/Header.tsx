'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { HealthStatus } from '@/lib/types';
import { PlusCircle, Radio, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Header() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const res = await api.getHealth();
        if (isMounted) {
          setHealth(res);
          setOnline(true);
        }
      } catch {
        if (isMounted) {
          setOnline(false);
        }
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="h-16 border-b border-surface-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border border-surface-border bg-surface-card">
          <span
            className={`w-2 h-2 rounded-full ${
              online === true
                ? 'bg-emerald-400 animate-pulse'
                : online === false
                ? 'bg-rose-500'
                : 'bg-amber-400'
            }`}
          />
          <span className="text-slate-300">
            {online === true ? 'Backend: Connected' : online === false ? 'Backend: Offline' : 'Connecting...'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/projects/new"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm shadow-brand-600/30 transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          New Project
        </Link>
        {!isAuthenticated && (
          <Link
            href="/auth"
            className="px-3 py-1.5 rounded-lg border border-surface-border text-xs text-slate-300 hover:text-white hover:bg-surface-card transition"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
