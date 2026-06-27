"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DbClient, Academy, Profile, Student } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { 
  Building2, Users, FileSpreadsheet, CreditCard, MessageSquare, 
  CheckCircle2, ChevronRight, ChevronLeft, Plus, Trash2, Upload, AlertCircle 
} from 'lucide-react';

export default function SetupWizard() {
  const router = useRouter();
  const { user, showToast } = useClient();
  const [step, setStep] = useState(1);
  const [academyId, setAcademyId] = useState('');

  // Step 1: Academy info
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('');

  // Step 2: Add Teachers
  const [teachers, setTeachers] = useState<{ name: string; email: string; mobile: string }[]>([
    { name: 'Neelam Sen', email: 'neelam@academy.com', mobile: '9876543210' }
  ]);
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tMobile, setTMobile] = useState('');

  // Step 3: Students Import
  const [students, setStudents] = useState<Omit<Student, 'id' | 'academy_id' | 'created_at'>[]>([]);
  const [csvText, setCsvText] = useState(
    "Name,Parent Name,Mobile,WhatsApp,Monthly Fee,Due Date\n" +
    "Aarav Sharma,Rajesh Sharma,9812345678,9812345678,1500,5\n" +
    "Isha Patel,Amit Patel,9723456781,9723456781,1500,5\n" +
    "Kabir Singh,Sanjay Singh,9634567812,9634567812,2000,10"
  );
  const [sName, setSName] = useState('');
  const [sParent, setSParent] = useState('');
  const [sMobile, setSMobile] = useState('');
  const [sFee, setSFee] = useState('1500');
  const [sDueDate, setSDueDate] = useState('5');

  // Step 4: Razorpay Connect
  const [rzpKey, setRzpKey] = useState('');
  const [rzpSecret, setRzpSecret] = useState('');

  // Step 5: WhatsApp Connect
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waToken, setWaToken] = useState('');
  const [waEnabled, setWaEnabled] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    DbClient.getAcademy().then(acad => {
      if (acad) {
        setAcademyId(acad.id);
        setName(acad.name || '');
        setAddress(acad.address || '');
        setLogo(acad.logo_url || '');
        setRzpKey(acad.razorpay_key_id || '');
        setRzpSecret(acad.razorpay_secret || '');
        setWaPhoneId(acad.whatsapp_settings?.phoneNumberId || '');
        setWaToken(acad.whatsapp_settings?.accessToken || '');
        setWaEnabled(acad.whatsapp_enabled);
      }
    });
  }, [user]);

  const handleNext = async () => {
    if (step === 1) {
      if (!name || !address) {
        showToast('Please specify Academy name and address', 'error');
        return;
      }
      await DbClient.updateAcademy(academyId, { name, address, logo_url: logo });
    }

    if (step === 2) {
      for (const t of teachers) {
        const existing = await DbClient.getTeachers(academyId);
        if (!existing.some(ex => ex.email.toLowerCase() === t.email.toLowerCase())) {
          await DbClient.addTeacher(academyId, t);
        }
      }
    }

    if (step === 3) {
      for (const s of students) {
        await DbClient.addStudent(academyId, s);
      }
    }

    if (step === 4) {
      await DbClient.updateAcademy(academyId, {
        razorpay_key_id: rzpKey || 'rzp_mock_key',
        razorpay_secret: rzpSecret || 'rzp_mock_secret'
      });
    }

    if (step === 5) {
      await DbClient.updateAcademy(academyId, {
        whatsapp_enabled: waEnabled,
        whatsapp_settings: {
          phoneNumberId: waPhoneId || '102948120498',
          accessToken: waToken || 'EAAd...'
        }
      });
      await DbClient.generateMonthlyFees(academyId);
    }

    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleAddTeacher = () => {
    if (!tName || !tEmail) {
      showToast('Teacher name and email are required', 'error');
      return;
    }
    setTeachers([...teachers, { name: tName, email: tEmail, mobile: tMobile || 'N/A' }]);
    setTName('');
    setTEmail('');
    setTMobile('');
  };

  const handleRemoveTeacher = (idx: number) => {
    setTeachers(teachers.filter((_, i) => i !== idx));
  };

  const handleAddStudent = () => {
    if (!sName || !sMobile) {
      showToast('Student name and mobile are required', 'error');
      return;
    }
    setStudents([...students, {
      name: sName,
      parent_name: sParent,
      mobile: sMobile,
      whatsapp: sMobile,
      email: '',
      monthly_fee: Number(sFee) || 1500,
      due_date: Number(sDueDate) || 5,
      joining_date: new Date().toISOString().split('T')[0],
      status: 'active'
    }]);
    setSName('');
    setSParent('');
    setSMobile('');
  };

  const handleParseCSV = () => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length <= 1) {
        showToast('CSV is empty or invalid', 'error');
        return;
      }
      
      const parsed: Omit<Student, 'id' | 'academy_id' | 'created_at'>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 3) {
          parsed.push({
            name: cols[0]?.trim(),
            parent_name: cols[1]?.trim() || 'Parent',
            mobile: cols[2]?.trim(),
            whatsapp: cols[3]?.trim() || cols[2]?.trim(),
            email: cols[0]?.trim().toLowerCase().replace(/\s+/g, '') + '@example.com',
            monthly_fee: Number(cols[4]) || 1500,
            due_date: Number(cols[5]) || 5,
            joining_date: new Date().toISOString().split('T')[0],
            status: 'active'
          });
        }
      }
      setStudents([...students, ...parsed]);
      showToast(`Successfully parsed and added ${parsed.length} students!`, 'success');
    } catch (err) {
      showToast('Error parsing CSV. Please check fields.', 'error');
    }
  };

  const handleFinishOnboarding = () => {
    showToast('Setup complete! Welcome to your dashboard.', 'success');
    router.push('/owner');
  };

  const stepsList = [
    { num: 1, name: 'Academy Info', icon: <Building2 className="w-4 h-4" /> },
    { num: 2, name: 'Add Teachers', icon: <Users className="w-4 h-4" /> },
    { num: 3, name: 'Import Students', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { num: 4, name: 'Razorpay Connect', icon: <CreditCard className="w-4 h-4" /> },
    { num: 5, name: 'WhatsApp API', icon: <MessageSquare className="w-4 h-4" /> },
    { num: 6, name: 'Complete', icon: <CheckCircle2 className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-10 px-4 sm:px-8 text-slate-800">
      
      {/* Background glow highlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto space-y-8 flex-1 flex flex-col justify-center relative z-10">
        
        {/* Onboarding Header */}
        <div className="text-center space-y-2">
          <span className="text-orange-600 font-bold text-xs uppercase tracking-widest bg-orange-50 border border-orange-200 px-3 py-1 rounded-full shadow-sm">First Time Setup Wizard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">Configure your Academy workspace</h1>
          <p className="text-slate-650 text-xs sm:text-sm">Just a few steps to prepare your automated fee collection funnel</p>
        </div>

        {/* Steps Progress Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-white border border-slate-200 text-xs shadow-sm">
          {stepsList.map((s, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                step === s.num 
                  ? 'bg-blue-50 text-blue-600 font-extrabold border border-blue-100 shadow-sm' 
                  : step > s.num 
                  ? 'text-emerald-600 font-semibold' 
                  : 'text-slate-400'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : s.icon}
              <span className="hidden sm:inline">{s.name}</span>
            </div>
          ))}
        </div>

        {/* Onboarding Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-xl flex-1 flex flex-col justify-between min-h-[380px]">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building2 className="w-5 h-5 text-blue-600" /> 1. Academy Profile Info
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">Let's set up the core identity of your coaching institute. This info will appear on fee notifications and payment receipts.</p>
              
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Academy Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chess Innovators Club"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-xs sm:text-sm text-slate-800 focus:outline-none transition-all placeholder-slate-450"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Office Address</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="402, Sector 15, HSR Layout, Bangalore"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-xs sm:text-sm text-slate-800 focus:outline-none transition-all resize-none placeholder-slate-450"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Users className="w-5 h-5 text-blue-600" /> 2. Add Teachers / Staff
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">Teachers can mark class attendance and view student fee statuses but cannot configure settings. Add your coaching staff:</p>

              {/* Add form */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teacher Name</label>
                  <input
                    type="text"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    placeholder="e.g. Neelam Sen"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={tEmail}
                    onChange={(e) => setTEmail(e.target.value)}
                    placeholder="neelam@gmail.com"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input
                    type="tel"
                    value={tMobile}
                    onChange={(e) => setTMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddTeacher}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Staff
                  </button>
                </div>
              </div>

              {/* Teachers List */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pt-2">
                {teachers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No teachers added yet. You can also skip this and add them later.</p>
                ) : (
                  teachers.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                      <div>
                        <div className="font-bold text-slate-700">{t.name}</div>
                        <div className="text-[10px] text-slate-500">{t.email}</div>
                      </div>
                      <button onClick={() => handleRemoveTeacher(idx)} className="text-rose-600 hover:text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" /> 3. Import Students
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">Paste standard spreadsheet rows or manually append students below. Seeding initial accounts saves hours of entry time.</p>

              {/* Manual quick add form */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    placeholder="Student Name"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={sMobile}
                    onChange={(e) => setSMobile(e.target.value)}
                    placeholder="WhatsApp Mobile"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddStudent}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition-all shadow-sm"
                  >
                    + Add Student
                  </button>
                </div>
              </div>

              {/* CSV Bulk Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paste CSV Spreadsheet Data</label>
                  <button
                    onClick={handleParseCSV}
                    className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 font-bold transition-all"
                  >
                    <Upload className="w-3 h-3" /> Parse & Load Rows
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-700 focus:border-blue-500 rounded-xl p-3 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Added counts */}
              <div className="text-xs text-slate-655 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span>Loaded student database: <strong className="text-slate-800">{students.length}</strong> enrolled</span>
                {students.length > 0 && (
                  <button onClick={() => setStudents([])} className="text-rose-600 hover:underline">Clear list</button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> 4. Connect Razorpay Gateway
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">RemindFlow routes fees directly to your accounts. Paste your Razorpay credentials. <em>(Leave empty to activate Demo Mode with our pre-built sandbox)</em>.</p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Razorpay Key ID</label>
                  <input
                    type="text"
                    value={rzpKey}
                    onChange={(e) => setRzpKey(e.target.value)}
                    placeholder="rzp_live_..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-xs sm:text-sm text-slate-800 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Razorpay Secret Key</label>
                  <input
                    type="password"
                    value={rzpSecret}
                    onChange={(e) => setRzpSecret(e.target.value)}
                    placeholder="••••••••••••••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-xs sm:text-sm text-slate-800 focus:outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-slate-600 leading-normal flex gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-blue-600 flex-shrink-0" />
                <span>
                  <strong>Safe Mode:</strong> If you leave these blank, the system automatically uses mock sandbox checkout. You will be able to test generation of payment links and complete simulated checkouts via the Playground drawer.
                </span>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <MessageSquare className="w-5 h-5 text-blue-600" /> 5. Configure WhatsApp API
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">RemindFlow sends alerts using your Meta WhatsApp Business API keys. Hook up your WhatsApp account details:</p>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">WhatsApp Phone Number ID</label>
                    <input
                      type="text"
                      value={waPhoneId}
                      onChange={(e) => setWaPhoneId(e.target.value)}
                      placeholder="e.g. 10984729384729"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-xs sm:text-sm text-slate-800 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Meta Access Token</label>
                    <input
                      type="password"
                      value={waToken}
                      onChange={(e) => setWaToken(e.target.value)}
                      placeholder="EAAd7..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-xs sm:text-sm text-slate-800 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="waEnable"
                    checked={waEnabled}
                    onChange={(e) => setWaEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-white border-slate-200 focus:ring-blue-500 focus:ring-offset-white"
                  />
                  <label htmlFor="waEnable" className="text-xs font-semibold text-slate-700">
                    Enable automatic background reminders (7 days before, due date, etc.)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {step === 6 && (
            <div className="space-y-6 text-center py-6 animate-fade-in">
              <div className="inline-flex bg-emerald-50 p-4 rounded-full border border-emerald-100 text-emerald-600 shadow-md">
                <CheckCircle2 className="w-12 h-12 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-xl text-slate-900">Academy Workspace Ready!</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your B2B workspace has been successfully initialized. Students have been registered and billing schedules generated.
                </p>
              </div>

              <div className="p-3 bg-slate-50 max-w-sm mx-auto rounded-xl border border-slate-200 text-[10px] text-slate-500 text-left space-y-1">
                <span className="font-bold text-slate-700 block mb-0.5">System Initialization Actions:</span>
                <div>&bull; Enrolled student rosters.</div>
                <div>&bull; Generated initial monthly invoices.</div>
                <div>&bull; Created Razorpay payment tunnels.</div>
                <div>&bull; Set WhatsApp automation triggers.</div>
              </div>
            </div>
          )}

          {/* Wizard Action Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            {step > 1 && step < 6 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 ml-auto"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-10 py-4 rounded-xl text-xs sm:text-sm transition-all shadow-md mx-auto block hover:scale-105 active:scale-95"
              >
                Enter Academy Dashboard
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
