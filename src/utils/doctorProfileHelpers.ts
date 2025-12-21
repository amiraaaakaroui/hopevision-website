/**
 * Doctor Profile Helpers
 * 
 * Centralized utilities for doctor profile validation and completeness checks.
 * This is the single source of truth for determining if a doctor has completed onboarding.
 */

export interface DoctorProfile {
    specialty?: string | null;
    rpps_number?: string | null;
    city?: string | null;
}

export interface ProfileWithCountry {
    country?: string | null;
}

/**
 * Single source of truth for doctor profile completeness.
 * 
 * A doctor profile is considered complete if ALL of these fields are present:
 * 1. specialty - Medical specialty (e.g., "Cardiologie")
 * 2. rpps_number - French medical registration number (unique identifier)
 * 3. country - Practice location country (e.g., "France", "Tunisie")
 * 4. city - Practice location city (e.g., "Paris", "Tunis")
 * 
 * @param doctorProfile - Doctor-specific profile data from doctor_profiles table
 * @param profile - General profile data from profiles table (for country)
 * @returns true if profile is complete, false otherwise
 * 
 * @example
 * const isComplete = isDoctorProfileComplete(
 *   { specialty: 'Cardiologie', rpps_number: '12345678901', city: 'Paris' },
 *   { country: 'France' }
 * ); // returns true
 */
export function isDoctorProfileComplete(
    doctorProfile: DoctorProfile | null | undefined,
    profile: ProfileWithCountry | null | undefined
): boolean {
    if (!doctorProfile || !profile) {
        return false;
    }

    const hasSpecialty = !!doctorProfile.specialty && doctorProfile.specialty.trim() !== '';
    const hasRPPS = !!doctorProfile.rpps_number && doctorProfile.rpps_number.trim() !== '';
    const hasCountry = !!profile.country && profile.country.trim() !== '';
    const hasCity = !!doctorProfile.city && doctorProfile.city.trim() !== '';

    return hasSpecialty && hasRPPS && hasCountry && hasCity;
}

/**
 * Determines which onboarding step a doctor should be on based on profile data.
 * 
 * @param doctorProfile - Doctor-specific profile data
 * @param profile - General profile data
 * @returns 'complete' | 'step2' | 'step3'
 */
export function getDoctorOnboardingStep(
    doctorProfile: DoctorProfile | null | undefined,
    profile: ProfileWithCountry | null | undefined
): 'complete' | 'step2' | 'step3' {
    if (isDoctorProfileComplete(doctorProfile, profile)) {
        return 'complete';
    }

    // If missing professional data (specialty, RPPS, country, city), go to Step 2
    if (!doctorProfile?.specialty || !doctorProfile?.rpps_number || !profile?.country || !doctorProfile?.city) {
        return 'step2';
    }

    // Otherwise, go to Step 3 (preferences)
    return 'step3';
}
