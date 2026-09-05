import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  AlertCircle,
  X,
  ChevronDown,
  User,
  FileText,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { useAuth, TEST_USER_PRESETS } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  isLiveProductionSite,
  isDevOrTestingMode,
  shouldShowTestLoginInHeader,
} from '../lib/environment';

interface AuthButtonProps {
  className?: string;
  mobile?: boolean;
  onActionComplete?: () => void;
}

export default function AuthButton({ className = '', mobile = false, onActionComplete }: AuthButtonProps) {
  const {
    user,
    loading,
    isConfigured,
    role,
    isAdmin,
    isPaid,
    signIn,
    signInWithTestAccount,
    logOut,
    authError,
    clearAuthError,
  } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [testLoggingIn, setTestLoggingIn] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>('unpaid');
  const [showCustomEmailForm, setShowCustomEmailForm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showAdminBypass, setShowAdminBypass] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLive = isLiveProductionSite();
  const showTestInHeader = shouldShowTestLoginInHeader();
  const isDevOrTest = isDevOrTestingMode();

  // Extract Google photo and name
  const googlePhoto = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const googleName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.given_name ||
    user?.email?.split('@')[0] ||
    'User';
  const googleEmail = user?.email || '';

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignInClick = async () => {
    if (isConfigured) {
      await handleLiveGoogleSignIn();
    } else {
      setShowSignInModal(true);
    }
  };

  const handleTestAccountSelect = async (presetId: string, roleOverride?: UserRole) => {
    try {
      setTestLoggingIn(true);
      await signInWithTestAccount(presetId, roleOverride);
      setShowSignInModal(false);
      if (onActionComplete) onActionComplete();
      navigate('/profile');
    } catch (err) {
      console.error('Test sign-in error:', err);
    } finally {
      setTestLoggingIn(false);
    }
  };

  const handleCustomEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    try {
      setTestLoggingIn(true);
      await signInWithTestAccount(customEmail.trim(), customRole);
      setShowSignInModal(false);
      if (onActionComplete) onActionComplete();
      navigate('/profile');
    } catch (err) {
      console.error('Custom sign-in error:', err);
    } finally {
      setTestLoggingIn(false);
    }
  };

  const handleLiveGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      await signIn();
      setShowSignInModal(false);
      if (onActionComplete) onActionComplete();
      navigate('/profile');
    } catch (err) {
      console.error('Live Google sign-in error:', err);
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await logOut();
    if (onActionComplete) onActionComplete();
    navigate('/');
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs text-gray-400 bg-gray-100/80 animate-pulse ${className}`}>
        <span className="w-4 h-4 rounded-full bg-gray-300 mr-2"></span>
        <span>Checking account...</span>
      </div>
    );
  }

  // ==========================================
  // MOBILE DRAWER VIEW
  // ==========================================
  if (mobile) {
    if (user) {
      return (
        <div className={`bg-white rounded-xl p-4 border border-brand-light-green shadow-xs space-y-3 ${className}`}>
          <div className="flex items-center space-x-3">
            {googlePhoto && !imageError ? (
              <img
                src={googlePhoto}
                alt={googleName}
                className="w-11 h-11 rounded-full object-cover border-2 border-brand-green shadow-xs"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-brand-light-green text-brand-green border-2 border-brand-green/40 flex items-center justify-center font-bold text-sm">
                {(googleName[0] || 'U').toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5">
                <p className="text-sm font-bold text-gray-900 truncate">{googleName}</p>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-800'
                      : isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isAdmin ? 'Admin' : isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{googleEmail}</p>
            </div>
          </div>

          {/* Quick navigation to Profile, Weekly Tracker, Onboarding, and Admin Portal */}
          <div className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5 pt-1 border-t border-gray-100`}>
            <Link
              to="/profile"
              onClick={() => {
                if (onActionComplete) onActionComplete();
              }}
              className="flex items-center justify-center space-x-1 py-2 px-1 rounded-lg bg-brand-light-green/60 hover:bg-brand-light-green text-brand-dark-green text-[11px] font-bold transition-colors"
            >
              <User className="w-3.5 h-3.5 text-brand-green" />
              <span>Profile</span>
            </Link>
            <Link
              to="/weekly-tracker"
              onClick={() => {
                if (onActionComplete) onActionComplete();
              }}
              className="flex items-center justify-center space-x-1 py-2 px-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>Tracker</span>
            </Link>
            <Link
              to="/onboarding"
              onClick={() => {
                if (onActionComplete) onActionComplete();
              }}
              className="flex items-center justify-center space-x-1 py-2 px-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Intake</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => {
                  if (onActionComplete) onActionComplete();
                }}
                className="flex items-center justify-center space-x-1 py-2 px-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 text-[11px] font-bold transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-purple-700" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleSignInClick}
        disabled={signingIn}
        className={`w-full flex items-center justify-center space-x-2.5 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60 ${className}`}
      >
        {signingIn ? (
          <span className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{signingIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
      </button>
    );
  }

  // ==========================================
  // DESKTOP & TOP BAR VIEW
  // ==========================================
  return (
    <>
      {user ? (
        /* SIGNED IN STATE: Show Google Photo, Google Name, and Log Out Option */
        <div className={`flex items-center space-x-2 ${className}`}>
          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="header-user-profile-button"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 py-1 px-2.5 rounded-full border border-brand-green/30 bg-white hover:bg-brand-light-green/30 transition-all shadow-xs group cursor-pointer"
              aria-label={`Signed in as ${googleName}`}
              aria-expanded={dropdownOpen}
            >
              {/* Google Photo with Initials Fallback */}
              <div className="relative shrink-0">
                {googlePhoto && !imageError ? (
                  <img
                    src={googlePhoto}
                    alt={googleName}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-green/30"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-light-green text-brand-green flex items-center justify-center font-bold text-xs ring-2 ring-brand-green/30">
                    {(googleName[0] || 'U').toUpperCase()}
                  </div>
                )}
                {/* Active Indicator Dot */}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"></span>
              </div>

              {/* Google Name */}
              <span className="text-xs font-bold text-gray-800 max-w-[130px] truncate group-hover:text-brand-green transition-colors">
                {googleName}
              </span>

              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 px-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                  {googlePhoto && !imageError ? (
                    <img
                      src={googlePhoto}
                      alt={googleName}
                      className="w-10 h-10 rounded-full object-cover border border-brand-green/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-light-green text-brand-green flex items-center justify-center font-bold text-sm">
                      {(googleName[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-bold text-gray-900 truncate">{googleName}</p>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isAdmin
                            ? 'bg-purple-100 text-purple-800'
                            : isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isAdmin ? 'Admin' : isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{googleEmail}</p>
                    <div className="flex items-center space-x-1 mt-1 text-[10px] text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Google Account Verified</span>
                    </div>
                  </div>
                </div>

                <div className="py-2 border-b border-gray-100 space-y-1">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-900 bg-purple-50/70 hover:bg-purple-100 transition-colors"
                    >
                      <Shield className="w-4 h-4 text-purple-700" />
                      <div className="text-left">
                        <p className="font-bold text-purple-950 leading-tight">Admin Directory</p>
                        <p className="text-[10px] text-purple-600/80 font-normal">Manage all members & dossiers</p>
                      </div>
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-brand-green hover:bg-brand-light-green/40 transition-colors"
                  >
                    <User className="w-4 h-4 text-brand-green" />
                    <div className="text-left">
                      <p className="font-bold text-gray-900 leading-tight">My Profile</p>
                      <p className="text-[10px] text-gray-500 font-normal">Contact & personal info</p>
                    </div>
                  </Link>

                  <Link
                    to="/weekly-tracker"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-brand-green hover:bg-brand-light-green/40 transition-colors"
                  >
                    <Activity className="w-4 h-4 text-brand-green" />
                    <div className="text-left">
                      <p className="font-bold text-gray-900 leading-tight">Weekly Health Tracker</p>
                      <p className="text-[10px] text-gray-500 font-normal">Body stats, trends & photos</p>
                    </div>
                  </Link>

                  <Link
                    to="/onboarding"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-brand-green hover:bg-brand-light-green/40 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div className="text-left">
                      <p className="font-bold text-gray-900 leading-tight">Client Onboarding</p>
                      <p className="text-[10px] text-gray-500 font-normal">Health & nutrition assessment</p>
                    </div>
                  </Link>
                </div>

                <div className="pt-2">
                  <button
                    id="dropdown-logout-button"
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Visible Direct Super Admin Portal Button */}
          {isAdmin && (
            <Link
              id="header-direct-admin-button"
              to="/admin"
              className="hidden md:inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Super Admin Portal"
            >
              <Shield className="w-3.5 h-3.5 text-purple-700" />
              <span>Admin Portal</span>
            </Link>
          )}

          {/* Visible Direct My Profile Button */}
          <Link
            id="header-direct-profile-button"
            to="/profile"
            className="hidden sm:inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-lg border border-brand-green/30 bg-brand-light-green/30 hover:bg-brand-light-green text-brand-dark-green text-xs font-bold transition-all cursor-pointer"
            title="My Profile"
          >
            <User className="w-3.5 h-3.5 text-brand-green" />
            <span>Profile</span>
          </Link>

          {/* Visible Direct Log Out Button (Immediate 1-Click Logout) */}
          <button
            id="header-direct-logout-button"
            type="button"
            onClick={handleSignOut}
            className="hidden lg:flex items-center space-x-1 py-1.5 px-2.5 rounded-lg border border-gray-200 hover:border-red-200 bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 text-xs font-medium transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      ) : (
        /* NOT SIGNED IN STATE: Show Google Sign-in Button & Quick Test Button */
        <div className="flex items-center space-x-1.5">
          <button
            id="google-sign-in-button"
            type="button"
            onClick={handleSignInClick}
            disabled={signingIn || testLoggingIn}
            className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs hover:border-brand-green/50 hover:text-brand-green transition-all group disabled:opacity-60 cursor-pointer ${className}`}
          >
            {signingIn ? (
              <span className="w-3.5 h-3.5 border-2 border-brand-green border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : (
              <svg className="w-3.5 h-3.5 mr-2 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{signingIn ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>

          {/* Test Login: Only shown in dev/preview environments or when ?dev=true is set */}
          {showTestInHeader && (
            <button
              type="button"
              onClick={() => setShowSignInModal(true)}
              className="hidden sm:inline-flex items-center space-x-1 py-1.5 px-2.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Instant Test Sign-In"
            >
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Test Login</span>
            </button>
          )}
        </div>
      )}

      {/* Comprehensive Sign In & Test Account Modal */}
      {showSignInModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-7 border border-gray-100 relative my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-brand-light-green text-brand-dark-green flex items-center justify-center shrink-0 shadow-xs border border-brand-green/20">
                <Sparkles className="w-5 h-5 text-brand-green" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Sign In to Fitkode</h3>
                <p className="text-xs text-gray-500">Access your health profile, intake dossier & coach tools</p>
              </div>
            </div>

            {/* LIVE PRODUCTION VIEW: Clean, professional client view */}
            {isLive && !isDevOrTest ? (
              <div className="space-y-5">
                {isConfigured ? (
                  <button
                    type="button"
                    onClick={handleLiveGoogleSignIn}
                    disabled={signingIn}
                    className="w-full flex items-center justify-center space-x-2.5 py-3.5 px-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                  >
                    {signingIn ? (
                      <span className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>{signingIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
                  </button>
                ) : (
                  <div className="bg-emerald-50/80 rounded-2xl p-4.5 border border-brand-light-green space-y-2.5 text-left">
                    <div className="flex items-center space-x-2 text-brand-dark-green text-xs font-bold">
                      <Shield className="w-4 h-4 text-brand-green" />
                      <span>Google Authentication Setup</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Google Sign-In is being initialized for Fitkode. To connect your Google OAuth client, configure the Supabase URL and key in your hosting secrets.
                    </p>
                    <p className="text-xs text-gray-700">
                      Need immediate client assistance? Contact{' '}
                      <a href="mailto:chinmay4jain@gmail.com" className="text-brand-green font-bold underline">
                        chinmay4jain@gmail.com
                      </a>.
                    </p>
                  </div>
                )}

                {/* Coach / Admin Access on live site */}
                <div className="pt-2 text-center border-t border-gray-100">
                  {!showAdminBypass ? (
                    <button
                      type="button"
                      onClick={() => setShowAdminBypass(true)}
                      className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors underline cursor-pointer"
                    >
                      Coach & Admin Sign-in
                    </button>
                  ) : (
                    <div className="space-y-3 pt-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-purple-700" />
                          Coach & Admin 1-Click Access
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAdminBypass(false)}
                          className="text-[10px] text-gray-400 hover:text-gray-600"
                        >
                          Hide
                        </button>
                      </div>

                      {TEST_USER_PRESETS.map((preset) => {
                        const isPresetAdmin = preset.role === 'admin';
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            disabled={testLoggingIn}
                            onClick={() => handleTestAccountSelect(preset.id, preset.role)}
                            className="w-full text-left p-3 rounded-2xl border border-gray-200 hover:border-brand-green bg-gray-50/80 hover:bg-emerald-50/40 transition-all group cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <img
                                src={preset.avatarUrl}
                                alt={preset.name}
                                className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-bold text-gray-900 truncate">
                                    {preset.name}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                      isPresetAdmin
                                        ? 'bg-purple-100 text-purple-900'
                                        : 'bg-emerald-100 text-emerald-900'
                                    }`}
                                  >
                                    {preset.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 truncate">{preset.email}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-green" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* DEV / PREVIEW ENVIRONMENT VIEW */
              <>
                {/* SECTION 1: INSTANT 1-CLICK TEST ACCOUNTS */}
                <div className="space-y-2.5 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Instant 1-Click Access (Testing Mode)
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">No passwords required</span>
                  </div>

                  <div className="space-y-2">
                    {TEST_USER_PRESETS.map((preset) => {
                      const isPresetAdmin = preset.role === 'admin';
                      const isPresetPaid = preset.role === 'paid';
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          disabled={testLoggingIn}
                          onClick={() => handleTestAccountSelect(preset.id, preset.role)}
                          className="w-full text-left p-3.5 rounded-2xl border border-gray-200 hover:border-brand-green/60 bg-gray-50/70 hover:bg-emerald-50/40 transition-all group cursor-pointer flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={preset.avatarUrl}
                              alt={preset.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-xs"
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
                              <p className="text-[11px] text-gray-400 truncate mt-0.5">{preset.description}</p>
                            </div>
                          </div>

                          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 group-hover:border-brand-green group-hover:bg-brand-green group-hover:text-white flex items-center justify-center shrink-0 text-gray-400 transition-colors shadow-2xs">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Email Toggle */}
                  <div className="pt-1">
                    {!showCustomEmailForm ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomEmailForm(true)}
                        className="text-xs text-brand-green hover:text-brand-dark-green font-semibold underline cursor-pointer"
                      >
                        + Or test with a custom email & role
                      </button>
                    ) : (
                      <form onSubmit={handleCustomEmailSubmit} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3 mt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-700">Custom Test Account</label>
                          <button
                            type="button"
                            onClick={() => setShowCustomEmailForm(false)}
                            className="text-[11px] text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                        <input
                          type="email"
                          required
                          placeholder="e.g. member@fitkode.com"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-brand-green"
                        />
                        <div className="flex items-center space-x-2">
                          <label className="text-[11px] text-gray-500 font-medium">Role:</label>
                          {(['unpaid', 'paid', 'admin'] as UserRole[]).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setCustomRole(r)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                                customRole === r
                                  ? 'bg-brand-green text-white shadow-2xs'
                                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                        <button
                          type="submit"
                          disabled={testLoggingIn}
                          className="w-full py-2 bg-brand-dark-green text-white text-xs font-bold rounded-xl hover:bg-black transition-colors cursor-pointer"
                        >
                          {testLoggingIn ? 'Logging In...' : 'Log In with Custom Account'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* SECTION 2: LIVE GOOGLE OAUTH */}
                <div className="border-t border-gray-100 pt-5 space-y-3">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Live Google OAuth
                  </span>

                  {isConfigured ? (
                    <button
                      type="button"
                      onClick={handleLiveGoogleSignIn}
                      disabled={signingIn || testLoggingIn}
                      className="w-full flex items-center justify-center space-x-2.5 py-3 px-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                    >
                      {signingIn ? (
                        <span className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      )}
                      <span>{signingIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
                    </button>
                  ) : (
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 space-y-2">
                      <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>Supabase OAuth Keys Not Configured</span>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        To enable live Google Sign-In, add <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-amber-900">VITE_SUPABASE_URL</code> and <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-amber-900">VITE_SUPABASE_ANON_KEY</code> in Settings &gt; Secrets.
                      </p>
                      <p className="text-[11px] text-amber-800 font-semibold pt-1">
                        👉 Click any of the 1-click test accounts above to test immediately with full profile and Super Admin access!
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Auth Error Toast Banner */}
      {authError && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-4 right-4 z-[9999] bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg text-xs flex items-center justify-between max-w-sm animate-in slide-in-from-bottom-2">
          <span>{authError}</span>
          <button onClick={clearAuthError} className="ml-2 text-red-500 hover:text-red-700 font-bold p-1">
            ×
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
