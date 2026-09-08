import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Heart,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Users,
  Shield,
  Sparkles,
  Lock,
  Activity,
  Plus,
  Scale,
  Camera,
  Utensils,
  Dumbbell,
  ExternalLink,
} from 'lucide-react';
import { useAuth, TEST_USER_PRESETS } from '../context/AuthContext';
import { isLiveProductionSite, shouldShowTestProfiles } from '../lib/environment';
import {
  saveProfileToSupabase,
  loadProfileFromSupabase,
} from '../lib/supabase';
import {
  loadUserProfile,
  saveUserProfile,
  loadClientOnboarding,
  getProfileCompletionRate,
  getOnboardingCompletionRate,
} from '../lib/profileStorage';
import { UserProfile, UserRole, WeeklyTrackerEntry, MealPlan, WorkoutPlan } from '../types';
import {
  loadUserWeeklyEntries,
  saveWeeklyEntry,
  deleteWeeklyEntry,
} from '../lib/weeklyTrackerStore';
import {
  loadUserMealPlans,
  getActiveMealPlan,
  saveMealPlan,
  deleteMealPlan,
  setActiveMealPlan,
  renameMealPlan,
  loadUserWorkoutPlans,
  getActiveWorkoutPlan,
  saveWorkoutPlan,
  deleteWorkoutPlan,
  setActiveWorkoutPlan,
  renameWorkoutPlan,
  subscribeToPlannerUpdates,
} from '../lib/plannerStore';
import { createDefaultVegDietPlan, createDefaultWorkoutPlan } from '../lib/plannerLibrary';
import MealPlannerView from './MealPlannerView';
import WorkoutPlannerView from './WorkoutPlannerView';
import WeeklyTrackerCharts from './WeeklyTrackerCharts';
import WeeklyTrackerTable from './WeeklyTrackerTable';
import WeeklyTrackerModal from './WeeklyTrackerModal';
import PhotoCompareModal from './PhotoCompareModal';
import { ToastContainer, ToastMessage } from './Toast';
import PrivacyDataCenter from './PrivacyDataCenter';
import MedicalDisclaimer from './MedicalDisclaimer';

export default function UserProfilePage() {
  const {
    user,
    loading: authLoading,
    role,
    isAdmin,
    isPaid,
    syncCurrentMember,
    signInWithTestAccount,
    signIn,
    signOut,
    isConfigured,
  } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [onboardingRate, setOnboardingRate] = useState(0);
  const [signingInPreset, setSigningInPreset] = useState<string | null>(null);
  const isLive = isLiveProductionSite();
  const canShowTestProfiles = shouldShowTestProfiles();

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id, duration: toast.duration || 5000 }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Tabs in Profile
  const [profileActiveTab, setProfileActiveTab] = useState<
    'profile' | 'weekly-tracker' | 'meal-plan' | 'workout-plan' | 'privacy'
  >('profile');
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyTrackerEntry[]>([]);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [editingWeeklyEntry, setEditingWeeklyEntry] = useState<WeeklyTrackerEntry | null>(null);
  const [photoModalEntryId, setPhotoModalEntryId] = useState<string | null>(null);

  // Meal & Workout Planner State in Profile
  const [userMealPlans, setUserMealPlans] = useState<MealPlan[]>([]);
  const [activeMealPlanId, setActiveMealPlanId] = useState<string>('');
  const [userWorkoutPlans, setUserWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [activeWorkoutPlanId, setActiveWorkoutPlanId] = useState<string>('');

  useEffect(() => {
    if (user?.email) {
      setWeeklyEntries(loadUserWeeklyEntries(user.email));

      const syncPlanners = () => {
        const mPlans = loadUserMealPlans(user.email);
        setUserMealPlans(mPlans);
        setActiveMealPlanId((curr) => {
          if (curr && mPlans.some((p) => p.id === curr)) return curr;
          const activeM = getActiveMealPlan(user.email);
          return activeM ? activeM.id : (mPlans[0]?.id || '');
        });

        const wPlans = loadUserWorkoutPlans(user.email);
        setUserWorkoutPlans(wPlans);
        setActiveWorkoutPlanId((curr) => {
          if (curr && wPlans.some((p) => p.id === curr)) return curr;
          const activeW = getActiveWorkoutPlan(user.email);
          return activeW ? activeW.id : (wPlans[0]?.id || '');
        });
      };

      syncPlanners();
      const unsubscribe = subscribeToPlannerUpdates(syncPlanners);
      return () => unsubscribe();
    }
  }, [user?.email]);

  const handleSaveMealPlan = async (plan: MealPlan) => {
    if (!user?.email) return;
    try {
      const updated = await saveMealPlan(plan);
      setUserMealPlans(updated);
      setActiveMealPlanId(plan.id);
      addToast({
        type: 'success',
        title: 'Meal Plan Saved',
        message: `"${plan.name}" is updated in your profile.`,
        duration: 5000,
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save meal plan.',
        duration: 5000,
      });
    }
  };

  const handleCreateNewMealPlan = () => {
    if (!user?.email) return;
    const newPlan = createDefaultVegDietPlan(user.email, false);
    newPlan.id = `diet_custom_${Date.now()}`;
    newPlan.name = `Personal Diet Plan #${userMealPlans.length + 1}`;
    newPlan.createdBy = 'user';
    newPlan.coachName = undefined;
    newPlan.coachNotes = undefined;

    setUserMealPlans((prev) => [newPlan, ...prev]);
    setActiveMealPlanId(newPlan.id);
    addToast({
      type: 'info',
      title: 'New Meal Plan Created',
      message: 'Configure your target macros and meals.',
      duration: 5000,
    });
  };

  const handleSelectMealPlan = async (planId: string) => {
    setActiveMealPlanId(planId);
    if (user?.email) {
      const updated = await setActiveMealPlan(planId, user.email);
      setUserMealPlans(updated);
    }
  };

  const handleDeleteMealPlan = async (planId: string) => {
    if (!user?.email) return;
    if (userMealPlans.length <= 1) {
      addToast({
        type: 'error',
        title: 'Cannot Delete Only Plan',
        message: 'You need at least one active meal plan.',
        duration: 4000,
      });
      return;
    }
    const updated = await deleteMealPlan(planId, user.email);
    setUserMealPlans(updated);
    if (activeMealPlanId === planId) {
      setActiveMealPlanId(updated[0]?.id || '');
    }
    addToast({
      type: 'info',
      title: 'Plan Removed',
      message: 'Meal plan was deleted from your profile.',
      duration: 4000,
    });
  };

  const handleSaveWorkoutPlan = async (plan: WorkoutPlan) => {
    if (!user?.email) return;
    try {
      const updated = await saveWorkoutPlan(plan);
      setUserWorkoutPlans(updated);
      setActiveWorkoutPlanId(plan.id);
      addToast({
        type: 'success',
        title: 'Workout Routine Saved',
        message: `"${plan.name}" is updated in your profile.`,
        duration: 5000,
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save workout plan.',
        duration: 5000,
      });
    }
  };

  const handleCreateNewWorkoutPlan = () => {
    if (!user?.email) return;
    const newPlan = createDefaultWorkoutPlan(user.email, false);
    newPlan.id = `workout_custom_${Date.now()}`;
    newPlan.name = `Personal Training Split #${userWorkoutPlans.length + 1}`;
    newPlan.createdBy = 'user';
    newPlan.coachName = undefined;
    newPlan.coachNotes = undefined;

    setUserWorkoutPlans((prev) => [newPlan, ...prev]);
    setActiveWorkoutPlanId(newPlan.id);
    addToast({
      type: 'info',
      title: 'New Routine Created',
      message: 'Configure your workout days and exercises.',
      duration: 5000,
    });
  };

  const handleSelectWorkoutPlan = async (planId: string) => {
    setActiveWorkoutPlanId(planId);
    if (user?.email) {
      const updated = await setActiveWorkoutPlan(planId, user.email);
      setUserWorkoutPlans(updated);
    }
  };

  const handleDeleteWorkoutPlan = async (planId: string) => {
    if (!user?.email) return;
    if (userWorkoutPlans.length <= 1) {
      addToast({
        type: 'error',
        title: 'Cannot Delete Only Routine',
        message: 'You need at least one active workout routine.',
        duration: 4000,
      });
      return;
    }
    const updated = await deleteWorkoutPlan(planId, user.email);
    setUserWorkoutPlans(updated);
    if (activeWorkoutPlanId === planId) {
      setActiveWorkoutPlanId(updated[0]?.id || '');
    }
    addToast({
      type: 'info',
      title: 'Routine Removed',
      message: 'Workout routine was deleted from your profile.',
      duration: 4000,
    });
  };

  const handleDuplicateMealPlan = async (sourcePlan: MealPlan) => {
    if (!user?.email) return;
    const cloned: MealPlan = {
      ...JSON.parse(JSON.stringify(sourcePlan)),
      id: `diet_copy_${Date.now()}`,
      name: `${sourcePlan.name} (Copy)`,
      createdBy: 'user',
      coachName: undefined,
      coachNotes: undefined,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = await saveMealPlan(cloned);
    setUserMealPlans(updated);
    addToast({
      type: 'info',
      title: 'Meal Plan Cloned',
      message: `Created copy "${cloned.name}".`,
      duration: 4000,
    });
  };

  const handleDuplicateWorkoutPlan = async (sourcePlan: WorkoutPlan) => {
    if (!user?.email) return;
    const cloned: WorkoutPlan = {
      ...JSON.parse(JSON.stringify(sourcePlan)),
      id: `workout_copy_${Date.now()}`,
      name: `${sourcePlan.name} (Copy)`,
      createdBy: 'user',
      coachName: undefined,
      coachNotes: undefined,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = await saveWorkoutPlan(cloned);
    setUserWorkoutPlans(updated);
    addToast({
      type: 'info',
      title: 'Routine Cloned',
      message: `Created copy "${cloned.name}".`,
      duration: 4000,
    });
  };

  const handleRenameMealPlan = async (planId: string, newName: string) => {
    if (!user?.email) return;
    const updated = await renameMealPlan(planId, newName, user.email);
    setUserMealPlans(updated);
    addToast({
      type: 'success',
      title: 'Meal Plan Renamed',
      message: `Plan renamed to "${newName}".`,
      duration: 3000,
    });
  };

  const handleRenameWorkoutPlan = async (planId: string, newName: string) => {
    if (!user?.email) return;
    const updated = await renameWorkoutPlan(planId, newName, user.email);
    setUserWorkoutPlans(updated);
    addToast({
      type: 'success',
      title: 'Workout Routine Renamed',
      message: `Routine renamed to "${newName}".`,
      duration: 3000,
    });
  };

  const handleSaveWeeklyEntry = async (entry: WeeklyTrackerEntry) => {
    if (!user?.email) return;
    try {
      const updated = await saveWeeklyEntry(entry, user.email);
      setWeeklyEntries(updated);
      setEditingWeeklyEntry(null);
      addToast({
        type: 'success',
        title: 'Check-in Saved',
        message: `Week ${entry.weekNumber} metrics have been recorded.`,
        duration: 5000,
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

  const handleDeleteWeeklyEntry = async (entryId: string) => {
    if (!user?.email) return;
    try {
      const updated = await deleteWeeklyEntry(entryId, user.email, user.email);
      setWeeklyEntries(updated);
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

  // Sync with logged-in user details and Supabase
  useEffect(() => {
    if (authLoading || !user) return;

    const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const nameParts = googleName.trim().split(' ');
    const firstFromGoogle = nameParts[0] || '';
    const lastFromGoogle = nameParts.slice(1).join(' ') || '';

    const loaded = loadUserProfile(user.id || user.email, {
      email: user.email || '',
      firstName: firstFromGoogle,
      lastName: lastFromGoogle,
    });
    setProfile(loaded);

    // Also fetch latest profile data from Supabase
    loadProfileFromSupabase(user.id || user.email).then((remoteProfile) => {
      if (remoteProfile) {
        setProfile((prev) => ({
          ...prev,
          ...remoteProfile,
          email: remoteProfile.email || prev.email || user.email || '',
        }));
      }
    });

    const onboarding = loadClientOnboarding(user.id || user.email);
    setOnboardingRate(getOnboardingCompletionRate(onboarding));
  }, [user, authLoading]);

  const handleTestSignIn = async (presetId: string, role?: UserRole) => {
    try {
      setSigningInPreset(presetId);
      await signInWithTestAccount(presetId, role);
    } catch (err) {
      console.error(err);
    } finally {
      setSigningInPreset(null);
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate age if DOB is provided
      if (field === 'dateOfBirth' && value) {
        try {
          const birthDate = new Date(value);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age > 0 && age < 120) {
            updated.age = String(age);
          }
        } catch {
          // ignore
        }
      }
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    try {
      // 1. Immediately cache in local storage
      saveUserProfile(profile, user.id || user.email);

      // 2. Persist directly to Supabase
      await saveProfileToSupabase(profile, user.id || user.email);

      // 3. Sync to member directory
      await syncCurrentMember({ profile });

      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile changes have been saved successfully.',
        duration: 5000,
      });
    } catch (err: any) {
      console.error('Error saving profile:', err);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Unable to save profile changes. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If not signed in, show a dedicated welcoming sign-in screen right on this page
  if (!user) {
    return (
      <div className="min-h-screen bg-natural-oat py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-7 sm:p-9 border border-brand-light-green shadow-lg text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-brand-light-green text-brand-dark-green flex items-center justify-center mx-auto shadow-xs border border-brand-green/30">
              <Lock className="w-8 h-8 text-brand-green" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-light-green text-brand-dark-green border border-brand-green/20">
                Authentication Required
              </span>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Sign In to View Your Health Profile
              </h1>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                Your profile holds your personal metrics, emergency contacts, physical baselines, and intake questionnaire. Choose an account below to sign in instantly.
              </p>
            </div>

            {/* Primary Google Sign-in */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={async () => {
                  if (isConfigured) {
                    await signIn();
                  } else {
                    await handleTestSignIn('admin');
                  }
                }}
                className="w-full flex items-center justify-center space-x-2.5 py-3.5 px-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold shadow-xs transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isConfigured ? 'Continue with Google' : 'Sign In as Super Admin'}</span>
              </button>
            </div>

            {/* 1-Click Instant Test Accounts (Dev/Preview Only) */}
            {canShowTestProfiles && (
              <div className="pt-3 border-t border-gray-100 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Instant 1-Click Testing Accounts (Dev Only)
                  </span>
                  <span className="text-[11px] text-gray-400">1 click to log in</span>
                </div>

                <div className="space-y-2.5">
                  {TEST_USER_PRESETS.map((preset) => {
                    const isPresetAdmin = preset.role === 'admin';
                    const isPresetPaid = preset.role === 'paid';
                    const isBusy = signingInPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={Boolean(signingInPreset)}
                        onClick={() => handleTestSignIn(preset.id, preset.role)}
                        className="w-full p-4 rounded-2xl border border-gray-200 hover:border-brand-green bg-gray-50/80 hover:bg-emerald-50/40 transition-all text-left flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs group cursor-pointer"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <img
                            src={preset.avatarUrl}
                            alt={preset.name}
                            className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-white shadow-xs"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-gray-900 group-hover:text-brand-dark-green truncate">
                                {preset.name}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isPresetAdmin
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : isPresetPaid
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                                }`}
                              >
                                {preset.badge}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{preset.email}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{preset.description}</p>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 group-hover:border-brand-green group-hover:bg-brand-green group-hover:text-white flex items-center justify-center shrink-0 text-gray-400 transition-colors shadow-2xs">
                          {isBusy ? (
                            <div className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link
                to="/"
                className="inline-block text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                ← Back to Fitkode Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completionRate = getProfileCompletionRate(profile);
  const googlePhoto = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Valued Member';

  return (
    <div className="min-h-screen bg-natural-oat py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Super Admin Notice Banner if Admin */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">You have Super Admin Privileges</p>
                <p className="text-xs text-purple-200/80">
                  As an administrator, you can inspect all logged-in members, their 70-question onboarding questionnaires, and edit roles.
                </p>
              </div>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center space-x-1.5 py-2.5 px-4 rounded-xl bg-white text-purple-900 hover:bg-purple-50 font-bold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <span>Open Member Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-light-green shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4 sm:space-x-5">
              <div className="relative shrink-0">
                {googlePhoto ? (
                  <img
                    src={googlePhoto}
                    alt={fullName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-brand-light-green"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-light-green text-brand-green flex items-center justify-center font-bold text-2xl">
                    {(fullName[0] || 'U').toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-white">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{fullName}</h1>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isAdmin
                        ? 'bg-purple-100 text-purple-800'
                        : isPaid
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isAdmin ? 'Super Admin' : isPaid ? 'Paid Member' : 'Free Member'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 flex items-center mt-1">
                  <Mail className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {profile.email || user?.email}
                </p>
                <p className="text-xs text-brand-green font-medium mt-1">
                  Fitkode Member ID: {user?.id ? user.id.slice(0, 10).toUpperCase() : 'FK-MEMBER'}
                </p>
              </div>
            </div>

            {/* Profile Completion Bar */}
            <div className="bg-natural-oat/70 rounded-2xl p-4 border border-brand-light-green/80 min-w-[240px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-gray-700">Profile Completion</span>
                <span className="text-xs font-bold text-brand-green">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-green h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                Keep your baseline profile accurate so our coaches can support you effectively.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Navigation Tabs: Profile vs. Weekly Health Tracker vs. Meal Plan vs. Workout Plan vs. Privacy & Data */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-white p-2 rounded-3xl border border-brand-light-green shadow-xs">
          <button
            type="button"
            onClick={() => setProfileActiveTab('profile')}
            className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              profileActiveTab === 'profile'
                ? 'bg-brand-green text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate">Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileActiveTab('weekly-tracker')}
            className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              profileActiveTab === 'weekly-tracker'
                ? 'bg-brand-green text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span className="truncate">Weekly Tracker ({weeklyEntries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setProfileActiveTab('meal-plan')}
            className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              profileActiveTab === 'meal-plan'
                ? 'bg-brand-green text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Utensils className="w-4 h-4 shrink-0" />
            <span className="truncate">Meal Plan</span>
            {userMealPlans.some((p) => p.createdBy === 'coach') && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                profileActiveTab === 'meal-plan' ? 'bg-white text-brand-dark-green' : 'bg-purple-100 text-purple-800'
              }`}>
                Coach
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setProfileActiveTab('workout-plan')}
            className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              profileActiveTab === 'workout-plan'
                ? 'bg-brand-green text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Dumbbell className="w-4 h-4 shrink-0" />
            <span className="truncate">Workout Plan</span>
            {userWorkoutPlans.some((p) => p.createdBy === 'coach') && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                profileActiveTab === 'workout-plan' ? 'bg-white text-brand-dark-green' : 'bg-purple-100 text-purple-800'
              }`}>
                Coach
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setProfileActiveTab('privacy')}
            className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              profileActiveTab === 'privacy'
                ? 'bg-brand-green text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span className="truncate">Privacy &amp; Data</span>
            {profile.isConsentWithdrawn && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase bg-amber-100 text-amber-800">
                Paused
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PERSONAL PROFILE & BASELINE */}
        {/* ========================================================================= */}
        {profileActiveTab === 'profile' && (
          <div className="space-y-8">
            
            {/* DPDPA 2023 Consent & Privacy Quick Bar */}
            <div className="bg-white rounded-3xl p-5 border border-brand-light-green shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-brand-light-green text-brand-dark-green shrink-0">
                  <Shield className="w-5 h-5 text-brand-green" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">DPDPA 2023 Health Data Privacy</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        profile.healthDataConsent && !profile.isConsentWithdrawn
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {profile.healthDataConsent && !profile.isConsentWithdrawn ? 'Consent Active' : 'Consent Withdrawn'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Your metrics and progress logs are confidential. You hold full statutory rights to export, withdraw consent, or erase your records.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProfileActiveTab('privacy')}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-gray-100 hover:bg-brand-light-green hover:text-brand-dark-green text-gray-700 font-bold text-xs transition-colors shrink-0 cursor-pointer"
              >
                <span>Privacy &amp; Data Center &rarr;</span>
              </button>
            </div>

            {/* Weekly Health Tracker Spotlight Widget in Profile */}
            <div className="bg-white rounded-3xl p-6 border border-brand-light-green shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-light-green text-brand-dark-green">
                    Weekly Health Statistics
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {weeklyEntries.length} check-ins recorded
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Track Your Weight, Body Stats & Photos Week-by-Week
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Log your morning empty-stomach weight, body circumferences (waist, hips, chest, neck, quads, arm), and photos. Visible only to you and Super Admin Chinmay.
                </p>

                {weeklyEntries.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span className="bg-gray-100 text-gray-800 font-bold px-2.5 py-1 rounded-xl">
                      Latest Weight: <strong>{weeklyEntries[weeklyEntries.length - 1].weightKg} kg</strong>
                    </span>
                    <span className="bg-gray-100 text-gray-800 font-bold px-2.5 py-1 rounded-xl">
                      Waist: <strong>{weeklyEntries[weeklyEntries.length - 1].waistInches}"</strong>
                    </span>
                    <span className="bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded-xl">
                      Steps: <strong>{weeklyEntries[weeklyEntries.length - 1].avgStepsPerDay.toLocaleString()} /day</strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingWeeklyEntry(null);
                    setIsWeeklyModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Weekly Check-in</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileActiveTab('weekly-tracker')}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:border-brand-green text-gray-700 hover:text-brand-green text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Activity className="w-4 h-4" />
                  <span>View Trends & Table</span>
                </button>
              </div>
            </div>

            {/* Meal & Workout Plan Spotlight in Profile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meal Plan Card */}
              <div className="bg-white rounded-3xl p-5 border border-brand-light-green shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-brand-light-green/60 text-brand-dark-green">
                      <Utensils className="w-4 h-4" />
                    </span>
                    {userMealPlans.find((p) => p.id === activeMealPlanId)?.createdBy === 'coach' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-900 border border-purple-200">
                        <ShieldCheck className="w-3 h-3 mr-1 text-purple-700" />
                        Coach Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Self-Created
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900">
                    {userMealPlans.find((p) => p.id === activeMealPlanId)?.name || 'Custom Meal Plan'}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {userMealPlans.find((p) => p.id === activeMealPlanId)?.coachNotes ||
                      'Interactive daily nutrition schedule with calibrated macros and calories.'}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-gray-700 font-semibold pt-1">
                    <span className="text-amber-700">
                      🎯 {userMealPlans.find((p) => p.id === activeMealPlanId)?.targetCalories || 2000} kcal
                    </span>
                    <span className="text-emerald-700">
                      🥩 {userMealPlans.find((p) => p.id === activeMealPlanId)?.targetProtein || 140}g Protein
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setProfileActiveTab('meal-plan')}
                    className="flex-1 py-2 px-3 rounded-xl bg-brand-light-green/80 hover:bg-brand-light-green text-brand-dark-green text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Open Meal Planner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    to="/meal-planner"
                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                    title="Open Fullscreen View"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Workout Plan Card */}
              <div className="bg-white rounded-3xl p-5 border border-brand-light-green shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-purple-100 text-purple-900">
                      <Dumbbell className="w-4 h-4" />
                    </span>
                    {userWorkoutPlans.find((p) => p.id === activeWorkoutPlanId)?.createdBy === 'coach' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-900 border border-purple-200">
                        <ShieldCheck className="w-3 h-3 mr-1 text-purple-700" />
                        Coach Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Self-Created
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900">
                    {userWorkoutPlans.find((p) => p.id === activeWorkoutPlanId)?.name || 'Custom Workout Plan'}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {userWorkoutPlans.find((p) => p.id === activeWorkoutPlanId)?.coachNotes ||
                      'Resistance training routine with targeted sets, reps, and exercise cues.'}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-gray-700 font-semibold pt-1">
                    <span className="text-purple-800">
                      🏋️ {userWorkoutPlans.find((p) => p.id === activeWorkoutPlanId)?.days.length || 4} Days Split
                    </span>
                    <span className="text-blue-800">
                      ⚡ {userWorkoutPlans.find((p) => p.id === activeWorkoutPlanId)?.difficulty || 'Intermediate'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setProfileActiveTab('workout-plan')}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Open Workout Planner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    to="/workout-planner"
                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                    title="Open Fullscreen View"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Client Onboarding Banner (Highlighting the separate form) */}
            <div className="bg-gradient-to-r from-brand-dark-green to-brand-green text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Client Onboarding Form</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Health & Nutrition Assessment Questionnaire
                  </h2>
                  <p className="text-xs sm:text-sm text-brand-light-green/90 leading-relaxed">
                    Complete our structured 5-section health evaluation (Dietary habits, digestive health, body measurements, medical history, and symptom ratings) to customize your nutrition and fitness plans.
                  </p>
                  <div className="flex items-center space-x-3 pt-1">
                    <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-lg">
                      {onboardingRate === 100
                        ? 'Assessment Complete (100%)'
                        : onboardingRate > 0
                        ? `In Progress (${onboardingRate}%)`
                        : 'Not Started (0%)'}
                    </span>
                  </div>
                </div>

                <Link
                  to="/onboarding"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white text-brand-dark-green hover:bg-brand-light-green font-bold text-sm shadow-md transition-all shrink-0 group"
                >
                  <span>{onboardingRate > 0 ? 'Review / Continue Assessment' : 'Start Onboarding Form'}</span>
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

        {/* Profile Information Form */}
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-light-green shadow-sm space-y-8">
          
          {/* Form Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <User className="w-5 h-5 text-brand-green mr-2" />
                Personal Profile Details
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Update your contact details, demographic background, and medical baseline.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </button>
          </div>

          {/* Section 1: Identity & Demographics */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center text-brand-green">
              <span className="w-2 h-2 rounded-full bg-brand-green mr-2"></span>
              1. Basic Identity & Demographics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                  placeholder="e.g. Chinmay"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                  placeholder="e.g. Jain"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-brand-green text-gray-700"
                  placeholder="name@domain.com"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={profile.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Age (Years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="10"
                  max="110"
                  required
                  value={profile.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                  placeholder="e.g. 28"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={profile.gender}
                  onChange={(e) => handleChange('gender', e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Blood Group <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={profile.bloodGroup}
                  onChange={(e) => handleChange('bloodGroup', e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="Don't know">Don't know</option>
                </select>
              </div>

              {/* Primary Health Goal */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Primary Health Goal
                </label>
                <select
                  value={profile.healthGoal || ''}
                  onChange={(e) => handleChange('healthGoal' as any, e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                >
                  <option value="">Select Target Goal</option>
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Weight Gain">Weight Gain</option>
                  <option value="Bodybuilding with Aesthetics">Bodybuilding with Aesthetics</option>
                  <option value="Powerlifting">Powerlifting</option>
                  <option value="Sports Specific Performance Enhancement">Sports Specific Performance Enhancement</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Marital Status <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={profile.maritalStatus}
                  onChange={(e) => handleChange('maritalStatus', e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                >
                  <option value="">Select Status</option>
                  <option value="Married">Married</option>
                  <option value="Unmarried">Unmarried</option>
                </select>
              </div>

              {/* Children */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Children? <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={profile.children}
                  onChange={(e) => handleChange('children', e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                >
                  <option value="">Select Option</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Not Applicable">Not Applicable</option>
                </select>
              </div>

              {/* Pregnancy (if female) */}
              {profile.gender === 'Female' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Are you pregnant? <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={profile.isPregnant}
                    onChange={(e) => handleChange('isPregnant', e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="Not applicable">Not applicable</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center text-brand-green">
              <span className="w-2 h-2 rounded-full bg-brand-green mr-2"></span>
              2. Contact & Address Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* Phone (WhatsApp) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone number (Preferably WhatsApp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={profile.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Alternate Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alternate Contact Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={profile.alternatePhone || ''}
                    onChange={(e) => handleChange('alternatePhone', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                    placeholder="Optional secondary phone"
                  />
                </div>
              </div>

              {/* Preferred Contact Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Preferred Contact Method <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={profile.preferredContact}
                  onChange={(e) => handleChange('preferredContact', e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                >
                  <option value="Whatsapp Audio/Video/Message">WhatsApp Audio / Video / Message</option>
                  <option value="Phone call">Phone Call</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              {/* Street Address */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={profile.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                    placeholder="Flat / House no, Building name, Street"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                  placeholder="e.g. Mumbai"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                  placeholder="e.g. Maharashtra"
                />
              </div>

              {/* Zipcode */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Zipcode / PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.zipcode}
                  onChange={(e) => handleChange('zipcode', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                  placeholder="e.g. 400001"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Household & Healthcare Baseline */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center text-brand-green">
              <span className="w-2 h-2 rounded-full bg-brand-green mr-2"></span>
              3. Household & Health Care Baseline
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* With whom do you live */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  With whom do you live? <span className="text-red-500">*</span>
                  <span className="block text-[11px] font-normal text-gray-500">
                    Include children, parents, relatives, or friends with ages (e.g. Sarah, age 7, sister; spouse, age 32)
                  </span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={profile.livingWith}
                  onChange={(e) => handleChange('livingWith', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all resize-none"
                  placeholder="e.g. Spouse (age 30), daughter (age 4), parents"
                />
              </div>

              {/* Primary Care Provider */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Primary Care Provider (Family Doctor)
                </label>
                <div className="relative">
                  <Stethoscope className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={profile.primaryCareProvider}
                    onChange={(e) => handleChange('primaryCareProvider', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                    placeholder="Doctor name / Clinic (Optional)"
                  />
                </div>
              </div>

              {/* Date of Last Full Body Checkup */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date of Last Full Body Checkup <span className="text-xs font-normal text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={profile.lastCheckupDate}
                    onChange={(e) => handleChange('lastCheckupDate', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Save & Next Step Controls */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>

            <Link
              to="/onboarding"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold transition-all flex items-center justify-center"
            >
              <span>Onboarding Form</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

        </form>

        {/* Standardized Non-Medical & Coaching Disclaimer */}
        <MedicalDisclaimer variant="card" className="mt-8" />
      </div>
    )}

    {/* ========================================================================= */}
    {/* TAB 2: WEEKLY HEALTH TRACKER & BODY STATS */}
    {/* ========================================================================= */}
    {profileActiveTab === 'weekly-tracker' && (
      <div className="space-y-8 animate-in fade-in duration-200">
        
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
                Your body measurements, weight progression, and transformation photos are visible <strong>solely to you</strong> and <strong>Super Admin Chinmay</strong>. No other members can ever view your records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingWeeklyEntry(null);
              setIsWeeklyModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center space-x-2 cursor-pointer self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Weekly Check-in</span>
          </button>
        </div>

        {/* Graphical Section */}
        <WeeklyTrackerCharts entries={weeklyEntries} />

        {/* Tabular Section (Reverse Chronological Order) */}
        <WeeklyTrackerTable
          entries={weeklyEntries}
          onEdit={(entry) => {
            setEditingWeeklyEntry(entry);
            setIsWeeklyModalOpen(true);
          }}
          onDelete={handleDeleteWeeklyEntry}
          onViewPhotos={(id) => setPhotoModalEntryId(id)}
        />
      </div>
    )}

    {/* ========================================================================= */}
    {/* TAB 3: MEAL PLAN & NUTRITION */}
    {/* ========================================================================= */}
    {profileActiveTab === 'meal-plan' && (
      <div className="space-y-6 animate-in fade-in duration-200">
        <MealPlannerView
          currentPlan={userMealPlans.find((p) => p.id === activeMealPlanId) || userMealPlans[0] || null}
          allPlans={userMealPlans}
          userEmail={user?.email || profile.email || 'member@fitkode.ai'}
          userName={
            profile.firstName
              ? `${profile.firstName} ${profile.lastName || ''}`.trim()
              : user?.email?.split('@')[0] || 'Member'
          }
          isCoachMode={false}
          onSavePlan={handleSaveMealPlan}
          onSelectPlan={handleSelectMealPlan}
          onSetActivePlan={handleSelectMealPlan}
          onCreateNewPlan={handleCreateNewMealPlan}
          onDeletePlan={handleDeleteMealPlan}
          onDuplicatePlan={handleDuplicateMealPlan}
          onRenamePlan={handleRenameMealPlan}
        />
      </div>
    )}

    {/* ========================================================================= */}
    {/* TAB 4: WORKOUT & TRAINING REGIMEN */}
    {/* ========================================================================= */}
    {profileActiveTab === 'workout-plan' && (
      <div className="space-y-6 animate-in fade-in duration-200">
        <WorkoutPlannerView
          currentPlan={userWorkoutPlans.find((p) => p.id === activeWorkoutPlanId) || userWorkoutPlans[0] || null}
          allPlans={userWorkoutPlans}
          userEmail={user?.email || profile.email || 'member@fitkode.ai'}
          userName={
            profile.firstName
              ? `${profile.firstName} ${profile.lastName || ''}`.trim()
              : user?.email?.split('@')[0] || 'Member'
          }
          isCoachMode={false}
          onSavePlan={handleSaveWorkoutPlan}
          onSelectPlan={handleSelectWorkoutPlan}
          onSetActivePlan={handleSelectWorkoutPlan}
          onCreateNewPlan={handleCreateNewWorkoutPlan}
          onDeletePlan={handleDeleteWorkoutPlan}
          onDuplicatePlan={handleDuplicateWorkoutPlan}
          onRenamePlan={handleRenameWorkoutPlan}
        />
      </div>
    )}

    {/* ========================================================================= */}
    {/* TAB 5: DPDPA 2023 PRIVACY & DATA CONTROL CENTER */}
    {/* ========================================================================= */}
    {profileActiveTab === 'privacy' && (
      <PrivacyDataCenter
        userIdOrEmail={user?.id || user?.email || profile.email || 'member'}
        userEmail={user?.email || profile.email || ''}
        profile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
          saveUserProfile(updated, user?.id || user?.email);
          saveProfileToSupabase(updated, user?.id || user?.email);
          syncCurrentMember({ profile: updated });
        }}
        addToast={addToast}
        signOut={signOut}
      />
    )}

    {/* Weekly Intake Modal */}
    {isWeeklyModalOpen && (
      <WeeklyTrackerModal
        existingEntry={editingWeeklyEntry}
        defaultEmail={user?.email || profile.email || ''}
        defaultFirstName={profile.firstName || ''}
        defaultLastName={profile.lastName || ''}
        suggestedWeekNumber={weeklyEntries.length + 1}
        allEntries={weeklyEntries}
        onSave={handleSaveWeeklyEntry}
        onClose={() => {
          setIsWeeklyModalOpen(false);
          setEditingWeeklyEntry(null);
        }}
      />
    )}

    {/* Progression Photo Modal */}
    {photoModalEntryId && (
      <PhotoCompareModal
        entries={weeklyEntries}
        initialEntryId={photoModalEntryId}
        onClose={() => setPhotoModalEntryId(null)}
      />
    )}

      </div>
    </div>
  );
}
