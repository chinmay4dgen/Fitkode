import { AppMember, UserRole, UserProfile, ClientOnboarding, WeeklyTrackerEntry } from '../types';
import { defaultUserProfile, defaultClientOnboarding, getProfileCompletionRate, getOnboardingCompletionRate } from './profileStorage';
import { getSupabase, getSupabaseAuthHeaders, loadAllWeeklyEntriesFromSupabaseForAdmin } from './supabase';
import { safeLocalStorageSet } from './storageGuard';

export const DEFAULT_ADMIN_EMAILS = ['chinmay4jain@gmail.com', 'myfitkode@gmail.com'];

export function isDefaultAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return DEFAULT_ADMIN_EMAILS.includes(normalized);
}

export const DUMMY_MEMBER_IDS = new Set([
  'usr_001_priya',
  'usr_002_rahul',
  'usr_003_ananya',
  'usr_004_david',
  'usr_005_vikram',
]);

export function isDummyMember(memberOrEmail?: AppMember | string | null): boolean {
  if (!memberOrEmail) return false;
  if (typeof memberOrEmail === 'string') {
    const norm = memberOrEmail.trim().toLowerCase();
    return norm.endsWith('@example.com') || DUMMY_MEMBER_IDS.has(norm);
  }
  const email = (memberOrEmail.email || '').trim().toLowerCase();
  const id = (memberOrEmail.id || '').trim();
  return email.endsWith('@example.com') || DUMMY_MEMBER_IDS.has(id);
}

export function sortMembersBySignupDesc(members: AppMember[]): AppMember[] {
  return [...members].sort(
    (a, b) => new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime()
  );
}

// Pre-populated real enrolled Fitkode members (dummy @example.com accounts remain excluded)
export const SEED_MEMBERS: AppMember[] = [
  {
    id: 'usr_jyothi_varma',
    email: 'jyothi.varmagl@gmail.com',
    name: 'Jyothi Varma',
    role: 'unpaid',
    avatarUrl: '',
    joinedAt: '2026-10-24T14:20:00Z',
    lastLoginAt: '2026-10-24T14:20:00Z',
    phone: '',
    profileCompletion: 17,
    onboardingCompletion: 0,
    notes: '',
    profile: {
      ...defaultUserProfile,
      email: 'jyothi.varmagl@gmail.com',
      firstName: 'Jyothi',
      lastName: 'Varma',
    },
    onboarding: {
      ...defaultClientOnboarding,
    },
  },
  {
    id: 'usr_gaurav_choudhary',
    email: 'advgauravc86@gmail.com',
    name: 'Gaurav Choudhary',
    role: 'unpaid',
    avatarUrl: '',
    joinedAt: '2026-10-22T11:15:00Z',
    lastLoginAt: '2026-10-22T11:15:00Z',
    phone: '',
    profileCompletion: 17,
    onboardingCompletion: 0,
    notes: '',
    profile: {
      ...defaultUserProfile,
      email: 'advgauravc86@gmail.com',
      firstName: 'Gaurav',
      lastName: 'Choudhary',
    },
    onboarding: {
      ...defaultClientOnboarding,
    },
  },
  {
    id: 'usr_rakshit_harneja',
    email: 'rharneja2008@gmail.com',
    name: 'Rakshit Harneja',
    role: 'unpaid',
    avatarUrl: '',
    joinedAt: '2026-10-19T16:40:00Z',
    lastLoginAt: '2026-10-19T16:40:00Z',
    phone: '',
    profileCompletion: 17,
    onboardingCompletion: 0,
    notes: '',
    profile: {
      ...defaultUserProfile,
      email: 'rharneja2008@gmail.com',
      firstName: 'Rakshit',
      lastName: 'Harneja',
    },
    onboarding: {
      ...defaultClientOnboarding,
    },
  },
  {
    id: 'usr_dubey_shruti',
    email: 'dubeyshruti2428@gmail.com',
    name: 'dubey shruti1403',
    role: 'unpaid',
    avatarUrl: '',
    joinedAt: '2026-10-15T10:05:00Z',
    lastLoginAt: '2026-10-15T10:30:00Z',
    phone: '9891020554',
    profileCompletion: 42,
    onboardingCompletion: 0,
    notes: '',
    profile: {
      ...defaultUserProfile,
      email: 'dubeyshruti2428@gmail.com',
      firstName: 'Shruti',
      lastName: 'Dubey',
      gender: 'Female',
      phone: '9891020554',
      preferredContact: 'Whatsapp Audio/Video/Message',
      healthDataConsent: true,
      notificationsConsent: true,
      isConsentWithdrawn: false,
    },
    onboarding: {
      ...defaultClientOnboarding,
    },
  },
  {
    id: 'usr_atul_gupta',
    email: 'akg.atulgupta@gmail.com',
    name: 'Atul Gupta',
    role: 'unpaid',
    avatarUrl: '',
    joinedAt: '2026-09-11T07:15:00Z',
    lastLoginAt: '2026-09-22T09:30:00Z',
    phone: '7838777741',
    profileCompletion: 100,
    onboardingCompletion: 100,
    notes: 'Member updated stats last week (Week 2 check-in on Sep 22): Weight down to 71.9 kg (-0.9 kg), waist 35.4 in (-0.6 in), steps avg 8,600/day. High adherence.',
    profile: {
      ...defaultUserProfile,
      email: 'akg.atulgupta@gmail.com',
      firstName: 'Atul',
      lastName: 'Gupta',
      gender: 'Male',
      phone: '7838777741',
      preferredContact: 'Whatsapp Audio/Video/Message',
      healthDataConsent: true,
      notificationsConsent: true,
      isConsentWithdrawn: false,
    },
    onboarding: {
      ...defaultClientOnboarding,
      healthGoal: 'Weight Loss',
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
      currentWeightKg: '71.9',
      heightCm: '174',
      waistInches: '35.4',
      hipInches: '38.6',
      neckInches: '15.4',
      chestInches: '39.2',
      upperArmInches: '13.4',
      quadricepsInches: '21.8',
      headachesScore: 1,
      insomniaScore: 1,
      digestiveIssuesScore: 1,
      dizzinessScore: 1,
      faintnessScore: 1,
      emotionalIssuesScore: 1,
      completedSections: [1, 2, 3, 4, 5],
      isSubmitted: true,
      healthDataConsent: true,
      notificationsConsent: true,
      isConsentWithdrawn: false,
    },
    weeklyEntries: [
      {
        id: 'chk_atul_w2',
        userId: 'usr_atul_gupta',
        userEmail: 'akg.atulgupta@gmail.com',
        firstName: 'Atul',
        lastName: 'Gupta',
        checkInDate: '2026-09-22',
        weekNumber: 2,
        avgStepsPerDay: 8600,
        weightKg: 71.9,
        waistInches: 35.4,
        hipsInches: 38.6,
        neckInches: 15.4,
        quadsInches: 21.8,
        chestInches: 39.2,
        upperRightArmInches: 13.4,
        resistanceWorkoutDays: 4,
        hiitCardioDays: 2,
        avgCaloriesPerDay: 1980,
        frontPicUrl: '',
        leftPicUrl: '',
        rightPicUrl: '',
        backPicUrl: '',
        challengesFaced: 'Managed to hit 8.6k daily steps by taking 15-min post-meal walking breaks between meetings. Evening hunger was much better with the roasted chana snack.',
        coachFeedback: 'Outstanding progress Atul! Down 0.9kg and more than half an inch off your waist in Week 2. Strength training consistency is paying off.',
        createdAt: '2026-09-22T08:30:00Z',
      },
      {
        id: 'chk_atul_w1',
        userId: 'usr_atul_gupta',
        userEmail: 'akg.atulgupta@gmail.com',
        firstName: 'Atul',
        lastName: 'Gupta',
        checkInDate: '2026-09-11',
        weekNumber: 1,
        avgStepsPerDay: 8000,
        weightKg: 72.8,
        waistInches: 36,
        hipsInches: 39,
        neckInches: 15.5,
        quadsInches: 22,
        chestInches: 39.5,
        upperRightArmInches: 13.5,
        resistanceWorkoutDays: 3,
        hiitCardioDays: 1,
        avgCaloriesPerDay: 2050,
        frontPicUrl: '',
        leftPicUrl: '',
        rightPicUrl: '',
        backPicUrl: '',
        challengesFaced: 'Sedentary desk job during week, but hit 8k daily steps and completed 3 strength workouts.',
        coachFeedback: 'Excellent baseline Atul! Great adherence on workouts and steps. Let us maintain this momentum for Week 2.',
        createdAt: '2026-09-11T08:00:00Z',
      },
    ],
  },
  {
    id: 'usr_chinmay_right',
    email: 'chinmayright@gmail.com',
    name: 'ChInMaY JaIn',
    role: 'unpaid',
    avatarUrl: '',
    joinedAt: '2026-09-05T09:30:00Z',
    lastLoginAt: '2026-09-05T10:00:00Z',
    phone: '9654173664',
    profileCompletion: 17,
    onboardingCompletion: 0,
    notes: '',
    profile: {
      ...defaultUserProfile,
      email: 'chinmayright@gmail.com',
      firstName: 'ChInMaY',
      lastName: 'JaIn',
      phone: '9654173664',
    },
    onboarding: {
      ...defaultClientOnboarding,
    },
  },
  {
    id: 'usr_chinmay_admin',
    email: 'chinmay4jain@gmail.com',
    name: 'Chinmay Jain',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedAt: '2026-09-05T08:00:00Z',
    lastLoginAt: '2026-10-26T05:00:00Z',
    phone: '9654173664',
    profileCompletion: 25,
    onboardingCompletion: 0,
    notes: '',
    profile: {
      ...defaultUserProfile,
      email: 'chinmay4jain@gmail.com',
      firstName: 'Chinmay',
      lastName: 'Jain',
      gender: 'Male',
      phone: '9654173664',
      preferredContact: 'Whatsapp Audio/Video/Message',
      healthDataConsent: true,
      notificationsConsent: true,
      isConsentWithdrawn: false,
    },
    onboarding: {
      ...defaultClientOnboarding,
    },
  },
];

const LOCAL_STORAGE_KEY = 'fitkode_members_registry_v1';

export function getStoredMembers(): AppMember[] {
  if (typeof window === 'undefined') return sortMembersBySignupDesc(SEED_MEMBERS);
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsedRaw = JSON.parse(raw);
      if (Array.isArray(parsedRaw) && parsedRaw.length > 0) {
        let changed = false;
        const parsed: AppMember[] = parsedRaw.filter((m: AppMember) => {
          if (isDummyMember(m)) {
            changed = true;
            return false;
          }
          return true;
        });

        // Clean up any legacy synthetic placeholder phone/address for Atul Gupta in cached localStorage
        parsed.forEach((m) => {
          if (m.email?.toLowerCase().trim() === 'akg.atulgupta@gmail.com') {
            if (m.phone === '+91 98114 00612' || !m.phone) {
              m.phone = '7838777741';
              changed = true;
            }
            if (m.profile) {
              if (m.profile.phone === '+91 98114 00612' || !m.profile.phone) {
                m.profile.phone = '7838777741';
                changed = true;
              }
              if (m.profile.address === 'Pocket B, Sarita Vihar') {
                m.profile.address = '';
                m.profile.zipcode = '';
                m.profile.primaryCareProvider = '';
                m.profile.dateOfBirth = '';
                changed = true;
              }
            }
          }
        });

        // Ensure all real SEED_MEMBERS exist and have their profiles, onboarding & check-ins
        SEED_MEMBERS.forEach((seed) => {
          const idx = parsed.findIndex(
            (m: AppMember) =>
              m.email?.toLowerCase().trim() === seed.email.toLowerCase().trim() ||
              m.id === seed.id
          );
          if (idx === -1) {
            parsed.push(seed);
            changed = true;
          } else {
            const existing = parsed[idx];
            if (seed.onboarding && (!existing.onboarding || (existing.onboardingCompletion || 0) < (seed.onboardingCompletion || 0))) {
              existing.onboarding = { ...seed.onboarding, ...existing.onboarding };
              existing.onboardingCompletion = Math.max(existing.onboardingCompletion || 0, seed.onboardingCompletion || 0);
              changed = true;
            }
            if (seed.profile && !existing.profile) {
              existing.profile = { ...seed.profile };
              changed = true;
            }
            if (seed.weeklyEntries && seed.weeklyEntries.length > 0) {
              const currentEntries = Array.isArray(existing.weeklyEntries) ? existing.weeklyEntries : [];
              const existingEntryIds = new Set(currentEntries.map((e) => e.id));
              const mergedEntries = [...currentEntries];
              for (const se of seed.weeklyEntries) {
                if (!existingEntryIds.has(se.id)) {
                  mergedEntries.push(se);
                  changed = true;
                }
              }
              existing.weeklyEntries = mergedEntries;
            }
          }
        });

        const sorted = sortMembersBySignupDesc(parsed);
        if (changed) {
          safeLocalStorageSet(LOCAL_STORAGE_KEY, sorted);
        }
        return sorted;
      }
    }
  } catch (err) {
    console.warn('Error reading members from localStorage:', err);
  }
  const initial = sortMembersBySignupDesc(SEED_MEMBERS);
  safeLocalStorageSet(LOCAL_STORAGE_KEY, initial);
  return initial;
}

export function saveStoredMembers(members: AppMember[]): void {
  if (typeof window === 'undefined') return;
  const cleanMembers = sortMembersBySignupDesc(members.filter((m) => !isDummyMember(m)));
  safeLocalStorageSet(LOCAL_STORAGE_KEY, cleanMembers);
}

export function updateMemberWeeklyEntries(userEmail: string, entries: WeeklyTrackerEntry[]): void {
  if (typeof window === 'undefined' || !userEmail) return;
  const normEmail = userEmail.toLowerCase().trim();
  const members = getStoredMembers();
  const index = members.findIndex(
    (m) => m.email?.toLowerCase().trim() === normEmail || m.id === normEmail
  );
  if (index >= 0) {
    members[index].weeklyEntries = entries;
    saveStoredMembers(members);
  }
}

/**
 * Resolves the role for a given user email.
 * Defaults chinmay4jain@gmail.com and myfitkode@gmail.com to 'admin'.
 */
export function determineUserRole(email?: string | null, customRole?: UserRole): UserRole {
  if (!email) return customRole || 'unpaid';
  if (isDefaultAdmin(email)) return 'admin';
  if (customRole) return customRole;

  // Check if this member is stored in the local registry with an explicit role
  const members = getStoredMembers();
  const found = members.find((m) => m.email.toLowerCase() === email.toLowerCase().trim());
  if (found) return found.role;

  return 'unpaid';
}

/**
 * Syncs the current logged-in user with the central registry.
 * If user is a default admin, ensures role is 'admin'.
 */
export async function syncMemberToStore(memberData: {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: UserRole;
  profile?: UserProfile;
  onboarding?: ClientOnboarding;
  planId?: string;
  planName?: string;
}): Promise<AppMember> {
  const members = getStoredMembers();
  const normalizedEmail = memberData.email.toLowerCase().trim();

  // Determine role: default admin takes precedence
  let resolvedRole: UserRole = 'unpaid';
  if (isDefaultAdmin(normalizedEmail)) {
    resolvedRole = 'admin';
  } else if (memberData.role) {
    resolvedRole = memberData.role;
  }

  const existingIndex = members.findIndex(
    (m) => m.email.toLowerCase() === normalizedEmail || m.id === memberData.id
  );

  const profileRate = memberData.profile ? getProfileCompletionRate(memberData.profile) : 0;
  const onboardingRate = memberData.onboarding ? getOnboardingCompletionRate(memberData.onboarding) : 0;

  let updatedMember: AppMember;

  if (existingIndex >= 0) {
    const existing = members[existingIndex];
    // Don't downgrade admin if already admin
    const finalRole = isDefaultAdmin(normalizedEmail) ? 'admin' : (memberData.role || existing.role || resolvedRole);
    const isConsentWithdrawn = Boolean(memberData.profile?.isConsentWithdrawn || (existing.consentStatus === 'withdrawn' && memberData.profile?.isConsentWithdrawn !== false));

    const existingProfileRate = existing.profile ? getProfileCompletionRate(existing.profile) : 0;
    const incomingProfileHasData = Boolean(memberData.profile && (memberData.profile.phone || memberData.profile.age || memberData.profile.address));
    const mergedProfile = existing.profile
      ? (incomingProfileHasData ? { ...existing.profile, ...memberData.profile } : existing.profile)
      : memberData.profile;
    const finalProfileRate = mergedProfile ? getProfileCompletionRate(mergedProfile) : existing.profileCompletion;

    const existingOnboardingRate = existing.onboarding ? getOnboardingCompletionRate(existing.onboarding) : 0;
    const incomingOnboardingHasData = Boolean(
      memberData.onboarding &&
      ((memberData.onboarding.completedSections && memberData.onboarding.completedSections.length > 0) ||
        memberData.onboarding.coreReasonWhy)
    );
    const mergedOnboarding = existing.onboarding
      ? (incomingOnboardingHasData ? { ...existing.onboarding, ...memberData.onboarding } : existing.onboarding)
      : memberData.onboarding;
    const finalOnboardingRate = mergedOnboarding ? getOnboardingCompletionRate(mergedOnboarding) : existing.onboardingCompletion;

    updatedMember = {
      ...existing,
      ...memberData,
      role: finalRole,
      lastLoginAt: new Date().toISOString(),
      profileCompletion: finalProfileRate,
      onboardingCompletion: finalOnboardingRate,
      consentStatus: isConsentWithdrawn ? 'withdrawn' : 'active',
      consentWithdrawnAt: isConsentWithdrawn ? (existing.consentWithdrawnAt || new Date().toISOString()) : undefined,
      profile: mergedProfile,
      onboarding: mergedOnboarding,
      weeklyEntries: existing.weeklyEntries || [],
    };
    members[existingIndex] = updatedMember;
  } else {
    const isConsentWithdrawn = Boolean(memberData.profile?.isConsentWithdrawn);
    updatedMember = {
      id: memberData.id || `usr_${Date.now()}`,
      email: normalizedEmail,
      name: memberData.name || normalizedEmail.split('@')[0],
      role: resolvedRole,
      avatarUrl: memberData.avatarUrl,
      joinedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      phone: memberData.profile?.phone || '',
      planId: memberData.planId,
      planName: memberData.planName,
      profileCompletion: profileRate,
      onboardingCompletion: onboardingRate,
      consentStatus: isConsentWithdrawn ? 'withdrawn' : 'active',
      consentWithdrawnAt: isConsentWithdrawn ? new Date().toISOString() : undefined,
      profile: memberData.profile,
      onboarding: memberData.onboarding,
    };
    members.unshift(updatedMember);
  }

  saveStoredMembers(members);

  // Also sync to backend API asynchronously if server is running
  try {
    getSupabaseAuthHeaders().then((authHeaders) => {
      fetch('/api/members/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(updatedMember),
      }).catch(() => {
        // server sync fallback
      });
    });
  } catch {
    // ignore
  }

  return updatedMember;
}

/**
 * Fetches all members. Super Admin only!
 * Automatically queries Supabase public.profiles table to instantly load
 * all users who authenticated via Google OAuth, merging them with any server/local records.
 */
export async function fetchAllMembersForAdmin(callerEmail?: string | null): Promise<AppMember[]> {
  if (!callerEmail) {
    throw new Error('Unauthorized. You must be signed in.');
  }

  // Determine caller role
  const role = determineUserRole(callerEmail);
  if (role !== 'admin' && !isDefaultAdmin(callerEmail)) {
    throw new Error('Access denied. Only Super Admins can view member data.');
  }

  // 1. Fetch server & local members as baseline
  let baseMembers: AppMember[] = [];
  try {
    const authHeaders = await getSupabaseAuthHeaders();
    const res = await fetch(`/api/members?caller=${encodeURIComponent(callerEmail)}`, {
      headers: authHeaders,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.members)) {
        baseMembers = data.members.filter((m: AppMember) => !isDummyMember(m));
      }
    }
  } catch {
    // Fall back to local storage
  }

  const localStored = getStoredMembers().filter((m) => !isDummyMember(m));
  if (baseMembers.length === 0) {
    baseMembers = localStored;
  } else {
    // Merge any localStored entries not yet on server
    for (const loc of localStored) {
      const locEmail = (loc.email || '').toLowerCase().trim();
      const idx = baseMembers.findIndex(
        (m) => (locEmail && m.email.toLowerCase().trim() === locEmail) || m.id === loc.id
      );
      if (idx === -1) {
        baseMembers.push(loc);
      }
    }
  }

  // 2. Query Supabase public.profiles and public.weekly_tracker_entries directly
  const supabase = getSupabase();
  if (supabase) {
    try {
      const [profilesRes, allSupabaseWeeklyByEmail] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        loadAllWeeklyEntriesFromSupabaseForAdmin(),
      ]);

      const profileRows = profilesRes.data;
      const error = profilesRes.error;

      if (!error && Array.isArray(profileRows) && profileRows.length > 0) {
        const mergedList: AppMember[] = [...baseMembers];

        for (const row of profileRows) {
          const profileData = row.profile_data || {};
          const onboardingData = row.onboarding_data || {};
          const firstName = row.first_name || profileData.firstName || '';
          const lastName = row.last_name || profileData.lastName || '';
          const fullName =
            row.full_name ||
            (firstName ? `${firstName} ${lastName}`.trim() : '') ||
            row.email?.split('@')[0] ||
            'Member';
          const email = (row.email || profileData.email || '').toLowerCase().trim();
          if (isDummyMember(email)) continue;
          const isEmailAdmin = isDefaultAdmin(email);
          const resolvedRole: UserRole = isEmailAdmin ? 'admin' : (row.role || 'unpaid');

          // Extract embedded weekly entries from profile_data + dedicated weekly_tracker_entries table
          const embeddedWeekly: WeeklyTrackerEntry[] = Array.isArray(profileData.weekly_entries)
            ? profileData.weekly_entries
            : [];
          const tableWeekly: WeeklyTrackerEntry[] = email && Array.isArray(allSupabaseWeeklyByEmail[email])
            ? allSupabaseWeeklyByEmail[email]
            : [];

          // Strip heavy internal arrays before passing profileData as UserProfile
          const {
            weekly_entries: _we,
            meal_plans: embeddedMealPlans,
            workout_plans: embeddedWorkoutPlans,
            ...cleanProfileFields
          } = profileData;

          // If member saved meal_plans or workout_plans in profile_data, merge into localStorage cache for instant Coach inspection
          if (typeof window !== 'undefined' && email) {
            if (Array.isArray(embeddedMealPlans) && embeddedMealPlans.length > 0) {
              try {
                const rawMp = localStorage.getItem('fk_meal_plans_v1');
                const parsedMp = rawMp ? JSON.parse(rawMp) : [];
                if (Array.isArray(parsedMp)) {
                  let mpChanged = false;
                  for (const p of embeddedMealPlans) {
                    if (!p || !p.id) continue;
                    const idx = parsedMp.findIndex((x: any) => x.id === p.id);
                    if (idx === -1) {
                      parsedMp.unshift(p);
                      mpChanged = true;
                    } else if (new Date(p.updatedAt || 0) > new Date(parsedMp[idx].updatedAt || 0)) {
                      parsedMp[idx] = p;
                      mpChanged = true;
                    }
                  }
                  if (mpChanged) localStorage.setItem('fk_meal_plans_v1', JSON.stringify(parsedMp));
                }
              } catch {
                // ignore
              }
            }
            if (Array.isArray(embeddedWorkoutPlans) && embeddedWorkoutPlans.length > 0) {
              try {
                const rawWp = localStorage.getItem('fk_workout_plans_v1');
                const parsedWp = rawWp ? JSON.parse(rawWp) : [];
                if (Array.isArray(parsedWp)) {
                  let wpChanged = false;
                  for (const p of embeddedWorkoutPlans) {
                    if (!p || !p.id) continue;
                    const idx = parsedWp.findIndex((x: any) => x.id === p.id);
                    if (idx === -1) {
                      parsedWp.unshift(p);
                      wpChanged = true;
                    } else if (new Date(p.updatedAt || 0) > new Date(parsedWp[idx].updatedAt || 0)) {
                      parsedWp[idx] = p;
                      wpChanged = true;
                    }
                  }
                  if (wpChanged) localStorage.setItem('fk_workout_plans_v1', JSON.stringify(parsedWp));
                }
              } catch {
                // ignore
              }
            }
          }

          const constructedProfile: UserProfile = {
            ...defaultUserProfile,
            ...cleanProfileFields,
            firstName: firstName || cleanProfileFields.firstName || '',
            lastName: lastName || cleanProfileFields.lastName || '',
            phone: row.phone || cleanProfileFields.phone || '',
            email: email || cleanProfileFields.email || '',
          };

          const hasRemoteOnboarding =
            onboardingData &&
            Object.keys(onboardingData).length > 0 &&
            (onboardingData.isSubmitted ||
              (Array.isArray(onboardingData.completedSections) && onboardingData.completedSections.length > 0) ||
              Boolean(onboardingData.coreReasonWhy) ||
              Boolean(onboardingData.currentWeightKg));

          const profileRate = getProfileCompletionRate(constructedProfile);
          const onboardingRate = hasRemoteOnboarding ? getOnboardingCompletionRate(onboardingData as ClientOnboarding) : 0;

          const existingIndex = mergedList.findIndex(
            (m) => (email && m.email.toLowerCase().trim() === email) || m.id === row.id
          );

          // Combine weekly entries from all sources (local, embedded in profile_data, and weekly_tracker_entries table)
          const existingWeekly = existingIndex >= 0 ? (mergedList[existingIndex].weeklyEntries || []) : [];
          const weeklyMap = new Map<string, WeeklyTrackerEntry>();
          [...existingWeekly, ...embeddedWeekly, ...tableWeekly].forEach((e) => {
            if (e && e.id) {
              const prev = weeklyMap.get(e.id);
              if (!prev || new Date(e.updatedAt || e.createdAt || 0) >= new Date(prev.updatedAt || prev.createdAt || 0)) {
                weeklyMap.set(e.id, e);
              }
            }
          });
          const mergedWeekly = Array.from(weeklyMap.values()).sort(
            (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
          );

          // Cache merged weekly entries to localStorage for this member so synchronous reads are fresh
          if (typeof window !== 'undefined' && email && mergedWeekly.length > 0) {
            safeLocalStorageSet(`fitkode_weekly_entries_${email}`, mergedWeekly);
          }

          // Cache remote profile & onboarding to localStorage for this member so Coach Dossier tabs see latest data
          if (typeof window !== 'undefined' && email) {
            if (profileRate > 0) {
              safeLocalStorageSet(`fitkode_profile_${email}`, constructedProfile);
            }
            if (hasRemoteOnboarding) {
              safeLocalStorageSet(`fitkode_onboarding_${email}`, {
                ...defaultClientOnboarding,
                ...onboardingData,
              });
            }
          }

          const existingMember = existingIndex >= 0 ? mergedList[existingIndex] : undefined;

          const memberObj: AppMember = {
            id: row.id || existingMember?.id || `usr_${Date.now()}`,
            email: email || existingMember?.email || '',
            name: fullName || existingMember?.name || 'Member',
            role: resolvedRole,
            avatarUrl: row.avatar_url || cleanProfileFields.avatarUrl || existingMember?.avatarUrl || '',
            joinedAt: row.created_at || existingMember?.joinedAt || new Date().toISOString(),
            lastLoginAt: row.updated_at || row.created_at || existingMember?.lastLoginAt || new Date().toISOString(),
            phone: row.phone || cleanProfileFields.phone || existingMember?.phone || '',
            planId: row.plan_id || cleanProfileFields.planId || existingMember?.planId,
            planName: row.plan_name || cleanProfileFields.planName || existingMember?.planName,
            planPurchasedAt: row.plan_purchased_at || cleanProfileFields.planPurchasedAt || existingMember?.planPurchasedAt,
            profileCompletion: profileRate,
            onboardingCompletion: onboardingRate,
            notes: row.notes || existingMember?.notes || '',
            profile: constructedProfile,
            onboarding: hasRemoteOnboarding
              ? {
                  ...defaultClientOnboarding,
                  ...onboardingData,
                }
              : existingMember?.onboarding,
            weeklyEntries: mergedWeekly,
          };

          if (existingIndex >= 0 && existingMember) {
            const nonEmptyRemoteProfile = Object.fromEntries(
              Object.entries(constructedProfile).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
            );
            const mergedProfileObj: UserProfile = {
              ...defaultUserProfile,
              ...(existingMember.profile || {}),
              ...nonEmptyRemoteProfile,
            };

            mergedList[existingIndex] = {
              ...existingMember,
              ...memberObj,
              phone: row.phone || cleanProfileFields.phone || existingMember.phone || '',
              profileCompletion: Math.max(getProfileCompletionRate(mergedProfileObj), existingMember.profileCompletion || 0),
              onboardingCompletion: hasRemoteOnboarding
                ? onboardingRate
                : Math.max(onboardingRate, existingMember.onboardingCompletion || 0),
              profile: mergedProfileObj,
              onboarding: hasRemoteOnboarding
                ? { ...(existingMember.onboarding || defaultClientOnboarding), ...onboardingData }
                : existingMember.onboarding || memberObj.onboarding,
              weeklyEntries: mergedWeekly,
              notes: row.notes || existingMember.notes || '',
            };
          } else {
            mergedList.push(memberObj);
          }
        }

        const sortedMerged = sortMembersBySignupDesc(mergedList.filter((m) => !isDummyMember(m)));
        saveStoredMembers(sortedMerged);
        return sortedMerged;
      }
    } catch (supaErr) {
      console.warn('Supabase profiles query notice:', supaErr);
    }
  }

  const sortedBase = sortMembersBySignupDesc(baseMembers.filter((m) => !isDummyMember(m)));
  saveStoredMembers(sortedBase);
  return sortedBase;
}

/**
 * Updates a member's role (Super Admin action).
 */
export async function updateMemberRole(
  memberId: string,
  newRole: UserRole,
  callerEmail?: string | null
): Promise<AppMember> {
  const callerRole = determineUserRole(callerEmail);
  if (callerRole !== 'admin' && !isDefaultAdmin(callerEmail)) {
    throw new Error('Access denied. Only Super Admin can change user roles.');
  }

  const members = getStoredMembers();
  const index = members.findIndex((m) => m.id === memberId || m.email.toLowerCase() === memberId.toLowerCase());
  if (index === -1) {
    throw new Error('Member not found.');
  }

  const targetEmail = members[index].email.toLowerCase().trim();
  members[index].role = newRole;
  saveStoredMembers(members);

  // 1. Sync to Supabase profiles table directly (matching by UUID or email safely)
  const supabase = getSupabase();
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId);
      const query = supabase.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() });
      if (isUuid) {
        await query.eq('id', memberId);
      } else if (targetEmail) {
        await query.ilike('email', targetEmail);
      }
    } catch {
      // ignore
    }
  }

  // 2. Sync to backend API
  try {
    const authHeaders = await getSupabaseAuthHeaders();
    await fetch(`/api/members/${encodeURIComponent(memberId)}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ role: newRole, callerEmail }),
    });
  } catch {
    // ignore
  }

  return members[index];
}

/**
 * Updates internal coach notes for a member.
 */
export function updateMemberNotes(memberId: string, notes: string): void {
  const members = getStoredMembers();
  const index = members.findIndex((m) => m.id === memberId || m.email.toLowerCase() === memberId.toLowerCase());
  if (index >= 0) {
    const targetEmail = members[index].email.toLowerCase().trim();
    members[index].notes = notes;
    saveStoredMembers(members);

    // Sync to Supabase profiles table safely
    const supabase = getSupabase();
    if (supabase) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId);
        const query = supabase.from('profiles').update({ notes, updated_at: new Date().toISOString() });
        if (isUuid) {
          query.eq('id', memberId).then(() => {});
        } else if (targetEmail) {
          query.ilike('email', targetEmail).then(() => {});
        }
      } catch {
        // ignore
      }
    }

    // Also sync to backend API
    try {
      getSupabaseAuthHeaders().then((authHeaders) => {
        fetch('/api/members/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            id: memberId,
            email: targetEmail,
            notes,
          }),
        }).catch(() => {});
      });
    } catch {
      // ignore
    }
  }
}


