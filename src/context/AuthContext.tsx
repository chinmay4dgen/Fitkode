import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  getSupabase,
  initSupabase,
  isSupabaseConfigured,
  signInWithGoogle,
  signOut,
} from '../lib/supabase';
import { UserRole, AppMember } from '../types';
import {
  determineUserRole,
  isDefaultAdmin,
  syncMemberToStore,
} from '../lib/memberStore';
import { loadUserProfile, loadClientOnboarding } from '../lib/profileStorage';

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
        setUser(currentSession?.user ?? null);
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

        // Auto-navigate to User Profile screen upon login if not already on profile/onboarding
        if (
          _event === 'SIGNED_IN' &&
          currentSession &&
          typeof window !== 'undefined' &&
          window.location.pathname !== '/profile' &&
          window.location.pathname !== '/onboarding'
        ) {
          // If not in a popup, redirect to profile
          if (!window.opener || window.opener === window) {
            window.location.assign('/profile');
          }
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
          if (
            typeof window !== 'undefined' &&
            window.location.pathname !== '/profile' &&
            window.location.pathname !== '/onboarding'
          ) {
            window.location.assign('/profile');
          }
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
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'Member';
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    const profile = loadUserProfile(user.id || email);
    const onboarding = loadClientOnboarding(user.id || email);

    syncMemberToStore({
      id: user.id,
      email,
      name,
      avatarUrl,
      profile,
      onboarding,
    })
      .then((synced) => {
        setAppMember(synced);
      })
      .catch((err) => {
        console.warn('Member sync failed:', err);
      });
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

    const foundPreset = TEST_USER_PRESETS.find((p) => p.role === presetOrEmail || p.email.toLowerCase() === presetOrEmail.toLowerCase());

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

    // Sync to member store
    try {
      const profile = loadUserProfile(testUser.id || testUser.email);
      const onboarding = loadClientOnboarding(testUser.id || testUser.email);
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
