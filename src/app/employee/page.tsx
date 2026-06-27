"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DbClient, Academy, SupportTicket, Profile, Lead } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { 
  Building2, LogOut, CheckCircle2, AlertCircle, RefreshCw, 
  Layers, Users, ShieldCheck, Key, Lock, Search,
  ClipboardList, HelpCircle
} from 'lucide-react';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, logout, showToast } = useClient();
  const [activeSection, setActiveSection] = useState<'overview' | 'leads' | 'academies' | 'tickets' | 'security'>('overview');

  // Database States
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter parameters
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');

  // Password Update States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  const [stats, setStats] = useState({
    myLeadsCount: 0,
    convertedLeadsCount: 0,
    pendingLeadsCount: 0,
    openTicketsCount: 0
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'employee') {
      router.push('/login');
      showToast('Unauthorized access. Redirecting...', 'error');
      return;
    }

    loadEmployeeData();
  }, [user]);

  const loadEmployeeData = async () => {
    try {
      const store = DbClient.getStore();
      setAcademies(store.academies);
      setTickets(store.tickets);

      // Filter leads assigned to this employee
      const allLeads = store.leads || [];
      const myLeads = allLeads.filter(l => l.assigned_to === user?.id);
      setLeads(myLeads);

      const converted = myLeads.filter(l => l.status === 'converted').length;
      const pending = myLeads.filter(l => l.status !== 'converted' && l.status !== 'lost').length;
      const openTicks = store.tickets.filter(t => t.status === 'open').length;

      setStats({
        myLeadsCount: myLeads.length,
        convertedLeadsCount: converted,
        pendingLeadsCount: pending,
        openTicketsCount: openTicks
      });

    } catch (err) {
      showToast('Failed to load employee datasets', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update Lead Status
  const handleUpdateLeadStatus = (leadId: string, status: 'new' | 'contacted' | 'demo_scheduled' | 'converted' | 'lost') => {
    try {
      const store = DbClient.getStore();
      const idx = store.leads.findIndex(l => l.id === leadId);
      if (idx !== -1) {
        store.leads[idx].status = status;
        DbClient.saveStore(store);
        showToast('Lead status updated successfully!', 'success');
        loadEmployeeData();
      }
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  // Update Lead Notes
  const handleUpdateLeadNotes = (leadId: string, notes: string) => {
    try {
      const store = DbClient.getStore();
      const idx = store.leads.findIndex(l => l.id === leadId);
      if (idx !== -1) {
        store.leads[idx].notes = notes;
        DbClient.saveStore(store);
        showToast('Follow-up notes updated!', 'success');
        loadEmployeeData();
      }
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  // Resolve Ticket
  const handleResolveTicket = async (ticketId: string) => {
    try {
      const store = DbClient.getStore();
      const idx = store.tickets.findIndex(t => t.id === ticketId);
      if (idx !== -1) {
        store.tickets[idx] = { ...store.tickets[idx], status: 'resolved' };
        DbClient.saveStore(store);
        showToast('Support ticket marked as resolved!', 'success');
        loadEmployeeData();
      }
    } catch (err) {
      showToast('Ticket action failed', 'error');
    }
  };

  // Password submit change
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill all fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }

    setUpdatingPass(true);
    try {
      const store = DbClient.getStore();
      const currentEmp = store.profiles.find(p => p.id === user.id);
      
      if (currentEmp && currentEmp.password && currentEmp.password !== currentPassword) {
        showToast('Incorrect current password!', 'error');
        setUpdatingPass(false);
        return;
      }

      const success = await DbClient.changePassword(user.id, newPassword);
      if (success) {
        showToast('Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('Failed to change password', 'error');
      }
    } catch (err) {
      showToast('Password update failed', 'error');
    } finally {
      setUpdatingPass(false);
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.academy_name.toLowerCase().includes(leadSearch.toLowerCase()) ||
                          l.contact_name.toLowerCase().includes(leadSearch.toLowerCase()) ||
                          l.email.toLowerCase().includes(leadSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (leadStatusFilter === 'all') return true;
    return l.status === leadStatusFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-50 text-slate-800">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-semibold">Configuring employee staff workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      
      {/* LEFT SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-md shadow-blue-500/20">
            <Layers className="w-4 h-4 fill-white" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">PlatformStaff</span>
            <span className="text-[8px] text-blue-400 font-extrabold uppercase tracking-widest">Employee Console</span>
          </div>
        </div>

        {/* Navigation Sidebar Options */}
        <nav className="flex-1 p-4 space-y-1 text-xs">
          {[
            { id: 'overview', label: 'My Overview', icon: <Layers className="w-4 h-4" /> },
            { id: 'leads', label: 'Assigned Client Leads', icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'academies', label: 'Registered Academies', icon: <Building2 className="w-4 h-4" /> },
            { id: 'tickets', label: 'Support Backlogs', icon: <HelpCircle className="w-4 h-4" /> },
            { id: 'security', label: 'Profile Security', icon: <ShieldCheck className="w-4 h-4" /> }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setActiveSection(opt.id as any)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left font-bold ${
                activeSection === opt.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </nav>

        {/* User profile card & logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="text-xs truncate">
            <span className="text-slate-450 block font-bold text-[9px] uppercase tracking-wider">Staff Account</span>
            <span className="font-bold text-white block truncate mt-0.5">{user?.name}</span>
          </div>
          <button 
            onClick={logout} 
            className="w-full text-rose-500 hover:bg-rose-950/20 border border-rose-900/40 py-2 rounded-xl text-[10px] font-extrabold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide bg-rose-950/10"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out Staff
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT PANEL PANEL */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-5xl mx-auto w-full">
        
        {/* Header Title block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 capitalize tracking-tight">{activeSection.replace('_', ' ')} Panel</h1>
            <p className="text-xs text-slate-500 mt-1">Platform Operations Control Desk &bull; Leads & Tickets</p>
          </div>
          <button 
            onClick={loadEmployeeData} 
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Records
          </button>
        </div>

        {/* SECTION: PLATFORM OVERVIEW */}
        {activeSection === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">My Assigned Leads</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{stats.myLeadsCount}</h3>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-emerald-150 bg-emerald-50 text-emerald-700 shadow-sm">
                <span className="text-[10px] text-emerald-650 font-bold uppercase tracking-wider block">Converted Client Wins</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-2">{stats.convertedLeadsCount} Won</h3>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-orange-150 bg-orange-50 text-orange-700 shadow-sm">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Pipelines</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-orange-800 mt-2">{stats.pendingLeadsCount}</h3>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-amber-150 bg-amber-50 text-amber-700 shadow-sm">
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Support Tickets</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-amber-800 mt-2">{stats.openTicketsCount} Open</h3>
              </div>

            </div>

            {/* Welcome banner */}
            <div className="bg-blue-50 border border-blue-150 p-5 rounded-2xl space-y-2 shadow-sm text-xs">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Welcome back to RemindFlow, {user?.name}!
              </h3>
              <p className="text-slate-500 leading-normal">
                Your profile is initialized as Platform Operations Staff. Access controls permit you to audit registered academy workspaces, update client lead pipeline stages, and resolve backlogged user tickets. Use the sidebar to begin.
              </p>
            </div>
          </div>
        )}

        {/* SECTION: ASSIGNED LEADS */}
        {activeSection === 'leads' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 animate-fade-in text-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Prospect Client Leads Ledger</h3>
              <p className="text-[10px] text-slate-500">Update pipeline stages, log conversation notes, and manage school acquisitions</p>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search by academy name or contact email..."
                  className="bg-transparent text-xs w-full focus:outline-none"
                />
              </div>

              <select
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-bold focus:outline-none text-slate-650"
              >
                <option value="all">All Stages</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="demo_scheduled">Demo Scheduled</option>
                <option value="converted">Won / Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Academy / Contact</th>
                    <th className="p-4">Pipeline Status</th>
                    <th className="p-4">Follow-up Notes / Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400 italic">No assigned leads matched.</td>
                    </tr>
                  ) : (
                    filteredLeads.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <strong className="text-slate-900 block text-xs">{l.academy_name}</strong>
                          <span className="text-[10px] text-slate-500 block">{l.contact_name} &bull; {l.email}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">Mob: {l.mobile}</span>
                        </td>
                        <td className="p-4">
                          <select
                            value={l.status}
                            onChange={(e) => handleUpdateLeadStatus(l.id, e.target.value as any)}
                            className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase border focus:outline-none cursor-pointer ${
                              l.status === 'converted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              l.status === 'lost' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                              l.status === 'demo_scheduled' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="demo_scheduled">Demo Scheduled</option>
                            <option value="converted">Won / Converted</option>
                            <option value="lost">Lost</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <input
                            type="text"
                            defaultValue={l.notes}
                            onBlur={(e) => handleUpdateLeadNotes(l.id, e.target.value)}
                            placeholder="Type notes and click outside to save..."
                            className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs w-full focus:outline-none focus:border-blue-500"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION: REGISTERED ACADEMIES */}
        {activeSection === 'academies' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 animate-fade-in text-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Registered Academies (Read Only)</h3>
              <p className="text-[10px] text-slate-500">Monitor active subscription tiers and credentials across onboarded schools</p>
            </div>

            <div className="space-y-3.5">
              {academies.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">No academies registered yet.</p>
              ) : (
                academies.map(acad => (
                  <div key={acad.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-sm">
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-900 block text-sm">{acad.name}</span>
                      <span className="text-[10px] text-slate-550 block">
                        Address: <strong className="text-slate-700">{acad.address || 'Not set'}</strong> &bull; UPI: <strong className="text-slate-700">{acad.upi_id || 'Not configured'}</strong>
                      </span>
                    </div>
                    <div className="flex gap-2 text-right">
                      <div>
                        <span className="block text-[8px] font-bold text-slate-450 uppercase tracking-wider">Plan Tier</span>
                        <span className="bg-blue-550 text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded border border-blue-600 block mt-0.5">{acad.subscription_plan}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION: SUPPORT TICKETS */}
        {activeSection === 'tickets' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 animate-fade-in text-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Customer Support Ticket Log</h3>
              <p className="text-[10px] text-slate-500">Resolve client requests and reports</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6 col-span-2">No support tickets recorded.</p>
              ) : (
                tickets.map(t => (
                  <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5 text-xs shadow-sm hover:border-slate-350 transition-all relative">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-950 block text-sm">{t.academy_name}</strong>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                        t.status === 'open' ? 'bg-amber-50 text-amber-600 border-amber-150 animate-pulse' : 'bg-slate-200 text-slate-500 border-slate-350'
                      }`}>{t.status.toUpperCase()}</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-150 leading-relaxed font-mono text-[10px] text-slate-650">
                      <strong>{t.title}</strong>: {t.description}
                    </div>

                    {t.status === 'open' && (
                      <button
                        onClick={() => handleResolveTicket(t.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-[10px] flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Ticket
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION: PROFILE SECURITY */}
        {activeSection === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in text-slate-800">
            {/* Profile Info block */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 h-fit">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4.5 h-4.5 text-blue-600" /> Staff Profile
              </h3>
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wider">Employee Name</span>
                  <strong className="text-slate-850 block text-xs mt-0.5">{user?.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wider">Account Level</span>
                  <strong className="text-blue-600 block text-xs mt-0.5 uppercase">Operations Staff</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wider">Login Email</span>
                  <strong className="text-slate-700 block text-xs mt-0.5">{user?.email}</strong>
                </div>
              </div>
            </div>

            {/* Change Password Block */}
            <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Key className="w-4.5 h-4.5 text-blue-600" /> Change Account Password
              </h3>

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-850 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-850 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-850 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updatingPass}
                    className="bg-blue-600 hover:bg-blue-550 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md shadow-blue-500/10"
                  >
                    {updatingPass ? 'Updating password...' : 'Update Account Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
