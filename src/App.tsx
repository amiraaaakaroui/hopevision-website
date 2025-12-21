import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landing } from './components/Landing';
import { useAuth } from './hooks/useAuth';
import { isPatientProfileIncomplete } from './utils/profileHelpers';
import { supabase } from './lib/supabaseClient';
// Auth components
import { RoleSelection } from './components/auth/RoleSelection';
import { LoginPatient } from './components/auth/LoginPatient';
import { LoginDoctor } from './components/auth/LoginDoctor';
import { LoginHospital } from './components/auth/LoginHospital';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
import { EmailVerification } from './components/auth/EmailVerification';
import { SignupPatientStep1 } from './components/auth/SignupPatientStep1';
import { SignupPatientStep2 } from './components/auth/SignupPatientStep2';
import { SignupDoctorStep1 } from './components/auth/SignupDoctorStep1';
import { SignupDoctorStep2 } from './components/auth/SignupDoctorStep2';
import { SignupDoctorStep3 } from './components/auth/SignupDoctorStep3';
import { SignupHospitalStep1 } from './components/auth/SignupHospitalStep1';
import { SignupHospitalStep2 } from './components/auth/SignupHospitalStep2';
import { Consent } from './components/auth/Consent';
// Patient components
import { PatientLanding } from './components/PatientLanding';
import { PatientConsent } from './components/PatientConsent';
import { PatientSymptoms } from './components/PatientSymptoms';
import { PatientResults } from './components/PatientResults';
import { PatientDetailedReport } from './components/PatientDetailedReport';
import { PatientOrientation } from './components/PatientOrientation';
import { PatientHistory } from './components/PatientHistory';
import PatientDashboard from './components/dashboard/PatientDashboard';
import { PatientChatPrecision } from './components/PatientChatPrecision';
import { PatientTimeline } from './components/PatientTimeline';
import { DoctorLogin } from './components/DoctorLogin';
import { DoctorDashboard } from './components/DoctorDashboard';
import { DoctorPatientFile } from './components/DoctorPatientFile';
import { DoctorCollaboration } from './components/DoctorCollaboration';
import { DoctorAudit } from './components/DoctorAudit';
import { DoctorAnamnesisAI } from './components/DoctorAnamnesisAI';
import { DoctorAnamnesisConsolidation } from './components/DoctorAnamnesisConsolidation';
import { DoctorChatRelay } from './components/DoctorChatRelay';
import { DoctorDetailedReport } from './components/DoctorDetailedReport';
import { DoctorPatientManagement } from './components/DoctorPatientManagement';
import { DoctorNewPatient } from './components/DoctorNewPatient';
import { DoctorKanban } from './components/DoctorKanban';
import { BookingServiceSelection } from './components/BookingServiceSelection';
import { BookingProviderSelection } from './components/BookingProviderSelection';
import { BookingSchedule } from './components/BookingSchedule';
import { BookingPayment } from './components/BookingPayment';
import { BookingConfirmation } from './components/BookingConfirmation';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminUsers } from './components/AdminUsers';
import { AdminIntegrations } from './components/AdminIntegrations';
import { AdminValidation } from './components/AdminValidation';
import { AdminSecurity } from './components/AdminSecurity';
import { AdminInsights } from './components/AdminInsights';
import { clearAnalysisSession } from './services/analysisWorkflowService';

export type Screen =
  | 'landing'
  // Auth screens
  | 'role-selection'
  | 'auth-login-patient'
  | 'auth-login-doctor'
  | 'auth-login-hospital'
  | 'auth-forgot-password'
  | 'auth-reset-password'
  | 'auth-email-verification'
  | 'signup-patient-step1'
  | 'signup-patient-step2'
  | 'signup-doctor-step1'
  | 'signup-doctor-step2'
  | 'signup-doctor-step3'
  | 'signup-hospital-step1'
  | 'signup-hospital-step2'
  | 'auth-consent'
  // Patient screens
  | 'patient-landing'
  | 'patient-consent'
  | 'patient-symptoms'
  | 'patient-results'
  | 'patient-detailed-report'
  | 'patient-orientation'
  | 'patient-history'
  | 'patient-dashboard'
  | 'patient-chat-precision'
  | 'patient-timeline'
  | 'doctor-login'
  | 'doctor-dashboard'
  | 'doctor-patient-file'
  | 'doctor-collaboration'
  | 'doctor-audit'
  | 'doctor-anamnesis-ai'
  | 'doctor-anamnesis-consolidation'
  | 'doctor-chat-relay'
  | 'doctor-detailed-report'
  | 'doctor-patient-management'
  | 'doctor-new-patient'
  | 'doctor-kanban'
  | 'booking-service-selection'
  | 'booking-provider-selection'
  | 'booking-schedule'
  | 'booking-payment'
  | 'booking-confirmation'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-integrations'
  | 'admin-validation'
  | 'admin-security'
  | 'admin-insights';

export default function App() {
  const { authUser, currentProfile, loading, isPatient, isDoctor, isAdmin } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  // Handle email confirmation and OAuth callbacks
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check for email confirmation or OAuth callback in URL hash or query params
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type') || queryParams.get('type');
      const code = queryParams.get('code'); // Some Supabase configs use code instead of access_token
      
      // Check URL params for role (passed from redirectTo)
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      
      // Handle OAuth callback (with tokens/code) - includes Google OAuth
      // For Google OAuth, type may not be 'signup', so we check for tokens/code + role in URL
      const isOAuthCallback = (accessToken || code) && urlRole;
      const isEmailConfirmation = (accessToken || code) && (type === 'signup' || type === 'email_change' || type === 'recovery');

      if (isOAuthCallback || isEmailConfirmation) {
        try {
          // If we have a code, exchange it for a session
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('[App] Error exchanging code for session:', error);
            } else if (data.session) {
              console.log('[App] Session created from code exchange');
            }
          } else if (accessToken && refreshToken) {
            // If we have tokens directly, set the session
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error('[App] Error setting session:', error);
            } else if (data.session) {
              console.log('[App] Session set from tokens');
            }
          }

          // Wait a moment for auth state to update
          await new Promise(resolve => setTimeout(resolve, 500));

          // Get authUser after session is set
          const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
          if (!currentAuthUser) {
            console.error('[App] No auth user after OAuth callback');
            return;
          }

          // Check user role from metadata or pending signup
          // ROBUST FIX: Check URL params for role first (passed from emailRedirectTo or OAuth redirectTo)
          let pendingRole = sessionStorage.getItem('pending-signup-role');

          // If role is in URL, trust it and update session storage
          if (urlRole === 'doctor' || urlRole === 'patient') {
            console.log('[App] Role detected from URL:', urlRole);
            pendingRole = urlRole;
            sessionStorage.setItem('pending-signup-role', urlRole);
            
            // CRITICAL FIX: Update user metadata with role IMMEDIATELY
            // This must happen BEFORE profile creation to ensure correct role
            const currentMetadata = currentAuthUser.user_metadata || {};
            if (!currentMetadata.role || currentMetadata.role !== urlRole) {
              console.log('[App] Updating user metadata with role:', urlRole);
              const { error: updateError } = await supabase.auth.updateUser({
                data: { ...currentMetadata, role: urlRole }
              });
              if (updateError) {
                console.error('[App] Error updating user metadata:', updateError);
              } else {
                // Wait a moment for metadata to be saved
                await new Promise(resolve => setTimeout(resolve, 300));
                // Refresh auth user to get updated metadata
                const { data: { user: refreshedUser } } = await supabase.auth.getUser();
                if (refreshedUser) {
                  Object.assign(currentAuthUser, refreshedUser);
                  console.log('[App] User metadata updated with role:', refreshedUser.user_metadata?.role);
                }
              }
            }
            
            // CRITICAL FIX: Check if profile was already created with wrong role by trigger
            // If so, delete it immediately so we can recreate it with correct role
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id, role')
              .eq('user_id', currentAuthUser.id)
              .maybeSingle();
            
            if (existingProfile && existingProfile.role !== urlRole) {
              console.warn('[App] Profile exists with wrong role:', existingProfile.role, 'Expected:', urlRole, 'Deleting to recreate with correct role...');
              
              // Delete the incorrectly created profile and its related data
              if (existingProfile.role === 'patient') {
                await supabase.from('patient_profiles').delete().eq('profile_id', existingProfile.id);
              } else if (existingProfile.role === 'doctor') {
                await supabase.from('doctor_profiles').delete().eq('profile_id', existingProfile.id);
              }
              
              const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', existingProfile.id);
              
              if (deleteError) {
                console.error('[App] Error deleting incorrect profile:', deleteError);
              } else {
                console.log('[App] Incorrect profile deleted, will recreate with correct role:', urlRole);
              }
            } else if (existingProfile && existingProfile.role === urlRole) {
              console.log('[App] Profile exists with correct role:', urlRole);
            }
          }

          const pendingPatientSignup = sessionStorage.getItem('signup-patient-step1');
          const pendingDoctorSignup = sessionStorage.getItem('signup-doctor-step1');

          // Set flag for landing page with role info
          sessionStorage.setItem('email-confirmed', 'true');
          if (pendingRole) {
            sessionStorage.setItem('email-confirmed-role', pendingRole);
          }

          // Clear the hash/query from URL
          window.history.replaceState(null, '', window.location.pathname);
          
          // Use currentAuthUser for profile checks
          const authUser = currentAuthUser;

          // For Google OAuth or email confirmation with doctor role
          // Check if specialty is missing (Google users skip Step 1 initially)
          if (pendingRole === 'doctor') {
            // CRITICAL FIX: Check if profile exists and has correct role
            let { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, role, country, doctor_profiles(specialty, rpps_number, city)')
              .eq('user_id', authUser.id)
              .maybeSingle();

            // CRITICAL FIX: If profile doesn't exist, create it with doctor role
            if (!profile && !profileError) {
              console.log('[App] Profile does not exist for doctor, creating it...');
              const userMetadata = authUser.user_metadata || {};
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  user_id: authUser.id,
                  role: 'doctor',
                  full_name: userMetadata.full_name || authUser.email || 'Utilisateur',
                  email: authUser.email || '',
                  country: userMetadata.country || null,
                  is_deleted: false
                })
                .select('id, role, country')
                .single();

              if (createError) {
                console.error('[App] Error creating doctor profile:', createError);
                // If profile creation failed, redirect to step2 anyway - user can retry
                setCurrentScreen('signup-doctor-step2');
                sessionStorage.removeItem('pending-signup-role');
                sessionStorage.removeItem('email-confirmed-role');
                return;
              }

              if (newProfile) {
                profile = { ...newProfile, doctor_profiles: null };
                console.log('[App] Doctor profile created successfully:', newProfile.id);
                
                // Store profileId in sessionStorage for Step2 access
                sessionStorage.setItem('signup-doctor-profile-id', newProfile.id);
                
                // Create doctor_profile if it doesn't exist
                const specialty = userMetadata.specialty || 'Médecine générale';
                const { data: doctorProfile, error: doctorProfileError } = await supabase
                  .from('doctor_profiles')
                  .insert({
                    profile_id: newProfile.id,
                    specialty: specialty,
                    is_verified: false
                  })
                  .select('id, specialty, rpps_number, city')
                  .single();

                if (doctorProfileError) {
                  console.error('[App] Error creating doctor_profile:', doctorProfileError);
                  // Check if it's a duplicate key error (profile already exists)
                  if (doctorProfileError.code !== '23505') {
                    console.warn('[App] Doctor profile creation failed, but continuing...');
                  }
                } else if (doctorProfile) {
                  console.log('[App] Doctor profile created successfully:', doctorProfile.id);
                  profile.doctor_profiles = doctorProfile;
                }
              }
            } else if (profile && profile.role !== 'doctor') {
              // CRITICAL FIX: Profile exists but with wrong role - correct it!
              console.error('[App] Profile exists but with wrong role:', profile.role, 'Expected: doctor. Attempting to fix...');
              
              // Try to update the role to doctor
              const { error: roleUpdateError } = await supabase
                .from('profiles')
                .update({ role: 'doctor' })
                .eq('user_id', authUser.id);
              
              if (roleUpdateError) {
                console.error('[App] Error updating role to doctor:', roleUpdateError);
                setError(`Erreur: Ce compte existe déjà avec le rôle ${profile.role}. Veuillez utiliser un autre email.`);
                setCurrentScreen('landing');
                sessionStorage.removeItem('pending-signup-role');
                sessionStorage.removeItem('email-confirmed-role');
                return;
              }
              
              // If it was a patient profile, we need to delete it and create a doctor profile
              if (profile.role === 'patient') {
                // Delete patient_profile if it exists
                await supabase
                  .from('patient_profiles')
                  .delete()
                  .eq('profile_id', profile.id);
                
                // Create doctor_profile if it doesn't exist
                const { data: existingDoctorProfile } = await supabase
                  .from('doctor_profiles')
                  .select('id')
                  .eq('profile_id', profile.id)
                  .maybeSingle();
                
                if (!existingDoctorProfile) {
                  const userMetadata = authUser.user_metadata || {};
                  const specialty = userMetadata.specialty || 'Médecine générale';
                  await supabase
                    .from('doctor_profiles')
                    .insert({
                      profile_id: profile.id,
                      specialty: specialty,
                      is_verified: false
                    })
                    .select('id')
                    .maybeSingle();
                }
              }
              
              console.log('[App] Profile role corrected to doctor');
              // Update profile variable to reflect new role
              profile.role = 'doctor';
              // Continue with doctor flow
            }

            // If profile doesn't exist or error occurred, redirect to onboarding
            if (profileError || !profile) {
              console.error('[App] Profile error or not found for doctor:', profileError);
              setCurrentScreen('signup-doctor-step2');
              // Clear OAuth flags after redirect
              sessionStorage.removeItem('pending-signup-role');
              sessionStorage.removeItem('email-confirmed-role');
            } else {
              // Store profileId in sessionStorage for Step2 access (in case it wasn't stored earlier)
              if (profile.id) {
                sessionStorage.setItem('signup-doctor-profile-id', profile.id);
              }

              // Get doctor profile separately if not already loaded
              let doctorProfile = null;
              if (profile.doctor_profiles) {
                doctorProfile = Array.isArray(profile.doctor_profiles)
                  ? profile.doctor_profiles[0]
                  : profile.doctor_profiles;
              } else if (profile.id) {
                // Fetch doctor profile if not included in query
                const { data: doctorProfileData, error: doctorProfileError } = await supabase
                  .from('doctor_profiles')
                  .select('id, specialty, rpps_number, city')
                  .eq('profile_id', profile.id)
                  .maybeSingle();
                
                if (doctorProfileError && doctorProfileError.code !== 'PGRST116') {
                  console.error('[App] Error fetching doctor profile:', doctorProfileError);
                } else if (doctorProfileData) {
                  doctorProfile = doctorProfileData;
                  console.log('[App] Doctor profile found:', doctorProfileData.id);
                } else {
                  // Doctor profile doesn't exist, create it
                  console.log('[App] Doctor profile does not exist, creating it...');
                  const userMetadata = authUser.user_metadata || {};
                  const specialty = userMetadata.specialty || 'Médecine générale';
                  const { data: newDoctorProfile, error: createDoctorError } = await supabase
                    .from('doctor_profiles')
                    .insert({
                      profile_id: profile.id,
                      specialty: specialty,
                      is_verified: false
                    })
                    .select('id, specialty, rpps_number, city')
                    .single();
                  
                  if (createDoctorError) {
                    console.error('[App] Error creating doctor profile:', createDoctorError);
                  } else if (newDoctorProfile) {
                    console.log('[App] Doctor profile created:', newDoctorProfile.id);
                    doctorProfile = newDoctorProfile;
                  }
                }
              }

              // Route based on missing fields (now includes city)
              if (!doctorProfile?.specialty || !doctorProfile?.rpps_number || !profile?.country || !doctorProfile?.city) {
                // Missing professional data = needs Step 2
                console.log('[App] Doctor profile incomplete, redirecting to step2');
                setCurrentScreen('signup-doctor-step2');
                // Clear OAuth flags after redirect
                sessionStorage.removeItem('pending-signup-role');
                sessionStorage.removeItem('email-confirmed-role');
              } else {
                // Complete profile = go to dashboard
                console.log('[App] Doctor profile complete, redirecting to dashboard');
                setCurrentScreen('doctor-dashboard');
                // Clear OAuth flags after redirect
                sessionStorage.removeItem('pending-signup-role');
                sessionStorage.removeItem('email-confirmed-role');
              }
            }
          } else if (pendingRole === 'patient') {
            // For Google OAuth with patient role, check if profile exists and has correct role
            let { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, role, date_of_birth')
              .eq('user_id', authUser.id)
              .maybeSingle();

            // CRITICAL FIX: If profile doesn't exist, create it with patient role
            if (!profile && !profileError) {
              console.log('[App] Profile does not exist for patient, creating it...');
              const userMetadata = authUser.user_metadata || {};
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  user_id: authUser.id,
                  role: 'patient',
                  full_name: userMetadata.full_name || authUser.email || 'Utilisateur',
                  email: authUser.email || '',
                  country: userMetadata.country || null,
                  is_deleted: false
                })
                .select('id, role, date_of_birth')
                .single();

              if (createError) {
                console.error('[App] Error creating profile:', createError);
                // If profile creation failed, redirect to step2 anyway - user can retry
                setCurrentScreen('signup-patient-step2');
                sessionStorage.removeItem('pending-signup-role');
                sessionStorage.removeItem('email-confirmed-role');
                return;
              }

              if (newProfile) {
                profile = newProfile;
                console.log('[App] Profile created successfully:', newProfile.id);
                
                // Store profileId in sessionStorage for Step2 access
                sessionStorage.setItem('signup-patient-profile-id', newProfile.id);
                
                // Create patient_profile if it doesn't exist
                const { data: patientProfile, error: patientProfileError } = await supabase
                  .from('patient_profiles')
                  .insert({ profile_id: newProfile.id })
                  .select('id')
                  .single();

                if (patientProfileError) {
                  console.error('[App] Error creating patient_profile:', patientProfileError);
                  // Check if it's a duplicate key error (profile already exists)
                  if (patientProfileError.code !== '23505') {
                    // Not a duplicate - this is a real error, but continue anyway
                    console.warn('[App] Patient profile creation failed, but continuing...');
                  }
                } else if (patientProfile) {
                  console.log('[App] Patient profile created successfully:', patientProfile.id);
                }
              }
            } else if (profile && profile.role !== 'patient') {
              // CRITICAL FIX: Profile exists but with wrong role - correct it!
              console.error('[App] Profile exists but with wrong role:', profile.role, 'Expected: patient. Attempting to fix...');
              
              // Try to update the role to patient
              const { error: roleUpdateError } = await supabase
                .from('profiles')
                .update({ role: 'patient' })
                .eq('user_id', authUser.id);
              
              if (roleUpdateError) {
                console.error('[App] Error updating role to patient:', roleUpdateError);
                // If update failed, try to delete and recreate
                console.warn('[App] Role update failed, attempting to delete and recreate profile...');
                
                // Delete the incorrectly created profile and its related data
                if (profile.role === 'doctor') {
                  await supabase.from('doctor_profiles').delete().eq('profile_id', profile.id);
                }
                
                // Delete the profile
                const { error: deleteError } = await supabase
                  .from('profiles')
                  .delete()
                  .eq('id', profile.id);
                
                if (deleteError) {
                  console.error('[App] Error deleting incorrect profile:', deleteError);
                  setError(`Erreur: Ce compte existe déjà avec le rôle ${profile.role}. Veuillez utiliser un autre email ou contacter le support.`);
                  setCurrentScreen('landing');
                  sessionStorage.removeItem('pending-signup-role');
                  sessionStorage.removeItem('email-confirmed-role');
                  return;
                }
                
                // Recreate profile with correct role
                const userMetadata = authUser.user_metadata || {};
                const { data: newProfile, error: createError } = await supabase
                  .from('profiles')
                  .insert({
                    user_id: authUser.id,
                    role: 'patient',
                    full_name: userMetadata.full_name || authUser.email || 'Utilisateur',
                    email: authUser.email || '',
                    country: userMetadata.country || null,
                    is_deleted: false
                  })
                  .select('id, role, date_of_birth')
                  .single();
                
                if (createError || !newProfile) {
                  console.error('[App] Error recreating profile:', createError);
                  setError('Erreur lors de la correction du profil. Veuillez réessayer ou contacter le support.');
                  setCurrentScreen('landing');
                  sessionStorage.removeItem('pending-signup-role');
                  sessionStorage.removeItem('email-confirmed-role');
                  return;
                }
                
                profile = newProfile;
                
                // Create patient_profile
                await supabase
                  .from('patient_profiles')
                  .insert({ profile_id: newProfile.id })
                  .select('id')
                  .maybeSingle();
                
                console.log('[App] Profile recreated with correct role: patient');
              } else {
                // Role update succeeded
                console.log('[App] Profile role corrected to patient');
                
                // If it was a doctor profile, delete it and create patient profile
                if (profile.role === 'doctor') {
                  await supabase.from('doctor_profiles').delete().eq('profile_id', profile.id);
                  
                  // Check if patient_profile exists, create if not
                  const { data: existingPatientProfile } = await supabase
                    .from('patient_profiles')
                    .select('id')
                    .eq('profile_id', profile.id)
                    .maybeSingle();
                  
                  if (!existingPatientProfile) {
                    await supabase
                      .from('patient_profiles')
                      .insert({ profile_id: profile.id })
                      .select('id')
                      .maybeSingle();
                  }
                }
                
                // Update profile variable to reflect new role
                profile.role = 'patient';
              }
              
              // Continue with patient flow
            }

            // If profile doesn't exist or error occurred, redirect to onboarding
            if (profileError || !profile) {
              console.error('[App] Profile error or not found for patient:', profileError);
              setCurrentScreen('signup-patient-step2');
              // Clear OAuth flags after redirect
              sessionStorage.removeItem('pending-signup-role');
              sessionStorage.removeItem('email-confirmed-role');
            } else {
              // Store profileId in sessionStorage for Step2 access (in case it wasn't stored earlier)
              if (profile.id) {
                sessionStorage.setItem('signup-patient-profile-id', profile.id);
              }
              
              // Get patient profile separately to check for gender
              let patientProfile = null;
              if (profile.id) {
                const { data: patientProfileData, error: patientProfileError } = await supabase
                  .from('patient_profiles')
                  .select('id, gender')
                  .eq('profile_id', profile.id)
                  .maybeSingle();
                
                if (patientProfileError && patientProfileError.code !== 'PGRST116') {
                  // PGRST116 = no rows returned, which is OK if profile is new
                  console.error('[App] Error fetching patient profile:', patientProfileError);
                } else if (patientProfileData) {
                  patientProfile = patientProfileData;
                  console.log('[App] Patient profile found:', patientProfileData.id);
                } else {
                  // Patient profile doesn't exist, create it
                  console.log('[App] Patient profile does not exist, creating it...');
                  const { data: newPatientProfile, error: createPatientError } = await supabase
                    .from('patient_profiles')
                    .insert({ profile_id: profile.id })
                    .select('id')
                    .single();
                  
                  if (createPatientError) {
                    console.error('[App] Error creating patient profile:', createPatientError);
                  } else if (newPatientProfile) {
                    console.log('[App] Patient profile created:', newPatientProfile.id);
                    patientProfile = { id: newPatientProfile.id, gender: null };
                  }
                }
              }

              // Check if profile is incomplete (missing date_of_birth or gender)
              const isIncomplete = !profile.date_of_birth || !patientProfile?.gender;

              if (isIncomplete || pendingPatientSignup) {
                // Profile incomplete or pending signup - redirect to onboarding
                console.log('[App] Patient profile incomplete, redirecting to step2');
                setCurrentScreen('signup-patient-step2');
                // Clear OAuth flags after redirect
                sessionStorage.removeItem('pending-signup-role');
                sessionStorage.removeItem('email-confirmed-role');
              } else {
                // Complete profile - go to patient dashboard
                console.log('[App] Patient profile complete, redirecting to dashboard');
                setCurrentScreen('patient-dashboard');
                // Clear OAuth flags after redirect
                sessionStorage.removeItem('pending-signup-role');
                sessionStorage.removeItem('email-confirmed-role');
              }
            }
          } else if (pendingPatientSignup) {
            // Email signup with pending data
            setCurrentScreen('signup-patient-step2');
            // Clear OAuth flags after redirect
            sessionStorage.removeItem('pending-signup-role');
            sessionStorage.removeItem('email-confirmed-role');
          } else if (pendingDoctorSignup) {
            // Email signup with pending data
            setCurrentScreen('signup-doctor-step2');
            // Clear OAuth flags after redirect
            sessionStorage.removeItem('pending-signup-role');
            sessionStorage.removeItem('email-confirmed-role');
          } else {
            // No pending signup - go to landing page with guidance message
            setCurrentScreen('landing');
            // Clear OAuth flags
            sessionStorage.removeItem('pending-signup-role');
            sessionStorage.removeItem('email-confirmed-role');
          }
        } catch (error) {
          console.error('[App] Error handling email confirmation:', error);
          // Still show landing page with message
          sessionStorage.setItem('email-confirmed', 'true');
          setCurrentScreen('landing');
        }
      }
    };

    handleEmailConfirmation();
  }, []);

  // Auth-based routing - only redirect on auth state changes, not on every screen change
  useEffect(() => {
    if (loading) return; // Wait for auth to load

    // If user is not authenticated and on a protected screen, redirect to landing
    if (!authUser) {
      const authScreens: Screen[] = [
        'landing',
        'role-selection',
        'auth-login-patient',
        'auth-login-doctor',
        'auth-login-hospital',
        'auth-forgot-password',
        'auth-reset-password',
        'auth-email-verification',
        'signup-patient-step1',
        'signup-patient-step2',
        'signup-doctor-step1',
        'signup-doctor-step2',
        'signup-doctor-step3',
        'signup-hospital-step1',
        'signup-hospital-step2',
        'auth-consent',
      ];

      if (!authScreens.includes(currentScreen)) {
        setCurrentScreen('landing');
      }
      return;
    }

    // Helper to check if doctor profile is incomplete
    const isDoctorProfileIncomplete = (profile: any): boolean => {
      if (!profile?.doctor_profile) return true;
      // Doctor profile is incomplete if missing rpps_number (registration number)
      return !profile.doctor_profile.rpps_number;
    };

    // If user is authenticated, redirect to default screen based on role
    // IMPORTANT: Only redirect from landing/auth screens, NOT from active onboarding screens
    // Also skip if we're processing an OAuth callback (check for pending role in sessionStorage)
    const isOnAuthOrLanding = currentScreen.startsWith('auth-') ||
      currentScreen === 'landing' ||
      currentScreen === 'role-selection';
    
    // Don't redirect if we're processing an OAuth callback (first useEffect handles it)
    const isProcessingOAuth = sessionStorage.getItem('pending-signup-role') || 
                              sessionStorage.getItem('email-confirmed-role');

    if (currentProfile && isOnAuthOrLanding && !isProcessingOAuth) {
      if (isPatient) {
        // Check if profile is incomplete - redirect to onboarding if so
        if (isPatientProfileIncomplete(currentProfile) && currentScreen !== 'signup-patient-step2') {
          setCurrentScreen('signup-patient-step2');
        } else if (!isPatientProfileIncomplete(currentProfile)) {
          setCurrentScreen('patient-dashboard');
        }
      } else if (isDoctor) {
        // Check if doctor profile is incomplete - redirect to onboarding if so
        if (isDoctorProfileIncomplete(currentProfile)) {
          setCurrentScreen('signup-doctor-step2');
        } else {
          setCurrentScreen('doctor-dashboard');
        }
      } else if (isAdmin) {
        setCurrentScreen('admin-dashboard');
      }
    }
  }, [authUser, currentProfile, loading, isPatient, isDoctor, isAdmin, currentScreen]);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dev Role Switcher (only in development) */}
      {authUser && (
        <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white p-2 rounded-lg shadow-lg border border-gray-200">
          <span className="text-xs text-gray-500 px-2 py-1">
            {currentProfile?.profile.role || 'No role'}
          </span>
          <button
            onClick={() => {
              import('./lib/supabaseClient').then(({ supabase }) => {
                supabase.auth.signOut();
              });
            }}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Logout
          </button>
        </div>
      )}


      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {currentScreen === 'landing' && <Landing onNavigate={navigateTo} />}
          {currentScreen === 'role-selection' && <RoleSelection onNavigate={navigateTo} />}
          {currentScreen === 'auth-login-patient' && <LoginPatient onNavigate={navigateTo} />}
          {currentScreen === 'auth-login-doctor' && <LoginDoctor onNavigate={navigateTo} />}
          {currentScreen === 'auth-login-hospital' && <LoginHospital onNavigate={navigateTo} />}
          {currentScreen === 'auth-forgot-password' && <ForgotPassword onNavigate={navigateTo} />}
          {currentScreen === 'auth-reset-password' && <ResetPassword onNavigate={navigateTo} />}
          {currentScreen === 'auth-email-verification' && <EmailVerification onNavigate={navigateTo} />}
          {currentScreen === 'signup-patient-step1' && <SignupPatientStep1 onNavigate={navigateTo} />}
          {currentScreen === 'signup-patient-step2' && <SignupPatientStep2 onNavigate={navigateTo} />}
          {currentScreen === 'signup-doctor-step1' && <SignupDoctorStep1 onNavigate={navigateTo} />}
          {currentScreen === 'signup-doctor-step2' && <SignupDoctorStep2 onNavigate={navigateTo} />}
          {currentScreen === 'signup-doctor-step3' && <SignupDoctorStep3 onNavigate={navigateTo} />}
          {currentScreen === 'signup-hospital-step1' && <SignupHospitalStep1 onNavigate={navigateTo} />}
          {currentScreen === 'signup-hospital-step2' && <SignupHospitalStep2 onNavigate={navigateTo} />}
          {currentScreen === 'auth-consent' && <Consent onNavigate={navigateTo} />}
          {currentScreen === 'patient-landing' && <PatientLanding onNavigate={navigateTo} />}
          {currentScreen === 'patient-consent' && <PatientConsent onNavigate={navigateTo} />}
          {currentScreen === 'patient-symptoms' && <PatientSymptoms onNavigate={navigateTo} />}
          {currentScreen === 'patient-results' && <PatientResults onNavigate={navigateTo} />}
          {currentScreen === 'patient-detailed-report' && <PatientDetailedReport onNavigate={navigateTo} />}
          {currentScreen === 'patient-orientation' && <PatientOrientation onNavigate={navigateTo} />}
          {currentScreen === 'patient-history' && <PatientHistory onNavigate={navigateTo} />}
          {currentScreen === 'patient-dashboard' && <PatientDashboard onNavigate={navigateTo} />}
          {currentScreen === 'patient-chat-precision' && <PatientChatPrecision onNavigate={navigateTo} />}
          {currentScreen === 'patient-timeline' && <PatientTimeline onNavigate={navigateTo} />}
          {currentScreen === 'doctor-login' && <DoctorLogin onNavigate={navigateTo} />}
          {currentScreen === 'doctor-dashboard' && <DoctorDashboard onNavigate={navigateTo} />}
          {currentScreen === 'doctor-patient-file' && <DoctorPatientFile onNavigate={navigateTo} />}
          {currentScreen === 'doctor-collaboration' && <DoctorCollaboration onNavigate={navigateTo} />}
          {currentScreen === 'doctor-audit' && <DoctorAudit onNavigate={navigateTo} />}
          {currentScreen === 'doctor-anamnesis-ai' && <DoctorAnamnesisAI onNavigate={navigateTo} />}
          {currentScreen === 'doctor-anamnesis-consolidation' && <DoctorAnamnesisConsolidation onNavigate={navigateTo} />}
          {currentScreen === 'doctor-chat-relay' && <DoctorChatRelay onNavigate={navigateTo} />}
          {currentScreen === 'doctor-detailed-report' && <DoctorDetailedReport onNavigate={navigateTo} />}
          {currentScreen === 'doctor-patient-management' && <DoctorPatientManagement onNavigate={navigateTo} />}
          {currentScreen === 'doctor-new-patient' && <DoctorNewPatient onNavigate={navigateTo} />}
          {currentScreen === 'doctor-kanban' && <DoctorKanban onNavigate={navigateTo} />}
          {currentScreen === 'booking-service-selection' && <BookingServiceSelection onNavigate={navigateTo} />}
          {currentScreen === 'booking-provider-selection' && <BookingProviderSelection onNavigate={navigateTo} />}
          {currentScreen === 'booking-schedule' && <BookingSchedule onNavigate={navigateTo} />}
          {currentScreen === 'booking-payment' && <BookingPayment onNavigate={navigateTo} />}
          {currentScreen === 'booking-confirmation' && <BookingConfirmation onNavigate={navigateTo} />}
          {currentScreen === 'admin-dashboard' && <AdminDashboard onNavigate={navigateTo} />}
          {currentScreen === 'admin-users' && <AdminUsers onNavigate={navigateTo} />}
          {currentScreen === 'admin-integrations' && <AdminIntegrations onNavigate={navigateTo} />}
          {currentScreen === 'admin-validation' && <AdminValidation onNavigate={navigateTo} />}
          {currentScreen === 'admin-security' && <AdminSecurity onNavigate={navigateTo} />}
          {currentScreen === 'admin-insights' && <AdminInsights onNavigate={navigateTo} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}