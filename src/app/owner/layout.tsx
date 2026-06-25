"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useClient } from '@/components/client-provider';
import { DbClient, Academy } from '@/lib/db';
import { 
  LayoutDashboard, Users, Clock, ShieldCheck, CreditCard, 
  MessageSquare, BarChart3, Settings, LogOut, Sun, Moon, Menu, X, Zap 
} from 'lucide-react';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, theme, toggleTheme, showToast } = useClient();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'owner') {
      router.push('/login');
      showToast('Unauthorized access. Redirecting...', 'error');
      return;
    }

    DbClient.getAcademy().then(acad => {
      setAcademy(acad);
    });
  }, [user]);

  const navItems = [
    { name: 'Dashboard', path: '/owner', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { name: 'Students', path: '/owner/students', icon: <Users className="w-4.5 h-4.5" /> },
    { name: 'Batches', path: '/owner/batches', icon: <Clock className="w-4.5 h-4.5" /> },
    { name: 'Teachers', path: '/owner/teachers', icon: <ShieldCheck className="w-4.5 h-4.5" /> },
    { name: 'Fee Management', path: '/owner/fees', icon: <CreditCard className="w-4.5 h-4.5" /> },
    { name: 'Recovery Board', path: '/owner/recovery', icon: <BarChart3 className="w-4.5 h-4.5" /> },
    { name: 'WhatsApp API', path: '/owner/whatsapp', icon: <MessageSquare className="w-4.5 h-4.5" /> },
    { name: 'Reports', path: '/owner/reports', icon: <BarChart3 className="w-4.5 h-4.5" /> },
    { name: 'Settings', path: '/owner/settings', icon: <Settings className="w-4.5 h-4.5" /> }
  ];

  if (!user || user.role !== 'owner') return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 flex-shrink-0">
        
        {/* Logo and Academy Header */}
        <div className="p-6 border-b border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm shadow-blue-500/20">
              <Zap className="w-4.5 h-4.5 fill-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900">Remind<span className="text-orange-500">Flow</span></span>
          </div>
          {academy && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Academy Workspace</span>
              <span className="text-xs font-bold text-slate-700 block truncate mt-0.5">{academy.name}</span>
            </div>
          )}
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <Link
                key={idx}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100 font-bold' 
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50/50'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-100 bg-white space-y-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Theme Mode</span>
            <button 
              onClick={toggleTheme} 
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
              <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{user.role}</div>
            </div>
            <button 
              onClick={logout} 
              className="text-rose-600 hover:text-rose-500 p-1.5 rounded-lg bg-rose-50 border border-rose-100 hover:scale-105 active:scale-95 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Nav Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900">Remind<span className="text-orange-500">Flow</span></span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme} 
            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white/95 backdrop-blur-md pt-20 px-6 flex flex-col justify-between pb-10 text-slate-800">
          <nav className="space-y-2">
            {navItems.map((item, idx) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={idx}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600 bg-slate-50 border border-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">{user.name}</div>
                <div className="text-[9px] text-slate-400">{user.role}</div>
              </div>
              <button 
                onClick={() => { setMobileMenuOpen(false); logout(); }} 
                className="bg-rose-600 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-h-screen">
        {children}
      </main>

    </div>
  );
}
