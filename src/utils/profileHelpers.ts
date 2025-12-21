import type { CurrentProfile } from '../types/database';

/**
 * Checks if a patient profile is incomplete (missing essential onboarding data)
 * A profile is considered incomplete if it's missing:
 * - date_of_birth (required for age calculation and medical records)
 * - gender (required basic health info)
 * 
 * Note: blood_group is optional but recommended for better medical care
 */
export function isPatientProfileIncomplete(currentProfile: CurrentProfile | null): boolean {
  if (!currentProfile || !currentProfile.profile || currentProfile.profile.role !== 'patient') {
    return false; // Not a patient, or no profile
  }

  const profile = currentProfile.profile;
  const patientProfile = currentProfile.patientProfile;

  // Check if required fields are missing (these match the required fields in SignupPatientStep2)
  const missingDateOfBirth = !profile.date_of_birth;
  const missingGender = !patientProfile?.gender;

  // Profile is incomplete if required fields are missing
  return missingDateOfBirth || missingGender;
}

