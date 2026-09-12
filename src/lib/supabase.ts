import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
let supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let client: SupabaseClient | null = null;

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
  try {
    supabaseUrl = url;
    supabaseAnonKey = key;
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
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

// Also export supabase getter proxy for convenience
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
    // Get authorization URL without full-page navigation so we can launch a popup window
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
        // Fallback to direct redirect if popup blocked
        window.location.href = data.url;
      }
      return { data, error: null };
    }
  }

  // Standard redirect
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
  const { error } = await client.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
}

/**
 * Saves all user profile fields into Supabase:
 * 1. Automatically persists to Supabase Auth User Metadata (auth.users.raw_user_meta_data)
 * 2. Attempts upsert to Supabase database table 'profiles'
 * 3. Attempts upsert to fallback table 'user_profiles' if needed
 */
export async function saveProfileToSupabase(
  profile: Record<string, any>,
  userIdOrEmail?: string
): Promise<{ success: boolean; channel: string; error?: string }> {
  if (!client) {
    return { success: false, channel: 'local_fallback', error: 'Supabase client is not configured yet' };
  }

  let savedChannel = 'local_fallback';

  try {
    // 1. Save directly into Supabase Auth User Metadata
    const authRes = await client.auth.getUser();
    const currentUser = authRes.data.user;

    if (currentUser) {
      const { error: metaError } = await client.auth.updateUser({
        data: {
          fitkode_profile: profile,
          first_name: profile.firstName || '',
          last_name: profile.lastName || '',
          phone: profile.phone || '',
          profile_updated_at: new Date().toISOString(),
        },
      });

      if (!metaError) {
        savedChannel = 'supabase_auth_metadata';
      }
    }

    // 2. Persist to Supabase database table 'profiles'
    const targetId = currentUser?.id || userIdOrEmail;
    const targetEmail = profile.email || currentUser?.email || userIdOrEmail;

    if (targetId) {
      try {
        const { error: tableError } = await client
          .from('profiles')
          .upsert(
            {
              id: targetId,
              email: targetEmail,
              first_name: profile.firstName || '',
              last_name: profile.lastName || '',
              phone: profile.phone || '',
              profile_data: profile,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (!tableError) {
          savedChannel = 'supabase_table';
        } else {
          // If table exists with a different column structure, try a simpler object
          const { error: simpleError } = await client
            .from('profiles')
            .upsert(
              {
                id: targetId,
                email: targetEmail,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          if (!simpleError) savedChannel = 'supabase_table';
        }
      } catch {
        // Table may not have been created yet, which is safe since metadata was saved
      }

      // Also try user_profiles if profiles was not present
      if (savedChannel !== 'supabase_table') {
        try {
          const { error: upError } = await client
            .from('user_profiles')
            .upsert(
              {
                id: targetId,
                email: targetEmail,
                data: profile,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          if (!upError) savedChannel = 'supabase_table';
        } catch {
          // ignore
        }
      }
    }

    return { success: true, channel: savedChannel };
  } catch (err: any) {
    console.warn('Supabase profile save notice:', err?.message);
    return { success: false, channel: savedChannel, error: err?.message };
  }
}

/**
 * Saves all 70-point client onboarding / health questionnaire fields into Supabase
 */
export async function saveOnboardingToSupabase(
  onboarding: Record<string, any>,
  userIdOrEmail?: string
): Promise<{ success: boolean; channel: string; error?: string }> {
  if (!client) {
    return { success: false, channel: 'local_fallback', error: 'Supabase client is not configured yet' };
  }

  let savedChannel = 'local_fallback';

  try {
    // 1. Save to Supabase Auth User Metadata
    const authRes = await client.auth.getUser();
    const currentUser = authRes.data.user;

    if (currentUser) {
      const { error: metaError } = await client.auth.updateUser({
        data: {
          fitkode_onboarding: onboarding,
          onboarding_completed: onboarding.isSubmitted || false,
          onboarding_updated_at: new Date().toISOString(),
        },
      });

      if (!metaError) {
        savedChannel = 'supabase_auth_metadata';
      }
    }

    // 2. Persist to Supabase database table 'profiles' or 'client_onboarding'
    const targetId = currentUser?.id || userIdOrEmail;
    if (targetId) {
      try {
        const { error: tableError } = await client
          .from('profiles')
          .upsert(
            {
              id: targetId,
              onboarding_data: onboarding,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (!tableError) {
          savedChannel = 'supabase_table';
        }
      } catch {
        // ignore
      }

      if (savedChannel !== 'supabase_table') {
        try {
          const { error: cobError } = await client
            .from('client_onboardings')
            .upsert(
              {
                id: targetId,
                data: onboarding,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          if (!cobError) savedChannel = 'supabase_table';
        } catch {
          // ignore
        }
      }
    }

    return { success: true, channel: savedChannel };
  } catch (err: any) {
    console.warn('Supabase onboarding save notice:', err?.message);
    return { success: false, channel: savedChannel, error: err?.message };
  }
}

/**
 * Reads user profile from Supabase (checking both tables and auth metadata)
 */
export async function loadProfileFromSupabase(userIdOrEmail?: string): Promise<Record<string, any> | null> {
  if (!client) return null;

  try {
    // 1. Check table 'profiles'
    if (userIdOrEmail) {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .or(`id.eq.${userIdOrEmail},email.eq.${userIdOrEmail}`)
          .maybeSingle();

        if (!error && data) {
          if (data.profile_data) return data.profile_data;
          if (data.data) return data.data;
          return {
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            phone: data.phone || '',
            email: data.email || '',
          };
        }
      } catch {
        // ignore
      }
    }

    // 2. Fall back to Auth User Metadata
    const authRes = await client.auth.getUser();
    if (authRes.data.user?.user_metadata?.fitkode_profile) {
      return authRes.data.user.user_metadata.fitkode_profile;
    }
  } catch (err) {
    console.warn('Supabase profile load warning:', err);
  }

  return null;
}

/**
 * Reads client onboarding questionnaire from Supabase
 */
export async function loadOnboardingFromSupabase(userIdOrEmail?: string): Promise<Record<string, any> | null> {
  if (!client) return null;

  try {
    // 1. Check table 'profiles'
    if (userIdOrEmail) {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('onboarding_data')
          .or(`id.eq.${userIdOrEmail},email.eq.${userIdOrEmail}`)
          .maybeSingle();

        if (!error && data?.onboarding_data) {
          return data.onboarding_data;
        }
      } catch {
        // ignore
      }
    }

    // 2. Fall back to Auth User Metadata
    const authRes = await client.auth.getUser();
    if (authRes.data.user?.user_metadata?.fitkode_onboarding) {
      return authRes.data.user.user_metadata.fitkode_onboarding;
    }
  } catch (err) {
    console.warn('Supabase onboarding load warning:', err);
  }

  return null;
}

/**
 * Persists user's weekly tracker entries to Supabase (Auth User Metadata and database table)
 */
export async function saveWeeklyEntriesToSupabase(
  userEmail: string,
  entries: any[]
): Promise<{ success: boolean; channel: string; error?: string }> {
  if (!client) {
    return { success: false, channel: 'local_fallback', error: 'Supabase client is not configured yet' };
  }

  let savedChannel = 'local_fallback';
  const normEmail = userEmail.toLowerCase().trim();

  try {
    // 1. Persist to Auth User Metadata if current user matches
    const authRes = await client.auth.getUser();
    const currentUser = authRes.data.user;

    if (currentUser && currentUser.email?.toLowerCase().trim() === normEmail) {
      const { error: metaError } = await client.auth.updateUser({
        data: {
          fitkode_weekly_entries: entries,
          weekly_tracker_count: entries.length,
          last_checkin_date: entries[0]?.checkInDate || '',
          tracker_updated_at: new Date().toISOString(),
        },
      });

      if (!metaError) {
        savedChannel = 'supabase_auth_metadata';
      }
    }

    // 2. Persist to profiles table (inside profile_data JSONB or weekly_tracker_data)
    try {
      const { data: existingProfile } = await client
        .from('profiles')
        .select('id, profile_data')
        .eq('email', normEmail)
        .maybeSingle();

      if (existingProfile) {
        const mergedProfileData = {
          ...(existingProfile.profile_data || {}),
          weekly_entries: entries,
          weekly_tracker_count: entries.length,
          last_checkin_date: entries[0]?.checkInDate || '',
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

    // 3. Also try upserting to weekly_tracker_entries table if present
    try {
      for (const entry of entries) {
        await client
          .from('weekly_tracker_entries')
          .upsert(
            {
              id: entry.id,
              user_email: normEmail,
              user_id: entry.userId || normEmail,
              week_number: entry.weekNumber,
              check_in_date: entry.checkInDate,
              weight_kg: entry.weightKg,
              waist_inches: entry.waistInches,
              avg_steps_per_day: entry.avgStepsPerDay,
              entry_data: entry,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
      }
    } catch {
      // Table may not exist yet, safe fallback
    }

    return { success: true, channel: savedChannel };
  } catch (err: any) {
    console.warn('Supabase weekly tracker save notice:', err?.message);
    return { success: false, channel: savedChannel, error: err?.message };
  }
}

/**
 * Loads weekly tracker entries from Supabase
 */
export async function loadWeeklyEntriesFromSupabase(userEmail: string): Promise<any[] | null> {
  if (!client || !userEmail) return null;
  const normEmail = userEmail.toLowerCase().trim();

  try {
    // 1. Try checking table 'weekly_tracker_entries'
    try {
      const { data, error } = await client
        .from('weekly_tracker_entries')
        .select('*')
        .eq('user_email', normEmail)
        .order('check_in_date', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row) => row.entry_data || row);
      }
    } catch {
      // ignore
    }

    // 2. Check table 'profiles' profile_data.weekly_entries
    try {
      const { data, error } = await client
        .from('profiles')
        .select('profile_data')
        .eq('email', normEmail)
        .maybeSingle();

      if (!error && data?.profile_data?.weekly_entries && Array.isArray(data.profile_data.weekly_entries)) {
        return data.profile_data.weekly_entries;
      }
    } catch {
      // ignore
    }

    // 3. Fall back to current user auth metadata if user is self
    const authRes = await client.auth.getUser();
    if (
      authRes.data.user?.email?.toLowerCase().trim() === normEmail &&
      Array.isArray(authRes.data.user.user_metadata?.fitkode_weekly_entries)
    ) {
      return authRes.data.user.user_metadata.fitkode_weekly_entries;
    }
  } catch (err) {
    console.warn('Supabase weekly tracker load warning:', err);
  }

  return null;
}


