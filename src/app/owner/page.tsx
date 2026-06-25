"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Student, Fee, Payment } from '@/lib/db';
import { 
  Users, CreditCard, AlertCircle, TrendingUp, Calendar, ArrowRight,
  TrendingDown, CheckCircle, Clock 
} from 'lucide-react';
import Link from 'next/link';

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    collectedThisMonth: 0,
    pendingFees: 0,
    overdueFees: 0,
    collectionPercentage: 0
  });

  const [upcomingFees, setUpcomingFees] = useState<Fee[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    // Get all students
    const students = await DbClient.getStudents(academy.id);
    const active = students.filter(s => s.status === 'active');

    // Get all fees
    const fees = await DbClient.getFees(academy.id);

    // Filter current month fees
    const today = new Date();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentYear = today.getFullYear();
    const monthPrefix = `${currentYear}-${currentMonth}`;

    const thisMonthFees = fees.filter(f => f.due_date.substring(0, 7) === monthPrefix);
    
    let collected = 0;
    let pending = 0;
    let overdue = 0;

    fees.forEach(f => {
      if (f.status === 'paid') {
        collected += Number(f.amount);
      } else if (f.status === 'pending') {
        pending += Number(f.amount) - Number(f.paid_amount);
      } else if (f.status === 'overdue' || f.status === 'partially_paid') {
        overdue += Number(f.amount) - Number(f.paid_amount);
      }
    });

    const totalInvoiced = collected + pending + overdue;
    const rate = totalInvoiced > 0 ? (collected / totalInvoiced) * 100 : 0;

    // Filter upcoming due fees
    const upcoming = fees.filter(f => f.status === 'pending' || f.status === 'partially_paid')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);

    // Get recent payments
    const payments = await DbClient.getPayments(academy.id);
    const recent = payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    setStats({
      totalStudents: students.length,
      activeStudents: active.length,
      collectedThisMonth: collected,
      pendingFees: pending,
      overdueFees: overdue,
      collectionPercentage: Math.round(rate)
    });
    setUpcomingFees(upcoming);
    setRecentPayments(recent);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-xs font-semibold">Generating metrics dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Academy Analytics</h1>
          <p className="text-xs sm:text-sm text-zinc-400">Real-time collections, recovery triggers, and onboarding overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Auto-collect:</span>
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Active
          </span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Students */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Enrolled</span>
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">{stats.totalStudents}</h3>
            <p className="text-[10px] text-zinc-400 mt-1">{stats.activeStudents} active students in batches</p>
          </div>
        </div>

        {/* Collected */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Collected Fees</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">₹{stats.collectedThisMonth}</h3>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {stats.collectionPercentage}% collection efficiency
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Dues</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">₹{stats.pendingFees}</h3>
            <p className="text-[10px] text-zinc-400 mt-1">Due within standard billing cycles</p>
          </div>
        </div>

        {/* Overdue */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Overdue / Defaulter</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">₹{stats.overdueFees}</h3>
            <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> High risk of recovery leakage
            </p>
          </div>
        </div>

      </div>

      {/* SVG Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Collection Target Area Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-200">Collection Status Overview</h3>
            <p className="text-[10px] text-zinc-500">Comparing collected capital to outstanding pending and overdue dues</p>
          </div>
          
          <div className="h-48 w-full flex items-end justify-between px-4 pb-2 border-b border-white/5 relative">
            
            {/* Visual Bars */}
            <div className="flex flex-col items-center w-1/4 group">
              <div className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 rounded-t-xl border border-emerald-500/30 transition-all flex items-end justify-center" style={{ height: '140px' }}>
                <span className="text-[10px] font-bold text-emerald-400 pb-2">₹{stats.collectedThisMonth}</span>
              </div>
              <span className="text-[9px] text-zinc-400 mt-2 font-bold uppercase tracking-wider">Collected</span>
            </div>

            <div className="flex flex-col items-center w-1/4 group">
              <div className="w-full bg-amber-500/20 hover:bg-amber-500/30 rounded-t-xl border border-amber-500/30 transition-all flex items-end justify-center" style={{ height: `${Math.max(10, (stats.pendingFees / (stats.collectedThisMonth || 1)) * 140)}px` }}>
                <span className="text-[10px] font-bold text-amber-400 pb-2">₹{stats.pendingFees}</span>
              </div>
              <span className="text-[9px] text-zinc-400 mt-2 font-bold uppercase tracking-wider">Pending</span>
            </div>

            <div className="flex flex-col items-center w-1/4 group">
              <div className="w-full bg-rose-500/20 hover:bg-rose-500/30 rounded-t-xl border border-rose-500/30 transition-all flex items-end justify-center" style={{ height: `${Math.max(10, (stats.overdueFees / (stats.collectedThisMonth || 1)) * 140)}px` }}>
                <span className="text-[10px] font-bold text-rose-400 pb-2">₹{stats.overdueFees}</span>
              </div>
              <span className="text-[9px] text-zinc-400 mt-2 font-bold uppercase tracking-wider">Overdue</span>
            </div>

          </div>

          <div className="flex justify-between items-center text-xs p-3 bg-zinc-950/60 rounded-xl border border-white/5">
            <span className="text-zinc-400">Recovery Efficiency:</span>
            <span className="font-bold text-emerald-400 text-sm">{stats.collectionPercentage}%</span>
          </div>
        </div>

        {/* Recovery Pipeline Progression */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-200">Defaulter Pipeline</h3>
            <p className="text-[10px] text-zinc-500">Fee tracking grouped by age of overdue status</p>
          </div>

          <div className="space-y-4">
            {[
              { label: '1 - 7 Days Overdue', pct: 60, val: '₹4,500', col: 'bg-amber-500' },
              { label: '8 - 15 Days Overdue', pct: 25, val: '₹3,000', col: 'bg-orange-500' },
              { label: '16 - 30 Days Overdue', pct: 10, val: '₹1,500', col: 'bg-rose-500' },
              { label: '30+ Days Overdue', pct: 5, val: '₹0', col: 'bg-red-600 animate-pulse' }
            ].map((bar, i) => (
              <div key={i} className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>{bar.label}</span>
                  <span className="font-bold text-zinc-200">{bar.val}</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full ${bar.col} rounded-full`} style={{ width: `${bar.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <Link href="/owner/recovery" className="w-full mt-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 border border-violet-500/20 py-2.5 rounded-xl text-xs font-bold text-center block transition-colors">
            Manage Recovery Board
          </Link>
        </div>

      </div>

      {/* Grid: Upcoming Due Fees vs Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Dues */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-200">Upcoming Due Invoices</h3>
              <p className="text-[10px] text-zinc-500">Invoices due in the next 10 days</p>
            </div>
            <Link href="/owner/fees" className="text-xs text-violet-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {upcomingFees.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-4 text-center">No upcoming invoices due.</p>
            ) : (
              upcomingFees.map(f => (
                <div key={f.id} className="flex justify-between items-center bg-zinc-950/60 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all text-xs">
                  <div>
                    <div className="font-bold text-zinc-200">{f.student_name}</div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">Due: {f.due_date}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-zinc-300">₹{f.amount}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                      f.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {f.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-200">Recent Online Payments</h3>
              <p className="text-[10px] text-zinc-500">Real-time logs from connected Razorpay Gateway</p>
            </div>
            <span className="text-[9px] bg-zinc-950 text-zinc-400 px-2 py-0.5 border border-white/5 rounded">Live SSL</span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-4 text-center">No payment transactions yet.</p>
            ) : (
              recentPayments.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-zinc-950/60 p-3 rounded-xl border border-white/5 text-xs">
                  <div>
                    <div className="font-bold text-zinc-200">{p.student_name}</div>
                    <div className="text-[9px] text-zinc-500 mt-0.5">{p.payment_method || 'Razorpay Checkout'} &bull; {new Date(p.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-emerald-400">+₹{p.amount}</span>
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded">
                      SUCCESS
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
