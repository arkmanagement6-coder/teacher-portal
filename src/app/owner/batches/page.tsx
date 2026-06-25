"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Batch, Profile } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { Clock, Plus, Users, ShieldAlert, CheckCircle, Trash2, Edit } from 'lucide-react';

export default function BatchesPage() {
  const { showToast } = useClient();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [timings, setTimings] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [capacity, setCapacity] = useState('15');

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    const bList = await DbClient.getBatches(academy.id);
    setBatches(bList);

    const tList = await DbClient.getTeachers(academy.id);
    setTeachers(tList);
    
    setLoading(false);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !timings) {
      showToast('Name and Timings are required', 'error');
      return;
    }

    const academy = await DbClient.getAcademy();
    if (!academy) return;

    try {
      await DbClient.createBatch(academy.id, {
        name,
        timings,
        teacher_id: teacherId || undefined,
        capacity: Number(capacity) || 15
      });

      showToast(`Batch "${name}" created successfully!`, 'success');
      setIsAddOpen(false);
      
      setName('');
      setTimings('');
      setTeacherId('');
      setCapacity('15');

      loadBatches();
    } catch (err) {
      showToast('Failed to create batch', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this batch? All linked student profiles will lose their batch assignment.")) {
      await DbClient.deleteBatch(id);
      showToast('Batch deleted', 'success');
      loadBatches();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-xs">Loading batch configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Batch Management</h1>
          <p className="text-xs text-zinc-400">Organize schedule timings, assign instructors and limit class capacities</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(139,92,246,0.2)] flex items-center gap-1.5"
        >
          <Plus className="w-4.5 h-4.5" /> Create Batch
        </button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-500 italic glass-panel border-dashed border-white/5 rounded-2xl">
            No batches defined yet. Add a class to start assigning students.
          </div>
        ) : (
          batches.map(b => (
            <div key={b.id} className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-violet-500/25 transition-all group relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-zinc-200">{b.name}</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Capacity: {b.capacity} seats</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(b.id)}
                    className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 p-1 bg-rose-500/5 hover:bg-rose-500/10 rounded border border-rose-500/10 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <span className="truncate">{b.timings}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Users className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <span>Instructor: <strong className="text-zinc-200">{b.teacher_name || 'Unassigned'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Direct Workspace Channel</span>
                <span className="font-bold text-violet-400 tracking-wider">Apex Session</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Batch Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white">Create New Batch</h3>
              <button 
                onClick={() => setIsAddOpen(false)} 
                className="text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Batch / Class Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chess Beginners"
                  className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Timings</label>
                <input
                  type="text"
                  required
                  value={timings}
                  onChange={(e) => setTimings(e.target.value)}
                  placeholder="e.g. Mon, Wed, Fri (5:00 PM - 6:00 PM)"
                  className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Assign Instructor</label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none"
                  >
                    <option value="">Choose teacher...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Maximum Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-white/5 px-4.5 py-2.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-5 py-2.5 rounded-lg transition-all"
                >
                  Create Batch
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
