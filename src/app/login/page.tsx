"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DbClient } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { Zap, Mail, Lock, LogIn, ShieldAlert, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, showToast, refreshUser } = useClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in, redirect accordingly
    DbClient.getCurrentUser().then(user => {
      if (user) {
        routeUser(user);
      }
    });
  }, []);

  const routeUser = async (user: any) => {
    if (user.role === 'super_admin') {
      router.push('/super-admin');
    } else if (user.role === 'owner') {
      const academy = await DbClient.getAcademy();
      // If owner hasn't completed setup wizard, send to setup
      if (!academy || !academy.address) {
        router.push('/setup');
      } else {
        router.push('/owner');
      }
    } else if (user.role === 'teacher') {
      router.push('/teacher');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await DbClient.signIn(email, password);
      if (res.success && res.user) {
        setUser(res.user);
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        routeUser(res.user);
      } else {
        showToast(res.error || 'Login failed', 'error');
      }
    } catch (err: any) {
      showToast('Error signing in', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = async (mockEmail: string) => {
    setLoading(true);
    try {
      const res = await DbClient.signIn(mockEmail, 'password123');
      if (res.success && res.user) {
        setUser(res.user);
        showToast(`Demo Logged in as ${res.user.name} (${res.user.role})`, 'success');
        routeUser(res.user);
      }
    } catch (err) {
      showToast('Mock login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-in">
        {/* Logo Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="bg-violet-600 p-2.5 rounded-2xl text-white shadow-[0_0_20px_#8b5cf6] w-fit">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mt-2">Sign in to your account</h2>
          <p className="text-zinc-400 text-xs sm:text-sm">Manage student fees and collections efficiently</p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@academy.com"
                  className="w-full bg-zinc-950 border border-white/5 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-white/5 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-[0_4px_12px_rgba(139,92,246,0.2)] flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Quick Demo logins */}
          <div className="mt-6 border-t border-white/5 pt-6 space-y-4">
            <div className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> One-Click Demo Mode
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleMockLogin('owner@test.com')}
                className="bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-violet-500/20 text-zinc-300 p-2 rounded-xl text-[10px] sm:text-xs font-medium flex flex-col items-center gap-1 transition-all"
              >
                <span>Owner Portal</span>
                <span className="text-[8px] text-violet-400">Vikram (Apex)</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleMockLogin('teacher@test.com')}
                className="bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-violet-500/20 text-zinc-300 p-2 rounded-xl text-[10px] sm:text-xs font-medium flex flex-col items-center gap-1 transition-all"
              >
                <span>Teacher Portal</span>
                <span className="text-[8px] text-violet-400">Neelam Sen</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleMockLogin('admin@test.com')}
                className="bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-violet-500/20 text-zinc-300 p-2 rounded-xl text-[10px] sm:text-xs font-medium flex flex-col items-center gap-1 transition-all"
              >
                <span>Super Admin</span>
                <span className="text-[8px] text-violet-400">Platform Mgr</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <p className="text-center text-xs text-zinc-500">
          Don't have an academy account yet?{' '}
          <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-bold transition-colors">
            Register Academy
          </Link>
        </p>

      </div>
    </div>
  );
}
