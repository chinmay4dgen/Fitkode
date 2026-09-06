import React, { useState, useMemo } from 'react';
import {
  Utensils,
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
  ExternalLink,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { MealPlan } from '../types';
import MealPlanPrintModal from './MealPlanPrintModal';
import { RenamePlanModal } from './PlanNameModals';
import { formatISTDateTime } from '../lib/timestampUtils';

interface MealPlansListViewProps {
  plans: MealPlan[];
  activePlanId: string;
  userName?: string;
  userEmail: string;
  isCoachMode?: boolean;
  onSelectPlan: (planId: string) => void;
  onEditPlan: (planId: string) => void;
  onCreateNewPlan: () => void;
  onDeletePlan: (planId: string) => void;
  onSetActivePlan?: (planId: string) => void;
  onDuplicatePlan?: (plan: MealPlan) => void;
  onRenamePlan?: (planId: string, newName: string) => void;
}

export default function MealPlansListView({
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
}: MealPlansListViewProps) {
  const [filter, setFilter] = useState<'all' | 'coach' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [printingPlan, setPrintingPlan] = useState<MealPlan | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renamingPlan, setRenamingPlan] = useState<MealPlan | null>(null);

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
        const matchesDiet = p.dietType?.toLowerCase().includes(query);
        const matchesNotes = p.coachNotes?.toLowerCase().includes(query);
        return matchesName || matchesDiet || matchesNotes;
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
            <div className="w-11 h-11 rounded-2xl bg-brand-light-green text-brand-dark-green flex items-center justify-center font-black">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                <span>Meal Plans Directory</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-bold">
                  {plans.length} {plans.length === 1 ? 'Plan' : 'Plans'}
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                {isCoachMode
                  ? `All active and historical meal plans prescribed or self-created for ${userName}.`
                  : `Review all nutrition plans assigned by Coach Chinmay or self-created by you.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCreateNewPlan}
            className="py-2.5 px-4 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm hover:shadow cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isCoachMode ? 'Prescribe New Meal Plan' : 'Create New Meal Plan'}</span>
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
              All Plans ({plans.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('coach')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                filter === 'coach'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
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
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
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
              placeholder="Search plans by name or diet..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-green focus:outline-hidden transition-all"
            />
          </div>
        </div>
      </div>

      {/* Plans List in Reverse Chronological Order */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">No Meal Plans Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? `No meal plans match "${searchQuery}". Try clearing the search filter.`
              : 'No meal plans are recorded under this filter.'}
          </p>
          <button
            type="button"
            onClick={onCreateNewPlan}
            className="py-2 px-4 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-dark-green transition-colors cursor-pointer"
          >
            Create New Plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan) => {
            const isCoachCreated = plan.createdBy === 'coach';
            const isActive = plan.isActive || plan.id === activePlanId;

            // Compute total plan nutrition
            let totalCals = 0;
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFats = 0;
            let totalItems = 0;

            for (const slot of plan.meals || []) {
              totalItems += (slot.items || []).length;
              for (const item of slot.items || []) {
                totalCals += item.calories || 0;
                totalProtein += item.protein || 0;
                totalCarbs += item.carbs || 0;
                totalFats += item.fats || 0;
              }
            }

            return (
              <div
                key={plan.id}
                className={`rounded-3xl border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden ${
                  isCoachCreated
                    ? 'border-purple-200/90 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/20'
                    : 'border-emerald-200/80 bg-white'
                } ${isActive ? 'ring-2 ring-brand-green/30' : ''}`}
              >
                {/* Plan Card Header Banner */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Distinct Coach vs Self Badge */}
                      {isCoachCreated ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-700" />
                          <span>Assigned by Coach {plan.coachName || 'Chinmay Jain'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <User className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          <span>Self-Created by You</span>
                        </span>
                      )}

                      {/* Active Plan Indicator */}
                      {isActive && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-green text-white shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1.5"></span>
                          <span>Active Plan</span>
                        </span>
                      )}

                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                        {plan.dietType || 'Vegetarian'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <h3
                        className="text-base sm:text-lg font-black text-gray-900 hover:text-brand-dark-green transition-colors cursor-pointer"
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
                          title="Rename plan"
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

                {/* Plan Content Body */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Coach Notes Quote if present */}
                  {plan.coachNotes && (
                    <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="text-purple-900 font-bold block text-[11px] uppercase tracking-wider">
                          Coach Directives from {plan.coachName || 'Chinmay Jain'}:
                        </strong>
                        <p className="line-clamp-2 leading-relaxed text-purple-900/90">{plan.coachNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Macro Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="bg-gray-50/90 rounded-2xl p-2.5 border border-gray-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Energy</span>
                      <span className="text-sm sm:text-base font-black text-gray-900">
                        {Math.round(totalCals)} kcal
                      </span>
                      <span className="text-[10px] text-gray-500 block">Target: {plan.targetCalories} kcal</span>
                    </div>

                    <div className="bg-emerald-50/70 rounded-2xl p-2.5 border border-emerald-100">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Protein</span>
                      <span className="text-sm sm:text-base font-black text-emerald-700">
                        {Math.round(totalProtein)}g
                      </span>
                      <span className="text-[10px] text-emerald-600 block">Target: {plan.targetProtein}g</span>
                    </div>

                    <div className="bg-amber-50/70 rounded-2xl p-2.5 border border-amber-100">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">Carbs</span>
                      <span className="text-sm sm:text-base font-black text-amber-700">
                        {Math.round(totalCarbs)}g
                      </span>
                      <span className="text-[10px] text-amber-600 block">Target: {plan.targetCarbs}g</span>
                    </div>

                    <div className="bg-indigo-50/70 rounded-2xl p-2.5 border border-indigo-100">
                      <span className="text-[10px] uppercase font-bold text-indigo-800 block">Fats</span>
                      <span className="text-sm sm:text-base font-black text-indigo-700">
                        {Math.round(totalFats)}g
                      </span>
                      <span className="text-[10px] text-indigo-600 block">Target: {plan.targetFats}g</span>
                    </div>
                  </div>

                  {/* Meal Slots Preview Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Structure ({plan.meals?.length || 0} Meals &bull; {totalItems} items):
                    </span>
                    {(plan.meals || []).map((slot, sIdx) => (
                      <span
                        key={slot.id || sIdx}
                        className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-medium text-[11px]"
                      >
                        {slot.name} ({slot.items?.length || 0})
                      </span>
                    ))}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => onEditPlan(plan.id)}
                        className="py-2 px-4 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit & Calibrate Plan</span>
                      </button>

                      {!isActive && onSetActivePlan && (
                        <button
                          type="button"
                          onClick={() => onSetActivePlan(plan.id)}
                          className="py-2 px-3 rounded-xl border border-gray-200 hover:border-brand-green hover:bg-brand-light-green/40 text-gray-700 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                          title="Set this as your primary active meal plan"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
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
                          title="Clone as new template"
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
                        title="Delete meal plan"
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
              <h3 className="text-base font-bold text-gray-900">Delete Meal Plan?</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Are you sure you want to delete this meal plan? This action cannot be undone.
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
                Yes, Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print / PDF Modal */}
      {printingPlan && (
        <MealPlanPrintModal
          plan={printingPlan}
          userName={userName}
          userEmail={userEmail}
          onClose={() => setPrintingPlan(null)}
        />
      )}

      {/* Rename Plan Modal */}
      {renamingPlan && (
        <RenamePlanModal
          isOpen={!!renamingPlan}
          title="Rename Meal Plan"
          currentName={renamingPlan.name}
          planType="meal"
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
