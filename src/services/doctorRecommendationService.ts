import { medinService, ExternalDoctor } from './medinService';
import type { AIReport, PatientProfile } from '../types/database';

/**
 * Interface pour une recommandation de médecin avec score
 */
export interface DoctorRecommendation extends ExternalDoctor {
  recommendationScore: number;
  recommendationReason: string;
  matchCriteria: {
    specialtyMatch: boolean;
    severityMatch: boolean;
    availabilityMatch: boolean;
    ratingMatch: boolean;
  };
}

/**
 * Mapping des diagnostics vers spécialités recommandées
 */
const diagnosisToSpecialtyMap: Record<string, string[]> = {
  // Pneumologie
  'pneumonie': ['Pneumologie', 'Médecine Générale'],
  'bronchite': ['Pneumologie', 'Médecine Générale'],
  'asthme': ['Pneumologie', 'Allergologie'],
  'infection respiratoire': ['Pneumologie', 'Médecine Générale'],
  
  // Cardiologie
  'infarctus': ['Cardiologie', 'Médecine Générale'],
  'hypertension': ['Cardiologie', 'Médecine Générale'],
  'arythmie': ['Cardiologie'],
  'angine de poitrine': ['Cardiologie'],
  
  // Gastro-entérologie
  'gastrite': ['Gastro-entérologie', 'Médecine Générale'],
  'ulcère': ['Gastro-entérologie'],
  'reflux': ['Gastro-entérologie', 'Médecine Générale'],
  
  // Neurologie
  'migraine': ['Neurologie', 'Médecine Générale'],
  'épilepsie': ['Neurologie'],
  'céphalée': ['Neurologie', 'Médecine Générale'],
  
  // Dermatologie
  'eczéma': ['Dermatologie'],
  'psoriasis': ['Dermatologie'],
  'acné': ['Dermatologie'],
  'allergie cutanée': ['Dermatologie', 'Allergologie'],
  
  // Rhumatologie
  'arthrite': ['Rhumatologie'],
  'arthrose': ['Rhumatologie', 'Médecine Générale'],
  'lombalgie': ['Rhumatologie', 'Médecine Générale'],
  
  // Endocrinologie
  'diabète': ['Endocrinologie', 'Médecine Générale'],
  'thyroïde': ['Endocrinologie'],
  
  // Urologie
  'infection urinaire': ['Urologie', 'Médecine Générale'],
  'prostate': ['Urologie'],
  
  // Gynécologie
  'infection gynécologique': ['Gynécologie'],
  'grossesse': ['Gynécologie'],
  
  // Pédiatrie
  'fièvre enfant': ['Pédiatrie'],
  'infection enfant': ['Pédiatrie'],
  
  // Autres
  'infection': ['Médecine Générale'],
  'fièvre': ['Médecine Générale'],
  'douleur': ['Médecine Générale'],
};

/**
 * Service de recommandation de médecins par Léa (IA)
 */
export const doctorRecommendationService = {
  /**
   * Recommander des médecins basé sur le rapport IA et le profil patient
   */
  async recommendDoctors(
    aiReport: AIReport,
    patientProfile?: PatientProfile | null,
    filters?: {
      city?: string;
      maxDistance?: number; // en km
      limit?: number;
    }
  ): Promise<DoctorRecommendation[]> {
    try {
      // 1. Déterminer les spécialités recommandées basées sur le diagnostic
      const recommendedSpecialties = this.getRecommendedSpecialties(aiReport);
      
      // 2. Charger les médecins depuis la base de données
      const allDoctors = await medinService.searchDoctors({
        specialty: recommendedSpecialties[0], // Commencer par la première spécialité
        city: filters?.city,
        minRating: 4.0, // Minimum 4 étoiles
        acceptsTeleconsultation: aiReport.overall_severity === 'low' ? true : undefined,
        limit: filters?.limit || 50,
      });

      // 3. Filtrer et scorer chaque médecin
      const recommendations: DoctorRecommendation[] = [];

      for (const doctor of allDoctors) {
        const score = this.calculateRecommendationScore(
          doctor,
          aiReport,
          recommendedSpecialties,
          patientProfile
        );

        if (score > 0) {
          // Filtrer par distance si spécifié
          if (filters?.maxDistance && patientProfile) {
            // Note: nécessite lat/lng du patient pour calculer distance
            // Pour MVP, on skip cette vérification si pas de coordonnées
          }

          const reason = this.generateRecommendationReason(
            doctor,
            aiReport,
            recommendedSpecialties,
            score
          );

          const matchCriteria = this.getMatchCriteria(
            doctor,
            aiReport,
            recommendedSpecialties
          );

          recommendations.push({
            ...doctor,
            recommendationScore: score,
            recommendationReason: reason,
            matchCriteria,
          });
        }
      }

      // 4. Trier par score décroissant
      recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);

      // 5. Retourner les meilleures recommandations
      return recommendations.slice(0, filters?.limit || 10);
    } catch (error) {
      console.error('[doctorRecommendationService] Error recommending doctors:', error);
      // En cas d'erreur, retourner une liste vide plutôt que de planter
      return [];
    }
  },

  /**
   * Déterminer les spécialités recommandées basées sur le diagnostic IA
   */
  getRecommendedSpecialties(aiReport: AIReport): string[] {
    const primaryDiagnosis = aiReport.primary_diagnosis?.toLowerCase() || '';
    const severity = aiReport.overall_severity || 'medium';

    // Chercher dans le mapping
    for (const [keyword, specialties] of Object.entries(diagnosisToSpecialtyMap)) {
      if (primaryDiagnosis.includes(keyword.toLowerCase())) {
        // Pour urgence élevée, prioriser spécialistes
        if (severity === 'high') {
          return specialties.filter(s => s !== 'Médecine Générale').concat(['Médecine Générale']);
        }
        return specialties;
      }
    }

    // Par défaut, recommander médecine générale
    // Pour urgence élevée, ajouter spécialistes selon le type de symptôme
    if (severity === 'high') {
      return ['Médecine Générale', 'Urgences'];
    }

    return ['Médecine Générale'];
  },

  /**
   * Calculer le score de recommandation pour un médecin (0-100)
   */
  calculateRecommendationScore(
    doctor: ExternalDoctor,
    aiReport: AIReport,
    recommendedSpecialties: string[],
    patientProfile?: PatientProfile | null
  ): number {
    let score = 0;

    // 1. Correspondance spécialité (40 points max)
    const specialtyMatch = recommendedSpecialties.some(spec =>
      doctor.specialty.toLowerCase().includes(spec.toLowerCase()) ||
      doctor.specialties?.some(s => s.toLowerCase().includes(spec.toLowerCase()))
    );
    if (specialtyMatch) {
      score += 40;
      // Bonus si c'est la spécialité principale
      if (doctor.specialty.toLowerCase().includes(recommendedSpecialties[0].toLowerCase())) {
        score += 10;
      }
    } else {
      // Médecine générale peut toujours être recommandée
      if (doctor.specialty.toLowerCase().includes('médecine générale') ||
          doctor.specialty.toLowerCase().includes('médecin généraliste')) {
        score += 30;
      }
    }

    // 2. Sévérité et urgence (20 points max)
    const severity = aiReport.overall_severity || 'medium';
    if (severity === 'high') {
      // Pour urgence, prioriser médecins vérifiés et disponibles rapidement
      if (doctor.is_verified) {
        score += 15;
      }
      if (doctor.accepts_teleconsultation) {
        score += 5; // Téléconsultation pour urgence
      }
    } else if (severity === 'medium') {
      if (doctor.is_verified) {
        score += 10;
      }
      if (doctor.accepts_teleconsultation) {
        score += 10; // Téléconsultation préférée pour cas moyens
      }
    } else {
      // Low severity
      if (doctor.accepts_teleconsultation) {
        score += 15; // Téléconsultation idéale pour cas légers
      }
    }

    // 3. Rating et avis (20 points max)
    if (doctor.rating) {
      // Score basé sur rating (0-5) → (0-20 points)
      score += (doctor.rating / 5) * 20;
      // Bonus si beaucoup d'avis
      if (doctor.total_reviews && doctor.total_reviews > 50) {
        score += 5;
      }
    }

    // 4. Disponibilité et accessibilité (10 points max)
    if (doctor.accepts_teleconsultation) {
      score += 5;
    }
    if (doctor.is_verified) {
      score += 5;
    }

    // 5. Prix raisonnable (10 points max)
    if (doctor.consultation_price) {
      // Bonus si prix raisonnable (entre 30 et 80 TND)
      if (doctor.consultation_price >= 30 && doctor.consultation_price <= 80) {
        score += 10;
      } else if (doctor.consultation_price < 30) {
        score += 5; // Prix très bas peut être suspect
      } else if (doctor.consultation_price > 80) {
        score += 2; // Prix élevé mais acceptable
      }
    }

    // Normaliser le score entre 0 et 100
    return Math.min(100, Math.max(0, score));
  },

  /**
   * Générer une raison de recommandation lisible
   */
  generateRecommendationReason(
    doctor: ExternalDoctor,
    aiReport: AIReport,
    recommendedSpecialties: string[],
    score: number
  ): string {
    const reasons: string[] = [];
    const severity = aiReport.overall_severity || 'medium';
    const primaryDiagnosis = aiReport.primary_diagnosis || 'votre état';

    // Raison principale : spécialité
    const specialtyMatch = recommendedSpecialties.some(spec =>
      doctor.specialty.toLowerCase().includes(spec.toLowerCase())
    );
    if (specialtyMatch) {
      reasons.push(`Spécialiste en ${doctor.specialty} adapté à votre diagnostic`);
    } else if (doctor.specialty.toLowerCase().includes('médecine générale')) {
      reasons.push('Médecin généraliste polyvalent');
    }

    // Raison secondaire : sévérité
    if (severity === 'high') {
      reasons.push('Recommandé pour urgence');
    } else if (severity === 'low' && doctor.accepts_teleconsultation) {
      reasons.push('Téléconsultation disponible pour suivi');
    }

    // Raison tertiaire : qualité
    if (doctor.rating && doctor.rating >= 4.5) {
      reasons.push(`Excellente note (${doctor.rating}/5)`);
    }
    if (doctor.is_verified) {
      reasons.push('Médecin vérifié');
    }

    return reasons.join(' • ') || 'Recommandé selon votre profil';
  },

  /**
   * Obtenir les critères de correspondance pour un médecin
   */
  getMatchCriteria(
    doctor: ExternalDoctor,
    aiReport: AIReport,
    recommendedSpecialties: string[]
  ): {
    specialtyMatch: boolean;
    severityMatch: boolean;
    availabilityMatch: boolean;
    ratingMatch: boolean;
  } {
    const specialtyMatch = recommendedSpecialties.some(spec =>
      doctor.specialty.toLowerCase().includes(spec.toLowerCase()) ||
      doctor.specialties?.some(s => s.toLowerCase().includes(spec.toLowerCase()))
    );

    const severity = aiReport.overall_severity || 'medium';
    const severityMatch =
      (severity === 'high' && doctor.is_verified) ||
      (severity === 'low' && doctor.accepts_teleconsultation) ||
      severity === 'medium';

    const availabilityMatch = doctor.accepts_teleconsultation || true; // Toujours disponible en présentiel

    const ratingMatch = doctor.rating ? doctor.rating >= 4.0 : false;

    return {
      specialtyMatch,
      severityMatch,
      availabilityMatch,
      ratingMatch,
    };
  },

  /**
   * Filtrer les médecins recommandés par score minimum
   */
  filterByMinScore(
    recommendations: DoctorRecommendation[],
    minScore: number = 50
  ): DoctorRecommendation[] {
    return recommendations.filter(rec => rec.recommendationScore >= minScore);
  },

  /**
   * Trier les recommandations par différents critères
   */
  sortRecommendations(
    recommendations: DoctorRecommendation[],
    sortBy: 'score' | 'rating' | 'price' | 'distance' = 'score'
  ): DoctorRecommendation[] {
    const sorted = [...recommendations];

    switch (sortBy) {
      case 'score':
        return sorted.sort((a, b) => b.recommendationScore - a.recommendationScore);
      case 'rating':
        return sorted.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        });
      case 'price':
        return sorted.sort((a, b) => {
          const priceA = a.consultation_price || Infinity;
          const priceB = b.consultation_price || Infinity;
          return priceA - priceB;
        });
      case 'distance':
        // Nécessite calcul de distance (à implémenter si coordonnées disponibles)
        return sorted;
      default:
        return sorted;
    }
  },
};
