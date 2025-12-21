-- ============================================================================
-- HopeVisionAI - Fix RLS Policy for doctor_profiles UPSERT Operations
-- ============================================================================
-- This script fixes the RLS policy to allow UPSERT operations on doctor_profiles
-- Similar to the fix for patient_profiles
-- ============================================================================

-- Step 1: Drop all existing UPDATE policies on doctor_profiles to avoid conflicts
-- ============================================================================
DROP POLICY IF EXISTS "Doctors can update own profile" ON doctor_profiles;
DROP POLICY IF EXISTS "Users can update own doctor profile" ON doctor_profiles;

-- Step 2: Create UPDATE policy with both USING and WITH CHECK for upsert
-- ============================================================================
-- WITH CHECK is required for upsert operations
CREATE POLICY "Doctors can update own profile"
ON doctor_profiles
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
    -- Check updated row will belong to user (same check for flexibility)
    profile_id IN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
    )
);

-- Step 3: Ensure INSERT policy exists (may already exist from supabase_rls_insert_policies.sql)
-- ============================================================================
-- Check if INSERT policy exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'doctor_profiles' 
        AND policyname = 'Users can insert own doctor profile'
        AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "Users can insert own doctor profile"
        ON doctor_profiles
        FOR INSERT
        WITH CHECK (
            profile_id IN (
                SELECT id FROM profiles
                WHERE user_id = auth.uid()
            )
        );
        
        RAISE NOTICE 'INSERT policy created for doctor_profiles';
    ELSE
        RAISE NOTICE 'INSERT policy already exists for doctor_profiles';
    END IF;
END $$;

-- Step 4: Ensure RLS is enabled
-- ============================================================================
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;

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
WHERE tablename = 'doctor_profiles'
ORDER BY policyname, cmd;

