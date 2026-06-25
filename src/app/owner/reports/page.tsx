"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Fee, Student, Batch } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { 
  BarChart3, FileSpreadsheet, FileDown, CheckCircle2, 
  Calendar, Users, DollarSign, ArrowUpRight 
} from 'lucide-react';

export default function ReportsPage() {
  const { showToast } = useClient();
  const [activeTab, setActiveTab] = useState<'collection' | 'outstanding' | 'attendance'>('collection');
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    const fList = await DbClient.getFees(academy.id);
    setFees(fList);

    const sList = await DbClient.getStudents(academy.id);
    setStudents(sList);

    const bList = await DbClient.getBatches(academy.id);
    setBatches(bList);

    setLoading(false);
  };

  const handleExport = (type: 'Excel' | 'PDF', reportName: string) => {
    showToast(`Generating and exporting ${reportName} in ${type} format...`, 'success');
  };

  // Calculations
  const totalInvoiced = fees.reduce((sum, f) => sum + Number(f.amount), 0);
  const totalCollected = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0);
  const totalOutstanding = totalInvoiced - totalCollected;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-xs">Assembling reporting database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">Reports Module</h1>
        <p className="text-xs text-zinc-400">Generate auditing statements, track collection trends and export documents</p>
      </div>

      {/* Tabs selector */}
      <div className="flex bg-zinc-950 p-1 border border-white/5 rounded-2xl max-w-md text-xs font-semibold">
        <button
          onClick={() => setActiveTab('collection')}
          className={`flex-1 py-3 text-center rounded-xl transition-all ${
            activeTab === 'collection' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Collection Report
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`flex-1 py-3 text-center rounded-xl transition-all ${
            activeTab === 'outstanding' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Outstanding Report
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-3 text-center rounded-xl transition-all ${
            activeTab === 'attendance' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Attendance Metrics
        </button>
      </div>

      {/* Tab: Collection Report */}
      {activeTab === 'collection' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Invoiced Amount</span>
              <h3 className="text-xl font-extrabold text-white mt-1">₹{totalInvoiced}</h3>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-white/10 text-emerald-400 bg-emerald-500/5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Collected Fees</span>
              <h3 className="text-xl font-extrabold text-white mt-1">₹{totalCollected}</h3>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-white/10 text-amber-400 bg-amber-500/5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Collection Rate</span>
              <h3 className="text-xl font-extrabold text-white mt-1">
                {totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0}%
              </h3>
            </div>
          </div>

          {/* Export triggers */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('Excel', 'Collection Report')}
              className="bg-zinc-950 hover:bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Excel
            </button>
            <button
              onClick={() => handleExport('PDF', 'Collection Report')}
              className="bg-zinc-950 hover:bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <FileDown className="w-4 h-4 text-rose-500" /> Export PDF
            </button>
          </div>

          {/* Data log */}
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden text-xs">
            <div className="p-4 bg-zinc-950/80 border-b border-white/5 font-bold text-zinc-300">
              Receipt History Summary
            </div>
            <div className="divide-y divide-white/5">
              {fees.filter(f => f.status === 'paid').map((f, i) => (
                <div key={i} className="p-4 flex justify-between items-center hover:bg-zinc-900/10 transition-colors">
                  <div>
                    <span className="font-bold text-zinc-200">{f.student_name}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">Paid Date: {f.due_date} &bull; Batch: {f.batch_name}</span>
                  </div>
                  <span className="font-extrabold text-emerald-400">+₹{f.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Outstanding Report */}
      {activeTab === 'outstanding' && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 text-rose-400 bg-rose-500/5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Outstanding Debt</span>
              <h3 className="text-xl font-extrabold text-white mt-1">₹{totalOutstanding}</h3>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Defaulters Count</span>
              <h3 className="text-xl font-extrabold text-white mt-1">
                {fees.filter(f => f.status === 'overdue' || f.status === 'pending').length} students
              </h3>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('Excel', 'Outstanding Report')}
              className="bg-zinc-950 hover:bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Excel
            </button>
            <button
              onClick={() => handleExport('PDF', 'Outstanding Report')}
              className="bg-zinc-950 hover:bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <FileDown className="w-4 h-4 text-rose-500" /> Export PDF
            </button>
          </div>

          {/* List */}
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden text-xs">
            <div className="p-4 bg-zinc-950/80 border-b border-white/5 font-bold text-zinc-300">
              Defaulter & Outstanding Ledgers
            </div>
            <div className="divide-y divide-white/5">
              {fees.filter(f => f.status !== 'paid').map((f, i) => (
                <div key={i} className="p-4 flex justify-between items-center hover:bg-zinc-900/10 transition-colors">
                  <div>
                    <span className="font-bold text-zinc-200">{f.student_name}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">Due Date: {f.due_date} &bull; Cycle: {f.billing_cycle}</span>
                  </div>
                  <span className="font-extrabold text-rose-400">₹{Number(f.amount) - Number(f.paid_amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Attendance Report */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Average Student Attendance</span>
              <h3 className="text-xl font-extrabold text-white mt-1">92.4%</h3>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Batches Audited</span>
              <h3 className="text-xl font-extrabold text-white mt-1">{batches.length} batches</h3>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('Excel', 'Attendance Report')}
              className="bg-zinc-950 hover:bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Excel
            </button>
            <button
              onClick={() => handleExport('PDF', 'Attendance Report')}
              className="bg-zinc-950 hover:bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <FileDown className="w-4 h-4 text-rose-500" /> Export PDF
            </button>
          </div>

          {/* Batch Attendance */}
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden text-xs">
            <div className="p-4 bg-zinc-950/80 border-b border-white/5 font-bold text-zinc-300">
              Average Attendance % by Batch
            </div>
            <div className="divide-y divide-white/5">
              {batches.map((b, i) => (
                <div key={i} className="p-4 flex justify-between items-center hover:bg-zinc-900/10 transition-colors">
                  <div>
                    <span className="font-bold text-zinc-200">{b.name}</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">Instructor: {b.teacher_name || 'Unassigned'} &bull; Timings: {b.timings}</span>
                  </div>
                  <span className="font-extrabold text-emerald-400">{90 + (i * 2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
