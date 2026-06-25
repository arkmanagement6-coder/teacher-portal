"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Academy } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { 
  Settings, Building2, CreditCard, MessageSquare, 
  Mail, Users, ShieldCheck, CheckCircle2 
} from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useClient();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('');
  const [rzpKey, setRzpKey] = useState('');
  const [rzpSecret, setRzpSecret] = useState('');
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waToken, setWaToken] = useState('');
  const [resendKey, setResendKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const acad = await DbClient.getAcademy();
    if (acad) {
      setAcademy(acad);
      setName(acad.name);
      setAddress(acad.address || '');
      setLogo(acad.logo_url || '');
      setRzpKey(acad.razorpay_key_id || '');
      setRzpSecret(acad.razorpay_secret || '');
      setWaPhoneId(acad.whatsapp_settings?.phoneNumberId || '');
      setWaToken(acad.whatsapp_settings?.accessToken || '');
      setResendKey(acad.resend_api_key || '');
    }
    setLoading(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academy) return;

    try {
      const updated = await DbClient.updateAcademy(academy.id, {
        name,
        address,
        logo_url: logo,
        razorpay_key_id: rzpKey,
        razorpay_secret: rzpSecret,
        whatsapp_settings: {
          phoneNumberId: waPhoneId,
          accessToken: waToken
        },
        resend_api_key: resendKey
      });
      setAcademy(updated);
      showToast('Settings saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  if (loading || !academy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-xs">Loading settings panels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">Academy Settings</h1>
        <p className="text-xs text-zinc-400">Configure profile identity details, gateway credentials, and WhatsApp integrations</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Step 1: Profile */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="font-extrabold text-sm text-zinc-200 flex items-center gap-2 border-b border-white/5 pb-2">
            <Building2 className="w-4.5 h-4.5 text-violet-400" /> Academy Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Academy / School Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Logo URL</label>
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://logo.com/academy.png"
                className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Office Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Step 2: Payment Gateways */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="font-extrabold text-sm text-zinc-200 flex items-center gap-2 border-b border-white/5 pb-2">
            <CreditCard className="w-4.5 h-4.5 text-violet-400" /> Razorpay Integration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Razorpay Key ID</label>
              <input
                type="text"
                value={rzpKey}
                onChange={(e) => setRzpKey(e.target.value)}
                placeholder="rzp_live_..."
                className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Razorpay Secret Key</label>
              <input
                type="password"
                value={rzpSecret}
                onChange={(e) => setRzpSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: WhatsApp automation setup */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="font-extrabold text-sm text-zinc-200 flex items-center gap-2 border-b border-white/5 pb-2">
            <MessageSquare className="w-4.5 h-4.5 text-violet-400" /> Meta WhatsApp Business API
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">WhatsApp Phone ID</label>
              <input
                type="text"
                value={waPhoneId}
                onChange={(e) => setWaPhoneId(e.target.value)}
                placeholder="1092837209384729"
                className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">System Access Token</label>
              <input
                type="password"
                value={waToken}
                onChange={(e) => setWaToken(e.target.value)}
                placeholder="EAAd7..."
                className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Emails Resend */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="font-extrabold text-sm text-zinc-200 flex items-center gap-2 border-b border-white/5 pb-2">
            <Mail className="w-4.5 h-4.5 text-violet-400" /> Resend Mail Server
          </h3>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Resend API Key</label>
            <input
              type="password"
              value={resendKey}
              onChange={(e) => setResendKey(e.target.value)}
              placeholder="re_..."
              className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Step 5: Subscription Detail */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="font-extrabold text-sm text-zinc-200 flex items-center gap-2 border-b border-white/5 pb-2">
            <ShieldCheck className="w-4.5 h-4.5 text-violet-400" /> Subscription Plan Details
          </h3>

          <div className="flex justify-between items-center bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Current Plan Tier</span>
              <strong className="text-white capitalize text-sm">{academy.subscription_plan} Plan</strong>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Billing Status</span>
              <span className="px-2.5 py-0.5 rounded text-[9px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {academy.subscription_status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          Save Integration Settings
        </button>

      </form>

    </div>
  );
}
