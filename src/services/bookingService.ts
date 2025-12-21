import { supabase } from '../lib/supabaseClient';
import type { Appointment } from '../types/database';

/**
 * Interface pour les données de création d'un rendez-vous
 */
export interface CreateAppointmentData {
  patient_profile_id: string;
  doctor_profile_id: string;
  pre_analysis_id?: string;
  ai_report_id?: string;
  appointment_type: 'teleconsultation' | 'in_person' | 'follow_up' | 'lab_exam';
  scheduled_date: string; // Format: YYYY-MM-DD
  scheduled_time: string; // Format: HH:mm
  duration_minutes?: number;
  location_type?: 'clinic' | 'hospital' | 'home' | 'online';
  location_address?: string;
  price?: number;
  payment_status?: 'pending' | 'paid' | 'refunded' | 'cancelled';
  payment_method?: string;
}

/**
 * Interface pour les disponibilités d'un médecin
 */
export interface DoctorAvailability {
  date: string; // YYYY-MM-DD
  availableSlots: {
    time: string; // HH:mm
    available: boolean;
  }[];
}

/**
 * Service pour gérer les réservations de rendez-vous
 */
export const bookingService = {
  /**
   * Créer un rendez-vous
   */
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          patient_profile_id: data.patient_profile_id,
          doctor_profile_id: data.doctor_profile_id,
          pre_analysis_id: data.pre_analysis_id || null,
          ai_report_id: data.ai_report_id || null,
          appointment_type: data.appointment_type,
          status: 'scheduled',
          scheduled_date: data.scheduled_date,
          scheduled_time: data.scheduled_time,
          duration_minutes: data.duration_minutes || 30,
          location_type: data.location_type || (data.appointment_type === 'teleconsultation' ? 'online' : 'clinic'),
          location_address: data.location_address || null,
          price: data.price || null,
          payment_status: data.payment_status || 'pending',
          payment_method: data.payment_method || null,
          report_shared: data.ai_report_id ? true : false,
          report_shared_at: data.ai_report_id ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        console.error('[bookingService] Error creating appointment:', error);
        throw error;
      }

      // Créer l'assignment patient-médecin automatiquement (via trigger ou manuellement)
      await this.createPatientDoctorAssignment(
        data.patient_profile_id,
        data.doctor_profile_id,
        data.ai_report_id
      );

      // Créer l'événement timeline
      await this.createTimelineEvent(
        data.patient_profile_id,
        appointment.id,
        data.doctor_profile_id,
        data.ai_report_id
      );

      return appointment as Appointment;
    } catch (error) {
      console.error('[bookingService] Error in createAppointment:', error);
      throw error;
    }
  },

  /**
   * Récupérer les disponibilités d'un médecin pour une date donnée
   */
  async getDoctorAvailability(
    doctorId: string,
    date: string, // YYYY-MM-DD
    durationMinutes: number = 30
  ): Promise<DoctorAvailability> {
    try {
      // 1. Récupérer les rendez-vous existants pour cette date
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('scheduled_time, duration_minutes')
        .eq('doctor_profile_id', doctorId)
        .eq('scheduled_date', date)
        .in('status', ['scheduled', 'confirmed']);

      if (appointmentsError) {
        console.error('[bookingService] Error fetching existing appointments:', appointmentsError);
        throw appointmentsError;
      }

      // 2. Générer les créneaux disponibles (9h-18h par défaut)
      const startHour = 9;
      const endHour = 18;
      const slotInterval = durationMinutes;
      const availableSlots: { time: string; available: boolean }[] = [];

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotInterval) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Vérifier si ce créneau est déjà pris
          const isTaken = existingAppointments?.some(apt => {
            const aptTime = apt.scheduled_time.slice(0, 5); // HH:mm
            const aptEndTime = this.addMinutes(aptTime, apt.duration_minutes || 30);
            const slotEndTime = this.addMinutes(time, durationMinutes);
            
            // Vérifier chevauchement
            return (
              (time >= aptTime && time < aptEndTime) ||
              (slotEndTime > aptTime && slotEndTime <= aptEndTime) ||
              (time <= aptTime && slotEndTime >= aptEndTime)
            );
          });

          availableSlots.push({
            time,
            available: !isTaken,
          });
        }
      }

      return {
        date,
        availableSlots,
      };
    } catch (error) {
      console.error('[bookingService] Error in getDoctorAvailability:', error);
      throw error;
    }
  },

  /**
   * Ajouter des minutes à une heure
   */
  addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  },

  /**
   * Finaliser la réservation (créer le rendez-vous)
   */
  async bookAppointment(appointmentData: CreateAppointmentData): Promise<Appointment> {
    try {
      // Valider les données
      if (!appointmentData.patient_profile_id || !appointmentData.doctor_profile_id) {
        throw new Error('patient_profile_id and doctor_profile_id are required');
      }

      if (!appointmentData.scheduled_date || !appointmentData.scheduled_time) {
        throw new Error('scheduled_date and scheduled_time are required');
      }

      // Vérifier que le créneau est disponible
      const availability = await this.getDoctorAvailability(
        appointmentData.doctor_profile_id,
        appointmentData.scheduled_date,
        appointmentData.duration_minutes || 30
      );

      const slot = availability.availableSlots.find(s => s.time === appointmentData.scheduled_time);
      if (!slot || !slot.available) {
        throw new Error('Selected time slot is not available');
      }

      // Créer le rendez-vous
      return await this.createAppointment(appointmentData);
    } catch (error) {
      console.error('[bookingService] Error in bookAppointment:', error);
      throw error;
    }
  },

  /**
   * Partager le rapport médical avec le médecin
   */
  async shareReportWithDoctor(
    appointmentId: string,
    aiReportId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          report_shared: true,
          report_shared_at: new Date().toISOString(),
          ai_report_id: aiReportId,
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('[bookingService] Error sharing report:', error);
        throw error;
      }
    } catch (error) {
      console.error('[bookingService] Error in shareReportWithDoctor:', error);
      throw error;
    }
  },

  /**
   * Créer l'assignment patient-médecin
   */
  async createPatientDoctorAssignment(
    patientProfileId: string,
    doctorProfileId: string,
    aiReportId?: string
  ): Promise<void> {
    try {
      // Vérifier si l'assignment existe déjà
      const { data: existing } = await supabase
        .from('patient_doctor_assignments')
        .select('id')
        .eq('patient_profile_id', patientProfileId)
        .eq('doctor_profile_id', doctorProfileId)
        .eq('assignment_type', 'appointment')
        .eq('ai_report_id', aiReportId || '')
        .maybeSingle();

      if (existing) {
        // Assignment existe déjà, ne rien faire
        return;
      }

      const { error } = await supabase
        .from('patient_doctor_assignments')
        .insert({
          patient_profile_id: patientProfileId,
          doctor_profile_id: doctorProfileId,
          assignment_type: 'appointment',
          ai_report_id: aiReportId || null,
          assigned_at: new Date().toISOString(),
        });

      if (error) {
        // Ignorer les erreurs de contrainte unique (assignment existe déjà)
        if (error.code !== '23505') {
          console.error('[bookingService] Error creating assignment:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('[bookingService] Error in createPatientDoctorAssignment:', error);
      // Ne pas faire échouer la création du rendez-vous si l'assignment échoue
    }
  },

  /**
   * Créer un événement dans la timeline
   */
  async createTimelineEvent(
    patientProfileId: string,
    appointmentId: string,
    doctorProfileId: string,
    aiReportId?: string
  ): Promise<void> {
    try {
      // Récupérer les infos du médecin pour l'événement
      const { data: doctorData } = await supabase
        .from('doctor_profiles')
        .select(`
          specialty,
          profiles (
            full_name
          )
        `)
        .eq('id', doctorProfileId)
        .single();

      const doctorName = (doctorData as any)?.profiles?.full_name || 'Médecin';
      const specialty = (doctorData as any)?.specialty || '';

      // Récupérer les infos du rendez-vous pour la date
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select('scheduled_date, scheduled_time, appointment_type')
        .eq('id', appointmentId)
        .single();

      const appointmentDate = appointmentData?.scheduled_date
        ? `${appointmentData.scheduled_date}T${appointmentData.scheduled_time || '09:00:00'}`
        : new Date().toISOString();

      const { error } = await supabase
        .from('timeline_events')
        .insert({
          patient_profile_id: patientProfileId,
          event_type: 'appointment',
          event_title: `Consultation programmée avec ${doctorName}`,
          event_description: `Rendez-vous ${appointmentData?.appointment_type === 'teleconsultation' ? 'en téléconsultation' : 'au cabinet'} avec ${doctorName}${specialty ? ` (${specialty})` : ''}`,
          status: 'active',
          related_appointment_id: appointmentId,
          related_ai_report_id: aiReportId || null,
          event_date: appointmentDate,
        });

      if (error) {
        console.error('[bookingService] Error creating timeline event:', error);
        // Ne pas faire échouer la création du rendez-vous si l'événement échoue
      }
    } catch (error) {
      console.error('[bookingService] Error in createTimelineEvent:', error);
      // Ne pas faire échouer la création du rendez-vous si l'événement échoue
    }
  },

  /**
   * Récupérer un rendez-vous par son ID
   */
  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('[bookingService] Error fetching appointment:', error);
        throw error;
      }

      return data as Appointment;
    } catch (error) {
      console.error('[bookingService] Error in getAppointmentById:', error);
      return null;
    }
  },

  /**
   * Récupérer les rendez-vous d'un patient
   */
  async getPatientAppointments(patientProfileId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_profile_id', patientProfileId)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('[bookingService] Error fetching patient appointments:', error);
        throw error;
      }

      return (data || []) as Appointment[];
    } catch (error) {
      console.error('[bookingService] Error in getPatientAppointments:', error);
      return [];
    }
  },
};
