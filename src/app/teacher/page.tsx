"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DbClient, Batch, Student, Attendance, Profile } from '@/lib/db';
import { WhatsAppService } from '@/lib/whatsapp';
import { useClient } from '@/components/client-provider';
import { 
  Users, CheckCircle, AlertCircle, Calendar, Clock, 
  User, Check, X, ShieldAlert, LogOut, Moon, Sun, Zap 
} from 'lucide-react';

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, logout, theme, toggleTheme, showToast } = useClient();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Attendance marking states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'leave' | 'online'>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'teacher') {
      router.push('/login');
      showToast('Unauthorized access. Redirecting...', 'error');
      return;
    }

    loadTeacherData();
  }, [user]);

  useEffect(() => {
    if (selectedBatch) {
      loadStudentsForBatch(selectedBatch.id);
    }
  }, [selectedBatch, selectedDate]);

  const loadTeacherData = async () => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    const bList = await DbClient.getBatches(academy.id);
    const teacherBatches = bList.filter(b => b.teacher_id === user?.id);
    
    setBatches(teacherBatches);
    if (teacherBatches.length > 0) {
      setSelectedBatch(teacherBatches[0]);
    } else if (bList.length > 0) {
      setSelectedBatch(bList[0]);
    }
    setLoading(false);
  };

  const loadStudentsForBatch = async (batchId: string) => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    const stds = await DbClient.getStudents(academy.id);
    const batchStds = stds.filter(s => s.batch_id === batchId && s.status === 'active');
    setStudents(batchStds);

    const existing = await DbClient.getAttendance(selectedDate, batchId);
    
    const records: Record<string, 'present' | 'absent' | 'leave' | 'online'> = {};
    batchStds.forEach(s => {
      const match = existing.find(e => e.student_id === s.id);
      records[s.id] = (match ? match.status : 'present') as any;
    });
    setAttendanceRecords(records);
  };

  const handleMarkStatus = (studentId: string, status: 'present' | 'absent' | 'leave' | 'online') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedBatch || !user) return;

    const recordsArray = Object.entries(attendanceRecords).map(([studentId, status]) => ({
      student_id: studentId,
      status
    }));

    try {
      await DbClient.markAttendance(recordsArray, selectedDate, selectedBatch.id, user.id);
      
      const academy = await DbClient.getAcademy();
      if (academy) {
        for (const record of recordsArray) {
          if (record.status === 'absent') {
            await WhatsAppService.sendWhatsApp(
              academy.id,
              record.student_id,
              'attendance_alert',
              {
                student_name: students.find(s => s.id === record.student_id)?.name || 'Student',
                attendance_status: 'ABSENT',
                date: selectedDate
              }
            );
          } else if (record.status === 'online') {
            const studentName = students.find(s => s.id === record.student_id)?.name || 'Student';
            await DbClient.triggerWhatsAppReminder(
              academy.id,
              record.student_id,
              'class_reminder',
              `Dear Parent, ${studentName} has joined the online class successfully today (${selectedDate}).`
            );
          }
        }
      }

      showToast('Attendance logged and parents notified!', 'success');
      loadStudentsForBatch(selectedBatch.id);
    } catch (err) {
      showToast('Failed to save attendance', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-50 text-slate-800">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-semibold">Configuring teacher portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm shadow-blue-500/20">
            <Zap className="w-4.5 h-4.5 fill-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900">Teacher<span className="text-orange-500">Hub</span></span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme} 
            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-650"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={logout} 
            className="text-rose-600 hover:text-rose-500 p-1.5 rounded-lg bg-rose-50 border border-rose-100 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Profile Card */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs shadow-sm">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Instructor</span>
            <strong className="text-slate-800 text-sm block mt-0.5">{user?.name}</strong>
          </div>
          <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold rounded shadow-sm">
            ROSTER ACTIVE
          </span>
        </div>

        {/* Filters Panel */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
          
          {/* Select Batch */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Class Batch</label>
            <select
              value={selectedBatch?.id || ''}
              onChange={(e) => {
                const found = batches.find(b => b.id === e.target.value);
                if (found) setSelectedBatch(found);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-xs text-slate-800 focus:outline-none"
            >
              {batches.length === 0 ? (
                <option value="">No batches assigned</option>
              ) : (
                batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Select Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none"
            />
          </div>

        </div>

        {/* Student marking grid */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs px-1">
            <span className="font-bold text-slate-700">Enrolled Students ({students.length})</span>
            <span className="text-slate-400 text-[10px] flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date: {selectedDate}</span>
          </div>

          <div className="space-y-3.5">
            {students.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No students registered in this batch.</p>
            ) : (
              students.map(s => {
                const currentStatus = attendanceRecords[s.id] || 'present';
                return (
                  <div key={s.id} className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white space-y-3.5 shadow-sm">
                    
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{s.name}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">Parent: {s.parent_name}</span>
                      </div>
                      
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold border bg-blue-50 border-blue-100 text-blue-600">
                        FEE: ACTIVE
                      </span>
                    </div>

                    {/* Marked options */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleMarkStatus(s.id, 'present')}
                        className={`py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all border flex items-center justify-center gap-0.5 ${
                          currentStatus === 'present' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 font-extrabold' 
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Present
                      </button>

                      <button
                        onClick={() => handleMarkStatus(s.id, 'absent')}
                        className={`py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all border flex items-center justify-center gap-0.5 ${
                          currentStatus === 'absent' 
                            ? 'bg-rose-50 border-rose-200 text-rose-600 font-extrabold' 
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> Absent
                      </button>

                      <button
                        onClick={() => handleMarkStatus(s.id, 'online')}
                        className={`py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all border flex items-center justify-center gap-0.5 ${
                          currentStatus === 'online' 
                            ? 'bg-blue-50 border-blue-200 text-blue-600 font-extrabold' 
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        Online
                      </button>

                      <button
                        onClick={() => handleMarkStatus(s.id, 'leave')}
                        className={`py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all border flex items-center justify-center gap-0.5 ${
                          currentStatus === 'leave' 
                            ? 'bg-amber-50 border-amber-200 text-amber-600 font-extrabold' 
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        Leave
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Submit button */}
        {students.length > 0 && (
          <button
            onClick={handleSubmitAttendance}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 hover:scale-102 active:scale-98"
          >
            Save Attendance & Dispatch Alerts
          </button>
        )}

      </div>
    </div>
  );
}
