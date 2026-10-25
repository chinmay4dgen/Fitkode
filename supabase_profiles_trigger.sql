-- ==============================================================================
-- FITKODE SUPABASE DATABASE SETUP & $0 NON-RECURSIVE RLS FIX
-- ==============================================================================
-- Run this SQL in your Supabase Project: Dashboard -> SQL Editor -> New Query -> Run.
--
-- WHAT THIS SCRIPT FIXES ($0 Free Tier Optimization):
-- 1. Eliminates the Infinite RLS Recursion bug on `public.profiles` that caused
--    Supabase Free Tier CPU/connections to exhaust and freeze every ~7 minutes.
-- 2. Introduces `public.is_admin()` as a `SECURITY DEFINER` function so admin
--    checks execute in O(1) without re-triggering `public.profiles` RLS policies.
-- 3. Creates & configures `public.profiles`, `public.weekly_tracker_entries`,
--    `public.meal_plans`, and `public.workout_plans` for instant cross-device sync
--    between Members and Coach Chinmay.
-- 4. Provisions the `progress-photos` Supabase Storage bucket with RLS policies
--    so compressed check-in photos (<120KB) never bloat database JSON or JWT headers.
-- ==============================================================================

-- 1. Create the public.profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'unpaid', -- 'unpaid' | 'paid' | 'admin'
  plan_id TEXT,
  plan_name TEXT,
  plan_purchased_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  profile_data JSONB DEFAULT '{}'::jsonb,
  onboarding_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast lookups by email, role, and creation time
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ==============================================================================
-- 2. NON-RECURSIVE ADMIN CHECK FUNCTION (CRITICAL FIX FOR 7-MINUTE DB FREEZE)
-- ==============================================================================
-- Marked SECURITY DEFINER + STABLE so PostgreSQL executes it with owner privileges,
-- bypassing RLS on public.profiles and preventing infinite policy recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  jwt_email TEXT;
  user_role TEXT;
BEGIN
  jwt_email := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
  IF jwt_email IN ('chinmay4jain@gmail.com', 'chinma4jain@gmail.com') THEN
    RETURN TRUE;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 3. Enable Row Level Security (RLS) on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Explicit Grants for PostgREST Data API
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- Policy: Allow lightweight health-check / keep-alive ping & own profile read
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users and Admins can view profiles" ON public.profiles;

CREATE POLICY "Users and Admins can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(email)
  OR public.is_admin()
);

-- Policy: Users can insert their own profile, or Admins can insert any profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(email)
  OR public.is_admin()
);

-- Policy: Users can update their own profile, or Admins can update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users and Admins can update profiles" ON public.profiles;

CREATE POLICY "Users and Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(email)
  OR public.is_admin()
)
WITH CHECK (
  auth.uid() = id
  OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(email)
  OR public.is_admin()
);

-- ==============================================================================
-- 4. Automatic Trigger Function for Google Authentication & New Signups
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  extracted_full_name TEXT;
  extracted_first_name TEXT;
  extracted_last_name TEXT;
  extracted_avatar_url TEXT;
  extracted_phone TEXT;
  assigned_role TEXT;
BEGIN
  extracted_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  extracted_first_name := COALESCE(
    NEW.raw_user_meta_data->>'given_name',
    split_part(extracted_full_name, ' ', 1),
    split_part(NEW.email, '@', 1)
  );

  extracted_last_name := COALESCE(
    NEW.raw_user_meta_data->>'family_name',
    NULLIF(trim(substr(extracted_full_name, length(extracted_first_name) + 1)), '')
  );

  extracted_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    ''
  );

  extracted_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    ''
  );

  IF LOWER(NEW.email) IN ('chinmay4jain@gmail.com', 'chinma4jain@gmail.com') THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'unpaid';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    avatar_url,
    phone,
    role,
    profile_data,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    LOWER(TRIM(NEW.email)),
    extracted_full_name,
    extracted_first_name,
    extracted_last_name,
    extracted_avatar_url,
    extracted_phone,
    assigned_role,
    jsonb_build_object(
      'firstName', extracted_first_name,
      'lastName', COALESCE(extracted_last_name, ''),
      'email', LOWER(TRIM(NEW.email)),
      'avatarUrl', extracted_avatar_url,
      'phone', extracted_phone
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    avatar_url = CASE 
      WHEN EXCLUDED.avatar_url <> '' THEN EXCLUDED.avatar_url 
      ELSE public.profiles.avatar_url 
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill any existing users who authenticated before this trigger was created
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  first_name,
  last_name,
  avatar_url,
  phone,
  role,
  profile_data,
  created_at,
  updated_at
)
SELECT 
  u.id,
  LOWER(TRIM(u.email)),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'given_name', split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)), ' ', 1)),
  COALESCE(u.raw_user_meta_data->>'family_name', ''),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', ''),
  COALESCE(u.raw_user_meta_data->>'phone', ''),
  CASE 
    WHEN LOWER(u.email) IN ('chinmay4jain@gmail.com', 'chinma4jain@gmail.com') THEN 'admin' 
    ELSE 'unpaid' 
  END,
  jsonb_build_object(
    'firstName', COALESCE(u.raw_user_meta_data->>'given_name', split_part(u.email, '@', 1)),
    'lastName', COALESCE(u.raw_user_meta_data->>'family_name', ''),
    'email', LOWER(TRIM(u.email)),
    'avatarUrl', COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', '')
  ),
  u.created_at,
  NOW()
FROM auth.users u
WHERE u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 6. Weekly Tracker Entries Table & Non-Recursive Policies
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.weekly_tracker_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT NOT NULL,
  check_in_date DATE,
  week_date DATE,
  week_number INT DEFAULT 1,
  weight_kg NUMERIC,
  waist_inches NUMERIC,
  avg_steps_per_day INT DEFAULT 0,
  notes TEXT DEFAULT '',
  entry_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weekly_tracker_email ON public.weekly_tracker_entries(LOWER(user_email));
CREATE INDEX IF NOT EXISTS idx_weekly_tracker_date ON public.weekly_tracker_entries(check_in_date DESC);

ALTER TABLE public.weekly_tracker_entries ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.weekly_tracker_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_tracker_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_tracker_entries TO service_role;

DROP POLICY IF EXISTS "Users can manage own tracker entries" ON public.weekly_tracker_entries;
DROP POLICY IF EXISTS "Admins can view and manage all tracker entries" ON public.weekly_tracker_entries;

CREATE POLICY "Users and Admins can manage tracker entries"
ON public.weekly_tracker_entries
FOR ALL
TO authenticated
USING (
  auth.uid()::text = user_id 
  OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  OR public.is_admin()
)
WITH CHECK (
  auth.uid()::text = user_id 
  OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  OR public.is_admin()
);

-- ==============================================================================
-- 7. Meal Plans Table & Non-Recursive Policies (Cross-Device Sync)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT NOT NULL,
  name TEXT,
  daily_calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fats_g NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT DEFAULT 'user',
  plan_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely alter id column to TEXT if an older UUID-only table existed
DO $$
BEGIN
  ALTER TABLE public.meal_plans ALTER COLUMN id TYPE TEXT USING id::text;
  ALTER TABLE public.meal_plans ALTER COLUMN user_id DROP NOT NULL;
  ALTER TABLE public.meal_plans DROP CONSTRAINT IF EXISTS meal_plans_user_id_fkey;
  ALTER TABLE public.meal_plans ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'user';
  ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_meal_plans_email ON public.meal_plans(LOWER(user_email));

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plans TO service_role;

DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users and Admins can manage meal plans" ON public.meal_plans;

CREATE POLICY "Users and Admins can manage meal plans"
ON public.meal_plans
FOR ALL
TO authenticated
USING (
  auth.uid()::text = user_id
  OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  OR public.is_admin()
)
WITH CHECK (
  auth.uid()::text = user_id
  OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  OR public.is_admin()
);

-- ==============================================================================
-- 8. Workout Plans Table & Non-Recursive Policies (Cross-Device Sync)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT NOT NULL,
  name TEXT,
  goal TEXT,
  difficulty TEXT,
  days_per_week INT DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT DEFAULT 'user',
  plan_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_plans_email ON public.workout_plans(LOWER(user_email));

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plans TO service_role;

DROP POLICY IF EXISTS "Users and Admins can manage workout plans" ON public.workout_plans;

CREATE POLICY "Users and Admins can manage workout plans"
ON public.workout_plans
FOR ALL
TO authenticated
USING (
  auth.uid()::text = user_id
  OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  OR public.is_admin()
)
WITH CHECK (
  auth.uid()::text = user_id
  OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) = LOWER(user_email)
  OR public.is_admin()
);

-- ==============================================================================
-- 9. Supabase Storage Bucket for Compressed Progress Photos (<120KB)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'progress-photos',
  'progress-photos',
  true,
  2097152, -- 2MB hard cap (client compresses to ~80-120KB)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152;

DROP POLICY IF EXISTS "Authenticated users can upload progress photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload progress photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'progress-photos');

DROP POLICY IF EXISTS "Authenticated users can update progress photos" ON storage.objects;
CREATE POLICY "Authenticated users can update progress photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'progress-photos');

DROP POLICY IF EXISTS "Public read access for progress photos" ON storage.objects;
CREATE POLICY "Public read access for progress photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'progress-photos');

-- ==============================================================================
-- 10. Enable Realtime Broadcast for Core Tables (Safe Idempotency)
-- ==============================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['profiles', 'weekly_tracker_entries', 'meal_plans', 'workout_plans']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
