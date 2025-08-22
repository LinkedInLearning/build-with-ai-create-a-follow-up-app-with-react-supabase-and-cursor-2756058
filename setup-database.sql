-- =====================================================
-- COMPLETE DATABASE SETUP FOR FOLLOW-UP APP
-- =====================================================
-- This file contains all necessary SQL commands to set up the database
-- Run this file in your Supabase SQL editor to set up the complete system

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table (with nullable role_id for flexibility)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  source TEXT NOT NULL,
  interest TEXT NOT NULL,
  note TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 2. INSERT DEFAULT DATA
-- =====================================================

-- Insert default roles
INSERT INTO roles (name) VALUES 
  ('super_admin'),
  ('sub_admin')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "users_view_own_record" ON users;
DROP POLICY IF EXISTS "authenticated_view_roles" ON roles;
DROP POLICY IF EXISTS "authenticated_access_users" ON users;
DROP POLICY IF EXISTS "authenticated_access_leads" ON leads;

-- Users table policies
CREATE POLICY "users_view_own_record" ON users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "authenticated_access_users" ON users
  FOR ALL USING (auth.role() = 'authenticated');

-- Roles table policies
CREATE POLICY "authenticated_view_roles" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Leads table policies
CREATE POLICY "authenticated_access_leads" ON leads
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 5. CREATE USER MANAGEMENT FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create improved user creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
  default_role_id UUID;
BEGIN
  -- Check if a user record already exists for this email
  SELECT id INTO existing_user_id 
  FROM users 
  WHERE email = NEW.email;
  
  IF existing_user_id IS NOT NULL THEN
    -- User record already exists, update it with the auth user ID
    UPDATE users 
    SET user_id = NEW.id 
    WHERE id = existing_user_id;
    
    -- Also ensure they have a valid role
    UPDATE users 
    SET role_id = COALESCE(
      role_id, 
      (SELECT id FROM roles WHERE name = 'sub_admin')
    )
    WHERE id = existing_user_id 
    AND (role_id IS NULL OR role_id NOT IN (SELECT id FROM roles));
    
    RAISE NOTICE 'Linked existing user record % to auth user %', existing_user_id, NEW.id;
  ELSE
    -- No existing user record, create a new one with default role
    SELECT id INTO default_role_id FROM roles WHERE name = 'sub_admin';
    
    -- If no sub_admin role exists, create it
    IF default_role_id IS NULL THEN
      INSERT INTO roles (name) VALUES ('sub_admin') ON CONFLICT (name) DO NOTHING;
      SELECT id INTO default_role_id FROM roles WHERE name = 'sub_admin';
    END IF;
    
    INSERT INTO users (user_id, email, role_id)
    VALUES (NEW.id, NEW.email, default_role_id);
    
    RAISE NOTICE 'Created new user record for auth user % with role sub_admin', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE TRIGGER
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically handle new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 7. FIX EXISTING USERS (if any)
-- =====================================================

-- Fix any existing users with missing or invalid roles
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'sub_admin')
WHERE role_id IS NULL 
   OR role_id NOT IN (SELECT id FROM roles);

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Show current setup status
SELECT 
  'Database Setup Complete' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role_id IS NOT NULL THEN 1 END) as users_with_roles
FROM users;

-- Show all users and their roles
SELECT 
  u.email,
  r.name as role_name,
  CASE 
    WHEN u.role_id IS NULL THEN 'NO ROLE'
    WHEN r.name IS NULL THEN 'INVALID ROLE'
    ELSE 'VALID ROLE'
  END as status
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY u.created_at DESC;

-- Show available roles
SELECT 'Available Roles:' as info, name FROM roles;

-- =====================================================
-- 9. USEFUL QUERIES FOR TROUBLESHOOTING
-- =====================================================

-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check table structure
SELECT 
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('users', 'roles', 'leads')
ORDER BY table_name, ordinal_position;