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
    
    const store = localStorage.getItem('db_payments');
    const pays: Payment[] = store ? JSON.parse(store) : [];
    const pay = pays.find(p => p.id === params.id);
    
    if (!pay) {
      setLoading(false);
      return;
    }

    setPayment(pay);

    const feesStore = localStorage.getItem('db_fees');
    const fees: Fee[] = feesStore ? JSON.parse(feesStore) : [];
    const f = fees.find(x => x.id === pay.fee_id);
    if (f) {
      setFee(f);
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
      
      await DbClient.completePayment(payment.id, mockTxnId, method);

      if (fee) {
        const acadStore = localStorage.getItem('db_academies');
        const acads = acadStore ? JSON.parse(acadStore) : [];
        const academy = acads[0];

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs">Opening payment gateway tunnel...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-850 p-4">
        <div className="glass-panel p-6 rounded-2xl max-w-sm text-center space-y-4 border border-slate-200 bg-white shadow-lg">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-extrabold text-sm text-slate-900">Checkout Session Expired</h3>
          <p className="text-xs text-slate-500">The link you followed has expired or does not map to a registered invoice.</p>
          <button onClick={() => router.push('/')} className="bg-slate-100 px-4 py-2 rounded-xl text-xs text-slate-650 border border-slate-200 w-full hover:bg-slate-200 transition-colors">
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Razorpay header mock */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-lg text-white font-extrabold text-sm">
              RF
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">RemindFlow Checkout</h4>
              <span className="text-[9px] text-slate-400 block mt-0.5">Secure SSL sandbox</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-550 block font-bold">Invoiced Amount</span>
            <span className="text-sm font-extrabold text-blue-600">₹{payment.amount}</span>
          </div>
        </div>

        {checkoutSuccess ? (
          <div className="p-8 text-center space-y-6 animate-fade-in">
            <div className="inline-flex bg-emerald-50 p-3.5 rounded-full border border-emerald-100 text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-12 h-12 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-slate-900">Payment Received!</h3>
              <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
                Thank you! Your payment has been successfully recorded. A confirmation receipt has been sent to your WhatsApp number.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 text-left space-y-1 max-w-xs mx-auto">
              <div>&bull; Transaction ID: <span className="text-slate-700 font-mono">pay_txn_mock_{Math.random().toString(36).substr(2, 6)}</span></div>
              <div>&bull; Payment Method: <span className="text-slate-700">{method} checkout</span></div>
              <div>&bull; Settlement: <span className="text-slate-700">Direct Merchant Bank Transfer</span></div>
            </div>

            <button
              onClick={() => window.close()}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-650 px-6 py-2.5 rounded-xl text-xs font-bold transition-all w-full max-w-xs"
            >
              Close Checkout Window
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            
            {student && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold text-slate-700">{student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Cycle:</span>
                  <span className="text-slate-700 font-semibold">Monthly Tuition Fee</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Parent Guardian:</span>
                  <span className="text-slate-700 font-semibold">{student.parent_name}</span>
                </div>
              </div>
            )}

            {/* Select Method */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Payment Method</label>
              
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
                        ? 'bg-blue-50 border-blue-200 text-blue-600' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payopt"
                      checked={method === opt.id}
                      onChange={() => setMethod(opt.id as any)}
                      className="w-4 h-4 text-blue-600 bg-white border-slate-200 focus:ring-blue-500 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">{opt.label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block font-normal leading-normal">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <button
              onClick={handlePay}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 hover:scale-102 active:scale-98"
            >
              Complete sandbox payment of ₹{payment.amount}
            </button>

            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure 256-bit SSL encrypted transaction
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
