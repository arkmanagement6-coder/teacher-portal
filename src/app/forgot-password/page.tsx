"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DbClient } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { Zap, Mail, Lock, Key, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useClient();

  // Step state: 'email' | 'otp' | 'success'
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [targetUser, setTargetUser] = useState<any>(null);

  // OTP & New password states
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your registered email address', 'error');
      return;
    }

    setLoading(true);

    try {
      const store = DbClient.getStore();
      const profile = store.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());

      if (!profile) {
        showToast('Email address not registered in our system', 'error');
        setLoading(false);
        return;
      }

      // Generate a mock 6-digit OTP code
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtp(generatedOtp);
      setTargetUser(profile);

      // Trigger a simulated WhatsApp alert to the user's mobile so it shows up in outbox log!
      const academy = store.academies[0] || { id: 'acad-1', name: 'Academy' };
      await DbClient.triggerWhatsAppReminder(
        academy.id,
        profile.id,
        'class_reminder',
        `Security Notice: One-Time Password (OTP) for password recovery on your RemindFlow account is ${generatedOtp}. Do not share this with anyone.`
      );

      showToast(`One-Time Password (OTP) sent to ${email}`, 'success');
      setStep('otp');
    } catch (err) {
      showToast('Failed to generate reset OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      showToast('Please fill in all validation fields', 'error');
      return;
    }

    if (otp !== sentOtp) {
      showToast('Invalid OTP code. Please enter the correct code.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }

    setLoading(true);

    try {
      const success = await DbClient.changePassword(targetUser.id, newPassword);
      if (success) {
        showToast('Password reset successfully!', 'success');
        setStep('success');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        showToast('Failed to update credentials database', 'error');
      }
    } catch (err) {
      showToast('Reset failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden text-slate-800">
      
      {/* Background highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-in">
        {/* Logo Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-md shadow-blue-500/20 w-fit">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-2">Reset Password</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Recover access to your RemindFlow instructor profile</p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl bg-white space-y-4">
          
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-500 leading-normal">
                Enter your registered email address. We will simulate sending a 6-digit OTP code to verify your identity.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@academy.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Send OTP Verification Code</>
                )}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              
              {/* Demo Mode Notice */}
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 leading-normal flex gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-amber-600 flex-shrink-0" />
                <div>
                  <strong>Demo Verification Mode:</strong> Since this is a local sandbox environment, your OTP has been sent via simulated WhatsApp. Use code: <strong className="text-amber-900 bg-amber-200/50 px-1 rounded font-mono text-xs">{sentOtp}</strong>.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Enter 6-Digit OTP</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all font-mono tracking-[0.2em] text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Reset Password & Login</>
                )}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="p-4 text-center space-y-4 animate-fade-in">
              <div className="inline-flex bg-emerald-50 p-3 rounded-full border border-emerald-100 text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm">Credentials Updated!</h3>
                <p className="text-xs text-slate-500">Your new password is now active. Redirecting to login portal...</p>
              </div>
            </div>
          )}

          {step !== 'success' && (
            <div className="pt-2 text-center">
              <Link 
                href="/login" 
                className="text-xs font-bold text-slate-550 hover:text-slate-800 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
