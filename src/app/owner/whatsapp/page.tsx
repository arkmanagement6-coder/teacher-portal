"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, WhatsAppLog, Academy } from '@/lib/db';
import { WHATSAPP_TEMPLATES } from '@/lib/whatsapp';
import { useClient } from '@/components/client-provider';
import { 
  MessageSquare, ToggleLeft, ToggleRight, CheckCircle2, 
  AlertCircle, ShieldCheck, Mail, Send, Calendar, Clock 
} from 'lucide-react';

export default function WhatsAppAutomationPage() {
  const { showToast } = useClient();
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const acad = await DbClient.getAcademy();
    if (!acad) return;

    setAcademy(acad);

    const wLogs = await DbClient.getWhatsAppLogs(acad.id);
    setLogs(wLogs);
    
    setLoading(false);
  };

  const handleToggleAutomation = async () => {
    if (!academy) return;
    try {
      const nextVal = !academy.whatsapp_enabled;
      const updated = await DbClient.updateAcademy(academy.id, { whatsapp_enabled: nextVal });
      setAcademy(updated);
      showToast(
        nextVal ? 'Automated WhatsApp scheduler ENABLED!' : 'Automated WhatsApp scheduler DISABLED.',
        nextVal ? 'success' : 'info'
      );
    } catch (err) {
      showToast('Toggle failed', 'error');
    }
  };

  if (loading || !academy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-xs">Loading WhatsApp pipeline logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">WhatsApp Automation</h1>
          <p className="text-xs text-zinc-400">Configure triggers, preview messaging templates and track outbox API logs</p>
        </div>

        {/* Enabled Toggle */}
        <button
          onClick={handleToggleAutomation}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all text-xs font-bold ${
            academy.whatsapp_enabled 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-950/10' 
              : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-300'
          }`}
        >
          {academy.whatsapp_enabled ? (
            <>
              <ToggleRight className="w-6 h-6 text-emerald-400" />
              <span>Automations: ENABLED</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-6 h-6 text-zinc-500" />
              <span>Automations: DISABLED</span>
            </>
          )}
        </button>
      </div>

      {/* Grid: Onboarding Alerts vs Automation rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Templates list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="font-extrabold text-sm text-zinc-200">Active Message Templates</h3>
              <span className="text-[9px] bg-violet-600/10 border border-violet-500/20 text-violet-400 font-bold px-2 py-0.5 rounded">WhatsApp API Ready</span>
            </div>

            <div className="space-y-4">
              {Object.entries(WHATSAPP_TEMPLATES).map(([key, template]) => (
                <div key={key} className="p-4 bg-zinc-950/80 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-200 capitalize">{template.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">template_code: {key}</span>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed italic bg-zinc-900/60 p-2.5 rounded-lg border border-white/5">
                    "{template.body}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule & Rules details */}
        <div className="space-y-6">
          
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-200">Trigger Interval Rules</h3>
              <p className="text-[10px] text-zinc-500">Auto-scheduled execution times relative to invoice due dates</p>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              {[
                { label: '7 Days Before Due Date', active: true, desc: 'Soft heads-up reminder' },
                { label: '3 Days Before Due Date', active: true, desc: 'Standard payment notice' },
                { label: 'On Due Date', active: true, desc: 'Urgent checkout link notification' },
                { label: '3 Days After Due Date', active: true, desc: 'First Overdue alert' },
                { label: '7 Days After Due Date', active: true, desc: 'Final warning notice' }
              ].map((rule, idx) => (
                <div key={idx} className="flex justify-between items-start bg-zinc-950/60 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-zinc-200">{rule.label}</span>
                    <span className="text-[9px] text-zinc-500 block font-normal mt-0.5">{rule.desc}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[8px] font-bold rounded">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Delivery Logs outbox */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-200">Delivery Status Logs</h3>
            <p className="text-[10px] text-zinc-500">Live report of outbound messages dispatched via API gateway</p>
          </div>
          <span className="text-[9px] bg-zinc-950 text-zinc-400 px-2 py-0.5 border border-white/5 rounded">Live Logs</span>
        </div>

        <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-xs text-zinc-500 italic text-center py-6">No outbound logs recorded. Trigger a reminder to test.</p>
          ) : (
            logs.map(l => (
              <div key={l.id} className="p-3 bg-zinc-950/60 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-white/10 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200">{l.student_name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">({l.sent_to})</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 capitalize">Type: {l.type.replace('_', ' ')}</div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="text-[9px] text-zinc-500">
                    {new Date(l.sent_at).toLocaleString()}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold border ${
                    l.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
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
