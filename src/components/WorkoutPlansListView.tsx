import React, { useState, useMemo } from 'react';
import {
  Dumbbell,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShieldCheck,
  User,
  Clock,
  Printer,
  Search,
  AlertCircle,
  Copy,
  Calendar,
  Flame,
  ChevronRight,
  Zap,
  Activity,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { WorkoutPlan } from '../types';
import WorkoutPlanPrintModal from './WorkoutPlanPrintModal';
import { RenamePlanModal } from './PlanNameModals';
import { formatISTDateTime } from '../lib/timestampUtils';

interface WorkoutPlansListViewProps {
  plans: WorkoutPlan[];
  activePlanId: string;
  userName?: string;
  userEmail: string;
  isCoachMode?: boolean;
  onSelectPlan: (planId: string) => void;
  onEditPlan: (planId: string) => void;
  onCreateNewPlan: () => void;
  onDeletePlan: (planId: string) => void;
  onSetActivePlan?: (planId: string) => void;
  onDuplicatePlan?: (plan: WorkoutPlan) => void;
  onRenamePlan?: (planId: string, newName: string) => void;
}

export default function WorkoutPlansListView({
  plans,
  activePlanId,
  userName = 'Member',
  userEmail,
  isCoachMode = false,
  onSelectPlan,
  onEditPlan,
  onCreateNewPlan,
  onDeletePlan,
  onSetActivePlan,
  onDuplicatePlan,
  onRenamePlan,
}: WorkoutPlansListViewProps) {
  const [filter, setFilter] = useState<'all' | 'coach' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [printingPlan, setPrintingPlan] = useState<WorkoutPlan | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renamingPlan, setRenamingPlan] = useState<WorkoutPlan | null>(null);

  // Format date & time helper using Indian Standard Time (IST)
  const formatDateTime = (isoString?: string) => {
    return formatISTDateTime(isoString);
  };

  // Sort plans in reverse chronological order (newest updated/created first)
  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [plans]);

  // Filtered by type and search query
  const filteredPlans = useMemo(() => {
    return sortedPlans.filter((p) => {
      if (filter === 'coach' && p.createdBy !== 'coach') return false;
      if (filter === 'user' && p.createdBy !== 'user') return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesGoal = p.goal?.toLowerCase().includes(query);
        const matchesNotes = p.coachNotes?.toLowerCase().includes(query);
        return matchesName || matchesGoal || matchesNotes;
      }
      return true;
    });
  }, [sortedPlans, filter, searchQuery]);

  const coachCount = plans.filter((p) => p.createdBy === 'coach').length;
  const userCount = plans.filter((p) => p.createdBy === 'user').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Directory Top Bar */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                <span>Workout Routines Directory</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-bold">
                  {plans.length} {plans.length === 1 ? 'Routine' : 'Routines'}
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                {isCoachMode
                  ? `All prescribed resistance splits and self-created workouts for ${userName}.`
                  : `Review all training regimens assigned by Coach Chinmay or self-created by you.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCreateNewPlan}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm hover:shadow cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isCoachMode ? 'Prescribe New Workout' : 'Create New Workout Routine'}</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Routines ({plans.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('coach')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                filter === 'coach'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Coach Prescribed ({coachCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('user')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                filter === 'user'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Self Created ({userCount})</span>
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search routines by goal or name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-600 focus:outline-hidden transition-all"
            />
          </div>
        </div>
      </div>

      {/* Routines List in Reverse Chronological Order */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">No Workout Routines Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? `No workout routines match "${searchQuery}". Try clearing the search filter.`
              : 'No routines are recorded under this filter.'}
          </p>
          <button
            type="button"
            onClick={onCreateNewPlan}
            className="py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Create New Routine
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan) => {
            const isCoachCreated = plan.createdBy === 'coach';
            const isActive = plan.isActive || plan.id === activePlanId;

            // Compute total exercises
            let totalExercises = 0;
            for (const day of plan.days || []) {
              if (!day.isRestDay) {
                totalExercises += (day.exercises || []).length;
              }
            }

            return (
              <div
                key={plan.id}
                className={`rounded-3xl border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden ${
                  isCoachCreated
                    ? 'border-indigo-200/90 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20'
                    : 'border-blue-200/80 bg-white'
                } ${isActive ? 'ring-2 ring-indigo-500/30' : ''}`}
              >
                {/* Routine Card Header Banner */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Distinct Coach vs Self Badge */}
                      {isCoachCreated ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-300">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-700" />
                          <span>Assigned by Coach {plan.coachName || 'Chinmay Jain'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
                          <User className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          <span>Self-Created Routine</span>
                        </span>
                      )}

                      {/* Active Routine Indicator */}
                      {isActive && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1.5"></span>
                          <span>Active Routine</span>
                        </span>
                      )}

                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                        {plan.difficulty || 'Intermediate'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <h3
                        className="text-base sm:text-lg font-black text-gray-900 hover:text-indigo-700 transition-colors cursor-pointer"
                        onClick={() => onEditPlan(plan.id)}
                      >
                        {plan.name}
                      </h3>
                      {onRenamePlan && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingPlan(plan);
                          }}
                          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Rename routine"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date Time Stamp */}
                  <div className="sm:text-right text-xs text-gray-500 space-y-0.5 shrink-0">
                    <div className="flex items-center sm:justify-end space-x-1.5 font-medium text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Updated: {formatDateTime(plan.updatedAt)}</span>
                    </div>
                    {plan.createdAt && plan.createdAt !== plan.updatedAt && (
                      <div className="text-[11px] text-gray-400">
                        Created: {formatDateTime(plan.createdAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Routine Content Body */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Coach Directives Quote if present */}
                  {plan.coachNotes && (
                    <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 flex items-start space-x-2">
                      <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="text-indigo-900 font-bold block text-[11px] uppercase tracking-wider">
                          Training Directives from {plan.coachName || 'Chinmay Jain'}:
                        </strong>
                        <p className="line-clamp-2 leading-relaxed text-indigo-900/90">{plan.coachNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Split Summary Grid */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="bg-gray-50/90 rounded-2xl p-2.5 border border-gray-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Primary Focus</span>
                      <span className="text-xs sm:text-sm font-black text-gray-900 truncate block">
                        {plan.goal || 'Hypertrophy'}
                      </span>
                    </div>

                    <div className="bg-indigo-50/70 rounded-2xl p-2.5 border border-indigo-100">
                      <span className="text-[10px] uppercase font-bold text-indigo-800 block">Frequency</span>
                      <span className="text-xs sm:text-sm font-black text-indigo-700">
                        {plan.daysPerWeek || (plan.days ? plan.days.length : 4)} Days / Wk
                      </span>
                    </div>

                    <div className="bg-blue-50/70 rounded-2xl p-2.5 border border-blue-100">
                      <span className="text-[10px] uppercase font-bold text-blue-800 block">Exercises</span>
                      <span className="text-xs sm:text-sm font-black text-blue-700">
                        {totalExercises} Movements
                      </span>
                    </div>
                  </div>

                  {/* Scheduled Split Days Preview Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Split Days ({plan.days?.length || 0}):
                    </span>
                    {(plan.days || []).map((day, dIdx) => (
                      <span
                        key={day.id || dIdx}
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${
                          day.isRestDay
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}
                      >
                        {day.dayName} {day.isRestDay ? '(Rest)' : `(${day.exercises?.length || 0})`}
                      </span>
                    ))}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => onEditPlan(plan.id)}
                        className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit & Calibrate Routine</span>
                      </button>

                      {!isActive && onSetActivePlan && (
                        <button
                          type="button"
                          onClick={() => onSetActivePlan(plan.id)}
                          className="py-2 px-3 rounded-xl border border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 text-gray-700 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                          title="Set this as your primary active workout routine"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Set as Active</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {onDuplicatePlan && (
                        <button
                          type="button"
                          onClick={() => onDuplicatePlan(plan)}
                          className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                          title="Clone as new routine template"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setPrintingPlan(plan)}
                        className="py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                        title="Print or export as PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Print / PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(plan.id)}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete workout routine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Delete Workout Routine?</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Are you sure you want to delete this workout routine? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="py-2 px-4 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePlan(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="py-2 px-4 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Yes, Delete Routine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print / PDF Modal */}
      {printingPlan && (
        <WorkoutPlanPrintModal
          plan={printingPlan}
          userName={userName}
          userEmail={userEmail}
          onClose={() => setPrintingPlan(null)}
        />
      )}

      {/* Rename Routine Modal */}
      {renamingPlan && (
        <RenamePlanModal
          isOpen={!!renamingPlan}
          title="Rename Workout Routine"
          currentName={renamingPlan.name}
          planType="workout"
          onClose={() => setRenamingPlan(null)}
          onSave={(newName) => {
            if (onRenamePlan && renamingPlan) {
              onRenamePlan(renamingPlan.id, newName);
            }
            setRenamingPlan(null);
          }}
        />
      )}
    </div>
  );
}
