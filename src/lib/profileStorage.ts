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
  healthDataConsent: true,
  healthDataConsentGivenAt: new Date().toISOString(),
  notificationsConsent: true,
  notificationsConsentGivenAt: new Date().toISOString(),
  isConsentWithdrawn: false,
  consentWithdrawnAt: '',
  notificationsConsentWithdrawn: false,
  notificationsConsentWithdrawnAt: '',
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
  healthDataConsent: true,
  healthDataConsentGivenAt: new Date().toISOString(),
  notificationsConsent: true,
  notificationsConsentGivenAt: new Date().toISOString(),
  isConsentWithdrawn: false,
  consentWithdrawnAt: '',
  notificationsConsentWithdrawn: false,
  notificationsConsentWithdrawnAt: '',
};

export const ATUL_GUPTA_PROFILE: UserProfile = {
  ...defaultUserProfile,
  email: 'akg.atulgupta@gmail.com',
  firstName: 'Atul',
  lastName: 'Gupta',
  dateOfBirth: '1985-11-20',
  age: '40',
  gender: 'Male',
  phone: '+91 98114 00612',
  address: 'Pocket B, Sarita Vihar',
  city: 'New Delhi',
  state: 'Delhi',
  zipcode: '110076',
  preferredContact: 'Whatsapp Audio/Video/Message',
  maritalStatus: 'Married',
  children: 'Yes',
  isPregnant: 'Not applicable',
  bloodGroup: 'B+',
  livingWith: 'Family',
  primaryCareProvider: 'Max Healthcare Delhi',
  lastCheckupDate: '2026-05-10',
  healthDataConsent: true,
  healthDataConsentGivenAt: '2026-09-11T07:15:00Z',
  notificationsConsent: true,
  notificationsConsentGivenAt: '2026-09-11T07:15:00Z',
  isConsentWithdrawn: false,
};

export const ATUL_GUPTA_ONBOARDING: ClientOnboarding = {
  ...defaultClientOnboarding,
  healthGoal: 'Weight Loss',
  healthGoalOther: 'Lean Muscle & Stamina',
  coreReasonWhy: 'Increase daily stamina and reduce waistline while managing corporate desk work.',
  pastDietsAndTechniques: 'Intermittent fasting',
  biggestNutritionChallenges: 'Managing evening cravings after work',
  desiredHealthHabitChanges: 'Consistent 8,000+ daily steps and regular strength workouts.',
  currentPhysicalActivities: ['Walking / Brisk Walking', 'Gym Strength Training'],
  physicalActivityDaysPerWeek: '4',
  physicalActivityDurationMinutes: '45',
  gymAccess: 'yes',
  foodAllergies: 'None',
  dislikedFoods: 'Bitter gourd',
  dietPreferences: ['Vegetarian', 'High Protein'],
  mealsEatenRegularly: ['Breakfast', 'Lunch', 'Dinner'],
  dailyBeverageOfChoice: ['Black Coffee', 'Green Tea'],
  currentWeightKg: '72.8',
  heightCm: '174',
  waistInches: '36.0',
  hipInches: '39.0',
  neckInches: '15.5',
  chestInches: '39.5',
  upperArmInches: '13.5',
  quadricepsInches: '22.0',
  headachesScore: 1,
  insomniaScore: 1,
  digestiveIssuesScore: 1,
  dizzinessScore: 1,
  faintnessScore: 1,
  emotionalIssuesScore: 1,
  completedSections: [1, 2, 3, 4, 5],
  isSubmitted: true,
  healthDataConsent: true,
  healthDataConsentGivenAt: '2026-09-11T07:15:00Z',
  notificationsConsent: true,
  notificationsConsentGivenAt: '2026-09-11T07:15:00Z',
  isConsentWithdrawn: false,
};

function getStorageKey(type: 'profile' | 'onboarding', userIdOrEmail?: string): string {
  const identifier = (userIdOrEmail || 'anonymous').toLowerCase().trim();
  return `fitkode_${type}_${identifier}`;
}

export function loadUserProfile(userIdOrEmail?: string, defaults?: Partial<UserProfile>): UserProfile {
  const normId = (userIdOrEmail || '').toLowerCase().trim();
  const isAtul = normId === 'akg.atulgupta@gmail.com' || normId === 'usr_atul_gupta';
  const baseline = isAtul ? { ...ATUL_GUPTA_PROFILE, ...defaults } : { ...defaultUserProfile, ...defaults };

  if (typeof window === 'undefined') return baseline;
  const key = getStorageKey('profile', userIdOrEmail);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const profile: UserProfile = { ...baseline, ...parsed };
      // As per DPDP Act: By default whenever a person logs in or accesses the site,
      // all their consents must be marked Yes (true) in respect to their willingness to share data,
      // and turned off ONLY if they explicitly chose to turn it off.
      if (!profile.isConsentWithdrawn) {
        profile.healthDataConsent = true;
        if (!profile.healthDataConsentGivenAt) {
          profile.healthDataConsentGivenAt = new Date().toISOString();
        }
      }
      if (!profile.notificationsConsentWithdrawn) {
        profile.notificationsConsent = true;
        if (!profile.notificationsConsentGivenAt) {
          profile.notificationsConsentGivenAt = new Date().toISOString();
        }
      }
      return profile;
    } else if (isAtul) {
      // Cache baseline in localStorage so it is immediately accessible
      try {
        localStorage.setItem(key, JSON.stringify(baseline));
      } catch {}
      return baseline;
    }
  } catch (err) {
    console.warn('Error reading user profile from localStorage:', err);
  }
  return baseline;
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

  // Automatically sync to Express backend server so Coach/Admin portal immediately reflects user updates
  try {
    const userEmail = profile.email || (userIdOrEmail && userIdOrEmail.includes('@') ? userIdOrEmail : '');
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    if (userEmail || userIdOrEmail) {
      fetch('/api/members/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userIdOrEmail,
          email: userEmail || userIdOrEmail,
          name: fullName || undefined,
          phone: profile.phone,
          profile: profile,
          profileCompletion: getProfileCompletionRate(profile),
        }),
      }).catch((err) => {
        console.warn('Backend sync profile notice:', err);
      });
    }
  } catch {
    // ignore
  }
}

export function loadClientOnboarding(userIdOrEmail?: string): ClientOnboarding {
  const normId = (userIdOrEmail || '').toLowerCase().trim();
  const isAtul = normId === 'akg.atulgupta@gmail.com' || normId === 'usr_atul_gupta';
  const baseline = isAtul ? ATUL_GUPTA_ONBOARDING : defaultClientOnboarding;

  if (typeof window === 'undefined') return baseline;
  const key = getStorageKey('onboarding', userIdOrEmail);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const onboarding: ClientOnboarding = { ...baseline, ...parsed };
      if (!onboarding.isConsentWithdrawn) {
        onboarding.healthDataConsent = true;
        if (!onboarding.healthDataConsentGivenAt) {
          onboarding.healthDataConsentGivenAt = new Date().toISOString();
        }
      }
      if (!onboarding.notificationsConsentWithdrawn) {
        onboarding.notificationsConsent = true;
        if (!onboarding.notificationsConsentGivenAt) {
          onboarding.notificationsConsentGivenAt = new Date().toISOString();
        }
      }
      return onboarding;
    } else if (isAtul) {
      try {
        localStorage.setItem(key, JSON.stringify(baseline));
      } catch {}
      return baseline;
    }
  } catch (err) {
    console.warn('Error reading onboarding from localStorage:', err);
  }
  return baseline;
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

  // Automatically sync to Express backend server so Coach/Admin portal immediately reflects user onboarding
  try {
    const userEmail = (userIdOrEmail && userIdOrEmail.includes('@')) ? userIdOrEmail : '';
    if (userEmail || userIdOrEmail) {
      fetch('/api/members/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userIdOrEmail,
          email: userEmail || userIdOrEmail,
          onboarding: onboarding,
          onboardingCompletion: getOnboardingCompletionRate(onboarding),
        }),
      }).catch((err) => {
        console.warn('Backend sync onboarding notice:', err);
      });
    }
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
  ];

  const filled = fieldsToCheck.filter((f) => Boolean(profile[f] && String(profile[f]).trim().length > 0));
  return Math.round((filled.length / fieldsToCheck.length) * 100);
}

export function getOnboardingCompletionRate(onboarding: ClientOnboarding): number {
  if (onboarding.isSubmitted) return 100;
  const completed = onboarding.completedSections?.length || 0;
  return Math.min(100, Math.round((completed / 7) * 100));
}
