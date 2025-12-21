import { supabase } from '../lib/supabaseClient';

export interface WaitlistSubmission {
  role: 'patient' | 'doctor' | 'hospital';
  full_name: string;
  email: string;
  phone?: string;
  specialty?: string; // For doctors
  institution_name?: string; // For hospitals
}

export interface WaitlistResult {
  success: boolean;
  error?: string;
  errorCode?: 'DUPLICATE_EMAIL' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
}

export async function submitWaitlist(data: WaitlistSubmission): Promise<WaitlistResult> {
  try {
    // Prepare the data for insertion
    const waitlistData: Record<string, any> = {
      role: data.role,
      full_name: data.full_name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone || null,
    };

    // Add role-specific fields
    if (data.role === 'doctor' && data.specialty) {
      waitlistData.specialty = data.specialty;
    }

    if (data.role === 'hospital' && data.institution_name) {
      waitlistData.institution_name = data.institution_name;
    }

    // Insert into beta_waitlist table
    const { error } = await supabase
      .from('beta_waitlist')
      .insert([waitlistData]);

    if (error) {
      console.error('[WaitlistService] Error submitting waitlist:', error);
      
      // Handle duplicate email error gracefully
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return {
          success: false,
          errorCode: 'DUPLICATE_EMAIL',
          error: 'DUPLICATE_EMAIL' // Will be translated in component
        };
      }

      // Handle network errors
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        return {
          success: false,
          errorCode: 'NETWORK_ERROR',
          error: 'NETWORK_ERROR' // Will be translated in component
        };
      }

      return {
        success: false,
        errorCode: 'UNKNOWN_ERROR',
        error: 'UNKNOWN_ERROR' // Will be translated in component
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[WaitlistService] Unexpected error:', error);
    return {
      success: false,
      errorCode: 'UNKNOWN_ERROR',
      error: 'UNKNOWN_ERROR' // Will be translated in component
    };
  }
}
