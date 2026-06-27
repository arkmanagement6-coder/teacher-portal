"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Profile, Batch } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { ShieldCheck, Plus, CheckCircle, Mail, Phone, Lock, Calendar } from 'lucide-react';

export default function TeachersPage() {
  const { showToast } = useClient();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    const tList = await DbClient.getTeachers(academy.id);
    setTeachers(tList);

    const bList = await DbClient.getBatches(academy.id);
    setBatches(bList);

    setLoading(false);
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !mobile) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const academy = await DbClient.getAcademy();
    if (!academy) return;

    try {
      await DbClient.addTeacher(academy.id, { name, email, mobile });
      showToast(`Teacher "${name}" registered successfully!`, 'success');
      setIsAddOpen(false);
      
      setName('');
      setEmail('');
      setMobile('');

      loadData();
    } catch (err) {
      showToast('Failed to add teacher', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-xs">Loading teacher database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Teacher Management</h1>
          <p className="text-xs text-zinc-400">Configure coaching accounts and track instructor assignments</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(139,92,246,0.2)] flex items-center gap-1.5"
        >
          <Plus className="w-4.5 h-4.5" /> Add Teacher
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map(t => {
          const assigned = batches.filter(b => b.teacher_id === t.id);
          return (
            <div key={t.id} className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-violet-500/20 transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/25 flex items-center justify-center text-violet-400 font-extrabold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-zinc-200">{t.name}</h3>
                    <span className="text-[9px] uppercase tracking-widest text-violet-400 font-bold bg-violet-500/5 px-2 py-0.5 rounded border border-violet-500/10">COACH</span>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <span className="truncate">{t.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <span>{t.mobile || '9876543210'}</span>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* Assigned Batches */}
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Assigned Batches ({assigned.length})</span>
                  {assigned.length === 0 ? (
                    <span className="text-[11px] text-zinc-500 italic block">No active classes assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {assigned.map(b => (
                        <span key={b.id} className="text-[9px] font-semibold bg-zinc-950 text-zinc-300 border border-white/5 px-2 py-1 rounded-lg">
                          {b.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px bg-white/5" />

                {/* Permissions HUD */}
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Access Permissions</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] font-semibold">
                    <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-1.5 rounded-lg">
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> Mark Attendance
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-1.5 rounded-lg">
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> View Fees Status
                    </div>
                    <div className="flex items-center gap-1 text-rose-400 bg-rose-500/5 border border-rose-500/10 p-1.5 rounded-lg col-span-2">
                      <Lock className="w-3 h-3 text-rose-400" /> Blocked from Academy Settings
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Add Teacher Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">Add Academy Staff</h3>
              <button 
                onClick={() => setIsAddOpen(false)} 
                className="text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Teacher Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Neelam Sen"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="neelam@academy.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4.5 py-2.5 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all"
                >
                  Register Teacher
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
