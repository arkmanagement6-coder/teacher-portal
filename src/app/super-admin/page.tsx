"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DbClient, Academy, SupportTicket } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { Building2, LogOut, CheckCircle, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user, logout, showToast } = useClient();
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    academiesCount: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    supportTicketsCount: 0
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'super_admin') {
      router.push('/login');
      showToast('Unauthorized access. Redirecting...', 'error');
      return;
    }

    loadSuperData();
  }, [user]);

  const loadSuperData = async () => {
    try {
      const store = localStorage.getItem('db_academies');
      const acads: Academy[] = store ? JSON.parse(store) : [];
      setAcademies(acads);

      const ticketStore = localStorage.getItem('db_support_tickets');
      const ticks: SupportTicket[] = ticketStore ? JSON.parse(ticketStore) : [];
      setTickets(ticks);

      let rev = 0;
      let activeSubs = 0;

      acads.forEach(a => {
        if (a.subscription_status === 'active') {
          activeSubs++;
          rev += a.subscription_plan === 'enterprise' ? 2999 : a.subscription_plan === 'growth' ? 1499 : 0;
        }
      });

      setStats({
        academiesCount: acads.length,
        totalRevenue: rev,
        activeSubscriptions: activeSubs,
        supportTicketsCount: ticks.filter(t => t.status === 'open').length
      });

    } catch (err) {
      showToast('Failed to load operator metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (academyId: string, plan: 'trial' | 'growth' | 'enterprise', status: 'active' | 'cancelled') => {
    try {
      const store = localStorage.getItem('db_academies');
      let acads: Academy[] = store ? JSON.parse(store) : [];
      const idx = acads.findIndex(a => a.id === academyId);
      if (idx !== -1) {
        acads[idx] = {
          ...acads[idx],
          subscription_plan: plan,
          subscription_status: status
        };
        localStorage.setItem('db_academies', JSON.stringify(acads));
        showToast('Academy subscription parameters updated!', 'success');
        loadSuperData();
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const ticketStore = localStorage.getItem('db_support_tickets');
      let ticks: SupportTicket[] = ticketStore ? JSON.parse(ticketStore) : [];
      const idx = ticks.findIndex(t => t.id === ticketId);
      if (idx !== -1) {
        ticks[idx] = { ...ticks[idx], status: 'resolved' };
        localStorage.setItem('db_support_tickets', JSON.stringify(ticks));
        showToast('Ticket marked as resolved!', 'success');
        loadSuperData();
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-50 text-slate-800">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-semibold">Configuring super operator dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm shadow-blue-500/20">
            <Layers className="w-4.5 h-4.5 fill-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900">Platform<span className="text-blue-600">Control</span></span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-semibold">{user?.name} (Super Operator)</span>
          <button 
            onClick={logout} 
            className="text-rose-600 hover:text-rose-500 p-1.5 rounded-lg bg-rose-50 border border-rose-100 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Container */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Super Operations Control</h1>
          <p className="text-xs sm:text-sm text-slate-500">Audit system registrations, payment collections and ticket backlogs</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Academies</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{stats.academiesCount}</h3>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-emerald-150 bg-emerald-50 text-emerald-700 shadow-sm">
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Global Platform Rev</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-2">₹{stats.totalRevenue}</h3>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Subs</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{stats.activeSubscriptions}</h3>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-amber-150 bg-amber-50 text-amber-700 shadow-sm">
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Support Tickets</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-amber-800 mt-2">{stats.supportTicketsCount} Open</h3>
          </div>

        </div>

        {/* Grid: Academy Listing vs Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Academy list management */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Academy Workspace Accounts</h3>
              <p className="text-[10px] text-slate-500">Monitor active subscription tiers and override plans</p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {academies.map(acad => (
                <div key={acad.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100 transition-all shadow-sm">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-850 block">{acad.name}</span>
                    <span className="text-[10px] text-slate-500 block">Plan: <strong className="text-slate-700 capitalize">{acad.subscription_plan}</strong> &bull; Status: {acad.subscription_status}</span>
                  </div>
                  <div className="flex gap-1.5">
                    
                    {acad.subscription_plan === 'trial' ? (
                      <button
                        onClick={() => handleChangePlan(acad.id, 'growth', 'active')}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-150 px-2.5 py-1 rounded text-[10px] font-bold shadow-sm"
                      >
                        Upgrade Growth
                      </button>
                    ) : (
                      <button
                        onClick={() => handleChangePlan(acad.id, 'trial', 'active')}
                        className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded text-[10px] font-bold shadow-sm"
                      >
                        Downgrade Trial
                      </button>
                    )}

                    <button
                      onClick={() => handleChangePlan(acad.id, acad.subscription_plan, acad.subscription_status === 'active' ? 'cancelled' : 'active')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold border shadow-sm ${
                        acad.subscription_status === 'active' ? 'bg-rose-50 text-rose-600 border-rose-150' : 'bg-emerald-50 text-emerald-600 border-emerald-150'
                      }`}
                    >
                      {acad.subscription_status === 'active' ? 'Cancel Sub' : 'Activate Sub'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tickets list */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Support Ticket Log</h3>
              <p className="text-[10px] text-slate-500">Resolve client requests and reports</p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {tickets.map(t => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-850">{t.academy_name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                      t.status === 'open' ? 'bg-amber-50 text-amber-600 border-amber-150 animate-pulse' : 'bg-slate-200 text-slate-550 border-slate-300'
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-650 leading-relaxed font-mono bg-white p-2 rounded border border-slate-100">
                    <strong>{t.title}</strong>: {t.description}
                  </div>
                  {t.status === 'open' && (
                    <button
                      onClick={() => handleResolveTicket(t.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2 rounded text-[10px] flex items-center justify-center gap-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve Ticket
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
