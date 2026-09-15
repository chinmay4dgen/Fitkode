import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calculator,
  Flame,
  Scale,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Utensils,
  ChevronDown,
  Info,
  RefreshCw,
  X,
} from 'lucide-react';
import { OnboardingProfileData, DeterministicNutritionTargets, calculateDeterministicTargets, DietGoal } from '../lib/mealPlanEngine';
import { loadClientOnboarding, loadUserProfile } from '../lib/profileStorage';
import { getMemberOnboarding, extractMedicalSynopsis } from '../lib/medicalAssessmentHelper';
import { getStoredMembers } from '../lib/memberStore';
import { ActivityLevel, MealPlan, MealSlot, MealItem, DietType } from '../types';
import { saveMealPlanToSupabase } from '../lib/supabase';

interface AIMealPlanGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName?: string;
  isCoachMode?: boolean;
  onPlanGenerated: (plan: MealPlan) => void;
}

export default function AIMealPlanGeneratorModal({
  isOpen,
  onClose,
  userEmail,
  userName = 'Member',
  isCoachMode = false,
  onPlanGenerated,
}: AIMealPlanGeneratorModalProps) {
  const [step, setStep] = useState<'profile' | 'calculating' | 'preview'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form profile state pre-filled from user's onboarding & profile
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = useState<number>(174);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(72.8);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(68);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately-active');
  const [fitnessGoal, setFitnessGoal] = useState<DietGoal>('fat_loss');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(['Vegetarian', 'High Protein']);
  const [dislikesInput, setDislikesInput] = useState<string>('Bitter gourd');
  const [mealStructure, setMealStructure] = useState<'3_meals' | '3_meals_1_snack' | '4_meals' | '2_meals_intermittent'>('3_meals_1_snack');
  const [cuisineStyle, setCuisineStyle] = useState<string>('Pan-Indian (North & South Indian Balance)');
  const [bodyFatPercentage, setBodyFatPercentage] = useState<number | undefined>(undefined);

  // Computed deterministic targets
  const [computedTargets, setComputedTargets] = useState<DeterministicNutritionTargets | null>(null);

  // Generated Plan Result
  const [generatedAiResult, setGeneratedAiResult] = useState<any | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // Load from member store and local storage when modal opens
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

      const memberAge = Number(prof.age) || 30;
      setAge(memberAge);

      const rawGender = (prof.gender || 'male').toLowerCase();
      setGender(rawGender.includes('female') ? 'female' : 'male');

      if (ob.heightCm) setHeightCm(Number(ob.heightCm) || 174);
      if (ob.currentWeightKg) {
        const wt = Number(ob.currentWeightKg) || 72.8;
        setCurrentWeightKg(wt);
        const tgt = Math.round(wt > 70 ? wt - 5 : wt + 3);
        setTargetWeightKg(tgt);
      }

      // Fitness Goal mapping
      const g = (ob.healthGoal || '').toLowerCase();
      if (g.includes('muscle') || g.includes('gain') || g.includes('bodybuilding')) {
        setFitnessGoal('lean_muscle_gain');
      } else if (g.includes('recomp') || g.includes('tone') || g.includes('aesthetic')) {
        setFitnessGoal('body_recomposition');
      } else if (g.includes('maintain') || g.includes('fitness')) {
        setFitnessGoal('maintenance');
      } else {
        setFitnessGoal('fat_loss');
      }

      // Dietary restrictions
      if (Array.isArray(ob.dietPreferences) && ob.dietPreferences.length > 0) {
        setDietaryRestrictions(ob.dietPreferences);
      }

      // Allergies & dislikes
      const dislikesArr: string[] = [];
      if (ob.foodAllergies && ob.foodAllergies !== 'None') dislikesArr.push(ob.foodAllergies);
      if (ob.dislikedFoods && ob.dislikedFoods !== 'None') dislikesArr.push(ob.dislikedFoods);
      if (dislikesArr.length > 0) {
        setDislikesInput(dislikesArr.join(', '));
      }

      const initialWeight = Number(ob.currentWeightKg) || 72.8;
      const targetWeight = Math.round(initialWeight > 70 ? initialWeight - 5 : initialWeight + 3);
      // Compute initial deterministic targets immediately
      const profileData: OnboardingProfileData = {
        age: memberAge,
        gender: rawGender.includes('female') ? 'female' : 'male',
        heightCm: Number(ob.heightCm) || 174,
        currentWeightKg: initialWeight,
        targetWeightKg: targetWeight,
        activityLevel: 'moderately-active',
        fitnessGoal: g.includes('gain') || g.includes('muscle') ? 'lean_muscle_gain' : 'fat_loss',
        dietaryRestrictions: ob.dietPreferences?.length ? ob.dietPreferences : ['Vegetarian'],
        foodDislikesAllergies: dislikesArr,
        mealStructure: '3_meals_1_snack',
        cuisineStyle: 'Pan-Indian (North & South Indian Balance)',
      };
      setComputedTargets(calculateDeterministicTargets(profileData));
    } catch (err) {
      console.warn('Error pre-filling AI modal:', err);
    }
  }, [isOpen, userEmail]);

  // Recalculate deterministic targets whenever inputs change
  useEffect(() => {
    const dislikes = dislikesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const profileData: OnboardingProfileData = {
      age,
      gender,
      heightCm,
      currentWeightKg,
      targetWeightKg,
      activityLevel,
      fitnessGoal,
      dietaryRestrictions,
      foodDislikesAllergies: dislikes,
      mealStructure,
      cuisineStyle,
      bodyFatPercentage,
    };

    const targets = calculateDeterministicTargets(profileData);
    setComputedTargets(targets);
  }, [
    age,
    gender,
    heightCm,
    currentWeightKg,
    targetWeightKg,
    activityLevel,
    fitnessGoal,
    dietaryRestrictions,
    dislikesInput,
    mealStructure,
    cuisineStyle,
    bodyFatPercentage,
  ]);

  if (!isOpen) return null;

  const handleGenerateWithAI = async () => {
    if (!computedTargets) return;
    setLoading(true);
    setError(null);

    const dislikes = dislikesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const profileData: OnboardingProfileData = {
      age,
      gender,
      heightCm,
      currentWeightKg,
      targetWeightKg,
      activityLevel,
      fitnessGoal,
      dietaryRestrictions,
      foodDislikesAllergies: dislikes,
      mealStructure,
      cuisineStyle,
      bodyFatPercentage,
    };

    try {
      setFallbackNotice(null);
      const res = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profileData,
          targets: computedTargets,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.warn('Non-JSON response from /api/generate-meal-plan:', text);
        if (res.status === 504 || res.status === 502) {
          throw new Error('The AI meal planner request timed out during peak API traffic. Please try again.');
        }
        throw new Error(`Server returned unexpected status (${res.status}). Please try again.`);
      }

      if (!res.ok || !data.success || !data.plan_data) {
        throw new Error(data.error || 'Server failed to formulate meal plan.');
      }

      setGeneratedAiResult(data.plan_data);
      if (data.fallback_notice) {
        setFallbackNotice(data.fallback_notice);
      }
      setStep('preview');
    } catch (err: any) {
      console.error('Error generating AI plan:', err);
      setError(err.message || 'Failed to connect to AI meal planning service.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptAndSavePlan = () => {
    if (!generatedAiResult || !computedTargets) return;

    // Convert AI structured JSON into Fitkode MealPlan interface
    const meals: MealSlot[] = (generatedAiResult.meals || []).map((m: any, idx: number) => {
      const mealSuggestedRecipe = m.suggested_recipe || '';
      const items: MealItem[] = (m.items || []).map((it: any, itIdx: number) => {
        const rawName = it.raw_food_item || it.food_item || 'Food Item';
        const rawQty = typeof it.raw_quantity === 'number' ? it.raw_quantity : 1;
        const unitStr = it.unit || 'serving';
        const itemSuggestedRecipe = it.suggested_recipe || mealSuggestedRecipe;
        const cal = typeof it.calories === 'number' ? it.calories : Math.round(m.calories / (m.items.length || 1));
        const pro = typeof it.protein_g === 'number' ? it.protein_g : Math.round(m.macros.protein_g / (m.items.length || 1));
        const carb = typeof it.carbs_g === 'number' ? it.carbs_g : Math.round(m.macros.carbs_g / (m.items.length || 1));
        const fat = typeof it.fats_g === 'number' ? it.fats_g : Math.round(m.macros.fats_g / (m.items.length || 1));

        return {
          id: `ai_item_${Date.now()}_${idx}_${itIdx}`,
          name: rawName,
          servingSize: it.portion_label || it.portion || `${rawQty} ${unitStr}`,
          quantity: rawQty,
          unit: unitStr,
          rawWeightG: unitStr === 'g' ? rawQty : undefined,
          suggestedRecipe: itemSuggestedRecipe,
          measurementType: (unitStr === 'g' || unitStr === 'ml') ? ('si' as const) : ('count' as const),
          calories: cal,
          protein: pro,
          carbs: carb,
          fats: fat,
          category: 'veggies' as const,
          notes: it.notes || '',
          isCustom: true,
        };
      });

      return {
        id: `ai_slot_${Date.now()}_${idx}`,
        name: m.meal_name,
        time: m.target_time,
        suggestedRecipe: mealSuggestedRecipe,
        recipeInstructions: m.recipe_notes || '',
        items,
      };
    });

    const now = new Date().toISOString();
    const planName = isCoachMode
      ? `Coach Prescribed: ${fitnessGoal === 'lean_muscle_gain' ? 'Muscle Gain' : fitnessGoal === 'fat_loss' ? 'Fat Loss' : 'Performance'} (${computedTargets.calorieTarget} kcal)`
      : `AI Meal Plan (${computedTargets.calorieTarget} kcal)`;

    const dietType: DietType = dietaryRestrictions.includes('Vegan')
      ? 'Vegan'
      : dietaryRestrictions.includes('Vegetarian') || dietaryRestrictions.includes('Jain')
      ? 'Vegetarian'
      : dietaryRestrictions.includes('Eggetarian')
      ? 'Eggetarian'
      : 'Non-Vegetarian';

    const adoptedPlan: MealPlan = {
      id: isCoachMode ? `coach_diet_ai_${Date.now()}` : `plan_ai_${Date.now()}`,
      name: planName,
      userId: userEmail,
      userEmail: userEmail,
      targetCalories: computedTargets.calorieTarget,
      targetProtein: computedTargets.proteinG,
      targetCarbs: computedTargets.carbsG,
      targetFats: computedTargets.fatsG,
      dietType,
      meals,
      createdBy: isCoachMode ? 'coach' : 'user',
      coachName: isCoachMode ? 'Chinmay Jain' : undefined,
      coachNotes: isCoachMode
        ? `Coach Prescribed Nutrition Regimen formulated on ${new Date().toLocaleDateString('en-IN')}. Targeted at ${computedTargets.calorieTarget} kcal (${computedTargets.proteinG}g P / ${computedTargets.carbsG}g C / ${computedTargets.fatsG}g F). Adheres to ${dietType} preference and clinical energy balance.`
        : `AI-Synthesized on ${new Date().toLocaleDateString('en-IN')}. Deterministic macro formula: ${computedTargets.bmrFormulaUsed} BMR (${computedTargets.bmr} kcal) -> TDEE (${computedTargets.tdee} kcal) -> ${computedTargets.calorieAdjustment >= 0 ? '+' : ''}${computedTargets.calorieAdjustment} kcal adjustment.`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // Save to Supabase in the background
    saveMealPlanToSupabase({
      userId: userEmail,
      userEmail: userEmail,
      dailyCalories: computedTargets.calorieTarget,
      proteinG: computedTargets.proteinG,
      carbsG: computedTargets.carbsG,
      fatsG: computedTargets.fatsG,
      planData: adoptedPlan,
    });

    onPlanGenerated(adoptedPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-brand-green text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {isCoachMode ? `Coach AI Meal Plan Formulation` : 'AI Meal Plan Generator'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {isCoachMode ? `Prescribing for ${userName}` : 'Deterministic Math + Gemini'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {isCoachMode
                  ? `Clinical sports science nutrition engine for ${userName} (${userEmail}). Computes calibrated macros and generates realistic Indian meal portions.`
                  : 'Evidence-based sports science engine. Computes BMR & macros in code first, then crafts realistic Indian meal portions.'}
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
              </div>
            </div>
          )}

          {step === 'profile' && (
            <div className="space-y-6">
              {/* Step 1 Banner: Deterministic Live Preview */}
              {computedTargets && (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                      <Calculator className="w-4 h-4 text-emerald-700" />
                      <span>Deterministic Nutrition Engine Calculation</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Formula: {computedTargets.bmrFormulaUsed}
                    </span>
                  </div>

                  {/* Macro Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Daily Target</span>
                      <span className="text-lg font-black text-emerald-900">{computedTargets.calorieTarget}</span>
                      <span className="text-[10px] text-gray-500 block">kcal ({computedTargets.calorieAdjustment >= 0 ? '+' : ''}{computedTargets.calorieAdjustment} vs TDEE)</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Protein ({computedTargets.proteinPerKg}g/kg)</span>
                      <span className="text-lg font-black text-blue-700">{computedTargets.proteinG}g</span>
                      <span className="text-[10px] text-gray-500 block">{computedTargets.proteinG * 4} kcal</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Carbohydrates</span>
                      <span className="text-lg font-black text-amber-700">{computedTargets.carbsG}g</span>
                      <span className="text-[10px] text-gray-500 block">{computedTargets.carbsCalories} kcal ({computedTargets.carbsPercentage}%)</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Healthy Fats</span>
                      <span className="text-lg font-black text-purple-700">{computedTargets.fatsG}g</span>
                      <span className="text-[10px] text-gray-500 block">{computedTargets.fatsCalories} kcal ({computedTargets.fatsPercentage}%)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Input Form Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Weight */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Current Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentWeightKg}
                    onChange={(e) => setCurrentWeightKg(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-brand-green outline-none"
                  />
                </div>

                {/* Target Weight */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-brand-green outline-none"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-brand-green outline-none"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-brand-green outline-none"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-brand-green outline-none bg-white cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                {/* Fitness Goal */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fitness Goal</label>
                  <select
                    value={fitnessGoal}
                    onChange={(e) => setFitnessGoal(e.target.value as DietGoal)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-brand-green outline-none bg-white cursor-pointer"
                  >
                    <option value="fat_loss">Fat Loss (-18% Deficit)</option>
                    <option value="lean_muscle_gain">Lean Muscle Gain (+8% Surplus)</option>
                    <option value="body_recomposition">Body Recomposition (Maintenance / High Protein)</option>
                    <option value="maintenance">Weight Maintenance</option>
                  </select>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Activity Factor</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-brand-green outline-none bg-white cursor-pointer"
                  >
                    <option value="sedentary">Sedentary (desk job, 1.2x)</option>
                    <option value="lightly-active">Lightly Active (1-3 days/wk, 1.375x)</option>
                    <option value="moderately-active">Moderately Active (3-5 days/wk, 1.55x)</option>
                    <option value="very-active">Very Active (6-7 days/wk, 1.725x)</option>
                    <option value="extremely-active">Extremely Active (Athletic/Physical job, 1.9x)</option>
                  </select>
                </div>

                {/* Meal Count Structure */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Meal Structure</label>
                  <select
                    value={mealStructure}
                    onChange={(e) => setMealStructure(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-brand-green outline-none bg-white cursor-pointer"
                  >
                    <option value="3_meals_1_snack">3 Meals + 1 Evening Snack (Recommended)</option>
                    <option value="3_meals">3 Main Meals (Breakfast, Lunch, Dinner)</option>
                    <option value="4_meals">4 Structured Meals (With Pre/Post-workout)</option>
                    <option value="2_meals_intermittent">2 Meals (Intermittent Fasting 16:8)</option>
                  </select>
                </div>

                {/* Body Fat % (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Body Fat % <span className="text-gray-400 font-normal">(Optional, for Katch-McArdle)</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 21"
                    value={bodyFatPercentage || ''}
                    onChange={(e) => setBodyFatPercentage(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-brand-green outline-none"
                  />
                </div>
              </div>

              {/* Dietary Preferences & Food Allergies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Dietary Pattern
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'Gluten-Free', 'High Protein'].map((type) => {
                      const active = dietaryRestrictions.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            if (active) {
                              setDietaryRestrictions(dietaryRestrictions.filter((d) => d !== type));
                            } else {
                              setDietaryRestrictions([...dietaryRestrictions, type]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            active
                              ? 'bg-brand-green text-white shadow-2xs'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Excluded Allergies & Dislikes (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={dislikesInput}
                    onChange={(e) => setDislikesInput(e.target.value)}
                    placeholder="e.g. bitter gourd, peanuts, mushrooms, lactose"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-brand-green outline-none"
                  />
                </div>
              </div>

              {/* Meal Slot Allocation Breakdown */}
              {computedTargets && computedTargets.mealAllocations && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-700">Per-Meal Caloric & Macro Budget:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {computedTargets.mealAllocations.map((slot, sIdx) => (
                      <div key={sIdx} className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-gray-900">{slot.mealName}</span>
                          <span className="text-[10px] text-gray-500 font-medium">{slot.targetTime}</span>
                        </div>
                        <div className="text-sm font-extrabold text-brand-dark-green">
                          ~{slot.targetCalories} kcal
                        </div>
                        <div className="text-[10px] text-gray-600 font-medium">
                          P: {slot.targetProteinG}g | C: {slot.targetCarbsG}g | F: {slot.targetFatsG}g
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && generatedAiResult && (
            <div className="space-y-6">
              {fallbackNotice && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{fallbackNotice}</span>
                </div>
              )}
              {/* Summary Bar */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-emerald-900 text-xs sm:text-sm">
                      AI Nutrition Plan Generated Successfully
                    </span>
                    <p className="text-[11px] text-emerald-700">
                      Matches deterministic target ({computedTargets?.calorieTarget} kcal) within 2% margin.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs font-bold text-emerald-950">
                  <span>Total: {generatedAiResult.day_summary?.total_calories} kcal</span>
                  <span>P: {generatedAiResult.day_summary?.total_protein_g}g</span>
                  <span>C: {generatedAiResult.day_summary?.total_carbs_g}g</span>
                  <span>F: {generatedAiResult.day_summary?.total_fats_g}g</span>
                </div>
              </div>

              {/* Generated Meals List */}
              <div className="space-y-4">
                {(generatedAiResult.meals || []).map((meal: any, idx: number) => {
                  const mealSuggestedRecipe = meal.suggested_recipe || '';
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/90 space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/70 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-brand-green/20 text-brand-dark-green font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <h4 className="font-bold text-sm text-gray-900">{meal.meal_name}</h4>
                          <span className="text-xs text-gray-500 font-medium flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                            {meal.target_time}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs font-bold">
                          <span className="text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-lg">
                            {meal.calories} kcal
                          </span>
                          <span className="text-gray-600 bg-gray-200/60 px-2 py-0.5 rounded-lg text-[11px]">
                            P: {meal.macros?.protein_g}g | C: {meal.macros?.carbs_g}g | F: {meal.macros?.fats_g}g
                          </span>
                        </div>
                      </div>

                      {/* Raw Line Items (Raw Items First) */}
                      <div className="space-y-2">
                        <div className="hidden sm:grid sm:grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1 bg-gray-100/80 rounded-lg">
                          <span className="sm:col-span-5">Raw Line Item</span>
                          <span className="sm:col-span-2 text-center">Req. Quantity</span>
                          <span className="sm:col-span-3">Suggested Recipe</span>
                          <span className="sm:col-span-2 text-right">Macros</span>
                        </div>

                        {(meal.items || []).map((it: any, itIdx: number) => {
                          const itemName = it.raw_food_item || it.food_item || 'Food Item';
                          const itemPortion = it.portion_label || it.portion || `${it.raw_quantity || 1} ${it.unit || 'g'}`;
                          const itemRecipe = it.suggested_recipe || mealSuggestedRecipe;
                          const cal = typeof it.calories === 'number' ? it.calories : null;
                          const p = typeof it.protein_g === 'number' ? it.protein_g : null;

                          return (
                            <div
                              key={itIdx}
                              className="p-2.5 rounded-xl bg-white border border-gray-200/80 text-xs shadow-2xs flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-2"
                            >
                              <div className="sm:col-span-5">
                                <span className="font-bold text-gray-900 block">{itemName}</span>
                                {it.notes && <p className="text-[11px] text-gray-500 italic mt-0.5">{it.notes}</p>}
                              </div>

                              <div className="sm:col-span-2 sm:text-center">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold text-xs">
                                  {itemPortion}
                                </span>
                              </div>

                              <div className="sm:col-span-3">
                                {itemRecipe ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-semibold">
                                    {itemRecipe}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-[11px]">—</span>
                                )}
                              </div>

                              <div className="sm:col-span-2 sm:text-right text-[11px] font-semibold text-gray-700">
                                {cal !== null ? (
                                  <span>{cal} kcal {p !== null && <span className="text-gray-400 font-normal">({p}g P)</span>}</span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Adjacent Row for Suggested Recipe & Culinary Instructions */}
                      {mealSuggestedRecipe && (
                        <div className="mt-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 border border-amber-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start sm:items-center space-x-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-950 font-bold text-[10px] uppercase tracking-wider shrink-0">
                              Suggested Recipe
                            </span>
                            <span className="font-bold text-gray-900">{mealSuggestedRecipe}</span>
                          </div>
                          {meal.recipe_notes && (
                            <p className="text-[11px] text-amber-950/80 font-medium italic sm:text-right">
                              {meal.recipe_notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                onClick={() => setStep('profile')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
              >
                Back to Settings
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-white text-xs font-bold text-gray-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdoptAndSavePlan}
                  className="px-5 py-2 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isCoachMode ? 'Adopt & Assign Coach Plan to Member' : 'Adopt & Load into Editor'}</span>
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
                onClick={handleGenerateWithAI}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark-green text-white text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Plan with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isCoachMode ? `Generate Coach Plan for ${userName}` : 'Generate AI Meal Plan'}</span>
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
