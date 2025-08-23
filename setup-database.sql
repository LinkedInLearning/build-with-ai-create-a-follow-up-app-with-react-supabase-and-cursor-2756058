-- =====================================================
-- COMPLETE DATABASE SETUP FOR FOLLOW-UP APP
-- =====================================================
-- This file contains all necessary SQL commands to set up the database
-- Run this file in your Supabase SQL editor to set up the complete system

-- =====================================================
-- 1. CREATE EXTENSIONS
-- =====================================================

-- Enable pgcrypto for hashing functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 2. CREATE TABLES
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

-- Create followups table
CREATE TABLE IF NOT EXISTS followups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  template TEXT,
  status TEXT DEFAULT 'pending'
);

-- Create audit_logs table for super admin monitoring
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  additional_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on the hashed view
ALTER VIEW leads_hashed SET (security_invoker = true);


-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "users_view_own_record" ON users;
DROP POLICY IF EXISTS "authenticated_view_roles" ON roles;
DROP POLICY IF EXISTS "authenticated_access_users" ON users;
DROP POLICY IF EXISTS "authenticated_access_leads" ON leads;
DROP POLICY IF EXISTS "super_admin_leads_full_access" ON leads;
DROP POLICY IF EXISTS "sub_admin_leads_hashed_access" ON leads;
DROP POLICY IF EXISTS "authenticated_access_followups" ON followups;
DROP POLICY IF EXISTS "super_admin_audit_logs_access" ON audit_logs;
DROP POLICY IF EXISTS "super_admin_audit_logs_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_deny_delete" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_deny_update" ON audit_logs;


-- Users table policies
CREATE POLICY "users_view_own_record" ON users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "authenticated_access_users" ON users
  FOR ALL USING (auth.role() = 'authenticated');

-- Roles table policies
CREATE POLICY "authenticated_view_roles" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Leads table policies - role-based data visibility
-- Super admin can see all data (raw email/phone)
CREATE POLICY "super_admin_leads_full_access" ON leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Sub admin can see leads but with hashed sensitive data
CREATE POLICY "sub_admin_leads_hashed_access" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.user_id = auth.uid() AND r.name = 'sub_admin'
    )
  );

-- Followups table policies
CREATE POLICY "authenticated_access_followups" ON followups
  FOR ALL USING (auth.role() = 'authenticated');

-- Audit logs table policies - only super admin can view, no one can delete
CREATE POLICY "super_admin_audit_logs_select" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Allow insert for audit logging function (system use only)
CREATE POLICY "audit_logs_insert_system" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Explicitly deny DELETE operations for all users
CREATE POLICY "audit_logs_deny_delete" ON audit_logs
  FOR DELETE USING (false);

-- Explicitly deny UPDATE operations for all users (except system functions)
CREATE POLICY "audit_logs_deny_update" ON audit_logs
  FOR UPDATE USING (false);



-- =====================================================
-- 5. CREATE FUNCTIONS
-- =====================================================

-- Function to automatically hash email and phone for leads
CREATE OR REPLACE FUNCTION hash_lead_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Hash email if provided
  IF NEW.email IS NOT NULL THEN
    NEW.email_hash := encode(digest(NEW.email, 'sha256'), 'hex');
  END IF;
  
  -- Hash phone if provided
  IF NEW.phone IS NOT NULL THEN
    NEW.phone_hash := encode(digest(NEW.phone, 'sha256'), 'hex');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit events
-- This function uses SECURITY DEFINER to bypass RLS for audit logging
-- Only system functions should call this, not direct user queries
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_role TEXT,
  p_action TEXT,
  p_table_name TEXT,
  p_lead_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_additional_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    role,
    action,
    table_name,
    lead_id,
    ip_address,
    user_agent,
    additional_data
  ) VALUES (
    p_user_id,
    p_role,
    p_action,
    p_table_name,
    p_lead_id,
    p_ip_address,
    p_user_agent,
    p_additional_data
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE USER MANAGEMENT FUNCTION
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
-- 7. CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS hash_lead_data_trigger ON leads;

-- Create trigger to automatically handle new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure hash columns exist in leads table BEFORE creating triggers and views
DO $$
BEGIN
  -- Add email_hash column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'email_hash'
  ) THEN
    ALTER TABLE leads ADD COLUMN email_hash TEXT;
    RAISE NOTICE 'Added email_hash column to leads table';
  END IF;
  
  -- Add phone_hash column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'phone_hash'
  ) THEN
    ALTER TABLE leads ADD COLUMN phone_hash TEXT;
    RAISE NOTICE 'Added phone_hash column to leads table';
  END IF;
END $$;

-- Verify hash columns were added successfully
SELECT 
  'Hash Columns Status:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name IN ('email_hash', 'phone_hash')
ORDER BY column_name;

-- Create trigger to automatically hash lead data
CREATE TRIGGER hash_lead_data_trigger
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION hash_lead_data();

-- Create view for sub-admins with hashed sensitive data
CREATE OR REPLACE VIEW leads_hashed AS
SELECT 
  id,
  created_at,
  name,
  CASE 
    WHEN email_hash IS NOT NULL AND email IS NOT NULL THEN 
      CONCAT(LEFT(email, 2), '***', SUBSTRING(email FROM POSITION('@' IN email)))
    ELSE email 
  END as email,
  CASE 
    WHEN phone_hash IS NOT NULL AND phone IS NOT NULL AND LENGTH(phone) >= 7 THEN 
      CONCAT(LEFT(phone, 3), '***', RIGHT(phone, 4))
    ELSE phone 
  END as phone,
  email_hash,
  phone_hash,
  source,
  interest,
  note,
  assigned_to
FROM leads;

-- =====================================================
-- 8. FIX EXISTING USERS (if any)
-- =====================================================

-- Fix any existing users with missing or invalid roles
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'sub_admin')
WHERE role_id IS NULL 
   OR role_id NOT IN (SELECT id FROM roles);

-- =====================================================
-- 9. POPULATE EXISTING LEADS WITH HASHED VALUES
-- =====================================================

-- Update existing leads to populate hash columns
UPDATE leads 
SET 
  email_hash = CASE 
    WHEN email IS NOT NULL THEN encode(digest(email, 'sha256'), 'hex')
    ELSE NULL 
  END,
  phone_hash = CASE 
    WHEN phone IS NOT NULL THEN encode(digest(phone, 'sha256'), 'hex')
    ELSE NULL 
  END
WHERE email_hash IS NULL OR phone_hash IS NULL;

-- =====================================================
-- 10. VERIFICATION QUERIES
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

-- Show audit logs table structure (for super admin verification)
SELECT 
  'Audit Logs Table Structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Show audit log function
SELECT 
  'Audit Log Function:' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'log_audit_event';

-- Show audit log RLS policies
SELECT 
  'Audit Log RLS Policies:' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'audit_logs';

-- Show leads table structure with hash columns
SELECT 
  'Leads Table Structure with Hash Columns:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Show hash function
SELECT 
  'Hash Function:' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'hash_lead_data';

-- Show leads RLS policies
SELECT 
  'Leads RLS Policies:' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'leads';

-- Verify leads_hashed view exists
SELECT 
  'Leads Hashed View:' as info,
  schemaname,
  viewname,
  CASE WHEN viewname IS NOT NULL THEN 'View created successfully' ELSE 'View not found' END as status
FROM pg_views 
WHERE viewname = 'leads_hashed';

-- Test the view with a sample query
SELECT 
  'View Test:' as info,
  COUNT(*) as total_records
FROM leads_hashed;

-- Show sample data from the view (first 3 records)
SELECT 
  'Sample View Data:' as info,
  id,
  name,
  email,
  phone
FROM leads_hashed 
LIMIT 3;

-- =====================================================
-- 11. USEFUL QUERIES FOR TROUBLESHOOTING
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
WHERE table_name IN ('users', 'roles', 'leads', 'audit_logs')
ORDER BY table_name, ordinal_position;