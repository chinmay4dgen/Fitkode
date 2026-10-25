import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  enqueueOfflineSync,
  getOfflineSyncQueue,
  removeOfflineSyncItem,
  stripHeavyBase64ForLocalCache,
} from './storageGuard';

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
let supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let client: SupabaseClient | null = null;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(val?: string | null): boolean {
  return Boolean(val && UUID_REGEX.test(val.trim()));
}

function isValidConfig(url: string, key: string): boolean {
  return Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('placeholder') &&
    !url.includes('<your-project-ref>')
  );
}

export function initSupabase(url: string, key: string): SupabaseClient | null {
  if (!isValidConfig(url, key)) {
    return null;
  }
  // Reuse existing client if already initialized with identical credentials
  if (client && supabaseUrl === url && supabaseAnonKey === key) {
    return client;
  }
  try {
    supabaseUrl = url;
    supabaseAnonKey = key;
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    });
    return client;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Initial attempt with build-time env vars
if (isValidConfig(supabaseUrl, supabaseAnonKey)) {
  initSupabase(supabaseUrl, supabaseAnonKey);
}

export function getSupabase(): SupabaseClient | null {
  return client;
}

export const isSupabaseConfigured = () => Boolean(client && isValidConfig(supabaseUrl, supabaseAnonKey));

// Export supabase getter proxy for convenience
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!client) {
      return undefined;
    }
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});

/**
 * Helper to get the current authenticated user from local session first (0 network calls),
 * falling back to getUser() only if needed. Also cleans up any legacy bloated user_metadata
 * keys (such as base64 photos in fitkode_weekly_entries) so the user's JWT stays < 2KB.
 */
let hasCleanedMetadataSession = false;

async function getCurrentSessionUser() {
  if (!client) return null;
  try {
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData?.session?.user || null;

    if (user && !hasCleanedMetadataSession) {
      hasCleanedMetadataSession = true;
      const meta = user.user_metadata || {};
      if (meta.fitkode_weekly_entries || meta.latest_ai_meal_plan) {
        // Strip heavy arrays/base64 photos from Auth JWT metadata asynchronously
        client.auth
          .updateUser({
            data: {
              fitkode_weekly_entries: null,
              latest_ai_meal_plan: null,
            },
          })
          .catch(() => {});
      }
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Returns HTTP Authorization headers with the active Supabase JWT access token (if signed in)
 * so Express `/api/*` endpoints can cryptographically verify the caller's identity.
 */
export async function getSupabaseAuthHeaders(): Promise<Record<string, string>> {
  if (!client) return {};
  try {
    const { data } = await client.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Initiates Google OAuth Sign-in with Supabase.
 * Uses popup handling if inside an iframe or requested, otherwise direct redirect.
 */
export async function signInWithGoogle(options?: { usePopup?: boolean }) {
  if (!client) {
    throw new Error(
      'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Settings > Secrets.'
    );
  }

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const shouldOpenPopup = options?.usePopup ?? isIframe;

  if (shouldOpenPopup) {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    if (data?.url) {
      const width = 520;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        data.url,
        'supabase_google_auth',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = data.url;
      }
      return { data, error: null };
    }
  }

  return client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
}

/**
 * Signs out the current user session.
 */
export async function signOut() {
  if (!client) return;
  hasCleanedMetadataSession = false;
  const { error } = await client.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
}

/**
 * Helper to locate a profile row in `public.profiles` by UUID or Email,
 * returning its `id`, `email`, `profile_data`, and `onboarding_data`.
 */
async function findExistingProfileRow(userIdOrEmail?: string, fallbackEmail?: string) {
  if (!client) return null;
  const candidate = (userIdOrEmail || '').trim();
  const emailCandidate = (
    fallbackEmail ||
    (candidate.includes('@') ? candidate : '')
  )
    .toLowerCase()
    .trim();

  try {
    if (isValidUuid(candidate)) {
      const { data, error } = await client
        .from('profiles')
        .select('id, email, profile_data, onboarding_data')
        .eq('id', candidate)
        .maybeSingle();
      if (!error && data) return data;
    }

    if (emailCandidate) {
      const { data, error } = await client
        .from('profiles')
        .select('id, email, profile_data, onboarding_data')
        .ilike('email', emailCandidate)
        .maybeSingle();
      if (!error && data) return data;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Saves all user profile fields into Supabase `public.profiles` while preserving
 * any embedded `weekly_entries`, `meal_plans`, and `workout_plans` in `profile_data`.
 */
export async function saveProfileToSupabase(
  profile: Record<string, any>,
  userIdOrEmail?: string,
  options?: { isRetry?: boolean }
): Promise<{ success: boolean; channel: string; error?: string }> {
  const fallbackKey = (profile?.email || userIdOrEmail || 'anonymous').toLowerCase().trim();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineSync('profile', fallbackKey, { profile, userIdOrEmail });
    return { success: false, channel: 'offline_queued', error: 'Offline: queued for automatic sync' };
  }

  if (!client) {
    return { success: false, channel: 'local_fallback', error: 'Supabase client is not configured yet' };
  }

  let savedChannel = 'local_fallback';

  try {
    const currentUser = await getCurrentSessionUser();
    const rawEmail = (
      profile.email ||
      (userIdOrEmail && userIdOrEmail.includes('@') ? userIdOrEmail : '') ||
      currentUser?.email ||
      ''
    )
      .toLowerCase()
      .trim();

    const isSelf =
      currentUser &&
      (!rawEmail || currentUser.email?.toLowerCase().trim() === rawEmail || currentUser.id === userIdOrEmail);

    // Strip any accidental base64 image strings from Auth JWT metadata copy
    const lightweightProfileForJwt = stripHeavyBase64ForLocalCache(profile);

    // 1. Update lightweight scalar fields in Auth metadata (only if user is updating own profile)
    if (isSelf && currentUser) {
      const { error: metaError } = await client.auth.updateUser({
        data: {
          first_name: profile.firstName || '',
          last_name: profile.lastName || '',
          phone: profile.phone || '',
          fitkode_profile: lightweightProfileForJwt,
          profile_updated_at: new Date().toISOString(),
        },
      });
      if (!metaError) {
        savedChannel = 'supabase_auth_metadata';
      }
    }

    // 2. Persist to `public.profiles` table (merging with existing profile_data so we don't wipe weekly_entries/plans)
    const existingRow = await findExistingProfileRow(
      userIdOrEmail || currentUser?.id,
      rawEmail
    );

    const targetId = existingRow?.id || (isValidUuid(userIdOrEmail) ? userIdOrEmail : isSelf ? currentUser?.id : undefined);
    const mergedProfileData = {
      ...(existingRow?.profile_data || {}),
      ...lightweightProfileForJwt,
      email: rawEmail || existingRow?.email || profile.email || '',
      updatedAt: new Date().toISOString(),
    };

    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();

    if (targetId) {
      const { error: tableError } = await client
        .from('profiles')
        .upsert(
          {
            id: targetId,
            email: rawEmail || existingRow?.email || undefined,
            full_name: fullName || undefined,
            first_name: profile.firstName || '',
            last_name: profile.lastName || '',
            phone: profile.phone || '',
            profile_data: mergedProfileData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (!tableError) {
        savedChannel = 'supabase_table';
      }
    } else if (rawEmail) {
      const { error: updateByEmailError } = await client
        .from('profiles')
        .update({
          full_name: fullName || undefined,
          first_name: profile.firstName || '',
          last_name: profile.lastName || '',
          phone: profile.phone || '',
          profile_data: mergedProfileData,
          updated_at: new Date().toISOString(),
        })
        .ilike('email', rawEmail);

      if (!updateByEmailError) {
        savedChannel = 'supabase_table';
      }
    }

    if (savedChannel === 'local_fallback' && !options?.isRetry) {
      enqueueOfflineSync('profile', rawEmail || fallbackKey, { profile, userIdOrEmail });
    }

    return { success: savedChannel !== 'local_fallback', channel: savedChannel };
  } catch (err: any) {
    console.warn('Supabase profile save notice:', err?.message);
    if (!options?.isRetry) {
      enqueueOfflineSync('profile', fallbackKey, { profile, userIdOrEmail });
    }
    return { success: false, channel: savedChannel, error: err?.message };
  }
}

/**
 * Saves all 70-point client onboarding / health questionnaire fields into Supabase `public.profiles`.
 */
export async function saveOnboardingToSupabase(
  onboarding: Record<string, any>,
  userIdOrEmail?: string,
  options?: { isRetry?: boolean }
): Promise<{ success: boolean; channel: string; error?: string }> {
  const fallbackKey = (userIdOrEmail || 'anonymous').toLowerCase().trim();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOfflineSync('onboarding', fallbackKey, { onboarding, userIdOrEmail });
    return { success: false, channel: 'offline_queued', error: 'Offline: queued for automatic sync' };
  }

  if (!client) {
    return { success: false, channel: 'local_fallback', error: 'Supabase client is not configured yet' };
  }

  let savedChannel = 'local_fallback';

  try {
    const currentUser = await getCurrentSessionUser();
    const rawEmail = (
      (userIdOrEmail && userIdOrEmail.includes('@') ? userIdOrEmail : '') ||
      currentUser?.email ||
      ''
    )
      .toLowerCase()
      .trim();

    const isSelf =
      currentUser &&
      (!userIdOrEmail ||
        currentUser.id === userIdOrEmail ||
        currentUser.email?.toLowerCase().trim() === rawEmail);

    // 1. Save lightweight onboarding status to Auth User Metadata if self
    if (isSelf && currentUser) {
      const { error: metaError } = await client.auth.updateUser({
        data: {
          fitkode_onboarding: stripHeavyBase64ForLocalCache(onboarding),
          onboarding_completed: onboarding.isSubmitted || false,
          onboarding_updated_at: new Date().toISOString(),
        },
      });
      if (!metaError) {
        savedChannel = 'supabase_auth_metadata';
      }
    }

    // 2. Persist to `public.profiles` table
    const existingRow = await findExistingProfileRow(
      userIdOrEmail || currentUser?.id,
      rawEmail
    );

    const targetId = existingRow?.id || (isValidUuid(userIdOrEmail) ? userIdOrEmail : isSelf ? currentUser?.id : undefined);
    const onboardingPayload = {
      ...(existingRow?.onboarding_data || {}),
      ...onboarding,
      updatedAt: new Date().toISOString(),
    };

    if (targetId) {
      const { error: tableError } = await client
        .from('profiles')
        .upsert(
          {
            id: targetId,
            email: existingRow?.email || rawEmail || undefined,
            onboarding_data: onboardingPayload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (!tableError) {
        savedChannel = 'supabase_table';
      }
    } else if (rawEmail) {
      const { error: emailErr } = await client
        .from('profiles')
        .update({
          onboarding_data: onboardingPayload,
          updated_at: new Date().toISOString(),
        })
        .ilike('email', rawEmail);

      if (!emailErr) {
        savedChannel = 'supabase_table';
      }
    }

    if (savedChannel === 'local_fallback' && !options?.isRetry) {
      enqueueOfflineSync('onboarding', rawEmail || fallbackKey, { onboarding, userIdOrEmail });
    }

    return { success: savedChannel !== 'local_fallback', channel: savedChannel };
  } catch (err: any) {
    console.warn('Supabase onboarding save notice:', err?.message);
    if (!options?.isRetry) {
      enqueueOfflineSync('onboarding', fallbackKey, { onboarding, userIdOrEmail });
    }
    return { success: false, channel: savedChannel, error: err?.message };
  }
}

/**
 * Reads user profile from Supabase (checking `public.profiles` first, then auth metadata)
 */
export async function loadProfileFromSupabase(userIdOrEmail?: string): Promise<Record<string, any> | null> {
  if (!client) return null;

  try {
    const currentUser = await getCurrentSessionUser();
    const lookup = (userIdOrEmail || currentUser?.id || currentUser?.email || '').trim();

    if (lookup) {
      const row = await findExistingProfileRow(
        lookup,
        lookup.includes('@') ? lookup : currentUser?.email
      );
      if (row?.profile_data && Object.keys(row.profile_data).length > 0) {
        return row.profile_data;
      }
    }

    if (currentUser?.user_metadata?.fitkode_profile) {
      return currentUser.user_metadata.fitkode_profile;
    }
  } catch (err) {
    console.warn('Supabase profile load warning:', err);
  }

  return null;
}

/**
 * Reads client onboarding questionnaire from Supabase (`public.profiles` first, then auth metadata)
 */
export async function loadOnboardingFromSupabase(userIdOrEmail?: string): Promise<Record<string, any> | null> {
  if (!client) return null;

  try {
    const currentUser = await getCurrentSessionUser();
    const lookup = (userIdOrEmail || currentUser?.id || currentUser?.email || '').trim();

    if (lookup) {
      const row = await findExistingProfileRow(
        lookup,
        lookup.includes('@') ? lookup : currentUser?.email
      );
      if (row?.onboarding_data && Object.keys(row.onboarding_data).length > 0) {
        return row.onboarding_data;
      }
    }

    if (currentUser?.user_metadata?.fitkode_onboarding) {
      return currentUser.user_metadata.fitkode_onboarding;
    }
  } catch (err) {
    console.warn('Supabase onboarding load warning:', err);
  }

  return null;
}

/**
 * Uploads a compressed progress photo Blob/DataURL to Supabase Storage (`progress-photos` bucket).
 * Returns the public URL if Storage is available, or falls back to the compressed DataURL (<100KB).
 */
export async function uploadProgressPhotoToSupabase(
  dataUrl: string,
  userEmail: string,
  pose: string
): Promise<string> {
  if (!client || !dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = blob.type.includes('webp') ? 'webp' : 'jpg';
    const safeEmail = (userEmail || 'member')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_');
    const filePath = `${safeEmail}/${Date.now()}_${pose}.${ext}`;

    const { error: uploadError } = await client.storage
      .from('progress-photos')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        cacheControl: '31536000', // 1-year browser & CDN cache to keep Free Tier egress near zero
        upsert: true,
      });

    if (!uploadError) {
      const { data: pubData } = client.storage
        .from('progress-photos')
        .getPublicUrl(filePath);
      if (pubData?.publicUrl) {
        return pubData.publicUrl;
      }
    }
  } catch {
    // Graceful fallback to the already-compressed dataUrl if bucket not yet created
  }

  return dataUrl;
}

/**
 * Persists user's weekly tracker entries to Supabase:
 * 1. Dedicated `public.weekly_tracker_entries` table
 * 2. Mirrored inside `public.profiles.profile_data.weekly_entries` for 100% guaranteed cross-device visibility
 * NOTE: Never stores base64 photos or entry arrays inside `auth.users` JWT metadata!
 */
export async function saveWeeklyEntriesToSupabase(
  userEmail: string,
  entries: any[],
  options?: { isRetry?: boolean }
): Promise<{ success: boolean; channel: string; error?: string }> {
  const normEmail = (userEmail || '').toLowerCase().trim();

  if (typeof navigator !== 'undefined' && !navigator.onLine && normEmail) {
    enqueueOfflineSync('weekly_entries', normEmail, { userEmail: normEmail, entries });
    return { success: false, channel: 'offline_queued', error: 'Offline: queued for automatic sync' };
  }

  if (!client || !normEmail) {
    return { success: false, channel: 'local_fallback', error: 'Supabase client is not configured yet' };
  }

  let savedChannel = 'local_fallback';

  try {
    const currentUser = await getCurrentSessionUser();

    // 1. Upsert each entry into `public.weekly_tracker_entries`
    try {
      const rowsToUpsert = entries.map((entry) => ({
        id: entry.id,
        user_email: normEmail,
        user_id: entry.userId || currentUser?.id || normEmail,
        week_number: Number(entry.weekNumber) || 1,
        check_in_date: entry.checkInDate || new Date().toISOString().split('T')[0],
        weight_kg: Number(entry.weightKg) || 0,
        waist_inches: Number(entry.waistInches) || 0,
        avg_steps_per_day: Number(entry.avgStepsPerDay) || 0,
        notes: entry.challengesFaced || '',
        entry_data: entry,
        updated_at: new Date().toISOString(),
      }));

      if (rowsToUpsert.length > 0) {
        const { error: wtError } = await client
          .from('weekly_tracker_entries')
          .upsert(rowsToUpsert, { onConflict: 'id' });

        if (!wtError) {
          savedChannel = 'supabase_weekly_table';
        }
      }
    } catch {
      // Fallback to profiles.profile_data below
    }

    // 2. Mirror inside `public.profiles.profile_data.weekly_entries` so Coach Dossier & Member sync even if table is missing
    try {
      const existingProfile = await findExistingProfileRow(normEmail, normEmail);
      if (existingProfile) {
        const mergedProfileData = {
          ...(existingProfile.profile_data || {}),
          weekly_entries: entries,
          weekly_tracker_count: entries.length,
          last_checkin_date: entries[0]?.checkInDate || '',
          tracker_updated_at: new Date().toISOString(),
        };

        const { error: profError } = await client
          .from('profiles')
          .update({
            profile_data: mergedProfileData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProfile.id);

        if (!profError) {
          savedChannel = 'supabase_table';
        }
      }
    } catch {
      // ignore
    }

    if (savedChannel === 'local_fallback' && !options?.isRetry) {
      enqueueOfflineSync('weekly_entries', normEmail, { userEmail: normEmail, entries });
    }

    return { success: savedChannel !== 'local_fallback', channel: savedChannel };
  } catch (err: any) {
    console.warn('Supabase weekly tracker save notice:', err?.message);
    if (!options?.isRetry) {
      enqueueOfflineSync('weekly_entries', normEmail, { userEmail: normEmail, entries });
    }
    return { success: false, channel: savedChannel, error: err?.message };
  }
}

/**
 * Deletes a single weekly tracker entry from Supabase `weekly_tracker_entries` and updates `profiles.profile_data`.
 */
export async function deleteWeeklyEntryFromSupabase(
  entryId: string,
  userEmail: string,
  remainingEntries: any[]
): Promise<void> {
  if (!client || !entryId) return;
  try {
    await client.from('weekly_tracker_entries').delete().eq('id', entryId);
  } catch {
    // ignore
  }
  await saveWeeklyEntriesToSupabase(userEmail, remainingEntries);
}

/**
 * Loads weekly tracker entries for a specific user from Supabase (`weekly_tracker_entries` + `profiles.profile_data`)
 */
export async function loadWeeklyEntriesFromSupabase(userEmail: string): Promise<any[] | null> {
  if (!client || !userEmail) return null;
  const normEmail = userEmail.toLowerCase().trim();

  try {
    const mergedMap = new Map<string, any>();

    // 1. Check `weekly_tracker_entries` table
    try {
      const { data, error } = await client
        .from('weekly_tracker_entries')
        .select('*')
        .ilike('user_email', normEmail)
        .order('check_in_date', { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const item = row.entry_data && row.entry_data.id ? row.entry_data : {
            id: row.id,
            userId: row.user_id || normEmail,
            userEmail: row.user_email || normEmail,
            checkInDate: row.check_in_date,
            weekNumber: row.week_number || 1,
            weightKg: Number(row.weight_kg) || 0,
            waistInches: Number(row.waist_inches) || 0,
            avgStepsPerDay: Number(row.avg_steps_per_day) || 0,
            challengesFaced: row.notes || '',
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
          if (item && item.id) {
            mergedMap.set(item.id, item);
          }
        }
      }
    } catch {
      // ignore
    }

    // 2. Check `profiles.profile_data.weekly_entries`
    try {
      const existingProfile = await findExistingProfileRow(normEmail, normEmail);
      const profileWeekly = existingProfile?.profile_data?.weekly_entries;
      if (Array.isArray(profileWeekly)) {
        for (const item of profileWeekly) {
          if (item && item.id && !mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        }
      }
    } catch {
      // ignore
    }

    if (mergedMap.size > 0) {
      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
      );
    }
  } catch (err) {
    console.warn('Supabase weekly tracker load warning:', err);
  }

  return null;
}

/**
 * Loads ALL weekly tracker entries across all members from Supabase for Coach / Super Admin view.
 */
export async function loadAllWeeklyEntriesFromSupabaseForAdmin(): Promise<Record<string, any[]>> {
  const byEmail: Record<string, any[]> = {};
  if (!client) return byEmail;

  try {
    const { data, error } = await client
      .from('weekly_tracker_entries')
      .select('*')
      .order('check_in_date', { ascending: false });

    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const email = (row.user_email || row.entry_data?.userEmail || '').toLowerCase().trim();
        if (!email) continue;
        const entry = row.entry_data && row.entry_data.id ? row.entry_data : row;
        if (!byEmail[email]) byEmail[email] = [];
        if (!byEmail[email].some((e) => e.id === entry.id)) {
          byEmail[email].push(entry);
        }
      }
    }
  } catch {
    // ignore
  }

  return byEmail;
}

/**
 * Syncs Meal Plans for a user to Supabase (`public.meal_plans` + `public.profiles.profile_data.meal_plans`)
 * so Coach assignments and Member edits are immediately visible across all devices.
 */
export async function syncMealPlansToSupabase(
  userEmail: string,
  userPlans: any[],
  options?: { isRetry?: boolean }
): Promise<boolean> {
  const normEmail = (userEmail || '').toLowerCase().trim();
  if (typeof navigator !== 'undefined' && !navigator.onLine && normEmail) {
    enqueueOfflineSync('meal_plans', normEmail, { userEmail: normEmail, userPlans });
    return false;
  }
  if (!client || !normEmail) return false;
  let saved = false;

  try {
    const currentUser = await getCurrentSessionUser();

    // 1. Upsert into `public.meal_plans` table
    try {
      const rows = userPlans.map((plan) => ({
        id: plan.id,
        user_id: plan.userId || currentUser?.id || normEmail,
        user_email: normEmail,
        name: plan.name || 'Meal Plan',
        daily_calories: Number(plan.targetCalories) || 2000,
        protein_g: Number(plan.targetProtein) || 140,
        carbs_g: Number(plan.targetCarbs) || 200,
        fats_g: Number(plan.targetFats) || 55,
        is_active: Boolean(plan.isActive),
        created_by: plan.createdBy || 'user',
        plan_data: plan,
        updated_at: plan.updatedAt || new Date().toISOString(),
      }));

      if (rows.length > 0) {
        const { error } = await client.from('meal_plans').upsert(rows, { onConflict: 'id' });
        if (!error) saved = true;
      }
    } catch {
      // Fallback to profiles.profile_data below
    }

    // 2. Mirror into `public.profiles.profile_data.meal_plans`
    try {
      const existingProfile = await findExistingProfileRow(normEmail, normEmail);
      if (existingProfile) {
        const mergedProfileData = {
          ...(existingProfile.profile_data || {}),
          meal_plans: userPlans,
          meal_plans_updated_at: new Date().toISOString(),
        };
        const { error: profErr } = await client
          .from('profiles')
          .update({
            profile_data: mergedProfileData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProfile.id);

        if (!profErr) saved = true;
      }
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn('Supabase meal plans sync warning:', err);
  }

  if (!saved && !options?.isRetry) {
    enqueueOfflineSync('meal_plans', normEmail, { userEmail: normEmail, userPlans });
  }

  return saved;
}

/**
 * Legacy single meal plan save wrapper (used by AI meal plan modal)
 */
export async function saveMealPlanToSupabase(params: {
  userId: string;
  userEmail: string;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  planData: any;
}): Promise<boolean> {
  if (!client || !params.userEmail) return false;
  const normEmail = params.userEmail.toLowerCase().trim();
  try {
    const planId = params.planData?.id || `ai_meal_${Date.now()}`;
    const { error } = await client.from('meal_plans').upsert(
      {
        id: planId,
        user_id: params.userId || normEmail,
        user_email: normEmail,
        daily_calories: params.dailyCalories,
        protein_g: params.proteinG,
        carbs_g: params.carbsG,
        fats_g: params.fatsG,
        plan_data: params.planData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch {
    return false;
  }
}

/**
 * Loads Meal Plans for a user from Supabase (`public.meal_plans` + `public.profiles.profile_data.meal_plans`)
 */
export async function loadMealPlansFromSupabase(userEmail: string): Promise<any[] | null> {
  if (!client || !userEmail) return null;
  const normEmail = userEmail.toLowerCase().trim();
  const plansMap = new Map<string, any>();

  try {
    // 1. Check `public.meal_plans` table
    try {
      const { data, error } = await client
        .from('meal_plans')
        .select('*')
        .ilike('user_email', normEmail)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const plan = row.plan_data && row.plan_data.meals ? row.plan_data : null;
          if (plan && plan.id) {
            plansMap.set(plan.id, plan);
          }
        }
      }
    } catch {
      // ignore
    }

    // 2. Check `public.profiles.profile_data.meal_plans`
    try {
      const existingProfile = await findExistingProfileRow(normEmail, normEmail);
      const profilePlans = existingProfile?.profile_data?.meal_plans;
      if (Array.isArray(profilePlans)) {
        for (const p of profilePlans) {
          if (p && p.id) {
            const existing = plansMap.get(p.id);
            if (!existing || new Date(p.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
              plansMap.set(p.id, p);
            }
          }
        }
      }
    } catch {
      // ignore
    }

    if (plansMap.size > 0) {
      return Array.from(plansMap.values());
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Syncs Workout Plans for a user to Supabase (`public.workout_plans` + `public.profiles.profile_data.workout_plans`)
 */
export async function syncWorkoutPlansToSupabase(
  userEmail: string,
  userPlans: any[],
  options?: { isRetry?: boolean }
): Promise<boolean> {
  const normEmail = (userEmail || '').toLowerCase().trim();
  if (typeof navigator !== 'undefined' && !navigator.onLine && normEmail) {
    enqueueOfflineSync('workout_plans', normEmail, { userEmail: normEmail, userPlans });
    return false;
  }
  if (!client || !normEmail) return false;
  let saved = false;

  try {
    const currentUser = await getCurrentSessionUser();

    // 1. Upsert into `public.workout_plans` table
    try {
      const rows = userPlans.map((plan) => ({
        id: plan.id,
        user_id: plan.userId || currentUser?.id || normEmail,
        user_email: normEmail,
        name: plan.name || 'Workout Routine',
        goal: plan.goal || 'Hypertrophy & Muscle Gain',
        difficulty: plan.difficulty || 'Intermediate',
        days_per_week: Number(plan.daysPerWeek) || 4,
        is_active: Boolean(plan.isActive),
        created_by: plan.createdBy || 'user',
        plan_data: plan,
        updated_at: plan.updatedAt || new Date().toISOString(),
      }));

      if (rows.length > 0) {
        const { error } = await client.from('workout_plans').upsert(rows, { onConflict: 'id' });
        if (!error) saved = true;
      }
    } catch {
      // Fallback to profiles.profile_data below
    }

    // 2. Mirror into `public.profiles.profile_data.workout_plans`
    try {
      const existingProfile = await findExistingProfileRow(normEmail, normEmail);
      if (existingProfile) {
        const mergedProfileData = {
          ...(existingProfile.profile_data || {}),
          workout_plans: userPlans,
          workout_plans_updated_at: new Date().toISOString(),
        };
        const { error: profErr } = await client
          .from('profiles')
          .update({
            profile_data: mergedProfileData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProfile.id);

        if (!profErr) saved = true;
      }
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn('Supabase workout plans sync warning:', err);
  }

  if (!saved && !options?.isRetry) {
    enqueueOfflineSync('workout_plans', normEmail, { userEmail: normEmail, userPlans });
  }

  return saved;
}

/**
 * Loads Workout Plans for a user from Supabase (`public.workout_plans` + `public.profiles.profile_data.workout_plans`)
 */
export async function loadWorkoutPlansFromSupabase(userEmail: string): Promise<any[] | null> {
  if (!client || !userEmail) return null;
  const normEmail = userEmail.toLowerCase().trim();
  const plansMap = new Map<string, any>();

  try {
    // 1. Check `public.workout_plans` table
    try {
      const { data, error } = await client
        .from('workout_plans')
        .select('*')
        .ilike('user_email', normEmail)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const plan = row.plan_data && row.plan_data.days ? row.plan_data : null;
          if (plan && plan.id) {
            plansMap.set(plan.id, plan);
          }
        }
      }
    } catch {
      // ignore
    }

    // 2. Check `public.profiles.profile_data.workout_plans`
    try {
      const existingProfile = await findExistingProfileRow(normEmail, normEmail);
      const profilePlans = existingProfile?.profile_data?.workout_plans;
      if (Array.isArray(profilePlans)) {
        for (const p of profilePlans) {
          if (p && p.id) {
            const existing = plansMap.get(p.id);
            if (!existing || new Date(p.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
              plansMap.set(p.id, p);
            }
          }
        }
      }
    } catch {
      // ignore
    }

    if (plansMap.size > 0) {
      return Array.from(plansMap.values());
    }
  } catch {
    // ignore
  }
  return null;
}

export interface SupabaseDiagnosticResult {
  configured: boolean;
  profilesOk: boolean;
  rlsRecursionDetected: boolean;
  weeklyTrackerTableOk: boolean;
  mealPlansTableOk: boolean;
  workoutPlansTableOk: boolean;
  errorMessage?: string;
  latencyMs: number;
}

/**
 * Runs a fast, non-destructive diagnostic check on Supabase tables & RLS policies.
 * Specifically detects if the `public.profiles` RLS recursion bug (`42P17`) is active.
 */
export async function runSupabaseDiagnostics(): Promise<SupabaseDiagnosticResult> {
  const start = Date.now();
  if (!client || !isSupabaseConfigured()) {
    return {
      configured: false,
      profilesOk: false,
      rlsRecursionDetected: false,
      weeklyTrackerTableOk: false,
      mealPlansTableOk: false,
      workoutPlansTableOk: false,
      errorMessage: 'Supabase client is not configured.',
      latencyMs: 0,
    };
  }

  let profilesOk = false;
  let rlsRecursionDetected = false;
  let weeklyTrackerTableOk = false;
  let mealPlansTableOk = false;
  let workoutPlansTableOk = false;
  let errorMessage: string | undefined;

  try {
    const { error: profErr } = await client.from('profiles').select('id').limit(1);
    if (!profErr) {
      profilesOk = true;
    } else {
      errorMessage = profErr.message;
      if (
        profErr.code === '42P17' ||
        profErr.message?.toLowerCase().includes('infinite recursion')
      ) {
        rlsRecursionDetected = true;
      }
    }

    const { error: wtErr } = await client.from('weekly_tracker_entries').select('id').limit(1);
    if (!wtErr) {
      weeklyTrackerTableOk = true;
    } else if (wtErr.code === '42P17' || wtErr.message?.toLowerCase().includes('infinite recursion')) {
      rlsRecursionDetected = true;
    }

    const { error: mpErr } = await client.from('meal_plans').select('id').limit(1);
    if (!mpErr) mealPlansTableOk = true;

    const { error: wpErr } = await client.from('workout_plans').select('id').limit(1);
    if (!wpErr) workoutPlansTableOk = true;
  } catch (err: any) {
    errorMessage = err?.message || 'Unknown diagnostic error';
  }

  return {
    configured: true,
    profilesOk,
    rlsRecursionDetected,
    weeklyTrackerTableOk,
    mealPlansTableOk,
    workoutPlansTableOk,
    errorMessage,
    latencyMs: Date.now() - start,
  };
}

let isFlushingQueue = false;

/**
 * Flushes all pending items in the Offline Sync Queue (`fitkode_pending_sync_queue_v1`)
 * when network connectivity returns or when a backgrounded tab wakes up.
 */
export async function flushOfflineSyncQueue(): Promise<number> {
  if (isFlushingQueue || !client || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return 0;
  }

  const queue = getOfflineSyncQueue();
  if (queue.length === 0) return 0;

  isFlushingQueue = true;
  let flushedCount = 0;

  try {
    for (const item of queue) {
      let ok = false;
      try {
        if (item.type === 'profile' && item.payload?.profile) {
          const res = await saveProfileToSupabase(item.payload.profile, item.payload.userIdOrEmail, {
            isRetry: true,
          });
          ok = res.success;
        } else if (item.type === 'onboarding' && item.payload?.onboarding) {
          const res = await saveOnboardingToSupabase(
            item.payload.onboarding,
            item.payload.userIdOrEmail,
            { isRetry: true }
          );
          ok = res.success;
        } else if (item.type === 'weekly_entries' && item.payload?.userEmail) {
          const res = await saveWeeklyEntriesToSupabase(
            item.payload.userEmail,
            item.payload.entries || [],
            { isRetry: true }
          );
          ok = res.success;
        } else if (item.type === 'meal_plans' && item.payload?.userEmail) {
          ok = await syncMealPlansToSupabase(
            item.payload.userEmail,
            item.payload.userPlans || [],
            { isRetry: true }
          );
        } else if (item.type === 'workout_plans' && item.payload?.userEmail) {
          ok = await syncWorkoutPlansToSupabase(
            item.payload.userEmail,
            item.payload.userPlans || [],
            { isRetry: true }
          );
        }
      } catch {
        ok = false;
      }

      if (ok) {
        removeOfflineSyncItem(item.id);
        flushedCount++;
      }
    }
  } finally {
    isFlushingQueue = false;
  }

  return flushedCount;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineSyncQueue().catch(() => {});
  });
}

