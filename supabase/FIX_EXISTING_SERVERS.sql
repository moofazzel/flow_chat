-- ================================================================
-- FIX EXISTING SERVERS - Add missing server_members entries
-- ================================================================
-- 
-- This script fixes servers that were created but don't have
-- corresponding server_members entries for their owners.
--
-- Run this in Supabase SQL Editor
-- ================================================================

-- Step 1: Check current state
SELECT 
  s.id,
  s.name,
  s.owner_id,
  u.email as owner_email,
  CASE WHEN sm.id IS NULL THEN '❌ Missing' ELSE '✅ Has member' END as member_status
FROM public.servers s
LEFT JOIN public.users u ON u.id = s.owner_id
LEFT JOIN public.server_members sm ON sm.server_id = s.id AND sm.user_id = s.owner_id
ORDER BY s.created_at DESC;

-- Step 2: Add missing server_members for server owners
-- This will fix servers where the owner isn't in server_members
INSERT INTO public.server_members (server_id, user_id, role)
SELECT 
  s.id as server_id,
  s.owner_id as user_id,
  'owner' as role
FROM public.servers s
WHERE NOT EXISTS (
  SELECT 1 FROM public.server_members sm
  WHERE sm.server_id = s.id 
  AND sm.user_id = s.owner_id
)
ON CONFLICT (server_id, user_id) DO NOTHING;

-- Step 3: Verify the fix
SELECT 
  s.id,
  s.name,
  s.owner_id,
  u.email as owner_email,
  sm.role,
  '✅ Fixed!' as status
FROM public.servers s
JOIN public.users u ON u.id = s.owner_id
JOIN public.server_members sm ON sm.server_id = s.id AND sm.user_id = s.owner_id
ORDER BY s.created_at DESC;

-- ================================================================
-- Alternative: Check for a specific user
-- ================================================================
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- (You can get it from the console: "✅ Sidebar: User found: USER_ID")

-- Show servers owned by specific user
SELECT 
  s.*,
  CASE 
    WHEN sm.id IS NULL THEN '❌ Not a member (BUG!)' 
    ELSE '✅ Is member'
  END as membership_status
FROM public.servers s
LEFT JOIN public.server_members sm ON sm.server_id = s.id AND sm.user_id = s.owner_id
WHERE s.owner_id = '4a945466-1073-4c4a-ace2-eb442951f99e'  -- Replace with your user ID
ORDER BY s.created_at DESC;

-- Show all memberships for specific user
SELECT 
  sm.*,
  s.name as server_name
FROM public.server_members sm
JOIN public.servers s ON s.id = sm.server_id
WHERE sm.user_id = '4a945466-1073-4c4a-ace2-eb442951f99e'  -- Replace with your user ID
ORDER BY sm.joined_at DESC;
