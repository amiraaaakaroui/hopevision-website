# Patient Onboarding Flow - Complete Implementation

## Problem Solved

Previously, after email confirmation, patients would land on an empty dashboard showing "Aucune donnée disponible" because:
- Profile was created but `patient_profiles` was empty
- No onboarding step to collect health information
- No redirect logic to guide users through onboarding

## Solution Implemented

### 1. Enhanced Onboarding Form (SignupPatientStep2.tsx)

**Fields Added:**
- ✅ **Blood Group** (groupe sanguin) - dropdown with A+, A-, B+, B-, AB+, AB-, O+, O-
- ✅ **Weight** (poids) - number input in kg
- ✅ **Height** (taille) - number input in cm
- ✅ **Date of Birth** - now **required** (was optional)
- ✅ **Gender** - now **required** (was optional)

**Features:**
- Pre-fills form with existing profile data (reusable for editing)
- Works without step1Data (can be accessed from login/edit)
- Validates required fields before submission
- Creates timeline event on completion

**Fields Collected:**
- `profiles.date_of_birth` (required)
- `patient_profiles.gender` (required: 'female' | 'male' | 'other')
- `patient_profiles.blood_group` (optional)
- `patient_profiles.weight_kg` (optional)
- `patient_profiles.height_cm` (optional)
- `patient_profiles.allergies` (optional: TEXT[] array)
- `patient_profiles.medical_history` (optional: TEXT, comma-separated)

### 2. Profile Completeness Detection

**Helper Function:** `src/utils/profileHelpers.ts`
- `isPatientProfileIncomplete()` checks if profile is missing:
  - `profiles.date_of_birth` (required)
  - `patient_profiles.gender` (required)
- Returns `true` if any required field is missing

### 3. Redirect Logic

**App.tsx:**
- After email confirmation redirect, checks for pending signup data
- If pending signup exists → Navigate to `signup-patient-step2`
- After auth state loads, checks profile completeness
- If incomplete → Redirect to onboarding
- If complete → Allow access to dashboard

**LoginPatient.tsx:**
- After successful login, checks profile completeness
- If incomplete → Redirect to onboarding
- If complete → Navigate to dashboard

### 4. PatientHistory Dashboard

**Empty State:**
- Shows "Aucune donnée disponible" if profile is missing
- Displays "Compléter mon profil" button linking to onboarding

**Filled State:**
- Shows name, age (calculated from date_of_birth), blood group, allergies, last visit
- All data comes from real Supabase queries

## Complete User Flow

### With Email Confirmation Enabled:

1. **Step 1 (SignupPatientStep1)**:
   - User fills form → Clicks "Continuer → Étape 2"
   - `signUp()` called → Email confirmation required
   - UI shows: "Vérification de l'email requise"
   - Form data stored in `sessionStorage`

2. **Email Confirmation**:
   - User clicks confirmation link
   - Database trigger creates `profiles` + `patient_profiles`
   - User redirected to app with `access_token` in URL

3. **App.tsx Detects Redirect**:
   - Checks for pending signup data
   - Navigates to `signup-patient-step2` (onboarding)

4. **Step 2 (Onboarding)**:
   - User fills required fields (date of birth, gender)
   - User fills optional fields (blood group, weight, height, allergies, chronic diseases)
   - Clicks "Terminer et accéder à mon espace Patient"
   - Profile updated in `profiles` + `patient_profiles`
   - Timeline event created: "Inscription sur HopeVisionAI"
   - Navigates to `patient-history`

5. **PatientHistory Dashboard**:
   - Shows filled profile (name, age, blood group, allergies, last visit)
   - User can now use the platform

### With Email Confirmation Disabled:

1. **Step 1**: Creates profile immediately
2. **Step 2**: User proceeds directly to onboarding
3. **Dashboard**: Shows filled profile

### Returning User (Profile Incomplete):

1. **Login**: User logs in
2. **Completeness Check**: Profile detected as incomplete
3. **Redirect**: Automatically redirected to onboarding
4. **Onboarding**: User completes missing fields
5. **Dashboard**: Access granted

## Files Modified

### New Files:
- ✅ `src/utils/profileHelpers.ts` - Profile completeness detection

### Modified Files:
- ✅ `src/components/auth/SignupPatientStep2.tsx` - Enhanced onboarding form
- ✅ `src/components/auth/LoginPatient.tsx` - Completeness check on login
- ✅ `src/App.tsx` - Redirect logic after email confirmation
- ✅ `src/components/PatientHistory.tsx` - Empty state with "Compléter mon profil" button
- ✅ `INTEGRATION_SUMMARY.md` - Documentation updated

## RLS Compliance

All updates respect RLS policies:
- `profiles` UPDATE: `user_id = auth.uid()`
- `patient_profiles` UPDATE: `profile_id = get_user_profile()`
- `timeline_events` INSERT: `patient_profile_id` belongs to current user

## Testing Checklist

- [ ] Signup with email confirmation → Redirects to onboarding
- [ ] Onboarding form pre-fills existing data
- [ ] Required fields validation works
- [ ] Profile updates correctly
- [ ] Timeline event created on completion
- [ ] Login with incomplete profile → Redirects to onboarding
- [ ] Login with complete profile → Goes to dashboard
- [ ] PatientHistory shows real data when profile is filled
- [ ] PatientHistory shows "Compléter mon profil" when profile is empty

