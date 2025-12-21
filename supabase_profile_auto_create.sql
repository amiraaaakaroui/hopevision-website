-- ============================================================================
-- HopeVisionAI - Auto-Create Profile on Email Confirmation
-- ============================================================================
-- This trigger automatically creates a profile when a user confirms their email
-- This solves the issue where email confirmation is enabled and profile creation
-- happens before the session is available.
-- ============================================================================

-- Function to auto-create profile when user confirms email
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
  user_role TEXT;
  user_full_name TEXT;
  user_email TEXT;
  user_country TEXT;
  user_specialty TEXT;
  user_referral_source TEXT; -- ✅ Add referral source
  new_profile_id UUID;
BEGIN
  -- Get user metadata from auth.users
  user_metadata := NEW.raw_user_meta_data;
  user_email := NEW.email;
  
  -- Extract role from metadata (set during signup)
  user_role := COALESCE(user_metadata->>'role', 'patient'); -- Default to patient if not set
  
  -- Extract other metadata
  user_full_name := COALESCE(user_metadata->>'full_name', user_email);
  user_country := user_metadata->>'country';
  user_referral_source := user_metadata->>'referral_source'; -- ✅ Extract referral source
  
  -- Extract specialty for doctors
  user_specialty := user_metadata->>'specialty';

  -- Only create profile if email is confirmed (email_confirmed_at is not null)
  -- AND profile doesn't already exist
  IF NEW.email_confirmed_at IS NOT NULL THEN
    -- Check if profile already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = NEW.id
    ) THEN
      -- Create profile
      INSERT INTO public.profiles (
        user_id,
        role,
        full_name,
        email,
        country,
        referral_source -- ✅ Add referral_source field
      ) VALUES (
        NEW.id,
        user_role,
        user_full_name,
        user_email,
        user_country,
        user_referral_source -- ✅ Insert referral source value
      )
      RETURNING id INTO new_profile_id;
      
      -- Create role-specific profile
      IF user_role = 'patient' THEN
        INSERT INTO public.patient_profiles (profile_id)
        VALUES (new_profile_id)
        ON CONFLICT (profile_id) DO NOTHING;
      ELSIF user_role = 'doctor' THEN
        -- Ensure specialty is present (default to 'Médecine générale' if missing to prevent error)
        IF user_specialty IS NULL OR user_specialty = '' THEN
          user_specialty := 'Médecine générale';
        END IF;
        
        INSERT INTO public.doctor_profiles (profile_id, specialty, is_verified)
        VALUES (new_profile_id, user_specialty, false)
        ON CONFLICT (profile_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users update (fires when email_confirmed_at is set)
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Also trigger on INSERT in case email is already confirmed (edge case)
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- End of Auto-Create Profile Trigger
-- ============================================================================
