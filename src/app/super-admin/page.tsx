"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DbClient, Academy, SupportTicket } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { 
  Building2, Users, DollarSign, Ticket, ShieldAlert, 
  Settings, LogOut, CheckCircle, HelpCircle, ArrowUpRight 
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user, logout, showToast } = useClient();
  const [stats, setStats] = useState({
    academiesCount: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    supportTicketsCount: 0
  });

  const [academies, setAcademies] = useState<Academy[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'super_admin') {
      router.push('/login');
      return;
    }
    loadSuperData();
  }, [user]);

  const loadSuperData = async () => {
    const s = await DbClient.getPlatformStats();
    setStats(s);

    const aList = await DbClient.getSuperAdminAcademies();
    setAcademies(aList);

    const tList = await DbClient.getSupportTickets();
    setTickets(tList);

    setLoading(false);
  };

  const handleResolveTicket = async (id: string) => {
    await DbClient.updateTicketStatus(id, 'resolved');
    showToast('Support ticket resolved!', 'success');
    loadSuperData();
  };

  const handleChangePlan = async (id: string, plan: Academy['subscription_plan'], status: Academy['subscription_status']) => {
    await DbClient.changeAcademyPlan(id, plan, status);
    showToast('Academy billing plan updated!', 'success');
    loadSuperData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-[#09090b]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-xs font-semibold">Configuring super operator dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070708] text-zinc-100 pb-20">
      
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-zinc-950 border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-violet-600 p-1.5 rounded-lg text-white">
            <Building2 className="w-4.5 h-4.5 fill-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">Platform<span className="text-violet-400">Control</span></span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-400 font-semibold">{user?.name} (Super Operator)</span>
          <button 
            onClick={logout} 
            className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Container */}
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-white">Super Operations Control</h1>
          <p className="text-xs sm:text-sm text-zinc-400">Audit system registrations, payment collections and ticket backlogs</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Academies</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-2">{stats.academiesCount}</h3>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 text-emerald-400 bg-emerald-500/5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Global Platform Rev</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-2">₹{stats.totalRevenue}</h3>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Active Subs</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-2">{stats.activeSubscriptions}</h3>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 text-amber-400 bg-amber-500/5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Support Tickets</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-2">{stats.supportTicketsCount} Open</h3>
          </div>

        </div>

        {/* Grid: Academy Listing vs Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Academy list management */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-200">Academy Workspace Accounts</h3>
              <p className="text-[10px] text-zinc-500">Monitor active subscription tiers and override plans</p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {academies.map(acad => (
                <div key={acad.id} className="p-3.5 bg-zinc-950/80 rounded-xl border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-all">
                  <div className="space-y-1">
                    <span className="font-bold text-zinc-200 block">{acad.name}</span>
                    <span className="text-[10px] text-zinc-500 block">Plan: <strong className="text-zinc-300 capitalize">{acad.subscription_plan}</strong> &bull; Status: {acad.subscription_status}</span>
                  </div>
                  <div className="flex gap-1.5">
                    
                    {acad.subscription_plan === 'trial' ? (
                      <button
                        onClick={() => handleChangePlan(acad.id, 'growth', 'active')}
                        className="bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 border border-violet-500/20 px-2.5 py-1 rounded text-[10px] font-bold"
                      >
                        Upgrade Growth
                      </button>
                    ) : (
                      <button
                        onClick={() => handleChangePlan(acad.id, 'trial', 'active')}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-white/5 px-2.5 py-1 rounded text-[10px] font-bold"
                      >
                        Downgrade Trial
                      </button>
                    )}

                    <button
                      onClick={() => handleChangePlan(acad.id, acad.subscription_plan, acad.subscription_status === 'active' ? 'cancelled' : 'active')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                        acad.subscription_status === 'active' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
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
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-200">Support Ticket Log</h3>
              <p className="text-[10px] text-zinc-500">Resolve client requests and reports</p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {tickets.map(t => (
                <div key={t.id} className="p-3 bg-zinc-950/60 rounded-xl border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-200">{t.academy_name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      t.status === 'open' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-relaxed font-mono bg-zinc-900/40 p-2 rounded">
                    <strong>{t.title}</strong>: {t.description}
                  </div>
                  {t.status === 'open' && (
                    <button
                      onClick={() => handleResolveTicket(t.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2 rounded text-[10px] flex items-center justify-center gap-1"
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
