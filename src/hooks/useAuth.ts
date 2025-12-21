import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { CurrentProfile, Profile, PatientProfile, DoctorProfile } from '../types/database';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<CurrentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setCurrentProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      // Get profile
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .maybeSingle();

      // If profile doesn't exist, try to create it (fallback if trigger didn't run)
      if (!profile && !profileError) {
        // Get user metadata to determine role
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userMetadata = user.user_metadata || {};
          const role = userMetadata.role || 'patient'; // Default to patient

          // Create profile (RLS allows this because user_id = auth.uid())
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              role: role,
              full_name: userMetadata.full_name || user.email || 'Utilisateur',
              email: user.email || '',
              country: userMetadata.country || null,
            })
            .select('*')
            .single();

          if (!createError && newProfile) {
            profile = newProfile;

            // Create role-specific profile
            if (role === 'patient') {
              await supabase
                .from('patient_profiles')
                .insert({ profile_id: newProfile.id })
                .select('id')
                .maybeSingle();
            } else if (role === 'doctor') {
              // Extract specialty from metadata, use default if missing
              const specialty = userMetadata.specialty || 'Médecine générale';
              await supabase
                .from('doctor_profiles')
                .insert({
                  profile_id: newProfile.id,
                  specialty: specialty,
                  is_verified: false
                })
                .select('id')
                .maybeSingle();
            }
          }
        }
      }

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw profileError;
      }

      if (!profile) {
        setLoading(false);
        return;
      }

      let patientProfile: PatientProfile | undefined;
      let doctorProfile: DoctorProfile | undefined;

      // Get role-specific profile
      if (profile.role === 'patient') {
        const { data: patient, error: patientError } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('profile_id', profile.id)
          .single();

        if (!patientError && patient) {
          patientProfile = patient;
        }
      } else if (profile.role === 'doctor') {
        const { data: doctor, error: doctorError } = await supabase
          .from('doctor_profiles')
          .select('*')
          .eq('profile_id', profile.id)
          .single();

        if (!doctorError && doctor) {
          doctorProfile = doctor;
        }
      }

      setCurrentProfile({
        profile: profile as Profile,
        patientProfile,
        doctorProfile,
        patientProfileId: patientProfile?.id,
        doctorProfileId: doctorProfile?.id,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    authUser: user, // Alias for consistency
    currentProfile,
    loading,
    isAuthenticated: !!user,
    isPatient: currentProfile?.profile.role === 'patient',
    isDoctor: currentProfile?.profile.role === 'doctor',
    isAdmin: currentProfile?.profile.role === 'admin',
  };
}

