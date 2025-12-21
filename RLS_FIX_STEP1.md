# RLS Error Fix - Patient Signup Step 1

## Problem

**Error:** `"new row violates row-level security policy for table \"profiles\""`

**Location:** Patient signup Step 1 ("Créer mon compte Patient") when clicking "Continuer → Étape 2"

**Root Cause:** After `supabase.auth.signUp()`, the session might not be immediately available. The RLS policy requires `WITH CHECK (user_id = auth.uid())`, but if `auth.uid()` returns NULL (no session), the INSERT fails.

## Solution

### 1. Session Verification

**Problem:** `signUp()` may not return a session if email confirmation is enabled in Supabase.

**Fix:** Explicitly check for and establish the session before attempting to INSERT into `profiles`:

```typescript
// 1. Sign up the user
const { data: authData } = await supabase.auth.signUp({ ... });

// 2. Ensure session is established
let session = authData.session;
if (!session) {
  // Try to get the session explicitly
  const { data: sessionData } = await supabase.auth.getSession();
  session = sessionData?.session;
}

if (!session) {
  // Email confirmation required - can't create profile yet
  throw new Error('Veuillez vérifier votre email pour confirmer votre compte...');
}

// 3. Verify session user matches
if (session.user.id !== userId) {
  throw new Error('Erreur de session...');
}

// 4. Now INSERT into profiles (auth.uid() will be available)
await supabase.from('profiles').insert({ user_id: userId, ... });
```

### 2. Debug Logging

Added console.log statements to help debug:
- User ID from signUp
- Session confirmation
- Profile insert payload

### 3. Error Handling

Clear error messages if:
- Session is not available (email confirmation required)
- Session user doesn't match signUp user
- Profile insert fails

## RLS Policy Requirements

**INSERT Policy:**
```sql
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());
```

**What this means:**
- `auth.uid()` must return the authenticated user's ID
- This requires an active session with a valid JWT token
- If no session exists, `auth.uid()` returns NULL, and the check fails

## Email Confirmation Consideration

**If email confirmation is enabled in Supabase:**
- `signUp()` will NOT return a session immediately
- User must confirm email before session is available
- Profile creation will fail with the current implementation

**Solutions:**
1. **Disable email confirmation** (easiest for development):
   - Go to Supabase Dashboard → Authentication → Settings
   - Disable "Enable email confirmations"

2. **Use database trigger** (production-ready):
   - Create a trigger on `auth.users` that auto-creates a profile
   - Profile is created automatically when user confirms email

3. **Create profile after email confirmation**:
   - Move profile creation to the email verification component
   - Only create profile after user confirms email

## Files Modified

- ✅ `src/components/auth/SignupPatientStep1.tsx` - Added session verification
- ✅ `src/components/auth/SignupDoctorStep1.tsx` - Added session verification
- ✅ `INTEGRATION_SUMMARY.md` - Updated documentation

## Testing

After applying the fix:

1. **Test with email confirmation disabled:**
   - Signup should work immediately
   - Profile should be created in Step 1
   - No RLS errors

2. **Test with email confirmation enabled:**
   - Signup should show clear error message
   - User must confirm email first
   - Profile creation happens after confirmation (if trigger is set up)

## Next Steps

If email confirmation is required:
1. Implement database trigger to auto-create profiles (recommended)
2. Or move profile creation to email verification flow
3. Or disable email confirmation for development

