'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, Film, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

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
    <header className="h-16 border-b border-white/[0.07] bg-[#0b0e16]/75 backdrop-blur-xl px-5 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Brand + Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <Link href="/" className="font-bold text-sm text-white flex items-center gap-1.5">
            <Film className="w-4 h-4 text-brand-400" />
            ClipForge
          </Link>
        </div>

        {/* Context Title */}
        <div className="hidden md:flex items-center gap-2.5 text-xs font-medium text-slate-300">
          <span className="text-slate-500">Studio</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-100 font-semibold">{getPageLabel()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-brand-600/25 ring-1 ring-white/15 transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Project</span>
        </Link>
        {!isAuthenticated && (
          <Link
            href="/auth"
            className="px-3.5 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.08] transition"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-[#0d1019] border-b border-white/[0.08] p-4 space-y-2 shadow-2xl z-40">
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
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
