"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DbClient, Payment, Fee, Student } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { CreditCard, CheckCircle2, ShieldCheck, AlertCircle, ArrowLeft, ArrowUpRight, Smartphone, Building } from 'lucide-react';

export default function HostedCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useClient();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [fee, setFee] = useState<Fee | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [method, setMethod] = useState<'UPI' | 'Card' | 'Netbanking'>('UPI');

  useEffect(() => {
    loadCheckout();
  }, [params.id]);

  const loadCheckout = async () => {
    if (!params.id) return;
    
    // Find payment record by ID
    // Since our mock database store can be read globally
    const store = localStorage.getItem('db_payments');
    const pays: Payment[] = store ? JSON.parse(store) : [];
    const pay = pays.find(p => p.id === params.id);
    
    if (!pay) {
      setLoading(false);
      return;
    }

    setPayment(pay);

    // Get fee details
    const feesStore = localStorage.getItem('db_fees');
    const fees: Fee[] = feesStore ? JSON.parse(feesStore) : [];
    const f = fees.find(x => x.id === pay.fee_id);
    if (f) {
      setFee(f);
      // Get student details
      const studentsStore = localStorage.getItem('db_students');
      const students: Student[] = studentsStore ? JSON.parse(studentsStore) : [];
      const s = students.find(x => x.id === f.student_id);
      if (s) setStudent(s);
    }
    
    setLoading(false);
  };

  const handlePay = async () => {
    if (!payment) return;

    try {
      const mockTxnId = 'pay_razor_' + Math.random().toString(36).substr(2, 9);
      
      // Update database status
      await DbClient.completePayment(payment.id, mockTxnId, method);

      // Auto-trigger WhatsApp payment success notification
      if (fee) {
        const acadStore = localStorage.getItem('db_academies');
        const acads = acadStore ? JSON.parse(acadStore) : [];
        const academy = acads[0]; // Apex Chess Academy default

        if (academy && student) {
          await DbClient.triggerWhatsAppReminder(
            academy.id,
            student.id,
            'payment_success',
            `Thank you! We have received your payment of ₹${payment.amount} for ${student.name}.`
          );
        }
      }

      setCheckoutSuccess(true);
      showToast('Payment processed successfully!', 'success');
    } catch (err) {
      showToast('Payment processing failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-xs">Opening payment gateway tunnel...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white p-4">
        <div className="glass-panel p-6 rounded-2xl max-w-sm text-center space-y-4 border border-white/10">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-extrabold text-sm text-zinc-200">Checkout Session Expired</h3>
          <p className="text-xs text-zinc-400">The link you followed has expired or does not map to a registered invoice.</p>
          <button onClick={() => router.push('/')} className="bg-zinc-900 px-4 py-2 rounded-xl text-xs text-zinc-300 border border-white/5 w-full">
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070708] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-up text-white">
        
        {/* Razorpay header mock */}
        <div className="p-5 bg-zinc-950 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-violet-600 p-2 rounded-lg text-white font-extrabold text-sm">
              RF
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-zinc-200 uppercase tracking-wider">RemindFlow Checkout</h4>
              <span className="text-[9px] text-zinc-500 block mt-0.5">Secure SSL sandbox</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-zinc-400 block font-bold">Invoiced Amount</span>
            <span className="text-sm font-extrabold text-violet-400">₹{payment.amount}</span>
          </div>
        </div>

        {checkoutSuccess ? (
          <div className="p-8 text-center space-y-6 animate-fade-in">
            <div className="inline-flex bg-emerald-500/10 p-3.5 rounded-full border border-emerald-500/25 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-12 h-12 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-white">Payment Received!</h3>
              <p className="text-xs text-zinc-400 leading-normal max-w-xs mx-auto">
                Thank you! Your payment has been successfully recorded. A confirmation receipt has been sent to your WhatsApp number.
              </p>
            </div>

            <div className="p-3 bg-zinc-950/80 rounded-xl border border-white/5 text-[10px] text-zinc-500 text-left space-y-1 max-w-xs mx-auto">
              <div>&bull; Transaction ID: <span className="text-zinc-300 font-mono">pay_txn_mock_{Math.random().toString(36).substr(2, 6)}</span></div>
              <div>&bull; Payment Method: <span className="text-zinc-300">{method} checkout</span></div>
              <div>&bull; Settlement: <span className="text-zinc-300">Direct Merchant Bank Transfer</span></div>
            </div>

            <button
              onClick={() => window.close()}
              className="bg-zinc-950 hover:bg-zinc-900 border border-white/5 text-zinc-300 px-6 py-2.5 rounded-xl text-xs font-bold transition-all w-full max-w-xs"
            >
              Close Checkout Window
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            
            {/* Student info Summary */}
            {student && (
              <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-xl text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Student Name:</span>
                  <span className="font-bold text-zinc-300">{student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Billing Cycle:</span>
                  <span className="text-zinc-300 font-medium">Monthly Tuition Fee</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Parent Guardian:</span>
                  <span className="text-zinc-300 font-medium">{student.parent_name}</span>
                </div>
              </div>
            )}

            {/* Select Method */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Select Payment Method</label>
              
              <div className="space-y-2 text-xs">
                {[
                  { id: 'UPI', label: 'UPI / GooglePay / PhonePe', desc: 'Scan QR or enter virtual payment address' },
                  { id: 'Card', label: 'Credit or Debit Card', desc: 'Visa, MasterCard, RuPay cards accepted' },
                  { id: 'Netbanking', label: 'Net Banking transfer', desc: 'Transfer directly from your bank' }
                ].map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      method === opt.id 
                        ? 'bg-violet-600/10 border-violet-500/30 text-violet-300' 
                        : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payopt"
                      checked={method === opt.id}
                      onChange={() => setMethod(opt.id as any)}
                      className="w-4 h-4 text-violet-600 bg-zinc-900 border-white/5 focus:ring-violet-500 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-zinc-200 block">{opt.label}</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 block font-normal leading-normal">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/5" />

            <button
              onClick={handlePay}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-[0_4px_15px_rgba(139,92,246,0.3)] hover:scale-102 active:scale-98"
            >
              Complete sandbox payment of ₹{payment.amount}
            </button>

            <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure 256-bit SSL encrypted transaction
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
