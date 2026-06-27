"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Fee, Student, Batch } from '@/lib/db';
import { WhatsAppService } from '@/lib/whatsapp';
import { useClient } from '@/components/client-provider';
import { 
  AlertTriangle, MessageSquare, PhoneCall, CheckCircle, 
  Search, Eye, ShieldCheck, Check, X, FileText, Send, User 
} from 'lucide-react';
import Link from 'next/link';

interface Defaulter {
  feeId: string;
  studentId: string;
  studentName: string;
  parentName: string;
  mobile: string;
  batchName: string;
  dueAmount: number;
  dueDate: string;
  daysOverdue: number;
  lastReminderDate: string;
  screenshotUrl?: string;
  screenshotStatus?: string;
}

export default function RecoveryBoard() {
  const { showToast } = useClient();
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [totals, setTotals] = useState({ dueAmount: 0, overdueAmount: 0, count: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Preview Modal state
  const [previewFee, setPreviewFee] = useState<Defaulter | null>(null);

  useEffect(() => {
    loadRecoveryData();
  }, []);

  const loadRecoveryData = async () => {
    try {
      const academy = await DbClient.getAcademy();
      if (!academy) return;

      const fees = await DbClient.getFees(academy.id);
      const students = await DbClient.getStudents(academy.id);
      const batches = await DbClient.getBatches(academy.id);
      const logs = await DbClient.getWhatsAppLogs(academy.id);

      const today = new Date();
      let totalDue = 0;
      let totalOverdue = 0;
      const items: Defaulter[] = [];

      fees.forEach(f => {
        const balance = Number(f.amount) - Number(f.paid_amount);
        if (f.status === 'paid' || balance <= 0) return;

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

        const student = students.find(s => s.id === f.student_id);
        const batch = batches.find(b => b.id === student?.batch_id);
        const lastLog = logs.find(l => l.student_id === f.student_id && l.type === 'overdue_reminder');
        
        items.push({
          feeId: f.id,
          studentId: f.student_id,
          studentName: student ? student.name : 'Unknown Student',
          parentName: student ? student.parent_name : 'Parent Name',
          mobile: student ? student.whatsapp || student.mobile : '',
          batchName: batch ? batch.name : 'Unassigned Class',
          dueAmount: balance,
          dueDate: f.due_date,
          daysOverdue: days,
          lastReminderDate: lastLog ? new Date(lastLog.sent_at).toLocaleDateString() : 'Never',
          screenshotUrl: f.screenshot_url,
          screenshotStatus: f.screenshot_status
        });
      });

      // Default sorting: Highest Due Amount First
      items.sort((a, b) => b.dueAmount - a.dueAmount);

      setDefaulters(items);
      setTotals({
        dueAmount: totalDue,
        overdueAmount: totalOverdue,
        count: items.length
      });
    } catch (err) {
      showToast('Failed to load recovery ledger', 'error');
    } finally {
      setLoading(false);
    }
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
    showToast(`Calling parent: ${def.parentName} (${def.mobile})`, 'info');
    if (typeof window !== 'undefined') {
      window.open(`tel:${def.mobile}`);
    }
  };

  const handleVerifyScreenshot = async (feeId: string, approve: boolean) => {
    try {
      if (approve) {
        // Find the amount
        const def = defaulters.find(d => d.feeId === feeId);
        const amount = def ? def.dueAmount : 0;
        await DbClient.updateFee(feeId, {
          status: 'paid',
          paid_amount: amount,
          screenshot_status: 'approved'
        });
        showToast('Screenshot approved! Invoice marked as paid.', 'success');
      } else {
        await DbClient.updateFee(feeId, {
          screenshot_status: 'rejected'
        });
        showToast('Receipt screenshot rejected. Notified parent.', 'error');
      }
      setPreviewFee(null);
      loadRecoveryData();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleSendSMSMock = (def: Defaulter) => {
    showToast(`SMS dispatch tunnel queued for +91${def.mobile}`, 'success');
  };

  const filtered = defaulters.filter(d => 
    d.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.batchName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2 text-slate-800">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs">Accessing Smart Recovery Board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Smart Recovery Board</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Audit outstanding ledger balances, inspect receipt uploads and verify settlements</p>
        </div>
        <div className="text-slate-400 text-xs font-semibold">
          Sorted by: <span className="text-blue-600 font-extrabold uppercase">Highest Due First</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white flex items-center gap-4 shadow-sm">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Outstanding Debt</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{totals.dueAmount}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white flex items-center gap-4 shadow-sm">
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-orange-600">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Overdue Defaulters</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{totals.overdueAmount}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white flex items-center gap-4 shadow-sm">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 font-extrabold text-lg w-12 h-12 flex items-center justify-center">
            {totals.count}
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Defaulters Count</span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">Awaiting payments</h3>
          </div>
        </div>

      </div>

      {/* Filters and Actions Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, parent or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder-slate-400"
          />
        </div>

        <span className="text-[10px] text-slate-400 font-bold">Use actions below to execute instant collection reminders.</span>
      </div>

      {/* Defaulter Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Student</th>
                <th className="p-4">Parent</th>
                <th className="p-4">Batch</th>
                <th className="p-4">Due Amount</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Days Overdue</th>
                <th className="p-4">Reminder Status</th>
                <th className="p-4">Receipt Screenshot</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">No defaulter balances recorded.</td>
                </tr>
              ) : (
                filtered.map((def, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{def.studentName}</td>
                    <td className="p-4 text-slate-600">{def.parentName}</td>
                    <td className="p-4 font-semibold text-slate-700">{def.batchName}</td>
                    <td className="p-4 font-bold text-rose-650">₹{def.dueAmount}</td>
                    <td className="p-4 text-slate-500">{def.dueDate}</td>
                    <td className="p-4">
                      {def.daysOverdue > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold border bg-rose-50 text-rose-600 border-rose-100">
                          {def.daysOverdue} Days Late
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold border bg-orange-50 text-orange-600 border-orange-100">
                          Due Today
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 font-medium">Last: {def.lastReminderDate}</td>
                    
                    {/* Screenshot thumbnail check */}
                    <td className="p-4">
                      {def.screenshotUrl ? (
                        <button
                          onClick={() => setPreviewFee(def)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-colors shadow-sm ${
                            def.screenshotStatus === 'pending_verification'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <Eye className="w-3 h-3" /> 
                          {def.screenshotStatus === 'pending_verification' ? 'Verify Screenshot' : 'Rejected / Review'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No upload yet</span>
                      )}
                    </td>

                    <td className="p-4 text-right flex justify-end gap-1.5">
                      
                      {/* WhatsApp Reminder */}
                      <button
                        onClick={() => handleSendReminder(def)}
                        title="Send WhatsApp Alert"
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-150 p-2 rounded-xl transition-all shadow-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {/* SMS Reminder (Future Ready) */}
                      <button
                        onClick={() => handleSendSMSMock(def)}
                        title="Send SMS Reminder (Future Ready)"
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-150 p-2 rounded-xl transition-all shadow-sm"
                      >
                        <Send className="w-4 h-4" />
                      </button>

                      {/* Phone Call */}
                      <button
                        onClick={() => handleCallParent(def)}
                        title="Call Parent"
                        className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 p-2 rounded-xl transition-all shadow-sm"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>

                      {/* Mark Paid (Quick action if cash received) */}
                      <button
                        onClick={() => handleVerifyScreenshot(def.feeId, true)}
                        title="Mark Invoice Paid"
                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-all shadow-md shadow-blue-500/10"
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      {/* View Profile History */}
                      <Link
                        href={`/owner/students?search=${encodeURIComponent(def.studentName)}`}
                        title="View Student Profile History"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-650 p-2 rounded-xl border border-slate-200 transition-all text-xs flex items-center justify-center"
                      >
                        <User className="w-4 h-4" />
                      </Link>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screenshot Preview Verification Modal */}
      {previewFee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up text-slate-800">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Receipt Screenshot Review</h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">Uploaded by parent of {previewFee.studentName}</span>
              </div>
              <button 
                onClick={() => setPreviewFee(null)} 
                className="text-slate-500 hover:text-slate-800 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <strong className="text-slate-850">{previewFee.studentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Class Batch:</span>
                  <span className="text-slate-700 font-semibold">{previewFee.batchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoiced Amount:</span>
                  <span className="text-blue-600 font-extrabold">₹{previewFee.dueAmount}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Screenshot Receipt:</span>
                <img 
                  src={previewFee.screenshotUrl} 
                  alt="Receipt Screenshot Preview" 
                  className="w-full h-64 object-contain rounded-xl border border-slate-200 bg-slate-100"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 text-xs">
              <button
                onClick={() => handleVerifyScreenshot(previewFee.feeId, false)}
                className="bg-white hover:bg-slate-100 text-rose-600 border border-rose-200 px-4.5 py-2.5 rounded-xl font-bold"
              >
                Reject & Request Reupload
              </button>
              <button
                onClick={() => handleVerifyScreenshot(previewFee.feeId, true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-1 shadow-sm"
              >
                <Check className="w-4 h-4" /> Approve & Mark Paid
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
