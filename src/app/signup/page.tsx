"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DbClient } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { Zap, Mail, Lock, User, Phone, School, UserPlus } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { setUser, showToast } = useClient();
  const [academyName, setAcademyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyName || !ownerName || !mobile || !email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await DbClient.signUp({
        email,
        password,
        name: ownerName,
        academyName,
        mobile
      });

      if (res.success && res.user) {
        setUser(res.user);
        showToast('Academy account created successfully!', 'success');
        router.push('/setup'); // send to wizard
      } else {
        showToast(res.error || 'Registration failed', 'error');
      }
    } catch (err: any) {
      showToast('Error registering account', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] flex items-center justify-center px-4 relative overflow-hidden py-12">
      
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-in">
        {/* Logo Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="bg-violet-600 p-2.5 rounded-2xl text-white shadow-[0_0_20px_#8b5cf6] w-fit">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mt-2">Create your Academy workspace</h2>
          <p className="text-zinc-400 text-xs sm:text-sm">Recover pending fees automatically and log attendance</p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl">
          <form onSubmit={handleSignup} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Academy / Institute Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <School className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  placeholder="e.g. Apex Chess Academy"
                  className="w-full bg-zinc-950 border border-white/5 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Owner / Admin Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Vikram Aditya"
                  className="w-full bg-zinc-950 border border-white/5 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Mobile Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-zinc-950 border border-white/5 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

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
                    placeholder="owner@academy.com"
                    className="w-full bg-zinc-950 border border-white/5 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Password</label>
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
                  <UserPlus className="w-4 h-4" /> Register & Setup Workspace
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer links */}
        <p className="text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-bold transition-colors">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}
