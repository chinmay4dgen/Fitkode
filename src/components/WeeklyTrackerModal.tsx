import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  Camera,
} from 'lucide-react';
import { WeeklyTrackerEntry } from '../types';
import { compressImageFile, loadUserWeeklyEntries } from '../lib/weeklyTrackerStore';

interface WeeklyTrackerModalProps {
  existingEntry?: WeeklyTrackerEntry | null;
  defaultEmail: string;
  defaultFirstName?: string;
  defaultLastName?: string;
  suggestedWeekNumber?: number;
  allEntries?: WeeklyTrackerEntry[];
  onSave: (entry: WeeklyTrackerEntry) => Promise<void>;
  onClose: () => void;
}

export default function WeeklyTrackerModal({
  existingEntry,
  defaultEmail,
  defaultFirstName = '',
  defaultLastName = '',
  suggestedWeekNumber = 1,
  allEntries,
  onSave,
  onClose,
}: WeeklyTrackerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showMeasurementGuide, setShowMeasurementGuide] = useState(false);
  const [showGuidelineBanner, setShowGuidelineBanner] = useState(() => {
    try {
      return sessionStorage.getItem('fk_weighin_guideline_dismissed_session') !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismissGuideline = () => {
    try {
      sessionStorage.setItem('fk_weighin_guideline_dismissed_session', 'true');
    } catch {
      // Safe fallback
    }
    setShowGuidelineBanner(false);
    setShowMeasurementGuide(false);
  };

  // Close and record session dismissal so modal does not appear again in this session
  const handleClose = () => {
    try {
      sessionStorage.setItem('fk_weekly_checkin_dismissed_session', 'true');
    } catch {
      // Safe fallback
    }
    onClose();
  };

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute today's date and previous check-in info
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Calculate previous logged check-in (only if at least 1 check-in was ever done)
  const userEntries = (allEntries && allEntries.length > 0)
    ? allEntries
    : loadUserWeeklyEntries(defaultEmail);

  const pastEntries = userEntries
    .filter((e) => !existingEntry || e.id !== existingEntry.id)
    .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

  const latestPastEntry = pastEntries.length > 0 ? pastEntries[0] : null;

  let lastLoggedText: string | null = null;
  if (latestPastEntry && latestPastEntry.checkInDate) {
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const parts = latestPastEntry.checkInDate.split('-');
    let lastDateMidnight = 0;
    let formattedPastDate = latestPastEntry.checkInDate;
    if (parts.length === 3) {
      const yr = parseInt(parts[0], 10);
      const mo = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dObj = new Date(yr, mo, day);
      lastDateMidnight = dObj.getTime();
      formattedPastDate = dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } else {
      const dObj = new Date(latestPastEntry.checkInDate);
      lastDateMidnight = dObj.getTime();
      formattedPastDate = dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const diffDays = Math.max(0, Math.floor((todayMidnight - lastDateMidnight) / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) {
      lastLoggedText = `Last data logged today (${formattedPastDate})`;
    } else if (diffDays === 1) {
      lastLoggedText = `Last data logged 1 day before (${formattedPastDate})`;
    } else {
      lastLoggedText = `Last data logged ${diffDays} days before (${formattedPastDate})`;
    }
  }

  // Form State initialized to existingEntry or clean defaults
  const [formData, setFormData] = useState<Partial<WeeklyTrackerEntry>>(() => {
    if (existingEntry) return { ...existingEntry };
    return {
      id: `chk_${Date.now()}`,
      userEmail: defaultEmail,
      firstName: defaultFirstName,
      lastName: defaultLastName,
      checkInDate: new Date().toISOString().split('T')[0],
      weekNumber: suggestedWeekNumber,
      avgStepsPerDay: 8000,
      weightKg: 70.0,
      waistInches: 32.0,
      hipsInches: 38.0,
      neckInches: 14.0,
      quadsInches: 22.0,
      chestInches: 38.0,
      upperRightArmInches: 13.0,
      resistanceWorkoutDays: 3,
      hiitCardioDays: 2,
      avgCaloriesPerDay: 2000,
      frontPicUrl: '',
      leftPicUrl: '',
      rightPicUrl: '',
      backPicUrl: '',
      challengesFaced: '',
    };
  });

  const [compressingPose, setCompressingPose] = useState<string | null>(null);

  const handleNumberChange = (field: keyof WeeklyTrackerEntry, val: string) => {
    const num = parseFloat(val);
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num,
    }));
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    pose: 'frontPicUrl' | 'leftPicUrl' | 'rightPicUrl' | 'backPicUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressingPose(pose);
      const compressedDataUrl = await compressImageFile(file, 900, 0.75);
      setFormData((prev) => ({
        ...prev,
        [pose]: compressedDataUrl,
      }));
    } catch (err) {
      console.error('Photo processing error:', err);
      setFormError('Failed to process photo. Please try a standard JPG/PNG image.');
    } finally {
      setCompressingPose(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const userEmail = formData.userEmail?.trim() || defaultEmail;
    if (!userEmail) {
      setFormError('User email is required.');
      return;
    }
    if (!formData.weightKg || formData.weightKg <= 20 || formData.weightKg > 300) {
      setFormError('Please enter a realistic morning body weight (kg).');
      return;
    }
    if (!formData.waistInches || formData.waistInches <= 15) {
      setFormError('Please enter a valid waist measurement in inches.');
      return;
    }

    try {
      setIsSubmitting(true);
      const finalEntry: WeeklyTrackerEntry = {
        id: formData.id || `chk_${Date.now()}`,
        userId: formData.userId || defaultEmail,
        userEmail: userEmail,
        firstName: formData.firstName || defaultFirstName || '',
        lastName: formData.lastName || defaultLastName || '',
        checkInDate: formData.checkInDate || new Date().toISOString().split('T')[0],
        weekNumber: Number(formData.weekNumber) || suggestedWeekNumber || 1,
        avgStepsPerDay: Number(formData.avgStepsPerDay) || 0,
        weightKg: Number(formData.weightKg) || 0,
        waistInches: Number(formData.waistInches) || 0,
        hipsInches: Number(formData.hipsInches) || 0,
        neckInches: Number(formData.neckInches) || 0,
        quadsInches: Number(formData.quadsInches) || 0,
        chestInches: Number(formData.chestInches) || 0,
        upperRightArmInches: Number(formData.upperRightArmInches) || 0,
        resistanceWorkoutDays: Number(formData.resistanceWorkoutDays) || 0,
        hiitCardioDays: Number(formData.hiitCardioDays) || 0,
        avgCaloriesPerDay: Number(formData.avgCaloriesPerDay) || 0,
        frontPicUrl: formData.frontPicUrl || '',
        leftPicUrl: formData.leftPicUrl || '',
        rightPicUrl: formData.rightPicUrl || '',
        backPicUrl: formData.backPicUrl || '',
        challengesFaced: formData.challengesFaced || '',
        coachFeedback: formData.coachFeedback || '',
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(finalEntry);
      try {
        sessionStorage.setItem('fk_weekly_checkin_dismissed_session', 'true');
      } catch {
        // ignore
      }
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save weekly check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-brand-light-green flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-emerald-50/20 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-light-green text-brand-green flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base sm:text-lg tracking-tight">
                {existingEntry ? 'Edit Weekly Check-in' : 'Weekly Check-in'}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                <span className="flex items-center text-gray-700 font-medium">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-brand-green shrink-0 inline" />
                  Today: <strong className="text-gray-900 ml-1">{todayFormatted}</strong>
                </span>
                {lastLoggedText && (
                  <>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <span className="text-emerald-800 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-md text-[11px]">
                      {lastLoggedText}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions Alert Banner (Closable for session) */}
        {showGuidelineBanner && (
          <>
            <div className="bg-emerald-50/90 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-emerald-100 flex items-start sm:items-center justify-between text-xs text-emerald-900 shrink-0 gap-2">
              <div className="flex items-start space-x-2 min-w-0">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
                <span className="leading-snug">
                  <strong>Crucial Weigh-in Guideline:</strong> Kindly note your weight after freshening up, empty stomach, 1st thing in the morning.
                </span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMeasurementGuide(!showMeasurementGuide)}
                  className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950 shrink-0 cursor-pointer whitespace-nowrap"
                >
                  {showMeasurementGuide ? 'Hide Guide' : 'How to Measure?'}
                </button>
                <button
                  type="button"
                  onClick={handleDismissGuideline}
                  className="p-1 rounded-lg text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100/80 transition-colors cursor-pointer shrink-0"
                  title="Close for this session"
                  aria-label="Close guideline for this session"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Measurement Guide Drawer if toggled */}
            {showMeasurementGuide && (
              <div className="bg-gray-50 p-4 border-b border-gray-200 text-xs text-gray-700 space-y-1.5 shrink-0 animate-in fade-in duration-150">
                <div className="flex items-center justify-between font-bold text-gray-900 mb-1">
                  <span>Anatomical Tape Measurement Points:</span>
                  <button
                    type="button"
                    onClick={() => setShowMeasurementGuide(false)}
                    className="text-[11px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                  >
                    Close Guide
                  </button>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-gray-600 list-disc list-inside">
                  <li><strong>Waist:</strong> Measure at narrowest point or 1 inch above navel.</li>
                  <li><strong>Hips:</strong> Measure around the widest part of glutes.</li>
                  <li><strong>Neck:</strong> Measure just below the Adam’s apple.</li>
                  <li><strong>Chest:</strong> Measure across the fullest part at nipple line.</li>
                  <li><strong>Quads:</strong> Measure midpoint between hip joint and knee.</li>
                  <li><strong>Upper Right Arm:</strong> Measure at the peak of flexed or relaxed bicep.</li>
                </ul>
              </div>
            )}
          </>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {formError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Body Weight & Body Circumference Measurements - All 1 in a line with uniform styling */}
          <div className="space-y-3">
            {/* Weight */}
            <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
              <label className="block text-emerald-900 font-bold mb-1 text-xs sm:text-sm">
                Your Weight (in kgs) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.weightKg || ''}
                  onChange={(e) => handleNumberChange('weightKg', e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-xl border border-emerald-300 bg-white text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. 68.4"
                  required
                />
                <span className="absolute right-3.5 top-3 text-xs text-gray-400 font-bold pointer-events-none">kg</span>
              </div>
              <p className="text-[10px] text-emerald-700 mt-1">Empty stomach, after freshening up</p>
            </div>

            {/* Waist */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
              <label className="block text-gray-800 font-semibold mb-1 text-xs sm:text-sm">
                Waist (inches) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.waistInches || ''}
                  onChange={(e) => handleNumberChange('waistInches', e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  placeholder="e.g. 32.0"
                  required
                />
                <span className="absolute right-3.5 top-3 text-xs text-gray-400 font-bold pointer-events-none">in</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">1 inch above navel</p>
            </div>

            {/* Hips */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
              <label className="block text-gray-800 font-semibold mb-1 text-xs sm:text-sm">
                Hips (inches) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.hipsInches || ''}
                  onChange={(e) => handleNumberChange('hipsInches', e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  placeholder="e.g. 38.5"
                  required
                />
                <span className="absolute right-3.5 top-3 text-xs text-gray-400 font-bold pointer-events-none">in</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Widest part of hips/glutes</p>
            </div>

            {/* Chest */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
              <label className="block text-gray-800 font-semibold mb-1 text-xs sm:text-sm">
                Chest (inches) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.chestInches || ''}
                  onChange={(e) => handleNumberChange('chestInches', e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  placeholder="e.g. 38.0"
                  required
                />
                <span className="absolute right-3.5 top-3 text-xs text-gray-400 font-bold pointer-events-none">in</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Widest part of chest/bust line</p>
            </div>

            {/* Upper Right Arm */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
              <label className="block text-gray-800 font-semibold mb-1 text-xs sm:text-sm">
                Upper Right Arm (inches) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.upperRightArmInches || ''}
                  onChange={(e) => handleNumberChange('upperRightArmInches', e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  placeholder="e.g. 13.0"
                  required
                />
                <span className="absolute right-3.5 top-3 text-xs text-gray-400 font-bold pointer-events-none">in</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Midpoint of flexed bicep</p>
            </div>

            {/* Quads */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
              <label className="block text-gray-800 font-semibold mb-1 text-xs sm:text-sm">
                Quads (inches) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.quadsInches || ''}
                  onChange={(e) => handleNumberChange('quadsInches', e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  placeholder="e.g. 22.0"
                  required
                />
                <span className="absolute right-3.5 top-3 text-xs text-gray-400 font-bold pointer-events-none">in</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Midpoint between hip joint and knee</p>
            </div>

            {/* Neck */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200">
              <label className="block text-gray-800 font-semibold mb-1 text-xs sm:text-sm">
                Neck (inches) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.neckInches || ''}
                  onChange={(e) => handleNumberChange('neckInches', e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  placeholder="e.g. 14.0"
                  required
                />
                <span className="absolute right-3.5 top-3 text-xs text-gray-400 font-bold pointer-events-none">in</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Below Adam's apple, narrowest point</p>
            </div>
          </div>

          {/* Weekly Activity & Caloric Intake */}
          <div className="space-y-4 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Avg. steps per day in the last week (7 days) *
                </label>
                <input
                  type="number"
                  step="100"
                  value={formData.avgStepsPerDay || ''}
                  onChange={(e) => handleNumberChange('avgStepsPerDay', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-blue-700 focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  placeholder="e.g. 8500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Avg. Calories consumed per day? *
                </label>
                <input
                  type="number"
                  step="50"
                  value={formData.avgCaloriesPerDay || ''}
                  onChange={(e) => handleNumberChange('avgCaloriesPerDay', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-amber-700 focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  placeholder="e.g. 1950"
                  required
                />
              </div>
            </div>

            {/* Workout Days Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Resistance workout done in last week (0-7 days) *
                </label>
                <div className="flex items-center space-x-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, resistanceWorkoutDays: num }))}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        formData.resistanceWorkoutDays === num
                          ? 'bg-brand-green text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Cardio or HIIT sessions in last week (0-7 days) *
                </label>
                <div className="flex items-center space-x-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, hiitCardioDays: num }))}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        formData.hiitCardioDays === num
                          ? 'bg-brand-green text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Member Progression Photos */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800 text-xs">
                Progression Photos (Optional)
              </span>
              <span className="text-[10px] text-gray-400">
                Visible only to your coach and you
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* Front Pose */}
              <div className="border border-gray-200 rounded-2xl p-2.5 bg-gray-50 flex flex-col items-center justify-center text-center space-y-2 relative">
                <span className="text-[10px] font-bold text-gray-600 uppercase">Front Pose</span>
                {formData.frontPicUrl ? (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden group">
                    <img src={formData.frontPicUrl} alt="Front" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, frontPicUrl: '' }))}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white">
                    <Camera className="w-5 h-5 mb-1 text-gray-300" />
                    <span className="text-[10px]">No photo</span>
                  </div>
                )}
                <label className="w-full py-1 px-2 rounded-lg bg-white border border-gray-200 hover:border-brand-green text-[11px] font-semibold text-gray-700 text-center cursor-pointer transition-colors block">
                  {formData.frontPicUrl ? 'Change Photo' : 'Upload Front'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'frontPicUrl')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Left Side Pose */}
              <div className="border border-gray-200 rounded-2xl p-2.5 bg-gray-50 flex flex-col items-center justify-center text-center space-y-2 relative">
                <span className="text-[10px] font-bold text-gray-600 uppercase">Left Side Pose</span>
                {formData.leftPicUrl ? (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden group">
                    <img src={formData.leftPicUrl} alt="Left" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, leftPicUrl: '' }))}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white">
                    <Camera className="w-5 h-5 mb-1 text-gray-300" />
                    <span className="text-[10px]">No photo</span>
                  </div>
                )}
                <label className="w-full py-1 px-2 rounded-lg bg-white border border-gray-200 hover:border-brand-green text-[11px] font-semibold text-gray-700 text-center cursor-pointer transition-colors block">
                  {formData.leftPicUrl ? 'Change Photo' : 'Upload Left'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'leftPicUrl')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Right Side Pose */}
              <div className="border border-gray-200 rounded-2xl p-2.5 bg-gray-50 flex flex-col items-center justify-center text-center space-y-2 relative">
                <span className="text-[10px] font-bold text-gray-600 uppercase">Right Side Pose</span>
                {formData.rightPicUrl ? (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden group">
                    <img src={formData.rightPicUrl} alt="Right" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, rightPicUrl: '' }))}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white">
                    <Camera className="w-5 h-5 mb-1 text-gray-300" />
                    <span className="text-[10px]">No photo</span>
                  </div>
                )}
                <label className="w-full py-1 px-2 rounded-lg bg-white border border-gray-200 hover:border-brand-green text-[11px] font-semibold text-gray-700 text-center cursor-pointer transition-colors block">
                  {formData.rightPicUrl ? 'Change Photo' : 'Upload Right'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'rightPicUrl')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Back Pose */}
              <div className="border border-gray-200 rounded-2xl p-2.5 bg-gray-50 flex flex-col items-center justify-center text-center space-y-2 relative">
                <span className="text-[10px] font-bold text-gray-600 uppercase">Back Pose</span>
                {formData.backPicUrl ? (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden group">
                    <img src={formData.backPicUrl} alt="Back" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, backPicUrl: '' }))}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white">
                    <Camera className="w-5 h-5 mb-1 text-gray-300" />
                    <span className="text-[10px]">No photo</span>
                  </div>
                )}
                <label className="w-full py-1 px-2 rounded-lg bg-white border border-gray-200 hover:border-brand-green text-[11px] font-semibold text-gray-700 text-center cursor-pointer transition-colors block">
                  {formData.backPicUrl ? 'Change Photo' : 'Upload Back'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'backPicUrl')}
                    className="hidden"
                  />
                </label>
              </div>

            </div>
          </div>

          {/* Client Challenges / Reflections */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <label className="block text-gray-800 font-semibold">
              Any challenges faced in workout, diet, or routine?
            </label>
            <textarea
              rows={3}
              value={formData.challengesFaced || ''}
              onChange={(e) => setFormData((p) => ({ ...p, challengesFaced: e.target.value }))}
              placeholder="e.g. Felt hunger pangs around late evening; had joint soreness after lunges; travel schedule made hitting 10k steps challenging..."
              className="w-full p-3 rounded-2xl border border-gray-200 text-xs text-gray-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green leading-relaxed"
            />
            <p className="text-[11px] text-gray-400">
              Reviewed by your coach to adjust your workouts, rest periods, and nutrition.
            </p>
          </div>

          {/* Modal Submit Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white font-bold transition-all shadow-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving Check-in...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{existingEntry ? 'Update Check-in' : 'Save Weekly Check-in'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
