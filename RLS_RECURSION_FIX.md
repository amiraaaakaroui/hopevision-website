# RLS Infinite Recursion Fix for patient_profiles

## Problem

When submitting the patient onboarding Step 2 form, the app encountered:
```
ERROR: infinite recursion detected in policy for relation "patient_profiles"
```

This occurred during the `upsert()` operation on `patient_profiles` in `SignupPatientStep2.tsx`.

## Root Cause Analysis

### 1. Missing WITH CHECK Clause
The UPDATE policy on `patient_profiles` in `supabase_rls_policies.sql` only had a `USING` clause:
```sql
CREATE POLICY "Patients can update own profile"
    ON patient_profiles FOR UPDATE
    USING (profile_id = get_user_profile());
```

**Problem**: During `upsert()` operations, PostgreSQL evaluates:
- `USING` clause: For reading existing rows (SELECT part of upsert)
- `WITH CHECK` clause: For writing new/updated rows (INSERT/UPDATE part of upsert)

If `WITH CHECK` is missing, it defaults to `USING`, which can cause evaluation issues during INSERT operations in upsert.

### 2. Potential Indirect Recursion
While `get_user_profile()` itself only queries `profiles` (not `patient_profiles`), during RLS evaluation:
1. Policy checks `profile_id = get_user_profile()`
2. `get_user_profile()` queries `profiles` table
3. If `profiles` RLS policies somehow trigger evaluation of `patient_profiles` (e.g., through joins or triggers), recursion occurs

### 3. Upsert Operation Complexity
The `upsert()` operation performs both:
- **INSERT** if row doesn't exist → Evaluates INSERT policies
- **UPDATE** if row exists → Evaluates UPDATE policies

Both paths need explicit, non-recursive policies.

## Solution

### New Policy Pattern (Non-Recursive)

All `patient_profiles` policies now:
1. **Avoid querying `patient_profiles` itself** inside policy conditions
2. **Base checks directly on `profiles` table** via subquery
3. **Include explicit `WITH CHECK` clauses** for UPDATE and INSERT
4. **Use `auth.uid()` directly** instead of relying solely on helper functions

### Example: Fixed UPDATE Policy

```sql
CREATE POLICY "Patients can update own profile"
    ON patient_profiles FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
            AND is_deleted = false
        )
    )
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
            AND is_deleted = false
        )
    );
```

**Why this works:**
- Queries `profiles` table, not `patient_profiles` → No recursion
- Uses `auth.uid()` directly → No indirect function calls
- Explicit `WITH CHECK` → Works correctly for both INSERT and UPDATE in upsert
- Includes soft delete check → Respects `is_deleted` flag

### Example: Fixed INSERT Policy

```sql
CREATE POLICY "Users can insert own patient profile"
    ON patient_profiles FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles
            WHERE user_id = auth.uid()
            AND is_deleted = false
        )
    );
```

**Why this works:**
- Direct check on `profiles` table → No recursion
- Uses `auth.uid()` → Secure and direct
- Includes soft delete check → Prevents inserting for deleted profiles

## Implementation

### SQL File: `supabase_rls_patient_profiles_fix.sql`

This file:
1. **Drops** all existing `patient_profiles` policies
2. **Recreates** them with non-recursive patterns
3. **Updates** `get_user_profile()` function to include soft delete check

### Policies Fixed

1. ✅ `"Patients can view own profile"` - SELECT policy
2. ✅ `"Patients can update own profile"` - UPDATE policy (added WITH CHECK)
3. ✅ `"Users can insert own patient profile"` - INSERT policy
4. ✅ `"Doctors can view assigned patients"` - SELECT policy (for doctors)
5. ✅ `"Admins can view all patient profiles"` - SELECT policy (for admins)
6. ✅ `"Admins can insert patient profiles"` - INSERT policy (for admins)

## Testing

After applying the fix:

1. **Sign up as patient** → Step 1
2. **Confirm email** → Database trigger creates profile
3. **Login** → Redirects to onboarding Step 2
4. **Fill Step 2 form** → Submit
5. **Expected**: No recursion error, profile updated successfully
6. **Verify**: Check `patient_profiles` table has correct data

## Frontend Code (No Changes Needed)

The frontend code in `SignupPatientStep2.tsx` is already correct:
```typescript
await supabase
  .from('patient_profiles')
  .upsert(patientProfileData, {
    onConflict: 'profile_id',
  });
```

The fix is entirely in the database RLS policies.

## Security Verification

All new policies maintain security:
- ✅ Users can only INSERT/UPDATE their own `patient_profiles`
- ✅ Checks are based on `auth.uid()` → Secure
- ✅ Soft delete checks prevent access to deleted profiles
- ✅ Admin policies allow admins to view/insert all profiles
- ✅ Doctor policies allow viewing assigned patients only

## Key Takeaways

1. **Always include `WITH CHECK` for UPDATE policies** when using upsert
2. **Never query the protected table inside its own RLS policies**
3. **Base checks on parent tables** (`profiles`) or `auth.uid()` directly
4. **Test upsert operations** as they evaluate both INSERT and UPDATE paths

