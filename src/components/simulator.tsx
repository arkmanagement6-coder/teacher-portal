"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Payment, Fee, WhatsAppLog } from '@/lib/db';
import { useClient } from './client-provider';
import { Zap, Play, CheckCircle, RefreshCw, X, MessageSquare, AlertCircle } from 'lucide-react';

export function SimulatorPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'payments' | 'whatsapp' | 'actions'>('payments');
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const { showToast, user } = useClient();

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      loadSimulatorData();
    }, 2000);

    loadSimulatorData();
    return () => clearInterval(interval);
  }, [isOpen]);

  const loadSimulatorData = async () => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    const pays = await DbClient.getPayments(academy.id);
    setPendingPayments(pays.filter(p => p.status === 'pending'));

    const wlogs = await DbClient.getWhatsAppLogs(academy.id);
    setLogs(wlogs.slice(0, 10));
  };

  const handleSimulatePayment = async (pay: Payment) => {
    try {
      const randomPayId = 'pay_sim_' + Math.random().toString(36).substr(2, 9);
      const methods = ['UPI', 'Card', 'Netbanking', 'Wallet'];
      const chosenMethod = methods[Math.floor(Math.random() * methods.length)];
      
      await DbClient.completePayment(pay.id, randomPayId, chosenMethod);
      
      const academy = await DbClient.getAcademy();
      if (academy) {
        const students = await DbClient.getStudents(academy.id);
        const fee = (await DbClient.getFees(academy.id)).find(f => f.id === pay.fee_id);
        const student = fee ? students.find(s => s.id === fee.student_id) : null;
        
        if (student) {
          await DbClient.triggerWhatsAppReminder(
            academy.id,
            student.id,
            'payment_success',
            `Thank you! We have received your payment of ₹${pay.amount} for ${student.name}.`
          );
        }
      }

      showToast(`Payment of ₹${pay.amount} processed successfully via ${chosenMethod}!`, 'success');
      loadSimulatorData();
    } catch (err: any) {
      showToast(err.message || 'Payment simulation failed', 'error');
    }
  };

  const triggerDailyAutomations = async () => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    const feesList = await DbClient.getFees(academy.id);
    const students = await DbClient.getStudents(academy.id);
    let count = 0;

    for (const f of feesList) {
      const student = students.find(s => s.id === f.student_id);
      if (!student || student.status !== 'active') continue;

      const dueDateObj = new Date(f.due_date);
      const today = new Date();
      const diffTime = dueDateObj.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (f.status === 'pending') {
        if (diffDays === 7 || diffDays === 3 || diffDays === 0) {
          await DbClient.triggerWhatsAppReminder(academy.id, student.id, 'due_reminder');
          count++;
        }
      } else if (f.status === 'overdue' || f.status === 'partially_paid') {
        const daysOverdue = Math.abs(diffDays);
        if (daysOverdue === 3 || daysOverdue === 7 || daysOverdue > 0) {
          await DbClient.triggerWhatsAppReminder(academy.id, student.id, 'overdue_reminder');
          count++;
        }
      }
    }

    showToast(`Scheduler run complete! Sent ${count} automated WhatsApp reminders.`, 'success');
    loadSimulatorData();
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 text-slate-800">
      
      {/* Floating Action Button - Swapped to Orange gradient for secondary accent highlight */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4.5 py-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all border border-white/20 font-bold"
      >
        <Zap className={`w-5 h-5 ${isOpen ? 'animate-spin' : 'animate-pulse'}`} />
        <span>{isOpen ? 'Close Simulator' : 'Playground Simulator'}</span>
      </button>

      {/* Simulator Drawer Panel - Styled in white & slate border */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 max-w-sm rounded-2xl bg-white text-slate-800 shadow-2xl overflow-hidden border border-slate-200 animate-scale-up flex flex-col h-[480px]">
          
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <h3 className="font-extrabold text-sm text-slate-900">B2B Integration Simulator</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-50 p-1 border-b border-slate-100 text-xs">
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2 text-center rounded-md transition-colors ${activeTab === 'payments' ? 'bg-blue-50 text-blue-600 border border-blue-100 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Payment Links ({pendingPayments.length})
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-1 py-2 text-center rounded-md transition-colors ${activeTab === 'whatsapp' ? 'bg-blue-50 text-blue-600 border border-blue-100 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              WhatsApp API Outbox
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-2 text-center rounded-md transition-colors ${activeTab === 'actions' ? 'bg-blue-50 text-blue-600 border border-blue-100 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Instant Triggers
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {activeTab === 'payments' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 mb-2">
                  When you generate fee bills, they register here as active payment channels. Click to open the parent checkout page, scan the QR code/UPI, and upload a payment screenshot:
                </p>
                {pendingPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                    <CheckCircle className="w-8 h-8 text-slate-300" />
                    <p className="text-sm text-slate-400">No active pending checkout sessions found.</p>
                    <p className="text-[10px] text-slate-500">Create a student invoice or trigger a payment link in Fee Recovery or Payments.</p>
                  </div>
                ) : (
                  pendingPayments.map(p => (
                    <div key={p.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs hover:border-blue-200 transition-all">
                      <div>
                        <div className="font-bold text-slate-800">{p.student_name || 'Chess Student'}</div>
                        <div className="text-[10px] text-slate-500">Invoice Ref: {p.id}</div>
                        <div className="mt-1 text-emerald-650 font-bold text-sm">₹{p.amount}</div>
                      </div>
                      <button
                        onClick={() => window.open(`/pay/${p.id}`, '_blank')}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-md flex items-center gap-1 font-bold transition-colors"
                      >
                        <Play className="w-3 h-3 fill-emerald-600" />
                        <span>Pay Page</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">Live API logs filtered by status:</span>
                  <button onClick={loadSimulatorData} className="text-blue-600 hover:text-blue-500">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                    <p className="text-sm text-slate-400">WhatsApp outbox logs are currently empty.</p>
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100 transition-all">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800">{log.student_name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          log.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 text-ellipsis overflow-hidden line-clamp-2">
                        {log.type === 'payment_success' ? '💳 Payment Receipt Alert' : 
                         log.type === 'due_reminder' ? '📅 Monthly Fee Due Reminder' : 
                         log.type === 'overdue_reminder' ? '🚨 Overdue Defaulter Warning' : 
                         log.type === 'attendance_alert' ? '📝 Absent Attendance Alert' : '🔔 System Notification'}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 flex justify-between">
                        <span>Recipient: {log.sent_to}</span>
                        <span>{new Date(log.sent_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Simulate core background operations that occur automatically on the production cron scheduler:
                </p>

                <div className="space-y-2">
                  <button
                    onClick={triggerDailyAutomations}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95 shadow-sm shadow-blue-500/10"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Run Daily Automation Engine</span>
                  </button>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Scans all active invoices. Automatically fires WhatsApp reminders for students with due dates matching 7 days before, 3 days after, or overdue milestones.
                  </p>
                </div>

                <div className="h-px bg-slate-100 my-4" />

                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[10px] text-slate-500 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div className="leading-relaxed">
                    <strong className="text-slate-800 block mb-0.5">Mock Auth Credentials:</strong>
                    Owner: <code className="text-slate-600 bg-slate-200/50 px-1 rounded">owner@test.com</code> / <code className="text-slate-600 bg-slate-200/50 px-1 rounded">password123</code><br/>
                    Teacher: <code className="text-slate-600 bg-slate-200/50 px-1 rounded">teacher@test.com</code> / <code className="text-slate-600 bg-slate-200/50 px-1 rounded">password123</code><br/>
                    Super Admin: <code className="text-slate-600 bg-slate-200/50 px-1 rounded">admin@test.com</code> / <code className="text-slate-600 bg-slate-200/50 px-1 rounded">password123</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
