import { UserProfile, ClientOnboarding } from '../types';
import { saveProfileToSupabase, saveOnboardingToSupabase } from './supabase';

export const defaultUserProfile: UserProfile = {
  email: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  age: '',
  gender: '',
  phone: '',
  alternatePhone: '',
  address: '',
  city: '',
  state: '',
  zipcode: '',
  preferredContact: 'Whatsapp Audio/Video/Message',
  maritalStatus: '',
  children: '',
  isPregnant: 'Not applicable',
  bloodGroup: '',
  livingWith: '',
  primaryCareProvider: '',
  lastCheckupDate: '',
};

export const defaultClientOnboarding: ClientOnboarding = {
  // === Goals & Readiness Assessment (Google Form Q5-Q18) ===
  healthGoal: 'Weight Loss',
  healthGoalOther: '',
  coreReasonWhy: '',
  pastDietsAndTechniques: '',
  biggestNutritionChallenges: '',
  desiredHealthHabitChanges: '',
  truthfulnessScale: 5,
  readinessWeeklyTracking: 5,
  readinessModifyDiet: 4,
  readinessSupplements: 4,
  readinessFoodLog: 4,
  readinessModifyLifestyle: 4,
  readinessRelaxationMeditation: 4,
  readinessRegularExercise: 5,
  readinessPeriodicLabTests: 4,

  // === Lifestyle, Physical Activity & Stress Assessment (Google Form Q19-Q38) ===
  currentPhysicalActivities: ['Cardio/ Aerobis (Walking, Jogging, Cycling, swimming, etc)'],
  currentPhysicalActivitiesOther: '',
  physicalActivityDaysPerWeek: '4',
  physicalActivityDurationMinutes: '45',
  gymAccess: 'yes',
  workoutDaysAndDuration: '4 days a week, 45 minutes',
  physicalActivityLimitations: [],
  physicalActivityLimitationsOther: '',
  stressWork: 3,
  stressFamily: 2,
  stressSocialLife: 2,
  stressFinancial: 2,
  stressHealth: 2,
  stressOther: 1,
  stressOtherDetails: '',
  unwindRelaxActivities: '',
  sleepHoursWeekdays: '7',
  sleepHoursWeekends: '8',
  smokingStatus: 'Never',
  cigarettesPerDay: 'Am a non smoker',
  alcoholUse: 'Never',
  alcoholFrequency: 'Never',
  alcoholQuantityPerSession: 'Not Applicable',

  // Section 3: Dietary Preferences & Habits
  foodAllergies: 'Not applicable',
  dislikedFoods: '',
  whoCooks: 'Myself',
  cookingDifficulty: 'no',
  dietPreferences: ['Vegetarian'],
  currentSpecificDiet: ['None'],
  mealsEatenRegularly: ['Breakfast', 'Lunch', 'Dinner'],
  dailyBeverageOfChoice: ['Green Tea'],
  beverageSnacks: '',
  beverageFrequencyQuantity: '',
  breakfastDetails: '',
  lunchDetails: '',
  snackDetails: '',
  dinnerDetails: '',
  foodCravings: '',
  cravingFrequency: '1-2 times a week',
  specialDietRestrictions: 'Not applicable',
  outsideFoodFrequency: 'Once a week',
  outsideFoodItems: '',
  artificialSweeteners: 'Not Applicable',

  // Section 4: Digestive & Gut Health
  heartburnFrequency: 'Never',
  gasFrequency: 'Never',
  bloatingFrequency: 'Never',
  stomachPainFrequency: 'Never',
  nauseaVomitingFrequency: 'Never',
  diarrheaFrequency: 'Never',
  constipationFrequency: 'Never',
  missedDetails: '',

  // Section 5: Body Statistics & Measurements
  currentWeightKg: '',
  heightCm: '',
  waistInches: '',
  hipInches: '',
  neckInches: '',
  chestInches: '',
  upperArmInches: '',
  quadricepsInches: '',

  // Section 6: Past Medical, Surgical & Family History
  medicalAndSurgicalHistory: '',
  familyDeathsAndCauses: '',
  knowsBloodPressure: 'no',
  bpAbove14090: 'no',
  knowsCholesterol: 'no',
  cholesterolAbove200: 'no',

  // Section 7: Symptom Severity & Medications
  headachesScore: 1,
  faintnessScore: 1,
  dizzinessScore: 1,
  insomniaScore: 1,
  digestiveIssuesScore: 1,
  emotionalIssuesScore: 1,
  currentMedications: '',
  medicationAllergies: 'Not applicable',

  completedSections: [],
  isSubmitted: false,
};

function getStorageKey(type: 'profile' | 'onboarding', userIdOrEmail?: string): string {
  const identifier = (userIdOrEmail || 'anonymous').toLowerCase().trim();
  return `fitkode_${type}_${identifier}`;
}

export function loadUserProfile(userIdOrEmail?: string, defaults?: Partial<UserProfile>): UserProfile {
  if (typeof window === 'undefined') return { ...defaultUserProfile, ...defaults };
  const key = getStorageKey('profile', userIdOrEmail);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultUserProfile, ...defaults, ...parsed };
    }
  } catch (err) {
    console.warn('Error reading user profile from localStorage:', err);
  }
  return { ...defaultUserProfile, ...defaults };
}

export function saveUserProfile(profile: UserProfile, userIdOrEmail?: string): void {
  if (typeof window === 'undefined') return;
  const key = getStorageKey('profile', userIdOrEmail);
  try {
    const payload = { ...profile, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.error('Error saving user profile to localStorage:', err);
  }

  // Also automatically persist to Supabase
  try {
    saveProfileToSupabase(profile, userIdOrEmail).catch((err) => {
      console.warn('Background Supabase profile save notice:', err?.message);
    });
  } catch {
    // ignore
  }
}

export function loadClientOnboarding(userIdOrEmail?: string): ClientOnboarding {
  if (typeof window === 'undefined') return defaultClientOnboarding;
  const key = getStorageKey('onboarding', userIdOrEmail);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultClientOnboarding, ...parsed };
    }
  } catch (err) {
    console.warn('Error reading onboarding from localStorage:', err);
  }
  return defaultClientOnboarding;
}

export function saveClientOnboarding(onboarding: ClientOnboarding, userIdOrEmail?: string): void {
  if (typeof window === 'undefined') return;
  const key = getStorageKey('onboarding', userIdOrEmail);
  try {
    const payload = { ...onboarding, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.error('Error saving onboarding to localStorage:', err);
  }

  // Also automatically persist to Supabase
  try {
    saveOnboardingToSupabase(onboarding, userIdOrEmail).catch((err) => {
      console.warn('Background Supabase onboarding save notice:', err?.message);
    });
  } catch {
    // ignore
  }
}

export function getProfileCompletionRate(profile: UserProfile): number {
  const fieldsToCheck: (keyof UserProfile)[] = [
    'firstName',
    'lastName',
    'dateOfBirth',
    'gender',
    'phone',
    'address',
    'city',
    'state',
    'zipcode',
    'preferredContact',
    'bloodGroup',
    'livingWith',
    'lastCheckupDate',
  ];

  const filled = fieldsToCheck.filter((f) => Boolean(profile[f] && String(profile[f]).trim().length > 0));
  return Math.round((filled.length / fieldsToCheck.length) * 100);
}

export function getOnboardingCompletionRate(onboarding: ClientOnboarding): number {
  if (onboarding.isSubmitted) return 100;
  const completed = onboarding.completedSections?.length || 0;
  return Math.min(100, Math.round((completed / 7) * 100));
}
