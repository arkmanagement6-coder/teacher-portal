"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DbClient, Payment, Fee, Student, Academy } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { 
  CreditCard, CheckCircle2, ShieldCheck, AlertCircle, 
  ArrowLeft, QrCode, Building, Upload, FileText, Check, X 
} from 'lucide-react';

export default function HostedCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useClient();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [fee, setFee] = useState<Fee | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);

  // Screenshot upload states
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    loadCheckout();
  }, [params.id]);

  const loadCheckout = async () => {
    if (!params.id) return;
    
    try {
      const store = localStorage.getItem('db_payments');
      const pays: Payment[] = store ? JSON.parse(store) : [];
      const pay = pays.find(p => p.id === params.id);
      
      if (!pay) {
        setLoading(false);
        return;
      }

      setPayment(pay);

      const acadStore = localStorage.getItem('db_academies');
      const acads: Academy[] = acadStore ? JSON.parse(acadStore) : [];
      const acad = acads.find(a => a.id === pay.academy_id) || acads[0];
      if (acad) setAcademy(acad);

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
    } catch (err) {
      console.error("Failed to load checkout details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadScreenshot = async () => {
    if (!fee || !academy || !student) return;

    setUploading(true);
    // Simulate upload delay
    setTimeout(async () => {
      try {
        const mockScreenshot = 'https://images.unsplash.com/photo-1616077168712-fc6c788bc4ee?auto=format&fit=crop&q=80&w=600';
        
        await DbClient.updateFee(fee.id, {
          screenshot_url: mockScreenshot,
          screenshot_status: 'pending_verification',
          screenshot_uploaded_at: new Date().toISOString()
        });

        // Trigger WhatsApp notification to teacher mock
        await DbClient.triggerWhatsAppReminder(
          academy.id,
          student.id,
          'class_reminder',
          `Direct Payment Notice: Parent of ${student.name} has uploaded a screenshot receipt of ₹${fee.amount} for verification.`
        );

        showToast('Receipt screenshot uploaded successfully!', 'success');
        loadCheckout();
      } catch (err) {
        showToast('Failed to log receipt screenshot', 'error');
      } finally {
        setUploading(false);
      }
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs">Opening payment invoice session...</p>
        </div>
      </div>
    );
  }

  if (!payment || !fee) {
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

  const isPaid = fee.status === 'paid';
  const screenshotStatus = fee.screenshot_status; // 'pending_verification' | 'approved' | 'rejected' | 'need_reupload'

  // Default UPI/QR Fallbacks if not set
  const upiIdStr = academy?.upi_id || 'academy@upi';
  const qrImageSrc = academy?.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${upiIdStr}%26pn=${encodeURIComponent(academy?.name || 'Academy')}%26am=${fee.amount}%26cu=INR`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Merchant Header info */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-lg text-white font-extrabold text-xs">
              DirectPay
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">{academy?.name || 'Academy Checkout'}</h4>
              <span className="text-[9px] text-slate-400 block mt-0.5">{academy?.address || 'Direct merchant transfer'}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-500 block font-bold">Fee Amount</span>
            <span className="text-sm font-extrabold text-blue-600">₹{fee.amount}</span>
          </div>
        </div>

        {/* Student metadata */}
        {student && (
          <div className="mx-5 mt-5 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-1.5 shadow-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Student:</span>
              <strong className="text-slate-800">{student.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Class Batch:</span>
              <span className="text-slate-700 font-semibold">{student.batch_name || 'Tuition Class'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Billing Cycle:</span>
              <span className="text-slate-700 font-semibold">{fee.billing_cycle.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Due Date:</span>
              <span className="text-rose-600 font-bold">{fee.due_date}</span>
            </div>
          </div>
        )}

        {/* Body content based on status */}
        {isPaid ? (
          <div className="p-8 text-center space-y-6 animate-fade-in">
            <div className="inline-flex bg-emerald-50 p-3.5 rounded-full border border-emerald-100 text-emerald-600 shadow-sm">
              <Check className="w-12 h-12" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-slate-900">Fee Payment Confirmed!</h3>
              <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
                Thank you! Your payment receipt has been verified by the academy instructor. Status logged as **PAID**.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 text-left space-y-1.5 max-w-xs mx-auto shadow-sm">
              <div>&bull; Transaction: <span className="text-slate-700 font-bold">Direct Settlement</span></div>
              <div>&bull; Status: <span className="text-emerald-600 font-bold uppercase">APPROVED</span></div>
              <div>&bull; Date: <span className="text-slate-700">{new Date(fee.screenshot_uploaded_at || Date.now()).toLocaleDateString()}</span></div>
            </div>
          </div>
        ) : screenshotStatus === 'pending_verification' ? (
          <div className="p-8 text-center space-y-6 animate-fade-in">
            <div className="inline-flex bg-amber-50 p-3.5 rounded-full border border-amber-100 text-amber-600 shadow-sm">
              <Upload className="w-12 h-12 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-slate-900">Receipt Under Review</h3>
              <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
                Your payment screenshot has been uploaded. The academy owner is currently verifying the transfer.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 text-left space-y-1.5 max-w-xs mx-auto shadow-sm">
              <div className="flex justify-between">
                <span>Verification:</span>
                <span className="text-amber-600 font-bold uppercase">PENDING APPROVAL</span>
              </div>
              <div className="flex justify-between">
                <span>Dispatched:</span>
                <span className="text-slate-700 font-mono font-bold">{new Date(fee.screenshot_uploaded_at || Date.now()).toLocaleTimeString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="block text-[9px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Uploaded Screenshot Preview:</span>
                <img 
                  src={fee.screenshot_url} 
                  alt="Receipt Screenshot" 
                  className="w-full h-24 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-400 italic">You can close this tab. A confirmation will be sent on WhatsApp.</div>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {screenshotStatus === 'rejected' && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">Screenshot Rejected:</span> The academy owner was unable to locate this transfer in their account. Please check the credentials and upload a clear screenshot of the successful transaction.
                </div>
              </div>
            )}

            {/* Step 1: scan/pay info */}
            <div className="space-y-3.5">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Step 1: Pay Directly to Merchant</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-sm">
                
                {/* QR Code image */}
                <div className="space-y-2 flex flex-col items-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <img 
                      src={qrImageSrc} 
                      alt="Merchant Scan QR" 
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Scan QR with UPI App</span>
                </div>

                {/* Account details */}
                <div className="space-y-3 text-xs leading-normal">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">UPI Address</span>
                    <strong className="text-slate-800 text-xs select-all block mt-0.5">{upiIdStr}</strong>
                  </div>

                  {academy?.bank_account_no && (
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Bank Transfer Details</span>
                      <div className="text-[10px] text-slate-700 space-y-0.5 mt-1">
                        <div>Account: <strong>{academy.bank_account_no}</strong></div>
                        <div>IFSC: <strong>{academy.bank_ifsc}</strong></div>
                        <div>Bank: <strong>{academy.bank_name}</strong></div>
                        <div>Name: <strong>{academy.bank_holder_name}</strong></div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Step 2: screenshot upload */}
            <div className="space-y-3">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Step 2: Upload Payment Confirmation Receipt</span>
              
              {selectedFile ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex items-center justify-between text-xs shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-800 block">payment_receipt.png</span>
                      <span className="text-[10px] text-slate-400 block">ready to verify</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)} 
                    className="text-slate-400 hover:text-slate-650 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 transition-colors bg-slate-50/50 cursor-pointer" onClick={() => setSelectedFile('mock')}>
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-blue-600">Click to upload transaction screenshot</span>
                  <span className="text-[9px] text-slate-400 mt-1 block">PNG, JPG formats accepted</span>
                </div>
              )}
            </div>

            <button
              onClick={handleUploadScreenshot}
              disabled={!selectedFile || uploading}
              className={`w-full font-bold py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                selectedFile && !uploading
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10 hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading receipt screenshot...
                </>
              ) : (
                <>Submit Payment Screenshot</>
              )}
            </button>

            <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Direct-to-merchant P2P security validation
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
