import { MealPlan, WorkoutPlan } from '../types';
import { createDefaultVegDietPlan, createDefaultWorkoutPlan } from './plannerLibrary';

const MEAL_PLANS_KEY = 'fk_meal_plans_v1';
const WORKOUT_PLANS_KEY = 'fk_workout_plans_v1';

// Initial seeded plans for demo members (showing coach assigned plans for both paid & unpaid)
const SEED_MEAL_PLANS: MealPlan[] = [
  // Coach Chinmay assigned plan to Priya Sharma (Paid member)
  {
    ...createDefaultVegDietPlan('priya.sharma@example.com', true),
    id: 'seed_diet_priya_coach',
    name: 'Priya’s 1,850 kcal High-Protein Fat Loss Regimen',
    coachName: 'Chinmay Jain',
    coachNotes: 'Priya, remember to prioritize your morning oats with whey to curb 11 AM cravings. Stay consistent with the 3.5L water target.',
  },
  // Coach Chinmay assigned plan to Rahul Verma (Unpaid / Free member - works for both!)
  {
    ...createDefaultVegDietPlan('rahul.verma@example.com', true),
    id: 'seed_diet_rahul_coach',
    name: 'Rahul’s Kickstart Nutrition & Recovery Plan',
    targetCalories: 2000,
    targetProtein: 140,
    targetCarbs: 210,
    targetFats: 55,
    coachName: 'Chinmay Jain',
    coachNotes: 'Rahul, this baseline plan will keep your energy elevated during your busy work hours. Feel free to adjust the evening snack if needed.',
  },
];

const SEED_WORKOUT_PLANS: WorkoutPlan[] = [
  // Coach Chinmay assigned workout to Priya Sharma (Paid)
  {
    ...createDefaultWorkoutPlan('priya.sharma@example.com', true),
    id: 'seed_workout_priya_coach',
    name: 'Priya’s 4-Day Hypertrophy & Posture Routine',
    coachName: 'Chinmay Jain',
    coachNotes: 'Focus on keeping your chest proud during dumbbell rows. 60-second rest intervals between sets.',
  },
  // Coach Chinmay assigned workout to Rahul Verma (Unpaid)
  {
    ...createDefaultWorkoutPlan('rahul.verma@example.com', true),
    id: 'seed_workout_rahul_coach',
    name: 'Rahul’s 3-Day Foundation & Conditioning',
    goal: 'General Fitness & Longevity',
    difficulty: 'Beginner',
    coachName: 'Chinmay Jain',
    coachNotes: 'Welcome to Fitkode, Rahul! Stick with moderate weights for the first 2 weeks to master movement form.',
  },
];

// =========================================================================
// HELPER STORAGE FUNCTIONS
// =========================================================================

function getAllStoredMealPlans(): MealPlan[] {
  try {
    const raw = localStorage.getItem(MEAL_PLANS_KEY);
    if (!raw) {
      localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(SEED_MEAL_PLANS));
      return SEED_MEAL_PLANS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_MEAL_PLANS;
  } catch (err) {
    console.error('Error reading meal plans from storage:', err);
    return SEED_MEAL_PLANS;
  }
}

function saveAllMealPlans(plans: MealPlan[]) {
  try {
    localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(plans));
  } catch (err) {
    console.error('Error saving meal plans to storage:', err);
  }
}

function getAllStoredWorkoutPlans(): WorkoutPlan[] {
  try {
    const raw = localStorage.getItem(WORKOUT_PLANS_KEY);
    if (!raw) {
      localStorage.setItem(WORKOUT_PLANS_KEY, JSON.stringify(SEED_WORKOUT_PLANS));
      return SEED_WORKOUT_PLANS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_WORKOUT_PLANS;
  } catch (err) {
    console.error('Error reading workout plans from storage:', err);
    return SEED_WORKOUT_PLANS;
  }
}

function saveAllWorkoutPlans(plans: WorkoutPlan[]) {
  try {
    localStorage.setItem(WORKOUT_PLANS_KEY, JSON.stringify(plans));
  } catch (err) {
    console.error('Error saving workout plans to storage:', err);
  }
}

// =========================================================================
// USER MEAL PLAN METHODS
// =========================================================================

export function loadUserMealPlans(userEmail: string): MealPlan[] {
  if (!userEmail) return [];
  const normalizedEmail = userEmail.toLowerCase().trim();
  const all = getAllStoredMealPlans();
  const userPlans = all.filter(
    (p) => (p.userEmail && p.userEmail.toLowerCase().trim() === normalizedEmail) ||
           (p.userId && p.userId.toLowerCase().trim() === normalizedEmail)
  );

  // If no plan exists for this user yet, create a default self-created plan as starter
  if (userPlans.length === 0) {
    const initialStarter = createDefaultVegDietPlan(normalizedEmail, false);
    initialStarter.name = 'My Personal Meal Plan';
    all.push(initialStarter);
    saveAllMealPlans(all);
    return [initialStarter];
  }

  return userPlans;
}

export function getActiveMealPlan(userEmail: string): MealPlan | null {
  const plans = loadUserMealPlans(userEmail);
  if (plans.length === 0) return null;
  // Prioritize active, else coach assigned, else first
  const active = plans.find((p) => p.isActive);
  if (active) return active;
  const coachAssigned = plans.find((p) => p.createdBy === 'coach');
  return coachAssigned || plans[0] || null;
}

export async function saveMealPlan(plan: MealPlan): Promise<MealPlan[]> {
  const all = getAllStoredMealPlans();
  const planEmail = (plan.userEmail || plan.userId || '').toLowerCase().trim();
  const updatedPlan: MealPlan = {
    ...plan,
    userEmail: planEmail,
    userId: planEmail,
    updatedAt: new Date().toISOString(),
  };

  const index = all.findIndex((p) => p.id === plan.id);
  if (index >= 0) {
    all[index] = updatedPlan;
  } else {
    all.unshift(updatedPlan);
  }

  // If this plan is set to active, deactivate others for this user
  if (updatedPlan.isActive) {
    for (const p of all) {
      if (
        p.id !== updatedPlan.id &&
        ((p.userEmail && p.userEmail.toLowerCase().trim() === planEmail) ||
         (p.userId && p.userId.toLowerCase().trim() === planEmail))
      ) {
        p.isActive = false;
      }
    }
  }

  saveAllMealPlans(all);
  return loadUserMealPlans(planEmail);
}

export async function deleteMealPlan(planId: string, userEmail: string): Promise<MealPlan[]> {
  const all = getAllStoredMealPlans();
  const filtered = all.filter((p) => p.id !== planId);
  saveAllMealPlans(filtered);
  return loadUserMealPlans(userEmail);
}

export async function setActiveMealPlan(planId: string, userEmail: string): Promise<MealPlan[]> {
  const all = getAllStoredMealPlans();
  const normalizedEmail = userEmail.toLowerCase().trim();

  for (const p of all) {
    if (
      (p.userEmail && p.userEmail.toLowerCase().trim() === normalizedEmail) ||
      (p.userId && p.userId.toLowerCase().trim() === normalizedEmail)
    ) {
      p.isActive = p.id === planId;
    }
  }

  saveAllMealPlans(all);
  return loadUserMealPlans(userEmail);
}

/**
 * Coach / Super Admin Chinmay assigns a Meal Plan to any member
 */
export async function assignCoachMealPlan(
  targetEmail: string,
  planData: Partial<MealPlan>,
  coachName = 'Chinmay Jain'
): Promise<MealPlan> {
  const normalizedEmail = targetEmail.toLowerCase().trim();
  const all = getAllStoredMealPlans();
  const now = new Date().toISOString();

  // Deactivate any previous plans for this user so coach's new plan is instantly active
  for (const p of all) {
    if (
      (p.userEmail && p.userEmail.toLowerCase().trim() === normalizedEmail) ||
      (p.userId && p.userId.toLowerCase().trim() === normalizedEmail)
    ) {
      p.isActive = false;
    }
  }

  const newPlan: MealPlan = {
    id: planData.id || `coach_diet_${Date.now()}`,
    name: planData.name || `Coach Assigned Meal Plan for ${normalizedEmail.split('@')[0]}`,
    userId: normalizedEmail,
    userEmail: normalizedEmail,
    targetCalories: planData.targetCalories || 2000,
    targetProtein: planData.targetProtein || 140,
    targetCarbs: planData.targetCarbs || 200,
    targetFats: planData.targetFats || 55,
    dietType: planData.dietType || 'Vegetarian',
    meals: planData.meals || [],
    createdBy: 'coach',
    coachName: coachName,
    coachNotes: planData.coachNotes || `Custom nutritional plan prepared by Coach ${coachName}.`,
    isActive: true,
    createdAt: planData.createdAt || now,
    updatedAt: now,
  };

  const existingIdx = all.findIndex((p) => p.id === newPlan.id);
  if (existingIdx >= 0) {
    all[existingIdx] = newPlan;
  } else {
    all.unshift(newPlan);
  }

  saveAllMealPlans(all);
  return newPlan;
}

// =========================================================================
// USER WORKOUT PLAN METHODS
// =========================================================================

export function loadUserWorkoutPlans(userEmail: string): WorkoutPlan[] {
  if (!userEmail) return [];
  const normalizedEmail = userEmail.toLowerCase().trim();
  const all = getAllStoredWorkoutPlans();
  const userPlans = all.filter(
    (p) => (p.userEmail && p.userEmail.toLowerCase().trim() === normalizedEmail) ||
           (p.userId && p.userId.toLowerCase().trim() === normalizedEmail)
  );

  // If no plan exists for this user yet, create a default self-created plan as starter
  if (userPlans.length === 0) {
    const initialStarter = createDefaultWorkoutPlan(normalizedEmail, false);
    initialStarter.name = 'My Personal Workout Plan';
    all.push(initialStarter);
    saveAllWorkoutPlans(all);
    return [initialStarter];
  }

  return userPlans;
}

export function getActiveWorkoutPlan(userEmail: string): WorkoutPlan | null {
  const plans = loadUserWorkoutPlans(userEmail);
  if (plans.length === 0) return null;
  const active = plans.find((p) => p.isActive);
  if (active) return active;
  const coachAssigned = plans.find((p) => p.createdBy === 'coach');
  return coachAssigned || plans[0] || null;
}

export async function saveWorkoutPlan(plan: WorkoutPlan): Promise<WorkoutPlan[]> {
  const all = getAllStoredWorkoutPlans();
  const planEmail = (plan.userEmail || plan.userId || '').toLowerCase().trim();
  const updatedPlan: WorkoutPlan = {
    ...plan,
    userEmail: planEmail,
    userId: planEmail,
    updatedAt: new Date().toISOString(),
  };

  const index = all.findIndex((p) => p.id === plan.id);
  if (index >= 0) {
    all[index] = updatedPlan;
  } else {
    all.unshift(updatedPlan);
  }

  if (updatedPlan.isActive) {
    for (const p of all) {
      if (
        p.id !== updatedPlan.id &&
        ((p.userEmail && p.userEmail.toLowerCase().trim() === planEmail) ||
         (p.userId && p.userId.toLowerCase().trim() === planEmail))
      ) {
        p.isActive = false;
      }
    }
  }

  saveAllWorkoutPlans(all);
  return loadUserWorkoutPlans(planEmail);
}

export async function deleteWorkoutPlan(planId: string, userEmail: string): Promise<WorkoutPlan[]> {
  const all = getAllStoredWorkoutPlans();
  const filtered = all.filter((p) => p.id !== planId);
  saveAllWorkoutPlans(filtered);
  return loadUserWorkoutPlans(userEmail);
}

export async function setActiveWorkoutPlan(planId: string, userEmail: string): Promise<WorkoutPlan[]> {
  const all = getAllStoredWorkoutPlans();
  const normalizedEmail = userEmail.toLowerCase().trim();

  for (const p of all) {
    if (
      (p.userEmail && p.userEmail.toLowerCase().trim() === normalizedEmail) ||
      (p.userId && p.userId.toLowerCase().trim() === normalizedEmail)
    ) {
      p.isActive = p.id === planId;
    }
  }

  saveAllWorkoutPlans(all);
  return loadUserWorkoutPlans(userEmail);
}

/**
 * Coach / Super Admin Chinmay assigns a Workout Plan to any member
 */
export async function assignCoachWorkoutPlan(
  targetEmail: string,
  planData: Partial<WorkoutPlan>,
  coachName = 'Chinmay Jain'
): Promise<WorkoutPlan> {
  const normalizedEmail = targetEmail.toLowerCase().trim();
  const all = getAllStoredWorkoutPlans();
  const now = new Date().toISOString();

  // Deactivate any previous plans for this user so coach's new plan is instantly active
  for (const p of all) {
    if (
      (p.userEmail && p.userEmail.toLowerCase().trim() === normalizedEmail) ||
      (p.userId && p.userId.toLowerCase().trim() === normalizedEmail)
    ) {
      p.isActive = false;
    }
  }

  const newPlan: WorkoutPlan = {
    id: planData.id || `coach_workout_${Date.now()}`,
    name: planData.name || `Coach Assigned Workout Plan for ${normalizedEmail.split('@')[0]}`,
    userId: normalizedEmail,
    userEmail: normalizedEmail,
    difficulty: planData.difficulty || 'Intermediate',
    goal: planData.goal || 'Hypertrophy & Muscle Gain',
    daysPerWeek: planData.daysPerWeek || (planData.days ? planData.days.length : 4),
    days: planData.days || [],
    createdBy: 'coach',
    coachName: coachName,
    coachNotes: planData.coachNotes || `Personalized training split crafted by Coach ${coachName}.`,
    isActive: true,
    createdAt: planData.createdAt || now,
    updatedAt: now,
  };

  const existingIdx = all.findIndex((p) => p.id === newPlan.id);
  if (existingIdx >= 0) {
    all[existingIdx] = newPlan;
  } else {
    all.unshift(newPlan);
  }

  saveAllWorkoutPlans(all);
  return newPlan;
}
