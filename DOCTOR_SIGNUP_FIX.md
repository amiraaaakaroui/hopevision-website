# Doctor Signup & Login Fix (Round 2)

## Problem Summary

After the initial Doctor signup fixes (adding `emailRedirectTo` and `?role=doctor`), two new critical bugs emerged:

1. **Email Confirmation Infinite Loading**: After clicking "Confirm email" in the email, the page would load forever (spinner in tab) and never render the app UI.

2. **Login Button Stuck Loading**: After entering credentials and clicking "Connexion", the login button would show "..." (loading state) indefinitely, with no navigation or error message.

## Root Causes

### Bug 1: Email Confirmation Infinite Loading

**Root Cause**: The `useAuth` hook fallback profile creation logic (lines 79-84) attempted to INSERT into `doctor_profiles` without the required `specialty` field.

**Code Location**: `src/hooks/useAuth.ts:80-84`

**What Was Wrong**:
```typescript
} else if (role === 'doctor') {
  await supabase
    .from('doctor_profiles')
    .insert({ profile_id: newProfile.id, is_verified: false }) // ❌ Missing specialty
    .select('id')
    .maybeSingle();
}
```

The `doctor_profiles` table has a `specialty VARCHAR NOT NULL` column. When the INSERT failed due to the missing field, it caused a database error. While the error was caught and logged (line 133), the app may have appeared stuck because:
- The `useAuth` loading state was not properly handled
- The profile creation failed silently, leaving the app in an inconsistent state

### Bug 2: Login Button Stuck Loading

**Root Cause**: The `LoginDoctor.tsx` fallback profile creation logic (lines 85-89) had the same issue - missing `specialty` field in the INSERT.

**Code Location**: `src/components/auth/LoginDoctor.tsx:85-89`

**What Was Wrong**:
```typescript
if (role === 'doctor') {
  await supabase
    .from('doctor_profiles')
    .insert({ profile_id: newProfile.id, is_verified: false }) // ❌ Missing specialty
    .select('id')
    .maybeSingle();
}
```

**Additional Issue**: While `LoginDoctor` DID have a `finally` block (line 132-134) to reset loading state, the database error during profile creation caused the subsequent profile checks (lines 94-127) to fail or behave unexpectedly, potentially throwing errors before navigation could occur.

### Why This Happened

All three locations that create `doctor_profiles` needed to provide the `specialty` field:
1. ✅ **Database Trigger** (`supabase_profile_auto_create.sql`) - **FIXED** in previous iteration
2. ❌ **useAuth Fallback** (`src/hooks/useAuth.ts`) - **BROKEN**
3. ❌ **LoginDoctor Fallback** (`src/components/auth/LoginDoctor.tsx`) - **BROKEN**

The trigger was fixed to extract `specialty` from user metadata, but the frontend fallbacks were not updated.

## Solution Implemented

### Fix 1: Update `useAuth.ts` Fallback

**File**: `src/hooks/useAuth.ts`  
**Lines Changed**: 79-90

**New Code**:
```typescript
} else if (role === 'doctor') {
  // Extract specialty from metadata, use default if missing
  const specialty = userMetadata.specialty || 'Médecine générale';
  await supabase
    .from('doctor_profiles')
    .insert({ 
      profile_id: newProfile.id, 
      specialty: specialty, // ✅ Now included
      is_verified: false 
    })
    .select('id')
    .maybeSingle();
}
```

### Fix 2: Update `LoginDoctor.tsx` Fallback

**File**: `src/components/auth/LoginDoctor.tsx`  
**Lines Changed**: 83-95

**New Code**:
```typescript
if (role === 'doctor') {
  // Extract specialty from metadata, use default if missing
  const specialty = userMetadata.specialty || 'Médecine générale';
  await supabase
    .from('doctor_profiles')
    .insert({ 
      profile_id: newProfile.id, 
      specialty: specialty, // ✅ Now included
      is_verified: false 
    })
    .select('id')
    .maybeSingle();
}
```

## UX Improvements

The `Landing.tsx` component already has email confirmation detection (lines 158-172):
- Reads `email-confirmed` and `email-confirmed-role` from sessionStorage
- Sets state to display a confirmation banner
- The banner appears for both patient and doctor confirmations (lines 382-405)

**Banner Text for Doctors**:
> "Votre adresse e-mail a été confirmée avec succès ! Vous pouvez maintenant vous connecter pour compléter votre profil médecin et accéder à votre espace professionnel."

## Verification Steps

### 1. Email Confirmation Flow

**Test**:
1. Sign up as doctor with a fresh email
2. Click confirmation link in email
3. **Expected**: Page loads normally (not stuck), shows Landing page with success banner

**What to Check**:
- ✅ No infinite loading spinner
- ✅ App UI renders completely
- ✅ Success banner appears: "Votre email a été confirmé..."
- ✅ Database check: `doctor_profiles` row exists with `specialty` filled

### 2. Login Flow

**Test**:
1. Go to "Connexion Médecin"
2. Enter email + password
3. Click "Connexion"

**Expected**:
- Button briefly shows loading ("...")
- Then navigates to:
  - Onboarding Step 2/3 (if profile incomplete)
  - `doctor-dashboard` (if profile complete)
- No infinite loading
- No silent failure

**What to Check**:
- ✅ Loading state resets after login attempt
- ✅ Navigation occurs
- ✅ Database check: `doctor_profiles` has `specialty`

### 3. Database Verification

**Check Tables**:
```sql
-- Verify auth user exists
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = '<test-email>';

-- Verify profile created
SELECT * FROM profiles WHERE email = '<test-email>';

-- Verify doctor_profile created with specialty
SELECT * FROM doctor_profiles dp
JOIN profiles p ON dp.profile_id = p.id
WHERE p.email = '<test-email>';
```

**Expected**:
- ✅ `auth.users` row exists with `email_confirmed_at` set
- ✅ `profiles` row exists with `role = 'doctor'`
- ✅ `doctor_profiles` row exists with `specialty` NOT NULL

## Complete Doctor Flow (After All Fixes)

1. **Signup**: User fills Step 1, clicks "Continuer"
   - `signUp()` creates user in `auth.users`
   - Email confirmation required message shown
   - `?role=doctor` stored in redirect URL
   - Form data stored in `sessionStorage`

2. **Email Confirmation**: User clicks link in email
   - App detects `code` and `role=doctor` in URL
   - Exchanges code for session
   - Database trigger creates `profiles` + `doctor_profiles` (with specialty)
   - Redirects to Step 2 OR Landing

3. **Landing Page**: Shows success banner
   - "Votre email a été confirmé..."
   - "Se connecter →" button highlighted

4. **Login**: User logs in
   - Checks if `doctor_profiles` exists
   - If missing, fallback creates it (NOW with specialty)
   - Checks if profile complete
   - Redirects to onboarding or dashboard

5. **Onboarding**: User completes Steps 2 & 3
   - Updates `doctor_profiles` with professional info
   - Redirects to dashboard

6. **Future Logins**: Goes directly to dashboard

## Related Files

- ✅ `src/hooks/useAuth.ts` (Fixed)
- ✅ `src/components/auth/LoginDoctor.tsx` (Fixed)
- ✅ `supabase_profile_auto_create.sql` (Fixed in previous iteration)
- ✅ `src/components/Landing.tsx` (Already has email confirmation detection)
- 📝 `INTEGRATION_SUMMARY.md` (To be updated)

## Status

**Fixed and Ready for Testing**

### Testing Checklist

- [ ] Sign up as doctor
- [ ] Click confirmation email
- [ ] Verify no infinite loading
- [ ] See landing page with banner
- [ ] Click "Se connecter"
- [ ] Login successfully
- [ ] Complete onboarding
- [ ] Arrive at dashboard
- [ ] Re-login goes to dashboard directly
