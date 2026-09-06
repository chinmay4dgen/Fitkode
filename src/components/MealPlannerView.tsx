import React, { useState, useMemo, useEffect } from 'react';
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
  Layers,
  Lock,
  BookmarkPlus,
  Scale,
} from 'lucide-react';
import { MealPlan, MealSlot, MealItem, DietType, MeasurementSystem } from '../types';
import { FOOD_LIBRARY } from '../lib/plannerLibrary';
import MealPlanPrintModal from './MealPlanPrintModal';
import MealPlansListView from './MealPlansListView';
import { RenamePlanModal, CreatePlanModal } from './PlanNameModals';
import { formatISTDateTime } from '../lib/timestampUtils';
import {
  scaleNutritionByQuantity,
  scaleNutritionByServingText,
  switchItemMeasurementSystem,
  ensureBaseNutrition,
  parsePortion,
} from '../lib/nutritionCalculator';
import {
  loadUserCustomFoods,
  saveUserCustomFood,
  deleteUserCustomFood,
} from '../lib/customFoodStore';

interface MealPlannerViewProps {
  currentPlan: MealPlan | null;
  allPlans?: MealPlan[];
  userEmail: string;
  userName?: string;
  isCoachMode?: boolean; // true if Coach Chinmay is managing for a customer
  coachName?: string;
  initialViewMode?: 'editor' | 'list';
  onSavePlan: (plan: MealPlan) => void;
  onSelectPlan?: (planId: string) => void;
  onCreateNewPlan?: () => void;
  onDeletePlan?: (planId: string) => void;
  onSetActivePlan?: (planId: string) => void;
  onDuplicatePlan?: (plan: MealPlan) => void;
  onRenamePlan?: (planId: string, newName: string) => void;
}

export default function MealPlannerView({
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
}: MealPlannerViewProps) {
  const [viewMode, setViewMode] = useState<'editor' | 'list'>(initialViewMode);

  // Initialize and ensure base nutrition numbers are attached so quantity scaling works immediately
  const initializePlanNutrition = (rawPlan: MealPlan): MealPlan => {
    return {
      ...rawPlan,
      meals: (rawPlan.meals || []).map((slot) => ({
        ...slot,
        items: (slot.items || []).map((item) => {
          // Check if library item matches
          const libMatch = FOOD_LIBRARY.find(
            (f) => f.name.toLowerCase() === item.name.toLowerCase()
          );
          return ensureBaseNutrition(item, libMatch);
        }),
      })),
    };
  };

  // Working local state for the active plan
  const [plan, setPlan] = useState<MealPlan>(() => {
    if (currentPlan) return initializePlanNutrition(currentPlan);
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
  useEffect(() => {
    if (currentPlan) {
      setPlan(initializePlanNutrition(currentPlan));
    }
  }, [currentPlan?.id, currentPlan?.name, currentPlan?.updatedAt]);

  // User's custom food items (stored strictly at profile level)
  const [userCustomFoods, setUserCustomFoods] = useState<MealItem[]>(() =>
    loadUserCustomFoods(userEmail)
  );

  useEffect(() => {
    setUserCustomFoods(loadUserCustomFoods(userEmail));
  }, [userEmail]);

  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [editingMealSlotId, setEditingMealSlotId] = useState<string | null>(null);
  const [libraryModalSlotId, setLibraryModalSlotId] = useState<string | null>(null);
  const [foodSourceTab, setFoodSourceTab] = useState<'master' | 'custom'>('master');
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCategory, setLibraryCategory] = useState<string>('all');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Custom Food Form inside Food Library Modal
  const [showCreateCustomFoodForm, setShowCreateCustomFoodForm] = useState(false);
  const [customFoodForm, setCustomFoodForm] = useState({
    name: '',
    category: 'protein' as MealItem['category'],
    measurementType: 'count' as MeasurementSystem, // 'count' or 'si'
    servingSize: '2 units (100g)',
    quantity: 2,
    unit: 'units',
    unitWeight: 50, // grams or ml per count unit
    calories: 144,
    protein: 12.6,
    carbs: 0.8,
    fats: 9.6,
    notes: '',
  });

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
    const updatedPlan = {
      ...plan,
      updatedAt: new Date().toISOString(),
    };
    setPlan(updatedPlan);
    onSavePlan(updatedPlan);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 4000);
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

  // Add item from master ICMR / US FDA / INFS library to slot
  const handleAddItemFromLibrary = (slotId: string, libItem: typeof FOOD_LIBRARY[0]) => {
    const rawItem: MealItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: libItem.name,
      servingSize: libItem.servingSize,
      calories: libItem.calories,
      protein: libItem.protein,
      carbs: libItem.carbs,
      fats: libItem.fats,
      category: libItem.category,
      notes: libItem.notes,
      isCustom: false, // from ICMR/FDA/INFS approved master database
    };
    const preparedItem = ensureBaseNutrition(rawItem, libItem);

    setPlan({
      ...plan,
      meals: plan.meals.map((s) => (s.id === slotId ? { ...s, items: [...s.items, preparedItem] } : s)),
    });
    setLibraryModalSlotId(null);
  };

  // Add item from user's custom foods library to slot
  const handleAddCustomFoodFromProfile = (slotId: string, customFood: MealItem) => {
    const newItem: MealItem = {
      ...customFood,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      isCustom: true,
    };
    const preparedItem = ensureBaseNutrition(newItem);

    setPlan({
      ...plan,
      meals: plan.meals.map((s) => (s.id === slotId ? { ...s, items: [...s.items, preparedItem] } : s)),
    });
    setLibraryModalSlotId(null);
  };

  // Quick inline add custom item
  const handleAddInlineCustomItem = (slotId: string) => {
    const customItem: MealItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: 'Custom Food Item',
      servingSize: '100g',
      measurementType: 'si',
      quantity: 100,
      unit: 'g',
      calories: 150,
      protein: 12,
      carbs: 15,
      fats: 5,
      category: 'protein',
      isCustom: true,
      unitWeight: 50,
      baseQuantity: 100,
      baseUnit: 'g',
      baseCalories: 150,
      baseProtein: 12,
      baseCarbs: 15,
      baseFats: 5,
      baseServingSize: '100g',
    };

    setPlan({
      ...plan,
      meals: plan.meals.map((s) => (s.id === slotId ? { ...s, items: [...s.items, customItem] } : s)),
    });
  };

  // Save new custom food into User Profile storage (NEVER added to FOOD_LIBRARY)
  const handleSaveNewCustomFoodToProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodForm.name.trim()) return;

    const newCustomFood = {
      name: customFoodForm.name.trim(),
      category: customFoodForm.category,
      measurementType: customFoodForm.measurementType,
      servingSize: customFoodForm.servingSize || `${customFoodForm.quantity} ${customFoodForm.unit}`,
      quantity: customFoodForm.quantity,
      unit: customFoodForm.unit,
      unitWeight: customFoodForm.unitWeight || 50,
      countUnitName: customFoodForm.measurementType === 'count' ? customFoodForm.unit : 'units',
      siUnitName: customFoodForm.unit === 'ml' ? 'ml' : 'g',
      calories: Number(customFoodForm.calories) || 0,
      protein: Number(customFoodForm.protein) || 0,
      carbs: Number(customFoodForm.carbs) || 0,
      fats: Number(customFoodForm.fats) || 0,
      notes: customFoodForm.notes.trim() || undefined,
      isCustom: true,
      baseQuantity: customFoodForm.quantity,
      baseUnit: customFoodForm.unit,
      baseCalories: Number(customFoodForm.calories) || 0,
      baseProtein: Number(customFoodForm.protein) || 0,
      baseCarbs: Number(customFoodForm.carbs) || 0,
      baseFats: Number(customFoodForm.fats) || 0,
      baseServingSize: customFoodForm.servingSize || `${customFoodForm.quantity} ${customFoodForm.unit}`,
    };

    const updated = saveUserCustomFood(userEmail, newCustomFood);
    setUserCustomFoods(updated);
    setShowCreateCustomFoodForm(false);
    setCustomFoodForm({
      name: '',
      category: 'protein',
      measurementType: 'count',
      servingSize: '2 units (100g)',
      quantity: 2,
      unit: 'units',
      unitWeight: 50,
      calories: 144,
      protein: 12.6,
      carbs: 0.8,
      fats: 9.6,
      notes: '',
    });
  };

  const handleDeleteCustomFoodFromProfile = (e: React.MouseEvent, foodId: string) => {
    e.stopPropagation();
    const updated = deleteUserCustomFood(userEmail, foodId);
    setUserCustomFoods(updated);
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

  // Update quantity and correlate macros
  const handleQuantityChange = (slotId: string, itemId: string, newQty: number) => {
    setPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((s) => {
        if (s.id !== slotId) return s;
        return {
          ...s,
          items: s.items.map((it) => {
            if (it.id !== itemId) return it;
            return scaleNutritionByQuantity(it, newQty);
          }),
        };
      }),
    }));
  };

  // Switch between SI unit (g/ml) and Count of item (units/pcs/eggs)
  const handleToggleMeasurementSystem = (
    slotId: string,
    itemId: string,
    targetSystem: MeasurementSystem
  ) => {
    setPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((s) => {
        if (s.id !== slotId) return s;
        return {
          ...s,
          items: s.items.map((it) => {
            if (it.id !== itemId) return it;
            return switchItemMeasurementSystem(it, targetSystem);
          }),
        };
      }),
    }));
  };

  // Switch specific unit from dropdown (e.g. g, ml, units, eggs, rotis, scoops, pcs)
  const handleUnitChange = (slotId: string, itemId: string, newUnit: string) => {
    setPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((s) => {
        if (s.id !== slotId) return s;
        return {
          ...s,
          items: s.items.map((it) => {
            if (it.id !== itemId) return it;
            const isCount =
              newUnit === 'units' ||
              newUnit === 'pcs' ||
              newUnit === 'pieces' ||
              newUnit === 'eggs' ||
              newUnit === 'rotis' ||
              newUnit === 'scoops' ||
              newUnit === 'slices' ||
              newUnit === 'cups' ||
              newUnit === 'bowls';
            const targetSystem: MeasurementSystem = isCount ? 'count' : 'si';
            return switchItemMeasurementSystem(it, targetSystem, newUnit);
          }),
        };
      }),
    }));
  };

  // Update serving text (e.g. typing "100 gm paneer" or "2 eggs") and correlate macros
  const handleServingTextChange = (slotId: string, itemId: string, text: string) => {
    setPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((s) => {
        if (s.id !== slotId) return s;
        return {
          ...s,
          items: s.items.map((it) => {
            if (it.id !== itemId) return it;
            return scaleNutritionByServingText(it, text);
          }),
        };
      }),
    }));
  };

  // Update item field (for manual edits on custom food items or name)
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
              items: s.items.map((item) => {
                if (item.id !== itemId) return item;
                const updated = { ...item, [field]: value };
                // If custom food macros were manually changed, update base reference too
                if (item.isCustom) {
                  if (field === 'calories') updated.baseCalories = Number(value);
                  if (field === 'protein') updated.baseProtein = Number(value);
                  if (field === 'carbs') updated.baseCarbs = Number(value);
                  if (field === 'fats') updated.baseFats = Number(value);
                }
                return updated;
              }),
            }
          : s
      ),
    });
  };

  // Filtered master food library (ICMR, US FDA, INFS)
  const filteredMasterFoodLibrary = useMemo(() => {
    return FOOD_LIBRARY.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
        (f.notes && f.notes.toLowerCase().includes(librarySearch.toLowerCase()));
      const matchCategory = libraryCategory === 'all' || f.category === libraryCategory;
      return matchSearch && matchCategory;
    });
  }, [librarySearch, libraryCategory]);

  // Filtered user custom food library (User profile level only)
  const filteredCustomFoodLibrary = useMemo(() => {
    return userCustomFoods.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
        (f.notes && f.notes.toLowerCase().includes(librarySearch.toLowerCase()));
      const matchCategory = libraryCategory === 'all' || f.category === libraryCategory;
      return matchSearch && matchCategory;
    });
  }, [userCustomFoods, librarySearch, libraryCategory]);

  const isCoachCreated = plan.createdBy === 'coach';

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
              <span>Plan Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="py-2 px-3.5 rounded-xl text-xs font-bold bg-brand-green text-white shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Plans ({allPlans.length || 1})</span>
            </button>
          </div>
        </div>

        <MealPlansListView
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
            else setIsCreateModalOpen(true);
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
      {/* Top View Mode Switcher & Last Updated Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-gray-200 shadow-2xs w-fit">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-brand-green text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Plan Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-brand-green text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Plans ({allPlans.length || 1})</span>
          </button>
        </div>

        {plan.updatedAt && (
          <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>Last Updated: {formatISTDateTime(plan.updatedAt)}</span>
          </div>
        )}
      </div>

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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>{plan.name}</span>
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(true)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Rename this meal plan"
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
                ? `Custom nutrition prescription configured for ${userName} (${userEmail}).`
                : 'Interactive daily nutrition schedule with real-time calorie and macronutrient breakdown.'}
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
                  className="py-2.5 px-3 rounded-xl bg-brand-light-green/70 hover:bg-brand-light-green text-brand-dark-green text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                  title="View all plans in reverse chronological order"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">All Plans</span>
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

        {/* Target Configuration & Progress Tracking */}
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
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 font-bold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  value={plan.targetCalories}
                  onChange={(e) => setPlan({ ...plan, targetCalories: Number(e.target.value) || 0 })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 font-bold text-amber-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={plan.targetProtein}
                  onChange={(e) => setPlan({ ...plan, targetProtein: Number(e.target.value) || 0 })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 font-bold text-emerald-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={plan.targetCarbs}
                  onChange={(e) => setPlan({ ...plan, targetCarbs: Number(e.target.value) || 0 })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 font-bold text-blue-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Fats (g)</label>
                <input
                  type="number"
                  value={plan.targetFats}
                  onChange={(e) => setPlan({ ...plan, targetFats: Number(e.target.value) || 0 })}
                  className="w-full p-2 bg-white rounded-lg border border-gray-200 font-bold text-purple-800"
                />
              </div>
            </div>
          )}

          {/* Calorie & Macro Target Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Calories Card */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Calories</span>
                <span className="text-xs text-amber-700 font-medium">Target: {plan.targetCalories} kcal</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-black text-amber-900">{totals.calories}</span>
                <span className="text-xs font-bold text-amber-700">kcal</span>
              </div>
              <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (totals.calories / (plan.targetCalories || 1)) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-[11px] text-amber-800/80 text-right font-medium">
                {totals.calories > plan.targetCalories
                  ? `+${totals.calories - plan.targetCalories} kcal over target`
                  : `${plan.targetCalories - totals.calories} kcal remaining`}
              </div>
            </div>

            {/* Protein Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Protein</span>
                <span className="text-xs text-emerald-700 font-medium">Target: {plan.targetProtein}g</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-black text-emerald-900">{totals.protein}</span>
                <span className="text-xs font-bold text-emerald-700">g</span>
              </div>
              <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (totals.protein / (plan.targetProtein || 1)) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-[11px] text-emerald-800/80 text-right font-medium">
                {totals.protein >= plan.targetProtein
                  ? 'Target Achieved! 🎯'
                  : `${(plan.targetProtein - totals.protein).toFixed(1)}g to go`}
              </div>
            </div>

            {/* Carbohydrates Card */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Carbs</span>
                <span className="text-xs text-blue-700 font-medium">Target: {plan.targetCarbs}g</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-black text-blue-900">{totals.carbs}</span>
                <span className="text-xs font-bold text-blue-700">g</span>
              </div>
              <div className="w-full bg-blue-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (totals.carbs / (plan.targetCarbs || 1)) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-[11px] text-blue-800/80 text-right font-medium">
                {totals.carbs > plan.targetCarbs
                  ? `+${(totals.carbs - plan.targetCarbs).toFixed(1)}g over target`
                  : `${(plan.targetCarbs - totals.carbs).toFixed(1)}g remaining`}
              </div>
            </div>

            {/* Healthy Fats Card */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Fats</span>
                <span className="text-xs text-purple-700 font-medium">Target: {plan.targetFats}g</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-black text-purple-900">{totals.fats}</span>
                <span className="text-xs font-bold text-purple-700">g</span>
              </div>
              <div className="w-full bg-purple-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (totals.fats / (plan.targetFats || 1)) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-[11px] text-purple-800/80 text-right font-medium">
                {totals.fats > plan.targetFats
                  ? `+${(totals.fats - plan.targetFats).toFixed(1)}g over target`
                  : `${(plan.targetFats - totals.fats).toFixed(1)}g remaining`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Slots Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Daily Meal Schedule</h3>
            <p className="text-xs text-gray-500">
              Update portion quantities to automatically recalculate calories and macros.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddMealSlot}
            className="py-2 px-3.5 rounded-xl bg-brand-light-green/70 hover:bg-brand-light-green text-brand-dark-green text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Meal Slot</span>
          </button>
        </div>

        {plan.meals.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
            <Utensils className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="font-bold text-gray-800">No Meals Added Yet</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Start building this daily plan by adding your first meal slot (e.g. Breakfast, Lunch, Dinner).
            </p>
            <button
              type="button"
              onClick={handleAddMealSlot}
              className="py-2.5 px-4 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-dark-green shadow-xs cursor-pointer"
            >
              + Create First Meal Slot
            </button>
          </div>
        )}

        {plan.meals.map((slot, sIdx) => {
          const slotCalories = slot.items.reduce((sum, item) => sum + (item.calories || 0), 0);
          const slotProtein = slot.items.reduce((sum, item) => sum + (item.protein || 0), 0);
          const slotCarbs = slot.items.reduce((sum, item) => sum + (item.carbs || 0), 0);
          const slotFats = slot.items.reduce((sum, item) => sum + (item.fats || 0), 0);

          return (
            <div
              key={slot.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs space-y-4"
            >
              {/* Slot Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-xl bg-brand-light-green text-brand-dark-green font-black text-xs flex items-center justify-center">
                    {sIdx + 1}
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => handleUpdateSlotMeta(slot.id, e.target.value, slot.time || '')}
                        className="font-bold text-sm sm:text-base text-gray-900 bg-transparent hover:bg-gray-50 px-2 py-0.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-brand-green focus:bg-white outline-none w-64"
                      />
                      <input
                        type="text"
                        value={slot.time || ''}
                        placeholder="e.g. 08:30 AM"
                        onChange={(e) => handleUpdateSlotMeta(slot.id, slot.name, e.target.value)}
                        className="text-xs text-gray-500 font-medium bg-transparent hover:bg-gray-50 px-2 py-0.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-brand-green focus:bg-white outline-none w-28"
                      />
                    </div>
                  </div>
                </div>

                {/* Slot Subtotals & Actions */}
                <div className="flex items-center space-x-3">
                  <div className="text-right text-xs">
                    <span className="font-extrabold text-amber-800">{Math.round(slotCalories)} kcal</span>
                    <p className="text-[11px] text-gray-500">
                      P: {slotProtein.toFixed(1)}g | C: {slotCarbs.toFixed(1)}g | F: {slotFats.toFixed(1)}g
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 border-l border-gray-200 pl-3">
                    <button
                      type="button"
                      onClick={() => setLibraryModalSlotId(slot.id)}
                      className="py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Select approved food or custom food"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Food Library</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddInlineCustomItem(slot.id)}
                      className="py-1.5 px-2 rounded-xl hover:bg-gray-100 text-gray-600 text-xs font-bold transition-colors cursor-pointer"
                      title="Add quick editable custom item"
                    >
                      + Custom
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteMealSlot(slot.id)}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Slot Items List */}
              {slot.items.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  No foods added to this meal yet. Click{' '}
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
                    onClick={() => handleAddInlineCustomItem(slot.id)}
                    className="font-bold text-gray-700 underline cursor-pointer"
                  >
                    Custom
                  </button>{' '}
                  to add food.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {slot.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-gray-50/90 border border-gray-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      {/* Name, Source Badge & Portion Controls */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(slot.id, item.id, 'name', e.target.value)}
                            className="font-bold text-gray-900 bg-transparent hover:bg-white px-1.5 py-0.5 rounded border border-transparent hover:border-gray-200 focus:border-brand-green focus:bg-white outline-none w-full max-w-xs sm:max-w-sm"
                          />
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-200 text-gray-700">
                            {item.category}
                          </span>

                          {/* Distinctive Custom vs Master Approved Badge */}
                          {item.isCustom ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1" title="Custom Food: User profile level. Macros are manually editable.">
                              <Edit2 className="w-2.5 h-2.5 mr-0.5" />
                              <span>Custom Food (Editable)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1" title="ICMR / US FDA / INFS Approved Master Database. Macros calculate in correlation with portion.">
                              <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-emerald-700" />
                              <span>ICMR / FDA Approved</span>
                            </span>
                          )}
                        </div>

                        {/* Quantity Stepper, Unit Selector & SI ⇄ Count Mode Switcher */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] pt-0.5">
                          {/* Dedicated Numeric Quantity + Unit Selector */}
                          <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-xl border border-gray-200 shadow-2xs">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty:</span>
                            <input
                              type="number"
                              min={item.measurementType === 'count' ? 0.25 : 1}
                              step={item.measurementType === 'count' ? 0.5 : 5}
                              max={item.measurementType === 'count' ? 200 : 3000}
                              value={item.quantity ?? (parsePortion(item.servingSize).quantity || 1)}
                              onChange={(e) =>
                                handleQuantityChange(
                                  slot.id,
                                  item.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-14 font-extrabold text-xs text-gray-900 text-center bg-gray-50 px-1 py-0.5 rounded-lg border border-gray-200 focus:border-brand-green focus:bg-white outline-none"
                            />

                            {/* Unit Dropdown */}
                            <select
                              value={item.unit || (item.measurementType === 'count' ? 'units' : 'g')}
                              onChange={(e) => handleUnitChange(slot.id, item.id, e.target.value)}
                              className="text-[11px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 px-1.5 py-0.5 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-brand-green focus:bg-white outline-none cursor-pointer"
                              title="Select unit of measurement"
                            >
                              <optgroup label="Count of Item">
                                <option value="units">units</option>
                                <option value="pcs">pcs</option>
                                {item.countUnitName && item.countUnitName !== 'units' && item.countUnitName !== 'pcs' && (
                                  <option value={item.countUnitName}>{item.countUnitName}</option>
                                )}
                                <option value="eggs">eggs</option>
                                <option value="rotis">rotis</option>
                                <option value="scoops">scoops</option>
                                <option value="slices">slices</option>
                                <option value="cups">cups</option>
                                <option value="bowls">bowls</option>
                              </optgroup>
                              <optgroup label="SI Unit of Measurement">
                                <option value="g">gm (g)</option>
                                <option value="ml">ml (milliliters)</option>
                              </optgroup>
                            </select>
                          </div>

                          {/* Quick SI ⇄ Count Mode Switcher Pill */}
                          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleToggleMeasurementSystem(slot.id, item.id, 'si')}
                              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                                item.measurementType === 'si'
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                              }`}
                              title="Switch to SI Unit of measurement (gm / ml)"
                            >
                              SI (g/ml)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleMeasurementSystem(slot.id, item.id, 'count')}
                              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                                item.measurementType === 'count'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                              }`}
                              title="Switch to Count of item (e.g. 2 units, 2 eggs, 1 scoop)"
                            >
                              Count (Units)
                            </button>
                          </div>

                          {/* Dynamic Conversion Equivalent Helper Badge */}
                          {item.unitWeight ? (
                            <span
                              className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200/80 shadow-2xs"
                              title={`Unit Weight Reference: 1 count unit ≈ ${item.unitWeight}${item.siUnitName || 'g'}`}
                            >
                              {item.measurementType === 'count' ? (
                                <>≈ {Math.round((item.quantity || 1) * item.unitWeight)}{item.siUnitName || 'g'} <span className="text-gray-400 font-normal">({item.unitWeight}g/unit)</span></>
                              ) : (
                                <>≈ {Number(((item.quantity || 1) / item.unitWeight).toFixed(1))} units</>
                              )}
                            </span>
                          ) : null}

                          {/* Text Portion Input */}
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-400 text-[10px]">Label:</span>
                            <input
                              type="text"
                              value={item.servingSize}
                              placeholder="e.g. 2 units or 100g"
                              onChange={(e) =>
                                handleServingTextChange(slot.id, item.id, e.target.value)
                              }
                              className="text-[11px] font-medium text-gray-700 bg-transparent hover:bg-white px-2 py-0.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-brand-green focus:bg-white outline-none w-32"
                            />
                          </div>

                          {item.notes && (
                            <span className="text-gray-500 italic hidden md:inline">
                              • {item.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Macros Editing (Locked for approved ICMR/FDA foods, Editable for custom foods) */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-2xs">
                          {/* KCAL */}
                          <div className="text-center px-1">
                            <span className="text-[9px] font-bold text-gray-400 block">KCAL</span>
                            {item.isCustom ? (
                              <input
                                type="number"
                                value={item.calories}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    slot.id,
                                    item.id,
                                    'calories',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-12 text-center text-xs font-bold text-amber-700 bg-amber-50/80 rounded py-0.5 border border-amber-200 focus:border-amber-500 outline-none"
                                title="Custom food: editable calories"
                              />
                            ) : (
                              <div
                                className="w-12 text-center text-xs font-bold text-amber-900 bg-amber-50/50 rounded py-0.5 select-none"
                                title="ICMR / FDA verified. Auto-calculated proportionally from quantity."
                              >
                                {item.calories}
                              </div>
                            )}
                          </div>

                          {/* PROTEIN */}
                          <div className="text-center px-1 border-l border-gray-100">
                            <span className="text-[9px] font-bold text-gray-400 block">PRO (g)</span>
                            {item.isCustom ? (
                              <input
                                type="number"
                                step="0.1"
                                value={item.protein}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    slot.id,
                                    item.id,
                                    'protein',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-11 text-center text-xs font-bold text-emerald-700 bg-emerald-50/80 rounded py-0.5 border border-emerald-200 focus:border-emerald-500 outline-none"
                                title="Custom food: editable protein"
                              />
                            ) : (
                              <div
                                className="w-11 text-center text-xs font-bold text-emerald-900 bg-emerald-50/50 rounded py-0.5 select-none"
                                title="ICMR / FDA verified. Auto-calculated proportionally from quantity."
                              >
                                {item.protein}
                              </div>
                            )}
                          </div>

                          {/* CARBS */}
                          <div className="text-center px-1 border-l border-gray-100">
                            <span className="text-[9px] font-bold text-gray-400 block">CARB (g)</span>
                            {item.isCustom ? (
                              <input
                                type="number"
                                step="0.1"
                                value={item.carbs}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    slot.id,
                                    item.id,
                                    'carbs',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-11 text-center text-xs font-bold text-blue-700 bg-blue-50/80 rounded py-0.5 border border-blue-200 focus:border-blue-500 outline-none"
                                title="Custom food: editable carbs"
                              />
                            ) : (
                              <div
                                className="w-11 text-center text-xs font-bold text-blue-900 bg-blue-50/50 rounded py-0.5 select-none"
                                title="ICMR / FDA verified. Auto-calculated proportionally from quantity."
                              >
                                {item.carbs}
                              </div>
                            )}
                          </div>

                          {/* FATS */}
                          <div className="text-center px-1 border-l border-gray-100">
                            <span className="text-[9px] font-bold text-gray-400 block">FAT (g)</span>
                            {item.isCustom ? (
                              <input
                                type="number"
                                step="0.1"
                                value={item.fats}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    slot.id,
                                    item.id,
                                    'fats',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-11 text-center text-xs font-bold text-purple-700 bg-purple-50/80 rounded py-0.5 border border-purple-200 focus:border-purple-500 outline-none"
                                title="Custom food: editable fats"
                              />
                            ) : (
                              <div
                                className="w-11 text-center text-xs font-bold text-purple-900 bg-purple-50/50 rounded py-0.5 select-none"
                                title="ICMR / FDA verified. Auto-calculated proportionally from quantity."
                              >
                                {item.fats}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(slot.id, item.id)}
                          className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove item"
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

      {/* Food Library Selection Modal (Master ICMR/FDA vs User Profile Custom Foods) */}
      {libraryModalSlotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Fitkode Nutrition & Food Library</h3>
                  <p className="text-xs text-gray-500">
                    Choose from ICMR / FDA verified foods or your private profile custom foods.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLibraryModalSlotId(null);
                  setShowCreateCustomFoodForm(false);
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Source Tab Toggle: Master Approved vs My Custom Foods */}
            <div className="px-6 pt-4 pb-2 bg-gray-50/70 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-1.5 bg-gray-200/80 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setFoodSourceTab('master');
                    setShowCreateCustomFoodForm(false);
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    foodSourceTab === 'master'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🏛️ ICMR / FDA / INFS Approved Database
                </button>
                <button
                  type="button"
                  onClick={() => setFoodSourceTab('custom')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    foodSourceTab === 'custom'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  👤 My Custom Foods ({userCustomFoods.length})
                </button>
              </div>

              {foodSourceTab === 'custom' && (
                <button
                  type="button"
                  onClick={() => setShowCreateCustomFoodForm(!showCreateCustomFoodForm)}
                  className="py-1.5 px-3 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showCreateCustomFoodForm ? 'Cancel Form' : 'New Custom Food'}</span>
                </button>
              )}
            </div>

            {/* New Custom Food Creation Form (Isolated to user profile) */}
            {foodSourceTab === 'custom' && showCreateCustomFoodForm && (
              <div className="p-4 bg-amber-50/70 border-b border-amber-200 animate-in slide-in-from-top-2 duration-150">
                <form onSubmit={handleSaveNewCustomFoodToProfile} className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-xs flex items-center space-x-1.5">
                      <BookmarkPlus className="w-4 h-4 text-amber-700" />
                      <span>Add Custom Food (Saved Privately to Your Profile)</span>
                    </span>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Never added to master ICMR/FDA database
                    </span>
                  </div>

                  {/* Measurement System Selector for Custom Food */}
                  <div className="bg-white p-2.5 rounded-2xl border border-amber-200/80 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                        Measurement System:
                      </label>
                      <div className="inline-flex rounded-xl bg-gray-100 p-0.5 text-xs font-bold border border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomFoodForm({
                              ...customFoodForm,
                              measurementType: 'count',
                              unit: 'units',
                              quantity: 2,
                              unitWeight: 50,
                              servingSize: '2 units (100g)',
                            });
                          }}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            customFoodForm.measurementType === 'count'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Count of Item (e.g. 2 units, 2 eggs)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomFoodForm({
                              ...customFoodForm,
                              measurementType: 'si',
                              unit: 'g',
                              quantity: 100,
                              unitWeight: 50,
                              servingSize: '100g',
                            });
                          }}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            customFoodForm.measurementType === 'si'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          SI Unit (Grams / ml)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1">
                          {customFoodForm.measurementType === 'count' ? 'Count Quantity' : 'Quantity'}
                        </label>
                        <input
                          type="number"
                          min={customFoodForm.measurementType === 'count' ? 0.25 : 1}
                          step={customFoodForm.measurementType === 'count' ? 0.5 : 5}
                          value={customFoodForm.quantity}
                          onChange={(e) => {
                            const q = parseFloat(e.target.value) || 1;
                            const serving =
                              customFoodForm.measurementType === 'count'
                                ? `${q} ${customFoodForm.unit} (${Math.round(q * (customFoodForm.unitWeight || 50))}g)`
                                : `${q}${customFoodForm.unit}`;
                            setCustomFoodForm({ ...customFoodForm, quantity: q, servingSize: serving });
                          }}
                          className="w-full p-2 bg-white rounded-xl border border-gray-200 font-bold text-gray-900 focus:border-brand-green outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1">Unit of Measurement</label>
                        <select
                          value={customFoodForm.unit}
                          onChange={(e) => {
                            const u = e.target.value;
                            const serving =
                              customFoodForm.measurementType === 'count'
                                ? `${customFoodForm.quantity} ${u} (${Math.round(customFoodForm.quantity * (customFoodForm.unitWeight || 50))}g)`
                                : `${customFoodForm.quantity}${u}`;
                            setCustomFoodForm({ ...customFoodForm, unit: u, servingSize: serving });
                          }}
                          className="w-full p-2 bg-white rounded-xl border border-gray-200 font-bold text-gray-900 focus:border-brand-green outline-none"
                        >
                          {customFoodForm.measurementType === 'count' ? (
                            <>
                              <option value="units">units (Count)</option>
                              <option value="pcs">pcs (Pieces)</option>
                              <option value="eggs">eggs</option>
                              <option value="rotis">rotis</option>
                              <option value="scoops">scoops</option>
                              <option value="slices">slices</option>
                              <option value="cups">cups</option>
                              <option value="bowls">bowls</option>
                            </>
                          ) : (
                            <>
                              <option value="g">gm (grams)</option>
                              <option value="ml">ml (milliliters)</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-1">
                          Weight per 1 Unit ({customFoodForm.unit === 'ml' ? 'ml' : 'g'})
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={customFoodForm.unitWeight}
                          onChange={(e) => {
                            const w = parseFloat(e.target.value) || 50;
                            const serving =
                              customFoodForm.measurementType === 'count'
                                ? `${customFoodForm.quantity} ${customFoodForm.unit} (${Math.round(customFoodForm.quantity * w)}g)`
                                : `${customFoodForm.quantity}${customFoodForm.unit}`;
                            setCustomFoodForm({ ...customFoodForm, unitWeight: w, servingSize: serving });
                          }}
                          placeholder="e.g. 50g per egg"
                          className="w-full p-2 bg-white rounded-xl border border-gray-200 font-medium text-gray-900 focus:border-brand-green outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1">Food Name *</label>
                      <input
                        type="text"
                        required
                        value={customFoodForm.name}
                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, name: e.target.value })}
                        placeholder="e.g. Homemade Sattu Shake or Farm Eggs"
                        className="w-full p-2 bg-white rounded-xl border border-gray-200 font-medium text-gray-900 focus:border-brand-green outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1">Category</label>
                      <select
                        value={customFoodForm.category}
                        onChange={(e) =>
                          setCustomFoodForm({
                            ...customFoodForm,
                            category: e.target.value as MealItem['category'],
                          })
                        }
                        className="w-full p-2 bg-white rounded-xl border border-gray-200 font-medium text-gray-900 focus:border-brand-green outline-none"
                      >
                        <option value="protein">Proteins</option>
                        <option value="carbs">Carbohydrates</option>
                        <option value="fats">Healthy Fats</option>
                        <option value="dairy">Dairy / Plant Milks</option>
                        <option value="veggies">Veggies & Fruits</option>
                        <option value="snack">Snacks</option>
                        <option value="beverage">Beverages</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1">Portion Label</label>
                      <input
                        type="text"
                        value={customFoodForm.servingSize}
                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, servingSize: e.target.value })}
                        placeholder="e.g. 2 units (100g) or 100g"
                        className="w-full p-2 bg-white rounded-xl border border-gray-200 font-medium text-gray-900 focus:border-brand-green outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1">Calories (kcal)</label>
                      <input
                        type="number"
                        value={customFoodForm.calories}
                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, calories: Number(e.target.value) || 0 })}
                        className="w-full p-1.5 bg-white rounded-xl border border-gray-200 font-bold text-amber-800 focus:border-brand-green outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1">Protein (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={customFoodForm.protein}
                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, protein: Number(e.target.value) || 0 })}
                        className="w-full p-1.5 bg-white rounded-xl border border-gray-200 font-bold text-emerald-800 focus:border-brand-green outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={customFoodForm.carbs}
                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, carbs: Number(e.target.value) || 0 })}
                        className="w-full p-1.5 bg-white rounded-xl border border-gray-200 font-bold text-blue-800 focus:border-brand-green outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 mb-1">Fats (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={customFoodForm.fats}
                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, fats: Number(e.target.value) || 0 })}
                        className="w-full p-1.5 bg-white rounded-xl border border-gray-200 font-bold text-purple-800 focus:border-brand-green outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateCustomFoodForm(false)}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-xs"
                    >
                      Save to My Profile Foods
                    </button>
                  </div>
                </form>
              </div>
            )}

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
              {foodSourceTab === 'master' ? (
                filteredMasterFoodLibrary.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-xs">
                    No approved foods matching "{librarySearch}". You can also create a custom food in the "My Custom Foods" tab.
                  </div>
                ) : (
                  filteredMasterFoodLibrary.map((food, idx) => (
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ICMR/FDA
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
                )
              ) : filteredCustomFoodLibrary.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs space-y-3">
                  <BookmarkPlus className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
                  <p>No custom foods saved in your profile yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowCreateCustomFoodForm(true)}
                    className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    + Create Your First Custom Food
                  </button>
                </div>
              ) : (
                filteredCustomFoodLibrary.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => handleAddCustomFoodFromProfile(libraryModalSlotId, food)}
                    className="p-3.5 rounded-2xl bg-white border border-amber-200 hover:border-amber-500 hover:bg-amber-50/30 transition-all flex items-center justify-between cursor-pointer group shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-gray-900 group-hover:text-amber-900">
                          {food.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                          {food.category}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          My Profile
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
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomFoodFromProfile(e, food.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete custom food from my profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="p-2 rounded-xl bg-gray-100 group-hover:bg-amber-600 group-hover:text-white text-gray-600 transition-colors">
                        <Plus className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
              <span>
                {foodSourceTab === 'master'
                  ? 'Official ICMR, US FDA & INFS Approved Nutritional Standards'
                  : 'User Profile Private Food Repository'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setLibraryModalSlotId(null);
                  setShowCreateCustomFoodForm(false);
                }}
                className="py-1.5 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Plan Modal */}
      <RenamePlanModal
        isOpen={isRenameModalOpen}
        title="Rename Meal Plan"
        currentName={plan.name}
        planType="meal"
        onClose={() => setIsRenameModalOpen(false)}
        onSave={handleRenamePlan}
      />

      {/* Create New Plan Modal */}
      <CreatePlanModal
        isOpen={isCreateModalOpen}
        planType="meal"
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(name, meta) => {
          const newPlan: MealPlan = {
            id: `diet_custom_${Date.now()}`,
            name: name,
            userId: userEmail,
            userEmail: userEmail,
            targetCalories: meta.calories || 2000,
            targetProtein: 140,
            targetCarbs: 200,
            targetFats: 55,
            dietType: meta.dietType || 'Vegetarian',
            meals: [],
            createdBy: 'user',
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setPlan(newPlan);
          onSavePlan(newPlan);
          setViewMode('editor');
        }}
      />

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
