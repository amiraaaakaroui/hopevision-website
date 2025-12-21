-- ============================================================================
-- HopeVisionAI - Fix RLS Policy Error for patient_profiles UPSERT
-- ============================================================================
-- Error: "new row violates row-level security policy for table patient_profiles"
-- ============================================================================
-- Problem: The INSERT policy checks for is_deleted = false, which can fail
--          during signup when the profile might not meet this condition yet.
-- Solution: Remove is_deleted check from INSERT policy to allow signup flow
-- ============================================================================

-- Step 1: Drop ALL existing INSERT and UPDATE policies to avoid conflicts
-- ============================================================================
DROP POLICY IF EXISTS "Patients can insert own profile" ON patient_profiles;
DROP POLICY IF EXISTS "Patients can update own profile" ON patient_profiles;
DROP POLICY IF EXISTS "Users can insert own patient profile" ON patient_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON patient_profiles;
DROP POLICY IF EXISTS "Admins can insert patient profiles" ON patient_profiles;

-- Step 2: Create a simplified INSERT policy (without is_deleted check)
-- ============================================================================
-- This allows insertion if profile_id belongs to authenticated user
-- No is_deleted check to allow signup flow
CREATE POLICY "Patients can insert own profile"
ON patient_profiles
FOR INSERT
WITH CHECK (
    -- Only check that profile_id belongs to the authenticated user
    -- This is secure because users can only reference their own profile_id
    profile_id IN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
    )
);

-- Step 3: Create UPDATE policy with both USING and WITH CHECK for upsert
-- ============================================================================
-- WITH CHECK is required for upsert operations
CREATE POLICY "Patients can update own profile"
ON patient_profiles
FOR UPDATE
USING (
    -- Check existing row belongs to user
    profile_id IN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
        AND is_deleted = false
    )
)
WITH CHECK (
    -- Check updated row will belong to user (same check, no is_deleted for flexibility)
    profile_id IN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
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

-- Step 5: Ensure RLS is enabled
-- ============================================================================
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Check that policies are created:
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING'
        ELSE 'No USING'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
        ELSE 'No WITH CHECK'
    END as with_check_clause
FROM pg_policies
WHERE tablename = 'patient_profiles'
ORDER BY policyname, cmd;

