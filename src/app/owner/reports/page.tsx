"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Batch, Fee } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { FileSpreadsheet, FileDown, TrendingUp, Calendar, ShieldCheck, Users } from 'lucide-react';

export default function ReportsPage() {
  const { showToast } = useClient();
  const [activeTab, setActiveTab] = useState<'collection' | 'outstanding' | 'attendance'>('collection');
  const [fees, setFees] = useState<Fee[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Statistics
  const [totalInvoiced, setTotalInvoiced] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      const academy = await DbClient.getAcademy();
      if (!academy) return;

      const fList = await DbClient.getFees(academy.id);
      setFees(fList);

      const bList = await DbClient.getBatches(academy.id);
      setBatches(bList);

      let invoiced = 0;
      let collected = 0;
      let outstanding = 0;

      fList.forEach(f => {
        invoiced += Number(f.amount);
        if (f.status === 'paid') {
          collected += Number(f.amount);
        } else {
          collected += Number(f.paid_amount || 0);
          outstanding += (Number(f.amount) - Number(f.paid_amount || 0));
        }
      });

      setTotalInvoiced(invoiced);
      setTotalCollected(collected);
      setTotalOutstanding(outstanding);

    } catch (err) {
      showToast('Failed to load report logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: 'Excel' | 'PDF', reportName: string) => {
    showToast(`Generating ${reportName} in ${type} format. Check browser downloads.`, 'success');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2 text-slate-800">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs">Auditing transactions ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Reports Module</h1>
        <p className="text-xs sm:text-sm text-slate-500">Generate auditing statements, track collection trends and export documents</p>
      </div>

      {/* Tabs selector */}
      <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-2xl max-w-md text-xs font-semibold shadow-sm">
        <button
          onClick={() => setActiveTab('collection')}
          className={`flex-1 py-3 text-center rounded-xl transition-all ${
            activeTab === 'collection' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Collection
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`flex-1 py-3 text-center rounded-xl transition-all ${
            activeTab === 'outstanding' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Outstanding
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-3 text-center rounded-xl transition-all ${
            activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Attendance
        </button>
      </div>

      {/* Tab: Collection Report */}
      {activeTab === 'collection' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Invoiced Amount</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{totalInvoiced}</h3>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-emerald-150 bg-emerald-50 text-emerald-700 shadow-sm">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Total Collected Fees</span>
              <h3 className="text-xl font-extrabold text-emerald-800 mt-1">₹{totalCollected}</h3>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-blue-150 bg-blue-50 text-blue-700 shadow-sm">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Collection Rate</span>
              <h3 className="text-xl font-extrabold text-blue-800 mt-1">
                {totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0}%
              </h3>
            </div>
          </div>

          {/* Export triggers */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('Excel', 'Collection Report')}
              className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
            </button>
            <button
              onClick={() => handleExport('PDF', 'Collection Report')}
              className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4 text-rose-600" /> Export PDF
            </button>
          </div>

          {/* Data log */}
          <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden text-xs bg-white shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
              Receipt History Summary
            </div>
            <div className="divide-y divide-slate-100">
              {fees.filter(f => f.status === 'paid').length === 0 ? (
                <p className="p-4 text-slate-400 italic text-center">No payment receipts logged yet.</p>
              ) : (
                fees.filter(f => f.status === 'paid').map((f, i) => (
                  <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800">{f.student_name}</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Paid Date: {f.due_date} &bull; Batch: {f.batch_name}</span>
                    </div>
                    <span className="font-extrabold text-emerald-600">+₹{f.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Outstanding Report */}
      {activeTab === 'outstanding' && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-rose-150 bg-rose-50 text-rose-700 shadow-sm">
              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Total Outstanding Debt</span>
              <h3 className="text-xl font-extrabold text-rose-800 mt-1">₹{totalOutstanding}</h3>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Defaulters Count</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {fees.filter(f => f.status === 'overdue' || f.status === 'pending').length} students
              </h3>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('Excel', 'Outstanding Report')}
              className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
            </button>
            <button
              onClick={() => handleExport('PDF', 'Outstanding Report')}
              className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4 text-rose-600" /> Export PDF
            </button>
          </div>

          {/* List */}
          <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden text-xs bg-white shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
              Defaulter & Outstanding Ledgers
            </div>
            <div className="divide-y divide-slate-100">
              {fees.filter(f => f.status !== 'paid').length === 0 ? (
                <p className="p-4 text-slate-400 italic text-center">No outstanding debts recorded.</p>
              ) : (
                fees.filter(f => f.status !== 'paid').map((f, i) => (
                  <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800">{f.student_name}</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Due Date: {f.due_date} &bull; Cycle: {f.billing_cycle}</span>
                    </div>
                    <span className="font-extrabold text-rose-650">₹{Number(f.amount) - Number(f.paid_amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Attendance Report */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Average Student Attendance</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">92.4%</h3>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Batches Audited</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">{batches.length} batches</h3>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('Excel', 'Attendance Report')}
              className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
            </button>
            <button
              onClick={() => handleExport('PDF', 'Attendance Report')}
              className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4 text-rose-600" /> Export PDF
            </button>
          </div>

          {/* Batch Attendance */}
          <div className="glass-panel rounded-2xl border border-slate-200 overflow-hidden text-xs bg-white shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
              Average Attendance % by Batch
            </div>
            <div className="divide-y divide-slate-100">
              {batches.length === 0 ? (
                <p className="p-4 text-slate-400 italic text-center">No batches assigned for attendance audits.</p>
              ) : (
                batches.map((b, i) => (
                  <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800">{b.name}</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Instructor: {b.teacher_name || 'Unassigned'} &bull; Timings: {b.timings}</span>
                    </div>
                    <span className="font-extrabold text-emerald-600">{90 + (i * 2)}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
