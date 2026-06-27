"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Academy } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { Building2, CreditCard, MessageSquare, Mail, ShieldCheck, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user, showToast } = useClient();
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
    try {
      const acad = await DbClient.getAcademy();
      if (acad) {
        setAcademy(acad);
        setName(acad.name || '');
        setAddress(acad.address || '');
        setLogo(acad.logo_url || '');
        setRzpKey(acad.razorpay_key_id || '');
        setRzpSecret(acad.razorpay_secret || '');
        setWaPhoneId(acad.whatsapp_settings?.phoneNumberId || '');
        setWaToken(acad.whatsapp_settings?.accessToken || '');
        setResendKey(acad.resend_api_key || '');
      }
    } catch (err) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academy) return;

    try {
      await DbClient.updateAcademy(academy.id, {
        name,
        address,
        logo_url: logo,
        razorpay_key_id: rzpKey,
        razorpay_secret: rzpSecret,
        resend_api_key: resendKey,
        whatsapp_settings: {
          phoneNumberId: waPhoneId,
          accessToken: waToken
        }
      });
      showToast('Settings saved successfully!', 'success');
      loadSettings();
    } catch (err) {
      showToast('Failed to update integration profiles', 'error');
    }
  };

  if (loading || !academy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2 text-slate-800">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs">Loading settings panels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in text-slate-800">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Academy Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500">Configure profile identity details, gateway credentials, and WhatsApp integrations</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Step 1: Profile */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building2 className="w-4.5 h-4.5 text-blue-600" /> Academy Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Academy / School Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Logo URL</label>
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://logo.com/academy.png"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Office Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Step 2: Payment Gateways */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="w-4.5 h-4.5 text-blue-600" /> Razorpay Integration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Razorpay Key ID</label>
              <input
                type="text"
                value={rzpKey}
                onChange={(e) => setRzpKey(e.target.value)}
                placeholder="rzp_live_..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Razorpay Secret Key</label>
              <input
                type="password"
                value={rzpSecret}
                onChange={(e) => setRzpSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Step 3: WhatsApp automation setup */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <MessageSquare className="w-4.5 h-4.5 text-blue-600" /> Meta WhatsApp Business API
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">WhatsApp Phone ID</label>
              <input
                type="text"
                value={waPhoneId}
                onChange={(e) => setWaPhoneId(e.target.value)}
                placeholder="1092837209384729"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">System Access Token</label>
              <input
                type="password"
                value={waToken}
                onChange={(e) => setWaToken(e.target.value)}
                placeholder="EAAd7..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Emails Resend */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Mail className="w-4.5 h-4.5 text-blue-600" /> Resend Mail Server
          </h3>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Resend API Key</label>
            <input
              type="password"
              value={resendKey}
              onChange={(e) => setResendKey(e.target.value)}
              placeholder="re_..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Step 5: Subscription Detail */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-4.5 h-4.5 text-blue-600" /> Subscription Plan Details
          </h3>

          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Current Plan Tier</span>
              <strong className="text-slate-800 capitalize text-sm">{academy.subscription_plan} Plan</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Billing Status</span>
              <span className="px-2.5 py-0.5 rounded text-[9px] font-bold border bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm">
                {academy.subscription_status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-md shadow-blue-500/10"
        >
          <Save className="w-4 h-4" /> Save Integration Settings
        </button>

      </form>

    </div>
  );
}
