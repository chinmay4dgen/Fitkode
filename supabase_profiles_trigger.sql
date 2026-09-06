-- ==============================================================================
-- FITKODE SUPABASE DATABASE SETUP: PROFILES TABLE & AUTOMATIC USER SIGNUP TRIGGER
-- ==============================================================================
-- Run this SQL in your Supabase Project: Dashboard -> SQL Editor -> New Query -> Run.
--
-- This script:
-- 1. Creates the public.profiles table (matching Fitkode's member schema).
-- 2. Sets up Row Level Security (RLS) so users see their own profile, and
--    Super Admins (chinmay4jain@gmail.com / chinma4jain@gmail.com) see all members.
-- 3. Creates a Postgres trigger on auth.users to automatically create a public.profiles
--    row the exact millisecond a user authenticates with Google.
-- 4. Automatically marks Chinmay Jain as 'admin' and all other members as 'unpaid'.
-- 5. Backfills any existing authenticated users into public.profiles.
-- 6. Adds public.profiles to supabase_realtime so the Admin Portal updates live!
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

-- Index for speedy queries by email and role
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Super Admins can view ALL member profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  LOWER(COALESCE(auth.jwt() ->> 'email', '')) IN ('chinmay4jain@gmail.com', 'chinma4jain@gmail.com')
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
);

-- Policy: Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Policy: Super Admins can update ANY profile (assign tier, update coach notes)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  LOWER(COALESCE(auth.jwt() ->> 'email', '')) IN ('chinmay4jain@gmail.com', 'chinma4jain@gmail.com')
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE public.profiles.id = auth.uid()
    AND public.profiles.role = 'admin'
  )
);

-- 3. Automatic Trigger Function for Google Authentication & New Signups
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
  -- Extract user information from Google OAuth user metadata
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

  -- Assign 'admin' role to Chinmay Jain automatically, and 'unpaid' to all new members
  IF LOWER(NEW.email) IN ('chinmay4jain@gmail.com', 'chinma4jain@gmail.com') THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'unpaid';
  END IF;

  -- Insert new row into public.profiles
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
    NEW.email,
    extracted_full_name,
    extracted_first_name,
    extracted_last_name,
    extracted_avatar_url,
    extracted_phone,
    assigned_role,
    jsonb_build_object(
      'firstName', extracted_first_name,
      'lastName', COALESCE(extracted_last_name, ''),
      'email', NEW.email,
      'avatarUrl', extracted_avatar_url,
      'phone', extracted_phone
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = CASE 
      WHEN EXCLUDED.avatar_url <> '' THEN EXCLUDED.avatar_url 
      ELSE public.profiles.avatar_url 
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- 4. Attach Trigger to auth.users table
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
  u.email,
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
    'email', u.email,
    'avatarUrl', COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', '')
  ),
  u.created_at,
  NOW()
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 6. Enable Realtime Broadcast for public.profiles (Safe idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Publication already contains table or permissions managed by Supabase
END $$;
