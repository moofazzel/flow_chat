-- ================================================================
-- 001_auth_users.sql
-- 
-- User Authentication & Profile System
-- 
-- Purpose: Core user management and authentication setup
-- Dependencies: None (Base migration)
-- 
-- Features:
-- - User profile table linked to auth.users
-- - Automatic profile creation on signup
-- - User status tracking (online/idle/dnd/offline)
-- 
-- Rollback: 
-- DROP TRIGGER on_auth_user_created ON auth.users;
-- DROP FUNCTION handle_new_user();
-- DROP TABLE public.users;
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- USERS PROFILE TABLE
-- ================================================================
-- This table mirrors the auth.users table but holds public profile info
CREATE TABLE public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  status text DEFAULT 'online' CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.users FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile."
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile."
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ================================================================
-- AUTOMATIC PROFILE CREATION
-- ================================================================
-- Trigger to handle new user signups automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that runs after a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);