"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Student, Fee, WhatsAppLog } from '@/lib/db';
import { 
  Users, CreditCard, AlertCircle, TrendingUp, Calendar, ArrowRight,
  TrendingDown, CheckCircle2, Clock, Upload, Bell, ShieldCheck, Check, X 
} from 'lucide-react';
import Link from 'next/link';
import { useClient } from '@/components/client-provider';

export default function OwnerDashboard() {
  const { showToast } = useClient();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    collectionRate: 0,
    pendingFees: 0,
    todaysDue: 0,
    overdueFees: 0,
    recoveredThisMonth: 0
  });

  const [awaitingVerification, setAwaitingVerification] = useState<Fee[]>([]);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [recentPayments, setRecentPayments] = useState<Fee[]>([]);
  const [recentReminders, setRecentReminders] = useState<WhatsAppLog[]>([]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const academy = await DbClient.getAcademy();
      if (!academy) return;

      const fList = await DbClient.getFees(academy.id);
      const sList = await DbClient.getStudents(academy.id);
      const logs = await DbClient.getWhatsAppLogs(academy.id);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayDay = new Date().getDate();

      let collected = 0;
      let pending = 0;
      let overdue = 0;
      let todaysDue = 0;
      let recoveredMonth = 0;

      fList.forEach(f => {
        const amt = Number(f.amount);
        const paid = Number(f.paid_amount || 0);

        if (f.status === 'paid') {
          collected += amt;
          recoveredMonth += amt;
        } else {
          const outstanding = amt - paid;
          
          if (f.status === 'overdue') {
            overdue += outstanding;
          } else {
            pending += outstanding;
          }

          // Check if due day of month matches today
          const dueDay = new Date(f.due_date).getDate();
          if (dueDay === todayDay) {
            todaysDue += outstanding;
          }
        }
      });

      const totalInvoiced = collected + pending + overdue;
      const collectionRate = totalInvoiced > 0 ? Math.round((collected / totalInvoiced) * 100) : 0;

      // Filter screenshot verifications
      const verifs = fList.filter(f => f.screenshot_status === 'pending_verification');

      // Filter students with pending dues
      const pendingStdIds = new Set(fList.filter(f => f.status !== 'paid').map(f => f.student_id));
      const pendingStds = sList.filter(s => pendingStdIds.has(s.id));

      // Recent payments (marked paid)
      const paidFees = fList.filter(f => f.status === 'paid')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      // Recent reminders
      const recentLogs = logs.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()).slice(0, 5);

      setStats({
        collectionRate,
        pendingFees: pending,
        todaysDue,
        overdueFees: overdue,
        recoveredThisMonth: collected
      });

      setAwaitingVerification(verifs);
      setPendingStudents(pendingStds.slice(0, 5));
      setRecentPayments(paidFees);
      setRecentReminders(recentLogs);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyScreenshot = async (feeId: string, approve: boolean) => {
    try {
      if (approve) {
        // Find the fee to read its amount
        const store = localStorage.getItem('db_fees');
        const fees: Fee[] = store ? JSON.parse(store) : [];
        const fee = fees.find(f => f.id === feeId);
        const amount = fee ? Number(fee.amount) : 0;

        await DbClient.updateFee(feeId, {
          status: 'paid',
          paid_amount: amount,
          screenshot_status: 'approved'
        });
        showToast('Payment screenshot approved! Status: Paid.', 'success');
      } else {
        await DbClient.updateFee(feeId, {
          screenshot_status: 'rejected'
        });
        showToast('Screenshot rejected. Notified parent to re-upload.', 'error');
      }
      loadDashboardStats();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-800">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-semibold">Generating recovery metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Fee Recovery Pipeline</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Automate collections, track direct transfers, and manage screenshot validations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Autopilot Recovery:</span>
          <span className="bg-blue-50 border border-blue-100 text-blue-600 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" /> Active
          </span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Collection Rate */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Collection Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-blue-600">{stats.collectionRate}%</h3>
            <p className="text-[9px] text-slate-400 mt-1">On-time recovery efficiency</p>
          </div>
        </div>

        {/* Pending Fees */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Pending Dues</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-800">₹{stats.pendingFees}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Due within current cycle</p>
          </div>
        </div>

        {/* Today's Due */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Today's Due</span>
            <Calendar className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-800">₹{stats.todaysDue}</h3>
            <p className="text-[9px] text-rose-600 font-bold mt-1">Action required today</p>
          </div>
        </div>

        {/* Overdue Fees */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Overdue Fees</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-rose-600">₹{stats.overdueFees}</h3>
            <p className="text-[9px] text-rose-500 mt-1 flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5 animate-bounce" /> Defaulter risk leaks
            </p>
          </div>
        </div>

        {/* Recovered Month */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-sm col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Recovered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-emerald-600">₹{stats.recoveredThisMonth}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Directly received this month</p>
          </div>
        </div>

      </div>

      {/* Awaiting Screenshot Verification Section */}
      {awaitingVerification.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-orange-200 bg-orange-50/20 space-y-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Upload className="w-4.5 h-4.5 text-orange-500" /> Payment Receipts Awaiting Verification ({awaitingVerification.length})
            </h3>
            <span className="text-[9px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded border border-orange-200">Needs Review</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {awaitingVerification.map(f => (
              <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 text-xs shadow-sm">
                <a href={f.screenshot_url} target="_blank" rel="noreferrer" className="flex-shrink-0 group relative block">
                  <img 
                    src={f.screenshot_url} 
                    alt="Receipt Screenshot" 
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-[8px] text-white font-bold uppercase">View</div>
                </a>
                
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-slate-850 block truncate">{f.student_name}</strong>
                      <span className="text-[9px] text-slate-400">{f.batch_name || 'Chess Batch'} &bull; Due: {f.due_date}</span>
                    </div>
                    <span className="font-extrabold text-blue-600 text-xs">₹{f.amount}</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => handleVerifyScreenshot(f.id, true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-[9px] flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3 h-3" /> Approve & Mark Paid
                    </button>
                    <button 
                      onClick={() => handleVerifyScreenshot(f.id, false)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-3 py-1 rounded-lg text-[9px] flex items-center gap-1 font-bold"
                    >
                      <X className="w-3 h-3" /> Reject Receipt
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Pending Students, Recent Payments, Recent Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Students With Pending Dues */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-1 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Defaulter Roster</h3>
              <p className="text-[9px] text-slate-400">Students with outstanding fees</p>
            </div>
            <Link href="/owner/recovery" className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1">
              Smart Board <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
            {pendingStudents.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">All student payments are verified!</p>
            ) : (
              pendingStudents.map(s => (
                <div key={s.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-xs shadow-sm hover:border-slate-200 transition-all">
                  <div>
                    <span className="font-bold text-slate-800 block">{s.name}</span>
                    <span className="text-[9px] text-slate-550 mt-0.5">Parent: {s.parent_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-rose-650 block">₹{s.monthly_fee}</span>
                    <span className="text-[8px] text-slate-400 block font-mono">Code: {s.roll_no || '101'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Confirmed Payments */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-1 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Recent Receipts</h3>
              <p className="text-[9px] text-slate-400">Confirmed direct transfers</p>
            </div>
            <Link href="/owner/fees" className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1">
              Payments <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No receipt transfers logged.</p>
            ) : (
              recentPayments.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-xs shadow-sm">
                  <div>
                    <span className="font-bold text-slate-800 block">{p.student_name}</span>
                    <span className="text-[9px] text-slate-500 mt-0.5">Cycle: {p.billing_cycle.toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-600 block">+₹{p.amount}</span>
                    <span className="text-[8px] text-slate-400 block">Verified: Direct</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reminders Dispatched */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-1 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Outbound Alerts</h3>
              <p className="text-[9px] text-slate-400">Recently dispatched alerts</p>
            </div>
            <Link href="/owner/whatsapp" className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1">
              Automation <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
            {recentReminders.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No outbox reminders sent yet.</p>
            ) : (
              recentReminders.map(l => (
                <div key={l.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-xs shadow-sm">
                  <div>
                    <span className="font-bold text-slate-800 block">{l.student_name}</span>
                    <span className="text-[9px] text-slate-550 capitalize mt-0.5">{l.type.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block font-mono">({l.sent_to})</span>
                    <span className={`text-[8px] font-bold uppercase mt-0.5 block ${
                      l.status === 'delivered' ? 'text-emerald-600' : 'text-slate-400'
                    }`}>{l.status}</span>
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
