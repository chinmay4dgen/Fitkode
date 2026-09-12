import { WeeklyTrackerEntry, AppMember } from '../types';
import { isDefaultAdmin, getStoredMembers, updateMemberWeeklyEntries } from './memberStore';
import { notifyWeeklyTrackerSubmitted } from './communicationService';
import { saveWeeklyEntriesToSupabase, loadWeeklyEntriesFromSupabase } from './supabase';

// Realistic sample progression check-ins for demo members
export const SEED_WEEKLY_ENTRIES: WeeklyTrackerEntry[] = [
  // --- Atul Gupta (akg.atulgupta@gmail.com) Check-ins ---
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
    waistInches: 36.0,
    hipsInches: 39.0,
    neckInches: 15.5,
    quadsInches: 22.0,
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
  // --- Priya Sharma (usr_001_priya) Check-ins (4 consecutive weeks) ---
  {
    id: 'chk_priya_w1',
    userId: 'usr_001_priya',
    userEmail: 'priya.sharma@example.com',
    firstName: 'Priya',
    lastName: 'Sharma',
    checkInDate: '2026-08-15',
    weekNumber: 1,
    avgStepsPerDay: 8200,
    weightKg: 67.2,
    waistInches: 32.5,
    hipsInches: 40.0,
    neckInches: 13.5,
    quadsInches: 22.5,
    chestInches: 36.5,
    upperRightArmInches: 12.0,
    resistanceWorkoutDays: 3,
    hiitCardioDays: 2,
    avgCaloriesPerDay: 1950,
    frontPicUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    leftPicUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
    rightPicUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
    backPicUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&auto=format&fit=crop&q=80',
    challengesFaced: 'Getting back into a rhythm post-partum was tough the first 3 days. Struggled with evening hunger around 6 PM.',
    coachFeedback: 'Great baseline kickoff Priya! Adjusted your evening snack to sprouted moong chaat with cucumber for higher satiety.',
    createdAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'chk_priya_w2',
    userId: 'usr_001_priya',
    userEmail: 'priya.sharma@example.com',
    firstName: 'Priya',
    lastName: 'Sharma',
    checkInDate: '2026-08-22',
    weekNumber: 2,
    avgStepsPerDay: 9100,
    weightKg: 66.3,
    waistInches: 31.8,
    hipsInches: 39.5,
    neckInches: 13.2,
    quadsInches: 22.2,
    chestInches: 36.2,
    upperRightArmInches: 11.8,
    resistanceWorkoutDays: 4,
    hiitCardioDays: 2,
    avgCaloriesPerDay: 1850,
    frontPicUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    leftPicUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
    rightPicUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
    backPicUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&auto=format&fit=crop&q=80',
    challengesFaced: 'Had a family dinner on Thursday, but managed to stick to grilled paneer and salad. Energy was much better!',
    coachFeedback: 'Solid discipline at the family dinner! Down 0.9kg and 0.7 inches off the waist already. Keep hydrating.',
    createdAt: '2026-08-22T08:30:00Z',
  },
  {
    id: 'chk_priya_w3',
    userId: 'usr_001_priya',
    userEmail: 'priya.sharma@example.com',
    firstName: 'Priya',
    lastName: 'Sharma',
    checkInDate: '2026-08-29',
    weekNumber: 3,
    avgStepsPerDay: 9800,
    weightKg: 65.4,
    waistInches: 31.0,
    hipsInches: 38.8,
    neckInches: 13.0,
    quadsInches: 21.8,
    chestInches: 35.8,
    upperRightArmInches: 11.6,
    resistanceWorkoutDays: 4,
    hiitCardioDays: 3,
    avgCaloriesPerDay: 1800,
    frontPicUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    leftPicUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
    rightPicUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
    backPicUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&auto=format&fit=crop&q=80',
    challengesFaced: 'Felt slight soreness in hamstrings on Wednesday after Romanian Deadlifts, but rested adequately.',
    coachFeedback: 'Hamstring soreness is normal adaptation. Make sure to do the post-workout dynamic hip stretches.',
    createdAt: '2026-08-29T08:45:00Z',
  },
  {
    id: 'chk_priya_w4',
    userId: 'usr_001_priya',
    userEmail: 'priya.sharma@example.com',
    firstName: 'Priya',
    lastName: 'Sharma',
    checkInDate: '2026-09-05',
    weekNumber: 4,
    avgStepsPerDay: 10400,
    weightKg: 64.5,
    waistInches: 30.5,
    hipsInches: 38.0,
    neckInches: 13.0,
    quadsInches: 21.5,
    chestInches: 35.5,
    upperRightArmInches: 11.5,
    resistanceWorkoutDays: 4,
    hiitCardioDays: 3,
    avgCaloriesPerDay: 1780,
    frontPicUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    leftPicUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
    rightPicUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
    backPicUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&auto=format&fit=crop&q=80',
    challengesFaced: 'No major hurdles! Clothes feel significantly looser around waist and hips. Loving the daily consistency.',
    coachFeedback: 'Milestone achievement! -2.7 kg and -2 full inches off the waist in 1 month. Maintaining protocol for Month 2.',
    createdAt: '2026-09-05T09:15:00Z',
  },

  // --- Rahul Mehta (usr_002_rahul) Check-ins (3 weeks) ---
  {
    id: 'chk_rahul_w1',
    userId: 'usr_002_rahul',
    userEmail: 'rahul.mehta@example.com',
    firstName: 'Rahul',
    lastName: 'Mehta',
    checkInDate: '2026-08-20',
    weekNumber: 1,
    avgStepsPerDay: 6200,
    weightKg: 84.8,
    waistInches: 36.0,
    hipsInches: 40.5,
    neckInches: 16.0,
    quadsInches: 22.8,
    chestInches: 39.8,
    upperRightArmInches: 13.8,
    resistanceWorkoutDays: 3,
    hiitCardioDays: 1,
    avgCaloriesPerDay: 2400,
    frontPicUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    leftPicUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    rightPicUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
    backPicUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    challengesFaced: 'Sedentary desk job made hitting 6k steps tough during conference calls.',
    coachFeedback: 'Let us introduce 10-minute post-meal brisk walks to push your daily step baseline up to 8,000.',
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'chk_rahul_w2',
    userId: 'usr_002_rahul',
    userEmail: 'rahul.mehta@example.com',
    firstName: 'Rahul',
    lastName: 'Mehta',
    checkInDate: '2026-08-27',
    weekNumber: 2,
    avgStepsPerDay: 7900,
    weightKg: 83.5,
    waistInches: 35.2,
    hipsInches: 39.8,
    neckInches: 15.8,
    quadsInches: 22.4,
    chestInches: 39.4,
    upperRightArmInches: 13.6,
    resistanceWorkoutDays: 4,
    hiitCardioDays: 2,
    avgCaloriesPerDay: 2200,
    frontPicUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    leftPicUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    rightPicUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
    backPicUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    challengesFaced: 'Slept late on Tuesday due to production sprint. Drank extra black coffee.',
    coachFeedback: 'Prioritize turning off screens 45 mins before bedtime to keep cortisol and visceral fat retention low.',
    createdAt: '2026-08-27T09:30:00Z',
  },
  {
    id: 'chk_rahul_w3',
    userId: 'usr_002_rahul',
    userEmail: 'rahul.mehta@example.com',
    firstName: 'Rahul',
    lastName: 'Mehta',
    checkInDate: '2026-09-04',
    weekNumber: 3,
    avgStepsPerDay: 8600,
    weightKg: 82.4,
    waistInches: 34.5,
    hipsInches: 39.0,
    neckInches: 15.5,
    quadsInches: 22.0,
    chestInches: 39.0,
    upperRightArmInches: 13.5,
    resistanceWorkoutDays: 4,
    hiitCardioDays: 2,
    avgCaloriesPerDay: 2150,
    frontPicUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
    leftPicUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    rightPicUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
    backPicUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    challengesFaced: 'Cardio feeling easier. Lower back stiffness has significantly reduced with the core workouts.',
    coachFeedback: 'Down 2.4kg in 3 weeks and waist has reduced 1.5 inches. Perfect steady trajectory Rahul!',
    createdAt: '2026-09-04T08:15:00Z',
  },
];

function getStorageKey(userEmail: string): string {
  const normalized = (userEmail || 'anonymous').toLowerCase().trim();
  return `fitkode_weekly_entries_${normalized}`;
}

/**
 * Loads weekly entries for a specific client.
 * Multi-tier resolution:
 * 1. Client localStorage cache
 * 2. Pre-seeded sample entries (SEED_WEEKLY_ENTRIES)
 * 3. Member store (getStoredMembers().weeklyEntries)
 * 4. Direct fallback member passed in
 * 5. Synthesized baseline check-in from onboarding measurements
 */
export function loadUserWeeklyEntries(userEmail: string, fallbackMember?: AppMember): WeeklyTrackerEntry[] {
  if (typeof window === 'undefined' || !userEmail) return [];
  const normalized = userEmail.toLowerCase().trim();
  const key = getStorageKey(normalized);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sort reverse chronological (newest first)
        return parsed.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
      }
    }
  } catch (err) {
    console.warn('Error parsing user weekly entries:', err);
  }

  // Tier 1: Check pre-seeded tracker entries (e.g. Atul Gupta, Priya Sharma)
  const seeded = SEED_WEEKLY_ENTRIES.filter(
    (e) => e.userEmail.toLowerCase().trim() === normalized
  );

  if (seeded.length > 0) {
    try {
      localStorage.setItem(key, JSON.stringify(seeded));
    } catch {
      // ignore
    }
    return seeded.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
  }

  // Tier 2: Check member store registry for embedded weeklyEntries
  try {
    const members = getStoredMembers();
    const matched = members.find(
      (m) => m.email?.toLowerCase().trim() === normalized || m.id === normalized
    );
    if (matched?.weeklyEntries && matched.weeklyEntries.length > 0) {
      try {
        localStorage.setItem(key, JSON.stringify(matched.weeklyEntries));
      } catch {
        // ignore
      }
      return matched.weeklyEntries.sort(
        (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
      );
    }
  } catch {
    // ignore
  }

  // Tier 3: Check fallbackMember passed directly
  if (fallbackMember?.weeklyEntries && fallbackMember.weeklyEntries.length > 0) {
    try {
      localStorage.setItem(key, JSON.stringify(fallbackMember.weeklyEntries));
    } catch {
      // ignore
    }
    return fallbackMember.weeklyEntries.sort(
      (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
    );
  }

  // Tier 4: If member has completed health onboarding with body measurements, synthesize baseline Week 1 check-in!
  const targetMember = fallbackMember || getStoredMembers().find(
    (m) => m.email?.toLowerCase().trim() === normalized
  );
  if (targetMember?.onboarding?.currentWeightKg) {
    const ob = targetMember.onboarding;
    const baselineEntry: WeeklyTrackerEntry = {
      id: `chk_baseline_${targetMember.id || normalized.replace(/[^a-z0-9]/g, '_')}`,
      userId: targetMember.id || normalized,
      userEmail: normalized,
      firstName: targetMember.profile?.firstName || targetMember.name?.split(' ')[0] || 'Member',
      lastName: targetMember.profile?.lastName || targetMember.name?.split(' ').slice(1).join(' ') || '',
      checkInDate: targetMember.joinedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      weekNumber: 1,
      avgStepsPerDay: 8000,
      weightKg: parseFloat(ob.currentWeightKg) || 72.8,
      waistInches: parseFloat(ob.waistInches || '36') || 36,
      hipsInches: parseFloat(ob.hipInches || '39') || 39,
      neckInches: parseFloat(ob.neckInches || '15.5') || 15.5,
      quadsInches: parseFloat(ob.quadricepsInches || '22') || 22,
      chestInches: parseFloat(ob.chestInches || '39.5') || 39.5,
      upperRightArmInches: parseFloat(ob.upperArmInches || '13.5') || 13.5,
      resistanceWorkoutDays: parseInt(ob.physicalActivityDaysPerWeek || '3', 10) || 3,
      hiitCardioDays: 1,
      avgCaloriesPerDay: 2050,
      frontPicUrl: '',
      leftPicUrl: '',
      rightPicUrl: '',
      backPicUrl: '',
      challengesFaced: ob.biggestNutritionChallenges || 'Managing corporate desk job and daily step counts.',
      coachFeedback: 'Initial baseline intake measurements recorded from onboarding assessment.',
      createdAt: targetMember.joinedAt || new Date().toISOString(),
    };
    try {
      localStorage.setItem(key, JSON.stringify([baselineEntry]));
    } catch {
      // ignore
    }
    return [baselineEntry];
  }

  return [];
}

/**
 * Saves a weekly check-in entry for a user.
 * Enforces privacy: caller must either match userEmail OR be Super Admin Chinmay.
 */
export async function saveWeeklyEntry(
  entry: WeeklyTrackerEntry,
  callerEmail: string
): Promise<WeeklyTrackerEntry[]> {
  const normUser = entry.userEmail.toLowerCase().trim();
  const normCaller = callerEmail.toLowerCase().trim();

  const isSelf = normCaller === normUser;
  const isAdmin = isDefaultAdmin(normCaller);

  if (!isSelf && !isAdmin) {
    throw new Error('Access denied: You cannot add or modify check-ins for another member.');
  }

  const key = getStorageKey(normUser);
  const currentEntries = loadUserWeeklyEntries(normUser);

  const existingIndex = currentEntries.findIndex((e) => e.id === entry.id);
  const updatedEntry: WeeklyTrackerEntry = {
    ...entry,
    userEmail: normUser,
    updatedAt: new Date().toISOString(),
  };

  let updatedList: WeeklyTrackerEntry[];
  if (existingIndex >= 0) {
    updatedList = [...currentEntries];
    updatedList[existingIndex] = updatedEntry;
  } else {
    updatedList = [updatedEntry, ...currentEntries];
  }

  // Sort descending by check-in date
  updatedList.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

  // Save to client localStorage
  try {
    localStorage.setItem(key, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Error saving weekly entry to localStorage:', err);
  }

  // Keep member registry in sync
  try {
    updateMemberWeeklyEntries(normUser, updatedList);
  } catch {
    // ignore
  }

  // 1. Sync directly to Express Backend API
  try {
    fetch('/api/weekly-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry: updatedEntry, callerEmail }),
    }).catch((err) => {
      console.warn('[saveWeeklyEntry] Backend sync notice:', err);
    });
  } catch {
    // ignore
  }

  // 2. Sync directly to Supabase
  try {
    saveWeeklyEntriesToSupabase(normUser, updatedList).catch((err) => {
      console.warn('[saveWeeklyEntry] Supabase sync notice:', err);
    });
  } catch {
    // ignore
  }

  // 3. Asynchronously dispatch notification to Coach Chinmay (myfitkode@gmail.com)
  notifyWeeklyTrackerSubmitted(updatedEntry, callerEmail).catch((err) => {
    console.warn('[saveWeeklyEntry] Failed to dispatch coach weekly tracker notification:', err);
  });

  return updatedList;
}

/**
 * Asynchronously fetches a user's weekly check-ins from:
 * 1. Express backend API (/api/weekly-tracker)
 * 2. Supabase (if configured)
 * 3. Local storage & seed data fallback
 * Updates client-side localStorage so subsequent synchronous reads are also fresh.
 */
export async function fetchUserWeeklyEntries(
  userEmail: string,
  callerEmail?: string
): Promise<WeeklyTrackerEntry[]> {
  if (!userEmail) return [];
  const normUser = userEmail.toLowerCase().trim();
  const normCaller = (callerEmail || userEmail).toLowerCase().trim();
  const key = getStorageKey(normUser);

  // 1. Try Backend API
  try {
    const res = await fetch(
      `/api/weekly-tracker?userEmail=${encodeURIComponent(normUser)}&callerEmail=${encodeURIComponent(normCaller)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.entries) && data.entries.length > 0) {
        // Cache to localStorage
        try {
          localStorage.setItem(key, JSON.stringify(data.entries));
        } catch {
          // ignore
        }
        return data.entries;
      }
    }
  } catch (err) {
    // Backend fetch failed or network offline
  }

  // 2. Try Supabase
  try {
    const sbEntries = await loadWeeklyEntriesFromSupabase(normUser);
    if (Array.isArray(sbEntries) && sbEntries.length > 0) {
      try {
        localStorage.setItem(key, JSON.stringify(sbEntries));
      } catch {
        // ignore
      }
      return sbEntries.sort(
        (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
      );
    }
  } catch {
    // ignore
  }

  // 3. Fallback to localStorage & seed data
  return loadUserWeeklyEntries(normUser);
}

/**
 * Deletes a weekly check-in entry.
 */
export async function deleteWeeklyEntry(
  entryId: string,
  userEmail: string,
  callerEmail: string
): Promise<WeeklyTrackerEntry[]> {
  const normUser = userEmail.toLowerCase().trim();
  const normCaller = callerEmail.toLowerCase().trim();

  const isSelf = normCaller === normUser;
  const isAdmin = isDefaultAdmin(normCaller);

  if (!isSelf && !isAdmin) {
    throw new Error('Access denied: You cannot delete check-ins for another member.');
  }

  const key = getStorageKey(normUser);
  const currentEntries = loadUserWeeklyEntries(normUser);
  const filtered = currentEntries.filter((e) => e.id !== entryId);

  try {
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error deleting weekly entry:', err);
  }

  try {
    saveWeeklyEntriesToSupabase(normUser, filtered).catch(() => {});
  } catch {
    // ignore
  }

  try {
    fetch(`/api/weekly-tracker/${encodeURIComponent(entryId)}?callerEmail=${encodeURIComponent(callerEmail)}&userEmail=${encodeURIComponent(normUser)}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {
    // ignore
  }

  return filtered;
}

/**
 * Fetches all weekly check-ins across all members.
 * PRIVACY RESTRICTION: Only Super Admin Chinmay (or admin role) can call this.
 */
export async function loadAllWeeklyEntriesForAdmin(
  callerEmail?: string | null
): Promise<Record<string, WeeklyTrackerEntry[]>> {
  if (!callerEmail || !isDefaultAdmin(callerEmail)) {
    throw new Error('Access Denied: Only Super Admin Chinmay can inspect other members weekly tracker data.');
  }

  // Assemble from local storage keys and seed data first
  const result: Record<string, WeeklyTrackerEntry[]> = {};

  // Group seed entries
  SEED_WEEKLY_ENTRIES.forEach((e) => {
    const email = e.userEmail.toLowerCase().trim();
    if (!result[email]) result[email] = [];
    result[email].push(e);
  });

  // Check localStorage keys
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fitkode_weekly_entries_')) {
        const email = key.replace('fitkode_weekly_entries_', '');
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list) && list.length > 0) {
              result[email] = list.sort(
                (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
              );
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // Query server API for live entries across all members
  try {
    const res = await fetch(`/api/weekly-tracker/all?callerEmail=${encodeURIComponent(callerEmail)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.entriesByEmail && typeof data.entriesByEmail === 'object') {
        Object.entries(data.entriesByEmail).forEach(([email, entries]) => {
          const norm = email.toLowerCase().trim();
          if (Array.isArray(entries) && entries.length > 0) {
            result[norm] = entries;
            // Also cache to localStorage for fast local access
            try {
              localStorage.setItem(getStorageKey(norm), JSON.stringify(entries));
            } catch {
              // ignore
            }
          }
        });
      }
    }
  } catch {
    // fallback
  }

  return result;
}

/**
 * Compresses an uploaded image file into a base64 data URL for fast preview and storage.
 */
export function compressImageFile(file: File, maxWidth = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}
