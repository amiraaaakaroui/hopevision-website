# Email Confirmation + Profile Creation Fix

## Problem Summary

When email confirmation is enabled in Supabase Auth:
1. User signs up → `signUp()` returns `{ user, session: null }`
2. Profile creation fails because RLS requires `auth.uid()` (needs session)
3. User confirms email → Redirected back to app
4. Profile was never created → Login fails with "not a patient account"
5. User is stuck in infinite loop

## Solution Architecture

### 1. Database Trigger (Primary Method)
**File**: `supabase_profile_auto_create.sql`

- **Function**: `handle_new_user()` - Auto-creates profile when email is confirmed
- **Triggers**: 
  - `on_auth_user_email_confirmed` - Fires when `email_confirmed_at` is set
  - `on_auth_user_created` - Fires on INSERT if email already confirmed
- **How it works**:
  - Reads `role` from `auth.users.raw_user_meta_data`
  - Creates `profiles` row with correct role
  - Creates corresponding `patient_profiles` or `doctor_profiles`
- **Security**: Uses `SECURITY DEFINER` to bypass RLS (secure because it only creates for the user being confirmed)

### 2. Frontend Fallback (Defensive)
**Files**: `LoginPatient.tsx`, `LoginDoctor.tsx`, `useAuth.ts`

- **LoginPatient/LoginDoctor**: If profile is missing after login, create it from user metadata
- **useAuth**: If profile is missing when loading, create it automatically
- **RLS Compliance**: Uses `user_id = auth.uid()` which satisfies RLS policy

### 3. Email Confirmation Redirect Handling
**File**: `App.tsx`

- Detects email confirmation redirect (checks URL hash for `access_token` and `type=signup`)
- Checks for pending signup data in `sessionStorage`
- Navigates to appropriate step (Step 2 for patient, Step 3 for doctor)

### 4. Signup Flow Updates
**Files**: `SignupPatientStep1.tsx`, `SignupDoctorStep1.tsx`

- Stores `role` in user metadata during signup
- If email confirmation required: Shows friendly message, stores form data
- If email confirmation disabled: Creates profile immediately (as before)

## Files Modified

### SQL Files
- ✅ `supabase_profile_auto_create.sql` (new) - Database trigger for auto-creating profiles

### Frontend Files
- ✅ `src/components/auth/SignupPatientStep1.tsx` - Handles email confirmation requirement
- ✅ `src/components/auth/SignupDoctorStep1.tsx` - Handles email confirmation requirement
- ✅ `src/components/auth/LoginPatient.tsx` - Creates missing profile on login (fallback)
- ✅ `src/components/auth/LoginDoctor.tsx` - Creates missing profile on login (fallback)
- ✅ `src/hooks/useAuth.ts` - Creates missing profile when loading (fallback)
- ✅ `src/App.tsx` - Handles email confirmation redirect

### Documentation
- ✅ `INTEGRATION_SUMMARY.md` - Updated with complete solution architecture

## User Flow (With Email Confirmation)

### Patient Signup:
1. User fills Step 1 form → Clicks "Continuer → Étape 2"
2. `signUp()` called → Email confirmation required
3. UI shows: "Vérification de l'email requise" message
4. User checks email → Clicks confirmation link
5. **Database trigger fires** → Creates `profiles` + `patient_profiles`
6. User redirected back to app → `App.tsx` detects redirect
7. If pending signup data exists → Navigate to Step 2
8. User completes Step 2 → Profile updated with health info
9. ✅ **Success**: User can now log in and access patient dashboard

### Patient Login (After Confirmation):
1. User logs in with confirmed email
2. If profile exists → Normal login flow
3. If profile missing (edge case) → **Fallback creates it** from metadata
4. ✅ **Success**: User can access patient dashboard

## Testing Checklist

- [ ] Signup with email confirmation **enabled**:
  - [ ] Step 1 shows email confirmation message
  - [ ] User confirms email → Profile is created automatically
  - [ ] User can complete Step 2 after confirmation
  - [ ] User can log in successfully

- [ ] Signup with email confirmation **disabled**:
  - [ ] Step 1 creates profile immediately
  - [ ] User proceeds to Step 2 without email confirmation
  - [ ] User can log in successfully

- [ ] Login with missing profile (edge case):
  - [ ] Profile is created automatically from metadata
  - [ ] User can access dashboard

- [ ] Email confirmation redirect:
  - [ ] App detects redirect and navigates to correct step
  - [ ] Pending signup data is preserved

## RLS Compliance

✅ **All profile creation paths respect RLS:**
- Database trigger: Uses `SECURITY DEFINER` (secure by design)
- Frontend fallback: Uses `user_id = auth.uid()` (satisfies RLS policy)
- No global "allow all" policies
- Users can only create their own profiles

## Next Steps

1. **Run SQL migration**: Execute `supabase_profile_auto_create.sql` in Supabase SQL Editor
2. **Test the flow**: Sign up with email confirmation enabled
3. **Verify**: Check that profiles are created automatically after email confirmation
4. **Clean up**: Remove debug console.log statements once confirmed working

