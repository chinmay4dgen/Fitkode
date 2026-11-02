import { WeeklyTrackerEntry, AppMember } from '../types';
import { isDefaultAdmin, getStoredMembers, updateMemberWeeklyEntries } from './memberStore';
import { notifyWeeklyTrackerSubmitted } from './communicationService';
import {
  saveWeeklyEntriesToSupabase,
  loadWeeklyEntriesFromSupabase,
  deleteWeeklyEntryFromSupabase,
  loadAllWeeklyEntriesFromSupabaseForAdmin,
  uploadProgressPhotoToSupabase,
  getSupabaseAuthHeaders,
} from './supabase';
import { safeLocalStorageSet } from './storageGuard';

// Pre-seeded weekly entries for real enrolled Fitkode members (no @example.com dummy entries)
export const SEED_WEEKLY_ENTRIES: WeeklyTrackerEntry[] = [
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
  {
    id: 'chk_chinmayright_w1',
    userId: 'usr_chinmay_right',
    userEmail: 'chinmayright@gmail.com',
    firstName: 'ChInMaY',
    lastName: 'JaIn',
    checkInDate: '2026-09-05',
    weekNumber: 1,
    avgStepsPerDay: 7500,
    weightKg: 74,
    waistInches: 34,
    hipsInches: 38,
    neckInches: 15,
    quadsInches: 21.5,
    chestInches: 39,
    upperRightArmInches: 13.5,
    resistanceWorkoutDays: 4,
    hiitCardioDays: 1,
    avgCaloriesPerDay: 2000,
    frontPicUrl: '',
    leftPicUrl: '',
    rightPicUrl: '',
    backPicUrl: '',
    challengesFaced: 'Initial baseline check-in.',
    coachFeedback: '',
    createdAt: '2026-09-05T09:45:00Z',
  },
  {
    id: 'chk_chinmayadmin_w1',
    userId: 'usr_chinmay_admin',
    userEmail: 'chinmay4jain@gmail.com',
    firstName: 'Chinmay',
    lastName: 'Jain',
    checkInDate: '2026-09-05',
    weekNumber: 1,
    avgStepsPerDay: 10000,
    weightKg: 70,
    waistInches: 31.5,
    hipsInches: 37,
    neckInches: 15,
    quadsInches: 22.5,
    chestInches: 40.5,
    upperRightArmInches: 14.5,
    resistanceWorkoutDays: 5,
    hiitCardioDays: 2,
    avgCaloriesPerDay: 2200,
    frontPicUrl: '',
    leftPicUrl: '',
    rightPicUrl: '',
    backPicUrl: '',
    challengesFaced: 'Coach baseline entry.',
    coachFeedback: '',
    createdAt: '2026-09-05T08:30:00Z',
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
        // Check if there are newly added seed entries or member store entries not yet in this local cache
        const seeded = SEED_WEEKLY_ENTRIES.filter((e) => e.userEmail.toLowerCase().trim() === normalized);
        const existingIds = new Set(parsed.map((e: any) => e.id));
        let changed = false;
        const merged = [...parsed];

        for (const s of seeded) {
          if (!existingIds.has(s.id)) {
            merged.push(s);
            existingIds.add(s.id);
            changed = true;
          }
        }

        if (fallbackMember?.weeklyEntries && fallbackMember.weeklyEntries.length > 0) {
          for (const fe of fallbackMember.weeklyEntries) {
            if (!existingIds.has(fe.id)) {
              merged.push(fe);
              existingIds.add(fe.id);
              changed = true;
            }
          }
        }

        if (changed) {
          safeLocalStorageSet(key, merged);
        }

        // Sort reverse chronological (newest first)
        return merged.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
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
    safeLocalStorageSet(key, seeded);
    return seeded.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
  }

  // Tier 2: Check member store registry for embedded weeklyEntries
  try {
    const members = getStoredMembers();
    const matched = members.find(
      (m) => m.email?.toLowerCase().trim() === normalized || m.id === normalized
    );
    if (matched?.weeklyEntries && matched.weeklyEntries.length > 0) {
      safeLocalStorageSet(key, matched.weeklyEntries);
      return matched.weeklyEntries.sort(
        (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
      );
    }
  } catch {
    // ignore
  }

  // Tier 3: Check fallbackMember passed directly
  if (fallbackMember?.weeklyEntries && fallbackMember.weeklyEntries.length > 0) {
    safeLocalStorageSet(key, fallbackMember.weeklyEntries);
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
    safeLocalStorageSet(key, [baselineEntry]);
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

  // Save to client localStorage with 5MB quota protection
  safeLocalStorageSet(key, updatedList);

  // Keep member registry in sync
  try {
    updateMemberWeeklyEntries(normUser, updatedList);
  } catch {
    // ignore
  }

  // 1. Sync directly to Express Backend API
  try {
    getSupabaseAuthHeaders().then((authHeaders) => {
      fetch('/api/weekly-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ entry: updatedEntry, callerEmail }),
      }).catch((err) => {
        console.warn('[saveWeeklyEntry] Backend sync notice:', err);
      });
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
 * Asynchronously fetches a user's weekly check-ins from BOTH:
 * 1. Supabase (dedicated table + profiles.profile_data.weekly_entries)
 * 2. Express backend API (/api/weekly-tracker)
 * 3. Local storage & seed data fallback
 * Merges entries by ID/timestamp so fresh check-ins from any device are never shadowed by stale seed records.
 */
export async function fetchUserWeeklyEntries(
  userEmail: string,
  callerEmail?: string
): Promise<WeeklyTrackerEntry[]> {
  if (!userEmail) return [];
  const normUser = userEmail.toLowerCase().trim();
  const normCaller = (callerEmail || userEmail).toLowerCase().trim();
  const key = getStorageKey(normUser);

  const byId = new Map<string, WeeklyTrackerEntry>();

  const mergeEntries = (list: WeeklyTrackerEntry[] | null | undefined) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!item || !item.id) continue;
      const existing = byId.get(item.id);
      if (!existing) {
        byId.set(item.id, item);
      } else {
        const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const incomingTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
        if (incomingTime >= existingTime) {
          byId.set(item.id, { ...existing, ...item });
        }
      }
    }
  };

  // Start with current local/seeded baseline
  mergeEntries(loadUserWeeklyEntries(normUser));

  // Fetch Backend API and Supabase in parallel so neither blocks or shadows the other
  const authHeaders = await getSupabaseAuthHeaders();
  const [apiEntries, sbEntries] = await Promise.all([
    fetch(
      `/api/weekly-tracker?userEmail=${encodeURIComponent(normUser)}&callerEmail=${encodeURIComponent(normCaller)}`,
      { headers: authHeaders }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (Array.isArray(data?.entries) ? (data.entries as WeeklyTrackerEntry[]) : null))
      .catch(() => null),
    loadWeeklyEntriesFromSupabase(normUser).catch(() => null),
  ]);

  mergeEntries(apiEntries);
  mergeEntries(sbEntries);

  const merged = Array.from(byId.values()).sort(
    (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
  );

  if (merged.length > 0) {
    safeLocalStorageSet(key, merged);
    try {
      updateMemberWeeklyEntries(normUser, merged);
    } catch {
      // ignore
    }
  }

  return merged;
}

/**
 * Deletes a weekly check-in entry across localStorage, Supabase, and backend API.
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

  safeLocalStorageSet(key, filtered);

  try {
    updateMemberWeeklyEntries(normUser, filtered);
  } catch {
    // ignore
  }

  try {
    deleteWeeklyEntryFromSupabase(entryId, normUser, filtered).catch(() => {});
  } catch {
    // ignore
  }

  try {
    getSupabaseAuthHeaders().then((authHeaders) => {
      fetch(`/api/weekly-tracker/${encodeURIComponent(entryId)}?callerEmail=${encodeURIComponent(callerEmail)}&userEmail=${encodeURIComponent(normUser)}`, {
        method: 'DELETE',
        headers: authHeaders,
      }).catch(() => {});
    });
  } catch {
    // ignore
  }

  return filtered;
}

/**
 * Fetches all weekly check-ins across all members (local + Express server + Supabase).
 * PRIVACY RESTRICTION: Only Super Admin Chinmay (or admin role) can call this.
 */
export async function loadAllWeeklyEntriesForAdmin(
  callerEmail?: string | null
): Promise<Record<string, WeeklyTrackerEntry[]>> {
  if (!callerEmail || !isDefaultAdmin(callerEmail)) {
    throw new Error('Access Denied: Only Super Admin Chinmay can inspect other members weekly tracker data.');
  }

  const result: Record<string, WeeklyTrackerEntry[]> = {};

  const mergeForEmail = (email: string, entries: WeeklyTrackerEntry[]) => {
    const norm = email.toLowerCase().trim();
    if (!norm || !Array.isArray(entries) || entries.length === 0) return;
    const existing = result[norm] || [];
    const byId = new Map<string, WeeklyTrackerEntry>();
    for (const item of existing) {
      if (item?.id) byId.set(item.id, item);
    }
    for (const item of entries) {
      if (!item?.id) continue;
      const prev = byId.get(item.id);
      if (!prev) {
        byId.set(item.id, item);
      } else {
        const prevTime = new Date(prev.updatedAt || prev.createdAt || 0).getTime();
        const nextTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
        if (nextTime >= prevTime) {
          byId.set(item.id, { ...prev, ...item });
        }
      }
    }
    const mergedList = Array.from(byId.values()).sort(
      (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
    );
    result[norm] = mergedList;
    if (typeof window !== 'undefined') {
      safeLocalStorageSet(getStorageKey(norm), mergedList);
    }
  };

  // 1. Group seed entries
  SEED_WEEKLY_ENTRIES.forEach((e) => {
    const email = e.userEmail.toLowerCase().trim();
    mergeForEmail(email, [e]);
  });

  // 2. Check localStorage keys
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
              mergeForEmail(email, list);
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // 3. Query server API & Supabase in parallel for live entries across all members
  const authHeaders = await getSupabaseAuthHeaders();
  const [serverData, sbData] = await Promise.all([
    fetch(`/api/weekly-tracker/all?callerEmail=${encodeURIComponent(callerEmail)}`, {
      headers: authHeaders,
    })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null),
    loadAllWeeklyEntriesFromSupabaseForAdmin().catch(() => ({})),
  ]);

  if (serverData?.entriesByEmail && typeof serverData.entriesByEmail === 'object') {
    Object.entries(serverData.entriesByEmail).forEach(([email, entries]) => {
      if (Array.isArray(entries)) {
        mergeForEmail(email, entries as WeeklyTrackerEntry[]);
      }
    });
  }

  if (sbData && typeof sbData === 'object') {
    Object.entries(sbData).forEach(([email, entries]) => {
      if (Array.isArray(entries)) {
        mergeForEmail(email, entries as WeeklyTrackerEntry[]);
      }
    });
  }

  return result;
}

/**
 * Compresses an uploaded image file into a compact JPEG (bounding both width & height <= maxDimension,
 * and stepping down quality if needed so fallback data URLs stay under ~100KB), then attempts to upload
 * to Supabase Storage (`progress-photos` bucket) with automatic fallback to the compact data URL.
 */
export function compressImageFile(
  file: File,
  maxDimension = 1000,
  quality = 0.72,
  userEmail?: string,
  pose?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        let currentQuality = quality;
        let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);

        // Keep dataUrl compact (< ~110KB base64) so JSONB fallback never bloats Postgres rows
        while (dataUrl.length > 150000 && currentQuality > 0.42) {
          currentQuality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        }

        if (userEmail && pose) {
          try {
            const uploadedUrl = await uploadProgressPhotoToSupabase(dataUrl, userEmail, pose);
            resolve(uploadedUrl);
            return;
          } catch {
            // Fall through to compact dataUrl
          }
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}
