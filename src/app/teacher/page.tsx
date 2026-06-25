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
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'leave'>>({});
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

    // Load batches assigned to this teacher
    const bList = await DbClient.getBatches(academy.id);
    const teacherBatches = bList.filter(b => b.teacher_id === user?.id);
    
    setBatches(teacherBatches);
    if (teacherBatches.length > 0) {
      setSelectedBatch(teacherBatches[0]);
    } else if (bList.length > 0) {
      // Fallback to first batch if none assigned specifically
      setSelectedBatch(bList[0]);
    }
    setLoading(false);
  };

  const loadStudentsForBatch = async (batchId: string) => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    // Get all students
    const stds = await DbClient.getStudents(academy.id);
    const batchStds = stds.filter(s => s.batch_id === batchId && s.status === 'active');
    setStudents(batchStds);

    // Load existing marked attendance for this date
    const existing = await DbClient.getAttendance(selectedDate, batchId);
    
    const records: Record<string, 'present' | 'absent' | 'leave'> = {};
    batchStds.forEach(s => {
      const match = existing.find(e => e.student_id === s.id);
      records[s.id] = match ? match.status : 'present'; // default present
    });
    setAttendanceRecords(records);
  };

  const handleMarkStatus = (studentId: string, status: 'present' | 'absent' | 'leave') => {
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
      
      // Auto-trigger WhatsApp alert for absent students
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-[#09090b]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-xs font-semibold">Configuring teacher portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070708] text-zinc-100 pb-20">
      
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-20 bg-zinc-950 border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-violet-600 p-1.5 rounded-lg text-white shadow-[0_0_12px_#8b5cf6]">
            <Zap className="w-4.5 h-4.5 fill-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">Teacher<span className="text-violet-400">Hub</span></span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme} 
            className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-300"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={logout} 
            className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Profile Card */}
        <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Assigned Instructor</span>
            <strong className="text-white text-sm block mt-0.5">{user?.name}</strong>
          </div>
          <span className="px-2 py-0.5 bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[9px] font-bold rounded">
            ROSTER ACTIVE
          </span>
        </div>

        {/* Filters Panel */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4">
          
          {/* Select Batch */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Class Batch</label>
            <select
              value={selectedBatch?.id || ''}
              onChange={(e) => {
                const found = batches.find(b => b.id === e.target.value);
                if (found) setSelectedBatch(found);
              }}
              className="w-full bg-zinc-950 border border-white/5 rounded-xl py-3 px-3 text-xs text-white focus:outline-none"
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
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-zinc-950 border border-white/5 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none"
            />
          </div>

        </div>

        {/* Student marking grid */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs px-1">
            <span className="font-bold text-zinc-300">Enrolled Students ({students.length})</span>
            <span className="text-zinc-500 text-[10px] flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date: {selectedDate}</span>
          </div>

          <div className="space-y-3.5">
            {students.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-6 text-center">No students registered in this batch.</p>
            ) : (
              students.map(s => {
                const currentStatus = attendanceRecords[s.id] || 'present';
                return (
                  <div key={s.id} className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3.5">
                    
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-zinc-200 block">{s.name}</span>
                        <span className="text-[9px] text-zinc-500 mt-0.5">Parent: {s.parent_name}</span>
                      </div>
                      
                      {/* Fee status indicator for teachers (no amount shown) */}
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                        s.monthly_fee > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        FEE: ACTIVE
                      </span>
                    </div>

                    {/* Marked options */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleMarkStatus(s.id, 'present')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${
                          currentStatus === 'present' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-zinc-950 border-white/5 text-zinc-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Present
                      </button>

                      <button
                        onClick={() => handleMarkStatus(s.id, 'absent')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${
                          currentStatus === 'absent' 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                            : 'bg-zinc-950 border-white/5 text-zinc-400'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> Absent
                      </button>

                      <button
                        onClick={() => handleMarkStatus(s.id, 'leave')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${
                          currentStatus === 'leave' 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                            : 'bg-zinc-950 border-white/5 text-zinc-400'
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
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm transition-all shadow-[0_4px_15px_rgba(139,92,246,0.3)] hover:scale-102 active:scale-98"
          >
            Save Attendance & Dispatch Alerts
          </button>
        )}

      </div>
    </div>
  );
}
