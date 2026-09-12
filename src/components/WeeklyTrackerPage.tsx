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
import { isLiveProductionSite, shouldShowTestProfiles } from '../lib/environment';
import {
  loadUserWeeklyEntries,
  fetchUserWeeklyEntries,
  saveWeeklyEntry,
  deleteWeeklyEntry,
} from '../lib/weeklyTrackerStore';
import WeeklyTrackerCharts from './WeeklyTrackerCharts';
import WeeklyTrackerTable from './WeeklyTrackerTable';
import WeeklyTrackerModal from './WeeklyTrackerModal';
import PhotoCompareModal from './PhotoCompareModal';
import { ToastContainer, ToastMessage } from './Toast';

export default function WeeklyTrackerPage() {
  const { user, role, isAdmin, isPaid, signInWithTestAccount, signIn, isConfigured } = useAuth();
  
  const [entries, setEntries] = useState<WeeklyTrackerEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeeklyTrackerEntry | null>(null);
  const isLive = isLiveProductionSite();
  const canShowTestProfiles = shouldShowTestProfiles();

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id, duration: toast.duration || 5000 }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  
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

    // Asynchronously pull latest from Backend API / Supabase
    fetchUserWeeklyEntries(userEmail, userEmail)
      .then((fresh) => {
        if (fresh && fresh.length > 0) {
          setEntries(fresh);
        }
      })
      .catch((err) => {
        console.warn('Failed to asynchronously refresh weekly entries:', err);
      });
  }, [userEmail]);

  const handleSaveEntry = async (entry: WeeklyTrackerEntry) => {
    if (!userEmail) return;
    try {
      const updated = await saveWeeklyEntry(entry, userEmail);
      setEntries(updated);
      setEditingEntry(null);
      addToast({
        type: 'success',
        title: 'Check-in Recorded & Coach Notified',
        message: `Week ${entry.weekNumber} metrics saved! Coach Chinmay has been automatically notified on email at myfitkode@gmail.com.`,
        duration: 6000,
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Unable to save your check-in. Please try again.',
        duration: 5000,
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!userEmail) return;
    try {
      const updated = await deleteWeeklyEntry(entryId, userEmail, userEmail);
      setEntries(updated);
      addToast({
        type: 'info',
        title: 'Check-in Removed',
        message: 'The check-in entry was removed.',
        duration: 4000,
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Unable to remove the check-in entry.',
        duration: 5000,
      });
    }
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
              The Weekly Health Tracker is accessible post-login to all paid and unpaid clients. Sign in with your Google account to log your weekly metrics and view your body composition trajectory.
            </p>
          </div>

          {/* Primary Google Sign-in */}
          <button
            type="button"
            onClick={() => {
              if (isConfigured) {
                signIn();
              } else {
                signInWithTestAccount('admin');
              }
            }}
            className="w-full flex items-center justify-center space-x-2.5 py-3 px-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isConfigured ? 'Continue with Google' : 'Sign In as Super Admin'}</span>
          </button>

          {/* Testing presets: ONLY in dev / preview environments, NEVER on live site */}
          {canShowTestProfiles && (
            <div className="space-y-2 text-left pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sample Profiles & Testing (Dev Only):</p>
              </div>
              {TEST_USER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => signInWithTestAccount(preset.id, preset.role)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 hover:border-brand-green bg-gray-50 hover:bg-emerald-50/50 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5">
                    <img src={preset.avatarUrl} alt={preset.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-brand-green">{preset.name}</p>
                      <p className="text-[10px] text-gray-500">{preset.email}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                    {preset.badge}
                  </span>
                </button>
              ))}
            </div>
          )}

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
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

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
            allEntries={entries}
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
