import { MealPlan, WorkoutPlan } from '../types';
import { createDefaultVegDietPlan, createDefaultWorkoutPlan } from './plannerLibrary';
import { notifyPlanAssigned } from './communicationService';

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

export function getAllStoredMealPlans(): MealPlan[] {
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

export function saveAllMealPlans(plans: MealPlan[]) {
  try {
    localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(plans));
  } catch (err) {
    console.error('Error saving meal plans to storage:', err);
  }
}

export function getAllStoredWorkoutPlans(): WorkoutPlan[] {
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

export function saveAllWorkoutPlans(plans: WorkoutPlan[]) {
  try {
    localStorage.setItem(WORKOUT_PLANS_KEY, JSON.stringify(plans));
  } catch (err) {
    console.error('Error saving workout plans to storage:', err);
  }
}

// =========================================================================
// EVENT SYNCHRONIZATION FOR CROSS-SCREEN REALTIME UPDATES
// =========================================================================

export function notifyPlannerChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fk_planner_updated'));
  }
}

export function subscribeToPlannerUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener('fk_planner_updated', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('fk_planner_updated', handler);
    window.removeEventListener('storage', handler);
  };
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
    initialStarter.createdAt = new Date().toISOString();
    initialStarter.updatedAt = new Date().toISOString();
    all.push(initialStarter);
    saveAllMealPlans(all);
    return [initialStarter];
  }

  // Sort in reverse chronological order (newest updated/created first)
  userPlans.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

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
  const existing = all.find((p) => p.id === plan.id);
  const planEmail = (plan.userEmail || plan.userId || existing?.userEmail || existing?.userId || '').toLowerCase().trim();
  const updatedPlan: MealPlan = {
    ...plan,
    name: plan.name ? plan.name.trim() : (existing?.name || 'Personal Meal Plan'),
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
  notifyPlannerChange();
  return loadUserMealPlans(planEmail);
}

export async function deleteMealPlan(planId: string, userEmail: string): Promise<MealPlan[]> {
  const all = getAllStoredMealPlans();
  const filtered = all.filter((p) => p.id !== planId);
  saveAllMealPlans(filtered);
  notifyPlannerChange();
  return loadUserMealPlans(userEmail);
}

/**
 * Flexible meal plan rename supporting both (planId, newName, userEmail?)
 * and inverted (userEmail, planId, newName) callers
 */
export async function renameMealPlan(
  arg1: string,
  arg2: string,
  arg3?: string
): Promise<MealPlan[]> {
  const all = getAllStoredMealPlans();

  let targetPlanId = '';
  let targetNewName = '';
  let targetUserEmail = '';

  const matchesArg1 = all.find((p) => p.id === arg1);
  const matchesArg2 = all.find((p) => p.id === arg2);

  if (matchesArg1) {
    // (planId, newName, userEmail?)
    targetPlanId = arg1;
    targetNewName = arg2 || '';
    targetUserEmail = arg3 || matchesArg1.userEmail || matchesArg1.userId || '';
  } else if (matchesArg2) {
    // (userEmail, planId, newName)
    targetUserEmail = arg1;
    targetPlanId = arg2;
    targetNewName = arg3 || '';
  } else {
    if (arg1 && arg1.includes('@')) {
      targetUserEmail = arg1;
      targetPlanId = arg2;
      targetNewName = arg3 || '';
    } else {
      targetPlanId = arg1;
      targetNewName = arg2;
      targetUserEmail = arg3 || '';
    }
  }

  const target = all.find((p) => p.id === targetPlanId);
  if (target) {
    target.name = targetNewName.trim() || target.name;
    target.updatedAt = new Date().toISOString();
    if (!targetUserEmail) {
      targetUserEmail = target.userEmail || target.userId || '';
    }
    saveAllMealPlans(all);
    notifyPlannerChange();
  } else {
    console.warn(`[renameMealPlan] Could not find meal plan with ID: "${targetPlanId}"`);
  }

  return loadUserMealPlans(targetUserEmail);
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
  notifyPlannerChange();
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
  notifyPlannerChange();

  // Asynchronously dispatch email notification to the member
  notifyPlanAssigned({
    type: 'diet',
    targetEmail: normalizedEmail,
    plan: newPlan,
    coachName,
  }).catch((err) => {
    console.warn('[assignCoachMealPlan] Failed to dispatch email notification:', err);
  });

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
    initialStarter.createdAt = new Date().toISOString();
    initialStarter.updatedAt = new Date().toISOString();
    all.push(initialStarter);
    saveAllWorkoutPlans(all);
    return [initialStarter];
  }

  // Sort in reverse chronological order (newest updated/created first)
  userPlans.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

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
  const existing = all.find((p) => p.id === plan.id);
  const planEmail = (plan.userEmail || plan.userId || existing?.userEmail || existing?.userId || '').toLowerCase().trim();
  const updatedPlan: WorkoutPlan = {
    ...plan,
    name: plan.name ? plan.name.trim() : (existing?.name || 'Personal Workout Routine'),
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
  notifyPlannerChange();
  return loadUserWorkoutPlans(planEmail);
}

export async function deleteWorkoutPlan(planId: string, userEmail: string): Promise<WorkoutPlan[]> {
  const all = getAllStoredWorkoutPlans();
  const filtered = all.filter((p) => p.id !== planId);
  saveAllWorkoutPlans(filtered);
  notifyPlannerChange();
  return loadUserWorkoutPlans(userEmail);
}

/**
 * Flexible workout plan rename supporting both (planId, newName, userEmail?)
 * and inverted (userEmail, planId, newName) callers
 */
export async function renameWorkoutPlan(
  arg1: string,
  arg2: string,
  arg3?: string
): Promise<WorkoutPlan[]> {
  const all = getAllStoredWorkoutPlans();

  let targetPlanId = '';
  let targetNewName = '';
  let targetUserEmail = '';

  const matchesArg1 = all.find((p) => p.id === arg1);
  const matchesArg2 = all.find((p) => p.id === arg2);

  if (matchesArg1) {
    // (planId, newName, userEmail?)
    targetPlanId = arg1;
    targetNewName = arg2 || '';
    targetUserEmail = arg3 || matchesArg1.userEmail || matchesArg1.userId || '';
  } else if (matchesArg2) {
    // (userEmail, planId, newName)
    targetUserEmail = arg1;
    targetPlanId = arg2;
    targetNewName = arg3 || '';
  } else {
    if (arg1 && arg1.includes('@')) {
      targetUserEmail = arg1;
      targetPlanId = arg2;
      targetNewName = arg3 || '';
    } else {
      targetPlanId = arg1;
      targetNewName = arg2;
      targetUserEmail = arg3 || '';
    }
  }

  const target = all.find((p) => p.id === targetPlanId);
  if (target) {
    target.name = targetNewName.trim() || target.name;
    target.updatedAt = new Date().toISOString();
    if (!targetUserEmail) {
      targetUserEmail = target.userEmail || target.userId || '';
    }
    saveAllWorkoutPlans(all);
    notifyPlannerChange();
  } else {
    console.warn(`[renameWorkoutPlan] Could not find workout routine with ID: "${targetPlanId}"`);
  }

  return loadUserWorkoutPlans(targetUserEmail);
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
  notifyPlannerChange();
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
  notifyPlannerChange();

  // Asynchronously dispatch email notification to the member
  notifyPlanAssigned({
    type: 'workout',
    targetEmail: normalizedEmail,
    plan: newPlan,
    coachName,
  }).catch((err) => {
    console.warn('[assignCoachWorkoutPlan] Failed to dispatch email notification:', err);
  });

  return newPlan;
}
