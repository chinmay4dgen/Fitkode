import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Plus,
  Lock,
  Shield,
  ShieldCheck,
  Calendar,
  Camera,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingDown,
  FileText,
  User,
} from 'lucide-react';
import { useAuth, TEST_USER_PRESETS } from '../context/AuthContext';
import { WeeklyTrackerEntry } from '../types';
import {
  loadUserWeeklyEntries,
  saveWeeklyEntry,
  deleteWeeklyEntry,
} from '../lib/weeklyTrackerStore';
import WeeklyTrackerCharts from './WeeklyTrackerCharts';
import WeeklyTrackerTable from './WeeklyTrackerTable';
import WeeklyTrackerModal from './WeeklyTrackerModal';
import PhotoCompareModal from './PhotoCompareModal';

export default function WeeklyTrackerPage() {
  const { user, role, isAdmin, isPaid, signInWithTestAccount } = useAuth();
  
  const [entries, setEntries] = useState<WeeklyTrackerEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeeklyTrackerEntry | null>(null);
  
  // Photo modal state
  const [photoModalEntryId, setPhotoModalEntryId] = useState<string | null>(null);

  const userEmail = user?.email || '';
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    userEmail.split('@')[0] ||
    'Member';

  // Load entries when user changes
  useEffect(() => {
    if (!userEmail) {
      setEntries([]);
      return;
    }
    const loaded = loadUserWeeklyEntries(userEmail);
    setEntries(loaded);
  }, [userEmail]);

  const handleSaveEntry = async (entry: WeeklyTrackerEntry) => {
    if (!userEmail) return;
    const updated = await saveWeeklyEntry(entry, userEmail);
    setEntries(updated);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!userEmail) return;
    const updated = await deleteWeeklyEntry(entryId, userEmail, userEmail);
    setEntries(updated);
  };

  const handleOpenAddModal = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: WeeklyTrackerEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleViewPhotos = (entryId: string) => {
    setPhotoModalEntryId(entryId);
  };

  // If user is not logged in, prompt sign-in
  if (!user) {
    return (
      <div className="min-h-screen bg-natural-oat py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-brand-light-green shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-light-green text-brand-green flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Member Sign-in Required</h2>
            <p className="text-xs text-gray-500 mt-2">
              The Weekly Health Tracker is accessible post-login to all paid and unpaid clients. Please log in with your Google account or select a sample member profile below:
            </p>
          </div>

          <div className="space-y-2 text-left pt-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quick Sign-in Presets:</p>
            {TEST_USER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => signInWithTestAccount(preset.id, preset.role)}
                className="w-full p-3 rounded-2xl border border-gray-200 hover:border-brand-green bg-gray-50 hover:bg-emerald-50/50 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <img src={preset.avatarUrl} alt={preset.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 group-hover:text-brand-green">{preset.name}</p>
                    <p className="text-[10px] text-gray-500">{preset.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>

          <Link
            to="/"
            className="inline-block text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-oat py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Strict Confidentiality & Super Admin Privacy Guarantee Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5 sm:mt-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white flex items-center">
                Strict Privacy Guaranteed
                <span className="ml-2 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  End-to-End Isolated
                </span>
              </p>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Your body statistics, measurements, and progression photos are visible <strong>only to you</strong> and <strong>Super Admin Chinmay</strong>. No members can ever view other members' data.
              </p>
            </div>
          </div>

          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer self-start md:self-auto"
            >
              <Shield className="w-3.5 h-3.5 text-purple-700" />
              <span>Admin Directory</span>
            </Link>
          )}
        </div>

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-light-green shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-light-green text-brand-dark-green">
                Weekly Health Tracker
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isAdmin
                  ? 'bg-purple-100 text-purple-800'
                  : isPaid
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isAdmin ? 'Super Admin' : isPaid ? 'Paid Client' : 'Free Client'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Body Stats & Transformation Progression
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Welcome back, <strong>{userName}</strong>. Track your weight trajectory, tape measurements, workouts, and progression photos week by week.
            </p>
          </div>

          {/* Action CTA: Add Check-in */}
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/profile"
              className="px-4 py-2.5 rounded-xl border border-gray-200 hover:border-brand-green text-gray-700 hover:text-brand-green text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </Link>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center space-x-2 cursor-pointer group"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              <span>Log Weekly Check-in</span>
            </button>
          </div>
        </div>

        {/* Graphical Section */}
        <WeeklyTrackerCharts entries={entries} />

        {/* Tabular Section (Reverse Chronological) */}
        <WeeklyTrackerTable
          entries={entries}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteEntry}
          onViewPhotos={handleViewPhotos}
        />

        {/* Input/Edit Modal */}
        {isModalOpen && (
          <WeeklyTrackerModal
            existingEntry={editingEntry}
            defaultEmail={userEmail}
            defaultFirstName={userName.split(' ')[0]}
            defaultLastName={userName.split(' ').slice(1).join(' ')}
            suggestedWeekNumber={entries.length + 1}
            onSave={handleSaveEntry}
            onClose={() => {
              setIsModalOpen(false);
              setEditingEntry(null);
            }}
          />
        )}

        {/* Photo Comparison / Gallery Modal */}
        {photoModalEntryId && (
          <PhotoCompareModal
            entries={entries}
            initialEntryId={photoModalEntryId}
            onClose={() => setPhotoModalEntryId(null)}
          />
        )}

      </div>
    </div>
  );
}
