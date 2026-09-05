import React, { useState, useRef } from 'react';
import {
  X,
  Calendar,
  Camera,
  Upload,
  Ruler,
  Scale,
  Activity,
  Flame,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { WeeklyTrackerEntry } from '../types';
import { compressImageFile } from '../lib/weeklyTrackerStore';

interface WeeklyTrackerModalProps {
  existingEntry?: WeeklyTrackerEntry | null;
  defaultEmail: string;
  defaultFirstName?: string;
  defaultLastName?: string;
  suggestedWeekNumber?: number;
  onSave: (entry: WeeklyTrackerEntry) => Promise<void>;
  onClose: () => void;
}

export default function WeeklyTrackerModal({
  existingEntry,
  defaultEmail,
  defaultFirstName = '',
  defaultLastName = '',
  suggestedWeekNumber = 1,
  onSave,
  onClose,
}: WeeklyTrackerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showMeasurementGuide, setShowMeasurementGuide] = useState(false);

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

    if (!formData.userEmail?.trim()) {
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
        userEmail: formData.userEmail.trim(),
        firstName: formData.firstName || defaultFirstName || '',
        lastName: formData.lastName || defaultLastName || '',
        checkInDate: formData.checkInDate || new Date().toISOString().split('T')[0],
        weekNumber: Number(formData.weekNumber) || 1,
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
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save weekly check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-brand-light-green flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-natural-oat/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-light-green text-brand-green flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">
                {existingEntry ? 'Edit Weekly Health Check-in' : 'Log Weekly Health Statistics'}
              </h2>
              <p className="text-xs text-gray-500">
                Fitkode client weekly tracker update (Questions 1 – 19)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions Alert Banner */}
        <div className="bg-emerald-50/80 px-6 py-3 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900 shrink-0">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Crucial Weigh-in Guideline:</strong> Kindly note your weight after freshening up, empty stomach, 1st thing in the morning.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowMeasurementGuide(!showMeasurementGuide)}
            className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950 shrink-0 cursor-pointer ml-3"
          >
            {showMeasurementGuide ? 'Hide Tape Guide' : 'How to Measure?'}
          </button>
        </div>

        {/* Measurement Guide Drawer if toggled */}
        {showMeasurementGuide && (
          <div className="bg-gray-50 p-4 border-b border-gray-200 text-xs text-gray-700 space-y-1.5 shrink-0 animate-in fade-in duration-150">
            <p className="font-bold text-gray-900">Anatomical Tape Measurement Points:</p>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {formError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Check-in Meta & Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              1. Check-in Timeline & Member Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Week Number *</label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={formData.weekNumber || 1}
                  onChange={(e) => handleNumberChange('weekNumber', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Check-in Date *</label>
                <input
                  type="date"
                  value={formData.checkInDate || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, checkInDate: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Email Address (Q1) *</label>
              <input
                type="email"
                value={formData.userEmail || ''}
                readOnly
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Section 2: Core Body Weight & Circumference Measurements */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green flex items-center">
              <Scale className="w-3.5 h-3.5 mr-1.5" />
              2. Body Weight & Body Circumference (Inches)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Weight */}
              <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                <label className="block text-emerald-900 font-bold mb-1">
                  Your Weight (in kgs) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weightKg || ''}
                    onChange={(e) => handleNumberChange('weightKg', e.target.value)}
                    className="w-full p-2 rounded-xl border border-emerald-300 bg-white text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 68.4"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">kg</span>
                </div>
                <p className="text-[10px] text-emerald-700 mt-1">Empty stomach, after freshening up</p>
              </div>

              {/* Waist */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="block text-gray-800 font-bold mb-1">
                  Waist (inches) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.waistInches || ''}
                    onChange={(e) => handleNumberChange('waistInches', e.target.value)}
                    className="w-full p-2 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green"
                    placeholder="e.g. 32.0"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">in</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">1 inch above navel</p>
              </div>

              {/* Hips */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <label className="block text-gray-800 font-bold mb-1">
                  Hips (inches) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hipsInches || ''}
                    onChange={(e) => handleNumberChange('hipsInches', e.target.value)}
                    className="w-full p-2 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green"
                    placeholder="e.g. 38.5"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">in</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Widest part of hips/glutes</p>
              </div>
            </div>

            {/* Other Circumference Measurements */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Chest (inches) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.chestInches || ''}
                  onChange={(e) => handleNumberChange('chestInches', e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-900"
                  placeholder="38.0"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Upper Right Arm *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.upperRightArmInches || ''}
                  onChange={(e) => handleNumberChange('upperRightArmInches', e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-900"
                  placeholder="12.5"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Quads (inches) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.quadsInches || ''}
                  onChange={(e) => handleNumberChange('quadsInches', e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-900"
                  placeholder="22.0"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Neck (inches) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.neckInches || ''}
                  onChange={(e) => handleNumberChange('neckInches', e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-900"
                  placeholder="14.0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Activity, Nutrition & Workout Consistency */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              3. Weekly Activity & Caloric Intake
            </h4>

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
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-blue-700 focus:border-brand-green"
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
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-amber-700 focus:border-brand-green"
                  placeholder="e.g. 1950"
                  required
                />
              </div>
            </div>

            {/* Days Selection: Resistance and HIIT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-gray-700 font-semibold mb-1.5">
                  Number of days Resistance workout done in last week? *
                </label>
                <div className="flex items-center space-x-1.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((days) => {
                    const isSelected = formData.resistanceWorkoutDays === days;
                    return (
                      <button
                        key={`res-${days}`}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, resistanceWorkoutDays: days }))}
                        className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {days}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1.5">
                  Number of days HIIT/cardio done in last week? *
                </label>
                <div className="flex items-center space-x-1.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((days) => {
                    const isSelected = formData.hiitCardioDays === days;
                    return (
                      <button
                        key={`cardio-${days}`}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, hiitCardioDays: days }))}
                        className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {days}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Member Progression Photos (Q15 - Q18) */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green flex items-center">
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                4. Weekly Progression Photos (4 Poses)
              </h4>
              <span className="text-[10px] text-gray-400">
                Visible to Super Admin Chinmay & you only
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* 1. Front Body Pic */}
              <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-200 flex flex-col items-center text-center">
                <span className="text-[11px] font-bold text-gray-800 mb-1.5">Front Body Pic</span>
                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-white border border-dashed border-gray-300 flex items-center justify-center relative group">
                  {formData.frontPicUrl ? (
                    <img
                      src={formData.frontPicUrl}
                      alt="Front"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-2 text-gray-400 flex flex-col items-center">
                      <Camera className="w-6 h-6 mb-1 text-gray-300" />
                      <span className="text-[10px]">Front Pose</span>
                    </div>
                  )}
                  {compressingPose === 'frontPicUrl' && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[10px] font-bold text-brand-green">
                      Optimizing...
                    </div>
                  )}
                </div>
                <label className="mt-2 w-full py-1.5 px-2 bg-white hover:bg-brand-light-green/40 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 hover:text-brand-green cursor-pointer text-center truncate">
                  {formData.frontPicUrl ? 'Change Photo' : 'Upload Front'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'frontPicUrl')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 2. Left Profile Pic */}
              <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-200 flex flex-col items-center text-center">
                <span className="text-[11px] font-bold text-gray-800 mb-1.5">Left Profile Pic</span>
                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-white border border-dashed border-gray-300 flex items-center justify-center relative group">
                  {formData.leftPicUrl ? (
                    <img
                      src={formData.leftPicUrl}
                      alt="Left"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-2 text-gray-400 flex flex-col items-center">
                      <Camera className="w-6 h-6 mb-1 text-gray-300" />
                      <span className="text-[10px]">Left 90°</span>
                    </div>
                  )}
                  {compressingPose === 'leftPicUrl' && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[10px] font-bold text-brand-green">
                      Optimizing...
                    </div>
                  )}
                </div>
                <label className="mt-2 w-full py-1.5 px-2 bg-white hover:bg-brand-light-green/40 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 hover:text-brand-green cursor-pointer text-center truncate">
                  {formData.leftPicUrl ? 'Change Photo' : 'Upload Left'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'leftPicUrl')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 3. Right Profile Pic */}
              <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-200 flex flex-col items-center text-center">
                <span className="text-[11px] font-bold text-gray-800 mb-1.5">Right Profile Pic</span>
                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-white border border-dashed border-gray-300 flex items-center justify-center relative group">
                  {formData.rightPicUrl ? (
                    <img
                      src={formData.rightPicUrl}
                      alt="Right"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-2 text-gray-400 flex flex-col items-center">
                      <Camera className="w-6 h-6 mb-1 text-gray-300" />
                      <span className="text-[10px]">Right 90°</span>
                    </div>
                  )}
                  {compressingPose === 'rightPicUrl' && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[10px] font-bold text-brand-green">
                      Optimizing...
                    </div>
                  )}
                </div>
                <label className="mt-2 w-full py-1.5 px-2 bg-white hover:bg-brand-light-green/40 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 hover:text-brand-green cursor-pointer text-center truncate">
                  {formData.rightPicUrl ? 'Change Photo' : 'Upload Right'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'rightPicUrl')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 4. Back Profile Pic */}
              <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-200 flex flex-col items-center text-center">
                <span className="text-[11px] font-bold text-gray-800 mb-1.5">Back Profile Pic</span>
                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-white border border-dashed border-gray-300 flex items-center justify-center relative group">
                  {formData.backPicUrl ? (
                    <img
                      src={formData.backPicUrl}
                      alt="Back"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-2 text-gray-400 flex flex-col items-center">
                      <Camera className="w-6 h-6 mb-1 text-gray-300" />
                      <span className="text-[10px]">Back Pose</span>
                    </div>
                  )}
                  {compressingPose === 'backPicUrl' && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[10px] font-bold text-brand-green">
                      Optimizing...
                    </div>
                  )}
                </div>
                <label className="mt-2 w-full py-1.5 px-2 bg-white hover:bg-brand-light-green/40 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 hover:text-brand-green cursor-pointer text-center truncate">
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

          {/* Section 5: Client Challenges / Reflections (Q19) */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <label className="block text-gray-800 font-bold">
              Q19: Any challenges faced in workout or diet or anything? *
            </label>
            <textarea
              rows={3}
              value={formData.challengesFaced || ''}
              onChange={(e) => setFormData((p) => ({ ...p, challengesFaced: e.target.value }))}
              placeholder="e.g. Felt hunger pangs around late evening; had joint soreness after lunges; travel schedule made hitting 10k steps challenging..."
              className="w-full p-3 rounded-2xl border border-gray-200 text-xs text-gray-900 focus:border-brand-green focus:ring-1 focus:ring-brand-green leading-relaxed"
            />
            <p className="text-[11px] text-gray-400">
              This field is reviewed by Super Admin Coach Chinmay to adjust your workouts, rest periods, and macro breakdown.
            </p>
          </div>

          {/* Modal Submit Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
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
