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

export const ATUL_COACH_WORKOUT_PLAN: WorkoutPlan = {
  id: 'workout_coach_atul_4day',
  name: '4 Days workout',
  userId: 'akg.atulgupta@gmail.com',
  userEmail: 'akg.atulgupta@gmail.com',
  difficulty: 'Intermediate',
  goal: 'Hypertrophy & Muscle Gain',
  daysPerWeek: 4,
  createdBy: 'coach',
  coachName: 'Chinmay Jain',
  coachNotes: 'Personalized 4-Day training split prescribed by Coach Chinmay Jain (Updated 29 September 2026). Daily Target: 12,000 steps. Always begin every workout with the Dynamic Stretching Warm up and finish with the Cool Down routine.',
  isActive: true,
  createdAt: '2026-09-29T10:00:00.000Z',
  updatedAt: '2026-09-29T10:00:00.000Z',
  days: [
    {
      id: 'day_1_upper',
      dayName: 'Day 1/ Day 4: Upper Body (Chest, Back, Shoulders & Triceps)',
      isRestDay: false,
      focus: 'Upper Body Hypertrophy & Strength (Chest, Back, Shoulders, Triceps)',
      exercises: [
        {
          id: 'ex_atul_1_warmup',
          name: 'Dynamic Stretching Warm up (very starting)',
          targetMuscle: 'Full Body / Mobility',
          sets: 1,
          reps: '5-8 min',
          restSeconds: 30,
          notes: 'Daily dynamic mobility before starting resistance exercises.',
          videoUrl: 'https://www.youtube.com/watch?v=uW3-Ue07H0M&list=PLo1MG2RRky06s-7kjLhNvbr75gYA4sOxR&index=3',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_1_1',
          name: 'Inclined Bench Press 30 degree',
          targetMuscle: 'Chest',
          sets: 3,
          reps: '12',
          restSeconds: 75,
          notes: '30-degree incline. Retract scapula, control the eccentric phase, press through upper pecs.',
          videoUrl: 'https://www.youtube.com/watch?v=161ogCF7fCA',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_1_2',
          name: 'Lat pulley pull down',
          targetMuscle: 'Back',
          sets: 3,
          reps: '12',
          restSeconds: 75,
          notes: 'Full stretch at top, pull bar down towards upper chest with elbows tucked.',
          videoUrl: 'https://www.youtube.com/watch?v=SALxEARiMkw&t=31s',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_1_3',
          name: 'Seated Dumbell Shouder Press',
          targetMuscle: 'Shoulder',
          sets: 3,
          reps: '12',
          restSeconds: 75,
          notes: 'Keep core tight, press dumbbells smoothly overhead without hyperextending lower back.',
          videoUrl: 'https://www.youtube.com/shorts/OLePvpxQEGk',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_1_4',
          name: 'Bent over Barbell rows',
          targetMuscle: 'Back',
          sets: 3,
          reps: '12',
          restSeconds: 75,
          notes: 'Hinge forward at 45 degrees, pull barbell to lower ribcage, squeeze lats and mid-back.',
          videoUrl: 'https://www.youtube.com/watch?v=jxJA05utuWI',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_1_5',
          name: 'Resistance band/dumbell lateral raises',
          targetMuscle: 'Shoulder',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: 'Lead with elbows to parallel, slow 2-second negative.',
          videoUrl: 'https://www.youtube.com/watch?v=5Du3PPWisJc',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_1_6',
          name: 'Dumbell overhead extension',
          targetMuscle: 'Triceps',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: 'Keep elbows pointing forward, emphasize the long head stretch behind head.',
          videoUrl: 'https://www.youtube.com/watch?v=fYqswDVbJDg',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_1_7',
          name: 'Dumbell Chest Flyes',
          targetMuscle: 'Chest',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: 'Slight elbow bend, wide controlled arc to stretch chest fibers.',
          videoUrl: 'https://www.youtube.com/shorts/Jz7oEmzhnfE',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_1_8',
          name: 'Triceps rope bar pushdown',
          targetMuscle: 'Triceps',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: 'Keep elbows fixed at sides, flare rope apart at bottom lockout.',
          videoUrl: 'https://www.youtube.com/shorts/vO0t9_j1b70',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_1_9',
          name: 'back hyper extensions',
          targetMuscle: 'Back',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: 'Hinge at hip, squeeze lower back and glutes at peak without over-arching neck.',
          videoUrl: 'https://www.youtube.com/watch?v=ph3pddpKzzw',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_1_cooldown',
          name: 'Cool down (at the end)',
          targetMuscle: 'End / Flexibility',
          sets: 1,
          reps: '5-8 min',
          restSeconds: 0,
          notes: 'Static stretching and deep breathing to promote recovery.',
          videoUrl: 'https://www.youtube.com/watch?v=NFS0U3X5Aco&list=PLo1MG2RRky06s-7kjLhNvbr75gYA4sOxR&index=3',
          createdBy: 'coach',
        },
      ],
    },
    {
      id: 'day_2_lower',
      dayName: 'Day 2/ Day 5: Lower Body & Abs (Whole Legs, Biceps, Glutes & Abs)',
      isRestDay: false,
      focus: 'Lower Body & Core Hypertrophy (Legs, Biceps, Glutes, Abs)',
      exercises: [
        {
          id: 'ex_atul_2_warmup',
          name: 'Dynamic Stretching Warm up (very starting)',
          targetMuscle: 'Full Body / Mobility',
          sets: 1,
          reps: '5-8 min',
          restSeconds: 30,
          notes: 'Daily dynamic mobility before leg and arm training.',
          videoUrl: 'https://www.youtube.com/watch?v=uW3-Ue07H0M&list=PLo1MG2RRky06s-7kjLhNvbr75gYA4sOxR&index=3',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_2_1',
          name: 'Dumbell Goblet squats',
          targetMuscle: 'Whole legs',
          sets: 3,
          reps: '12',
          restSeconds: 75,
          notes: 'Hold dumbbell tight against sternum, squat deep between hips with upright chest.',
          videoUrl: 'https://www.youtube.com/watch?v=gm4ln6PO4rc&t=15s',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_2_2',
          name: 'Biceps Curls (Barbell gym)',
          targetMuscle: 'Biceps',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: 'Strict curls without momentum, full supination and peak squeeze.',
          videoUrl: 'https://www.youtube.com/shorts/54x2WF1_Suc',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_2_3',
          name: 'Machine Leg extensions / Dumbell step ups',
          targetMuscle: 'Quads',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: '1-second peak squeeze at top of leg extension, controlled lowering.',
          videoUrl: 'https://www.youtube.com/watch?v=Eclgp3vnH6U',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_2_4',
          name: 'Dumbell seated Hammer Curls',
          targetMuscle: 'Biceps',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: 'Neutral palms-in grip to develop brachialis and forearm thickness.',
          videoUrl: 'https://www.youtube.com/watch?v=bdlqQAVdcEk',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_2_5',
          name: 'Seated machine hamstring curls',
          targetMuscle: 'Hamstring',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: 'Curl heels firmly under, pause for a second and control return.',
          videoUrl: 'https://www.youtube.com/shorts/aakNLjjm4Qo',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_2_6',
          name: 'Dumbell Hip Thrusts',
          targetMuscle: 'Glutes',
          sets: 3,
          reps: '12',
          restSeconds: 75,
          notes: 'Upper back on bench, drive hips upwards through heels, strong glute lock.',
          videoUrl: 'https://www.youtube.com/watch?v=T4P0SDrJZl4',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_2_7',
          name: 'Hanging Leg raises (Gym)',
          targetMuscle: 'Abs',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: 'Brace core, curl pelvis up toward ribs without excessive swing.',
          videoUrl: 'https://www.youtube.com/watch?v=Nw0LOKe3_l8',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_2_8',
          name: 'Weighted Dumbell Crunches',
          targetMuscle: 'Abs',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: 'Hold dumbbell securely on upper chest, exhale as you crunch up.',
          videoUrl: 'https://www.youtube.com/shorts/G9XfQJPBJVI',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_2_cooldown',
          name: 'Cool down (at the end)',
          targetMuscle: 'End / Flexibility',
          sets: 1,
          reps: '5-8 min',
          restSeconds: 0,
          notes: 'Lower body hamstring, quad and glute static stretching.',
          videoUrl: 'https://www.youtube.com/watch?v=NFS0U3X5Aco&list=PLo1MG2RRky06s-7kjLhNvbr75gYA4sOxR&index=3',
          createdBy: 'coach',
        },
      ],
    },
    {
      id: 'day_3_functional',
      dayName: 'Day 3: Functional Strength, Grip, Calves & Cardio',
      isRestDay: false,
      focus: 'Grip, Posterior Chain, Calves, Arms & Cardio Conditioning',
      exercises: [
        {
          id: 'ex_atul_3_warmup',
          name: 'Dynamic Stretching Warm up (very starting)',
          targetMuscle: 'Full Body / Mobility',
          sets: 1,
          reps: '5-8 min',
          restSeconds: 30,
          notes: 'Daily dynamic mobility routine before workout.',
          videoUrl: 'https://www.youtube.com/watch?v=uW3-Ue07H0M&list=PLo1MG2RRky06s-7kjLhNvbr75gYA4sOxR&index=3',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_3_1',
          name: 'Deadhangs with scapula raise',
          targetMuscle: 'Lat and grip',
          sets: 3,
          reps: '12',
          restSeconds: 60,
          notes: 'Hang from pull-up bar, depress and retract scapula with controlled reps.',
          videoUrl: 'https://www.youtube.com/watch?v=V0hzdT1CZnk',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_3_2',
          name: 'Farmers Walk',
          targetMuscle: 'Core and legs',
          sets: 3,
          reps: '15',
          restSeconds: 60,
          notes: 'Hold heavy dumbbells, maintain upright proud posture with tight core.',
          videoUrl: 'https://www.youtube.com/watch?v=ZX-9J6UePjQ',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_3_3',
          name: 'Smith Machine Calf Raises',
          targetMuscle: 'Calves',
          sets: 3,
          reps: '15',
          restSeconds: 60,
          notes: 'Elevate toes on plate/step, full heel drop stretch and press up.',
          videoUrl: 'https://www.youtube.com/watch?v=hh5516HCu4k',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_3_4',
          name: 'Push Ups',
          targetMuscle: 'Chest/ Tri',
          sets: 2,
          reps: '12',
          restSeconds: 60,
          notes: 'Standard push-ups with locked core, chest to floor.',
          videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4&t=17s',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_3_5',
          name: 'Dumbell Wrist curls',
          targetMuscle: 'Forearms',
          sets: 3,
          reps: '12',
          restSeconds: 45,
          notes: 'Forearms on bench or knees, curl dumbbells upward using wrists.',
          videoUrl: 'https://www.youtube.com/watch?v=3VLTzIrnb5g',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_3_6',
          name: 'High Cable Woodchopper Serratus',
          targetMuscle: 'Serratus',
          sets: 3,
          reps: '15',
          restSeconds: 60,
          notes: 'Diagonal high-to-low pull engaging serratus anterior and obliques.',
          videoUrl: 'https://www.youtube.com/watch?v=ogC0WRCjLzE',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_3_7',
          name: 'EZ bar reverse curls',
          targetMuscle: 'Forearms',
          sets: 3,
          reps: '12',
          restSeconds: 45,
          notes: 'Overhand grip on EZ-bar, builds forearm and arm stability.',
          videoUrl: 'https://www.youtube.com/shorts/5leIuZHoTZs',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_3_8',
          name: 'Dumbbell Wrist Twists Exercise',
          targetMuscle: 'Wrist',
          sets: 3,
          reps: '12',
          restSeconds: 45,
          notes: 'Controlled wrist rotation pronation/supination.',
          videoUrl: 'https://www.youtube.com/watch?v=uxOVXpwYKv0',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_3_9',
          name: 'Elliptical Cross Trainer Cardio',
          targetMuscle: 'Cardio',
          sets: 1,
          reps: '15 Min',
          restSeconds: 0,
          notes: '15-minute steady Zone 2 low-impact cardio session.',
          videoUrl: 'https://www.youtube.com/watch?v=MCVX9wRd_h0&t=3s',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_3_cooldown',
          name: 'Cool down (at the end)',
          targetMuscle: 'End / Flexibility',
          sets: 1,
          reps: '5-8 min',
          restSeconds: 0,
          notes: 'Full body cool-down stretching and recovery.',
          videoUrl: 'https://www.youtube.com/watch?v=NFS0U3X5Aco&list=PLo1MG2RRky06s-7kjLhNvbr75gYA4sOxR&index=3',
          createdBy: 'coach',
        },
      ],
    },
    {
      id: 'day_4_rest',
      dayName: 'Day 4: Rest with warm up and cool down',
      isRestDay: true,
      focus: 'Active Rest, Mobility, Joint Recovery & 12,000 Daily Steps',
      exercises: [
        {
          id: 'ex_atul_4_warmup',
          name: 'Dynamic Stretching Warm up (very starting)',
          targetMuscle: 'Full Body / Mobility',
          sets: 1,
          reps: '5-8 min',
          restSeconds: 0,
          notes: 'Start recovery day with light dynamic stretching.',
          videoUrl: 'https://www.youtube.com/watch?v=uW3-Ue07H0M&list=PLo1MG2RRky06s-7kjLhNvbr75gYA4sOxR&index=3',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_4_1',
          name: 'Rest with warm up and cool down',
          targetMuscle: 'Active Recovery',
          sets: 1,
          reps: 'Rest Day',
          restSeconds: 0,
          notes: 'Rest day to let muscle tissue rebuild. Hit 12,000 steps with brisk walking.',
          videoUrl: 'https://www.youtube.com/shorts/UqmbxvOgnX4',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_4_cooldown',
          name: 'Cool down (at the end)',
          targetMuscle: 'End / Flexibility',
          sets: 1,
          reps: '5-8 min',
          restSeconds: 0,
          notes: 'End-of-day static stretch to relieve any muscle tension.',
          videoUrl: 'https://www.youtube.com/watch?v=NFS0U3X5Aco&list=PLo1MG2RRky06s-7kjLhNvbr75gYA4sOxR&index=3',
          createdBy: 'coach',
        },
      ],
    },
  ],
};

const SEED_WORKOUT_PLANS: WorkoutPlan[] = [
  // Coach Chinmay assigned 4-Day workout to Atul Gupta (akg.atulgupta@gmail.com)
  ATUL_COACH_WORKOUT_PLAN,
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

  // Also sync asynchronously to server
  try {
    fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plans),
    }).catch((err) => {
      console.warn('Backend sync meal plans notice:', err);
    });
  } catch {
    // ignore
  }
}

/**
 * Fetches latest meal plans from Express server and merges into local cache
 */
export async function fetchMealPlansFromServer(userEmail?: string): Promise<MealPlan[]> {
  try {
    const url = userEmail
      ? `/api/meal-plans?userEmail=${encodeURIComponent(userEmail.toLowerCase().trim())}`
      : '/api/meal-plans';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.plans) && data.plans.length > 0) {
        const current = getAllStoredMealPlans();
        const merged = [...current];
        data.plans.forEach((p: MealPlan) => {
          const idx = merged.findIndex((m) => m.id === p.id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...p };
          } else {
            merged.unshift(p);
          }
        });
        try {
          localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch meal plans from server:', err);
  }
  return getAllStoredMealPlans();
}

export function getAllStoredWorkoutPlans(): WorkoutPlan[] {
  try {
    const raw = localStorage.getItem(WORKOUT_PLANS_KEY);
    if (!raw) {
      localStorage.setItem(WORKOUT_PLANS_KEY, JSON.stringify(SEED_WORKOUT_PLANS));
      return SEED_WORKOUT_PLANS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      let changed = false;
      for (const seed of SEED_WORKOUT_PLANS) {
        if (!parsed.some((p) => p.id === seed.id)) {
          parsed.unshift(seed);
          changed = true;
        }
      }
      if (changed) {
        try {
          localStorage.setItem(WORKOUT_PLANS_KEY, JSON.stringify(parsed));
        } catch {}
      }
      return parsed;
    }
    return SEED_WORKOUT_PLANS;
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

  // Also sync asynchronously to server
  try {
    fetch('/api/workout-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plans),
    }).catch((err) => {
      console.warn('Backend sync workout plans notice:', err);
    });
  } catch {
    // ignore
  }
}

/**
 * Fetches latest workout plans from Express server and merges into local cache
 */
export async function fetchWorkoutPlansFromServer(userEmail?: string): Promise<WorkoutPlan[]> {
  try {
    const url = userEmail
      ? `/api/workout-plans?userEmail=${encodeURIComponent(userEmail.toLowerCase().trim())}`
      : '/api/workout-plans';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.plans) && data.plans.length > 0) {
        const current = getAllStoredWorkoutPlans();
        const merged = [...current];
        data.plans.forEach((p: WorkoutPlan) => {
          const idx = merged.findIndex((m) => m.id === p.id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...p };
          } else {
            merged.unshift(p);
          }
        });
        try {
          localStorage.setItem(WORKOUT_PLANS_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch workout plans from server:', err);
  }
  return getAllStoredWorkoutPlans();
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
