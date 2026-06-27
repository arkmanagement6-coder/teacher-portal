"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DbClient, Academy, SupportTicket, Profile, Lead } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { 
  Building2, LogOut, CheckCircle2, AlertCircle, RefreshCw, 
  Layers, Users, ShieldCheck, Key, Lock, Eye, EyeOff, Search,
  Plus, Trash2, Edit3, ClipboardList, Briefcase, HelpCircle
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user, logout, showToast } = useClient();
  const [activeSection, setActiveSection] = useState<'overview' | 'academies' | 'users' | 'employees' | 'leads' | 'tickets' | 'security'>('overview');

  // Database States
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Visibility Toggles
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  // Search & Filter parameters
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'teacher'>('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');

  // Modals States
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empMobile, setEmpMobile] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empPermissions, setEmpPermissions] = useState<string[]>(['manage_leads', 'resolve_tickets']);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadAcadName, setLeadAcadName] = useState('');
  const [leadContactName, setLeadContactName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadMobile, setLeadMobile] = useState('');
  const [leadStatus, setLeadStatus] = useState<'new' | 'contacted' | 'demo_scheduled' | 'converted' | 'lost'>('new');
  const [leadNotes, setLeadNotes] = useState('');
  const [leadAssignedTo, setLeadAssignedTo] = useState('');

  // Password Update States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  const [stats, setStats] = useState({
    academiesCount: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    supportTicketsCount: 0,
    leadsCount: 0
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'super_admin') {
      router.push('/login');
      showToast('Unauthorized access. Redirecting...', 'error');
      return;
    }

    loadSuperData();
  }, [user]);

  const loadSuperData = async () => {
    try {
      const store = DbClient.getStore();
      setAcademies(store.academies);
      setTickets(store.tickets);
      setProfiles(store.profiles);
      setLeads(store.leads || []);

      let rev = 0;
      let activeSubs = 0;

      store.academies.forEach(a => {
        if (a.subscription_status === 'active') {
          activeSubs++;
          rev += a.subscription_plan === 'enterprise' ? 2999 : a.subscription_plan === 'growth' ? 1499 : 0;
        }
      });

      setStats({
        academiesCount: store.academies.length,
        totalRevenue: rev,
        activeSubscriptions: activeSubs,
        supportTicketsCount: store.tickets.filter(t => t.status === 'open').length,
        leadsCount: (store.leads || []).length
      });

    } catch (err) {
      showToast('Failed to load super admin datasets', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Override Academy Plan
  const handleChangePlan = async (academyId: string, plan: 'trial' | 'growth' | 'enterprise', status: 'active' | 'cancelled') => {
    try {
      const store = DbClient.getStore();
      const idx = store.academies.findIndex(a => a.id === academyId);
      if (idx !== -1) {
        store.academies[idx] = {
          ...store.academies[idx],
          subscription_plan: plan,
          subscription_status: status
        };
        DbClient.saveStore(store);
        showToast('Academy subscription parameters updated!', 'success');
        loadSuperData();
      }
    } catch (err) {
      showToast('Plan update action failed', 'error');
    }
  };

  // Resolve ticket
  const handleResolveTicket = async (ticketId: string) => {
    try {
      const store = DbClient.getStore();
      const idx = store.tickets.findIndex(t => t.id === ticketId);
      if (idx !== -1) {
        store.tickets[idx] = { ...store.tickets[idx], status: 'resolved' };
        DbClient.saveStore(store);
        showToast('Support ticket marked as resolved!', 'success');
        loadSuperData();
      }
    } catch (err) {
      showToast('Ticket action failed', 'error');
    }
  };

  // Add Employee
  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail || !empPassword) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      const store = DbClient.getStore();
      // Check if email already exists
      if (store.profiles.some(p => p.email.toLowerCase() === empEmail.toLowerCase())) {
        showToast('Email address already registered', 'error');
        return;
      }

      const newEmp: Profile = {
        id: 'emp-' + Math.random().toString(36).substr(2, 9),
        name: empName,
        role: 'employee',
        email: empEmail,
        mobile: empMobile,
        password: empPassword,
        permissions: empPermissions
      };

      store.profiles.push(newEmp);
      DbClient.saveStore(store);
      showToast('Employee account created successfully!', 'success');
      
      // Reset forms
      setEmpName('');
      setEmpEmail('');
      setEmpMobile('');
      setEmpPassword('');
      setEmpPermissions(['manage_leads', 'resolve_tickets']);
      setIsEmployeeModalOpen(false);
      loadSuperData();
    } catch (err) {
      showToast('Failed to create employee profile', 'error');
    }
  };

  // Delete Employee/Profile
  const handleDeleteProfile = (profileId: string) => {
    if (profileId === user?.id) {
      showToast('Cannot delete yourself!', 'error');
      return;
    }
    try {
      const store = DbClient.getStore();
      store.profiles = store.profiles.filter(p => p.id !== profileId);
      DbClient.saveStore(store);
      showToast('Account profile removed', 'success');
      loadSuperData();
    } catch (err) {
      showToast('Delete operation failed', 'error');
    }
  };

  // Add/Modify Lead
  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadAcadName || !leadContactName || !leadMobile) {
      showToast('Please fill in required lead fields', 'error');
      return;
    }

    try {
      const store = DbClient.getStore();
      const newLead: Lead = {
        id: 'lead-' + Math.random().toString(36).substr(2, 9),
        academy_name: leadAcadName,
        contact_name: leadContactName,
        email: leadEmail,
        mobile: leadMobile,
        status: leadStatus,
        notes: leadNotes,
        assigned_to: leadAssignedTo || undefined,
        created_at: new Date().toISOString()
      };

      if (!store.leads) store.leads = [];
      store.leads.push(newLead);
      DbClient.saveStore(store);
      showToast('New client lead logged successfully!', 'success');

      // Reset
      setLeadAcadName('');
      setLeadContactName('');
      setLeadEmail('');
      setLeadMobile('');
      setLeadStatus('new');
      setLeadNotes('');
      setLeadAssignedTo('');
      setIsLeadModalOpen(false);
      loadSuperData();
    } catch (err) {
      showToast('Failed to log lead', 'error');
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
        showToast('Lead status updated!', 'success');
        loadSuperData();
      }
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  // Delete Lead
  const handleDeleteLead = (leadId: string) => {
    try {
      const store = DbClient.getStore();
      store.leads = store.leads.filter(l => l.id !== leadId);
      DbClient.saveStore(store);
      showToast('Lead deleted successfully', 'success');
      loadSuperData();
    } catch (err) {
      showToast('Failed to delete lead', 'error');
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
      const currentAdmin = store.profiles.find(p => p.id === user.id);
      
      if (currentAdmin && currentAdmin.password && currentAdmin.password !== currentPassword) {
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

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Filters
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          p.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (p.mobile && p.mobile.includes(userSearch));
    if (!matchesSearch) return false;
    
    if (roleFilter === 'all') return p.role === 'owner' || p.role === 'teacher';
    return p.role === roleFilter;
  });

  const platformEmployees = profiles.filter(p => p.role === 'employee');

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.academy_name.toLowerCase().includes(leadSearch.toLowerCase()) ||
                          l.contact_name.toLowerCase().includes(leadSearch.toLowerCase()) ||
                          l.email.toLowerCase().includes(leadSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (leadStatusFilter === 'all') return true;
    return l.status === leadStatusFilter;
  });

  const getEmployeeName = (empId?: string) => {
    if (!empId) return 'Unassigned';
    const emp = platformEmployees.find(e => e.id === empId);
    return emp ? emp.name : 'Unknown Employee';
  };

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
            <span className="font-extrabold text-sm tracking-tight text-white block">PlatformControl</span>
            <span className="text-[8px] text-amber-500 font-extrabold uppercase tracking-widest">SUPER ADMINISTRATOR</span>
          </div>
        </div>

        {/* Navigation Sidebar Options */}
        <nav className="flex-1 p-4 space-y-1 text-xs">
          {[
            { id: 'overview', label: 'Platform Overview', icon: <Layers className="w-4 h-4" /> },
            { id: 'academies', label: 'Academy Workspaces', icon: <Building2 className="w-4 h-4" /> },
            { id: 'users', label: 'Instructors & Owners', icon: <Users className="w-4 h-4" /> },
            { id: 'employees', label: 'Platform Employees', icon: <Briefcase className="w-4 h-4" /> },
            { id: 'leads', label: 'B2B Client Leads', icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'tickets', label: 'Support Ticket Logs', icon: <HelpCircle className="w-4 h-4" /> },
            { id: 'security', label: 'Admin Security', icon: <ShieldCheck className="w-4 h-4" /> }
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
            <span className="text-slate-450 block font-bold text-[9px] uppercase tracking-wider">Logged In</span>
            <span className="font-bold text-white block truncate mt-0.5">{user?.name}</span>
          </div>
          <button 
            onClick={logout} 
            className="w-full text-rose-500 hover:bg-rose-950/20 border border-rose-900/40 py-2 rounded-xl text-[10px] font-extrabold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide bg-rose-950/10"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out Operator
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT PANEL PANEL */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-5xl mx-auto w-full">
        
        {/* Header Title block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 capitalize tracking-tight">{activeSection.replace('_', ' ')} Manager</h1>
            <p className="text-xs text-slate-500 mt-1">Super Operations Control Console Panel &bull; Live state indicators</p>
          </div>
          <button 
            onClick={loadSuperData} 
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
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Academies Onboarded</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{stats.academiesCount}</h3>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-emerald-150 bg-emerald-50 text-emerald-700 shadow-sm">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Global Platform Rev</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-2">₹{stats.totalRevenue}</h3>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Subscriptions</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{stats.activeSubscriptions}</h3>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-amber-150 bg-amber-50 text-amber-700 shadow-sm">
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Support Backlog</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-amber-800 mt-2">{stats.supportTicketsCount} Open</h3>
              </div>

            </div>

            {/* Quick overview layout details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <h4 className="font-extrabold text-xs text-slate-950 uppercase tracking-wider">Prospect Lead Pipeline Overview</h4>
                <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold text-slate-650">
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="block text-slate-800 font-extrabold text-base">{leads.filter(l => l.status === 'new').length}</span>
                    New
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="block text-slate-800 font-extrabold text-base">{leads.filter(l => l.status === 'contacted').length}</span>
                    Contacted
                  </div>
                  <div className="p-2 bg-amber-50 border border-amber-100 text-amber-700 rounded-lg">
                    <span className="block font-extrabold text-base">{leads.filter(l => l.status === 'demo_scheduled').length}</span>
                    Demo
                  </div>
                  <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg">
                    <span className="block font-extrabold text-base">{leads.filter(l => l.status === 'converted').length}</span>
                    Won
                  </div>
                  <div className="p-2 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg">
                    <span className="block font-extrabold text-base">{leads.filter(l => l.status === 'lost').length}</span>
                    Lost
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 border border-slate-200 rounded-2xl flex flex-col justify-between shadow-sm">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-950 uppercase tracking-wider">Quick Actions Shortcuts</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Jump to direct workspace control overrides panels</p>
                </div>
                <div className="flex gap-2 mt-4 text-xs font-bold">
                  <button onClick={() => setActiveSection('leads')} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 px-4 py-2 rounded-xl flex-1 text-center transition-colors">
                    Add Lead
                  </button>
                  <button onClick={() => setActiveSection('employees')} className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl flex-1 text-center transition-colors">
                    Hire Employee
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: ACADEMY WORKSPACES */}
        {activeSection === 'academies' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 animate-fade-in text-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Connected Academies Workspaces</h3>
              <p className="text-[10px] text-slate-500">Monitor active subscription tiers, credentials and override plans</p>
            </div>

            <div className="space-y-3.5">
              {academies.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">No academies registered yet.</p>
              ) : (
                academies.map(acad => (
                  <div key={acad.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100/60 transition-all shadow-sm">
                    <div className="space-y-1 pr-4">
                      <span className="font-extrabold text-slate-900 block text-sm">{acad.name}</span>
                      <span className="text-[10px] text-slate-550 block">
                        Address: <strong className="text-slate-700">{acad.address || 'Not set'}</strong> &bull; UPI ID: <strong className="text-slate-700">{acad.upi_id || 'Not configured'}</strong>
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Current plan: <strong className="text-blue-600 uppercase">{acad.subscription_plan}</strong> &bull; Status: <span className={`font-bold uppercase ${acad.subscription_status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>{acad.subscription_status}</span>
                      </span>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      
                      {acad.subscription_plan === 'trial' ? (
                        <button
                          onClick={() => handleChangePlan(acad.id, 'growth', 'active')}
                          className="bg-blue-600 hover:bg-blue-550 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-colors"
                        >
                          Upgrade Growth
                        </button>
                      ) : (
                        <button
                          onClick={() => handleChangePlan(acad.id, 'trial', 'active')}
                          className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm transition-colors"
                        >
                          Downgrade Trial
                        </button>
                      )}

                      <button
                        onClick={() => handleChangePlan(acad.id, acad.subscription_plan, acad.subscription_status === 'active' ? 'cancelled' : 'active')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border shadow-sm transition-colors ${
                          acad.subscription_status === 'active' 
                            ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                        }`}
                      >
                        {acad.subscription_status === 'active' ? 'Cancel Sub' : 'Activate Sub'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION: INSTRUCTORS & OWNERS */}
        {activeSection === 'users' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 animate-fade-in text-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Workspace Member Accounts</h3>
                <p className="text-[10px] text-slate-500">Audit registered profile logins, emails and system passwords</p>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-full sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email or phone..."
                    className="bg-transparent text-xs w-full focus:outline-none placeholder-slate-400"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-650 focus:none"
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Owners Only</option>
                  <option value="teacher">Teachers Only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Account Password</th>
                    <th className="p-4 text-right">Removal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 italic">No user accounts matched.</td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{p.name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border capitalize ${
                            p.role === 'owner' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-650 border-slate-200'
                          }`}>
                            {p.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{p.email}</div>
                          {p.mobile && <div className="text-[10px] text-slate-400 mt-0.5">Phone: {p.mobile}</div>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {showPasswords[p.id] ? (p.password || 'password123') : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(p.id)}
                              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                              {showPasswords[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteProfile(p.id)}
                            className="text-rose-600 hover:text-rose-800 p-1.5 rounded bg-rose-50 hover:bg-rose-100 transition-all border border-rose-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION: PLATFORM EMPLOYEES */}
        {activeSection === 'employees' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 animate-fade-in text-slate-800">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Manage Platform Employees</h3>
                <p className="text-[10px] text-slate-500">Hire operator staff, grant permissions, and configure console access</p>
              </div>
              <button
                onClick={() => setIsEmployeeModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/10"
              >
                <Plus className="w-4 h-4" /> Add Employee Account
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {platformEmployees.length === 0 ? (
                <p className="text-xs text-slate-450 italic py-6 text-center col-span-2">No employees hired yet.</p>
              ) : (
                platformEmployees.map(emp => (
                  <div key={emp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5 text-xs shadow-sm hover:border-slate-350 transition-all relative">
                    <button 
                      onClick={() => handleDeleteProfile(emp.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-rose-650"
                      title="Terminate Employee Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-1 pr-6">
                      <strong className="text-slate-900 block text-sm">{emp.name}</strong>
                      <span className="text-[9px] text-blue-600 font-extrabold uppercase tracking-wider bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full inline-block">PLATFORM STAFF</span>
                    </div>

                    <div className="space-y-1 text-slate-650 leading-normal">
                      <div>Email: <strong>{emp.email}</strong></div>
                      <div>Mobile: <strong>{emp.mobile || 'Not provided'}</strong></div>
                      <div>Password: <span className="font-mono bg-slate-200/50 px-1 rounded">{emp.password || 'password123'}</span></div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/60">
                      <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-1">Access Permissions:</span>
                      <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                        {(emp.permissions || []).map((perm, i) => (
                          <span key={i} className="px-2 py-0.5 rounded border bg-slate-200/65 text-slate-700 border-slate-300">
                            {perm.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION: B2B CLIENT LEADS */}
        {activeSection === 'leads' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 animate-fade-in text-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">SaaS Client Leads Ledger</h3>
                <p className="text-[10px] text-slate-500">Acquire prospective academy clients, track pipeline stages, and assign leads to staff</p>
              </div>

              <button
                onClick={() => setIsLeadModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/10"
              >
                <Plus className="w-4 h-4" /> Add Prospect Lead
              </button>
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
                <option value="new">New / Untouched</option>
                <option value="contacted">Contacted</option>
                <option value="demo_scheduled">Demo Scheduled</option>
                <option value="converted">Won / Converted</option>
                <option value="lost">Lost / Dead</option>
              </select>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Academy / Contact</th>
                    <th className="p-4">Status / Stage</th>
                    <th className="p-4">Assigned To</th>
                    <th className="p-4">Notes</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 italic">No prospective client leads found.</td>
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
                            <option value="lost">Lost / Dead</option>
                          </select>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">
                          {getEmployeeName(l.assigned_to)}
                        </td>
                        <td className="p-4 text-slate-550 max-w-xs truncate" title={l.notes}>
                          {l.notes || <span className="italic text-slate-350">No notes recorded</span>}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteLead(l.id)}
                            className="text-slate-450 hover:text-rose-600 p-1 hover:bg-slate-100 rounded"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION: SUPPORT TICKETS */}
        {activeSection === 'tickets' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 animate-fade-in text-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Customer Support Ticket Log</h3>
              <p className="text-[10px] text-slate-500">Audit customer feedback logs, ticket descriptions and handle settlements</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6 col-span-2">No support tickets recorded.</p>
              ) : (
                tickets.map(t => (
                  <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5 text-xs shadow-sm hover:border-slate-300 transition-all relative">
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

        {/* SECTION: ADMIN SECURITY */}
        {activeSection === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in text-slate-800">
            {/* Profile Info block */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 h-fit">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4.5 h-4.5 text-blue-600" /> Admin Profile
              </h3>
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wider">Manager Name</span>
                  <strong className="text-slate-850 block text-xs mt-0.5">{user?.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wider">Account Level</span>
                  <strong className="text-amber-700 block text-xs mt-0.5 uppercase">Super Administrator</strong>
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

      {/* MODAL: ADD EMPLOYEE */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up text-slate-800 text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Add Platform Employee</h3>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-slate-450 hover:text-slate-700 font-bold">Cancel</button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Employee Name</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. Rohan Verma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none text-slate-800 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="staff@platform.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none text-slate-800 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={empMobile}
                    onChange={(e) => setEmpMobile(e.target.value)}
                    placeholder="9999988888"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none text-slate-800 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none text-slate-800 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Access Permissions</label>
                <div className="space-y-2 mt-2 font-bold text-slate-650">
                  {[
                    { id: 'manage_leads', label: 'Manage B2B Leads' },
                    { id: 'view_academies', label: 'View Academies Workspaces' },
                    { id: 'resolve_tickets', label: 'Resolve Client Tickets' }
                  ].map(p => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={empPermissions.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEmpPermissions([...empPermissions, p.id]);
                          } else {
                            setEmpPermissions(empPermissions.filter(x => x !== p.id));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-550 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-500/10"
                >
                  Create Employee Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LEAD */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up text-slate-800 text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Add B2B Client Lead</h3>
              <button onClick={() => setIsLeadModalOpen(false)} className="text-slate-450 hover:text-slate-700 font-bold">Cancel</button>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Academy / School Name</label>
                <input
                  type="text"
                  required
                  value={leadAcadName}
                  onChange={(e) => setLeadAcadName(e.target.value)}
                  placeholder="e.g. Bright Kids Play School"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none text-slate-800 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Name</label>
                <input
                  type="text"
                  required
                  value={leadContactName}
                  onChange={(e) => setLeadContactName(e.target.value)}
                  placeholder="e.g. Aditi Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none text-slate-800 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="aditi@domain.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none text-slate-800 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={leadMobile}
                    onChange={(e) => setLeadMobile(e.target.value)}
                    placeholder="9876543220"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none text-slate-800 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Initial Stage Status</label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none text-slate-850 font-bold"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="demo_scheduled">Demo Scheduled</option>
                    <option value="converted">Won / Converted</option>
                    <option value="lost">Lost / Dead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assign To Staff</label>
                  <select
                    value={leadAssignedTo}
                    onChange={(e) => setLeadAssignedTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none text-slate-850 font-bold"
                  >
                    <option value="">Unassigned</option>
                    {platformEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Follow-up Notes / Comments</label>
                <textarea
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="Enter comments about this client lead..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none text-slate-800 focus:border-blue-500 h-20 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-550 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-500/10"
                >
                  Log Prospect Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
