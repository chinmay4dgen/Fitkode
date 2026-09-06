import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Plus,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  ShieldCheck,
  User,
  Clock,
  Printer,
  ChevronDown,
  Search,
  AlertCircle,
  Copy,
  Info,
  Flame,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { MealPlan, MealSlot, MealItem, DietType } from '../types';
import { FOOD_LIBRARY } from '../lib/plannerLibrary';
import MealPlanPrintModal from './MealPlanPrintModal';

interface MealPlannerViewProps {
  currentPlan: MealPlan | null;
  allPlans?: MealPlan[];
  userEmail: string;
  userName?: string;
  isCoachMode?: boolean; // true if Coach Chinmay is managing for a customer
  coachName?: string;
  onSavePlan: (plan: MealPlan) => void;
  onSelectPlan?: (planId: string) => void;
  onCreateNewPlan?: () => void;
  onDeletePlan?: (planId: string) => void;
}

export default function MealPlannerView({
  currentPlan,
  allPlans = [],
  userEmail,
  userName = 'Member',
  isCoachMode = false,
  coachName = 'Chinmay Jain',
  onSavePlan,
  onSelectPlan,
  onCreateNewPlan,
  onDeletePlan,
}: MealPlannerViewProps) {
  // Working local state for the active plan
  const [plan, setPlan] = useState<MealPlan>(() => {
    if (currentPlan) return currentPlan;
    return {
      id: `diet_${Date.now()}`,
      name: isCoachMode ? `Coach Meal Plan for ${userName}` : 'My Personalized Meal Plan',
      userId: userEmail,
      userEmail: userEmail,
      targetCalories: 2000,
      targetProtein: 140,
      targetCarbs: 200,
      targetFats: 55,
      dietType: 'Vegetarian',
      meals: [],
      createdBy: isCoachMode ? 'coach' : 'user',
      coachName: isCoachMode ? coachName : undefined,
      coachNotes: isCoachMode ? 'Custom nutrition guidelines customized for your metabolic profile.' : undefined,
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
  }, [currentPlan?.id]);

  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [editingMealSlotId, setEditingMealSlotId] = useState<string | null>(null);
  const [libraryModalSlotId, setLibraryModalSlotId] = useState<string | null>(null);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCategory, setLibraryCategory] = useState<string>('all');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Calculate real-time totals
  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    for (const slot of plan.meals) {
      for (const item of slot.items) {
        calories += item.calories || 0;
        protein += item.protein || 0;
        carbs += item.carbs || 0;
        fats += item.fats || 0;
      }
    }

    return {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fats: Math.round(fats * 10) / 10,
    };
  }, [plan.meals]);

  const handleSave = () => {
    onSavePlan(plan);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 4000);
  };

  // Add new meal slot
  const handleAddMealSlot = () => {
    const slotNumber = plan.meals.length + 1;
    const newSlot: MealSlot = {
      id: `slot_${Date.now()}`,
      name: `Meal ${slotNumber}: Nutrition Slot`,
      time: '12:00 PM',
      items: [],
    };
    setPlan({
      ...plan,
      meals: [...plan.meals, newSlot],
    });
  };

  // Delete meal slot
  const handleDeleteMealSlot = (slotId: string) => {
    setPlan({
      ...plan,
      meals: plan.meals.filter((s) => s.id !== slotId),
    });
  };

  // Update meal slot title or time
  const handleUpdateSlotMeta = (slotId: string, name: string, time: string) => {
    setPlan({
      ...plan,
      meals: plan.meals.map((s) => (s.id === slotId ? { ...s, name, time } : s)),
    });
  };

  // Add item from library to slot
  const handleAddItemFromLibrary = (slotId: string, libItem: typeof FOOD_LIBRARY[0]) => {
    const newItem: MealItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: libItem.name,
      servingSize: libItem.servingSize,
      calories: libItem.calories,
      protein: libItem.protein,
      carbs: libItem.carbs,
      fats: libItem.fats,
      category: libItem.category,
      notes: libItem.notes,
    };

    setPlan({
      ...plan,
      meals: plan.meals.map((s) => (s.id === slotId ? { ...s, items: [...s.items, newItem] } : s)),
    });
    setLibraryModalSlotId(null);
  };

  // Quick add custom item
  const handleAddCustomItem = (slotId: string) => {
    const customItem: MealItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: 'Custom Food Item',
      servingSize: '1 portion',
      calories: 150,
      protein: 10,
      carbs: 15,
      fats: 5,
      category: 'protein',
    };

    setPlan({
      ...plan,
      meals: plan.meals.map((s) => (s.id === slotId ? { ...s, items: [...s.items, customItem] } : s)),
    });
  };

  // Delete item from slot
  const handleDeleteItem = (slotId: string, itemId: string) => {
    setPlan({
      ...plan,
      meals: plan.meals.map((s) =>
        s.id === slotId ? { ...s, items: s.items.filter((item) => item.id !== itemId) } : s
      ),
    });
  };

  // Update item field
  const handleUpdateItem = (
    slotId: string,
    itemId: string,
    field: keyof MealItem,
    value: string | number
  ) => {
    setPlan({
      ...plan,
      meals: plan.meals.map((s) =>
        s.id === slotId
          ? {
              ...s,
              items: s.items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
              ),
            }
          : s
      ),
    });
  };

  // Filtered food library for selector modal
  const filteredFoodLibrary = useMemo(() => {
    return FOOD_LIBRARY.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
        (f.notes && f.notes.toLowerCase().includes(librarySearch.toLowerCase()));
      const matchCategory = libraryCategory === 'all' || f.category === libraryCategory;
      return matchSearch && matchCategory;
    });
  }, [librarySearch, libraryCategory]);

  const isCoachCreated = plan.createdBy === 'coach';

  return (
    <div className="space-y-6">
      {/* Save Success Banner */}
      {saveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Meal Plan Successfully Saved!</p>
              <p className="text-xs text-emerald-700">
                {isCoachMode
                  ? `Plan assigned to ${userName} (${userEmail}) and is immediately active in their profile.`
                  : 'Your personalized nutrition plan is up to date and saved.'}
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

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-light-green shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 rounded-xl bg-brand-light-green/60 text-brand-dark-green">
                <Utensils className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{plan.name}</h2>
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
                ? `Custom nutrition prescription configured for ${userName} (${userEmail}).`
                : 'Interactive daily nutrition schedule with real-time calorie and macronutrient breakdown.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {allPlans.length > 1 && onSelectPlan && (
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
            )}

            {onCreateNewPlan && (
              <button
                type="button"
                onClick={onCreateNewPlan}
                className="py-2.5 px-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Plan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="py-2.5 px-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              title="Print or save as PDF"
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
              <span>{isCoachMode ? 'Save & Assign to Member' : 'Save Plan'}</span>
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
                  placeholder="Add specific instructions for the member (hydration, meal timings, supplements, etc.)..."
                  rows={2}
                  className="w-full mt-1.5 p-2 rounded-lg bg-white border border-purple-200 text-xs text-gray-800 focus:ring-2 focus:ring-purple-400 outline-none"
                />
              ) : (
                <p className="text-purple-900/90 leading-relaxed">{plan.coachNotes}</p>
              )}
            </div>
          </div>
        )}

        {/* Target Configuration & Progress Tracking (Matching Page 8 of PDF) */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Target Configuration & Progress Tracking</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingTargets(!isEditingTargets)}
              className="text-xs font-bold text-brand-green hover:text-brand-dark-green underline cursor-pointer"
            >
              {isEditingTargets ? 'Done Editing Targets' : 'Adjust Targets'}
            </button>
          </div>

          {/* Edit Target inputs if toggled */}
          {isEditingTargets && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Plan Title</label>
                <input
                  type="text"
                  value={plan.name}
                  onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Diet Type</label>
                <select
                  value={plan.dietType}
                  onChange={(e) => setPlan({ ...plan, dietType: e.target.value as DietType })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs font-medium"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Keto">Keto</option>
                  <option value="Low-Carb">Low-Carb</option>
                  <option value="High-Protein Balanced">High-Protein Balanced</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Target Calories (kcal)</label>
                <input
                  type="number"
                  value={plan.targetCalories}
                  onChange={(e) => setPlan({ ...plan, targetCalories: Number(e.target.value) || 0 })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Target Protein (g)</label>
                <input
                  type="number"
                  value={plan.targetProtein}
                  onChange={(e) => setPlan({ ...plan, targetProtein: Number(e.target.value) || 0 })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Target Carbs / Fats (g)</label>
                <div className="flex space-x-1">
                  <input
                    type="number"
                    placeholder="Carbs"
                    value={plan.targetCarbs}
                    onChange={(e) => setPlan({ ...plan, targetCarbs: Number(e.target.value) || 0 })}
                    className="w-1/2 p-2 bg-white rounded-lg border border-gray-200 text-xs font-bold"
                  />
                  <input
                    type="number"
                    placeholder="Fats"
                    value={plan.targetFats}
                    onChange={(e) => setPlan({ ...plan, targetFats: Number(e.target.value) || 0 })}
                    className="w-1/2 p-2 bg-white rounded-lg border border-gray-200 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Progress Tracking Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Calories Card */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
              <div className="flex justify-between items-center text-xs text-amber-900 mb-1">
                <span className="font-bold flex items-center">
                  <Flame className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Total Calories
                </span>
                <span className="font-bold">
                  {Math.round((totals.calories / (plan.targetCalories || 1)) * 100)}%
                </span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-amber-950">
                {totals.calories}{' '}
                <span className="text-xs font-medium text-amber-700">/ {plan.targetCalories} kcal</span>
              </p>
              <div className="w-full bg-amber-200/70 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((totals.calories / (plan.targetCalories || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Protein Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
              <div className="flex justify-between items-center text-xs text-emerald-900 mb-1">
                <span className="font-bold">Protein</span>
                <span className="font-bold">
                  {Math.round((totals.protein / (plan.targetProtein || 1)) * 100)}%
                </span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-emerald-950">
                {totals.protein}g{' '}
                <span className="text-xs font-medium text-emerald-700">/ {plan.targetProtein}g</span>
              </p>
              <div className="w-full bg-emerald-200/70 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((totals.protein / (plan.targetProtein || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Carbs Card */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
              <div className="flex justify-between items-center text-xs text-blue-900 mb-1">
                <span className="font-bold">Carbohydrates</span>
                <span className="font-bold">
                  {Math.round((totals.carbs / (plan.targetCarbs || 1)) * 100)}%
                </span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-blue-950">
                {totals.carbs}g{' '}
                <span className="text-xs font-medium text-blue-700">/ {plan.targetCarbs}g</span>
              </p>
              <div className="w-full bg-blue-200/70 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((totals.carbs / (plan.targetCarbs || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Fats Card */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
              <div className="flex justify-between items-center text-xs text-purple-900 mb-1">
                <span className="font-bold">Healthy Fats</span>
                <span className="font-bold">
                  {Math.round((totals.fats / (plan.targetFats || 1)) * 100)}%
                </span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-purple-950">
                {totals.fats}g{' '}
                <span className="text-xs font-medium text-purple-700">/ {plan.targetFats}g</span>
              </p>
              <div className="w-full bg-purple-200/70 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((totals.fats / (plan.targetFats || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meals Schedule Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Daily Meals & Timing Schedule</h3>
            <p className="text-xs text-gray-500">
              Add meal slots, pick healthy items from the Fitkode Food Library, or customize portions.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddMealSlot}
            className="py-2.5 px-4 rounded-xl bg-brand-light-green hover:bg-brand-light-green/70 text-brand-dark-green font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Meal Slot</span>
          </button>
        </div>

        {/* Empty State */}
        {plan.meals.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-light-green/50 text-brand-green flex items-center justify-center mx-auto">
              <Utensils className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No Meals Added Yet</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Start structuring the day by adding meal slots (e.g. Breakfast, Lunch, Dinner).
            </p>
            <button
              type="button"
              onClick={handleAddMealSlot}
              className="py-2 px-4 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-dark-green cursor-pointer"
            >
              + Add First Meal Slot
            </button>
          </div>
        )}

        {/* Meal Slots List */}
        {plan.meals.map((slot, index) => {
          const slotCalories = slot.items.reduce((sum, item) => sum + (item.calories || 0), 0);
          const slotProtein = slot.items.reduce((sum, item) => sum + (item.protein || 0), 0);
          const slotCarbs = slot.items.reduce((sum, item) => sum + (item.carbs || 0), 0);
          const slotFats = slot.items.reduce((sum, item) => sum + (item.fats || 0), 0);

          return (
            <div
              key={slot.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs space-y-4 hover:border-brand-light-green transition-all"
            >
              {/* Slot Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-light-green/50 text-brand-dark-green flex items-center justify-center font-bold text-xs shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={slot.name}
                      onChange={(e) => handleUpdateSlotMeta(slot.id, e.target.value, slot.time || '')}
                      className="text-sm sm:text-base font-bold text-gray-900 bg-transparent hover:bg-gray-50 px-1 py-0.5 rounded border-b border-transparent hover:border-gray-300 focus:border-brand-green focus:bg-white outline-none"
                    />
                    <div className="flex items-center space-x-3 mt-0.5 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                        <input
                          type="text"
                          value={slot.time || ''}
                          placeholder="e.g. 08:30 AM"
                          onChange={(e) => handleUpdateSlotMeta(slot.id, slot.name, e.target.value)}
                          className="w-24 text-[11px] font-semibold text-gray-600 bg-transparent hover:bg-gray-50 px-1 py-0.5 rounded border-b border-transparent hover:border-gray-300 focus:border-brand-green outline-none"
                        />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Slot Macro Summary & Controls */}
                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <div className="text-right text-xs">
                    <span className="font-extrabold text-gray-900">{slotCalories} kcal</span>
                    <p className="text-[11px] text-gray-500">
                      P: {Math.round(slotProtein)}g | C: {Math.round(slotCarbs)}g | F: {Math.round(slotFats)}g
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 border-l border-gray-200 pl-2">
                    <button
                      type="button"
                      onClick={() => setLibraryModalSlotId(slot.id)}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Select from Food Library"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Food Library</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCustomItem(slot.id)}
                      className="py-1.5 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Add Custom Item"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Custom</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMealSlot(slot.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Meal Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items in Slot */}
              {slot.items.length === 0 ? (
                <div className="p-4 rounded-2xl bg-gray-50/70 text-center text-xs text-gray-500 border border-dashed border-gray-200">
                  No food items in this meal slot. Click{' '}
                  <button
                    type="button"
                    onClick={() => setLibraryModalSlotId(slot.id)}
                    className="font-bold text-emerald-700 underline cursor-pointer"
                  >
                    Food Library
                  </button>{' '}
                  or{' '}
                  <button
                    type="button"
                    onClick={() => handleAddCustomItem(slot.id)}
                    className="font-bold text-gray-700 underline cursor-pointer"
                  >
                    Custom
                  </button>{' '}
                  to add food.
                </div>
              ) : (
                <div className="space-y-2">
                  {slot.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      {/* Name & Serving */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(slot.id, item.id, 'name', e.target.value)}
                            className="font-bold text-gray-900 bg-transparent hover:bg-white px-1.5 py-0.5 rounded border border-transparent hover:border-gray-200 focus:border-brand-green focus:bg-white outline-none w-full max-w-sm"
                          />
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-200 text-gray-700">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-gray-500">Portion:</span>
                          <input
                            type="text"
                            value={item.servingSize}
                            placeholder="e.g. 100g or 1 cup"
                            onChange={(e) => handleUpdateItem(slot.id, item.id, 'servingSize', e.target.value)}
                            className="text-[11px] font-medium text-gray-700 bg-transparent hover:bg-white px-1.5 py-0.5 rounded border border-transparent hover:border-gray-200 focus:border-brand-green focus:bg-white outline-none w-36"
                          />
                          {item.notes && (
                            <span className="text-[11px] text-gray-500 italic hidden sm:inline">
                              • {item.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Macros Editing */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-xl border border-gray-200">
                          <div className="text-center">
                            <span className="text-[9px] font-bold text-gray-400 block">KCAL</span>
                            <input
                              type="number"
                              value={item.calories}
                              onChange={(e) =>
                                handleUpdateItem(slot.id, item.id, 'calories', Number(e.target.value) || 0)
                              }
                              className="w-12 text-center text-xs font-bold text-amber-700 bg-amber-50/50 rounded py-0.5 outline-none"
                            />
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] font-bold text-gray-400 block">PRO (g)</span>
                            <input
                              type="number"
                              value={item.protein}
                              onChange={(e) =>
                                handleUpdateItem(slot.id, item.id, 'protein', Number(e.target.value) || 0)
                              }
                              className="w-10 text-center text-xs font-bold text-emerald-700 bg-emerald-50/50 rounded py-0.5 outline-none"
                            />
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] font-bold text-gray-400 block">CARB (g)</span>
                            <input
                              type="number"
                              value={item.carbs}
                              onChange={(e) =>
                                handleUpdateItem(slot.id, item.id, 'carbs', Number(e.target.value) || 0)
                              }
                              className="w-10 text-center text-xs font-bold text-blue-700 bg-blue-50/50 rounded py-0.5 outline-none"
                            />
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] font-bold text-gray-400 block">FAT (g)</span>
                            <input
                              type="number"
                              value={item.fats}
                              onChange={(e) =>
                                handleUpdateItem(slot.id, item.id, 'fats', Number(e.target.value) || 0)
                              }
                              className="w-10 text-center text-xs font-bold text-purple-700 bg-purple-50/50 rounded py-0.5 outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(slot.id, item.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Food Library Selection Modal */}
      {libraryModalSlotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Fitkode Nutrition & Food Library</h3>
                  <p className="text-xs text-gray-500">
                    Select a verified food item with calibrated macronutrients to add to this slot.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLibraryModalSlotId(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search oats, paneer, eggs, chicken, whey, rice..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-800 focus:ring-2 focus:ring-brand-green outline-none"
                />
              </div>

              <select
                value={libraryCategory}
                onChange={(e) => setLibraryCategory(e.target.value)}
                className="py-2 px-3 bg-white rounded-xl border border-gray-200 text-xs font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="protein">Proteins</option>
                <option value="carbs">Carbohydrates</option>
                <option value="fats">Healthy Fats</option>
                <option value="dairy">Dairy / Plant Milks</option>
                <option value="veggies">Veggies & Fruits</option>
              </select>
            </div>

            {/* Foods Grid */}
            <div className="p-6 overflow-y-auto space-y-2 flex-1">
              {filteredFoodLibrary.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs">
                  No food matching "{librarySearch}". You can also add custom foods directly.
                </div>
              ) : (
                filteredFoodLibrary.map((food, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAddItemFromLibrary(libraryModalSlotId, food)}
                    className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between cursor-pointer group shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-gray-900 group-hover:text-emerald-900">
                          {food.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                          {food.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Serving: <span className="font-medium text-gray-700">{food.servingSize}</span>
                        {food.notes && ` • ${food.notes}`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div className="text-xs">
                        <span className="font-extrabold text-amber-700">{food.calories} kcal</span>
                        <p className="text-[11px] text-gray-500">
                          P: {food.protein}g | C: {food.carbs}g | F: {food.fats}g
                        </p>
                      </div>
                      <span className="p-2 rounded-xl bg-gray-100 group-hover:bg-emerald-600 group-hover:text-white text-gray-600 transition-colors">
                        <Plus className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
              <span>Fitkode Standard Nutrition Reference Database</span>
              <button
                type="button"
                onClick={() => setLibraryModalSlotId(null)}
                className="py-1.5 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print & PDF Export Modal */}
      {isPrintModalOpen && (
        <MealPlanPrintModal
          plan={plan}
          userName={userName}
          userEmail={userEmail}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
}
