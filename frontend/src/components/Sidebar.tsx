'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Film,
  PlusCircle,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Magnet } from '@/components/reactbits';

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'New Project', href: '/projects/new', icon: PlusCircle },
    { label: 'Project History', href: '/projects', icon: FolderKanban },
  ];

  return (
    <aside className="hidden md:flex w-64 border-r border-surface-border bg-surface-card relative overflow-hidden flex-col justify-between shrink-0 h-screen sticky top-0 z-20 select-none">
      {/* Left Sidebar Custom Background Artwork */}
      <img
        src="/sidebar-bg.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover object-center opacity-45 z-0"
      />
      <div className="pointer-events-none absolute inset-0 bg-[#f7f4f5]/25 z-0" />

      <div className="relative z-10">
        {/* Brand Header */}
        <Link
          href="/"
          className="h-16 flex items-center px-5 border-b border-orange-200/45 gap-3 group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-brand-600/25 group-hover:scale-105 transition">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[15px] tracking-tight text-slate-900 flex items-center gap-1.5">
              ClipForge
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-50/95 text-brand-700 border border-brand-200 font-mono font-semibold">
                AI
              </span>
            </div>
            <div className="text-[11px] text-slate-600 leading-none mt-0.5">
              Creative Studio
            </div>
          </div>
        </Link>

        {/* Quick Create CTA */}
        <div className="px-4 pt-4">
          <Magnet magnetStrength={5} padding={16} className="w-full">
            <Link
              href="/projects/new"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 hover:from-brand-500 hover:to-orange-400 text-white text-xs font-semibold shadow-md shadow-brand-600/25 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Create Multi-Clips
            </Link>
          </Magnet>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-3 py-1.5">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : item.href === '/projects'
                ? pathname === '/projects' || (pathname.startsWith('/projects/') && pathname !== '/projects/new')
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                  isActive
                    ? 'text-brand-700'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-surface-card/75'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-brand-50/95 border border-brand-200/80 shadow-sm backdrop-blur-sm z-0"
                  >
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-600" />
                  </motion.div>
                )}
                <Icon className={`relative z-10 w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-500'}`} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card */}
      <div className="relative z-10 p-4 border-t border-orange-200/45 bg-[#fbf8f6]/45 backdrop-blur-sm">
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-surface-card/90 border border-orange-200/60 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-orange-500 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm">
                {user.email.charAt(0)}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-800 truncate">{user.email}</div>
                <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  Creator Session
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-card hover:bg-surface-elevated border border-surface-border text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition"
          >
            <LogIn className="w-4 h-4 text-brand-600" />
            Sign In / Register
          </Link>
        )}
      </div>
    </aside>
  );
}
