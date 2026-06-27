"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DbClient, Profile } from '@/lib/db';
import { useRouter, usePathname } from 'next/navigation';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ClientContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: Profile | null;
  setUser: (user: Profile | null) => void;
  toast: Toast | null;
  showToast: (message: string, type?: Toast['type']) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [user, setUserState] = useState<Profile | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Read theme and user from LocalStorage on mount
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.className = savedTheme === 'light' ? 'light-theme' : '';
    } else {
      document.body.className = '';
    }

    refreshUser().finally(() => setLoading(false));
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.body.className = nextTheme === 'light' ? 'light-theme' : '';
  };

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const setUser = (user: Profile | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem('db_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('db_current_user');
    }
  };

  const refreshUser = async () => {
    const curr = await DbClient.getCurrentUser();
    setUserState(curr);
  };

  const logout = async () => {
    await DbClient.signOut();
    setUserState(null);
    showToast('Logged out successfully', 'success');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <ClientContext.Provider value={{ theme, toggleTheme, user, setUser, toast, showToast, logout, refreshUser }}>
      {children}
      
      {/* Toast Notification HUD */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce glass-panel p-4 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10 max-w-sm">
          <div className={`w-3 h-3 rounded-full ${
            toast.type === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 
            toast.type === 'error' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 
            'bg-violet-500 shadow-[0_0_10px_#8b5cf6]'
          }`} />
          <p className="text-sm font-medium text-slate-800">{toast.message}</p>
        </div>
      )}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}
