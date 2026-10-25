import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  getSupabase,
  initSupabase,
  isSupabaseConfigured,
  signInWithGoogle,
  signOut,
  loadProfileFromSupabase,
  loadOnboardingFromSupabase,
  flushOfflineSyncQueue,
} from '../lib/supabase';
import { UserRole, AppMember } from '../types';
import {
  determineUserRole,
  isDefaultAdmin,
  syncMemberToStore,
} from '../lib/memberStore';
import {
  loadUserProfile,
  saveUserProfile,
  loadClientOnboarding,
  saveClientOnboarding,
} from '../lib/profileStorage';
import { ensureDefaultConsentsOnLogin } from '../lib/privacyService';
import { notifyWelcomeUser } from '../lib/communicationService';

export interface DevTestUserPreset {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  badge: string;
  description: string;
}

export const TEST_USER_PRESETS: DevTestUserPreset[] = [
  {
    id: 'usr_chinmay_admin',
    email: 'chinmay4jain@gmail.com',
    name: 'Chinmay Jain',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badge: 'Super Admin',
    description: 'Full administrative access to member directory, 70-question intake records, and role administration',
  },
  {
    id: 'usr_atul_gupta',
    email: 'akg.atulgupta@gmail.com',
    name: 'Atul Gupta',
    role: 'unpaid',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    badge: 'Member (Atul)',
    description: 'Member with 4-Day Coach Assigned Workout Plan and Week 2 progress stats',
  },
  {
    id: 'usr_001_priya',
    email: 'priya.sharma@example.com',
    name: 'Priya Sharma',
    role: 'paid',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    badge: 'Paid Member',
    description: 'Active 12-Week Intensive Coaching client with 100% completed health intake questionnaire',
  },
  {
    id: 'usr_002_rahul',
    email: 'rahul.verma@example.com',
    name: 'Rahul Verma',
    role: 'unpaid',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: 'Free Member',
    description: 'Free prospect exploring coaching plans, baseline profile, and calorie/macro tools',
  },
];

const DEV_SESSION_STORAGE_KEY = 'fitkode_dev_user_session';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  role: UserRole;
  isAdmin: boolean;
  isPaid: boolean;
  isUnpaid: boolean;
  appMember: AppMember | null;
  signIn: () => Promise<void>;
  signInWithTestAccount: (presetOrEmail: 'admin' | 'paid' | 'unpaid' | string, customRole?: UserRole) => Promise<User>;
  logOut: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
  syncCurrentMember: (data?: Partial<AppMember>) => Promise<AppMember | null>;
  setTestingRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [configured, setConfigured] = useState<boolean>(isSupabaseConfigured());
  const [authError, setAuthError] = useState<string | null>(null);
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);
  const [appMember, setAppMember] = useState<AppMember | null>(null);

  useEffect(() => {
    // If this window is a popup opened by our app, notify the opener and close
    if (typeof window !== 'undefined' && window.opener && window.opener !== window) {
      if (
        window.location.hash.includes('access_token') ||
        window.location.search.includes('code=') ||
        window.location.hash.includes('error=')
      ) {
        try {
          window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
          window.close();
          return;
        } catch {
          // ignore error
        }
      }
    }

    let mounted = true;
    let unsubscribeAuth: (() => void) | null = null;

    async function setupClient() {
      let client = getSupabase();

      // If client not yet configured from build-time vars, try runtime /api/auth/config
      if (!client) {
        try {
          const res = await fetch('/api/auth/config');
          if (res.ok) {
            const data = await res.json();
            if (data.supabaseUrl && data.supabaseAnonKey) {
              client = initSupabase(data.supabaseUrl, data.supabaseAnonKey);
            }
          }
        } catch (err) {
          console.warn('Could not fetch /api/auth/config:', err);
        }
      }

      if (!mounted) return;

      const isReady = Boolean(client && isSupabaseConfigured());
      setConfigured(isReady);

      if (!client || !isReady) {
        if (typeof window !== 'undefined') {
          const savedDev = localStorage.getItem(DEV_SESSION_STORAGE_KEY);
          if (savedDev) {
            try {
              const parsed = JSON.parse(savedDev);
              if (parsed.user) {
                setUser(parsed.user);
                if (parsed.role) setRoleOverride(parsed.role);
              }
            } catch (e) {
              console.warn('Could not parse dev session:', e);
            }
          }
        }
        setLoading(false);
        return;
      }

      // 1. Initial session check
      try {
        const { data: { session: existingSession } } = await client.auth.getSession();
        if (!mounted) return;
        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
        } else if (typeof window !== 'undefined') {
          const savedDev = localStorage.getItem(DEV_SESSION_STORAGE_KEY);
          if (savedDev) {
            try {
              const parsed = JSON.parse(savedDev);
              if (parsed.user) {
                setUser(parsed.user);
                if (parsed.role) setRoleOverride(parsed.role);
              }
            } catch {
              // ignore
            }
          }
        }
      } catch (err: any) {
        console.warn('Error reading Supabase session:', err?.message);
      } finally {
        if (mounted) setLoading(false);
      }

      // 2. Auth state change subscription
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        if (currentSession?.user) {
          setUser(currentSession.user);
        } else if (typeof window !== 'undefined') {
          // If no active live Supabase session, check if a dev/test account is saved before wiping user
          const savedDev = localStorage.getItem(DEV_SESSION_STORAGE_KEY);
          if (savedDev) {
            try {
              const parsed = JSON.parse(savedDev);
              if (parsed?.user) {
                setUser(parsed.user);
                if (parsed.role) setRoleOverride(parsed.role);
              } else {
                setUser(null);
              }
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);

        // Clean up OAuth tokens from URL to leave a clean address bar
        if (
          typeof window !== 'undefined' &&
          currentSession &&
          (window.location.hash.includes('access_token') ||
            window.location.search.includes('code=') ||
            window.location.search.includes('error='))
        ) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, '', cleanUrl);
        }

        // If this is a popup window that finished auth, notify opener and close
        if (typeof window !== 'undefined' && window.opener && window.opener !== window && currentSession) {
          try {
            window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
            setTimeout(() => window.close(), 250);
          } catch {
            // ignore
          }
        }
      });

      unsubscribeAuth = () => subscription.unsubscribe();
    }

    setupClient();

    // 3. Listen for postMessage from popup auth window
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
        const client = getSupabase();
        client?.auth.getSession().then(({ data: { session: refreshedSession } }) => {
          if (!mounted) return;
          setSession(refreshedSession);
          setUser(refreshedSession?.user ?? null);
        });
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      mounted = false;
      if (unsubscribeAuth) unsubscribeAuth();
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Synchronize member profile & onboarding whenever user logs in
  useEffect(() => {
    if (!user) {
      setAppMember(null);
      setRoleOverride(null);
      return;
    }

    const email = user.email || '';
    const userIdOrEmail = user.id || email;
    // DPDP Act Default Consent: All consents marked Yes by default on login unless user chose to turn them off
    const { profile: localProfile, onboarding: localOnboarding } = ensureDefaultConsentsOnLogin(userIdOrEmail);
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'Member';
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

    let cancelled = false;

    const hydrateAndSyncUser = async () => {
      try {
        // Flush any queued offline mutations before reading remote state
        await flushOfflineSyncQueue().catch(() => 0);

        // Hydrate from Supabase first so logging in on a new device pulls existing remote profile & onboarding
        const [remoteProfile, remoteOnboarding] = await Promise.all([
          loadProfileFromSupabase(userIdOrEmail).catch(() => null),
          loadOnboardingFromSupabase(userIdOrEmail).catch(() => null),
        ]);

        const mergedProfile = {
          ...localProfile,
          ...(remoteProfile || {}),
          email: remoteProfile?.email || localProfile?.email || email,
        };
        const mergedOnboarding = {
          ...localOnboarding,
          ...(remoteOnboarding || {}),
        };

        if (remoteProfile && Object.keys(remoteProfile).length > 0) {
          saveUserProfile(mergedProfile, userIdOrEmail);
          if (email) saveUserProfile(mergedProfile, email);
        }
        if (remoteOnboarding && Object.keys(remoteOnboarding).length > 0) {
          saveClientOnboarding(mergedOnboarding, userIdOrEmail);
          if (email) saveClientOnboarding(mergedOnboarding, email);
        }

        const synced = await syncMemberToStore({
          id: user.id,
          email,
          name,
          avatarUrl,
          profile: mergedProfile,
          onboarding: mergedOnboarding,
        });
        if (!cancelled) {
          setAppMember(synced);
        }
      } catch (err) {
        console.warn('Member sync failed:', err);
      }
    };

    hydrateAndSyncUser();

    // Stale Tab / Background Wake-Up Re-Sync Hook (throttled to once every 3 minutes)
    let lastWakeUpSync = Date.now();
    const handleTabWakeUp = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastWakeUpSync < 3 * 60 * 1000) return;
      lastWakeUpSync = now;

      const client = getSupabase();
      if (client) {
        client.auth.getSession().catch(() => {});
      }
      hydrateAndSyncUser();
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleTabWakeUp);
      window.addEventListener('focus', handleTabWakeUp);
    }

    // Dispatch energetic "Welcome to Fitkode" onboarding email upon user login (Gmail/Google auth)
    if (email) {
      const welcomeStorageKey = `fk_welcome_email_sent_${email.toLowerCase().trim()}`;
      const alreadyNotified = typeof window !== 'undefined' ? localStorage.getItem(welcomeStorageKey) : null;

      if (!alreadyNotified) {
        notifyWelcomeUser({
          email,
          name,
        })
          .then((res) => {
            if (res.success) {
              if (typeof window !== 'undefined') {
                localStorage.setItem(welcomeStorageKey, new Date().toISOString());
              }
            }
          })
          .catch((err) => {
            console.warn('[AuthContext] Welcome email notification deferred:', err);
          });
      }
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleTabWakeUp);
        window.removeEventListener('focus', handleTabWakeUp);
      }
    };
  }, [user]);

  const userEmail = user?.email || '';
  const isEmailAdmin = isDefaultAdmin(userEmail);
  const baseRole: UserRole = isEmailAdmin
    ? 'admin'
    : appMember?.role || determineUserRole(userEmail);
  const activeRole: UserRole = roleOverride || baseRole;

  const isAdmin = activeRole === 'admin';
  const isPaid = activeRole === 'paid';
  const isUnpaid = activeRole === 'unpaid';

  const syncCurrentMember = async (data?: Partial<AppMember>): Promise<AppMember | null> => {
    if (!user) return null;
    const email = user.email || '';
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'Member';
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    const profile = data?.profile || loadUserProfile(user.id || email);
    const onboarding = data?.onboarding || loadClientOnboarding(user.id || email);

    const synced = await syncMemberToStore({
      id: user.id,
      email,
      name,
      avatarUrl,
      profile,
      onboarding,
      ...data,
    });
    setAppMember(synced);
    return synced;
  };

  const setTestingRole = (newRole: UserRole) => {
    setRoleOverride(newRole);
    if (typeof window !== 'undefined') {
      try {
        const savedDev = localStorage.getItem(DEV_SESSION_STORAGE_KEY);
        if (savedDev) {
          const parsed = JSON.parse(savedDev);
          parsed.role = newRole;
          localStorage.setItem(DEV_SESSION_STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch {
        // ignore
      }
    }
  };

  const signIn = async () => {
    setAuthError(null);
    if (!configured) {
      setAuthError('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured.');
      return;
    }
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err?.message || 'Failed to initiate Google sign-in.');
    }
  };

  const signInWithTestAccount = async (
    presetOrEmail: 'admin' | 'paid' | 'unpaid' | string,
    customRole?: UserRole
  ): Promise<User> => {
    let email = presetOrEmail.trim();
    let name = '';
    let avatarUrl = '';
    let role: UserRole = customRole || 'unpaid';
    let userId = `usr_test_${Date.now()}`;

    const foundPreset = TEST_USER_PRESETS.find(
      (p) =>
        p.id === presetOrEmail ||
        p.role === presetOrEmail ||
        p.email.toLowerCase() === presetOrEmail.toLowerCase()
    );

    if (foundPreset) {
      email = foundPreset.email;
      name = foundPreset.name;
      role = foundPreset.role;
      avatarUrl = foundPreset.avatarUrl;
      userId = foundPreset.id;
    } else if (presetOrEmail === 'admin' || isDefaultAdmin(presetOrEmail)) {
      email = 'chinmay4jain@gmail.com';
      name = 'Chinmay Jain';
      role = 'admin';
      avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
      userId = 'usr_chinmay_admin';
    } else if (presetOrEmail === 'paid') {
      email = 'priya.sharma@example.com';
      name = 'Priya Sharma';
      role = 'paid';
      avatarUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';
      userId = 'usr_001_priya';
    } else if (presetOrEmail === 'unpaid') {
      email = 'rahul.verma@example.com';
      name = 'Rahul Verma';
      role = 'unpaid';
      avatarUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
      userId = 'usr_002_rahul';
    } else {
      name = email.split('@')[0];
      if (isDefaultAdmin(email)) role = 'admin';
    }

    const testUser: User = {
      id: userId,
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: {
        full_name: name,
        name,
        avatar_url: avatarUrl,
        picture: avatarUrl,
        email,
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email,
    } as unknown as User;

    if (typeof window !== 'undefined') {
      localStorage.setItem(DEV_SESSION_STORAGE_KEY, JSON.stringify({ user: testUser, role }));
    }

    setUser(testUser);
    setRoleOverride(role);
    setAuthError(null);

    // Sync to member store with DPDP Act default Yes consents
    try {
      const { profile, onboarding } = ensureDefaultConsentsOnLogin(testUser.id || testUser.email);
      const synced = await syncMemberToStore({
        id: testUser.id,
        email: testUser.email || email,
        name,
        avatarUrl,
        role,
        profile,
        onboarding,
      });
      setAppMember(synced);
    } catch (err) {
      console.warn('Dev test user sync error:', err);
    }

    return testUser;
  };

  const logOut = async () => {
    setAuthError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEV_SESSION_STORAGE_KEY);
    }
    try {
      await signOut();
    } catch (err: any) {
      console.warn('Supabase sign-out warning:', err);
    }
    setUser(null);
    setSession(null);
    setAppMember(null);
    setRoleOverride(null);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: configured,
        role: activeRole,
        isAdmin,
        isPaid,
        isUnpaid,
        appMember,
        signIn,
        signInWithTestAccount,
        logOut,
        signOut: logOut,
        authError,
        clearAuthError,
        syncCurrentMember,
        setTestingRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
