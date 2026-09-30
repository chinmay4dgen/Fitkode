import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Dumbbell,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  User,
  Clock,
  Printer,
  Search,
  BookOpen,
  Zap,
  Activity,
  Award,
  ChevronDown,
  Edit2,
  Layers,
  Youtube,
  Play,
  ExternalLink,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  WorkoutPlan,
  WorkoutDay,
  ExerciseItem,
  WorkoutDifficulty,
  WorkoutGoal,
} from '../types';
import { EXERCISE_LIBRARY } from '../lib/plannerLibrary';
import WorkoutPlanPrintModal from './WorkoutPlanPrintModal';
import WorkoutPlansListView from './WorkoutPlansListView';
import { RenamePlanModal } from './PlanNameModals';
import ExerciseLibraryModal from './ExerciseLibraryModal';
import ExerciseVideoLinkModal from './ExerciseVideoLinkModal';
import YouTubeVideoModal from './YouTubeVideoModal';
import AIWorkoutPlanGeneratorModal from './AIWorkoutPlanGeneratorModal';
import { formatISTDateTime } from '../lib/timestampUtils';
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from '../lib/youtubeUtils';
import { useAuth } from '../context/AuthContext';
import { updateMasterExerciseVideoUrl } from '../lib/exerciseStore';
import CoachMedicalSynopsis from './CoachMedicalSynopsis';
import { getMemberOnboarding, extractMedicalSynopsis } from '../lib/medicalAssessmentHelper';

interface WorkoutPlannerViewProps {
  currentPlan: WorkoutPlan | null;
  allPlans?: WorkoutPlan[];
  userEmail: string;
  userName?: string;
  isCoachMode?: boolean; // true if Coach Chinmay is managing for a customer
  coachName?: string;
  initialViewMode?: 'editor' | 'list';
  onSavePlan: (plan: WorkoutPlan) => void;
  onSelectPlan?: (planId: string) => void;
  onCreateNewPlan?: () => void;
  onDeletePlan?: (planId: string) => void;
  onSetActivePlan?: (planId: string) => void;
  onDuplicatePlan?: (plan: WorkoutPlan) => void;
  onRenamePlan?: (planId: string, newName: string) => void;
}

export default function WorkoutPlannerView({
  currentPlan,
  allPlans = [],
  userEmail,
  userName = 'Member',
  isCoachMode = false,
  coachName = 'Chinmay Jain',
  initialViewMode = 'editor',
  onSavePlan,
  onSelectPlan,
  onCreateNewPlan,
  onDeletePlan,
  onSetActivePlan,
  onDuplicatePlan,
  onRenamePlan,
}: WorkoutPlannerViewProps) {
  const [viewMode, setViewMode] = useState<'editor' | 'list'>(initialViewMode);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isAIGeneratorModalOpen, setIsAIGeneratorModalOpen] = useState(false);

  // Working local state for the active plan
  const [plan, setPlan] = useState<WorkoutPlan>(() => {
    if (currentPlan) return currentPlan;
    return {
      id: `workout_${Date.now()}`,
      name: isCoachMode ? `Coach Workout Plan for ${userName}` : 'My Personalized Workout Plan',
      userId: userEmail,
      userEmail: userEmail,
      difficulty: 'Intermediate',
      goal: 'Hypertrophy & Muscle Gain',
      daysPerWeek: 4,
      days: [],
      createdBy: isCoachMode ? 'coach' : 'user',
      coachName: isCoachMode ? coachName : undefined,
      coachNotes: isCoachMode
        ? 'Progressive resistance training routine designed for balanced hypertrophy, joint longevity, and metabolic conditioning.'
        : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Sync if prop changes externally
  React.useEffect(() => {
    if (currentPlan) {
      setPlan(currentPlan);
    }
  }, [currentPlan?.id, currentPlan?.name, currentPlan?.updatedAt]);

  const auth = useAuth ? useAuth() : null;
  const effectiveCoachMode = Boolean(isCoachMode || auth?.isAdmin);

  // Coach-Only Medical Synopsis extracted from onboarding disclosures
  const memberMedicalSynopsis = useMemo(() => {
    if (!effectiveCoachMode) return null;
    const ob = getMemberOnboarding(userEmail);
    return extractMedicalSynopsis(ob);
  }, [effectiveCoachMode, userEmail]);

  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [libraryModalDayId, setLibraryModalDayId] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Video playback preview modal state
  const [videoPreviewModal, setVideoPreviewModal] = useState<{
    url: string;
    name: string;
    targetMuscle?: string;
    notes?: string;
  } | null>(null);

  // Quick YouTube link editor modal state
  const [videoLinkModalState, setVideoLinkModalState] = useState<{
    dayId: string;
    exercise: ExerciseItem;
    dayName?: string;
  } | null>(null);

  // Independent Day Navigation Tab Filter State: default to first day of routine for independent navigation
  const [selectedDayId, setSelectedDayId] = useState<string>(() => {
    return currentPlan?.days?.[0]?.id || 'all';
  });

  // Ensure selectedDayId stays valid if days are removed or plan changes
  React.useEffect(() => {
    if (currentPlan) {
      setPlan(currentPlan);
      if (currentPlan.days && currentPlan.days.length > 0) {
        setSelectedDayId((prev) => {
          if (prev === 'all' || !currentPlan.days.some((d) => d.id === prev)) {
            return currentPlan.days[0].id;
          }
          return prev;
        });
      }
    }
  }, [currentPlan?.id, currentPlan?.name, currentPlan?.updatedAt]);

  // Total exercises count
  const totalExercisesCount = useMemo(() => {
    return plan.days.reduce((sum, day) => sum + (day.isRestDay ? 0 : day.exercises.length), 0);
  }, [plan.days]);

  const handleSave = () => {
    onSavePlan(plan);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 4000);
  };

  // Add new day to routine
  const handleAddDay = () => {
    const dayNumber = plan.days.length + 1;
    const newDay: WorkoutDay = {
      id: `day_${Date.now()}`,
      dayName: `Day ${dayNumber}: Training Split`,
      isRestDay: false,
      focus: 'Hypertrophy & Strength',
      exercises: [],
    };
    setPlan({
      ...plan,
      days: [...plan.days, newDay],
      daysPerWeek: plan.days.length + 1,
    });
  };

  // Delete day
  const handleDeleteDay = (dayId: string) => {
    const remainingDays = plan.days.filter((d) => d.id !== dayId);
    setPlan({
      ...plan,
      days: remainingDays,
      daysPerWeek: remainingDays.length,
    });
  };

  // Toggle rest day
  const handleToggleRestDay = (dayId: string) => {
    setPlan({
      ...plan,
      days: plan.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              isRestDay: !d.isRestDay,
              focus: !d.isRestDay ? 'Rest & Active Mobility Recovery' : 'Hypertrophy & Strength',
            }
          : d
      ),
    });
  };

  // Update day meta (name, focus)
  const handleUpdateDayMeta = (dayId: string, dayName: string, focus: string) => {
    setPlan({
      ...plan,
      days: plan.days.map((d) => (d.id === dayId ? { ...d, dayName, focus } : d)),
    });
  };

  // Add exercise from library
  const handleAddExerciseFromLibrary = (dayId: string, libEx: ExerciseItem) => {
    const newEx: ExerciseItem = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: libEx.name,
      targetMuscle: libEx.targetMuscle,
      sets: libEx.sets,
      reps: libEx.reps,
      restSeconds: libEx.restSeconds,
      notes: libEx.notes,
      videoUrl: libEx.videoUrl,
      isCustom: libEx.isCustom,
      createdBy: libEx.createdBy,
    };

    setPlan({
      ...plan,
      days: plan.days.map((d) =>
        d.id === dayId ? { ...d, exercises: [...d.exercises, newEx] } : d
      ),
    });
    setLibraryModalDayId(null);
  };

  // Save updated video link on an exercise
  const handleSaveVideoLink = (
    exerciseId: string,
    videoUrl: string | undefined,
    updateMasterDatabase?: boolean
  ) => {
    if (!videoLinkModalState) return;
    const { dayId, exercise } = videoLinkModalState;

    // 1. Update in this client's routine state
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              exercises: d.exercises.map((ex) =>
                ex.id === exerciseId ? { ...ex, videoUrl } : ex
              ),
            }
          : d
      ),
    }));

    // 2. If Super Admin opted to update at the Master Database level:
    // Clients playing around with URLs can NEVER trigger this because effectiveCoachMode is false for regular clients!
    if (effectiveCoachMode && updateMasterDatabase) {
      updateMasterExerciseVideoUrl(exercise.name, videoUrl);
    }
  };

  // Add custom exercise
  const handleAddCustomExercise = (dayId: string) => {
    const customEx: ExerciseItem = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: 'Custom Movement / Exercise',
      targetMuscle: 'Full Body',
      sets: 3,
      reps: '10-12',
      restSeconds: 60,
      notes: 'Controlled movement, proper breathing.',
    };

    setPlan({
      ...plan,
      days: plan.days.map((d) =>
        d.id === dayId ? { ...d, exercises: [...d.exercises, customEx] } : d
      ),
    });
  };

  // Delete exercise
  const handleDeleteExercise = (dayId: string, exerciseId: string) => {
    setPlan({
      ...plan,
      days: plan.days.map((d) =>
        d.id === dayId ? { ...d, exercises: d.exercises.filter((ex) => ex.id !== exerciseId) } : d
      ),
    });
  };

  // Update exercise field
  const handleUpdateExercise = (
    dayId: string,
    exerciseId: string,
    field: keyof ExerciseItem,
    value: string | number
  ) => {
    setPlan({
      ...plan,
      days: plan.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              exercises: d.exercises.map((ex) =>
                ex.id === exerciseId ? { ...ex, [field]: value } : ex
              ),
            }
          : d
      ),
    });
  };

  const isCoachCreated = plan.createdBy === 'coach';

  const formatDateTime = (isoString?: string) => {
    return formatISTDateTime(isoString);
  };

  const handleRenamePlan = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = {
      ...plan,
      name: trimmed,
      updatedAt: new Date().toISOString(),
    };
    setPlan(updated);
    setIsRenameModalOpen(false);
    if (onRenamePlan) {
      onRenamePlan(plan.id, trimmed);
    } else {
      onSavePlan(updated);
    }
  };

  // If in Listing Directory view, show the full list in reverse chronological order
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {/* Switch back to editor navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-gray-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className="py-2 px-3.5 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center space-x-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Routine Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="py-2 px-3.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Routines ({allPlans.length || 1})</span>
            </button>
          </div>
        </div>

        <WorkoutPlansListView
          plans={allPlans.length > 0 ? allPlans : [plan]}
          activePlanId={plan.id}
          userName={userName}
          userEmail={userEmail}
          isCoachMode={isCoachMode}
          onSelectPlan={(id) => {
            if (onSelectPlan) onSelectPlan(id);
            setViewMode('editor');
          }}
          onEditPlan={(id) => {
            if (onSelectPlan) onSelectPlan(id);
            setViewMode('editor');
          }}
          onCreateNewPlan={() => {
            if (onCreateNewPlan) onCreateNewPlan();
            setViewMode('editor');
          }}
          onDeletePlan={(id) => {
            if (onDeletePlan) onDeletePlan(id);
          }}
          onSetActivePlan={(id) => {
            if (onSetActivePlan) onSetActivePlan(id);
            else if (onSelectPlan) onSelectPlan(id);
          }}
          onDuplicatePlan={onDuplicatePlan}
          onRenamePlan={onRenamePlan}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top View Mode Switcher (Editor vs Listing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-gray-200 shadow-2xs w-fit">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Routine Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Routines ({allPlans.length || 1})</span>
          </button>
        </div>

        {plan.updatedAt && (
          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>Last Updated: {formatDateTime(plan.updatedAt)}</span>
          </div>
        )}
      </div>

      {/* Save Success Banner */}
      {saveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Workout Routine Saved Successfully!</p>
              <p className="text-xs text-emerald-700">
                {isCoachMode
                  ? `Plan assigned to ${userName} (${userEmail}) and is immediately active in their profile.`
                  : 'Your personal training schedule and exercises are saved.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessNotice(false)}
            className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Coach-Only Medical & Injury Synopsis */}
      {effectiveCoachMode && memberMedicalSynopsis && (
        <CoachMedicalSynopsis
          synopsis={memberMedicalSynopsis}
          memberName={userName || userEmail}
          context="workout"
          isCoachMode={effectiveCoachMode}
        />
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-light-green shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-900">
                <Dumbbell className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>{plan.name}</span>
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(true)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Rename this routine"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </h2>
              {isCoachCreated ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-700" />
                  Assigned by Coach {plan.coachName || 'Chinmay Jain'}
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <User className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Self-Created Plan
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {isCoachMode
                ? `Structured resistance and conditioning program designed for ${userName} (${userEmail}).`
                : 'Day-by-day workout schedule with sets, reps, and exercise guidance.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {allPlans.length > 1 && onSelectPlan && (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <select
                    value={plan.id}
                    onChange={(e) => onSelectPlan(e.target.value)}
                    className="py-2.5 px-3.5 pr-8 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:border-brand-green cursor-pointer shadow-xs focus:ring-2 focus:ring-brand-green/20"
                  >
                    {allPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.createdBy === 'coach' ? '(Coach)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs border border-indigo-200"
                  title="View all routines in reverse chronological order"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">All Routines</span>
                  <span>({allPlans.length})</span>
                </button>
              </div>
            )}

            {onCreateNewPlan && (
              <button
                type="button"
                onClick={onCreateNewPlan}
                className="py-2.5 px-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Routine</span>
              </button>
            )}

            {/* AI Workout Routine Generator Button */}
            <button
              type="button"
              onClick={() => setIsAIGeneratorModalOpen(true)}
              className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs hover:shadow"
              title="Formulate personalized workout routine with AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCoachMode ? 'Generate Coach Routine with AI' : 'AI Routine Generator'}</span>
            </button>

            <button
              type="button"
              onClick={() => setLibraryModalDayId('standalone')}
              className="py-2.5 px-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              title="Browse and manage movement library"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Exercise Library</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="py-2.5 px-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              title="Print routine"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 px-5 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow"
            >
              <Check className="w-4 h-4" />
              <span>{isCoachMode ? 'Save & Assign to Member' : 'Save Workout Plan'}</span>
            </button>
          </div>
        </div>

        {/* Coach Advice / Notes Box if present */}
        {plan.coachNotes && (
          <div className="mt-4 p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 flex items-start space-x-3">
            <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-purple-900">
                Coach Notes from {plan.coachName || 'Chinmay Jain'}:
              </span>
              {isCoachMode ? (
                <textarea
                  value={plan.coachNotes || ''}
                  onChange={(e) => setPlan({ ...plan, coachNotes: e.target.value })}
                  placeholder="Add guidance for progressive overload, warmups, rest intervals..."
                  rows={2}
                  className="w-full mt-1.5 p-2 rounded-lg bg-white border border-purple-200 text-xs text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
                />
              ) : (
                <p className="text-purple-900/90 leading-relaxed">{plan.coachNotes}</p>
              )}
            </div>
          </div>
        )}

        {/* Workout Plan Configuration (Matching Page 8 of PDF) */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-brand-green" />
              <span>Workout Plan Configuration</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingMeta(!isEditingMeta)}
              className="text-xs font-bold text-brand-green hover:text-brand-dark-green underline cursor-pointer"
            >
              {isEditingMeta ? 'Done Editing Info' : 'Adjust Plan Settings'}
            </button>
          </div>

          {/* Edit settings inputs if toggled */}
          {isEditingMeta && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={plan.name}
                  onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Workout Goal</label>
                <select
                  value={plan.goal}
                  onChange={(e) => setPlan({ ...plan, goal: e.target.value as WorkoutGoal })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs font-medium"
                >
                  <option value="Hypertrophy & Muscle Gain">Hypertrophy & Muscle Gain</option>
                  <option value="Fat Loss & Conditioning">Fat Loss & Conditioning</option>
                  <option value="Strength & Power">Strength & Power</option>
                  <option value="General Fitness & Longevity">General Fitness & Longevity</option>
                  <option value="Athletic Conditioning">Athletic Conditioning</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Difficulty Level</label>
                <select
                  value={plan.difficulty}
                  onChange={(e) => setPlan({ ...plan, difficulty: e.target.value as WorkoutDifficulty })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs font-medium"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Days Per Week</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={plan.daysPerWeek}
                  onChange={(e) => setPlan({ ...plan, daysPerWeek: Number(e.target.value) || 1 })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs font-bold"
                />
              </div>
            </div>
          )}

          {/* Configuration Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Primary Goal
              </span>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5">{plan.goal}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Difficulty Level
              </span>
              <p className="text-sm font-extrabold text-brand-dark-green mt-0.5">{plan.difficulty}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Weekly Frequency
              </span>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5">{plan.days.length} Days / Week</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Total Exercises
              </span>
              <p className="text-sm font-extrabold text-purple-900 mt-0.5">{totalExercisesCount} Movements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Days Schedule Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Workout Split & Exercises</h3>
            <p className="text-xs text-gray-500">
              Organize daily routines, toggle rest days, and select exercises from the Fitkode movement database.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddDay}
            className="py-2.5 px-4 rounded-xl bg-brand-light-green hover:bg-brand-light-green/70 text-brand-dark-green font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs shrink-0 whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Training Day</span>
          </button>
        </div>

        {/* Empty State */}
        {plan.days.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center mx-auto">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No Days Added Yet</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Start building the training split by adding a workout day (e.g. Push, Pull, Legs, or Rest).
            </p>
            <button
              type="button"
              onClick={handleAddDay}
              className="py-2 px-4 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-dark-green cursor-pointer"
            >
              + Add First Workout Day
            </button>
          </div>
        )}

        {/* Independent Day Navigation Bar for fast tab-based daily switching */}
        {plan.days.length > 0 && (
          <div className="bg-white rounded-3xl p-3 sm:p-4 border border-gray-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>Navigate Workout Days ({plan.days.length} Total)</span>
              </span>
              {selectedDayId !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedDayId('all')}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer hover:underline"
                >
                  View All Days
                </button>
              )}
            </div>

            {/* Scrollable Day Navigation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedDayId('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedDayId === 'all'
                    ? 'bg-purple-950 text-white shadow-xs ring-2 ring-purple-400/40'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Days ({plan.days.length})
              </button>

              {plan.days.map((day, idx) => {
                const isSelected = selectedDayId === day.id;
                const shortLabel = day.dayName.split(':')[0] || `Day ${idx + 1}`;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setSelectedDayId(day.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-brand-dark-green text-white shadow-xs ring-2 ring-emerald-400/50'
                        : day.isRestDay
                        ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <span>{shortLabel}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : day.isRestDay
                          ? 'bg-blue-200/80 text-blue-900'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {day.isRestDay ? 'Rest' : `${day.exercises.length} ex`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Days List (Filtered by selectedDayId for independent day navigation) */}
        {(() => {
          const displayedDays = selectedDayId === 'all'
            ? plan.days
            : plan.days.filter((d) => d.id === selectedDayId);
          const currentDayIdx = plan.days.findIndex((d) => d.id === selectedDayId);

          return (
            <div className="space-y-4">
              {/* Prev / Next day navigation header when viewing a single day independently */}
              {selectedDayId !== 'all' && (
                <div className="flex items-center justify-between px-1 text-xs">
                  <button
                    type="button"
                    disabled={currentDayIdx <= 0}
                    onClick={() => setSelectedDayId(plan.days[currentDayIdx - 1]?.id || 'all')}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-gray-700 flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Day</span>
                  </button>

                  <span className="font-bold text-purple-900 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                    Day {currentDayIdx + 1} of {plan.days.length}
                  </span>

                  <button
                    type="button"
                    disabled={currentDayIdx >= plan.days.length - 1}
                    onClick={() => setSelectedDayId(plan.days[currentDayIdx + 1]?.id || 'all')}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-gray-700 flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                  >
                    <span>Next Day</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {displayedDays.map((day) => {
                const dayIndex = plan.days.findIndex((d) => d.id === day.id);
                return (
                  <div
                    key={day.id}
                    className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-xs space-y-4 ${
                      day.isRestDay ? 'border-blue-200 bg-blue-50/20' : 'border-gray-200 hover:border-brand-light-green'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="space-y-3 pb-3 border-b border-gray-100">
                      {/* Row 1: Index, Day Name, Focus, and Delete Day Button */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              day.isRestDay
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-brand-light-green/60 text-brand-dark-green'
                            }`}
                          >
                            {dayIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={day.dayName}
                              onChange={(e) => handleUpdateDayMeta(day.id, e.target.value, day.focus)}
                              className="text-sm sm:text-base font-bold text-gray-900 bg-transparent hover:bg-gray-50 px-1 py-0.5 rounded border-b border-transparent hover:border-gray-300 focus:border-brand-green outline-none w-full"
                            />
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                              <span className="text-[11px] font-semibold text-gray-500 shrink-0">Target Focus:</span>
                              <input
                                type="text"
                                value={day.focus}
                                placeholder="e.g. Upper Body Push or Active Recovery"
                                onChange={(e) => handleUpdateDayMeta(day.id, day.dayName, e.target.value)}
                                className="text-[11px] font-medium text-gray-700 bg-transparent hover:bg-gray-50 px-1 py-0.5 rounded border-b border-transparent hover:border-gray-300 focus:border-brand-green outline-none flex-1 min-w-[140px]"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteDay(day.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                          title="Delete Day"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Row 2: Action Controls */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleRestDay(day.id)}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            day.isRestDay
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {day.isRestDay ? 'Rest & Recovery Day' : 'Mark as Rest Day'}
                        </button>

                        {!day.isRestDay && (
                          <>
                            <button
                              type="button"
                              onClick={() => setLibraryModalDayId(day.id)}
                              className="py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
                              title="Select from Exercise Library"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-purple-700" />
                              <span>Exercise Library</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddCustomExercise(day.id)}
                              className="py-1.5 px-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                              title="Add Custom Exercise"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Custom</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Exercises Content */}
                    {day.isRestDay ? (
                      <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 text-center space-y-2">
                        <p className="text-xs font-bold text-blue-900">Rest & Active Recovery Day</p>
                        <p className="text-xs text-blue-700 max-w-md mx-auto">
                          Take a 30-minute light walk (towards your 12,000 daily steps), complete dynamic mobility drills, and hit your hydration targets.
                        </p>
                        {day.exercises.length > 0 && (
                          <div className="pt-2 max-w-xl mx-auto space-y-2">
                            {day.exercises.map((ex, exIdx) => (
                              <div
                                key={ex.id}
                                className="p-3 rounded-2xl bg-white border border-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-2xs"
                              >
                                <div className="space-y-1">
                                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center font-bold">
                                      {exIdx + 1}
                                    </span>
                                    <span>{ex.name}</span>
                                    <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                      {ex.targetMuscle}
                                    </span>
                                  </div>
                                  {ex.notes && (
                                    <p className="text-[11px] text-gray-500 italic pl-5.5">{ex.notes}</p>
                                  )}
                                </div>

                                {ex.videoUrl && (
                                  <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <div
                                      onClick={() =>
                                        setVideoPreviewModal({
                                          url: ex.videoUrl!,
                                          name: ex.name,
                                          targetMuscle: ex.targetMuscle,
                                          notes: ex.notes,
                                        })
                                      }
                                      className="relative w-full sm:w-60 md:w-72 aspect-video rounded-2xl overflow-hidden bg-black cursor-pointer group/vthumb shadow-sm hover:shadow-md border border-gray-300 transition-all"
                                      title={`Watch ${ex.name} video demonstration`}
                                    >
                                      {extractYouTubeVideoId(ex.videoUrl) ? (
                                        <img
                                          src={getYouTubeThumbnailUrl(ex.videoUrl, 'hqdefault')!}
                                          alt={ex.name}
                                          className="w-full h-full object-cover group-hover/vthumb:scale-105 transition-transform duration-300"
                                          crossOrigin="anonymous"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-red-500">
                                          <Youtube className="w-8 h-8" />
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 flex items-center justify-center group-hover/vthumb:bg-black/15 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold shadow-md group-hover/vthumb:scale-115 transition-transform">
                                          <Play className="w-4 h-4 ml-0.5 fill-current" />
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setVideoPreviewModal({
                                          url: ex.videoUrl!,
                                          name: ex.name,
                                          targetMuscle: ex.targetMuscle,
                                          notes: ex.notes,
                                        })
                                      }
                                      className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer flex items-center gap-1.5"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-current" />
                                      <span>Watch Demo</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : day.exercises.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-gray-50/70 text-center text-xs text-gray-500 border border-dashed border-gray-200">
                        No exercises added for this day yet. Click{' '}
                        <button
                          type="button"
                          onClick={() => setLibraryModalDayId(day.id)}
                          className="font-bold text-purple-800 underline cursor-pointer"
                        >
                          Exercise Library
                        </button>{' '}
                        or{' '}
                        <button
                          type="button"
                          onClick={() => handleAddCustomExercise(day.id)}
                          className="font-bold text-gray-700 underline cursor-pointer"
                        >
                          Custom
                        </button>{' '}
                        to add movements.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {day.exercises.map((ex, exIdx) => (
                          <div
                            key={ex.id}
                            className="p-3.5 sm:p-4 rounded-2xl bg-white border border-gray-200 hover:border-purple-200 transition-all text-xs shadow-2xs space-y-3"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 sm:gap-5">
                              {/* Left: Exercise metadata, form cues and training volume */}
                              <div className="flex-1 min-w-0 space-y-2.5">
                                {/* Top: Index, Exercise Name, Muscle Badges & Delete Button */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-[10px] shrink-0">
                                      {exIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={ex.name}
                                      onChange={(e) => handleUpdateExercise(day.id, ex.id, 'name', e.target.value)}
                                      className="font-bold text-sm sm:text-base text-gray-900 bg-transparent hover:bg-gray-50 px-1.5 py-0.5 rounded border border-transparent hover:border-gray-200 focus:border-brand-green focus:bg-white outline-none flex-1 min-w-0"
                                    />
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800 shrink-0">
                                      {ex.targetMuscle}
                                    </span>
                                    {ex.isCustom && (
                                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 shrink-0">
                                        Custom
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteExercise(day.id, ex.id)}
                                    className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0 lg:hidden"
                                    title="Remove exercise"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Middle: Notes / Form Cues */}
                                <div className="flex items-center space-x-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100">
                                  <span className="text-[11px] font-semibold text-gray-400 shrink-0">Notes:</span>
                                  <input
                                    type="text"
                                    value={ex.notes || ''}
                                    placeholder="Form cue (e.g. 2s pause at bottom, keep core braced)"
                                    onChange={(e) => handleUpdateExercise(day.id, ex.id, 'notes', e.target.value)}
                                    className="text-[11px] text-gray-700 italic bg-transparent outline-none w-full"
                                  />
                                </div>

                                {/* Bottom: Sets, Reps & Rest Time Controls */}
                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                  <div className="inline-flex items-center space-x-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 shadow-2xs">
                                    <div className="text-center px-1.5">
                                      <span className="text-[9px] font-bold text-gray-400 block uppercase">SETS</span>
                                      <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={ex.sets}
                                        onChange={(e) =>
                                          handleUpdateExercise(day.id, ex.id, 'sets', Number(e.target.value) || 1)
                                        }
                                        className="w-10 text-center text-xs font-bold text-gray-900 bg-white rounded py-0.5 outline-none border border-gray-200"
                                      />
                                    </div>
                                    <div className="text-center px-1.5 border-l border-gray-200">
                                      <span className="text-[9px] font-bold text-gray-400 block uppercase">REPS</span>
                                      <input
                                        type="text"
                                        value={ex.reps}
                                        placeholder="8-12"
                                        onChange={(e) => handleUpdateExercise(day.id, ex.id, 'reps', e.target.value)}
                                        className="w-16 text-center text-xs font-bold text-brand-dark-green bg-brand-light-green/30 rounded py-0.5 outline-none border border-brand-light-green"
                                      />
                                    </div>
                                    <div className="text-center px-1.5 border-l border-gray-200">
                                      <span className="text-[9px] font-bold text-gray-400 block uppercase">REST (s)</span>
                                      <input
                                        type="number"
                                        step="15"
                                        value={ex.restSeconds}
                                        onChange={(e) =>
                                          handleUpdateExercise(day.id, ex.id, 'restSeconds', Number(e.target.value) || 0)
                                        }
                                        className="w-14 text-center text-xs font-bold text-blue-700 bg-blue-50 rounded py-0.5 outline-none border border-blue-200"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Substantially Larger High-Definition Video Demonstration Thumbnail */}
                              <div className="shrink-0 w-full lg:w-auto self-stretch lg:self-center">
                                {ex.videoUrl ? (
                                  (() => {
                                    const videoId = extractYouTubeVideoId(ex.videoUrl);
                                    const thumb = videoId ? getYouTubeThumbnailUrl(ex.videoUrl, 'hqdefault') : null;
                                    return (
                                      <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto">
                                        <div
                                          onClick={() =>
                                            setVideoPreviewModal({
                                              url: ex.videoUrl!,
                                              name: ex.name,
                                              targetMuscle: ex.targetMuscle,
                                              notes: ex.notes,
                                            })
                                          }
                                          className="relative w-full sm:w-72 md:w-80 lg:w-96 aspect-video rounded-2xl overflow-hidden bg-black shrink-0 cursor-pointer group/vthumb shadow-md hover:shadow-xl transition-all border-2 border-gray-200 hover:border-brand-green ring-1 ring-black/5"
                                          title={`Click to watch ${ex.name} video demonstration`}
                                        >
                                          {thumb ? (
                                            <img
                                              src={thumb}
                                              alt={ex.name}
                                              className="w-full h-full object-cover group-hover/vthumb:scale-105 transition-transform duration-300"
                                              crossOrigin="anonymous"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-400">
                                              <Youtube className="w-10 h-10 text-red-500" />
                                            </div>
                                          )}

                                          {/* Gradient Overlay & High-Contrast Play Button */}
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 flex flex-col justify-between p-2.5 sm:p-3 transition-opacity">
                                            <div className="flex items-center justify-between w-full">
                                              <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow-xs">
                                                <Youtube className="w-3.5 h-3.5 text-red-500" />
                                                <span>Video Demo</span>
                                              </span>
                                              <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-semibold text-gray-200 uppercase">
                                                HD Video
                                              </span>
                                            </div>

                                            {/* Centered Large Play Button */}
                                            <div className="self-center">
                                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover/vthumb:scale-115 group-hover/vthumb:bg-red-500 transition-all">
                                                <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5 fill-current" />
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-between w-full text-white text-xs drop-shadow-xs">
                                              <span className="font-bold truncate max-w-[200px] text-[11px] text-gray-100">
                                                {ex.name}
                                              </span>
                                              <span className="font-bold text-[11px] text-emerald-300 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full">
                                                <span>Tap to Watch</span>
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action Buttons below thumbnail */}
                                        <div className="flex items-center justify-between lg:justify-end space-x-3 text-xs w-full pt-0.5 px-0.5">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setVideoPreviewModal({
                                                url: ex.videoUrl!,
                                                name: ex.name,
                                                targetMuscle: ex.targetMuscle,
                                                notes: ex.notes,
                                              })
                                            }
                                            className="font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 cursor-pointer hover:underline"
                                          >
                                            <Play className="w-3.5 h-3.5 text-indigo-600 fill-current" />
                                            <span>Play Full Screen</span>
                                          </button>
                                          <span className="text-gray-300">•</span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setVideoLinkModalState({
                                                dayId: day.id,
                                                exercise: ex,
                                                dayName: day.dayName,
                                              })
                                            }
                                            className="font-semibold text-gray-500 hover:text-gray-900 flex items-center space-x-1 cursor-pointer hover:underline"
                                            title="Edit YouTube Video Link"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                            <span>Edit Link</span>
                                          </button>
                                          {videoId && (
                                            <>
                                              <span className="text-gray-300">•</span>
                                              <a
                                                href={`https://www.youtube.com/watch?v=${videoId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-500 hover:text-red-600 flex items-center space-x-1 hover:underline text-xs"
                                                title="Open on YouTube"
                                              >
                                                <ExternalLink className="w-3 h-3" />
                                                <span className="hidden sm:inline">YouTube</span>
                                              </a>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVideoLinkModalState({
                                        dayId: day.id,
                                        exercise: ex,
                                        dayName: day.dayName,
                                      })
                                    }
                                    className="w-full sm:w-72 md:w-80 lg:w-96 aspect-video rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-400 bg-gray-50 hover:bg-red-50/30 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all group/btn"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 group-hover/btn:bg-red-100 flex items-center justify-center text-gray-500 group-hover/btn:text-red-600 transition-colors mb-1.5">
                                      <Youtube className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 group-hover/btn:text-red-700">
                                      + Attach YouTube Demo Video
                                    </span>
                                    <span className="text-[10px] text-gray-400 mt-0.5">
                                      Link video demonstration for exercise cues
                                    </span>
                                  </button>
                                )}
                              </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteExercise(day.id, ex.id)}
                                  className="hidden lg:flex p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0 ml-1"
                                  title="Remove exercise"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Exercise & Movement Library Modal */}
      <ExerciseLibraryModal
        isOpen={Boolean(libraryModalDayId)}
        dayId={libraryModalDayId === 'standalone' ? null : libraryModalDayId}
        dayName={
          libraryModalDayId && libraryModalDayId !== 'standalone'
            ? plan.days.find((d) => d.id === libraryModalDayId)?.dayName
            : undefined
        }
        userEmail={userEmail}
        isCoachMode={effectiveCoachMode}
        onClose={() => setLibraryModalDayId(null)}
        onSelectExercise={(exercise) => {
          if (libraryModalDayId && libraryModalDayId !== 'standalone') {
            handleAddExerciseFromLibrary(libraryModalDayId, exercise);
          }
        }}
        onOpenVideoPreview={(videoUrl, exerciseName, targetMuscle, notes) => {
          setVideoPreviewModal({
            url: videoUrl,
            name: exerciseName,
            targetMuscle,
            notes,
          });
        }}
      />

      {/* Exercise YouTube Reference Video Link Editor Modal */}
      <ExerciseVideoLinkModal
        isOpen={Boolean(videoLinkModalState)}
        exercise={videoLinkModalState?.exercise || null}
        dayName={videoLinkModalState?.dayName}
        isSuperAdmin={effectiveCoachMode}
        clientName={userName}
        onClose={() => setVideoLinkModalState(null)}
        onSaveLink={handleSaveVideoLink}
        onOpenPreview={(url, name) => {
          setVideoPreviewModal({
            url,
            name,
            targetMuscle: videoLinkModalState?.exercise?.targetMuscle,
            notes: videoLinkModalState?.exercise?.notes,
          });
        }}
      />

      {/* Fullscreen Video Player Modal */}
      {videoPreviewModal && (
        <YouTubeVideoModal
          videoUrl={videoPreviewModal.url}
          exerciseName={videoPreviewModal.name}
          targetMuscle={videoPreviewModal.targetMuscle}
          notes={videoPreviewModal.notes}
          onClose={() => setVideoPreviewModal(null)}
        />
      )}

      {/* Print & PDF Export Modal */}
      {isPrintModalOpen && (
        <WorkoutPlanPrintModal
          plan={plan}
          userName={userName}
          userEmail={userEmail}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* Rename Plan Modal */}
      <RenamePlanModal
        isOpen={isRenameModalOpen}
        title="Rename Workout Routine"
        currentName={plan.name}
        planType="workout"
        onClose={() => setIsRenameModalOpen(false)}
        onSave={handleRenamePlan}
      />

      {/* AI Workout Routine Generator Modal */}
      <AIWorkoutPlanGeneratorModal
        isOpen={isAIGeneratorModalOpen}
        onClose={() => setIsAIGeneratorModalOpen(false)}
        userEmail={userEmail}
        userName={userName}
        isCoachMode={effectiveCoachMode}
        onPlanGenerated={(generatedPlan) => {
          setPlan(generatedPlan);
          onSavePlan(generatedPlan);
          setViewMode('editor');
          setSaveSuccessNotice(true);
          setTimeout(() => setSaveSuccessNotice(false), 4000);
        }}
      />
    </div>
  );
}
