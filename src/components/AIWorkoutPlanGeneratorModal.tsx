import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Dumbbell,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Activity,
  Calendar,
  Layers,
  HeartPulse,
  Flame,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  WorkoutPlan,
  WorkoutDay,
  ExerciseItem,
  WorkoutDifficulty,
  WorkoutGoal,
} from '../types';
import { getMemberOnboarding, extractMedicalSynopsis } from '../lib/medicalAssessmentHelper';
import { getStoredMembers } from '../lib/memberStore';
import { loadUserProfile } from '../lib/profileStorage';

interface AIWorkoutPlanGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName?: string;
  isCoachMode?: boolean;
  onPlanGenerated: (plan: WorkoutPlan) => void;
}

export default function AIWorkoutPlanGeneratorModal({
  isOpen,
  onClose,
  userEmail,
  userName = 'Member',
  isCoachMode = false,
  onPlanGenerated,
}: AIWorkoutPlanGeneratorModalProps) {
  const [step, setStep] = useState<'config' | 'preview'>('config');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form parameters pre-filled from client disclosures
  const [goal, setGoal] = useState<WorkoutGoal>('Hypertrophy & Muscle Gain');
  const [difficulty, setDifficulty] = useState<WorkoutDifficulty>('Intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [splitPreference, setSplitPreference] = useState<string>('Upper / Lower Split');
  const [gymAccess, setGymAccess] = useState<'yes' | 'no'>('yes');
  const [equipmentDetails, setEquipmentDetails] = useState<string>(
    'Commercial Gym with Barbells, Dumbbells, Cable Machines, and Squat Racks'
  );
  const [injuryLimitations, setInjuryLimitations] = useState<string>('');
  const [specialFocus, setSpecialFocus] = useState<string>('');

  // Generated Plan Result from Gemini
  const [generatedPlanData, setGeneratedPlanData] = useState<any | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // Medical synopsis from onboarding
  const medicalSynopsis = useMemo(() => {
    if (!isOpen) return null;
    const ob = getMemberOnboarding(userEmail);
    return extractMedicalSynopsis(ob);
  }, [isOpen, userEmail]);

  // Load from member data on open
  useEffect(() => {
    if (!isOpen) return;
    try {
      const members = getStoredMembers();
      const normEmail = userEmail?.toLowerCase().trim();
      const matchedMember = members.find(
        (m) => m.email?.toLowerCase().trim() === normEmail || m.id?.toLowerCase().trim() === normEmail
      );
      const ob = getMemberOnboarding(userEmail);
      const prof = matchedMember?.profile || loadUserProfile(userEmail);

      // Goal mapping
      const rawGoal = (ob.healthGoal || prof.healthGoal || '').toLowerCase();
      if (rawGoal.includes('muscle') || rawGoal.includes('gain') || rawGoal.includes('bodybuilding')) {
        setGoal('Hypertrophy & Muscle Gain');
        setSplitPreference('Push / Pull / Legs (PPL)');
        setDaysPerWeek(5);
      } else if (rawGoal.includes('powerlifting') || rawGoal.includes('strength')) {
        setGoal('Strength & Power');
        setSplitPreference('Upper / Lower Split');
        setDaysPerWeek(4);
      } else if (rawGoal.includes('sports') || rawGoal.includes('performance')) {
        setGoal('Athletic Conditioning');
        setSplitPreference('Full Body & Plyometric Split');
        setDaysPerWeek(4);
      } else if (rawGoal.includes('weight loss') || rawGoal.includes('fat loss')) {
        setGoal('Fat Loss & Conditioning');
        setSplitPreference('Upper / Lower Split + Metabolic Finishers');
        setDaysPerWeek(4);
      } else {
        setGoal('General Fitness & Longevity');
        setSplitPreference('Full Body Routine (3 Days)');
        setDaysPerWeek(3);
      }

      // Gym Access
      const rawGym = (ob.gymAccess || '').toLowerCase();
      if (rawGym.includes('no') || rawGym.includes('home')) {
        setGymAccess('no');
        setEquipmentDetails('Home Gym / Dumbbells & Resistance Bands');
      } else {
        setGymAccess('yes');
        setEquipmentDetails('Commercial Gym with Barbells, Dumbbells, Cable Machines, and Squat Racks');
      }

      // Limitations / Injuries from clinical synopsis
      const synopsis = extractMedicalSynopsis(ob);
      const limitations: string[] = [];
      if (synopsis.injuriesAndSurgeries && synopsis.injuriesAndSurgeries.length > 0) {
        limitations.push(`Injuries/Surgeries: ${synopsis.injuriesAndSurgeries.join(', ')}`);
      }
      if (synopsis.physicalLimitations && synopsis.physicalLimitations.length > 0) {
        limitations.push(`Limitations: ${synopsis.physicalLimitations.join(', ')}`);
      }
      if (ob.medicalAndSurgicalHistory && ob.medicalAndSurgicalHistory.trim().length > 0 && !['none', 'no', 'nil', 'n/a'].includes(ob.medicalAndSurgicalHistory.trim().toLowerCase())) {
        limitations.push(`Medical History: ${ob.medicalAndSurgicalHistory}`);
      }
      if (limitations.length > 0) {
        setInjuryLimitations(limitations.join('. '));
      }
    } catch (err) {
      console.warn('Error pre-filling workout generator modal:', err);
    }
  }, [isOpen, userEmail]);

  const handleGenerateRoutine = async () => {
    setLoading(true);
    setError(null);

    const fullLimitations = [
      injuryLimitations.trim(),
      specialFocus.trim() ? `Special Focus / Coaching Notes: ${specialFocus.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      setFallbackNotice(null);
      const res = await fetch('/api/generate-workout-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberEmail: userEmail,
          memberName: userName,
          goal,
          difficulty,
          daysPerWeek,
          splitPreference,
          gymAccess,
          equipmentAvailable: equipmentDetails,
          limitationsAndInjuries: fullLimitations,
          isCoachMode,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.warn('Non-JSON response from /api/generate-workout-plan:', text);
        if (res.status === 504 || res.status === 502) {
          throw new Error('The AI workout planner request timed out during peak API traffic. Please try again.');
        }
        throw new Error(`Server returned unexpected status (${res.status}). Please try again.`);
      }

      if (!res.ok || !data.success || !data.plan_data) {
        throw new Error(data.error || 'Server failed to formulate workout routine with Gemini.');
      }

      setGeneratedPlanData(data.plan_data);
      if (data.fallback_notice) {
        setFallbackNotice(data.fallback_notice);
      }
      setStep('preview');
    } catch (err: any) {
      console.error('Error generating workout plan:', err);
      setError(err.message || 'Failed to connect to AI exercise programming service.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptAndSaveRoutine = () => {
    if (!generatedPlanData) return;

    const now = new Date().toISOString();
    const planName = isCoachMode
      ? `Coach Plan: ${generatedPlanData.plan_name || `${goal} (${daysPerWeek}-Day)`}`
      : generatedPlanData.plan_name || `Personal Routine (${goal})`;

    // Map days from Gemini output into Fitkode WorkoutDay and ExerciseItem interface
    const mappedDays: WorkoutDay[] = (generatedPlanData.days || []).map((d: any, dayIdx: number) => {
      const exercises: ExerciseItem[] = (d.exercises || []).map((ex: any, exIdx: number) => ({
        id: `ex_ai_${Date.now()}_${dayIdx}_${exIdx}`,
        name: ex.name,
        targetMuscle: ex.target_muscle || 'Full Body',
        sets: Number(ex.sets) || 3,
        reps: String(ex.reps || '10-12'),
        restSeconds: Number(ex.rest_seconds) || 60,
        notes: ex.notes || 'Strict form, controlled tempo.',
        isCustom: true,
        createdBy: isCoachMode ? 'coach' : 'user',
      }));

      return {
        id: `day_ai_${Date.now()}_${dayIdx}`,
        dayName: d.day_name || `Day ${dayIdx + 1}`,
        isRestDay: Boolean(d.is_rest_day),
        focus: d.focus || (d.is_rest_day ? 'Rest & Recovery' : 'Strength & Hypertrophy'),
        exercises,
      };
    });

    const adoptedPlan: WorkoutPlan = {
      id: isCoachMode ? `coach_workout_ai_${Date.now()}` : `workout_ai_${Date.now()}`,
      name: planName,
      userId: userEmail,
      userEmail: userEmail,
      difficulty,
      goal,
      daysPerWeek,
      days: mappedDays,
      createdBy: isCoachMode ? 'coach' : 'user',
      coachName: isCoachMode ? 'Chinmay Jain' : undefined,
      coachNotes: isCoachMode
        ? `Coach Prescribed Exercise Routine formulated on ${new Date().toLocaleDateString('en-IN')} for ${userName}. Periodized for ${goal} across ${daysPerWeek} training days. ${generatedPlanData.coach_notes || ''}`
        : generatedPlanData.coach_notes || 'AI-Formulated Progressive Resistance Regimen.',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    onPlanGenerated(adoptedPlan);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {isCoachMode ? `Coach AI Exercise & Workout Routine Formulation` : 'AI Workout Routine Generator'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
                  {isCoachMode ? `Prescribing for ${userName}` : 'Sports Science CSCS Engine'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {isCoachMode
                  ? `Clinical periodization engine for ${userName} (${userEmail}). Synthesizes joint-friendly resistance training split tailored to member goals and equipment.`
                  : 'Evidence-based exercise programming with progressive overload, target muscle distribution, and joint longevity.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold text-xs">Generation Error</p>
                <p className="text-xs">{error}</p>
                <button
                  type="button"
                  onClick={handleGenerateRoutine}
                  className="mt-2 text-xs font-bold text-red-700 underline hover:text-red-900 cursor-pointer"
                >
                  Click here to retry generation
                </button>
              </div>
            </div>
          )}

          {step === 'config' && (
            <div className="space-y-6">
              {/* Medical & Injury Synopsis Alert */}
              {injuryLimitations && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex items-start space-x-3 shadow-2xs">
                  <HeartPulse className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-amber-950">
                      Member Medical & Orthopedic Disclosures Detected
                    </span>
                    <p className="text-amber-800/90 leading-relaxed">{injuryLimitations}</p>
                    <p className="text-[11px] text-amber-700 font-medium">
                      The AI formulation engine will strictly avoid movements contraindicated for these joints and select supportive, joint-friendly variations.
                    </p>
                  </div>
                </div>
              )}

              {/* Primary Program Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Fitness Goal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-purple-600" />
                    <span>Primary Training Goal</span>
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as WorkoutGoal)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
                  >
                    <option value="Hypertrophy & Muscle Gain">Hypertrophy & Muscle Gain</option>
                    <option value="Fat Loss & Conditioning">Fat Loss & Conditioning</option>
                    <option value="Strength & Power">Strength & Power</option>
                    <option value="General Fitness & Longevity">General Fitness & Longevity</option>
                    <option value="Athletic Conditioning">Athletic Conditioning</option>
                  </select>
                </div>

                {/* Days Per Week */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>Weekly Frequency</span>
                  </label>
                  <select
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
                  >
                    <option value={3}>3 Days (Full Body / Hybrid)</option>
                    <option value={4}>4 Days (Upper / Lower)</option>
                    <option value={5}>5 Days (Push / Pull / Legs + Upper)</option>
                    <option value={6}>6 Days (PPL x 2 Advanced Split)</option>
                  </select>
                </div>

                {/* Experience Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                    <Activity className="w-3.5 h-3.5 text-purple-600" />
                    <span>Experience Level</span>
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as WorkoutDifficulty)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
                  >
                    <option value="Beginner">Beginner (Foundational Movements)</option>
                    <option value="Intermediate">Intermediate (Progressive Resistance)</option>
                    <option value="Advanced">Advanced (High Volume & Intensity)</option>
                  </select>
                </div>

                {/* Split Structure */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    <span>Split Architecture Preference</span>
                  </label>
                  <select
                    value={splitPreference}
                    onChange={(e) => setSplitPreference(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
                  >
                    <option value="Push / Pull / Legs (PPL)">Push / Pull / Legs (Chest-Shoulders-Triceps, Back-Biceps, Quads-Hams-Glutes)</option>
                    <option value="Upper / Lower Split">Upper / Lower Split (Balanced Antagonist Pairing)</option>
                    <option value="Full Body Routine">Full Body Routine (High Frequency Compound Movements)</option>
                    <option value="Upper / Lower Split + Metabolic Finishers">Upper / Lower Split + Metabolic Conditioning Finishers</option>
                    <option value="Full Body & Plyometric Split">Full Body & Plyometric Split (Athletic Focus)</option>
                    <option value="Bodyweight & Calisthenics Routine">Bodyweight & Calisthenics Routine (Zero Machine Required)</option>
                  </select>
                </div>

                {/* Gym Access */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                    <Dumbbell className="w-3.5 h-3.5 text-purple-600" />
                    <span>Gym / Facility Access</span>
                  </label>
                  <select
                    value={gymAccess}
                    onChange={(e) => {
                      const val = e.target.value as 'yes' | 'no';
                      setGymAccess(val);
                      if (val === 'no') {
                        setEquipmentDetails('Home Gym / Dumbbells & Resistance Bands');
                      } else {
                        setEquipmentDetails('Commercial Gym with Barbells, Dumbbells, Cable Machines, and Squat Racks');
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
                  >
                    <option value="yes">Commercial Gym Access</option>
                    <option value="no">Home / Minimal Equipment</option>
                  </select>
                </div>
              </div>

              {/* Equipment Available */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Available Equipment Details</label>
                <input
                  type="text"
                  value={equipmentDetails}
                  onChange={(e) => setEquipmentDetails(e.target.value)}
                  placeholder="e.g. Full commercial gym, or pairs of 5kg and 10kg dumbbells + pullup bar"
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>

              {/* Injuries or Limitations */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>Physical Limitations, Surgeries, or Joint Sensitivities</span>
                  <span className="text-[10px] text-gray-400 font-normal">Pre-filled from onboarding disclosures</span>
                </label>
                <textarea
                  value={injuryLimitations}
                  onChange={(e) => setInjuryLimitations(e.target.value)}
                  placeholder="e.g. Mild lower back lumbar tightness (avoid heavy conventional deadlifts), rotator cuff impingement on left shoulder."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>

              {/* Coach Custom Guidance or Special Focus */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>Special Coaching Directives / Muscle Emphases</span>
                  <span className="text-[10px] text-purple-600 font-bold">Coach Custom Instruction</span>
                </label>
                <input
                  type="text"
                  value={specialFocus}
                  onChange={(e) => setSpecialFocus(e.target.value)}
                  placeholder="e.g. Emphasize side delt and upper chest volume; include 5-minute hip mobility warmup daily."
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
                />
              </div>

              {/* Informational Callout */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start space-x-3 text-xs text-purple-950">
                <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-purple-900">How AI Program Formulation Works</p>
                  <p className="text-purple-800/90 leading-relaxed text-[11px]">
                    The Fitkode AI Exercise Engine evaluates your parameters against exercise physiology standards. It balances compound multi-joint movements, accessory isolation work, antagonist muscle pairing, and exact sets, reps, and rest intervals. Once generated, you can review, tune, or assign it directly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && generatedPlanData && (
            <div className="space-y-6">
              {fallbackNotice && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{fallbackNotice}</span>
                </div>
              )}
              {/* Plan Summary Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-950 text-white shadow-sm space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-white/10 text-purple-200">
                      <Dumbbell className="w-4 h-4" />
                    </span>
                    <h4 className="font-bold text-base text-white">{generatedPlanData.plan_name}</h4>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                      {generatedPlanData.goal}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      {generatedPlanData.days_per_week} Days / Week
                    </span>
                  </div>
                </div>

                {generatedPlanData.coach_notes && (
                  <div className="pt-2 border-t border-white/10 text-xs text-purple-100/90 leading-relaxed">
                    <span className="font-bold text-purple-200">Coaching Guidance: </span>
                    {generatedPlanData.coach_notes}
                  </div>
                )}
              </div>

              {/* Weekly Split Days List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    7-Day Weekly Regimen Breakdown
                  </h5>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {(generatedPlanData.days || []).filter((d: any) => !d.is_rest_day).length} Active Training Days
                  </span>
                </div>

                <div className="space-y-3">
                  {(generatedPlanData.days || []).map((day: any, idx: number) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-4 transition-all ${
                        day.is_rest_day
                          ? 'bg-gray-50/70 border-gray-200 text-gray-600'
                          : 'bg-white border-purple-100 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              day.is_rest_day ? 'bg-gray-400' : 'bg-purple-600'
                            }`}
                          />
                          <span className="font-bold text-xs text-gray-900">{day.day_name}</span>
                          <span className="text-xs text-gray-500 font-medium">({day.focus})</span>
                        </div>
                        {day.is_rest_day ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-200 text-gray-700">
                            Rest / Recovery Day
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">
                            {(day.exercises || []).length} Exercises
                          </span>
                        )}
                      </div>

                      {/* Exercises List for active days */}
                      {!day.is_rest_day && Array.isArray(day.exercises) && day.exercises.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">
                            <span className="col-span-5 sm:col-span-4">Movement</span>
                            <span className="col-span-3 sm:col-span-2">Target</span>
                            <span className="col-span-2">Sets × Reps</span>
                            <span className="col-span-2 sm:col-span-2">Rest</span>
                            <span className="hidden sm:block sm:col-span-2">Cues</span>
                          </div>
                          {day.exercises.map((ex: any, exIdx: number) => (
                            <div
                              key={exIdx}
                              className="grid grid-cols-12 items-center text-xs p-2 rounded-xl bg-gray-50/80 hover:bg-purple-50/50 transition-colors"
                            >
                              <div className="col-span-5 sm:col-span-4 font-bold text-gray-900 pr-2 truncate">
                                {ex.name}
                              </div>
                              <div className="col-span-3 sm:col-span-2">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-gray-200 text-gray-700 truncate max-w-[90px]">
                                  {ex.target_muscle}
                                </span>
                              </div>
                              <div className="col-span-2 font-semibold text-purple-900">
                                {ex.sets} × {ex.reps}
                              </div>
                              <div className="col-span-2 sm:col-span-2 text-gray-500 font-medium">
                                {ex.rest_seconds}s
                              </div>
                              <div className="hidden sm:block sm:col-span-2 text-[11px] text-gray-500 truncate" title={ex.notes}>
                                {ex.notes || '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          {step === 'preview' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('config')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
              >
                Back to Parameters
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleGenerateRoutine}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-white text-xs font-bold text-gray-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdoptAndSaveRoutine}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isCoachMode ? `Adopt & Assign Coach Routine to ${userName}` : 'Adopt & Load into Editor'}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateRoutine}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Workout Regimen with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isCoachMode ? `Generate Coach Workout Routine for ${userName}` : 'Generate AI Workout Routine'}
                    </span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
