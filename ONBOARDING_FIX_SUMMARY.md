# Patient Onboarding Flow Fix - Summary

## Issues Fixed

### 1. Duplicate Key Error on `patient_profiles`
**Problem**: When submitting Step 2 onboarding form, the code tried to INSERT into `patient_profiles` even when a row already existed (created by database trigger), causing:
```
duplicate key value violates unique constraint "patient_profiles_profile_id_key"
```

**Solution**: Replaced check-then-insert/update logic with **upsert**:
```typescript
await supabase
  .from('patient_profiles')
  .upsert(patientProfileData, {
    onConflict: 'profile_id', // Uses unique constraint
  });
```

**Benefits**:
- If row exists → UPDATE (no duplicate key)
- If row doesn't exist → INSERT
- Single operation, no race conditions
- RLS compliant (both INSERT and UPDATE respect `profile_id = get_user_profile()`)

### 2. Email Confirmation Redirect Flow
**Problem**: After clicking email confirmation link:
- User landed on landing page with no guidance
- Trying to create account again failed
- Clicking "Se connecter" showed "session expired" error
- Flow was confusing

**Solution**:
1. **App.tsx**: Detects email confirmation from URL hash/query params, sets `email-confirmed` flag in sessionStorage, redirects to landing page
2. **Landing.tsx**: Shows success message when `email-confirmed` flag is detected:
   - Green banner: "Votre adresse e-mail a été confirmée avec succès !"
   - Clear instruction: "Vous pouvez maintenant vous connecter pour compléter votre profil patient"
   - Highlighted "Se connecter" button
3. **LoginPatient.tsx**: Checks if user already has a session (from email confirmation) before attempting signIn, avoiding "session expired" errors

### 3. "Session Expired" Error
**Problem**: After email confirmation, when user clicked "Se connecter", the app showed confusing "session expired" error even though login worked.

**Solution**:
1. **SignupPatientStep2.tsx**: 
   - Removed immediate "session expired" check on mount
   - Added delay to allow auth state to initialize after email confirmation
   - Checks session directly via `supabase.auth.getSession()` instead of relying on `authUser` from hook
   - Shows friendly message: "Veuillez vous connecter pour continuer" instead of "Session expirée"
2. **LoginPatient.tsx**: 
   - Checks for existing session before attempting signIn
   - If session exists, skips signIn and directly checks profile completeness
   - No error shown if user is already logged in

## Complete Flow After Fix

### Signup + Email Confirmation + Onboarding

1. **Step 1 (SignupPatientStep1)**:
   - User fills form → Clicks "Continuer → Étape 2"
   - `supabase.auth.signUp()` called with `role: 'patient'` in metadata
   - Email confirmation required → UI shows "Vérification de l'email requise"
   - Form data stored in `sessionStorage`

2. **Email Confirmation**:
   - User clicks confirmation link in email
   - Database trigger creates `profiles` + `patient_profiles` automatically
   - User redirected to app with `access_token` in URL

3. **App.tsx Detects Redirect**:
   - Checks URL for `access_token` and `type=signup`
   - Sets `email-confirmed` flag in sessionStorage
   - If pending signup data exists → Navigate to Step 2
   - If no pending data → Navigate to landing page

4. **Landing Page**:
   - Detects `email-confirmed` flag
   - Shows green success banner with clear instructions
   - Highlights "Se connecter" button

5. **User Clicks "Se connecter"**:
   - **LoginPatient.tsx** checks if session already exists (from email confirmation)
   - If session exists → Skip signIn, check profile completeness directly
   - If no session → Normal signIn flow
   - **No "session expired" error shown**

6. **Profile Completeness Check**:
   - If incomplete (missing `date_of_birth` or `gender`) → Redirect to Step 2 onboarding
   - If complete → Navigate to patient dashboard

7. **Step 2 (Onboarding)**:
   - User fills required fields (date of birth, gender)
   - User fills optional fields (blood group, weight, height, allergies, etc.)
   - Clicks "Terminer et accéder à mon espace Patient"
   - **Upsert** updates `patient_profiles` (no duplicate key error)
   - Timeline event created: "Inscription sur HopeVisionAI"
   - Navigates to patient dashboard

## Files Modified

### 1. `src/components/auth/SignupPatientStep2.tsx`
- **Changed**: Replaced check-then-insert/update with `upsert()` to avoid duplicate key errors
- **Changed**: Improved session handling - checks session directly with delay to allow auth initialization
- **Changed**: Removed confusing "Session expirée" error, replaced with friendly message

### 2. `src/App.tsx`
- **Changed**: Email confirmation detection now checks both URL hash and query params
- **Changed**: Sets `email-confirmed` flag in sessionStorage for landing page
- **Changed**: Reduced timeout from 1500ms to 1000ms

### 3. `src/components/Landing.tsx`
- **Added**: Email confirmation detection via `email-confirmed` flag
- **Added**: Green success banner with clear instructions when email is confirmed
- **Added**: Highlighted "Se connecter" button in success message

### 4. `src/components/auth/LoginPatient.tsx`
- **Changed**: Checks for existing session before attempting signIn
- **Changed**: If session exists, skips signIn and directly checks profile completeness
- **Changed**: No error shown if user is already logged in (smooth flow)

## Technical Details

### Upsert Implementation
```typescript
const { error: patientProfileError } = await supabase
  .from('patient_profiles')
  .upsert(patientProfileData, {
    onConflict: 'profile_id', // Uses unique constraint
  });
```

**Why this works**:
- Supabase `upsert()` automatically handles INSERT vs UPDATE
- `onConflict: 'profile_id'` uses the unique constraint to detect existing rows
- RLS policies allow both INSERT and UPDATE when `profile_id = get_user_profile()`
- No race conditions - single atomic operation

### Session Handling
**Before**: Relied on `authUser` from `useAuth()` hook, which might not be initialized immediately after email confirmation.

**After**: 
- Checks session directly via `supabase.auth.getSession()`
- Adds delay to allow auth state to initialize
- Gracefully handles missing session with friendly message

### Email Confirmation Detection
**Method**: Checks both URL hash (`#access_token=...`) and query params (`?access_token=...`) to handle different Supabase redirect configurations.

**Flag**: Uses `sessionStorage.setItem('email-confirmed', 'true')` to communicate between App.tsx and Landing.tsx without props.

## Testing Checklist

- [x] Signup Step 1 → Email confirmation required
- [x] Click confirmation link → Redirects to landing page
- [x] Landing page shows success message
- [x] Click "Se connecter" → No "session expired" error
- [x] Login redirects to onboarding if profile incomplete
- [x] Step 2 form submission → No duplicate key error
- [x] Profile updates correctly with upsert
- [x] Timeline event created on completion
- [x] Navigates to dashboard after onboarding

## RLS Compliance

All changes respect existing RLS policies:
- `profiles` UPDATE: `user_id = auth.uid()` ✅
- `patient_profiles` UPSERT: `profile_id = get_user_profile()` ✅
- `timeline_events` INSERT: `patient_profile_id` belongs to current user ✅

