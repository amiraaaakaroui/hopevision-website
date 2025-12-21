// TypeScript types matching the Supabase schema

export type ProfileRole = 'patient' | 'doctor' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  role: ProfileRole;
  full_name: string;
  email: string;
  date_of_birth?: string;
  phone_number?: string;
  country?: string;
  referral_source?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface PatientProfile {
  id: string;
  profile_id: string;
  patient_id?: string;
  gender?: 'male' | 'female' | 'other';
  blood_group?: string;
  allergies?: string[];
  weight_kg?: number;
  height_cm?: number;
  medical_history?: string;
  surgical_history?: string;
  family_history?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  profile_id: string;
  specialty: string;
  rpps_number?: string;
  license_number?: string;
  establishment?: string;
  city?: string;
  bio?: string;
  rating?: number;
  total_reviews: number;
  consultation_price?: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreAnalysis {
  id: string;
  patient_profile_id: string;
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'cancelled' | 'booked';
  text_input?: string;
  voice_transcript?: string;
  voice_audio_url?: string;
  image_urls?: string[];
  document_urls?: string[];
  selected_chips?: string[];
  ai_processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  ai_processing_started_at?: string;
  ai_processing_completed_at?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}

export interface AIReport {
  id: string;
  pre_analysis_id: string;
  patient_profile_id: string;
  overall_severity?: 'low' | 'medium' | 'high';
  overall_confidence?: number;
  summary?: string;
  primary_diagnosis?: string;
  primary_diagnosis_confidence?: number;
  recommendation_action?: string;
  recommendation_text?: string;
  explainability_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticHypothesis {
  id: string;
  ai_report_id: string;
  disease_name: string;
  confidence: number;
  severity?: 'low' | 'medium' | 'high';
  keywords?: string[];
  explanation?: string;
  is_primary: boolean;
  is_excluded: boolean;
  exclusion_reason?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_profile_id: string;
  doctor_profile_id: string;
  pre_analysis_id?: string;
  ai_report_id?: string;
  appointment_type: 'teleconsultation' | 'in_person' | 'follow_up' | 'lab_exam';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  location_type?: 'clinic' | 'hospital' | 'home' | 'online';
  location_address?: string;
  price?: number;
  payment_status?: 'pending' | 'paid' | 'refunded' | 'cancelled';
  payment_method?: string;
  report_shared: boolean;
  report_shared_at?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  completed_at?: string;
}

export interface DoctorNote {
  id: string;
  doctor_profile_id: string;
  patient_profile_id: string;
  appointment_id?: string;
  ai_report_id?: string;
  doctor_diagnosis?: string;
  doctor_notes?: string;
  ai_diagnosis_validated?: boolean;
  ai_diagnosis_modified: boolean;
  validation_comment?: string;
  prescription_text?: string;
  prescription_data?: Record<string, any>;
  recommended_exams?: Record<string, any>;
  treatment_plan?: string;
  created_at: string;
  updated_at: string;
}

export interface Discussion {
  id: string;
  patient_profile_id: string;
  ai_report_id?: string;
  created_by_doctor_id: string;
  title?: string;
  status: 'active' | 'resolved' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface DiscussionMessage {
  id: string;
  discussion_id: string;
  doctor_profile_id: string;
  message_text: string;
  mentions?: string[];
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  patient_profile_id: string;
  event_type: 'pre_analysis' | 'ai_report' | 'anamnesis' | 'appointment' | 'exam' | 'doctor_note' | 'prescription' | 'reminder';
  event_title: string;
  event_description?: string;
  status?: 'completed' | 'active' | 'pending';
  related_pre_analysis_id?: string;
  related_appointment_id?: string;
  related_ai_report_id?: string;
  event_date: string;
  created_at: string;
}

export interface Document {
  id: string;
  patient_profile_id: string;
  pre_analysis_id?: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size_bytes?: number;
  ai_extraction_status?: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_data?: Record<string, any>;
  extracted_at?: string;
  uploaded_at: string;
}

export interface ChatPrecisionMessage {
  id: string;
  pre_analysis_id: string;
  sender_type: 'ai' | 'patient';
  message_text: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CurrentProfile {
  profile: Profile;
  patientProfile?: PatientProfile;
  doctorProfile?: DoctorProfile;
  patientProfileId?: string;
  doctorProfileId?: string;
}

