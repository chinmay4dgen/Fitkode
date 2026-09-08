import { UserProfile, ClientOnboarding, WeeklyTrackerEntry, MealPlan, WorkoutPlan, ExerciseItem, MealItem } from '../types';
import { loadUserProfile, saveUserProfile, loadClientOnboarding, saveClientOnboarding } from './profileStorage';
import { loadUserWeeklyEntries } from './weeklyTrackerStore';
import { loadUserCustomExercises } from './exerciseStore';
import { loadUserCustomFoods } from './customFoodStore';
import { loadUserMealPlans, loadUserWorkoutPlans, getAllStoredMealPlans, saveAllMealPlans, getAllStoredWorkoutPlans, saveAllWorkoutPlans, notifyPlannerChange } from './plannerStore';
import { getStoredMembers, saveStoredMembers } from './memberStore';
import { getSupabase } from './supabase';

export interface ClientDataExportPackage {
  meta: {
    exportDateIST: string;
    exportTimestampUTC: string;
    dataFiduciary: string;
    grievanceOfficer: string;
    contactEmail: string;
    complianceFramework: string;
    userIdentifier: string;
  };
  consentAndRights: {
    healthDataConsent: boolean;
    healthDataConsentGivenAt?: string;
    notificationsConsent: boolean;
    notificationsConsentGivenAt?: string;
    isConsentWithdrawn: boolean;
    consentWithdrawnAt?: string;
    rightToErasureAvailable: boolean;
    rightToWithdrawConsentAvailable: boolean;
  };
  profile: UserProfile;
  healthIntakeOnboarding: ClientOnboarding;
  weeklyTrackerEntries: WeeklyTrackerEntry[];
  customMealPlans: MealPlan[];
  customWorkoutPlans: WorkoutPlan[];
  customFoods: MealItem[];
  customExercises: ExerciseItem[];
}

/**
 * Builds the complete exportable data package for a given user under DPDPA 2023.
 */
export function buildClientDataPackage(userIdOrEmail: string): ClientDataExportPackage {
  const profile = loadUserProfile(userIdOrEmail);
  const onboarding = loadClientOnboarding(userIdOrEmail);
  const email = (profile.email || userIdOrEmail).toLowerCase().trim();

  const weeklyEntries = loadUserWeeklyEntries(email);
  const mealPlans = loadUserMealPlans(email);
  const workoutPlans = loadUserWorkoutPlans(email);
  const customFoods = loadUserCustomFoods(email);
  const customExercises = loadUserCustomExercises(email);

  return {
    meta: {
      exportDateIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      exportTimestampUTC: new Date().toISOString(),
      dataFiduciary: 'Fitkode Studio (India)',
      grievanceOfficer: 'Chinmay Jain (myfitkode@gmail.com)',
      contactEmail: 'myfitkode@gmail.com',
      complianceFramework: "Digital Personal Data Protection Act (DPDPA 2023) - Section 6, 11, 12, 13",
      userIdentifier: email,
    },
    consentAndRights: {
      healthDataConsent: Boolean(onboarding.healthDataConsent ?? profile.healthDataConsent),
      healthDataConsentGivenAt: onboarding.healthDataConsentGivenAt || profile.healthDataConsentGivenAt,
      notificationsConsent: Boolean(onboarding.notificationsConsent ?? profile.notificationsConsent),
      notificationsConsentGivenAt: onboarding.notificationsConsentGivenAt || profile.notificationsConsentGivenAt,
      isConsentWithdrawn: Boolean(onboarding.isConsentWithdrawn || profile.isConsentWithdrawn),
      consentWithdrawnAt: onboarding.consentWithdrawnAt || profile.consentWithdrawnAt,
      rightToErasureAvailable: true,
      rightToWithdrawConsentAvailable: true,
    },
    profile,
    healthIntakeOnboarding: onboarding,
    weeklyTrackerEntries: weeklyEntries,
    customMealPlans: mealPlans,
    customWorkoutPlans: workoutPlans,
    customFoods,
    customExercises,
  };
}

/**
 * Initiates client-side file download of the complete JSON data package.
 */
export function downloadClientDataAsJson(userIdOrEmail: string): void {
  const dataPackage = buildClientDataPackage(userIdOrEmail);
  const jsonStr = JSON.stringify(dataPackage, null, 2);
  const cleanId = (dataPackage.meta.userIdentifier || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `fitkode_data_export_${cleanId}_${new Date().toISOString().split('T')[0]}.json`;

  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a clean human-readable text summary of the user's data for easy viewing or copying.
 */
export function generateClientDataSummaryText(userIdOrEmail: string): string {
  const pkg = buildClientDataPackage(userIdOrEmail);
  const { profile, healthIntakeOnboarding: o, weeklyTrackerEntries: w, customMealPlans: m, customWorkoutPlans: wp } = pkg;

  return `================================================================================
FITKODE STUDIO - CLIENT PERSONAL & HEALTH DATA RECORD (DPDPA 2023)
Generated: ${pkg.meta.exportDateIST}
Data Fiduciary: ${pkg.meta.dataFiduciary}
Grievance Officer: ${pkg.meta.grievanceOfficer}
================================================================================

[1] CONSENT & DPDPA STATUS
- Health Data Processing Consent: ${pkg.consentAndRights.healthDataConsent ? 'GRANTED' : 'NOT GRANTED / WITHDRAWN'}
  Consent Timestamp: ${pkg.consentAndRights.healthDataConsentGivenAt || 'N/A'}
- Notifications & Communication Consent: ${pkg.consentAndRights.notificationsConsent ? 'OPTED-IN' : 'OPTED-OUT'}
- Consent Revocation Status: ${pkg.consentAndRights.isConsentWithdrawn ? 'CONSENT WITHDRAWN on ' + pkg.consentAndRights.consentWithdrawnAt : 'ACTIVE'}

[2] PROFILE & DEMOGRAPHICS
- Name: ${profile.firstName} ${profile.lastName}
- Email: ${profile.email}
- Phone: ${profile.phone || 'N/A'}
- Gender: ${profile.gender || 'N/A'} | Age: ${profile.age || 'N/A'} | DOB: ${profile.dateOfBirth || 'N/A'}
- City / State: ${profile.city || 'N/A'}, ${profile.state || 'N/A'} (${profile.zipcode || 'N/A'})
- Emergency / Primary Care: ${profile.primaryCareProvider || 'N/A'}
- Primary Health Goal: ${profile.healthGoal || o.healthGoal || 'N/A'}

[3] HEALTH & LIFESTYLE INTAKE
- Core Reason Why: ${o.coreReasonWhy || 'N/A'}
- Physical Activity Days / Duration: ${o.physicalActivityDaysPerWeek || '0'} days/wk, ${o.physicalActivityDurationMinutes || '0'} mins
- Gym Access: ${o.gymAccess || 'N/A'}
- Dietary Preferences: ${(o.dietPreferences || []).join(', ') || 'Standard'}
- Food Allergies: ${o.foodAllergies || 'None reported'}
- Medical & Surgical History: ${o.medicalAndSurgicalHistory || 'None reported'}
- Current Medications: ${o.currentMedications || 'None reported'}
- Baseline Weight: ${o.currentWeightKg ? o.currentWeightKg + ' kg' : 'N/A'}
- Baseline Height: ${o.heightCm ? o.heightCm + ' cm' : 'N/A'}
- Circumferences: Waist: ${o.waistInches || '-'} in, Hips: ${o.hipInches || '-'} in, Chest: ${o.chestInches || '-'} in

[4] LOGGED WEEKLY TRACKER RECORDS (${w.length} entries)
${w.map((entry) => `  * Week ${entry.weekNumber} (${entry.checkInDate}): Weight: ${entry.weightKg} kg, Waist: ${entry.waistInches}", Steps: ${entry.avgStepsPerDay}/day`).join('\n') || '  No weekly entries logged yet.'}

[5] CUSTOM NUTRITION & WORKOUT PLANS
- Active Meal Plans (${m.length}): ${m.map((p) => p.name).join(', ') || 'None'}
- Active Workout Routines (${wp.length}): ${wp.map((p) => p.name).join(', ') || 'None'}

================================================================================
DISCLAIMER: Fitkode provides evidence-based fitness and lifestyle coaching. Coach Chinmay Jain is an INFS Certified Nutrition & Fitness Specialist and not a licensed medical practitioner.
Grievance Turnaround: 72 hours via myfitkode@gmail.com.
================================================================================`;
}

/**
 * Revokes health processing consent under DPDPA 2023.
 * Flags account as inactive / paused and timestamps revocation.
 */
export async function revokeHealthConsent(userIdOrEmail: string): Promise<void> {
  const timestamp = new Date().toISOString();

  // Update profile
  const profile = loadUserProfile(userIdOrEmail);
  const updatedProfile: UserProfile = {
    ...profile,
    healthDataConsent: false,
    isConsentWithdrawn: true,
    consentWithdrawnAt: timestamp,
  };
  saveUserProfile(updatedProfile, userIdOrEmail);

  // Update onboarding
  const onboarding = loadClientOnboarding(userIdOrEmail);
  const updatedOnboarding: ClientOnboarding = {
    ...onboarding,
    healthDataConsent: false,
    isConsentWithdrawn: true,
    consentWithdrawnAt: timestamp,
  };
  saveClientOnboarding(updatedOnboarding, userIdOrEmail);

  // Update member store status
  const email = (profile.email || userIdOrEmail).toLowerCase().trim();
  const members = getStoredMembers();
  const index = members.findIndex((m) => m.id === userIdOrEmail || m.email.toLowerCase() === email);
  if (index >= 0) {
    members[index].consentStatus = 'withdrawn';
    members[index].consentWithdrawnAt = timestamp;
    saveStoredMembers(members);
  }

  // Update Supabase if connected
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('profiles')
        .update({
          health_data_consent: false,
          is_consent_withdrawn: true,
          consent_withdrawn_at: timestamp,
          updated_at: timestamp,
        })
        .or(`id.eq.${userIdOrEmail},email.eq.${email}`);
    } catch {
      // ignore
    }
  }
}

/**
 * Re-grants health processing consent if previously revoked.
 */
export async function regrantHealthConsent(userIdOrEmail: string): Promise<void> {
  const timestamp = new Date().toISOString();

  const profile = loadUserProfile(userIdOrEmail);
  const updatedProfile: UserProfile = {
    ...profile,
    healthDataConsent: true,
    healthDataConsentGivenAt: timestamp,
    isConsentWithdrawn: false,
    consentWithdrawnAt: undefined,
  };
  saveUserProfile(updatedProfile, userIdOrEmail);

  const onboarding = loadClientOnboarding(userIdOrEmail);
  const updatedOnboarding: ClientOnboarding = {
    ...onboarding,
    healthDataConsent: true,
    healthDataConsentGivenAt: timestamp,
    isConsentWithdrawn: false,
    consentWithdrawnAt: undefined,
  };
  saveClientOnboarding(updatedOnboarding, userIdOrEmail);

  const email = (profile.email || userIdOrEmail).toLowerCase().trim();
  const members = getStoredMembers();
  const index = members.findIndex((m) => m.id === userIdOrEmail || m.email.toLowerCase() === email);
  if (index >= 0) {
    members[index].consentStatus = 'active';
    members[index].consentWithdrawnAt = undefined;
    saveStoredMembers(members);
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('profiles')
        .update({
          health_data_consent: true,
          health_data_consent_given_at: timestamp,
          is_consent_withdrawn: false,
          updated_at: timestamp,
        })
        .or(`id.eq.${userIdOrEmail},email.eq.${email}`);
    } catch {
      // ignore
    }
  }
}

/**
 * Permanently erases all client data under DPDPA 2023 Right to Erasure.
 * Removes profile, onboarding, weekly logs, custom exercises, custom foods,
 * plans, and member records.
 */
export async function eraseClientData(userIdOrEmail: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const profile = loadUserProfile(userIdOrEmail);
  const email = (profile.email || userIdOrEmail).toLowerCase().trim();
  const userId = userIdOrEmail.toLowerCase().trim();

  // Storage keys to wipe
  const keysToRemove = [
    `fitkode_profile_${email}`,
    `fitkode_profile_${userId}`,
    `fitkode_onboarding_${email}`,
    `fitkode_onboarding_${userId}`,
    `fitkode_weekly_entries_${email}`,
    `fitkode_weekly_entries_${userId}`,
    `fitkode_custom_exercises_${email}`,
    `fitkode_custom_exercises_${userId}`,
    `fitkode_custom_foods_${email}`,
    `fitkode_custom_foods_${userId}`,
  ];

  for (const k of keysToRemove) {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }

  // Remove meal plans belonging to user
  try {
    const allMealPlans = getAllStoredMealPlans();
    const remainingMealPlans = allMealPlans.filter(
      (p) => p.userEmail?.toLowerCase() !== email && p.userId?.toLowerCase() !== userId
    );
    saveAllMealPlans(remainingMealPlans);
  } catch {
    // ignore
  }

  // Remove workout plans belonging to user
  try {
    const allWorkoutPlans = getAllStoredWorkoutPlans();
    const remainingWorkoutPlans = allWorkoutPlans.filter(
      (p) => p.userEmail?.toLowerCase() !== email && p.userId?.toLowerCase() !== userId
    );
    saveAllWorkoutPlans(remainingWorkoutPlans);
  } catch {
    // ignore
  }

  notifyPlannerChange();

  // Remove from member store
  try {
    const members = getStoredMembers();
    const filteredMembers = members.filter(
      (m) => m.id.toLowerCase() !== userId && m.email.toLowerCase() !== email
    );
    saveStoredMembers(filteredMembers);
  } catch {
    // ignore
  }

  // Delete from Supabase if connected
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('onboarding_responses').delete().or(`user_id.eq.${userId},user_id.eq.${email}`);
      await supabase.from('weekly_tracker_entries').delete().or(`user_email.eq.${email},user_id.eq.${userId}`);
      await supabase.from('profiles').delete().or(`id.eq.${userId},email.eq.${email}`);
    } catch {
      // ignore
    }
  }
}
