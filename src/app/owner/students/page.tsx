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

    const allFees = await DbClient.getFees(academy.id);
    setFees(allFees.filter(f => f.student_id === studentId));

    const allAtt = await DbClient.getAttendance(new Date().toISOString().split('T')[0], '');
    const stdAtt = allAtt.filter(a => a.student_id === studentId);
    
    const mockAttRecords: Attendance[] = [
      { id: '1', student_id: studentId, batch_id: 'b1', date: '2026-06-22', status: 'present', marked_by: 'Neelam Sen', created_at: '' },
      { id: '2', student_id: studentId, batch_id: 'b1', date: '2026-06-24', status: 'present', marked_by: 'Neelam Sen', created_at: '' },
      { id: '3', student_id: studentId, batch_id: 'b1', date: '2026-06-19', status: 'absent', marked_by: 'Neelam Sen', created_at: '' }
    ];
    setAttendance(mockAttRecords);

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

      await DbClient.generateMonthlyFees(academy.id);

      showToast(`${name} added to student list!`, 'success');
      setIsAddOpen(false);
      
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
    <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col text-slate-800">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Student Management</h1>
          <p className="text-xs text-slate-500">Add, view billing profiles, logs, and notes timeline</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5"
        >
          <Plus className="w-4.5 h-4.5" /> Enroll Student
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        
        {/* Left Side: Students List */}
        <div className="glass-panel rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden h-full">
          {/* Search bar */}
          <div className="p-4 border-b border-slate-100 relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name, parent or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250/60 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* List Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
            {filteredStudents.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-10">No students found.</p>
            ) : (
              filteredStudents.map(s => {
                const isSelected = selectedStudent?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50/50 ${
                      isSelected ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-800">{s.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                        <span>Parent: {s.parent_name}</span>
                        <span>&bull;</span>
                        <span className="text-blue-600 font-medium">{s.batch_name || 'No Batch'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                        s.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {s.status.toUpperCase()}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Profile Details (2/3 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col h-full shadow-sm">
          {selectedStudent ? (
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Profile Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-150 flex items-center justify-center text-blue-600 font-extrabold text-lg shadow-sm">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base sm:text-lg text-slate-900">{selectedStudent.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>Joined: {selectedStudent.joining_date}</span>
                      <span>&bull;</span>
                      <span className="text-blue-600 font-semibold">{selectedStudent.batch_name || 'Batch Unassigned'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(selectedStudent.id)}
                    className="p-2 text-rose-600 hover:text-rose-500 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-xl transition-all"
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
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-600" /> Personal details
                    </h3>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Parent / Guardian:</span>
                        <span className="text-slate-800 font-semibold">{selectedStudent.parent_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mobile Phone:</span>
                        <span className="text-slate-800 font-semibold">{selectedStudent.mobile}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">WhatsApp Alert:</span>
                        <span className="text-slate-800 font-semibold">{selectedStudent.whatsapp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email Address:</span>
                        <span className="text-slate-800 font-semibold truncate max-w-[150px]">{selectedStudent.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fee profile details */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-600" /> Billing Settings
                    </h3>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Monthly Tuition Fee:</span>
                        <span className="text-emerald-600 font-bold">₹{selectedStudent.monthly_fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Invoice Due Date:</span>
                        <span className="text-slate-800 font-semibold">Day {selectedStudent.due_date} of month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Billing Cycle:</span>
                        <span className="text-slate-800 font-semibold">Monthly Autogen</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current Status:</span>
                        <span className="text-emerald-600 font-bold">Active</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Address & Notes */}
                {(selectedStudent.address || selectedStudent.notes) && (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-3">
                    {selectedStudent.address && (
                      <div className="flex gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <span className="text-slate-500 font-bold block mb-0.5">Address:</span>
                          <span className="text-slate-700">{selectedStudent.address}</span>
                        </div>
                      </div>
                    )}
                    {selectedStudent.notes && (
                      <div className="flex gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <span className="text-slate-500 font-bold block mb-0.5">Academic Notes:</span>
                          <span className="text-slate-700">{selectedStudent.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Invoices & Payments ledger */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4.5 h-4.5 text-blue-600" /> Invoice Payment Ledger
                  </h3>
                  
                  <div className="space-y-2">
                    {fees.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">No invoices generated yet.</p>
                    ) : (
                      fees.map(f => (
                        <div key={f.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <div className="font-bold text-slate-800">Tuition Fee - {new Date(f.due_date).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                            <div className="text-[10px] text-slate-500 mt-1">Due: {f.due_date} &bull; Paid: ₹{f.paid_amount}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-slate-800">₹{f.amount}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                              f.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              f.status === 'overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                              'bg-amber-50 text-amber-600 border-amber-100'
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
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4.5 h-4.5 text-blue-600" /> Recent Attendance
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {attendance.map((a, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs space-y-1">
                        <div className="text-[10px] text-slate-400">{a.date}</div>
                        <div className={`font-bold capitalize ${
                          a.status === 'present' ? 'text-emerald-600' : a.status === 'absent' ? 'text-rose-600' : a.status === 'online' ? 'text-blue-600' : 'text-amber-600'
                        }`}>
                          {a.status}
                        </div>
                        <div className="text-[8px] text-slate-500 truncate">{a.marked_by}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. WhatsApp logs list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4.5 h-4.5 text-blue-600" /> WhatsApp Automated Delivery Outbox
                  </h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {waLogs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2 text-center">No messages sent to this student yet.</p>
                    ) : (
                      waLogs.map(l => (
                        <div key={l.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-800 capitalize">{l.type.replace('_', ' ')}</span>
                            <div className="text-[9px] text-slate-450 mt-0.5">To: {l.sent_to} &bull; {new Date(l.sent_at).toLocaleString()}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                            l.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
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
              <User className="w-12 h-12 text-slate-300" />
              <p className="text-sm text-slate-500">Select a student profile to view logs and invoicing ledger.</p>
            </div>
          )}
        </div>

      </div>

      {/* Add Student Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up text-slate-800">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">Enroll New Student</h3>
              <button 
                onClick={() => setIsAddOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Student Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kabir Singh"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Parent Name</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Sanjay Singh"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9634567812"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Same as mobile"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Assign Batch</label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Monthly Tuition Fee (₹)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Invoice Due Day of Month</label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Private notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Need special assistance..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 px-4.5 py-2.5 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg transition-all shadow-sm"
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
