import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { WifiOff, RefreshCw } from 'lucide-react';
import Header from './components/Header';
import Home from './components/Home';
import PlansPricing from './components/PlansPricing';
import ContactForm from './components/ContactForm';
import AboutPage from './components/AboutPage';
import ResultsPage from './components/ResultsPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsPage from './components/TermsPage';
import RefundPolicyPage from './components/RefundPolicyPage';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { getOfflineSyncQueue, subscribeToSyncStatus } from './lib/storageGuard';
import { flushOfflineSyncQueue } from './lib/supabase';

// Route-level code splitting for heavy interactive modules (~60% smaller initial mobile bundle)
const FitnessTools = lazy(() => import('./components/FitnessTools'));
const TestPaymentPage = lazy(() => import('./components/TestPaymentPage'));
const UserProfilePage = lazy(() => import('./components/UserProfilePage'));
const ClientOnboardingPage = lazy(() => import('./components/ClientOnboardingPage'));
const AdminMembersPage = lazy(() => import('./components/AdminMembersPage'));
const WeeklyTrackerPage = lazy(() => import('./components/WeeklyTrackerPage'));
const MealPlannerPage = lazy(() => import('./components/MealPlannerPage'));
const WorkoutPlannerPage = lazy(() => import('./components/WorkoutPlannerPage'));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-natural-oat px-4">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-stone-200 shadow-sm text-stone-700 text-sm font-medium">
        <div className="w-4 h-4 rounded-full border-2 border-brand-dark-green border-t-transparent animate-spin" />
        Loading Fitkode module...
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const navigate = useNavigate();
  const [syncStatus, setSyncStatus] = useState<{ isOnline: boolean; pendingCount: number }>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: getOfflineSyncQueue().length,
  }));
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const redirect = sessionStorage.getItem('fk_redirect');
    if (redirect) {
      sessionStorage.removeItem('fk_redirect');
      try {
        const url = new URL(redirect);
        if (url.pathname && url.pathname !== '/') {
          navigate(url.pathname + url.search + url.hash, { replace: true });
        }
      } catch {
        // Fallback for relative paths
        if (redirect.startsWith('/') && redirect !== '/') {
          navigate(redirect, { replace: true });
        }
      }
    }
  }, [navigate]);

  const handleManualSyncFlush = async () => {
    setIsSyncingNow(true);
    try {
      await flushOfflineSyncQueue();
      setSyncStatus({
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        pendingCount: getOfflineSyncQueue().length,
      });
    } finally {
      setIsSyncingNow(false);
    }
  };

  return (
    <div className="min-h-screen bg-natural-oat flex flex-col justify-between selection:bg-brand-light-green selection:text-brand-dark-green">
      <ScrollToTop />
      <Header />

      <main className="flex-grow">
        <ErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home onPlanClick={() => navigate('/coaching-plans')} />} />
              <Route path="/coaching-plans" element={<PlansPricing searchTerm="" />} />
              <Route path="/coaching-plan" element={<PlansPricing searchTerm="" />} />
              <Route path="/tools" element={<FitnessTools />} />
              <Route path="/tools/body-fat-calculator" element={<FitnessTools focusedTool="body-fat" />} />
              <Route path="/tools/bmi-calculator" element={<FitnessTools focusedTool="bmi" />} />
              <Route path="/tools/tdee-calculator" element={<FitnessTools focusedTool="tdee" />} />
              <Route path="/tools/macro-calculator" element={<FitnessTools focusedTool="macro" />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/contact" element={<ContactForm />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/refund-policy" element={<RefundPolicyPage />} />
              <Route path="/test" element={<TestPaymentPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/weekly-tracker" element={<WeeklyTrackerPage />} />
              <Route path="/tracker" element={<WeeklyTrackerPage />} />
              <Route path="/meal-planner" element={<MealPlannerPage />} />
              <Route path="/workout-planner" element={<WorkoutPlannerPage />} />
              <Route path="/onboarding" element={<ClientOnboardingPage />} />
              <Route path="/admin" element={<AdminMembersPage />} />
              <Route path="/admin/members" element={<AdminMembersPage />} />
              <Route path="*" element={<Home onPlanClick={() => navigate('/coaching-plans')} />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {(!syncStatus.isOnline || syncStatus.pendingCount > 0) && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-stone-900/95 text-white px-4 py-2.5 rounded-xl shadow-lg border border-stone-700 flex items-center gap-3 text-xs">
          {!syncStatus.isOnline ? (
            <>
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Offline mode — changes are saved locally
                {syncStatus.pendingCount > 0 ? ` (${syncStatus.pendingCount} queued)` : ''} and will sync automatically.
              </span>
            </>
          ) : (
            <>
              <RefreshCw className={`w-4 h-4 text-emerald-400 shrink-0 ${isSyncingNow ? 'animate-spin' : ''}`} />
              <span>
                {syncStatus.pendingCount} offline {syncStatus.pendingCount === 1 ? 'update' : 'updates'} queued for cloud sync
              </span>
              <button
                type="button"
                onClick={handleManualSyncFlush}
                disabled={isSyncingNow}
                className="ml-auto px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {isSyncingNow ? 'Syncing...' : 'Sync Now'}
              </button>
            </>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}

