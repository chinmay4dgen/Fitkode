import { calculateMifflinStJeorBMR, calculateKatchMcArdleBMR, calculateTDEE } from './fitnessCalculators';
import { ActivityLevel } from '../types';

export type DietGoal = 'fat_loss' | 'lean_muscle_gain' | 'maintenance' | 'body_recomposition';

export interface OnboardingProfileData {
  age: number;
  gender: 'male' | 'female';
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg?: number;
  activityLevel: ActivityLevel;
  fitnessGoal: DietGoal;
  dietaryRestrictions: string[]; // e.g. 'Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'Gluten-Free', 'Lactose-Free'
  foodDislikesAllergies: string[]; // e.g. ['mushrooms', 'peanuts', 'soya']
  mealStructure: '3_meals' | '3_meals_1_snack' | '4_meals' | '2_meals_intermittent';
  cuisineStyle?: string; // e.g. 'North Indian', 'South Indian', 'Pan-Indian', 'Continental'
  bodyFatPercentage?: number; // optional, if known uses Katch-McArdle
}

export interface MealAllocation {
  mealName: string;
  targetTime: string;
  calorieShare: number; // percentage, e.g. 0.25
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatsG: number;
}

export interface DeterministicNutritionTargets {
  bmr: number;
  bmrFormulaUsed: 'Katch-McArdle' | 'Mifflin-St Jeor';
  tdee: number;
  calorieTarget: number;
  calorieAdjustment: number; // e.g. -450 or +250
  proteinG: number;
  proteinPerKg: number; // e.g. 2.0 g/kg
  fatsG: number;
  fatsCalories: number;
  fatsPercentage: number;
  carbsG: number;
  carbsCalories: number;
  carbsPercentage: number;
  mealAllocations: MealAllocation[];
}

/**
 * Deterministic Macro Engine Layer
 * Formulates caloric and macronutrient targets in exact code before feeding into Gemini LLM.
 *
 * 1. BMR (Mifflin-St Jeor Formula or Katch-McArdle if body fat % provided)
 * 2. TDEE (BMR * Activity Factor: 1.2 to 1.9)
 * 3. Calorie Target:
 *    - Fat Loss: Deficit of 15–20% (-400 to -500 kcal)
 *    - Muscle Gain: Surplus of 5–10% (+200 to +300 kcal)
 *    - Maintenance / Body Recomposition: Maintenance TDEE (0 to -150 kcal)
 * 4. Macro Split:
 *    - Protein: 1.6–2.2 g/kg body weight (adjusted for target weight)
 *    - Fats: 20–25% of total daily calories (9 kcal/g)
 *    - Carbohydrates: Remaining calories divided by 4 kcal/g
 * 5. Per-Meal Allocation:
 *    - Splits macro budget across user's preferred meal count
 */
export function calculateDeterministicTargets(profile: OnboardingProfileData): DeterministicNutritionTargets {
  const weight = Math.max(30, Number(profile.currentWeightKg) || 70);
  const targetWeight = profile.targetWeightKg ? Math.max(30, Number(profile.targetWeightKg)) : weight;
  const height = Math.max(100, Number(profile.heightCm) || 170);
  const age = Math.max(15, Math.min(95, Number(profile.age) || 30));
  const gender = profile.gender === 'female' ? 'female' : 'male';
  const activity = profile.activityLevel || 'moderately-active';

  // 1. Calculate BMR
  let bmr = 0;
  let bmrFormulaUsed: 'Katch-McArdle' | 'Mifflin-St Jeor' = 'Mifflin-St Jeor';

  if (profile.bodyFatPercentage && profile.bodyFatPercentage > 3 && profile.bodyFatPercentage < 60) {
    const km = calculateKatchMcArdleBMR(weight, profile.bodyFatPercentage);
    bmr = km.bmr;
    bmrFormulaUsed = 'Katch-McArdle';
  } else {
    bmr = calculateMifflinStJeorBMR(weight, height, age, gender);
  }

  // 2. Calculate TDEE
  const tdee = calculateTDEE(bmr, activity);

  // 3. Goal-Specific Calorie Target
  let calorieAdjustment = 0;
  let targetCalories = tdee;

  switch (profile.fitnessGoal) {
    case 'fat_loss': {
      // 15–20% deficit, clamped between 400 and 550 kcal
      const percentageDeficit = Math.round(tdee * 0.18);
      calorieAdjustment = -Math.max(400, Math.min(550, percentageDeficit));
      targetCalories = Math.max(1200, tdee + calorieAdjustment);
      break;
    }
    case 'lean_muscle_gain': {
      // 5–10% surplus (+200 to +300 kcal)
      const percentageSurplus = Math.round(tdee * 0.08);
      calorieAdjustment = Math.max(200, Math.min(350, percentageSurplus));
      targetCalories = tdee + calorieAdjustment;
      break;
    }
    case 'body_recomposition': {
      // Slight 5-8% deficit or near maintenance for simultaneous fat drop & muscle preservation
      calorieAdjustment = -Math.min(250, Math.round(tdee * 0.07));
      targetCalories = Math.max(1350, tdee + calorieAdjustment);
      break;
    }
    case 'maintenance':
    default: {
      calorieAdjustment = 0;
      targetCalories = tdee;
      break;
    }
  }

  // 4. Macro Split:
  // Protein: 1.6–2.2 g/kg of target weight
  // In fat loss, keep higher protein (2.0 - 2.2 g/kg) to protect lean muscle mass and boost satiety.
  // In surplus/maintenance, 1.8 - 2.0 g/kg is optimal.
  let proteinFactor = 2.0;
  if (profile.fitnessGoal === 'fat_loss' || profile.fitnessGoal === 'body_recomposition') {
    proteinFactor = 2.1;
  } else if (profile.fitnessGoal === 'lean_muscle_gain') {
    proteinFactor = 1.9;
  } else {
    proteinFactor = 1.8;
  }

  // Basis weight is average of current and target weight to prevent under/over-estimation
  const basisWeight = (weight + targetWeight) / 2;
  const proteinG = Math.round(basisWeight * proteinFactor);
  const proteinCalories = proteinG * 4;

  // Fats: 20–25% of total daily calories (9 kcal/g)
  // For fat loss or recomp, use 22-24%
  const fatCaloriePercent = profile.fitnessGoal === 'lean_muscle_gain' ? 0.22 : 0.24;
  const fatsCalories = Math.round(targetCalories * fatCaloriePercent);
  const fatsG = Math.round(fatsCalories / 9);

  // Carbohydrates: Remaining calories / 4
  const remainingCalories = Math.max(200, targetCalories - (proteinCalories + fatsCalories));
  const carbsG = Math.round(remainingCalories / 4);
  const carbsCalories = carbsG * 4;

  // Actual recalibrated calorie target based on macro sums (4-4-9)
  const finalCalories = proteinCalories + fatsCalories + carbsCalories;

  const fatsPercentage = Math.round((fatsCalories / finalCalories) * 100);
  const carbsPercentage = Math.round((carbsCalories / finalCalories) * 100);

  // 5. Per-Meal Allocation across preferred meal count
  let splits: { name: string; time: string; share: number }[] = [];

  switch (profile.mealStructure) {
    case '3_meals_1_snack':
      splits = [
        { name: 'Breakfast', time: '08:30 AM', share: 0.25 },
        { name: 'Lunch', time: '01:30 PM', share: 0.35 },
        { name: 'Evening Snack', time: '05:30 PM', share: 0.10 },
        { name: 'Dinner', time: '08:30 PM', share: 0.30 },
      ];
      break;
    case '3_meals':
      splits = [
        { name: 'Breakfast', time: '08:30 AM', share: 0.30 },
        { name: 'Lunch', time: '01:30 PM', share: 0.40 },
        { name: 'Dinner', time: '08:30 PM', share: 0.30 },
      ];
      break;
    case '4_meals':
      splits = [
        { name: 'Meal 1 (Breakfast)', time: '08:00 AM', share: 0.25 },
        { name: 'Meal 2 (Lunch)', time: '01:00 PM', share: 0.30 },
        { name: 'Meal 3 (Post-Workout / Snack)', time: '05:30 PM', share: 0.20 },
        { name: 'Meal 4 (Dinner)', time: '08:30 PM', share: 0.25 },
      ];
      break;
    case '2_meals_intermittent':
      splits = [
        { name: 'Break-Fast (Meal 1)', time: '12:30 PM', share: 0.50 },
        { name: 'Dinner (Meal 2)', time: '07:30 PM', share: 0.50 },
      ];
      break;
    default:
      splits = [
        { name: 'Breakfast', time: '08:30 AM', share: 0.25 },
        { name: 'Lunch', time: '01:30 PM', share: 0.35 },
        { name: 'Evening Snack', time: '05:30 PM', share: 0.10 },
        { name: 'Dinner', time: '08:30 PM', share: 0.30 },
      ];
  }

  const mealAllocations: MealAllocation[] = splits.map((s) => ({
    mealName: s.name,
    targetTime: s.time,
    calorieShare: s.share,
    targetCalories: Math.round(finalCalories * s.share),
    targetProteinG: Math.round(proteinG * s.share),
    targetCarbsG: Math.round(carbsG * s.share),
    targetFatsG: Math.round(fatsG * s.share),
  }));

  return {
    bmr,
    bmrFormulaUsed,
    tdee,
    calorieTarget: finalCalories,
    calorieAdjustment,
    proteinG,
    proteinPerKg: Number(proteinFactor.toFixed(2)),
    fatsG,
    fatsCalories,
    fatsPercentage,
    carbsG,
    carbsCalories,
    carbsPercentage,
    mealAllocations,
  };
}
