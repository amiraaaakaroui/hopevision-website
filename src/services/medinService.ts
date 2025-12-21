import { supabase } from '../lib/supabaseClient';

/**
 * Interface pour un médecin externe (depuis Med.in ou autres sources)
 */
export interface ExternalDoctor {
  id: string;
  medin_id?: string | null;
  source: 'medin' | 'google' | 'manual' | 'other';
  name: string;
  specialty: string;
  specialties?: string[] | null;
  bio?: string | null;
  image_url?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city: string;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  total_reviews?: number | null;
  consultation_price?: number | null;
  teleconsultation_price?: number | null;
  license_number?: string | null;
  certifications?: string[] | null;
  languages?: string[] | null;
  years_experience?: number | null;
  availability?: any; // JSONB
  accepts_teleconsultation?: boolean | null;
  is_verified?: boolean | null;
  is_active?: boolean | null;
  linked_doctor_profile_id?: string | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface pour les filtres de recherche de médecins
 */
export interface DoctorSearchFilters {
  specialty?: string;
  city?: string;
  minRating?: number;
  maxPrice?: number;
  acceptsTeleconsultation?: boolean;
  limit?: number;
}

/**
 * Service pour gérer les médecins externes (Med.in, Google, etc.)
 */
export const medinService = {
  /**
   * Récupérer tous les médecins actifs depuis external_doctors et doctor_profiles
   */
  async getAllDoctors(filters?: DoctorSearchFilters): Promise<ExternalDoctor[]> {
    try {
      let query = supabase
        .from('external_doctors')
        .select('*')
        .eq('is_active', true);

      if (filters?.specialty) {
        query = query.or(`specialty.eq.${filters.specialty},specialties.cs.{${filters.specialty}}`);
      }

      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters?.minRating !== undefined) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('consultation_price', filters.maxPrice);
      }

      if (filters?.acceptsTeleconsultation !== undefined) {
        query = query.eq('accepts_teleconsultation', filters.acceptsTeleconsultation);
      }

      query = query.order('is_verified', { ascending: false });
      query = query.order('rating', { ascending: false, nullsFirst: false });
      query = query.order('total_reviews', { ascending: false, nullsFirst: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[medinService] Error fetching doctors:', error);
        throw error;
      }

      return (data || []) as ExternalDoctor[];
    } catch (error) {
      console.error('[medinService] Error in getAllDoctors:', error);
      throw error;
    }
  },

  /**
   * Récupérer les médecins depuis la vue combinée (external + registered)
   * Utilise la fonction SQL search_doctors si disponible
   */
  async searchDoctors(filters: DoctorSearchFilters): Promise<ExternalDoctor[]> {
    try {
      // Essayer d'utiliser la fonction SQL search_doctors
      const { data, error } = await supabase.rpc('search_doctors', {
        p_specialty: filters.specialty || null,
        p_city: filters.city || null,
        p_min_rating: filters.minRating || null,
        p_max_price: filters.maxPrice || null,
        p_accepts_teleconsultation: filters.acceptsTeleconsultation || null,
        p_limit: filters.limit || 50,
      });

      if (error) {
        console.warn('[medinService] RPC search_doctors failed, falling back to direct query:', error);
        // Fallback vers getAllDoctors si la fonction RPC n'existe pas encore
        return this.getAllDoctors(filters);
      }

      // Convertir les résultats de la vue en ExternalDoctor[]
      return (data || []).map((doc: any) => ({
        id: doc.id,
        source: doc.source_type === 'external' ? 'medin' : 'manual',
        name: doc.name,
        specialty: doc.specialty,
        specialties: doc.specialties || [doc.specialty],
        bio: doc.bio,
        image_url: doc.image_url,
        phone: doc.phone,
        email: doc.email,
        address: doc.address,
        city: doc.city || '',
        latitude: doc.latitude,
        longitude: doc.longitude,
        rating: doc.rating,
        total_reviews: doc.total_reviews,
        consultation_price: doc.consultation_price,
        teleconsultation_price: doc.teleconsultation_price,
        accepts_teleconsultation: doc.accepts_teleconsultation || false,
        is_verified: doc.is_verified,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) as ExternalDoctor[];
    } catch (error) {
      console.error('[medinService] Error in searchDoctors:', error);
      // Fallback vers getAllDoctors
      return this.getAllDoctors(filters);
    }
  },

  /**
   * Récupérer un médecin par son ID
   */
  async getDoctorById(doctorId: string): Promise<ExternalDoctor | null> {
    try {
      const { data, error } = await supabase
        .from('external_doctors')
        .select('*')
        .eq('id', doctorId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas trouvé dans external_doctors, chercher dans doctor_profiles
          return this.getRegisteredDoctorById(doctorId);
        }
        console.error('[medinService] Error fetching doctor by ID:', error);
        throw error;
      }

      return data as ExternalDoctor;
    } catch (error) {
      console.error('[medinService] Error in getDoctorById:', error);
      return null;
    }
  },

  /**
   * Récupérer un médecin inscrit par son ID (depuis doctor_profiles)
   */
  async getRegisteredDoctorById(doctorId: string): Promise<ExternalDoctor | null> {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone_number,
            avatar_url
          )
        `)
        .eq('id', doctorId)
        .single();

      if (error) {
        console.error('[medinService] Error fetching registered doctor:', error);
        return null;
      }

      if (!data) return null;

      // Convertir doctor_profile en ExternalDoctor format
      return {
        id: data.id,
        source: 'manual',
        name: data.profiles?.full_name || 'Médecin',
        specialty: data.specialty,
        specialties: [data.specialty],
        bio: data.bio,
        image_url: data.profiles?.avatar_url || null,
        phone: data.profiles?.phone_number || null,
        email: data.profiles?.email || null,
        city: '', // À ajouter si disponible
        rating: data.rating ? Number(data.rating) : null,
        total_reviews: data.total_reviews || 0,
        consultation_price: data.consultation_price ? Number(data.consultation_price) : null,
        accepts_teleconsultation: false, // À déterminer
        is_verified: data.is_verified,
        is_active: true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as ExternalDoctor;
    } catch (error) {
      console.error('[medinService] Error in getRegisteredDoctorById:', error);
      return null;
    }
  },

  /**
   * Récupérer un médecin par son medin_id
   */
  async getDoctorByMedinId(medinId: string): Promise<ExternalDoctor | null> {
    try {
      const { data, error } = await supabase
        .from('external_doctors')
        .select('*')
        .eq('medin_id', medinId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('[medinService] Error fetching doctor by medin_id:', error);
        return null;
      }

      return data as ExternalDoctor | null;
    } catch (error) {
      console.error('[medinService] Error in getDoctorByMedinId:', error);
      return null;
    }
  },

  /**
   * Synchroniser un médecin en base de données
   * Crée ou met à jour selon medin_id
   */
  async syncDoctorToDatabase(doctor: Partial<ExternalDoctor>): Promise<ExternalDoctor> {
    try {
      if (!doctor.medin_id && !doctor.name) {
        throw new Error('medin_id or name is required');
      }

      // Vérifier si le médecin existe déjà
      let existingDoctor: ExternalDoctor | null = null;

      if (doctor.medin_id) {
        existingDoctor = await this.getDoctorByMedinId(doctor.medin_id);
      }

      if (existingDoctor) {
        // Mettre à jour
        const { data, error } = await supabase
          .from('external_doctors')
          .update({
            ...doctor,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingDoctor.id)
          .select()
          .single();

        if (error) {
          console.error('[medinService] Error updating doctor:', error);
          throw error;
        }

        return data as ExternalDoctor;
      } else {
        // Créer
        const { data, error } = await supabase
          .from('external_doctors')
          .insert({
            ...doctor,
            is_active: true,
            is_verified: false,
            last_synced_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('[medinService] Error creating doctor:', error);
          throw error;
        }

        return data as ExternalDoctor;
      }
    } catch (error) {
      console.error('[medinService] Error in syncDoctorToDatabase:', error);
      throw error;
    }
  },

  /**
   * Synchroniser plusieurs médecins en une seule transaction
   */
  async syncDoctorsToDatabase(doctors: Partial<ExternalDoctor>[]): Promise<ExternalDoctor[]> {
    try {
      const results: ExternalDoctor[] = [];

      // Traiter par batch de 10 pour éviter de surcharger
      const batchSize = 10;
      for (let i = 0; i < doctors.length; i += batchSize) {
        const batch = doctors.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(doctor => this.syncDoctorToDatabase(doctor))
        );
        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      console.error('[medinService] Error in syncDoctorsToDatabase:', error);
      throw error;
    }
  },

  /**
   * Calculer la distance entre deux points GPS (formule de Haversine)
   * Retourne la distance en kilomètres
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance en km
    return Math.round(distance * 10) / 10; // Arrondir à 1 décimale
  },

  /**
   * Convertir degrés en radians
   */
  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  },

  /**
   * Trier les médecins par distance depuis un point GPS
   */
  sortDoctorsByDistance(
    doctors: ExternalDoctor[],
    patientLat: number,
    patientLon: number
  ): ExternalDoctor[] {
    return doctors
      .map(doctor => ({
        ...doctor,
        distance: doctor.latitude && doctor.longitude
          ? this.calculateDistance(patientLat, patientLon, doctor.latitude, doctor.longitude)
          : null,
      }))
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  },
};
