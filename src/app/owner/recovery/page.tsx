"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Fee, Student } from '@/lib/db';
import { WhatsAppService } from '@/lib/whatsapp';
import { useClient } from '@/components/client-provider';
import { 
  AlertTriangle, MessageSquare, PhoneCall, CheckSquare, 
  Filter, Search, ArrowDownWideNarrow, ShieldCheck 
} from 'lucide-react';

interface Defaulter {
  feeId: string;
  studentId: string;
  studentName: string;
  parentName: string;
  mobile: string;
  dueAmount: number;
  dueDate: string;
  daysOverdue: number;
  lastReminderDate: string;
}

export default function RecoveryDashboard() {
  const { showToast } = useClient();
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [totals, setTotals] = useState({ dueAmount: 0, overdueAmount: 0, count: 0 });
  const [filterRange, setFilterRange] = useState<'all' | '1-7' | '7-15' | '15-30' | '30+'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecoveryData();
  }, []);

  const loadRecoveryData = async () => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    const fees = await DbClient.getFees(academy.id);
    const students = await DbClient.getStudents(academy.id);
    const logs = await DbClient.getWhatsAppLogs(academy.id);

    const today = new Date();
    let totalDue = 0;
    let totalOverdue = 0;
    const items: Defaulter[] = [];

    fees.forEach(f => {
      const balance = Number(f.amount) - Number(f.paid_amount);
      if (balance <= 0) return;

      const dueDateObj = new Date(f.due_date);
      const diffTime = today.getTime() - dueDateObj.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      totalDue += balance;
      
      let isOverdue = false;
      let days = 0;
      if (diffDays > 0) {
        totalOverdue += balance;
        isOverdue = true;
        days = diffDays;
      }

      if (f.status === 'overdue' || isOverdue) {
        const student = students.find(s => s.id === f.student_id);
        const lastLog = logs.find(l => l.student_id === f.student_id && l.type === 'overdue_reminder');
        
        items.push({
          feeId: f.id,
          studentId: f.student_id,
          studentName: student ? student.name : 'Unknown Student',
          parentName: student ? student.parent_name : 'Parent',
          mobile: student ? student.whatsapp || student.mobile : '',
          dueAmount: balance,
          dueDate: f.due_date,
          daysOverdue: days,
          lastReminderDate: lastLog ? new Date(lastLog.sent_at).toLocaleDateString() : 'Never'
        });
      }
    });

    items.sort((a, b) => b.dueAmount - a.dueAmount);

    setDefaulters(items);
    setTotals({
      dueAmount: totalDue,
      overdueAmount: totalOverdue,
      count: items.length
    });
    setLoading(false);
  };

  const handleSendReminder = async (def: Defaulter) => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    try {
      await WhatsAppService.sendWhatsApp(
        academy.id,
        def.studentId,
        'overdue_reminder',
        {
          student_name: def.studentName,
          amount: def.dueAmount,
          due_date: def.dueDate,
          days_overdue: def.daysOverdue
        }
      );
      showToast(`WhatsApp reminder dispatched to parent of ${def.studentName}!`, 'success');
      loadRecoveryData();
    } catch (err) {
      showToast('WhatsApp dispatch failed', 'error');
    }
  };

  const handleCallParent = (def: Defaulter) => {
    showToast(`Opening dialer / Logging call to ${def.parentName} (${def.mobile})`, 'info');
  };

  const handleMarkPaid = async (feeId: string, amount: number) => {
    try {
      await DbClient.updateFeeStatus(feeId, 'paid', amount);
      showToast('Invoice marked as paid successfully!', 'success');
      loadRecoveryData();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const filtered = defaulters.filter(d => {
    const matchesSearch = d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterRange === 'all') return true;
    if (filterRange === '1-7') return d.daysOverdue >= 1 && d.daysOverdue <= 7;
    if (filterRange === '7-15') return d.daysOverdue > 7 && d.daysOverdue <= 15;
    if (filterRange === '15-30') return d.daysOverdue > 15 && d.daysOverdue <= 30;
    if (filterRange === '30+') return d.daysOverdue > 30;
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs">Generating recovery logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Recovery Dashboard</h1>
        <p className="text-xs text-slate-500">Track defaulter invoice aging and execute direct collection triggers</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Pending */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white flex items-center gap-4 shadow-sm bg-orange-50/20">
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 text-orange-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Outstanding Due</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{totals.dueAmount}</h3>
          </div>
        </div>

        {/* Total Overdue */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white flex items-center gap-4 shadow-sm bg-rose-50/20">
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-rose-600">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Overdue (Defaulter)</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{totals.overdueAmount}</h3>
          </div>
        </div>

        {/* Defaulter count */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white flex items-center gap-4 shadow-sm">
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-blue-600 font-extrabold text-lg w-12 h-12 flex items-center justify-center">
            {totals.count}
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Defaulters</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">Pending student profiles</h3>
          </div>
        </div>

      </div>

      {/* Filters and Actions Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60 w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or parent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder-slate-400"
          />
        </div>

        {/* Time filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
          <span className="text-slate-400 mr-1.5 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Aging filter:</span>
          {[
            { id: 'all', label: 'All Overdue' },
            { id: '1-7', label: '1 - 7 Days' },
            { id: '7-15', label: '8 - 15 Days' },
            { id: '15-30', label: '16 - 30 Days' },
            { id: '30+', label: '30+ Days' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilterRange(opt.id as any)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                filterRange === opt.id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

      </div>

      {/* Defaulter Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Student Name</th>
                <th className="p-4">Parent Name</th>
                <th className="p-4">Amount Due</th>
                <th className="p-4">Days Overdue</th>
                <th className="p-4">Last Reminder</th>
                <th className="p-4 text-right">Recovery Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-450 italic">No defaulters match the active filters.</td>
                </tr>
              ) : (
                filtered.map((def, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{def.studentName}</td>
                    <td className="p-4 text-slate-500">{def.parentName}</td>
                    <td className="p-4 font-bold text-rose-600">₹{def.dueAmount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        def.daysOverdue > 30 ? 'bg-red-50 text-red-650 border-red-100' : 
                        def.daysOverdue > 15 ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {def.daysOverdue} days
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{def.lastReminderDate}</td>
                    <td className="p-4 text-right flex justify-end gap-1.5">
                      
                      {/* WhatsApp Reminder */}
                      <button
                        onClick={() => handleSendReminder(def)}
                        title="Send WhatsApp alert"
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 p-2 rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {/* Phone Call */}
                      <button
                        onClick={() => handleCallParent(def)}
                        title="Call Parent"
                        className="bg-blue-50 hover:bg-blue-100 text-blue-650 border border-blue-100 p-2 rounded-lg transition-colors"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>

                      {/* Mark Paid */}
                      <button
                        onClick={() => handleMarkPaid(def.feeId, def.dueAmount)}
                        title="Mark invoice paid"
                        className="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-100 p-2 rounded-lg transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
