import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Utensils,
  Activity,
  Ruler,
  FileHeart,
  Pill,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Save,
  ArrowLeft,
  Sparkles,
  Info,
  Shield,
  Lock,
  ArrowRight,
  Target,
  HeartPulse,
} from 'lucide-react';
import { useAuth, TEST_USER_PRESETS } from '../context/AuthContext';
import { isLiveProductionSite, shouldShowTestProfiles } from '../lib/environment';
import {
  saveOnboardingToSupabase,
  loadOnboardingFromSupabase,
} from '../lib/supabase';
import {
  loadClientOnboarding,
  saveClientOnboarding,
  loadUserProfile,
  saveUserProfile,
} from '../lib/profileStorage';
import { ClientOnboarding, UserRole } from '../types';
import { GoalsReadinessSection } from './onboarding/GoalsReadinessSection';
import { LifestyleHabitsSection } from './onboarding/LifestyleHabitsSection';
import { ToastContainer, ToastMessage } from './Toast';
import MedicalDisclaimer from './MedicalDisclaimer';

export default function ClientOnboardingPage() {
  const {
    user,
    loading: authLoading,
    isAdmin,
    syncCurrentMember,
    signInWithTestAccount,
    signIn,
    isConfigured,
  } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<number>(1);
  const [formData, setFormData] = useState<ClientOnboarding>(() => loadClientOnboarding());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [submittedMessage, setSubmittedMessage] = useState(false);
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

  useEffect(() => {
    if (authLoading || !user) return;
    const saved = loadClientOnboarding(user.id || user.email);
    setFormData(saved);

    // Also fetch latest onboarding from Supabase if available
    loadOnboardingFromSupabase(user.id || user.email).then((remoteData) => {
      if (remoteData) {
        setFormData((prev) => ({
          ...prev,
          ...remoteData,
        }));
      }
    });
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

  const handleFieldChange = (field: keyof ClientOnboarding, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleArrayItem = (field: keyof ClientOnboarding, item: string) => {
    setFormData((prev) => {
      const currentList = Array.isArray(prev[field]) ? (prev[field] as string[]) : [];
      const exists = currentList.includes(item);
      const updated = exists
        ? currentList.filter((x) => x !== item)
        : [...currentList, item];
      return { ...prev, [field]: updated };
    });
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    try {
      saveClientOnboarding(formData, user.id || user.email);
      saveOnboardingToSupabase(formData, user.id || user.email);
      syncCurrentMember({ onboarding: formData });
      addToast({
        type: 'success',
        title: 'Draft Saved',
        message: 'Your assessment progress has been saved.',
        duration: 4000,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Unable to save draft progress. Please try again.',
        duration: 5000,
      });
    }
  };

  const handleNextSection = () => {
    if (!user) return;
    const completed = Array.from(new Set([...formData.completedSections, activeTab]));
    const updated = { ...formData, completedSections: completed };
    setFormData(updated);
    saveClientOnboarding(updated, user.id || user.email);
    saveOnboardingToSupabase(updated, user.id || user.email);
    syncCurrentMember({ onboarding: updated });

    if (activeTab < 7) {
      setActiveTab((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addToast({
        type: 'success',
        title: 'Section Saved',
        message: `Section ${activeTab} completed and saved.`,
        duration: 3500,
      });
    } else {
      // Final Submit: Validate mandatory DPDPA health data processing consent
      if (!formData.healthDataConsent) {
        addToast({
          type: 'error',
          title: 'Mandatory Consent Required',
          message: 'Under India\'s DPDPA 2023, explicit consent to process health and dietary metrics is mandatory before submitting.',
          duration: 6000,
        });
        return;
      }

      const consentTime = new Date().toISOString();
      const submitted = {
        ...updated,
        isSubmitted: true,
        healthDataConsent: true,
        healthDataConsentGivenAt: formData.healthDataConsentGivenAt || consentTime,
        notificationsConsent: Boolean(formData.notificationsConsent),
        notificationsConsentGivenAt: formData.notificationsConsent
          ? (formData.notificationsConsentGivenAt || consentTime)
          : undefined,
        isConsentWithdrawn: false,
      };

      setFormData(submitted);
      saveClientOnboarding(submitted, user.id || user.email);
      saveOnboardingToSupabase(submitted, user.id || user.email);

      // Sync consent to User Profile
      try {
        const currProfile = loadUserProfile(user.id || user.email);
        saveUserProfile(
          {
            ...currProfile,
            healthDataConsent: true,
            healthDataConsentGivenAt: submitted.healthDataConsentGivenAt,
            notificationsConsent: submitted.notificationsConsent,
            notificationsConsentGivenAt: submitted.notificationsConsentGivenAt,
            isConsentWithdrawn: false,
          },
          user.id || user.email
        );
      } catch {
        // ignore
      }

      syncCurrentMember({ onboarding: submitted });
      setSubmittedMessage(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addToast({
        type: 'success',
        title: 'Assessment Submitted',
        message: 'Your health intake and DPDPA consent have been successfully registered.',
        duration: 5000,
      });
    }
  };

  const handlePrevSection = () => {
    if (activeTab > 1) {
      setActiveTab((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 1, title: 'Goals & Readiness', subtitle: 'Target goal & commitment scale', icon: Target },
    { id: 2, title: 'Lifestyle & Habits', subtitle: 'Movement, sleep & stress baseline', icon: HeartPulse },
    { id: 3, title: 'Diet & Nutrition', subtitle: 'Food habits & meal patterns', icon: Utensils },
    { id: 4, title: 'Digestive Health', subtitle: 'Gut health & symptom frequency', icon: Activity },
    { id: 5, title: 'Body Measurements', subtitle: 'Weight, height & tape inches', icon: Ruler },
    { id: 6, title: 'Medical History', subtitle: 'Family, vitals & surgeries', icon: FileHeart },
    { id: 7, title: 'Symptoms & Meds', subtitle: 'Severity scale & current meds', icon: Pill },
  ];

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not signed in, show sign in options right on this page
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
                Client Health & Intake Dossier
              </h1>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                Sign in to complete or review your comprehensive 70-point health and nutrition evaluation form.
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

  return (
    <div className="min-h-screen bg-natural-oat py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="max-w-5xl mx-auto space-y-6">

        {/* Back link and title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              to="/profile"
              className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-brand-green mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to My Profile
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Client Health & Nutrition Assessment
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Based on our 70-point new client health evaluation. Save your progress anytime.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-xs font-bold text-purple-900 shadow-xs transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-purple-700" />
                <span>Admin Directory</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Draft
            </button>
            <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-brand-light-green text-brand-dark-green border border-brand-green/30">
              Section {activeTab} of 7
            </span>
          </div>
        </div>

        {/* DPDPA 2023 Statutory Privacy & Health Data Notice Banner */}
        <div className="bg-white rounded-2xl p-4 border border-brand-light-green shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              <Shield className="w-4 h-4 text-emerald-700" />
            </span>
            <div>
              <span className="font-bold text-gray-900 block">
                Digital Personal Data Protection (DPDPA 2023) Notice
              </span>
              <p className="text-[11px] text-gray-600">
                Fitkode collects physical metrics and dietary baselines solely for tailored fitness coaching. You retain full rights to download, withdraw consent, or erase your data anytime.
              </p>
            </div>
          </div>
          <Link
            to="/privacy-policy"
            className="text-xs font-bold text-brand-green hover:underline whitespace-nowrap self-start sm:self-auto"
          >
            Privacy Policy &rarr;
          </Link>
        </div>

        {/* Submission Success Banner */}
        {submittedMessage && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start space-x-4 animate-in fade-in">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base font-bold text-emerald-900">
                Assessment Successfully Submitted!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-700 mt-1 leading-relaxed">
                Thank you! Your health and nutrition data has been saved. Your assigned coach will review these details to formulate your customized dietary recommendations and workout program.
              </p>
              <div className="mt-4 flex items-center space-x-3">
                <Link
                  to="/profile"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  Return to Profile
                </Link>
                <Link
                  to="/coaching-plans"
                  className="px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-bold transition-colors"
                >
                  Explore Coaching Plans
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Section Navigation Tabs / Progress Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-white p-2 rounded-2xl border border-brand-light-green shadow-xs">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            const isDone = formData.completedSections.includes(sec.id);

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveTab(sec.id)}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-brand-green text-white shadow-sm'
                    : isDone
                    ? 'bg-emerald-50/70 text-gray-800 hover:bg-emerald-50'
                    : 'hover:bg-natural-oat text-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isDone ? 'text-emerald-600' : 'text-gray-400'}`} />
                  {isDone ? (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  ) : (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {sec.id}
                    </span>
                  )}
                </div>
                <div>
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {sec.title}
                  </p>
                  <p className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                    {sec.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Form Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-light-green shadow-sm space-y-8">

          {/* ========================================================= */}
          {/* SECTION 1: GOALS & READINESS ASSESSMENT (Google Form Q5-Q18) */}
          {/* ========================================================= */}
          {activeTab === 1 && (
            <GoalsReadinessSection
              formData={formData}
              onFieldChange={handleFieldChange}
            />
          )}

          {/* ========================================================= */}
          {/* SECTION 2: LIFESTYLE, PHYSICAL ACTIVITY & STRESS (Q19-Q38) */}
          {/* ========================================================= */}
          {activeTab === 2 && (
            <LifestyleHabitsSection
              formData={formData}
              onFieldChange={handleFieldChange}
              onToggleArray={toggleArrayItem}
            />
          )}

          {/* ========================================================= */}
          {/* SECTION 3: DIETARY HABITS & FOOD PREFERENCES */}
          {/* ========================================================= */}
          {activeTab === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Utensils className="w-5 h-5 text-brand-green mr-2" />
                  3. Dietary Preferences & Nutrition Patterns
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Tell us about your daily meals, food cravings, beverage intake, and cooking setup.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Food Allergies */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Allergic to any food items? (If yes please mention, else &quot;Not applicable&quot;) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.foodAllergies}
                    onChange={(e) => handleFieldChange('foodAllergies', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. Peanuts, lactose, shellfish, or Not applicable"
                  />
                </div>

                {/* Disliked Foods */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Which foods do you dislike? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dislikedFoods}
                    onChange={(e) => handleFieldChange('dislikedFoods', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. Karela, eggplant, mushrooms, etc."
                  />
                </div>

                {/* Who cooks food */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Who cooks food for you? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.whoCooks}
                    onChange={(e) => handleFieldChange('whoCooks', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
                  >
                    <option value="Myself">Myself</option>
                    <option value="Maid">Cook / Maid</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Mother">Mother / Family</option>
                    <option value="Other">Other / Outside</option>
                  </select>
                </div>

                {/* Cooking difficulty */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Do you find cooking difficult? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-4 pt-2">
                    <label className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="cookingDifficulty"
                        checked={formData.cookingDifficulty === 'yes'}
                        onChange={() => handleFieldChange('cookingDifficulty', 'yes')}
                        className="text-brand-green focus:ring-brand-green"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="cookingDifficulty"
                        checked={formData.cookingDifficulty === 'no'}
                        onChange={() => handleFieldChange('cookingDifficulty', 'no')}
                        className="text-brand-green focus:ring-brand-green"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {/* Diet Preferences (Multi-select) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    What kind of diet do you prefer? (Select all that apply) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Vegetarian', 'Eggitarian', 'Vegan', 'Non-veg', 'Jain Diet', 'Keto', 'Other'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleArrayItem('dietPreferences', d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          formData.dietPreferences.includes(d)
                            ? 'bg-brand-light-green text-brand-dark-green border-brand-green'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current specific diet */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Are you following any specific diet currently? (Select all that apply) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['None', 'Low Fat', 'Gluten free', 'No dairy', 'Low Carb', 'High protein', 'Low Sodium', 'Diabetic', 'Other'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleArrayItem('currentSpecificDiet', d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          formData.currentSpecificDiet.includes(d)
                            ? 'bg-brand-light-green text-brand-dark-green border-brand-green'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily Beverages */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    What is your daily beverage of choice? (Select all that apply) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Milk tea', 'Green Tea', 'Milk Coffee', 'Black Coffee', 'Juice Packaged', 'Juice Fresh', 'Milk', 'Soda', 'Others'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleArrayItem('dailyBeverageOfChoice', b)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          formData.dailyBeverageOfChoice.includes(b)
                            ? 'bg-brand-light-green text-brand-dark-green border-brand-green'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Snacks with Tea/Coffee */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Snacks with Tea/Coffee? (If yes, what do you usually have?) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.beverageSnacks}
                    onChange={(e) => handleFieldChange('beverageSnacks', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. Biscuits, rusk, namkeen, or None"
                  />
                </div>

                {/* Beverage Frequency & Quantity */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Daily Frequency & estimated quantity of favorite beverage(s) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.beverageFrequencyQuantity}
                    onChange={(e) => handleFieldChange('beverageFrequencyQuantity', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. 2 cups tea (150ml each), 1 cup black coffee"
                  />
                </div>

                {/* Meals eaten regularly */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Which meals do you eat regularly? (Pick all that apply) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleArrayItem('mealsEatenRegularly', m)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          formData.mealsEatenRegularly.includes(m)
                            ? 'bg-brand-green text-white border-brand-green'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typical Meal Breakdown */}
                <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                    Typical Food Items & Quantities per Meal
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Breakfast Items & Quantity <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={formData.breakfastDetails}
                        onChange={(e) => handleFieldChange('breakfastDetails', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green resize-none"
                        placeholder="e.g. 2 eggs, 2 slices brown bread, or 1 bowl oats"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Lunch Items & Quantity <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={formData.lunchDetails}
                        onChange={(e) => handleFieldChange('lunchDetails', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green resize-none"
                        placeholder="e.g. 2 rotis, 1 bowl dal, paneer sabzi, salad"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Snacks Items & Quantity <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={formData.snackDetails}
                        onChange={(e) => handleFieldChange('snackDetails', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green resize-none"
                        placeholder="e.g. Roasted chana, fruit, almonds, or tea"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Dinner Items & Quantity <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={formData.dinnerDetails}
                        onChange={(e) => handleFieldChange('dinnerDetails', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green resize-none"
                        placeholder="e.g. 1 cup rice, chicken curry or soya chunks, cucumber"
                      />
                    </div>
                  </div>
                </div>

                {/* Cravings */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Foods craved in Sweets & Special Non-sweet dishes? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.foodCravings}
                    onChange={(e) => handleFieldChange('foodCravings', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. Chocolate, Gulab jamun, Pizza, Chaat"
                  />
                </div>

                {/* Craving frequency */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    How often do you eat favorite foods you crave? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.cravingFrequency}
                    onChange={(e) => handleFieldChange('cravingFrequency', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
                  >
                    <option value="Daily">Daily</option>
                    <option value="1-2 times a week">1-2 times a week</option>
                    <option value="3-4 times a week">3-4 times a week</option>
                    <option value="1 or 2 times a month">1 or 2 times a month</option>
                  </select>
                </div>

                {/* Outside Food Frequency */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    How often do you eat outside or order food? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.outsideFoodFrequency}
                    onChange={(e) => handleFieldChange('outsideFoodFrequency', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-green"
                  >
                    <option value="once a day">Once a day</option>
                    <option value="2-3 times a week">2-3 times a week</option>
                    <option value="Once a week">Once a week</option>
                    <option value="Once or twice a month">Once or twice a month</option>
                  </select>
                </div>

                {/* What usually ordered outside */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    What do you usually order when eating outside? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.outsideFoodItems}
                    onChange={(e) => handleFieldChange('outsideFoodItems', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. Biryani, Chinese, burgers, South Indian"
                  />
                </div>

                {/* Special diet restrictions */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Any special diet, restrictions or limitations (health, cultural, religious)? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.specialDietRestrictions}
                    onChange={(e) => handleFieldChange('specialDietRestrictions', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. Fasting on Tuesdays, no garlic/onion, or Not applicable"
                  />
                </div>

                {/* Artificial Sweeteners */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Do you use artificial sweeteners? If yes, mention name, frequency, and quantity. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.artificialSweeteners}
                    onChange={(e) => handleFieldChange('artificialSweeteners', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. Stevia 2 drops daily in coffee, or Not Applicable"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 4: DIGESTIVE & GUT HEALTH */}
          {/* ========================================================= */}
          {activeTab === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Activity className="w-5 h-5 text-brand-green mr-2" />
                  4. Digestive & Gastrointestinal Health
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Rate how often you experience any of the following gut or digestive symptoms.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'heartburnFrequency', label: 'Heartburn / Acidity' },
                  { key: 'gasFrequency', label: 'Gas' },
                  { key: 'bloatingFrequency', label: 'Bloating' },
                  { key: 'stomachPainFrequency', label: 'Stomach Pain' },
                  { key: 'nauseaVomitingFrequency', label: 'Nausea / Vomiting' },
                  { key: 'diarrheaFrequency', label: 'Diarrhea' },
                  { key: 'constipationFrequency', label: 'Constipation' },
                ].map((item) => (
                  <div key={item.key} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm font-bold text-gray-800">
                      How often do you experience {item.label}? <span className="text-red-500">*</span>
                    </span>

                    <div className="flex flex-wrap gap-2">
                      {['Never', 'Rarely', 'Sometimes', 'Often'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleFieldChange(item.key as any, opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            (formData as any)[item.key] === opt
                              ? 'bg-brand-green text-white border-brand-green shadow-xs'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Missed Details */}
                <div className="pt-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Please mention in detail anything we missed that your coach should know: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.missedDetails}
                    onChange={(e) => handleFieldChange('missedDetails', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="Any specific digestive sensitivities, trigger foods, bowel habits, or notes..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 5: BODY MEASUREMENTS & STATISTICS */}
          {/* ========================================================= */}
          {activeTab === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Ruler className="w-5 h-5 text-brand-green mr-2" />
                  5. Body Statistics & Anthropometric Measurements
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Accurate baseline measurements allow coaches to measure true fat loss and body composition shifts.
                </p>
              </div>

              {/* Helpful measurement advice card */}
              <div className="bg-brand-light-green/50 border border-brand-green/30 rounded-2xl p-4 flex items-start space-x-3 text-xs text-brand-dark-green">
                <Info className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Measurement Tips:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                    <li>Weight: Measure first thing in the morning after freshening up, before eating or drinking.</li>
                    <li>Waist: Measure at the largest area around your stomach (near navel).</li>
                    <li>Tape: Keep the measuring tape snug against skin without compressing tissue.</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Weight */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Current Weight (in Kgs) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.currentWeightKg}
                    onChange={(e) => handleFieldChange('currentWeightKg', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. 74.5"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Current Height (in cms) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.heightCm}
                    onChange={(e) => handleFieldChange('heightCm', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. 175"
                  />
                </div>

                {/* Waist */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Waist Size (INCHES) <span className="text-red-500">*</span>
                    <span className="block text-[10px] text-gray-400 font-normal">Largest stomach area</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={formData.waistInches}
                    onChange={(e) => handleFieldChange('waistInches', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. 34.0"
                  />
                </div>

                {/* Hip */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Hip Size (INCHES) <span className="text-red-500">*</span>
                    <span className="block text-[10px] text-gray-400 font-normal">Around widest glute point</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={formData.hipInches}
                    onChange={(e) => handleFieldChange('hipInches', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. 38.5"
                  />
                </div>

                {/* Neck */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Neck Size (INCHES) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={formData.neckInches}
                    onChange={(e) => handleFieldChange('neckInches', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. 15.0"
                  />
                </div>

                {/* Chest */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Chest Size (INCHES) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={formData.chestInches}
                    onChange={(e) => handleFieldChange('chestInches', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. 39.0"
                  />
                </div>

                {/* Upper Arm */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Upper Arm Size (INCHES) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={formData.upperArmInches}
                    onChange={(e) => handleFieldChange('upperArmInches', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. 13.5"
                  />
                </div>

                {/* Quadriceps */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Quadriceps Size (INCHES) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={formData.quadricepsInches}
                    onChange={(e) => handleFieldChange('quadricepsInches', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. 21.0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 6: MEDICAL HISTORY & VITALS */}
          {/* ========================================================= */}
          {activeTab === 6 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <FileHeart className="w-5 h-5 text-brand-green mr-2" />
                  6. Past Medical, Surgical & Family History
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Health background, surgical history, and cardiovascular indicators.
                </p>
              </div>

              <div className="space-y-5">
                {/* Personal & Family Illnesses */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Any illness to you and/or your relatives (parents, grandparents, siblings), and age diagnosed? <span className="text-red-500">*</span>
                    <span className="block text-[11px] text-gray-500 font-normal">
                      Mention if ever operated or if you are running any medical treatment currently.
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.medicalAndSurgicalHistory}
                    onChange={(e) => handleFieldChange('medicalAndSurgicalHistory', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. Father diagnosed with diabetes at 48; underwent ACL surgery in 2021; no active surgeries."
                  />
                </div>

                {/* Family Deaths */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Any deaths of nearby family members or relatives and at what age? Please mention cause. <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.familyDeathsAndCauses}
                    onChange={(e) => handleFieldChange('familyDeathsAndCauses', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. Grandfather passed away at age 82 due to cardiac arrest, or None."
                  />
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* BP Known */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <label className="block text-xs font-bold text-gray-800">
                      Do you know your blood pressure levels? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      {['yes', 'no'].map((v) => (
                        <label key={v} className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="knowsBloodPressure"
                            checked={formData.knowsBloodPressure === v}
                            onChange={() => handleFieldChange('knowsBloodPressure', v)}
                            className="text-brand-green"
                          />
                          <span className="capitalize">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* BP > 140/90 */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <label className="block text-xs font-bold text-gray-800">
                      Is your blood pressure more than 140/90 mm Hg? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      {['yes', 'no'].map((v) => (
                        <label key={v} className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="bpAbove14090"
                            checked={formData.bpAbove14090 === v}
                            onChange={() => handleFieldChange('bpAbove14090', v)}
                            className="text-brand-green"
                          />
                          <span className="capitalize">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Cholesterol Known */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <label className="block text-xs font-bold text-gray-800">
                      Do you know your cholesterol levels? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      {['yes', 'no'].map((v) => (
                        <label key={v} className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="knowsCholesterol"
                            checked={formData.knowsCholesterol === v}
                            onChange={() => handleFieldChange('knowsCholesterol', v)}
                            className="text-brand-green"
                          />
                          <span className="capitalize">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Cholesterol > 200 */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <label className="block text-xs font-bold text-gray-800">
                      Is your blood cholesterol level more than 200 mg / dL? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      {['yes', 'no'].map((v) => (
                        <label key={v} className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="cholesterolAbove200"
                            checked={formData.cholesterolAbove200 === v}
                            onChange={() => handleFieldChange('cholesterolAbove200', v)}
                            className="text-brand-green"
                          />
                          <span className="capitalize">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 7: SYMPTOMS & MEDICATIONS */}
          {/* ========================================================= */}
          {activeTab === 7 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Pill className="w-5 h-5 text-brand-green mr-2" />
                  7. Symptom Severity (Scale 1–5) & Medications
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Rate your symptoms over the past 48 hours to 3 months: 1 = Never, 2 = Occasionally (mild), 3 = Frequently (mild), 4 = Moderate, 5 = Frequently with severe effect.
                </p>
              </div>

              {/* Scale Questions */}
              <div className="space-y-4">
                {[
                  { key: 'headachesScore', label: 'Headaches' },
                  { key: 'faintnessScore', label: 'Faintness' },
                  { key: 'dizzinessScore', label: 'Dizziness' },
                  { key: 'insomniaScore', label: 'Insomnia / Sleep Issues' },
                  { key: 'digestiveIssuesScore', label: 'Digestive Issues' },
                  { key: 'emotionalIssuesScore', label: 'Emotional Issues (Mood swings, anxiety, fear, depression, nervousness)' },
                ].map((item) => (
                  <div key={item.key} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm font-semibold text-gray-800 sm:max-w-md">
                      {item.label} <span className="text-red-500">*</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleFieldChange(item.key as any, num)}
                          className={`w-9 h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            (formData as any)[item.key] === num
                              ? 'bg-brand-green text-white ring-2 ring-brand-dark-green/40 shadow-xs'
                              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Current Medications */}
                <div className="pt-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Current Medications, Supplements, and/or Antibiotics? <span className="text-red-500">*</span>
                    <span className="block text-[11px] text-gray-500 font-normal">
                      Please mention names, dosage, frequency, and start date (e.g. Vitamin D3 60,000 IU once weekly; Thyronorm 50mcg daily morning).
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.currentMedications}
                    onChange={(e) => handleFieldChange('currentMedications', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="Provide medication details or write 'None / Not applicable'"
                  />
                </div>

                {/* Medication Allergies */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Are you allergic to any medications? If yes, what? Write &quot;Not applicable&quot; if none. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.medicationAllergies}
                    onChange={(e) => handleFieldChange('medicationAllergies', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                    placeholder="e.g. Penicillin, Sulfa drugs, or Not applicable"
                  />
                </div>

                {/* DPDPA 2023 Granular Health Data Notice & Consent Block */}
                <div className="mt-8 pt-6 border-t-2 border-brand-light-green space-y-5">
                  <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                      <Shield className="w-5 h-5 text-emerald-700 shrink-0" />
                      <span>Digital Personal Data Protection (DPDPA 2023) Notice</span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      In accordance with India&apos;s Digital Personal Data Protection Act (DPDPA 2023), Fitkode Studio collects your physical metrics, dietary records, and personal health disclosures strictly to formulate evidence-based, customized nutrition and workout programs.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] text-emerald-950">
                      <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200/60">
                        <strong className="block text-emerald-900">Purpose &amp; Storage Scope:</strong>
                        Used solely for your coaching program. Fitkode never sells, rents, or shares your health disclosures with data brokers, advertisers, or insurance carriers.
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200/60">
                        <strong className="block text-emerald-900">Right to Withdraw &amp; Erase:</strong>
                        You retain the right to withdraw consent or permanently erase your data at any time via your Profile Settings or by contacting myfitkode@gmail.com.
                      </div>
                    </div>
                  </div>

                  {/* DPDP Act Default Notice */}
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-900 block mb-0.5">
                        DPDP Act 2023 Default Consent:
                      </span>
                      By default, all your data sharing consents are marked <strong>Yes</strong> to ensure uninterrupted coaching, dietary calculation, and workout programming. They remain active unless you explicitly choose to turn them off below.
                    </div>
                  </div>

                  {/* Separate unbundled opt-in toggles */}
                  <div className="space-y-3">
                    {/* Consent 1: Health Data */}
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                        formData.healthDataConsent && !formData.isConsentWithdrawn
                          ? 'bg-emerald-50/70 border-brand-green ring-1 ring-brand-green/30'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(formData.healthDataConsent && !formData.isConsentWithdrawn)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          handleFieldChange('healthDataConsent', checked);
                          handleFieldChange('isConsentWithdrawn', !checked);
                          if (checked) {
                            handleFieldChange('healthDataConsentGivenAt', new Date().toISOString());
                            handleFieldChange('consentWithdrawnAt', '');
                          } else {
                            handleFieldChange('consentWithdrawnAt', new Date().toISOString());
                          }
                        }}
                        className="mt-1 w-5 h-5 rounded text-brand-green focus:ring-brand-green border-gray-300 cursor-pointer"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-sm">Health Data Processing Consent</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {formData.healthDataConsent && !formData.isConsentWithdrawn ? 'Yes (Active by Default)' : 'Turned Off'}
                          </span>
                        </div>
                        <p className="text-gray-800 leading-relaxed font-medium text-xs">
                          &quot;I consent to Fitkode processing my physical metrics, health history, and dietary data solely for creating personalized fitness and workout programs.&quot;
                        </p>
                        {formData.healthDataConsent && !formData.isConsentWithdrawn && formData.healthDataConsentGivenAt && (
                          <p className="text-[10px] text-emerald-700 mt-1">
                            Consent registered: {new Date(formData.healthDataConsentGivenAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                          </p>
                        )}
                        {formData.isConsentWithdrawn && (
                          <p className="text-[10px] text-amber-700 font-semibold mt-1">
                            Turned off by user on {formData.consentWithdrawnAt ? new Date(formData.consentWithdrawnAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'recently'}
                          </p>
                        )}
                      </div>
                    </label>

                    {/* Consent 2: Coaching Notifications */}
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                        formData.notificationsConsent && !formData.notificationsConsentWithdrawn
                          ? 'bg-emerald-50/70 border-brand-green ring-1 ring-brand-green/30'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(formData.notificationsConsent && !formData.notificationsConsentWithdrawn)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          handleFieldChange('notificationsConsent', checked);
                          handleFieldChange('notificationsConsentWithdrawn', !checked);
                          if (checked) {
                            handleFieldChange('notificationsConsentGivenAt', new Date().toISOString());
                            handleFieldChange('notificationsConsentWithdrawnAt', '');
                          } else {
                            handleFieldChange('notificationsConsentWithdrawnAt', new Date().toISOString());
                          }
                        }}
                        className="mt-1 w-5 h-5 rounded text-brand-green focus:ring-brand-green border-gray-300 cursor-pointer"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-sm">Coaching &amp; Plan Notifications</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                            {formData.notificationsConsent && !formData.notificationsConsentWithdrawn ? 'Yes (Active by Default)' : 'Turned Off'}
                          </span>
                        </div>
                        <p className="text-gray-600 leading-relaxed text-xs">
                          &quot;I agree to receive workout plan updates, check-in reminders, and coaching notifications via email/WhatsApp.&quot;
                        </p>
                        {formData.notificationsConsent && !formData.notificationsConsentWithdrawn && formData.notificationsConsentGivenAt && (
                          <p className="text-[10px] text-brand-green mt-1">
                            Preference registered: {new Date(formData.notificationsConsentGivenAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                          </p>
                        )}
                        {formData.notificationsConsentWithdrawn && (
                          <p className="text-[10px] text-gray-500 mt-1">
                            Turned off by user.
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Stepper Controls */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevSection}
              disabled={activeTab === 1}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous Section
            </button>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleNextSection}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
              >
                <span>{activeTab === 7 ? 'Review & Submit Assessment' : 'Save & Continue'}</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

        </div>

        {/* Standardized Non-Medical & Coaching Disclaimer */}
        <MedicalDisclaimer variant="card" />

      </div>
    </div>
  );
}
