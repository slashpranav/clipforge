'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { Film, Lock, Mail, AlertCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { AnimatedContent, BlurText, Magnet, SpotlightCard, StarBorder } from '@/components/reactbits';

export default function AuthPage() {
  const router = useRouter();
  const { login, register, isAuthenticated } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('creator@clipforge.com');
    setPassword('SuperSecret123!');
  };

  return (
    <div className="min-h-[78vh] flex items-center justify-center p-4">
      <AnimatedContent distance={18} duration={0.45} className="w-full max-w-md">
        <StarBorder className="shadow-[0_16px_42px_-16px_rgba(225,29,72,0.2)]">
          <SpotlightCard className="relative w-full studio-card rounded-3xl p-7 md:p-9 space-y-6 overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-48 rounded-full bg-brand-400/20 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-600/25">
                <Film className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex justify-center">
                <BlurText text={isRegister ? 'Create Studio Account' : 'Sign In to ClipForge'} delay={40} />
              </h2>
              <p className="text-xs text-slate-500">
                {isRegister
                  ? 'Start generating multi-clip 9:16 shorts with Hindi captions'
                  : 'Access your projects, highlights, and vertical exports'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-elevated border border-surface-border text-xs font-semibold">
              {[
                { label: 'Sign In', val: false },
                { label: 'Create Account', val: true },
              ].map((tab) => {
                const active = isRegister === tab.val;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => {
                      setIsRegister(tab.val);
                      setError(null);
                    }}
                    className={`relative py-2 rounded-lg transition-colors ${
                      active ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="auth-mode-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="absolute inset-0 rounded-lg bg-surface-card shadow-sm"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@clipforge.com"
                className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-surface-elevated/80 border border-surface-border text-slate-900 text-sm placeholder:text-slate-400 focus:bg-surface-card focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-surface-elevated/80 border border-surface-border text-slate-900 text-sm placeholder:text-slate-400 focus:bg-surface-card focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
              />
            </div>
          </div>

          <Magnet magnetStrength={5} padding={16} className="w-full">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 hover:from-brand-500 hover:to-orange-400 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-brand-600/25 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Create Studio Account' : 'Enter Studio'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </Magnet>
        </form>

        {/* Demo Account Helper */}
        <div className="p-3.5 rounded-2xl bg-brand-50/60 border border-brand-200/70 flex items-center justify-between text-xs">
          <div>
            <div className="text-slate-800 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Demo Creator Account
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Try the studio instantly</div>
          </div>
          <button
            type="button"
            onClick={handleDemoFill}
            className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-brand-50 border border-brand-200 text-brand-700 font-semibold shadow-sm transition"
          >
            Auto-fill
          </button>
        </div>
          </SpotlightCard>
        </StarBorder>
      </AnimatedContent>
    </div>
  );
}
