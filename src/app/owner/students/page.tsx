"use client";

import React, { useState, useEffect } from 'react';
import { DbClient, Student, Batch, Fee, Attendance, WhatsAppLog } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { 
  Users, Plus, Search, ChevronRight, User, Phone, Calendar, 
  MapPin, MessageSquare, CreditCard, Clock, FileText, CheckCircle, Trash2, Edit 
} from 'lucide-react';

export default function StudentsPage() {
  const { showToast } = useClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // History data for selected student
  const [fees, setFees] = useState<Fee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [waLogs, setWaLogs] = useState<WhatsAppLog[]>([]);

  // Add student form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [parentName, setParentName] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [batchId, setBatchId] = useState('');
  const [fee, setFee] = useState('1500');
  const [dueDate, setDueDate] = useState('5');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentHistory(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadData = async () => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    const stds = await DbClient.getStudents(academy.id);
    setStudents(stds);
    
    const btchs = await DbClient.getBatches(academy.id);
    setBatches(btchs);

    if (stds.length > 0 && !selectedStudent) {
      setSelectedStudent(stds[0]);
    }
  };

  const loadStudentHistory = async (studentId: string) => {
    const academy = await DbClient.getAcademy();
    if (!academy) return;

    // Load student fees
    const allFees = await DbClient.getFees(academy.id);
    setFees(allFees.filter(f => f.student_id === studentId));

    // Load attendance
    // Quick mockup for attendance
    const allAtt = await DbClient.getAttendance(new Date().toISOString().split('T')[0], '');
    const stdAtt = allAtt.filter(a => a.student_id === studentId);
    
    // Create random mock attendance history for display
    const mockAttRecords: Attendance[] = [
      { id: '1', student_id: studentId, batch_id: 'b1', date: '2026-06-22', status: 'present', marked_by: 'Neelam Sen', created_at: '' },
      { id: '2', student_id: studentId, batch_id: 'b1', date: '2026-06-24', status: 'present', marked_by: 'Neelam Sen', created_at: '' },
      { id: '3', student_id: studentId, batch_id: 'b1', date: '2026-06-19', status: 'absent', marked_by: 'Neelam Sen', created_at: '' }
    ];
    setAttendance(mockAttRecords);

    // Load whatsapp outbox log
    const allLogs = await DbClient.getWhatsAppLogs(academy.id);
    setWaLogs(allLogs.filter(l => l.student_id === studentId));
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) {
      showToast('Name and Mobile Number are required', 'error');
      return;
    }

    const academy = await DbClient.getAcademy();
    if (!academy) return;

    try {
      const added = await DbClient.addStudent(academy.id, {
        name,
        parent_name: parentName,
        mobile,
        whatsapp: whatsapp || mobile,
        email,
        address,
        batch_id: batchId || undefined,
        monthly_fee: Number(fee) || 1500,
        due_date: Number(dueDate) || 5,
        joining_date: new Date().toISOString().split('T')[0],
        status: 'active',
        notes
      });

      // generate initial fee for this month for the new student
      await DbClient.generateMonthlyFees(academy.id);

      showToast(`${name} added to student list!`, 'success');
      setIsAddOpen(false);
      
      // Reset
      setName('');
      setParentName('');
      setMobile('');
      setWhatsapp('');
      setEmail('');
      setAddress('');
      setBatchId('');
      setFee('1500');
      setDueDate('5');
      setNotes('');

      loadData();
    } catch (err) {
      showToast('Failed to add student', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this student profile?")) {
      await DbClient.deleteStudent(id);
      showToast('Student profile deleted', 'success');
      setSelectedStudent(null);
      loadData();
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.mobile.includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Student Management</h1>
          <p className="text-xs text-zinc-400">Add, view billing profiles, logs, and notes timeline</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(139,92,246,0.2)] flex items-center gap-1.5"
        >
          <Plus className="w-4.5 h-4.5" /> Enroll Student
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        
        {/* Left Side: Students List */}
        <div className="glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden h-full">
          {/* Search bar */}
          <div className="p-4 border-b border-white/5 relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name, parent or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>

          {/* List Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredStudents.length === 0 ? (
              <p className="text-xs text-zinc-500 italic text-center py-10">No students found.</p>
            ) : (
              filteredStudents.map(s => {
                const isSelected = selectedStudent?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-zinc-900/30 ${
                      isSelected ? 'bg-violet-600/10 border-l-2 border-violet-500' : ''
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-zinc-200">{s.name}</div>
                      <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1.5">
                        <span>Parent: {s.parent_name}</span>
                        <span>&bull;</span>
                        <span className="text-violet-400">{s.batch_name || 'No Batch'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                        s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {s.status.toUpperCase()}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Profile Details (2/3 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col h-full bg-zinc-950/20">
          {selectedStudent ? (
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Profile Header */}
              <div className="p-6 bg-zinc-950/70 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-400 font-extrabold text-lg shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base sm:text-lg text-white">{selectedStudent.name}</h2>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <span>Joined: {selectedStudent.joining_date}</span>
                      <span>&bull;</span>
                      <span className="text-violet-400 font-semibold">{selectedStudent.batch_name || 'Batch Unassigned'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(selectedStudent.id)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Core Profile Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Personal info */}
                  <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 space-y-3">
                    <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-violet-400" /> Personal details
                    </h3>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Parent / Guardian:</span>
                        <span className="text-zinc-200 font-medium">{selectedStudent.parent_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Mobile Phone:</span>
                        <span className="text-zinc-200 font-medium">{selectedStudent.mobile}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">WhatsApp Alert:</span>
                        <span className="text-zinc-200 font-medium">{selectedStudent.whatsapp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Email Address:</span>
                        <span className="text-zinc-200 font-medium truncate max-w-[150px]">{selectedStudent.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fee profile details */}
                  <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 space-y-3">
                    <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-violet-400" /> Billing Settings
                    </h3>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Monthly Tuition Fee:</span>
                        <span className="text-emerald-400 font-bold">₹{selectedStudent.monthly_fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Invoice Due Date:</span>
                        <span className="text-zinc-200 font-medium">Day {selectedStudent.due_date} of month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Billing Cycle:</span>
                        <span className="text-zinc-200 font-medium">Monthly Autogen</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Current Status:</span>
                        <span className="text-emerald-400 font-bold">Active</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Address & Notes */}
                {(selectedStudent.address || selectedStudent.notes) && (
                  <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-xl text-xs space-y-3">
                    {selectedStudent.address && (
                      <div className="flex gap-2">
                        <MapPin className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                        <div>
                          <span className="text-zinc-500 font-bold block mb-0.5">Address:</span>
                          <span className="text-zinc-300">{selectedStudent.address}</span>
                        </div>
                      </div>
                    )}
                    {selectedStudent.notes && (
                      <div className="flex gap-2">
                        <FileText className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                        <div>
                          <span className="text-zinc-500 font-bold block mb-0.5">Academic/Coaching Notes:</span>
                          <span className="text-zinc-300">{selectedStudent.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Invoices & Payments ledger */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4.5 h-4.5 text-violet-400" /> Invoice Payment Ledger
                  </h3>
                  
                  <div className="space-y-2">
                    {fees.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic py-2">No invoices generated yet.</p>
                    ) : (
                      fees.map(f => (
                        <div key={f.id} className="flex justify-between items-center bg-zinc-950/60 p-3 rounded-xl border border-white/5 text-xs">
                          <div>
                            <div className="font-bold text-zinc-200">Tuition Fee - {new Date(f.due_date).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">Due: {f.due_date} &bull; Paid: ₹{f.paid_amount}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-zinc-300">₹{f.amount}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                              f.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                              f.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {f.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Attendance logs list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4.5 h-4.5 text-violet-400" /> Recent Attendance
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {attendance.map((a, i) => (
                      <div key={i} className="p-3 bg-zinc-950/60 rounded-xl border border-white/5 text-center text-xs space-y-1">
                        <div className="text-[10px] text-zinc-500">{a.date}</div>
                        <div className={`font-bold capitalize ${
                          a.status === 'present' ? 'text-emerald-400' : a.status === 'absent' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {a.status}
                        </div>
                        <div className="text-[8px] text-zinc-600 truncate">{a.marked_by}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. WhatsApp logs list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4.5 h-4.5 text-violet-400" /> WhatsApp Automated Delivery Outbox
                  </h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {waLogs.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic py-2 text-center">No messages sent to this student yet.</p>
                    ) : (
                      waLogs.map(l => (
                        <div key={l.id} className="p-2.5 rounded-lg bg-zinc-950/40 border border-white/5 text-[11px] flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-zinc-200 capitalize">{l.type.replace('_', ' ')}</span>
                            <div className="text-[9px] text-zinc-500 mt-0.5">To: {l.sent_to} &bull; {new Date(l.sent_at).toLocaleString()}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                            l.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {l.status.toUpperCase()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-10 gap-3">
              <User className="w-12 h-12 text-zinc-700" />
              <p className="text-sm text-zinc-500">Select a student profile to view logs and invoicing ledger.</p>
            </div>
          )}
        </div>

      </div>

      {/* Add Student Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white">Enroll New Student</h3>
              <button 
                onClick={() => setIsAddOpen(false)} 
                className="text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Student Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kabir Singh"
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Parent Name</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Sanjay Singh"
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9634567812"
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">WhatsApp Alerts Number</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Same as mobile"
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Assign Batch</label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Monthly Tuition Fee (₹)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Invoice Due Day of Month</label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street details..."
                  className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Private notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Need special assistance..."
                  className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none"
                />
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
                  Enroll Student
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
