"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Student, Batch } from '@/lib/db';
import { WhatsAppService } from '@/lib/whatsapp';
import { useClient } from '@/components/client-provider';
import { 
  Scan, CheckCircle2, UserCheck, AlertCircle, Smartphone, 
  HelpCircle, Sparkles, Send, Clock, User, QrCode, Search, Award
} from 'lucide-react';

export default function AttendanceScannerPage() {
  const { showToast } = useClient();
  const [academyId, setAcademyId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  
  // Modes: 'qr' (QR Simulator) or 'kiosk' (Self-Checkin Keypad)
  const [mode, setMode] = useState<'qr' | 'kiosk'>('qr');
  
  // QR Mode states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [scannedData, setScannedData] = useState<Student | null>(null);
  const [scanning, setScanning] = useState(false);

  // Kiosk Keypad states
  const [pin, setPin] = useState('');
  const [checkedInStudent, setCheckedInStudent] = useState<Student | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    loadScannerData();
  }, []);

  const loadScannerData = async () => {
    const acad = await DbClient.getAcademy();
    if (!acad) return;
    setAcademyId(acad.id);

    const stds = await DbClient.getStudents(acad.id);
    // Assign mock roll numbers (e.g., 101, 102, 103...) to students for the kiosk mode if not present
    const studentsWithRoll = stds.map((s, idx) => ({
      ...s,
      roll_no: s.roll_no || String(101 + idx)
    }));
    setStudents(studentsWithRoll);

    const bList = await DbClient.getBatches(acad.id);
    setBatches(bList);
  };

  // Process checking in a student
  const markStudentPresent = async (student: Student) => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      
      // Determine batch id (default to first batch or unassigned)
      const batchId = student.batch_id || batches[0]?.id || 'batch-1';
      
      // Record attendance in DB
      await DbClient.markAttendance(
        [{ student_id: student.id, status: 'present' }],
        todayDate,
        batchId,
        'system-scanner'
      );

      // Dispatch WhatsApp Parent Check-in Alert
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await WhatsAppService.sendWhatsApp(
        academyId,
        student.id,
        'class_reminder', // Use class template to notify arrival
        {
          student_name: student.name,
          timings: timeStr,
          batch_name: batches.find(b => b.id === batchId)?.name || 'Class'
        }
      );
      
      // Add custom message in outbox logs
      await DbClient.triggerWhatsAppReminder(
        academyId,
        student.id,
        'attendance_alert',
        `Dear Parent, ${student.name} has arrived safely and checked in at the Academy at ${timeStr}.`
      );

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Simulate scanning QR Code badge
  const handleQRScan = async () => {
    if (!selectedStudentId) {
      showToast('Please select a student badge to scan', 'error');
      return;
    }
    setScanning(true);
    setScannedData(null);

    // Simulate viewfinder analysis delay
    setTimeout(async () => {
      const student = students.find(s => s.id === selectedStudentId);
      if (student) {
        const success = await markStudentPresent(student);
        if (success) {
          setScannedData(student);
          showToast(`QR Scan Success! ${student.name} checked in.`, 'success');
        } else {
          showToast('Failed to log attendance', 'error');
        }
      }
      setScanning(false);
    }, 1500);
  };

  // Kiosk Keypad Input Handler
  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleClearPin = () => {
    setPin('');
  };

  const handleKioskSubmit = async () => {
    if (!pin) return;
    setCheckingIn(true);

    // Find student with matching roll number
    const student = students.find(s => s.roll_no === pin);
    if (!student) {
      showToast(`Invalid Student ID/Roll Number: "${pin}"`, 'error');
      setPin('');
      setCheckingIn(false);
      return;
    }

    const success = await markStudentPresent(student);
    if (success) {
      setCheckedInStudent(student);
      setPin('');
      showToast(`Welcome, ${student.name}! Checked in.`, 'success');
      
      // Auto-close welcome banner after 3.5 seconds
      setTimeout(() => {
        setCheckedInStudent(null);
      }, 3500);
    } else {
      showToast('Failed to log attendance', 'error');
    }
    setCheckingIn(false);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Scan className="w-6 h-6 text-blue-600 animate-pulse" /> Auto Attendance Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Provide self-checkin terminals or scan QR codes to mark attendance and send live WhatsApp arrival alerts to parents.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-center shadow-sm">
          <button
            onClick={() => { setMode('qr'); handleClearPin(); setCheckedInStudent(null); }}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              mode === 'qr' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <QrCode className="w-4 h-4" /> QR Badge Scanner
          </button>
          <button
            onClick={() => { setMode('kiosk'); setScannedData(null); }}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              mode === 'kiosk' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Self Check-in Kiosk
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Controls & Interactive Scanner */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Mode 1: QR Badge Scanner Simulator */}
          {mode === 'qr' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <Scan className="w-4.5 h-4.5 text-blue-600" /> Camera Viewfinder (Simulated)
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-150 animate-pulse">
                  WEB CAMERA ACTIVE
                </span>
              </div>

              {/* Camera viewport simulation */}
              <div className="aspect-video w-full rounded-2xl bg-slate-950 border border-slate-850 relative overflow-hidden flex flex-col items-center justify-center text-center p-4">
                
                {/* Viewfinder crosshairs */}
                <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-blue-500/60 rounded-xl relative flex items-center justify-center animate-pulse">
                    
                    {/* Laser scanning line animation */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_12px_#3b82f6] animate-scan" />
                    
                    <QrCode className="w-16 h-16 text-white/10" />
                  </div>
                </div>

                {scanning ? (
                  <div className="relative z-10 space-y-2 text-white">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">Analyzing QR Code Matrix...</p>
                  </div>
                ) : scannedData ? (
                  <div className="relative z-10 space-y-3 bg-slate-900/90 p-4 rounded-xl border border-emerald-500/20 max-w-xs text-white">
                    <div className="inline-flex bg-emerald-500/10 p-2 rounded-full border border-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm">{scannedData.name}</h4>
                      <p className="text-[9px] text-zinc-400 mt-0.5">Parent Mobile: {scannedData.mobile}</p>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider block text-center">
                      Checked In & WhatsApp Dispatched
                    </span>
                  </div>
                ) : (
                  <div className="text-zinc-500 text-xs max-w-xs">
                    <QrCode className="w-10 h-10 text-zinc-650 mx-auto mb-2" />
                    <p className="font-medium text-zinc-400">Align student badge QR inside camera focus area</p>
                  </div>
                )}
              </div>

              {/* Simulator Action Drawer */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Simulator Trigger Panel</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Student ID Badge to Scan</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="">-- Choose Student Badge --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (Roll ID: {s.roll_no})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={handleQRScan}
                      disabled={scanning}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-blue-500/10"
                    >
                      <Scan className="w-3.5 h-3.5" /> Scan QR Card
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Mode 2: Self Check-in Kiosk Keypad */}
          {mode === 'kiosk' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row gap-6">
              
              {/* Kiosk Screen / Keypad */}
              <div className="flex-1 space-y-4 max-w-sm mx-auto">
                <div className="text-center space-y-1">
                  <span className="text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Kiosk Station</span>
                  <h3 className="font-extrabold text-slate-900 text-sm">Enter Student ID Code</h3>
                </div>

                {/* Display pin screen */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-mono font-bold tracking-widest text-slate-850 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl shadow-inner">
                    {pin || <span className="text-slate-300 text-sm font-normal font-sans">Type ID Code (e.g. 101)</span>}
                  </div>
                </div>

                {/* Grid Keypad */}
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      onClick={() => handleKeyPress(num)}
                      className="py-4 bg-slate-50 hover:bg-slate-100 border border-slate-250/60 rounded-xl text-sm font-bold text-slate-700 transition-colors shadow-sm"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleClearPin}
                    className="py-4 bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-600 rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => handleKeyPress('0')}
                    className="py-4 bg-slate-50 hover:bg-slate-100 border border-slate-250/60 rounded-xl text-sm font-bold text-slate-700 transition-colors shadow-sm"
                  >
                    0
                  </button>
                  <button
                    onClick={handleKioskSubmit}
                    disabled={checkingIn}
                    className="py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    Check In
                  </button>
                </div>
              </div>

              {/* Fullscreen Success Overlay container inside the card */}
              {checkedInStudent && (
                <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-6 rounded-2xl animate-fade-in">
                  <div className="bg-emerald-50 p-4 rounded-full border border-emerald-100 text-emerald-600 shadow-md mb-4 animate-bounce">
                    <UserCheck className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">Attendance Logged!</h3>
                  <p className="text-sm font-bold text-blue-600 mt-1">Welcome, {checkedInStudent.name}</p>
                  
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-[10px] text-slate-500 text-left mt-4 space-y-1">
                    <div>&bull; Student Roll: <strong className="text-slate-800 font-mono">{checkedInStudent.roll_no}</strong></div>
                    <div>&bull; Checked in at: <span className="text-slate-800 font-semibold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                    <div>&bull; Status: <span className="text-emerald-600 font-bold">Present</span></div>
                    <div>&bull; Parent SMS: <span className="text-emerald-600 font-bold flex items-center gap-1 inline-flex"><Send className="w-3 h-3" /> Dispatched</span></div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Right column: Student Roster Reference Table (Cheatsheet) */}
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
            <h4 className="font-extrabold text-xs text-slate-950 flex items-center gap-1">
              <Award className="w-4 h-4 text-blue-600" /> Student Roll Numbers
            </h4>
            <p className="text-[10px] text-slate-500">List of registered students and their corresponding 3-digit IDs for the terminal checkin simulator.</p>

            <div className="border border-slate-150 rounded-xl overflow-hidden text-xs max-h-[380px] overflow-y-auto bg-slate-50 shadow-inner">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                    <th className="p-2">Name</th>
                    <th className="p-2">ID Code</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-3 text-center text-slate-400 italic">No students loaded yet. Add them in Student Setup step.</td>
                    </tr>
                  ) : (
                    students.map(s => (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-white transition-colors">
                        <td className="p-2.5 font-bold text-slate-850">{s.name}</td>
                        <td className="p-2.5 font-mono text-blue-600 font-extrabold">{s.roll_no}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
