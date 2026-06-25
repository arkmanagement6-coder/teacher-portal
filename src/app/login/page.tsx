"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DbClient } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { Zap, Mail, Lock, LogIn, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, showToast } = useClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden text-slate-800">
      
      {/* Background highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-in">
        {/* Logo Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-md shadow-blue-500/20 w-fit">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-2">Sign in to your account</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Manage student fees and collections efficiently</p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl bg-white">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@academy.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-xs text-orange-600 hover:text-orange-500 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
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
          <div className="mt-6 border-t border-slate-200 pt-6 space-y-4">
            <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" /> One-Click Demo Mode
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleMockLogin('owner@test.com')}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-xl text-[10px] sm:text-xs font-medium flex flex-col items-center gap-1 transition-all"
              >
                <span>Owner Portal</span>
                <span className="text-[8px] text-orange-600">Vikram (Apex)</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleMockLogin('teacher@test.com')}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-xl text-[10px] sm:text-xs font-medium flex flex-col items-center gap-1 transition-all"
              >
                <span>Teacher Portal</span>
                <span className="text-[8px] text-orange-600">Neelam Sen</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleMockLogin('admin@test.com')}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-xl text-[10px] sm:text-xs font-medium flex flex-col items-center gap-1 transition-all"
              >
                <span>Super Admin</span>
                <span className="text-[8px] text-orange-600">Platform Mgr</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <p className="text-center text-xs text-slate-500">
          Don't have an academy account yet?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-500 font-bold transition-colors">
            Register Academy
          </Link>
        </p>

      </div>
    </div>
  );
}
