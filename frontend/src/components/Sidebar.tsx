'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Film,
  PlusCircle,
  FolderKanban,
  Activity,
  Sparkles,
  LogOut,
  LogIn,
  Sliders,
  Scissors
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: Activity },
    { label: 'New Project', href: '/projects/new', icon: PlusCircle },
    { label: 'Project History', href: '/projects', icon: FolderKanban },
    { label: 'System Health', href: '/health', icon: Sliders },
  ];

  return (
    <aside className="w-64 border-r border-surface-border bg-surface flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-surface-border/60 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              ClipForge <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono">AI</span>
            </div>
            <div className="text-[11px] text-surface-muted leading-none">
              9:16 Shorts Engine
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          <div className="text-[11px] font-semibold tracking-wider text-surface-muted uppercase px-3 py-1">
            Studio Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Status */}
      <div className="p-4 border-t border-surface-border/60 bg-surface/50">
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user.email.charAt(0)}
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-slate-200 truncate">{user.email}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  Active Creator
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-md hover:bg-surface-card text-slate-400 hover:text-rose-400 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-card hover:bg-surface-cardHover border border-surface-border text-xs font-medium text-slate-300 hover:text-white transition"
          >
            <LogIn className="w-4 h-4 text-brand-400" />
            Sign In / Register
          </Link>
        )}
      </div>
    </aside>
  );
}
