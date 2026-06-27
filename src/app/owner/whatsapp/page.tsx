"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, WhatsAppLog } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { MessageSquare, Bell, Clock, RefreshCw, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const WHATSAPP_TEMPLATES = {
  fee_due: {
    name: 'Upcoming Fee Due Reminder',
    body: 'Dear parent, fee of ₹[Amount] for [Student] is due on [Date]. Pay instantly: [Link]'
  },
  fee_overdue: {
    name: 'Overdue Fee Warning Alert',
    body: 'Dear parent, tuition fee of ₹[Amount] for [Student] was due on [Date] and is now OVERDUE. Pay immediately: [Link]'
  },
  class_reminder: {
    name: 'Class Attendance Warning',
    body: 'Dear parent, this is to notify that [Student] was marked ABSENT for today\'s batch scheduled at [Time].'
  },
  payment_success: {
    name: 'Payment Success Confirmation',
    body: 'Thank you! We have received your payment of ₹[Amount] for [Student]. Transaction reference: [TxnId]'
  }
};

export default function WhatsAppDashboard() {
  const { showToast } = useClient();
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const academy = await DbClient.getAcademy();
      if (!academy) return;

      const list = await DbClient.getWhatsAppLogs(academy.id);
      setLogs(list.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()));
    } catch (err) {
      showToast('Failed to load outbox logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadLogs();
    showToast('Logs refreshed!', 'success');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2 text-slate-800">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs">Fetching messaging queues...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" /> WhatsApp Automation Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Monitor meta-broadcast templates, auto-schedulers and outbound notification logs</p>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-white hover:bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-700 flex items-center gap-1.5 text-xs font-bold shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-blue-600" /> Refresh Logs
        </button>
      </div>

      {/* Grid: Onboarding Alerts vs Automation rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Templates list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-800">Active Message Templates</h3>
              <span className="text-[9px] bg-blue-50 border border-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded">WhatsApp API Ready</span>
            </div>

            <div className="space-y-4">
              {Object.entries(WHATSAPP_TEMPLATES).map(([key, template]) => (
                <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 capitalize">{template.name}</span>
                    <span className="text-[9px] text-slate-400 font-mono font-bold">template_code: {key}</span>
                  </div>
                  <p className="text-slate-650 text-xs leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-200">
                    "{template.body}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule & Rules details */}
        <div className="space-y-6">
          
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Trigger Interval Rules</h3>
              <p className="text-[10px] text-slate-550">Auto-scheduled execution times relative to invoice due dates</p>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              {[
                { label: '7 Days Before Due Date', active: true, desc: 'Soft heads-up reminder' },
                { label: '3 Days Before Due Date', active: true, desc: 'Standard payment notice' },
                { label: 'On Due Date', active: true, desc: 'Urgent checkout link notification' },
                { label: '3 Days After Due Date', active: true, desc: 'First Overdue alert' },
                { label: '7 Days After Due Date', active: true, desc: 'Final warning notice' }
              ].map((rule, idx) => (
                <div key={idx} className="flex justify-between items-start bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-800 font-bold">{rule.label}</span>
                    <span className="text-[9px] text-slate-500 block font-normal mt-0.5">{rule.desc}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-bold rounded">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Delivery Logs outbox */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800">Delivery Status Logs</h3>
            <p className="text-[10px] text-slate-550">Live report of outbound messages dispatched via API gateway</p>
          </div>
          <span className="text-[9px] bg-slate-50 text-slate-600 px-2.5 py-0.5 border border-slate-200 rounded font-bold uppercase tracking-wider">Live Logs</span>
        </div>

        <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">No outbound logs recorded. Trigger a reminder to test.</p>
          ) : (
            logs.map(l => (
              <div key={l.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-slate-100/50 transition-all shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{l.student_name}</span>
                    <span className="text-[9px] text-slate-550 font-mono">({l.sent_to})</span>
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">Type: {l.type.replace('_', ' ')}</div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="text-[9px] text-slate-500 font-mono">
                    {new Date(l.sent_at).toLocaleString()}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold border ${
                    l.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-150' : 'bg-rose-50 text-rose-600 border-rose-150'
                  }`}>
                    {l.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
