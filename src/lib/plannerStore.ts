import { MealPlan, WorkoutPlan } from '../types';
import { createDefaultVegDietPlan, createDefaultWorkoutPlan } from './plannerLibrary';
import { notifyPlanAssigned } from './communicationService';
import {
  syncMealPlansToSupabase,
  loadMealPlansFromSupabase,
  syncWorkoutPlansToSupabase,
  loadWorkoutPlansFromSupabase,
  getSupabaseAuthHeaders,
} from './supabase';
import { safeLocalStorageSet } from './storageGuard';

const MEAL_PLANS_KEY = 'fk_meal_plans_v1';
const WORKOUT_PLANS_KEY = 'fk_workout_plans_v1';

const ATUL_COACH_WORKOUT_PLAN: WorkoutPlan = {
  id: 'workout_coach_atul_4day',
  name: '4 Days workout',
  userId: 'akg.atulgupta@gmail.com',
  userEmail: 'akg.atulgupta@gmail.com',
  difficulty: 'Intermediate',
  goal: 'Hypertrophy & Muscle Gain',
  daysPerWeek: 7,
  createdBy: 'coach',
  coachName: 'Chinmay Jain',
  coachNotes:
    'Personalized training split prescribed by Coach Chinmay Jain (Updated 29 September 2026). Each day and its exercises are structured independently for daily logging and navigation. Daily Target: 12,000 steps. Always begin every workout with the Dynamic Stretching Warm up and finish with the Cool Down routine.',
  isActive: true,
  createdAt: '2026-09-29T10:00:00.000Z',
  updatedAt: '2026-09-29T10:00:00.000Z',
  days: [
    {
      id: 'day_1_upper',
      dayName: 'Day 1: Upper Body (Chest, Back, Shoulders & Triceps)',
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
      dayName: 'Day 2: Lower Body & Abs (Whole Legs, Biceps, Glutes & Abs)',
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
      id: 'day_4_upper',
      dayName: 'Day 4: Upper Body (Chest, Back, Shoulders & Triceps)',
      isRestDay: false,
      focus: 'Upper Body Hypertrophy & Volume (Chest, Back, Shoulders, Triceps)',
      exercises: [
        {
          id: 'ex_atul_4_warmup',
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
          id: 'ex_atul_4_1',
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
          id: 'ex_atul_4_2',
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
          id: 'ex_atul_4_3',
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
          id: 'ex_atul_4_4',
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
          id: 'ex_atul_4_5',
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
          id: 'ex_atul_4_6',
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
          id: 'ex_atul_4_7',
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
          id: 'ex_atul_4_8',
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
          id: 'ex_atul_4_9',
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
          id: 'ex_atul_4_cooldown',
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
      id: 'day_5_lower',
      dayName: 'Day 5: Lower Body & Abs (Whole Legs, Biceps, Glutes & Abs)',
      isRestDay: false,
      focus: 'Lower Body & Core Hypertrophy & Conditioning (Legs, Biceps, Glutes, Abs)',
      exercises: [
        {
          id: 'ex_atul_5_warmup',
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
          id: 'ex_atul_5_1',
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
          id: 'ex_atul_5_2',
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
          id: 'ex_atul_5_3',
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
          id: 'ex_atul_5_4',
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
          id: 'ex_atul_5_5',
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
          id: 'ex_atul_5_6',
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
          id: 'ex_atul_5_7',
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
          id: 'ex_atul_5_8',
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
          id: 'ex_atul_5_cooldown',
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
      id: 'day_6_rest',
      dayName: 'Day 6: Rest & Active Recovery',
      isRestDay: true,
      focus: 'Rest, Joint Mobility, Muscle Tissue Repair & 12,000 Steps',
      exercises: [
        {
          id: 'ex_atul_6_warmup',
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
          id: 'ex_atul_6_1',
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
          id: 'ex_atul_6_cooldown',
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
    {
      id: 'day_7_rest',
      dayName: 'Day 7: Active Rest & 12,000 Steps',
      isRestDay: true,
      focus: 'Active Recovery Walk, Full Body Stretching & Weekly Planning',
      exercises: [
        {
          id: 'ex_atul_7_warmup',
          name: 'Dynamic Stretching Warm up (very starting)',
          targetMuscle: 'Full Body / Mobility',
          sets: 1,
          reps: '5-8 min',
          restSeconds: 0,
          notes: 'Morning light dynamic stretching to awaken joints.',
          videoUrl: 'https://www.youtube.com/watch?v=uW3-Ue07H0M&list=PLo1MG2RRky06s-7kjLhNvbr75gYA4sOxR&index=3',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_7_1',
          name: 'Active Walking & Mobility (Target: 12,000 Steps)',
          targetMuscle: 'Active Recovery',
          sets: 1,
          reps: '12,000 steps',
          restSeconds: 0,
          notes: 'Complete your weekly step goal with steady brisk outdoor walks.',
          videoUrl: 'https://www.youtube.com/shorts/UqmbxvOgnX4',
          createdBy: 'coach',
        },
        {
          id: 'ex_atul_7_cooldown',
          name: 'Cool down (at the end)',
          targetMuscle: 'End / Flexibility',
          sets: 1,
          reps: '5-8 min',
          restSeconds: 0,
          notes: 'Evening calm down stretch and reset for the upcoming week.',
          videoUrl: 'https://www.youtube.com/watch?v=NFS0U3X5Aco&list=PLo1MG2RRky06s-7kjLhNvbr75gYA4sOxR&index=3',
          createdBy: 'coach',
        },
      ],
    },
  ],
};

const MAITREYEE_EVERYDAY_WARMUPS = [
  {
    id: 'ex_m_w_1',
    name: 'Diaphragmatic breathing × 10 breaths',
    targetMuscle: 'Core / Breathing',
    sets: 1,
    reps: '10 breaths',
    restSeconds: 30,
    notes: 'Deep belly breathing, relax pelvic floor and shoulders.',
    videoUrl: 'https://www.youtube.com/watch?v=w04SYVEuVq8',
    createdBy: 'coach' as const,
  },
  {
    id: 'ex_m_w_2',
    name: 'Pelvic tilts × 10',
    targetMuscle: 'Pelvic / Core',
    sets: 1,
    reps: '10',
    restSeconds: 30,
    notes: 'Lie on back with knees bent, gently flatten lower back against floor.',
    videoUrl: 'https://www.youtube.com/watch?v=lTX15Qk1xTM',
    createdBy: 'coach' as const,
  },
  {
    id: 'ex_m_w_3',
    name: 'Cat Cow × 10',
    targetMuscle: 'Spine / Mobility',
    sets: 1,
    reps: '10',
    restSeconds: 30,
    notes: 'Slow rhythmic spinal flexion and extension.',
    videoUrl: 'https://www.youtube.com/watch?v=vuyUwtHl694',
    createdBy: 'coach' as const,
  },
  {
    id: 'ex_m_w_4',
    name: 'Shoulder rolls backwards',
    targetMuscle: 'Shoulders / Upper Back',
    sets: 1,
    reps: '10',
    restSeconds: 30,
    notes: 'Roll shoulders up, back, and down with full range of motion.',
    videoUrl: 'https://www.youtube.com/watch?v=X7NtgY9kCCM',
    createdBy: 'coach' as const,
  },
  {
    id: 'ex_m_w_5',
    name: 'Hip circles',
    targetMuscle: 'Hips / Mobility',
    sets: 1,
    reps: '10',
    restSeconds: 30,
    notes: 'Wide controlled hip circles in both directions.',
    videoUrl: 'https://www.youtube.com/watch?v=OvJMG4_nMFc',
    createdBy: 'coach' as const,
  },
];

const MAITREYEE_COOLDOWN = {
  id: 'ex_m_cooldown',
  name: 'Cool Down',
  targetMuscle: 'Full Body / Flexibility',
  sets: 1,
  reps: '5 min',
  restSeconds: 0,
  notes: 'Full body static stretches and gentle breathing to aid post-workout recovery.',
  videoUrl: 'https://www.youtube.com/watch?v=-JODkvrLzhI',
  createdBy: 'coach' as const,
};

export const MAITREYEE_COACH_WORKOUT_PLAN: WorkoutPlan = {
  id: 'workout_coach_maitreyee_3day',
  name: 'Akku 3-Day Workout',
  userId: 'maikulkarni10@gmail.com',
  userEmail: 'maikulkarni10@gmail.com',
  difficulty: 'Beginner',
  goal: 'General Fitness & Longevity',
  daysPerWeek: 3,
  createdBy: 'coach',
  coachName: 'Chinmay Jain',
  coachNotes:
    'Personalized 3-Day Progressive Workout prescribed by Coach Chinmay Jain (Prescribed 21 July 2026). Always start every training session with the 5-exercise Warm-up sequence (Diaphragmatic breathing, Pelvic tilts, Cat Cow, Shoulder rolls, Hip circles) and complete with the Cool Down routine.',
  isActive: true,
  createdAt: '2026-07-21T10:00:00.000Z',
  updatedAt: new Date().toISOString(),
  days: [
    {
      id: 'm_day_1',
      dayName: 'Day 1: Full Body Mobility & Foundation',
      isRestDay: false,
      focus: 'Warm-up, Glute Bridges, Chair Squats, Pushups, Core, Biceps & Calves',
      exercises: [
        ...MAITREYEE_EVERYDAY_WARMUPS,
        {
          id: 'ex_m_1_2',
          name: 'Glute Bridge',
          targetMuscle: 'Legs / Glutes',
          sets: 2,
          reps: '12',
          restSeconds: 60,
          notes: 'Drive through heels, squeeze glutes at top for 1-2 seconds.',
          videoUrl: 'https://www.youtube.com/watch?v=OUgsJ8-Vi0E',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_1_3',
          name: 'Chair Squats',
          targetMuscle: 'Legs / Quadriceps',
          sets: 2,
          reps: '10',
          restSeconds: 60,
          notes: 'Sit back onto chair with chest upright, press through heels to stand.',
          videoUrl: 'https://www.youtube.com/watch?v=OUgsJ8-Vi0E',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_1_4',
          name: 'Wall Pushups / Knee Pushups',
          targetMuscle: 'Chest',
          sets: 2,
          reps: '10',
          restSeconds: 60,
          notes: 'Hands shoulder-width apart, keep body in straight line.',
          videoUrl: 'https://www.youtube.com/watch?v=jWxvty2KROs',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_1_5',
          name: 'Bird Dog',
          targetMuscle: 'Abdominal / Core',
          sets: 2,
          reps: '8 each side',
          restSeconds: 60,
          notes: 'Extend opposite arm and leg while bracing core firmly.',
          videoUrl: 'https://www.youtube.com/watch?v=QVRtIHp9h-M',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_1_6',
          name: 'Standing Dumbbell Curl',
          targetMuscle: 'Arms / Biceps',
          sets: 2,
          reps: '12',
          restSeconds: 60,
          notes: 'Keep elbows pinned to sides, curl with controlled tempo.',
          videoUrl: 'https://www.youtube.com/watch?v=CxM4wKfus_Y',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_1_7',
          name: 'Standing Heel Raises',
          targetMuscle: 'Legs / Calves',
          sets: 2,
          reps: '15',
          restSeconds: 45,
          notes: 'Elevate onto balls of feet, hold peak contraction for 1 sec.',
          videoUrl: 'https://www.youtube.com/watch?v=2FNfXdg2fGs',
          createdBy: 'coach',
        },
        MAITREYEE_COOLDOWN,
      ],
    },
    {
      id: 'm_day_2',
      dayName: 'Day 2: Strength, Step-ups & Upper Pull',
      isRestDay: false,
      focus: 'Warm-up, Sit-to-Stand, Step-ups, Shoulder Press, DB Rows, TVA Marching & Clamshells',
      exercises: [
        ...MAITREYEE_EVERYDAY_WARMUPS,
        {
          id: 'ex_m_2_2',
          name: 'Sit-to-Stand',
          targetMuscle: 'Legs / Quadriceps & Glutes',
          sets: 2,
          reps: '10',
          restSeconds: 60,
          notes: 'Controlled descent to chair, stand up smoothly without swinging arms.',
          videoUrl: 'https://www.youtube.com/watch?v=0FkRr45YeEQ',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_2_3',
          name: 'Supported Step-ups',
          targetMuscle: 'Legs',
          sets: 2,
          reps: '10 each leg',
          restSeconds: 60,
          notes: 'Step up placing whole foot on step, drive through front leg.',
          videoUrl: 'https://www.youtube.com/watch?v=-7aA9H2dfZ0',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_2_4',
          name: 'Standing Shoulder Press (light dumbbells)',
          targetMuscle: 'Shoulders',
          sets: 2,
          reps: '10',
          restSeconds: 60,
          notes: 'Press overhead keeping core tight and ribs down.',
          videoUrl: 'https://www.youtube.com/watch?v=qGtDCtYeRQM',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_2_5',
          name: 'Bent-over Dumbbell Row',
          targetMuscle: 'Back',
          sets: 2,
          reps: '12',
          restSeconds: 60,
          notes: 'Hinge at hips, pull dumbbells towards hips, squeeze shoulder blades.',
          videoUrl: 'https://www.youtube.com/watch?v=J7_dhrKYTl0',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_2_6',
          name: 'TVA Marching',
          targetMuscle: 'Abdominal / Deep Core',
          sets: 2,
          reps: '10 each leg',
          restSeconds: 45,
          notes: 'Engage transversus abdominis, gently march knees alternately.',
          videoUrl: 'https://www.youtube.com/watch?v=BvjIO1wQsBA',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_2_7',
          name: 'Clamshells',
          targetMuscle: 'Legs / Glute Medius',
          sets: 2,
          reps: '12 each side',
          restSeconds: 45,
          notes: 'Keep feet together, rotate knee upward without rolling pelvis back.',
          videoUrl: 'https://www.youtube.com/watch?v=gFyIjunfbbg',
          createdBy: 'coach',
        },
        MAITREYEE_COOLDOWN,
      ],
    },
    {
      id: 'm_day_3',
      dayName: 'Day 3: Posterior Chain, Goblet Squat & Farmer Carry',
      isRestDay: false,
      focus: 'Warm-up, Goblet Squats, Bridge March, Incline Pushups, Supported RDL, Side Leg Raises & Farmer Carry',
      exercises: [
        ...MAITREYEE_EVERYDAY_WARMUPS,
        {
          id: 'ex_m_3_2',
          name: 'Goblet Squat (very light)',
          targetMuscle: 'Legs',
          sets: 2,
          reps: '10',
          restSeconds: 60,
          notes: 'Hold light dumbbell close to chest, squat deep between hips with upright chest.',
          videoUrl: 'https://www.youtube.com/watch?v=dxtgqrJC6gI',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_3_3',
          name: 'Glute Bridge March',
          targetMuscle: 'Legs / Glutes',
          sets: 2,
          reps: '10',
          restSeconds: 60,
          notes: 'Hold bridge position, march alternate knees without letting hips drop.',
          videoUrl: 'https://www.youtube.com/watch?v=KsYwYl13IDc',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_3_4',
          name: 'Incline Wall Pushups',
          targetMuscle: 'Chest',
          sets: 2,
          reps: '10',
          restSeconds: 60,
          notes: 'Hands on wall or elevated surface, lower chest towards wall.',
          videoUrl: 'https://www.youtube.com/watch?v=PwQm5urhZsQ',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_3_5',
          name: 'Supported Romanian Deadlift',
          targetMuscle: 'Back / Hamstrings',
          sets: 2,
          reps: '12',
          restSeconds: 60,
          notes: 'Hinge at hips with slight knee bend, push hips back, feel hamstring stretch.',
          videoUrl: 'https://www.youtube.com/watch?v=zvuQC7WmzzI',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_3_6',
          name: 'Side Leg Raise',
          targetMuscle: 'Legs / Hip Abductors',
          sets: 2,
          reps: '12 each side',
          restSeconds: 45,
          notes: 'Lie on side, raise leg straight up with toes pointing forward.',
          videoUrl: 'https://www.youtube.com/watch?v=Etwx61g_gAA',
          createdBy: 'coach',
        },
        {
          id: 'ex_m_3_7',
          name: 'Farmer Carry',
          targetMuscle: 'Whole Body / Core & Grip',
          sets: 3,
          reps: '30 sec',
          restSeconds: 60,
          notes: 'Hold dumbbells at sides with tall posture, walk with controlled steps.',
          videoUrl: 'https://www.youtube.com/watch?v=p5MNNosenJc',
          createdBy: 'coach',
        },
        MAITREYEE_COOLDOWN,
      ],
    },
  ],
};

const ATUL_COACH_MEAL_PLAN: MealPlan = {
  id: 'diet_coach_atul_veg',
  name: 'High-Protein Vegetarian Fat Loss & Lean Muscle',
  userId: 'akg.atulgupta@gmail.com',
  userEmail: 'akg.atulgupta@gmail.com',
  targetCalories: 1980,
  targetProtein: 140,
  targetCarbs: 195,
  targetFats: 55,
  dietType: 'Vegetarian',
  createdBy: 'coach',
  coachName: 'Chinmay Jain',
  coachNotes:
    'Personalized vegetarian fat-loss & muscle retention nutrition plan prescribed by Coach Chinmay Jain. Designed for ~1,980 kcal/day with roasted chana & protein snack in the evening to curb post-work cravings. No bitter gourd. Daily beverages: Black Coffee & Green Tea. Maintain 3.5L water and 8,600–12,000 steps/day.',
  isActive: true,
  createdAt: '2026-09-22T09:00:00.000Z',
  updatedAt: '2026-09-29T10:00:00.000Z',
  meals: [
    {
      id: 'atul_meal_1',
      name: 'Meal 1: Morning Pre-Work / Post-Walk Fuel & Black Coffee',
      time: '08:30 AM',
      items: [
        {
          id: 'atul_m1_1',
          name: 'Rolled Oats (Old-fashioned) with Skim Milk / Water',
          servingSize: '50g dry',
          calories: 195,
          protein: 6.5,
          carbs: 33.0,
          fats: 3.5,
          category: 'carbs',
          notes: 'Slow-digesting complex carbs for morning focus.',
        },
        {
          id: 'atul_m1_2',
          name: 'Whey Protein Isolate (1 Scoop)',
          servingSize: '1 scoop (30g)',
          calories: 118,
          protein: 26.0,
          carbs: 1.5,
          fats: 0.8,
          category: 'protein',
          notes: 'Mix into warm oats or take as shake alongside black coffee.',
        },
        {
          id: 'atul_m1_3',
          name: 'Raw California Almonds & Walnuts',
          servingSize: '12 almonds (15g)',
          calories: 90,
          protein: 3.2,
          carbs: 3.0,
          fats: 7.8,
          category: 'fats',
          notes: 'Soaked overnight.',
        },
      ],
    },
    {
      id: 'atul_meal_2',
      name: 'Meal 2: Mid-Morning Office Refuel & Green Tea',
      time: '11:30 AM',
      items: [
        {
          id: 'atul_m2_1',
          name: 'Unsweetened Greek Yogurt / Hung Curd',
          servingSize: '150g bowl',
          calories: 110,
          protein: 15.0,
          carbs: 5.5,
          fats: 2.5,
          category: 'dairy',
          notes: 'Top with roasted jeera & chia seeds.',
        },
        {
          id: 'atul_m2_2',
          name: 'Crisp Apple or Guava + Green Tea',
          servingSize: '1 medium (150g)',
          calories: 78,
          protein: 0.5,
          carbs: 20.0,
          fats: 0.2,
          category: 'veggies',
          notes: 'High fiber micronutrient boost.',
        },
      ],
    },
    {
      id: 'atul_meal_3',
      name: 'Meal 3: High-Protein Vegetarian Corporate Lunch',
      time: '01:45 PM',
      items: [
        {
          id: 'atul_m3_1',
          name: 'Low-Fat Paneer Bhurji / Grilled Paneer Tikka',
          servingSize: '120g',
          calories: 216,
          protein: 21.6,
          carbs: 4.8,
          fats: 12.0,
          category: 'protein',
          notes: 'Prepared in minimal cow ghee/olive oil (no bitter gourd).',
        },
        {
          id: 'atul_m3_2',
          name: 'Cooked Yellow Moong / Toor Dal Tadka',
          servingSize: '1 medium bowl (180g)',
          calories: 145,
          protein: 9.0,
          carbs: 22.0,
          fats: 1.8,
          category: 'carbs',
          notes: 'Take a 15-min walk after lunch to hit step target.',
        },
        {
          id: 'atul_m3_3',
          name: 'Whole Wheat Roti (2 medium) or Steamed Rice',
          servingSize: '2 rotis (60g flour)',
          calories: 180,
          protein: 5.5,
          carbs: 36.0,
          fats: 1.0,
          category: 'carbs',
        },
        {
          id: 'atul_m3_4',
          name: 'Fresh Cucumber, Tomato & Carrot Salad',
          servingSize: '1 large bowl (200g)',
          calories: 35,
          protein: 1.5,
          carbs: 6.5,
          fats: 0.4,
          category: 'veggies',
        },
      ],
    },
    {
      id: 'atul_meal_4',
      name: 'Meal 4: Evening Craving-Buster & Pre-Workout Fuel',
      time: '05:30 PM',
      items: [
        {
          id: 'atul_m4_1',
          name: 'Roasted Black Chana & Makhana (Foxnuts) Chaat',
          servingSize: '45g dry roasted',
          calories: 165,
          protein: 9.5,
          carbs: 26.0,
          fats: 2.5,
          category: 'carbs',
          notes: 'Specifically added to eliminate evening cravings after desk work.',
        },
        {
          id: 'atul_m4_2',
          name: 'Sprouted Green Moong Salad with Lemon',
          servingSize: '100g',
          calories: 105,
          protein: 8.0,
          carbs: 18.0,
          fats: 0.6,
          category: 'protein',
          notes: 'Pair with 1 cup black coffee 30 mins before gym session.',
        },
      ],
    },
    {
      id: 'atul_meal_5',
      name: 'Meal 5: Post-Workout Recovery & Light Dinner',
      time: '08:30 PM',
      items: [
        {
          id: 'atul_m5_1',
          name: 'Whey Protein Isolate (Post-Gym Shake)',
          servingSize: '1 scoop (30g) in water',
          calories: 118,
          protein: 26.0,
          carbs: 1.5,
          fats: 0.8,
          category: 'protein',
          notes: 'Immediate muscle protein synthesis post-workout.',
        },
        {
          id: 'atul_m5_2',
          name: 'Organic Tofu / Soya Chunks & Bell Pepper Stir-Fry',
          servingSize: '150g tofu / 40g soya',
          calories: 165,
          protein: 18.5,
          carbs: 6.5,
          fats: 7.0,
          category: 'protein',
          notes: 'Sautéed with broccoli, capsicum, spinach & garlic.',
        },
        {
          id: 'atul_m5_3',
          name: 'Multigrain / Whole Wheat Roti (1 medium) + Sautéed Greens',
          servingSize: '1 roti + 150g palak/beans',
          calories: 145,
          protein: 5.5,
          carbs: 22.0,
          fats: 2.5,
          category: 'carbs',
          notes: 'Keep dinner light and finish 2 hours before sleep.',
        },
      ],
    },
  ],
};

// Initial seeded plans (no @example.com dummy plans)
const SEED_MEAL_PLANS: MealPlan[] = [ATUL_COACH_MEAL_PLAN];
const SEED_WORKOUT_PLANS: WorkoutPlan[] = [ATUL_COACH_WORKOUT_PLAN, MAITREYEE_COACH_WORKOUT_PLAN];

// =========================================================================
// HELPER STORAGE FUNCTIONS
// =========================================================================

export function getAllStoredMealPlans(): MealPlan[] {
  try {
    const raw = localStorage.getItem(MEAL_PLANS_KEY);
    if (!raw) {
      return SEED_MEAL_PLANS;
    }
    const parsedRaw = JSON.parse(raw);
    if (Array.isArray(parsedRaw)) {
      let changed = false;
      const parsed = parsedRaw.filter((p) => {
        if (p?.userEmail?.toLowerCase().trim().endsWith('@example.com')) {
          changed = true;
          return false;
        }
        return true;
      });
      for (const seed of SEED_MEAL_PLANS) {
        if (!parsed.some((p) => p?.id === seed.id)) {
          parsed.unshift(seed);
          changed = true;
        }
      }
      if (changed) {
        safeLocalStorageSet(MEAL_PLANS_KEY, parsed);
      }
      return parsed;
    }
    return SEED_MEAL_PLANS;
  } catch (err) {
    console.error('Error reading meal plans from storage:', err);
    return SEED_MEAL_PLANS;
  }
}

export function saveAllMealPlans(plans: MealPlan[], targetUserEmail?: string) {
  safeLocalStorageSet(MEAL_PLANS_KEY, plans);

  // Sync user's meal plans to Supabase (both meal_plans table and profiles.profile_data.meal_plans)
  if (targetUserEmail) {
    const norm = targetUserEmail.toLowerCase().trim();
    const userPlans = plans.filter(
      (p) =>
        (p.userEmail && p.userEmail.toLowerCase().trim() === norm) ||
        (p.userId && p.userId.toLowerCase().trim() === norm)
    );
    syncMealPlansToSupabase(norm, userPlans).catch((err) => {
      console.warn('Supabase sync meal plans notice:', err);
    });
  }

  // Also sync asynchronously to server and merge confirmed server records by ID into local cache
  try {
    getSupabaseAuthHeaders().then((authHeaders) => {
      fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(plans),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.plans && Array.isArray(data.plans)) {
            const current = getAllStoredMealPlans();
            const byId = new Map<string, MealPlan>();
            for (const p of current) {
              if (p?.id) byId.set(p.id, p);
            }
            for (const p of data.plans as MealPlan[]) {
              if (p?.id) byId.set(p.id, p);
            }
            safeLocalStorageSet(MEAL_PLANS_KEY, Array.from(byId.values()));
          }
        })
        .catch((err) => {
          console.warn('Backend sync meal plans notice:', err);
        });
    });
  } catch {
    // ignore
  }
}

/**
 * Fetches latest meal plans from Express server AND Supabase and merges into local cache
 */
export async function fetchMealPlansFromServer(userEmail?: string): Promise<MealPlan[]> {
  const current = getAllStoredMealPlans();
  const merged = [...current];
  let hasUpdates = false;

  const mergeIncoming = (incomingPlans: MealPlan[] | null | undefined) => {
    if (!Array.isArray(incomingPlans) || incomingPlans.length === 0) return;
    incomingPlans.forEach((p: MealPlan) => {
      if (!p || !p.id) return;
      const idx = merged.findIndex((m) => m.id === p.id);
      if (idx >= 0) {
        const localTime = new Date(merged[idx].updatedAt || merged[idx].createdAt || 0).getTime();
        const remoteTime = new Date(p.updatedAt || p.createdAt || 0).getTime();
        if (remoteTime >= localTime) {
          merged[idx] = { ...merged[idx], ...p };
          hasUpdates = true;
        }
      } else {
        merged.unshift(p);
        hasUpdates = true;
      }
    });
  };

  const normEmail = userEmail ? userEmail.toLowerCase().trim() : '';
  const url = normEmail
    ? `/api/meal-plans?userEmail=${encodeURIComponent(normEmail)}`
    : '/api/meal-plans';

  const authHeaders = await getSupabaseAuthHeaders();
  const [serverPlans, sbPlans] = await Promise.all([
    fetch(url, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (Array.isArray(data?.plans) ? (data.plans as MealPlan[]) : null))
      .catch(() => null),
    normEmail ? loadMealPlansFromSupabase(normEmail).catch(() => null) : Promise.resolve(null),
  ]);

  mergeIncoming(serverPlans);
  mergeIncoming(sbPlans as MealPlan[] | null);

  if (hasUpdates) {
    safeLocalStorageSet(MEAL_PLANS_KEY, merged);
  }

  return merged;
}

export function getAllStoredWorkoutPlans(): WorkoutPlan[] {
  try {
    const raw = localStorage.getItem(WORKOUT_PLANS_KEY);
    if (!raw) {
      return SEED_WORKOUT_PLANS;
    }
    const parsedRaw = JSON.parse(raw);
    if (Array.isArray(parsedRaw)) {
      let changed = false;
      const parsed = parsedRaw.filter((p) => {
        if (p?.userEmail?.toLowerCase().trim().endsWith('@example.com')) {
          changed = true;
          return false;
        }
        return true;
      });
      for (const seed of SEED_WORKOUT_PLANS) {
        if (!parsed.some((p) => p?.id === seed.id)) {
          parsed.unshift(seed);
          changed = true;
        }
      }
      if (changed) {
        safeLocalStorageSet(WORKOUT_PLANS_KEY, parsed);
      }
      return parsed;
    }
    return SEED_WORKOUT_PLANS;
  } catch (err) {
    console.error('Error reading workout plans from storage:', err);
    return SEED_WORKOUT_PLANS;
  }
}

export function saveAllWorkoutPlans(plans: WorkoutPlan[], targetUserEmail?: string) {
  safeLocalStorageSet(WORKOUT_PLANS_KEY, plans);

  // Sync user's workout plans to Supabase (both workout_plans table and profiles.profile_data.workout_plans)
  if (targetUserEmail) {
    const norm = targetUserEmail.toLowerCase().trim();
    const userPlans = plans.filter(
      (p) =>
        (p.userEmail && p.userEmail.toLowerCase().trim() === norm) ||
        (p.userId && p.userId.toLowerCase().trim() === norm)
    );
    syncWorkoutPlansToSupabase(norm, userPlans).catch((err) => {
      console.warn('Supabase sync workout plans notice:', err);
    });
  }

  // Also sync asynchronously to server and merge confirmed server records by ID into local cache
  try {
    getSupabaseAuthHeaders().then((authHeaders) => {
      fetch('/api/workout-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(plans),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.plans && Array.isArray(data.plans)) {
            const current = getAllStoredWorkoutPlans();
            const byId = new Map<string, WorkoutPlan>();
            for (const p of current) {
              if (p?.id) byId.set(p.id, p);
            }
            for (const p of data.plans as WorkoutPlan[]) {
              if (p?.id) byId.set(p.id, p);
            }
            safeLocalStorageSet(WORKOUT_PLANS_KEY, Array.from(byId.values()));
          }
        })
        .catch((err) => {
          console.warn('Backend sync workout plans notice:', err);
        });
    });
  } catch {
    // ignore
  }
}

/**
 * Fetches latest workout plans from Express server AND Supabase and merges into local cache
 */
export async function fetchWorkoutPlansFromServer(userEmail?: string): Promise<WorkoutPlan[]> {
  const current = getAllStoredWorkoutPlans();
  const merged = [...current];
  let hasUpdates = false;

  const mergeIncoming = (incomingPlans: WorkoutPlan[] | null | undefined) => {
    if (!Array.isArray(incomingPlans) || incomingPlans.length === 0) return;
    incomingPlans.forEach((p: WorkoutPlan) => {
      if (!p || !p.id) return;
      const idx = merged.findIndex((m) => m.id === p.id);
      if (idx >= 0) {
        const localTime = new Date(merged[idx].updatedAt || merged[idx].createdAt || 0).getTime();
        const remoteTime = new Date(p.updatedAt || p.createdAt || 0).getTime();
        if (remoteTime >= localTime) {
          merged[idx] = { ...merged[idx], ...p };
          hasUpdates = true;
        }
      } else {
        merged.unshift(p);
        hasUpdates = true;
      }
    });
  };

  const normEmail = userEmail ? userEmail.toLowerCase().trim() : '';
  const url = normEmail
    ? `/api/workout-plans?userEmail=${encodeURIComponent(normEmail)}`
    : '/api/workout-plans';

  const authHeaders = await getSupabaseAuthHeaders();
  const [serverPlans, sbPlans] = await Promise.all([
    fetch(url, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (Array.isArray(data?.plans) ? (data.plans as WorkoutPlan[]) : null))
      .catch(() => null),
    normEmail ? loadWorkoutPlansFromSupabase(normEmail).catch(() => null) : Promise.resolve(null),
  ]);

  mergeIncoming(serverPlans);
  mergeIncoming(sbPlans as WorkoutPlan[] | null);

  if (hasUpdates) {
    safeLocalStorageSet(WORKOUT_PLANS_KEY, merged);
  }

  return merged;
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

  saveAllMealPlans(all, planEmail);
  notifyPlannerChange();
  return loadUserMealPlans(planEmail);
}

export async function deleteMealPlan(planId: string, userEmail: string): Promise<MealPlan[]> {
  const all = getAllStoredMealPlans();
  const filtered = all.filter((p) => p.id !== planId);
  saveAllMealPlans(filtered, userEmail);
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
    saveAllMealPlans(all, targetUserEmail);
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

  saveAllMealPlans(all, normalizedEmail);
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

  saveAllMealPlans(all, normalizedEmail);
  notifyPlannerChange();

  // Asynchronously dispatch email notification to the member if valid email
  if (normalizedEmail && normalizedEmail.includes('@')) {
    notifyPlanAssigned({
      type: 'diet',
      targetEmail: normalizedEmail,
      plan: newPlan,
      coachName,
    }).catch((err) => {
      console.warn('[assignCoachMealPlan] Failed to dispatch email notification:', err);
    });
  }

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

  saveAllWorkoutPlans(all, planEmail);
  notifyPlannerChange();
  return loadUserWorkoutPlans(planEmail);
}

export async function deleteWorkoutPlan(planId: string, userEmail: string): Promise<WorkoutPlan[]> {
  const all = getAllStoredWorkoutPlans();
  const filtered = all.filter((p) => p.id !== planId);
  saveAllWorkoutPlans(filtered, userEmail);
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
    saveAllWorkoutPlans(all, targetUserEmail);
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

  saveAllWorkoutPlans(all, normalizedEmail);
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

  saveAllWorkoutPlans(all, normalizedEmail);
  notifyPlannerChange();

  // Asynchronously dispatch email notification to the member if valid email
  if (normalizedEmail && normalizedEmail.includes('@')) {
    notifyPlanAssigned({
      type: 'workout',
      targetEmail: normalizedEmail,
      plan: newPlan,
      coachName,
    }).catch((err) => {
      console.warn('[assignCoachWorkoutPlan] Failed to dispatch email notification:', err);
    });
  }

  return newPlan;
}
