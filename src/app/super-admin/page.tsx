"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DbClient, Academy, SupportTicket, Profile } from '@/lib/db';
import { useClient } from '@/components/client-provider';
import { 
  Building2, LogOut, CheckCircle, AlertCircle, RefreshCw, 
  Layers, Users, ShieldCheck, Key, Lock, Eye, EyeOff, Search 
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user, logout, showToast } = useClient();
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'security'>('overview');

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'teacher'>('all');
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  const [stats, setStats] = useState({
    academiesCount: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    supportTicketsCount: 0
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
      const acads = await DbClient.getAcademy() ? await DbClient.getStore().academies : [];
      // Fetch directly via our new getProfiles or fallback
      const store = DbClient.getStore();
      const allAcademies = store.academies;
      setAcademies(allAcademies);

      const ticks = store.tickets;
      setTickets(ticks);

      const allProfiles = store.profiles;
      setProfiles(allProfiles);

      let rev = 0;
      let activeSubs = 0;

      allAcademies.forEach(a => {
        if (a.subscription_status === 'active') {
          activeSubs++;
          rev += a.subscription_plan === 'enterprise' ? 2999 : a.subscription_plan === 'growth' ? 1499 : 0;
        }
      });

      setStats({
        academiesCount: allAcademies.length,
        totalRevenue: rev,
        activeSubscriptions: activeSubs,
        supportTicketsCount: ticks.filter(t => t.status === 'open').length
      });

    } catch (err) {
      showToast('Failed to load super admin datasets', 'error');
    } finally {
      setLoading(false);
    }
  };

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
        // Update database store
        DbClient.saveStore(store);
        showToast('Academy subscription parameters updated!', 'success');
        loadSuperData();
      }
    } catch (err) {
      showToast('Plan update action failed', 'error');
    }
  };

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
      // Read current store profile password check
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

  const getAssociatedAcademyNameAndPlan = (prof: Profile) => {
    if (prof.role === 'super_admin') return 'Global System Manager';
    
    // Find academy where owner matches, or defaults to first one for teachers
    if (prof.role === 'owner') {
      const acad = academies.find(a => a.owner_id === prof.id) || academies[0];
      return acad ? `${acad.name} (${acad.subscription_plan.toUpperCase()})` : 'No Academy';
    } else {
      const acad = academies[0];
      return acad ? `${acad.name} (TEACHER)` : 'No Academy';
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          p.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (p.mobile && p.mobile.includes(userSearch));
    
    if (!matchesSearch) return false;

    if (roleFilter === 'all') return true;
    return p.role === roleFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-slate-50 text-slate-800">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-semibold">Configuring super operator dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm shadow-blue-500/20">
            <Layers className="w-4.5 h-4.5 fill-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900">Platform<span className="text-blue-600">Control</span></span>
          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200">SUPER ADMIN</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-bold hidden sm:inline">{user?.name} &bull; operator@platform.com</span>
          <button 
            onClick={logout} 
            className="text-rose-600 hover:text-rose-500 p-1.5 rounded-lg bg-rose-50 border border-rose-100 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Super Operations Control</h1>
            <p className="text-xs text-slate-500 mt-1">Audit registration profiles, override active subscription billing tiers, and handle platform support tickets</p>
          </div>
          <button 
            onClick={loadSuperData} 
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Records
          </button>
        </div>

        {/* Tabbed Navigation */}
        <div className="flex border-b border-slate-200 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'overview' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" /> Overview & Academies
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'users' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> User & Teacher Accounts
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'security' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Security Settings
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ACADEMIES */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Academies</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{stats.academiesCount}</h3>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-emerald-150 bg-emerald-50 text-emerald-700 shadow-sm">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Global Platform Rev</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-2">₹{stats.totalRevenue}</h3>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Subs</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{stats.activeSubscriptions}</h3>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-amber-150 bg-amber-50 text-amber-700 shadow-sm">
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Support Tickets</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-amber-800 mt-2">{stats.supportTicketsCount} Open</h3>
              </div>

            </div>

            {/* Grid: Academies Override List vs Tickets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Academy accounts list */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Academy Workspace Accounts</h3>
                  <p className="text-[10px] text-slate-500">Monitor active subscription tiers and override plans</p>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {academies.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-6">No academies registered yet.</p>
                  ) : (
                    academies.map(acad => (
                      <div key={acad.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100/60 transition-all shadow-sm">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-850 block">{acad.name}</span>
                          <span className="text-[10px] text-slate-550 block">
                            Address: <strong className="text-slate-700">{acad.address || 'Not set'}</strong> &bull; UPI: <strong className="text-slate-700">{acad.upi_id || 'Not set'}</strong>
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Plan: <strong className="text-blue-600 uppercase">{acad.subscription_plan}</strong> &bull; Status: <span className={`font-bold ${acad.subscription_status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>{acad.subscription_status.toUpperCase()}</span>
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          
                          {acad.subscription_plan === 'trial' ? (
                            <button
                              onClick={() => handleChangePlan(acad.id, 'growth', 'active')}
                              className="bg-blue-550 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-colors"
                            >
                              Upgrade Growth
                            </button>
                          ) : (
                            <button
                              onClick={() => handleChangePlan(acad.id, 'trial', 'active')}
                              className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-colors"
                            >
                              Downgrade Trial
                            </button>
                          )}

                          <button
                            onClick={() => handleChangePlan(acad.id, acad.subscription_plan, acad.subscription_status === 'active' ? 'cancelled' : 'active')}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border shadow-sm transition-colors ${
                              acad.subscription_status === 'active' ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                            }`}
                          >
                            {acad.subscription_status === 'active' ? 'Cancel' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Support ticket backlog */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Support Ticket Log</h3>
                  <p className="text-[10px] text-slate-500">Resolve client requests and reports</p>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {tickets.length === 0 ? (
                    <p className="text-xs text-slate-550 italic text-center py-6">No support tickets found.</p>
                  ) : (
                    tickets.map(t => (
                      <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-850">{t.academy_name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                            t.status === 'open' ? 'bg-amber-50 text-amber-600 border-amber-150' : 'bg-slate-200 text-slate-550 border-slate-350'
                          }`}>
                            {t.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-650 leading-relaxed font-mono bg-white p-2 rounded border border-slate-100">
                          <strong>{t.title}</strong>: {t.description}
                        </div>
                        {t.status === 'open' && (
                          <button
                            onClick={() => handleResolveTicket(t.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded-lg text-[10px] flex items-center justify-center gap-1 shadow-sm transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Resolve Ticket
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: USER & TEACHER ACCOUNTS */}
        {activeTab === 'users' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 animate-fade-in text-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Registered Platform Profiles</h3>
                <p className="text-[10px] text-slate-500">View teacher logins, owner credentials, passwords, and billing parameters</p>
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
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-650 focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Owners Only</option>
                  <option value="teacher">Teachers Only</option>
                </select>
              </div>
            </div>

            {/* Profiles Table */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4">Associated Academy & Plan</th>
                    <th className="p-4">Login Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 italic">No user accounts found.</td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{p.name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border capitalize ${
                            p.role === 'super_admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            p.role === 'owner' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {p.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 space-y-0.5">
                          <div className="font-medium text-slate-800">{p.email}</div>
                          {p.mobile && <div className="text-[10px] text-slate-450">Phone: {p.mobile}</div>}
                        </td>
                        <td className="p-4 font-medium text-slate-700">
                          {getAssociatedAcademyNameAndPlan(p)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {showPasswords[p.id] ? (p.password || 'password123') : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(p.id)}
                              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                              title="Toggle password visibility"
                            >
                              {showPasswords[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN SECURITY SETTINGS */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in text-slate-800">
            
            {/* Operator info card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 h-fit">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4.5 h-4.5 text-blue-600" /> Super Admin Profile
              </h3>
              
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wider">Manager Name</span>
                  <strong className="text-slate-800 block text-xs mt-0.5">{user?.name}</strong>
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

            {/* Password edit form */}
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
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:outline-none transition-colors"
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
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:outline-none transition-colors"
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
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updatingPass}
                    className="bg-blue-600 hover:bg-blue-550 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                  >
                    {updatingPass ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating password...
                      </>
                    ) : (
                      <>Update Account Password</>
                    )}
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
