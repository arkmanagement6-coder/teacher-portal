"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Fee, Student, Payment } from '@/lib/db';
import { PaymentService } from '@/lib/payments';
import { useClient } from '@/components/client-provider';
import { 
  CreditCard, Plus, RefreshCw, Send, CheckCircle2, AlertCircle, 
  Search, Calendar, ArrowUpRight, Copy, Check 
} from 'lucide-react';

export default function FeeManagementPage() {
  const { showToast } = useClient();
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [cycle, setCycle] = useState('monthly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    const fList = await DbClient.getFees(academy.id);
    setFees(fList);

    const sList = await DbClient.getStudents(academy.id);
    setStudents(sList);

    setLoading(false);
  };

  const handleGenerateInvoices = async () => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    try {
      const generated = await DbClient.generateMonthlyFees(academy.id);
      showToast(`Billing check complete. Generated ${generated} new invoices.`, 'success');
      loadData();
    } catch (err) {
      showToast('Billing check failed', 'error');
    }
  };

  const handleCreateCustomInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !amount || !dueDate) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const academy = await DbClient.getAcademy();
    if (!academy) return;

    try {
      await DbClient.createFeeRecord(academy.id, {
        student_id: studentId,
        amount: Number(amount),
        paid_amount: 0,
        due_date: dueDate,
        billing_cycle: cycle,
        status: 'pending'
      });

      showToast('Custom fee invoice generated successfully!', 'success');
      setIsAddOpen(false);
      
      setStudentId('');
      setAmount('');
      setDueDate('');
      setCycle('monthly');

      loadData();
    } catch (err) {
      showToast('Failed to create invoice', 'error');
    }
  };

  const handleGenerateLink = async (fee: Fee) => {
    const balance = Number(fee.amount) - Number(fee.paid_amount);
    const res = await PaymentService.createPaymentLink(fee.id, balance);
    
    if (res.success && res.payment) {
      const url = `${window.location.origin}${res.link}`;
      navigator.clipboard.writeText(url);
      setCopiedId(fee.id);
      showToast('Payment link copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 3000);
      loadData();
    } else {
      showToast(res.error || 'Failed to generate link', 'error');
    }
  };

  const filteredFees = fees.filter(f => 
    f.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.status.toLowerCase() === searchQuery.toLowerCase()
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs">Loading ledger logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Fee Management</h1>
          <p className="text-xs text-slate-500">Generate bills, track pending balances and distribute Razorpay links</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateInvoices}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" /> Autogen Invoices
          </button>
          
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5"
          >
            <Plus className="w-4.5 h-4.5" /> Custom Invoice
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2 max-w-md bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
        <Search className="w-4.5 h-4.5 text-slate-400 pl-1" />
        <input
          type="text"
          placeholder="Filter by student name or status (paid, pending, overdue)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Invoices List */}
      <div className="glass-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Student</th>
                <th className="p-4">Batch</th>
                <th className="p-4">Billing Cycle</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Payment Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">No invoice records logged.</td>
                </tr>
              ) : (
                filteredFees.map(f => {
                  const balance = Number(f.amount) - Number(f.paid_amount);
                  const isCopied = copiedId === f.id;
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{f.student_name}</td>
                      <td className="p-4 text-slate-500">{f.batch_name || 'No Batch'}</td>
                      <td className="p-4 capitalize text-slate-500">{f.billing_cycle}</td>
                      <td className="p-4 text-slate-500">{f.due_date}</td>
                      <td className="p-4 font-bold text-slate-800">
                        ₹{f.amount} 
                        {f.paid_amount > 0 && f.status !== 'paid' && (
                          <span className="text-[10px] text-slate-400 block font-normal">Paid: ₹{f.paid_amount}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                          f.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          f.status === 'overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {f.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {f.status === 'paid' ? (
                          <span className="text-[10px] text-emerald-650 font-bold flex items-center justify-end gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Recd</span>
                        ) : (
                          <button
                            onClick={() => handleGenerateLink(f)}
                            className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-650 border border-blue-100 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-colors"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copied' : 'Get Link'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Custom Invoice Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up text-slate-800">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">Generate Custom Invoice</h3>
              <button 
                onClick={() => setIsAddOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateCustomInvoice} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Enrolled Student</label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="">Select student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Fee: ₹{s.monthly_fee})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Billing Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Billing Cycle</label>
                  <select
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none text-slate-850"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 px-4.5 py-2.5 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg transition-all shadow-sm"
                >
                  Create Invoice
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
