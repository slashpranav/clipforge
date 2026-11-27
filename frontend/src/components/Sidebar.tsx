'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'New Project', href: '/projects/new', icon: PlusCircle },
    { label: 'Project History', href: '/projects', icon: FolderKanban },
  ];

  return (
    <aside className="hidden md:flex w-64 border-r border-white/[0.07] bg-[#0b0e16]/90 backdrop-blur-xl flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Brand Header */}
        <Link
          href="/"
          className="h-16 flex items-center px-5 border-b border-white/[0.06] gap-3 group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/30 ring-1 ring-white/20 group-hover:scale-105 transition">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[15px] tracking-tight text-white flex items-center gap-1.5">
              ClipForge
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30 font-mono font-semibold">
                AI
              </span>
            </div>
            <div className="text-[11px] text-slate-400 leading-none mt-0.5">
              9:16 Shorts Studio
            </div>
          </div>
        </Link>

        {/* Quick Create CTA */}
        <div className="px-4 pt-4">
          <Link
            href="/projects/new"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 ring-1 ring-white/15 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Create Multi-Clips
          </Link>
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
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500/15 text-white border border-brand-500/25 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-400" />
                )}
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card */}
      <div className="p-4 border-t border-white/[0.06] bg-black/20">
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500/30 to-indigo-500/30 text-brand-200 border border-brand-400/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user.email.charAt(0)}
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-slate-100 truncate">{user.email}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  Creator Session
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-200 hover:text-white transition"
          >
            <LogIn className="w-4 h-4 text-brand-400" />
            Sign In / Register
          </Link>
        )}
      </div>
    </aside>
  );
}
