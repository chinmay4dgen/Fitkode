import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Heart,
  FileText,
  Activity,
  Award,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  User,
  Stethoscope,
  Utensils,
  ChevronDown,
  Printer,
  RefreshCw,
  Target,
  HeartPulse,
  Dumbbell,
  Zap,
  Moon,
  Scale,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppMember, UserRole, WeeklyTrackerEntry } from '../types';
import {
  fetchAllMembersForAdmin,
  updateMemberRole,
  updateMemberNotes,
  isDefaultAdmin,
  DEFAULT_ADMIN_EMAILS,
} from '../lib/memberStore';
import { getSupabase } from '../lib/supabase';
import { loadUserWeeklyEntries } from '../lib/weeklyTrackerStore';
import WeeklyTrackerCharts from './WeeklyTrackerCharts';
import WeeklyTrackerTable from './WeeklyTrackerTable';
import PhotoCompareModal from './PhotoCompareModal';

export default function AdminMembersPage() {
  const { user, role, isAdmin, setTestingRole, signInWithTestAccount } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState<AppMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'paid' | 'unpaid' | 'admin'>('all');
  const [selectedMember, setSelectedMember] = useState<AppMember | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'assessment' | 'weekly-tracker' | 'coaching'>('profile');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [coachNotes, setCoachNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [adminPhotoModalEntryId, setAdminPhotoModalEntryId] = useState<string | null>(null);

  // Load all members
  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllMembersForAdmin(user?.email);
      setMembers(data);
      // If a member was selected, refresh their data
      if (selectedMember) {
        const refreshed = data.find((m) => m.id === selectedMember.id);
        if (refreshed) {
          setSelectedMember(refreshed);
          setCoachNotes(refreshed.notes || '');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load member directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();

      // Listen for instant realtime changes on public.profiles (e.g. new Google signups)
      const supabase = getSupabase();
      let channel: any = null;
      if (supabase) {
        try {
          channel = supabase
            .channel('admin-profiles-realtime')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'profiles' },
              () => {
                loadData();
              }
            )
            .subscribe();
        } catch {
          // ignore
        }
      }

      return () => {
        if (supabase && channel) {
          try {
            supabase.removeChannel(channel);
          } catch {
            // ignore
          }
        }
      };
    }
  }, [isAdmin, user?.email]);

  // When a member is selected, sync notes
  const handleSelectMember = (member: AppMember) => {
    setSelectedMember(member);
    setCoachNotes(member.notes || '');
    setActiveTab('profile');
    setNotesSaved(false);
  };

  // Change member role
  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    setUpdatingRole(true);
    try {
      const updated = await updateMemberRole(memberId, newRole, user?.email);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      if (selectedMember?.id === memberId) {
        setSelectedMember(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  };

  // Save coach notes
  const handleSaveNotes = () => {
    if (!selectedMember) return;
    updateMemberNotes(selectedMember.id, coachNotes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  };

  // ----------------------------------------------------
  // ACCESS DENIED VIEW (For Paid & Unpaid regular users)
  // ----------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Super Admin Restricted</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              This directory contains confidential health, dietary, and personal records of Fitkode members. Only
              authorized Super Administrators can view other users' information.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Your Signed-in Account:</span>
              <span className="font-semibold text-gray-800 truncate max-w-[180px]">{user?.email || 'Guest'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Your Current Role:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider ${
                  role === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {role === 'paid' ? 'Paid Member' : 'Unpaid Member'}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={adminLoggingIn}
              onClick={async () => {
                setAdminLoggingIn(true);
                try {
                  await signInWithTestAccount('admin');
                } finally {
                  setAdminLoggingIn(false);
                }
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-purple-900/20 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>{adminLoggingIn ? 'Logging In as Super Admin...' : '👑 Sign In as Chinmay Jain (Super Admin)'}</span>
            </button>

            <Link
              to="/profile"
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-brand-green hover:bg-brand-green/90 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-brand-green/20"
            >
              <span>Go to My Personal Profile</span>
            </Link>
            <Link
              to="/"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors"
            >
              <span>Return to Home</span>
            </Link>
          </div>

          {/* Developer helper for chinma4jain testing if role override was used */}
          {user?.email && isDefaultAdmin(user.email) && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[11px] text-gray-500 mb-2">
                You are recognized as the primary admin ({user.email}). You are currently testing with a non-admin role.
              </p>
              <button
                type="button"
                onClick={() => setTestingRole('admin')}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
              >
                Restore Super Admin Role
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // FILTERING & STATS
  // ----------------------------------------------------
  const filteredMembers = members.filter((m) => {
    // Role filter
    if (roleFilter !== 'all' && m.role !== roleFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = m.name?.toLowerCase().includes(q);
      const matchEmail = m.email?.toLowerCase().includes(q);
      const matchPhone = m.phone?.toLowerCase().includes(q) || m.profile?.phone?.includes(q);
      const matchPlan = m.planName?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchPlan) return false;
    }
    return true;
  });

  const totalMembers = members.length;
  const paidCount = members.filter((m) => m.role === 'paid').length;
  const unpaidCount = members.filter((m) => m.role === 'unpaid').length;
  const adminCount = members.filter((m) => m.role === 'admin').length;
  const completedOnboardingCount = members.filter((m) => (m.onboardingCompletion || 0) === 100).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Super Admin Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-gray-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-black uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Super Admin Portal</span>
              </span>
              <span className="text-xs text-purple-200/70">
                Logged in as <strong className="text-white">{user?.email || 'Admin'}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Fitkode Member Management & Dossiers
            </h1>
            <p className="text-sm text-purple-200/80 max-w-2xl">
              Super Admin access: View and inspect all enrolled members who have signed in, their complete 70-question
              nutrition assessments, body measurements, and assign account membership tiers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
              title="Refresh Member Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              to="/profile"
              className="inline-flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
            >
              <User className="w-3.5 h-3.5" />
              <span>My Profile</span>
            </Link>

            {/* Admin Role Test Switcher */}
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 text-xs font-bold border border-purple-400/30 transition-all cursor-pointer"
              >
                <span>Role Preview</span>
                <ChevronDown className="w-3.5 h-3.5 text-purple-300" />
              </button>
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 hidden group-hover:block z-30 text-gray-800">
                <p className="text-[10px] uppercase font-bold text-gray-400 px-3 py-1">Test Non-Admin Views</p>
                <button
                  type="button"
                  onClick={() => setTestingRole('paid')}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-emerald-50 hover:text-emerald-800 font-semibold transition-colors"
                >
                  Switch to Paid User
                </button>
                <button
                  type="button"
                  onClick={() => setTestingRole('unpaid')}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-blue-50 hover:text-blue-800 font-semibold transition-colors"
                >
                  Switch to Unpaid User
                </button>
                <button
                  type="button"
                  onClick={() => setTestingRole('admin')}
                  className="w-full text-left px-3 py-1.5 text-xs rounded-lg bg-purple-50 text-purple-800 font-bold mt-1"
                >
                  Super Admin (Active)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-purple-200/70 font-medium">Total Registered</p>
            <p className="text-2xl font-black text-white mt-1">{totalMembers}</p>
            <p className="text-[11px] text-purple-300/60 mt-0.5">Signed-in accounts</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-emerald-300 font-medium">Paid Coaching Clients</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{paidCount}</p>
            <p className="text-[11px] text-emerald-200/60 mt-0.5">Active paid users</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-blue-300 font-medium">Free / Unpaid Users</p>
            <p className="text-2xl font-black text-blue-300 mt-1">{unpaidCount}</p>
            <p className="text-[11px] text-blue-200/60 mt-0.5">Prospects & free tier</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-amber-300 font-medium">Completed Onboarding</p>
            <p className="text-2xl font-black text-amber-300 mt-1">{completedOnboardingCount}</p>
            <p className="text-[11px] text-amber-200/60 mt-0.5">Full 70-Q dossiers</p>
          </div>
        </div>
      </div>

      {/* Main Content: Split Member Directory List & Detailed Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Member Search, Filters & List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or plan..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-xs transition-all bg-gray-50/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({members.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('paid')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  roleFilter === 'paid'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Paid ({paidCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('unpaid')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  roleFilter === 'unpaid'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                Unpaid ({unpaidCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  roleFilter === 'admin'
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                Admin ({adminCount})
              </button>
            </div>
          </div>

          {/* Member Cards List */}
          <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1">
            {filteredMembers.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-200">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-800">No members match your criteria</p>
                <p className="text-xs text-gray-500 mt-1">Try resetting the search query or role filter.</p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedMember?.id === member.id;
                const isMemberAdmin = member.role === 'admin' || isDefaultAdmin(member.email);

                return (
                  <div
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? 'bg-white border-brand-green shadow-md ring-2 ring-brand-green/20'
                        : 'bg-white border-gray-200 hover:border-brand-green/50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-gray-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-brand-light-green text-brand-dark-green font-black flex items-center justify-center text-base border border-brand-green/20">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isMemberAdmin && (
                          <div
                            className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-sm"
                            title="Super Admin"
                          >
                            <Shield className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-sm font-black text-gray-900 truncate">{member.name}</h3>
                          {/* Role Badge */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isMemberAdmin
                                ? 'bg-purple-100 text-purple-800'
                                : member.role === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isMemberAdmin ? 'Admin' : member.role === 'paid' ? 'Paid User' : 'Unpaid'}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 truncate mt-0.5">{member.email}</p>

                        {member.planName && (
                          <p className="text-[11px] font-semibold text-emerald-700 mt-1 truncate flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>{member.planName}</span>
                          </p>
                        )}

                        {/* Progress Indicators */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-100 text-[11px]">
                          <div>
                            <span className="text-gray-400 block text-[10px]">Profile</span>
                            <span className="font-bold text-gray-700">{member.profileCompletion || 0}% Complete</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">Onboarding</span>
                            <span
                              className={`font-bold ${
                                (member.onboardingCompletion || 0) === 100
                                  ? 'text-emerald-600'
                                  : (member.onboardingCompletion || 0) > 0
                                  ? 'text-amber-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              {(member.onboardingCompletion || 0) === 100
                                ? 'Completed'
                                : (member.onboardingCompletion || 0) > 0
                                ? `${member.onboardingCompletion}% Draft`
                                : 'Not Started'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Comprehensive Member Dossier Inspector */}
        <div className="lg:col-span-7">
          {selectedMember ? (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Member Header & Role Editor */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  {selectedMember.avatarUrl ? (
                    <img
                      src={selectedMember.avatarUrl}
                      alt={selectedMember.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-green/20"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-brand-light-green text-brand-dark-green font-black flex items-center justify-center text-xl border border-brand-green/20">
                      {selectedMember.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-black text-gray-900">{selectedMember.name}</h2>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                          selectedMember.role === 'admin' || isDefaultAdmin(selectedMember.email)
                            ? 'bg-purple-100 text-purple-800'
                            : selectedMember.role === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {selectedMember.role === 'admin' || isDefaultAdmin(selectedMember.email)
                          ? 'Super Admin'
                          : selectedMember.role === 'paid'
                          ? 'Paid User'
                          : 'Unpaid User'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{selectedMember.email}</span>
                      </span>
                      {(selectedMember.phone || selectedMember.profile?.phone) && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{selectedMember.phone || selectedMember.profile?.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Switcher Action */}
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 space-y-1 text-left sm:text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Modify Member Role</p>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={updatingRole}
                      onClick={() => handleRoleChange(selectedMember.id, 'unpaid')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedMember.role === 'unpaid'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      Unpaid
                    </button>
                    <button
                      type="button"
                      disabled={updatingRole}
                      onClick={() => handleRoleChange(selectedMember.id, 'paid')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedMember.role === 'paid'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      Paid
                    </button>
                    <button
                      type="button"
                      disabled={updatingRole}
                      onClick={() => handleRoleChange(selectedMember.id, 'admin')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedMember.role === 'admin'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </div>

              {/* Dossier Navigation Tabs */}
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-brand-dark-green text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Personal Profile ({selectedMember.profileCompletion || 0}%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('assessment')}
                  className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'assessment'
                      ? 'bg-brand-dark-green text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    70-Q Assessment (
                    {(selectedMember.onboardingCompletion || 0) === 100 ? 'Complete' : `${selectedMember.onboardingCompletion || 0}%`}
                    )
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('weekly-tracker')}
                  className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'weekly-tracker'
                      ? 'bg-brand-dark-green text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>
                    Weekly Tracker ({loadUserWeeklyEntries(selectedMember.email).length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('coaching')}
                  className={`flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'coaching'
                      ? 'bg-brand-dark-green text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Coach Notes & Plan</span>
                </button>
              </div>

              {/* TAB 1: PERSONAL PROFILE */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {selectedMember.profile ? (
                    <>
                      {/* Identity & Demographics */}
                      <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                          1. Identity & Demographics
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-gray-400 block">Full Name</span>
                            <span className="font-bold text-gray-800">
                              {selectedMember.profile.firstName || selectedMember.name}{' '}
                              {selectedMember.profile.lastName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Age / DOB</span>
                            <span className="font-bold text-gray-800">
                              {selectedMember.profile.age ? `${selectedMember.profile.age} yrs` : 'N/A'}{' '}
                              {selectedMember.profile.dateOfBirth && `(${selectedMember.profile.dateOfBirth})`}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Gender</span>
                            <span className="font-bold text-gray-800">{selectedMember.profile.gender || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Blood Group</span>
                            <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md inline-block">
                              {selectedMember.profile.bloodGroup || 'Not specified'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Marital Status</span>
                            <span className="font-bold text-gray-800">
                              {selectedMember.profile.maritalStatus || 'Not specified'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Children / Pregnancy</span>
                            <span className="font-bold text-gray-800">
                              Children: {selectedMember.profile.children || 'No'} | Pregnant: {selectedMember.profile.isPregnant || 'No'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact & Location */}
                      <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                          2. Contact & Location
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-gray-400 block">WhatsApp Phone</span>
                            <span className="font-bold text-gray-800">{selectedMember.profile.phone || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Alternate Phone</span>
                            <span className="font-bold text-gray-800">{selectedMember.profile.alternatePhone || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Preferred Contact</span>
                            <span className="font-bold text-emerald-800">
                              {selectedMember.profile.preferredContact || 'WhatsApp'}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-3">
                            <span className="text-gray-400 block">Home Address</span>
                            <span className="font-medium text-gray-800">
                              {[
                                selectedMember.profile.address,
                                selectedMember.profile.city,
                                selectedMember.profile.state,
                                selectedMember.profile.zipcode,
                              ]
                                .filter(Boolean)
                                .join(', ') || 'Address not filled'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Household & Baseline */}
                      <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                          3. Household & Baseline Healthcare
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-gray-400 block">Living With</span>
                            <span className="font-bold text-gray-800">{selectedMember.profile.livingWith || 'Not provided'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Primary Care Provider</span>
                            <span className="font-bold text-gray-800">
                              {selectedMember.profile.primaryCareProvider || 'None listed'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Last Checkup Date</span>
                            <span className="font-bold text-gray-800">
                              {selectedMember.profile.lastCheckupDate || 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 text-gray-400 text-xs">
                      Member has not started their personal profile yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: 70-QUESTION ONBOARDING ASSESSMENT */}
              {activeTab === 'assessment' && (
                <div className="space-y-6">
                  {selectedMember.onboarding ? (
                    <>
                      {/* Section 1: Goals & Readiness Assessment */}
                      <div className="bg-purple-50/40 rounded-2xl p-5 border border-purple-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center space-x-1.5">
                            <Target className="w-3.5 h-3.5 text-purple-700" />
                            <span>1. Goals &amp; Readiness Assessment</span>
                          </h4>
                          <span className="text-[11px] font-bold text-purple-800 bg-purple-100/70 px-2.5 py-0.5 rounded-lg border border-purple-200">
                            {selectedMember.onboarding.healthGoal || selectedMember.profile?.healthGoal || 'Goal Pending'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="sm:col-span-2 bg-white rounded-xl p-3 border border-purple-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Core Reason &amp; WHY</span>
                            <p className="font-semibold text-gray-800 mt-0.5">
                              {selectedMember.onboarding.coreReasonWhy || 'Not answered'}
                            </p>
                          </div>

                          <div className="bg-white rounded-xl p-3 border border-purple-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Past Diets &amp; Techniques Tried</span>
                            <p className="font-medium text-gray-800 mt-0.5">
                              {selectedMember.onboarding.pastDietsAndTechniques || 'None recorded'}
                            </p>
                          </div>

                          <div className="bg-white rounded-xl p-3 border border-purple-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Biggest Nutrition Challenges</span>
                            <p className="font-medium text-gray-800 mt-0.5">
                              {selectedMember.onboarding.biggestNutritionChallenges || 'None recorded'}
                            </p>
                          </div>

                          <div className="sm:col-span-2 bg-white rounded-xl p-3 border border-purple-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Desired Habit Changes</span>
                            <p className="font-medium text-gray-800 mt-0.5">
                              {selectedMember.onboarding.desiredHealthHabitChanges || 'None recorded'}
                            </p>
                          </div>
                        </div>

                        {/* Readiness Scores Grid */}
                        <div className="pt-2 border-t border-purple-100/60">
                          <span className="text-[10px] uppercase font-bold text-purple-800 block mb-2">
                            Readiness &amp; Commitment Scores (Scale 1 – 5)
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                            <div className="bg-white p-2 rounded-xl border border-purple-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Honesty</span>
                              <span className="font-bold text-purple-900">{selectedMember.onboarding.truthfulnessScale || 5}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-purple-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Weekly Track</span>
                              <span className="font-bold text-purple-900">{selectedMember.onboarding.readinessWeeklyTracking || 5}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-purple-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Modify Diet</span>
                              <span className="font-bold text-purple-900">{selectedMember.onboarding.readinessModifyDiet || 4}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-purple-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Supplements</span>
                              <span className="font-bold text-purple-900">{selectedMember.onboarding.readinessSupplements || 4}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-purple-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Food Log</span>
                              <span className="font-bold text-purple-900">{selectedMember.onboarding.readinessFoodLog || 4}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-purple-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Lifestyle</span>
                              <span className="font-bold text-purple-900">{selectedMember.onboarding.readinessModifyLifestyle || 4}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-purple-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Meditation</span>
                              <span className="font-bold text-purple-900">{selectedMember.onboarding.readinessRelaxationMeditation || 4}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-purple-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Exercise</span>
                              <span className="font-bold text-purple-900">{selectedMember.onboarding.readinessRegularExercise || 5}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-purple-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Lab Tests</span>
                              <span className="font-bold text-purple-900">{selectedMember.onboarding.readinessPeriodicLabTests || 4}/5</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Lifestyle, Physical Activity & Stress */}
                      <div className="bg-sky-50/40 rounded-2xl p-5 border border-sky-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center space-x-1.5">
                            <HeartPulse className="w-3.5 h-3.5 text-sky-700" />
                            <span>2. Lifestyle, Movement &amp; Daily Stress</span>
                          </h4>
                          <span className="text-[11px] font-bold text-sky-800 bg-sky-100/70 px-2.5 py-0.5 rounded-lg border border-sky-200">
                            {selectedMember.onboarding.gymAccess ? `Gym: ${selectedMember.onboarding.gymAccess}` : 'Gym: Unspecified'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-white rounded-xl p-3 border border-sky-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Physical Activities</span>
                            <span className="font-bold text-gray-800">
                              {selectedMember.onboarding.currentPhysicalActivities?.join(', ') || 'None reported'}
                            </span>
                            <span className="text-[11px] text-gray-500 block mt-1">
                              Frequency: {selectedMember.onboarding.physicalActivityDaysPerWeek ?? 0} days/wk ({selectedMember.onboarding.physicalActivityDurationMinutes ?? 0} mins/session)
                            </span>
                          </div>

                          <div className="bg-white rounded-xl p-3 border border-sky-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Workout Availability</span>
                            <span className="font-bold text-gray-800">
                              {selectedMember.onboarding.workoutDaysAndDuration || 'Not answered'}
                            </span>
                            <span className="text-[11px] text-gray-500 block mt-1">
                              Limitations: {selectedMember.onboarding.physicalActivityLimitations?.join(', ') || 'None'}
                            </span>
                          </div>

                          <div className="bg-white rounded-xl p-3 border border-sky-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Sleep Schedule</span>
                            <p className="font-semibold text-gray-800 mt-0.5">
                              Weekdays: {selectedMember.onboarding.sleepHoursWeekdays || 'N/A'} | Weekends: {selectedMember.onboarding.sleepHoursWeekends || 'N/A'}
                            </p>
                            <span className="text-[11px] text-gray-500 block mt-1">
                              Unwinding: {selectedMember.onboarding.unwindRelaxActivities || 'N/A'}
                            </span>
                          </div>

                          <div className="bg-white rounded-xl p-3 border border-sky-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Smoking &amp; Alcohol</span>
                            <p className="font-semibold text-gray-800 mt-0.5">
                              Smoking: {selectedMember.onboarding.smokingStatus || 'Never'} ({selectedMember.onboarding.cigarettesPerDay || 'Non-smoker'})
                            </p>
                            <span className="text-[11px] text-gray-500 block mt-1">
                              Alcohol: {selectedMember.onboarding.alcoholUse || 'Never'} • {selectedMember.onboarding.alcoholFrequency || 'Never'} ({selectedMember.onboarding.alcoholQuantityPerSession || 'N/A'})
                            </span>
                          </div>
                        </div>

                        {/* Stress Triggers */}
                        <div className="pt-2 border-t border-sky-100/60">
                          <span className="text-[10px] uppercase font-bold text-sky-900 block mb-2">
                            Stress Levels (Scale 1 – 5: Extremely Low to Very High)
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                            <div className="bg-white p-2 rounded-xl border border-sky-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Work</span>
                              <span className="font-bold text-sky-900">{selectedMember.onboarding.stressWork || 3}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-sky-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Family</span>
                              <span className="font-bold text-sky-900">{selectedMember.onboarding.stressFamily || 2}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-sky-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Social</span>
                              <span className="font-bold text-sky-900">{selectedMember.onboarding.stressSocial || 2}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-sky-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Finance</span>
                              <span className="font-bold text-sky-900">{selectedMember.onboarding.stressFinancial || 2}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-sky-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Health</span>
                              <span className="font-bold text-sky-900">{selectedMember.onboarding.stressHealth || 2}/5</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-sky-100 text-center">
                              <span className="text-gray-400 block text-[9px]">Other</span>
                              <span className="font-bold text-sky-900">{selectedMember.onboarding.stressOtherScore || 1}/5</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Dietary & Nutrition */}
                      <div className="bg-emerald-50/40 rounded-2xl p-5 border border-emerald-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
                            <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                            <span>3. Dietary Habits &amp; Daily Nutrition</span>
                          </h4>
                          <span className="text-[11px] font-bold text-emerald-700">
                            {selectedMember.onboarding.dietPreferences?.join(', ') || 'Standard'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-400 block">Food Allergies</span>
                            <span className="font-bold text-red-700">{selectedMember.onboarding.foodAllergies || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Disliked Foods</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.dislikedFoods || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Who Prepares Meals / Difficulty</span>
                            <span className="font-bold text-gray-800">
                              {selectedMember.onboarding.whoCooks || 'Self'} (Difficulty:{' '}
                              {selectedMember.onboarding.cookingDifficulty === 'yes' ? 'Yes' : 'No'})
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Daily Beverages</span>
                            <span className="font-bold text-gray-800">
                              {selectedMember.onboarding.dailyBeverageOfChoice?.join(', ') || 'Water'} (
                              {selectedMember.onboarding.beverageFrequencyQuantity || 'Normal'})
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-gray-400 block">Daily Food Log (Breakfast / Lunch / Snack / Dinner)</span>
                            <div className="bg-white rounded-xl p-3 mt-1 border border-emerald-100 space-y-1 text-[11px]">
                              <p><strong>Breakfast:</strong> {selectedMember.onboarding.breakfastDetails || 'N/A'}</p>
                              <p><strong>Lunch:</strong> {selectedMember.onboarding.lunchDetails || 'N/A'}</p>
                              <p><strong>Snack:</strong> {selectedMember.onboarding.snackDetails || 'N/A'}</p>
                              <p><strong>Dinner:</strong> {selectedMember.onboarding.dinnerDetails || 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Cravings & Frequency</span>
                            <span className="font-bold text-gray-800">
                              {selectedMember.onboarding.foodCravings || 'None'} ({selectedMember.onboarding.cravingFrequency || 'Rare'})
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Eating Out Frequency</span>
                            <span className="font-bold text-gray-800">
                              {selectedMember.onboarding.outsideFoodFrequency || 'Rare'} ({selectedMember.onboarding.outsideFoodItems || 'None'})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Gut & Digestive Health */}
                      <div className="bg-amber-50/40 rounded-2xl p-5 border border-amber-100 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">
                          4. Digestive &amp; Gut Symptoms Frequency
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                            <span className="text-gray-400 block text-[10px]">Heartburn</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.heartburnFrequency || 'Never'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                            <span className="text-gray-400 block text-[10px]">Gas / Flatulence</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.gasFrequency || 'Never'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                            <span className="text-gray-400 block text-[10px]">Bloating</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.bloatingFrequency || 'Never'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                            <span className="text-gray-400 block text-[10px]">Stomach Pain</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.stomachPainFrequency || 'Never'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                            <span className="text-gray-400 block text-[10px]">Nausea / Vomiting</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.nauseaVomitingFrequency || 'Never'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                            <span className="text-gray-400 block text-[10px]">Diarrhea</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.diarrheaFrequency || 'Never'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                            <span className="text-gray-400 block text-[10px]">Constipation</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.constipationFrequency || 'Never'}</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                            <span className="text-gray-400 block text-[10px]">Sensitivities</span>
                            <span className="font-bold text-gray-800 truncate block">{selectedMember.onboarding.missedDetails || 'None'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Body Statistics & Measurements */}
                      <div className="bg-blue-50/40 rounded-2xl p-5 border border-blue-100 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-blue-800">
                          5. Body Measurements &amp; Baseline Composition
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-gray-400 block text-[10px]">Weight (Morning Fasting)</span>
                            <span className="text-sm font-black text-blue-950">
                              {selectedMember.onboarding.currentWeightKg ? `${selectedMember.onboarding.currentWeightKg} kg` : 'N/A'}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-gray-400 block text-[10px]">Height</span>
                            <span className="text-sm font-black text-blue-950">
                              {selectedMember.onboarding.heightCm ? `${selectedMember.onboarding.heightCm} cm` : 'N/A'}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-gray-400 block text-[10px]">Waist Circumference</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.waistInches || 'N/A'} in</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-gray-400 block text-[10px]">Hip Circumference</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.hipInches || 'N/A'} in</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-gray-400 block text-[10px]">Chest</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.chestInches || 'N/A'} in</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-gray-400 block text-[10px]">Upper Arm</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.upperArmInches || 'N/A'} in</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-gray-400 block text-[10px]">Quadriceps (Thigh)</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.quadricepsInches || 'N/A'} in</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                            <span className="text-gray-400 block text-[10px]">Neck</span>
                            <span className="font-bold text-gray-800">{selectedMember.onboarding.neckInches || 'N/A'} in</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 6: Medical History, Surgeries & Family */}
                      <div className="bg-purple-50/40 rounded-2xl p-5 border border-purple-100 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-800">
                          6. Medical, Surgical &amp; Family Genetic History
                        </h4>
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-gray-400 block">Personal & Surgical History</span>
                            <p className="font-medium text-gray-800 mt-0.5">
                              {selectedMember.onboarding.medicalAndSurgicalHistory || 'No surgeries or chronic conditions reported.'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Family Deaths & Causes</span>
                            <p className="font-medium text-gray-800 mt-0.5">
                              {selectedMember.onboarding.familyDeathsAndCauses || 'No premature hereditary deaths reported.'}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <span className="text-gray-400 block">Blood Pressure Awareness</span>
                              <span className="font-bold text-gray-800">
                                Knows: {selectedMember.onboarding.knowsBloodPressure || 'no'} | Above 140/90:{' '}
                                {selectedMember.onboarding.bpAbove14090 === 'yes' ? 'YES (High)' : 'No'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">Cholesterol Awareness</span>
                              <span className="font-bold text-gray-800">
                                Knows: {selectedMember.onboarding.knowsCholesterol || 'no'} | Above 200 mg/dL:{' '}
                                {selectedMember.onboarding.cholesterolAbove200 === 'yes' ? 'YES (High)' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 7: Symptom Severity (1-5) & Medications */}
                      <div className="bg-rose-50/40 rounded-2xl p-5 border border-rose-100 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-rose-800">
                          7. Symptom Severity (1–5 Scale) &amp; Medications
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-white p-3 rounded-xl border border-rose-100">
                            <span className="text-gray-500 block text-[11px]">Headaches</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-base font-black text-rose-700">
                                {selectedMember.onboarding.headachesScore || 1}/5
                              </span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="bg-rose-500 h-1.5 rounded-full"
                                  style={{ width: `${((selectedMember.onboarding.headachesScore || 1) / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-rose-100">
                            <span className="text-gray-500 block text-[11px]">Insomnia / Sleep</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-base font-black text-rose-700">
                                {selectedMember.onboarding.insomniaScore || 1}/5
                              </span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="bg-rose-500 h-1.5 rounded-full"
                                  style={{ width: `${((selectedMember.onboarding.insomniaScore || 1) / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-rose-100">
                            <span className="text-gray-500 block text-[11px]">Digestive Issues</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-base font-black text-rose-700">
                                {selectedMember.onboarding.digestiveIssuesScore || 1}/5
                              </span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="bg-rose-500 h-1.5 rounded-full"
                                  style={{ width: `${((selectedMember.onboarding.digestiveIssuesScore || 1) / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-rose-100">
                            <span className="text-gray-500 block text-[11px]">Dizziness</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-base font-black text-rose-700">
                                {selectedMember.onboarding.dizzinessScore || 1}/5
                              </span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="bg-rose-500 h-1.5 rounded-full"
                                  style={{ width: `${((selectedMember.onboarding.dizzinessScore || 1) / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-rose-100">
                            <span className="text-gray-500 block text-[11px]">Mood / Emotional</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-base font-black text-rose-700">
                                {selectedMember.onboarding.emotionalIssuesScore || 1}/5
                              </span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="bg-rose-500 h-1.5 rounded-full"
                                  style={{ width: `${((selectedMember.onboarding.emotionalIssuesScore || 1) / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-rose-100">
                            <span className="text-gray-500 block text-[11px]">Faintness</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-base font-black text-rose-700">
                                {selectedMember.onboarding.faintnessScore || 1}/5
                              </span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="bg-rose-500 h-1.5 rounded-full"
                                  style={{ width: `${((selectedMember.onboarding.faintnessScore || 1) / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-400 block">Current Medications & Supplements</span>
                            <p className="font-bold text-gray-800 mt-0.5">
                              {selectedMember.onboarding.currentMedications || 'None'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Medication Allergies</span>
                            <p className="font-bold text-red-700 mt-0.5">
                              {selectedMember.onboarding.medicationAllergies || 'Not applicable'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 text-gray-400 text-xs">
                      Member has not submitted or saved an onboarding assessment yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COACHING & PLAN STATUS */}
              {activeTab === 'coaching' && (
                <div className="space-y-6">
                  {/* Plan Details */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                      Enrolled Plan & Subscription Status
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 block">Coaching Plan</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {selectedMember.planName || (selectedMember.role === 'paid' ? 'Paid Custom Plan' : 'Free Tier (Unpaid)')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Enrolled On</span>
                        <span className="font-medium text-gray-700">
                          {selectedMember.planPurchasedAt
                            ? new Date(selectedMember.planPurchasedAt).toLocaleDateString()
                            : selectedMember.joinedAt
                            ? new Date(selectedMember.joinedAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Membership Tier</span>
                        <span
                          className={`font-black uppercase text-xs inline-block mt-0.5 ${
                            selectedMember.role === 'paid'
                              ? 'text-emerald-700'
                              : selectedMember.role === 'admin'
                              ? 'text-purple-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {selectedMember.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Internal Coach Notes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-gray-700">
                        Coach's Internal Clinical Notes
                      </label>
                      {notesSaved && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Notes Saved!</span>
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={5}
                      value={coachNotes}
                      onChange={(e) => setCoachNotes(e.target.value)}
                      placeholder="Enter internal coaching notes, progress observations, calorie target adjustments, or intake review comments here..."
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-xs bg-gray-50/50 transition-all"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveNotes}
                        className="py-2.5 px-5 bg-brand-green hover:bg-brand-green/90 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-green/20 transition-all cursor-pointer"
                      >
                        Save Coach Notes
                      </button>
                    </div>
                  </div>

                  {/* Direct Contact Links */}
                  <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
                    {(selectedMember.phone || selectedMember.profile?.phone) && (
                      <a
                        href={`https://wa.me/${(selectedMember.phone || selectedMember.profile?.phone || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    )}
                    <a
                      href={`mailto:${selectedMember.email}?subject=Fitkode%20Coaching%20Update`}
                      className="inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Send Email</span>
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 4: WEEKLY HEALTH TRACKER & PROGRESSION */}
              {activeTab === 'weekly-tracker' && (
                <div className="space-y-6">
                  {/* Privacy / Confidentiality Notice for Super Admin */}
                  <div className="bg-emerald-950 text-white rounded-2xl p-4 sm:p-5 border border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Confidential Weekly Health Statistics Dossier
                        </p>
                        <p className="text-[11px] text-emerald-200/80">
                          Accessible solely by Super Admin Chinmay and {selectedMember.name}. No other members can view this data or progression photos.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-xl text-emerald-200 shrink-0 self-start sm:self-auto">
                      {loadUserWeeklyEntries(selectedMember.email).length} Total Check-ins
                    </span>
                  </div>

                  {/* Graphical Analysis */}
                  <WeeklyTrackerCharts entries={loadUserWeeklyEntries(selectedMember.email)} />

                  {/* Reverse Chronological Log Table */}
                  <WeeklyTrackerTable
                    entries={loadUserWeeklyEntries(selectedMember.email)}
                    onViewPhotos={(id) => setAdminPhotoModalEntryId(id)}
                    isReadOnly={true}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <Users className="w-12 h-12 text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-800">Select a member to inspect dossier</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Choose any member from the left list to review their personal demographics, 70-question intake assessment,
                or manage their role.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Progression Photo Modal */}
      {adminPhotoModalEntryId && selectedMember && (
        <PhotoCompareModal
          entries={loadUserWeeklyEntries(selectedMember.email)}
          initialEntryId={adminPhotoModalEntryId}
          onClose={() => setAdminPhotoModalEntryId(null)}
        />
      )}
    </div>
  );
}
