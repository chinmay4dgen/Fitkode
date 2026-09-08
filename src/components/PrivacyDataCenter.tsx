import React, { useState } from 'react';
import {
  Shield,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Lock,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  Copy,
  Check,
  UserX,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { ToastMessage } from './Toast';
import MedicalDisclaimer from './MedicalDisclaimer';
import {
  downloadClientDataAsJson,
  generateClientDataSummaryText,
  revokeHealthConsent,
  regrantHealthConsent,
  setNotificationsConsent,
  eraseClientData,
  buildClientDataPackage,
} from '../lib/privacyService';

interface PrivacyDataCenterProps {
  userIdOrEmail: string;
  userEmail: string;
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  signOut?: () => Promise<void> | void;
}

export default function PrivacyDataCenter({
  userIdOrEmail,
  userEmail,
  profile,
  onProfileUpdated,
  addToast,
  signOut,
}: PrivacyDataCenterProps) {
  const navigate = useNavigate();

  const [isExporting, setIsExporting] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Revoke Consent State
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRegranting, setIsRegranting] = useState(false);

  // Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Consent State
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);

  const isWithdrawn = Boolean(profile.isConsentWithdrawn || !profile.healthDataConsent);

  const handleToggleNotificationsConsent = async (enable: boolean) => {
    setIsUpdatingNotifications(true);
    try {
      await setNotificationsConsent(userIdOrEmail, enable);
      const timestamp = new Date().toISOString();
      const updated: UserProfile = {
        ...profile,
        notificationsConsent: enable,
        notificationsConsentGivenAt: enable ? timestamp : profile.notificationsConsentGivenAt,
        notificationsConsentWithdrawn: !enable,
        notificationsConsentWithdrawnAt: !enable ? timestamp : undefined,
      };
      onProfileUpdated(updated);
      addToast({
        type: 'success',
        title: enable ? 'Notifications Enabled' : 'Notifications Turned Off',
        message: enable
          ? 'You will receive workout reminders and coaching updates.'
          : 'Coaching and plan notifications have been paused.',
        duration: 4000,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Could not update notification preferences.',
        duration: 4000,
      });
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handleDownloadJson = () => {
    setIsExporting(true);
    try {
      downloadClientDataAsJson(userIdOrEmail);
      addToast({
        type: 'success',
        title: 'Data Export Generated',
        message: 'Your complete JSON data package has been downloaded.',
        duration: 4000,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not build data package. Please retry or contact support.',
        duration: 4000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenSummaryModal = () => {
    const text = generateClientDataSummaryText(userIdOrEmail);
    setSummaryText(text);
    setCopiedSummary(false);
    setShowSummaryModal(true);
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
      addToast({
        type: 'success',
        title: 'Summary Copied',
        message: 'Plain-text health summary copied to clipboard.',
        duration: 3000,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Unable to copy text automatically.',
        duration: 3000,
      });
    }
  };

  const handleConfirmRevoke = async () => {
    setIsRevoking(true);
    try {
      await revokeHealthConsent(userIdOrEmail);
      const updated: UserProfile = {
        ...profile,
        healthDataConsent: false,
        isConsentWithdrawn: true,
        consentWithdrawnAt: new Date().toISOString(),
      };
      onProfileUpdated(updated);
      setShowRevokeModal(false);
      addToast({
        type: 'info',
        title: 'Consent Revoked',
        message: 'Health data processing paused under DPDPA 2023.',
        duration: 6000,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Could not revoke consent. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleConfirmRegrant = async () => {
    setIsRegranting(true);
    try {
      await regrantHealthConsent(userIdOrEmail);
      const timestamp = new Date().toISOString();
      const updated: UserProfile = {
        ...profile,
        healthDataConsent: true,
        healthDataConsentGivenAt: timestamp,
        isConsentWithdrawn: false,
        consentWithdrawnAt: undefined,
      };
      onProfileUpdated(updated);
      addToast({
        type: 'success',
        title: 'Consent Re-granted',
        message: 'Health data processing is active. Coaching services resumed.',
        duration: 5000,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Could not re-grant consent. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsRegranting(false);
    }
  };

  const handleConfirmErasure = async () => {
    if (deleteConfirmationInput.trim().toUpperCase() !== 'DELETE') {
      addToast({
        type: 'error',
        title: 'Confirmation Mismatch',
        message: 'Please type DELETE in capital letters to confirm permanent erasure.',
        duration: 4000,
      });
      return;
    }

    setIsDeleting(true);
    try {
      await eraseClientData(userIdOrEmail);
      setShowDeleteModal(false);
      addToast({
        type: 'success',
        title: 'Data Permanently Erased',
        message: 'All profile records, metrics, and plans have been deleted.',
        duration: 5000,
      });

      if (signOut) {
        await signOut();
      }
      navigate('/');
    } catch {
      addToast({
        type: 'error',
        title: 'Erasure Incomplete',
        message: 'Encountered an issue during data wipe. Contact myfitkode@gmail.com.',
        duration: 6000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Card: Compliance Header */}
      <div className="bg-white rounded-3xl border border-brand-light-green p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-light-green pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-brand-light-green rounded-2xl text-brand-dark-green">
              <Shield className="w-6 h-6 text-brand-green" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-brand-dark-green tracking-tight">
                Privacy &amp; Data Control Center
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Statutory Data Principal Rights under India&apos;s Digital Personal Data Protection Act (DPDPA 2023)
              </p>
            </div>
          </div>

          <Link
            to="/privacy-policy"
            className="inline-flex items-center text-xs font-bold text-brand-green hover:underline gap-1 self-start sm:self-auto"
          >
            <span>Full Privacy Policy</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Warning if Consent is Revoked */}
        {isWithdrawn && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block text-amber-900 font-bold text-sm">
                  Coaching Plan Updates Paused
                </strong>
                <p className="text-amber-800 leading-relaxed mt-0.5">
                  Your health data processing consent is currently withdrawn. In accordance with DPDPA guidelines, active coach updates and personalized nutrition/workout adjustments are temporarily suspended.
                </p>
                {profile.consentWithdrawnAt && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Revocation registered: {new Date(profile.consentWithdrawnAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmRegrant}
              disabled={isRegranting}
              className="px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold shadow-xs whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
            >
              {isRegranting ? 'Re-granting...' : 'Re-grant Consent'}
            </button>
          </div>
        )}

        {/* DPDP Act Default Setting Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-emerald-900 block font-bold mb-0.5">
              DPDPA 2023 Default Consent Policy:
            </strong>
            By default, whenever you log in to the website, all your data sharing consents are marked <strong>&quot;Yes&quot;</strong> in respect of your willingness to share data for customized nutrition, macro targets, and workout splits. Consents are turned off only if you choose to turn them off below.
          </div>
        </div>

        {/* Active Consent Status Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-green" />
                  Health Data Consent
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                    profile.healthDataConsent && !profile.isConsentWithdrawn
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {profile.healthDataConsent && !profile.isConsentWithdrawn ? 'Yes (Active by Default)' : 'Turned Off'}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Authorizes Fitkode to process body metrics, dietary logs, and intake questionnaires solely for custom fitness programming.
              </p>
              {profile.healthDataConsentGivenAt && !profile.isConsentWithdrawn && (
                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>Granted on: {new Date(profile.healthDataConsentGivenAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                </div>
              )}
              {profile.isConsentWithdrawn && profile.consentWithdrawnAt && (
                <div className="text-[11px] text-amber-700 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Turned off on: {new Date(profile.consentWithdrawnAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-200/80">
              {profile.healthDataConsent && !profile.isConsentWithdrawn ? (
                <button
                  type="button"
                  onClick={() => setShowRevokeModal(true)}
                  className="w-full inline-flex items-center justify-center px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
                  <span>Turn Off Health Data Sharing</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmRegrant}
                  disabled={isRegranting}
                  className="w-full inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>{isRegranting ? 'Enabling...' : 'Turn On (Grant Yes)'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-green" />
                  Coaching &amp; Plan Alerts
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                    profile.notificationsConsent && !profile.notificationsConsentWithdrawn
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  {profile.notificationsConsent && !profile.notificationsConsentWithdrawn ? 'Yes (Active by Default)' : 'Turned Off'}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Controls workout reminders, weekly check-in alerts, and nutrition guidance messages via email and WhatsApp.
              </p>
              {profile.notificationsConsentGivenAt && !profile.notificationsConsentWithdrawn && (
                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>Active since: {new Date(profile.notificationsConsentGivenAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                </div>
              )}
              {profile.notificationsConsentWithdrawn && profile.notificationsConsentWithdrawnAt && (
                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>Turned off on: {new Date(profile.notificationsConsentWithdrawnAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-200/80">
              {profile.notificationsConsent && !profile.notificationsConsentWithdrawn ? (
                <button
                  type="button"
                  disabled={isUpdatingNotifications}
                  onClick={() => handleToggleNotificationsConsent(false)}
                  className="w-full inline-flex items-center justify-center px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>{isUpdatingNotifications ? 'Updating...' : 'Turn Off Notifications'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isUpdatingNotifications}
                  onClick={() => handleToggleNotificationsConsent(true)}
                  className="w-full inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>{isUpdatingNotifications ? 'Updating...' : 'Turn On Notifications (Grant Yes)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statutory DPDPA Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Right to Access & Portability */}
        <div className="bg-white rounded-3xl border border-brand-light-green p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Download className="w-5 h-5 text-brand-green" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900">
              Right to Access &amp; Portability
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Export an unencrypted, machine-readable JSON archive containing all your personal metrics, onboarding intake, weekly check-ins, custom foods, and training splits.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleDownloadJson}
              disabled={isExporting}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span>{isExporting ? 'Preparing Archive...' : 'Download My Data (JSON)'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenSummaryModal}
              className="w-full inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
              <span>View Plain Text Summary</span>
            </button>
          </div>
        </div>

        {/* Card 2: Right to Withdraw Consent */}
        <div className="bg-white rounded-3xl border border-brand-light-green p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900">
              Right to Withdraw Consent
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Under DPDPA Section 6, all consents default to &quot;Yes&quot; on login. You hold the statutory right to withdraw or turn off consent at any time. Coaching program adjustments are paused while consent is turned off.
            </p>
          </div>

          <div className="pt-2">
            {profile.healthDataConsent && !profile.isConsentWithdrawn ? (
              <button
                type="button"
                onClick={() => setShowRevokeModal(true)}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
              >
                <UserX className="w-4 h-4 mr-1.5 text-amber-700" />
                <span>Revoke Health Data Consent</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmRegrant}
                disabled={isRegranting}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>{isRegranting ? 'Re-granting...' : 'Re-grant Health Consent'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Right to Erasure (Deletion) */}
        <div className="bg-white rounded-3xl border border-red-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-display font-bold text-lg text-red-950">
              Right to Erasure (Account Deletion)
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Permanently purge all your personal records, health evaluations, weekly tracker check-ins, and custom nutrition/workout plans from our databases.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmationInput('');
                setShowDeleteModal(true);
              }}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              <span>Delete Account &amp; Health Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statutory Grievance Redressal Card */}
      <div className="bg-white rounded-3xl border border-brand-light-green p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-brand-light-green pb-4">
          <div className="p-2.5 rounded-xl bg-brand-light-green text-brand-dark-green">
            <Shield className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-dark-green">
              Statutory Grievance Redressal Mechanism
            </h3>
            <p className="text-xs text-gray-500">
              Under Section 13 of the Digital Personal Data Protection Act, 2023
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Data Fiduciary</span>
            <div className="font-bold text-gray-900 text-sm">Fitkode Studio</div>
            <div className="text-gray-500 text-[11px]">Evidence-based Fitness &amp; Nutrition</div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Grievance Officer</span>
            <div className="font-bold text-brand-dark-green text-sm">Chinmay Jain</div>
            <div className="text-gray-500 text-[11px]">INFS Certified Specialist</div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-brand-green" />
              Contact Email
            </span>
            <a href="mailto:myfitkode@gmail.com" className="font-bold text-brand-green hover:underline text-sm block">
              myfitkode@gmail.com
            </a>
            <div className="text-gray-500 text-[11px]">+91 98284 02190</div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-green" />
              Resolution SLA
            </span>
            <div className="font-bold text-gray-900 text-sm">Within 72 Hours</div>
            <div className="text-gray-500 text-[11px]">Statutory Turnaround Guarantee</div>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-950">
          <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Registered Office:</strong> A1905, Prateek Wisteria Society, Sec-77, Noida-201301 (India)
          </span>
        </div>
      </div>

      {/* Standard Non-Medical Disclaimer */}
      <MedicalDisclaimer variant="card" />

      {/* MODAL 1: Plain-Text Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-xl border border-gray-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-brand-green" />
                <h3 className="font-display font-bold text-lg text-gray-900">Personal &amp; Health Data Summary</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-2xl border border-gray-200 font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
              {summaryText}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-emerald-200" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy Summary Text
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Revoke Consent Confirmation Dialog */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-xl border border-amber-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">
                Revoke Health Data Processing Consent?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mt-2">
                Under DPDPA 2023 Section 6, revoking consent will immediately halt all processing of your sensitive body metrics and dietary history.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong className="block font-bold">Important Notice:</strong>
              <p className="text-[11px] leading-relaxed">
                Your assigned coach will not be able to tailor new meal recipes or adjust your workout program while consent is withdrawn. You may re-grant consent at any time from this dashboard.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                disabled={isRevoking}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={isRevoking}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRevoking ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Destructive Erasure Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border-2 border-red-300">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-red-950">
                  Permanent Account &amp; Data Erasure
                </h3>
                <span className="text-xs text-red-600 font-semibold">Irreversible DPDPA Action</span>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              This action will permanently delete all your records from Fitkode systems, including:
            </p>

            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <li>Complete personal profile and health metrics</li>
              <li>7-section onboarding questionnaire &amp; symptom scores</li>
              <li>All logged weekly body tracker entries &amp; milestone notes</li>
              <li>All active meal plans, workout routines, and custom exercises</li>
              <li>Account association in the member roster</li>
            </ul>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                To confirm permanent deletion, type <span className="text-red-600 font-mono">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-red-200 text-sm focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmErasure}
                disabled={isDeleting || deleteConfirmationInput.trim().toUpperCase() !== 'DELETE'}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Erasing Everything...' : 'Permanently Delete My Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
