'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle, Film, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Magnet } from '@/components/reactbits';

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const getPageLabel = () => {
    if (pathname === '/') return 'Overview Dashboard';
    if (pathname === '/projects/new') return 'New Clipping Project';
    if (pathname === '/projects') return 'Project History';
    if (pathname.startsWith('/projects/')) return 'Project Studio';
    if (pathname === '/auth') return 'Creator Account';
    return 'ClipForge Studio';
  };

  return (
    <header className="h-16 border-b border-surface-border bg-surface-card/90 backdrop-blur-xl px-5 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Brand + Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-surface-elevated border border-surface-border text-slate-700"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <Link href="/" className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <Film className="w-4 h-4 text-brand-600" />
            ClipForge
          </Link>
        </div>

        {/* Context Title */}
        <div className="hidden md:flex items-center gap-2.5 text-xs font-medium text-slate-500">
          <span>Studio</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold">{getPageLabel()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Magnet magnetStrength={5} padding={14}>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 hover:from-brand-500 hover:to-orange-400 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Link>
        </Magnet>
        {!isAuthenticated && (
          <Link
            href="/auth"
            className="px-3.5 py-2 rounded-xl border border-surface-border bg-surface-card text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-surface-elevated shadow-sm transition"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Mobile Nav Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden absolute top-16 inset-x-0 bg-surface-card border-b border-surface-border p-4 space-y-2 shadow-xl z-40"
          >
            {[
              { label: 'Dashboard', href: '/' },
              { label: 'New Project', href: '/projects/new' },
              { label: 'Project History', href: '/projects' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  pathname === item.href
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'text-slate-600 hover:bg-surface-elevated'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
