-- ============================================================================
-- HopeVisionAI - Fix RLS Policy for patient_profiles UPSERT Operations
-- ============================================================================
-- This script fixes the RLS policy error when saving patient profile data
-- Error: "new row violates row-level security policy for table patient_profiles"
-- ============================================================================
-- Problem: The INSERT policy checks for is_deleted = false, but during signup
--          the profile might not meet this condition or there's a timing issue.
-- Solution: Ensure INSERT policy works correctly and handles upsert operations
-- ============================================================================

-- Step 1: Drop all existing INSERT policies on patient_profiles to avoid conflicts
-- ============================================================================
DROP POLICY IF EXISTS "Patients can insert own profile" ON patient_profiles;
DROP POLICY IF EXISTS "Users can insert own patient profile" ON patient_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON patient_profiles;
DROP POLICY IF EXISTS "Admins can insert patient profiles" ON patient_profiles;

-- Step 2: Create a more permissive INSERT policy for patients
-- ============================================================================
-- This policy allows insertion if the profile_id belongs to the authenticated user
-- We don't check is_deleted for INSERT because:
-- 1. New patient_profiles should be allowed during signup
-- 2. The profile might have just been created and not yet fully initialized
-- 3. Upsert operations need INSERT policy to work even if UPDATE would fail
CREATE POLICY "Patients can insert own profile"
ON patient_profiles
FOR INSERT
WITH CHECK (
    -- Simply check that the profile_id belongs to the authenticated user
    -- This is the most permissive check that still maintains security
    profile_id IN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
    )
);

-- Step 3: Ensure UPDATE policy allows upsert operations
-- ============================================================================
-- Update the existing UPDATE policy to be more permissive for upsert
DROP POLICY IF EXISTS "Patients can update own profile" ON patient_profiles;

CREATE POLICY "Patients can update own profile"
ON patient_profiles
FOR UPDATE
USING (
    -- Allow update if profile_id belongs to user
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = patient_profiles.profile_id
        AND user_id = auth.uid()
        AND is_deleted = false
    )
)
WITH CHECK (
    -- Allow update if profile_id belongs to user (must match after update)
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = patient_profiles.profile_id
        AND user_id = auth.uid()
        -- Don't check is_deleted here to allow updates during signup
    )
);

-- Step 4: Re-create admin INSERT policy
-- ============================================================================
CREATE POLICY "Admins can insert patient profiles"
ON patient_profiles
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Step 5: Verify RLS is enabled
-- ============================================================================
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Test Query (run this to verify policies work)
-- ============================================================================
-- This query should work if you're authenticated as a patient:
-- 
-- SELECT 
--     p.id as profile_id,
--     pp.id as patient_profile_id
-- FROM profiles p
-- LEFT JOIN patient_profiles pp ON pp.profile_id = p.id
-- WHERE p.user_id = auth.uid()
-- AND p.role = 'patient';
--
-- ============================================================================
-- Verification: List all policies on patient_profiles
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'patient_profiles'
ORDER BY policyname;

