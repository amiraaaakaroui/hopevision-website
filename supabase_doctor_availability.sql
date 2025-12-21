-- ============================================================================
-- HopeVisionAI - Doctor Availability Schema
-- ============================================================================
-- Table pour gérer les disponibilités des médecins
-- Alternative: utiliser appointments pour calculer disponibilités dynamiquement
-- ============================================================================

-- Option 1: Table dédiée pour horaires de base des médecins
CREATE TABLE IF NOT EXISTS doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    
    -- Jour de la semaine (0 = Dimanche, 1 = Lundi, ..., 6 = Samedi)
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    
    -- Heures de disponibilité
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Type de consultation disponible ce jour
    appointment_types TEXT[] DEFAULT ARRAY['in_person']::TEXT[], -- ['in_person', 'teleconsultation']
    
    -- Disponibilité active
    is_available BOOLEAN NOT NULL DEFAULT true,
    
    -- Durée par défaut des créneaux (en minutes)
    slot_duration_minutes INTEGER DEFAULT 30 CHECK (slot_duration_minutes > 0),
    
    -- Pause déjeuner (optionnel)
    lunch_break_start TIME,
    lunch_break_end TIME,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Un médecin ne peut avoir qu'une seule plage horaire par jour
    UNIQUE(doctor_profile_id, day_of_week)
);

-- Index pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability(doctor_profile_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON doctor_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_available ON doctor_availability(is_available) WHERE is_available = true;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_doctor_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_doctor_availability_updated_at ON doctor_availability;
CREATE TRIGGER trg_update_doctor_availability_updated_at
    BEFORE UPDATE ON doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_doctor_availability_updated_at();

-- ============================================================================
-- Fonction pour calculer les disponibilités réelles d'un médecin
-- Prend en compte les rendez-vous existants et les horaires de base
-- ============================================================================
CREATE OR REPLACE FUNCTION get_doctor_available_slots(
    p_doctor_id UUID,
    p_date DATE,
    p_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
    time_slot TIME,
    available BOOLEAN
) AS $$
DECLARE
    v_day_of_week INTEGER;
    v_start_time TIME;
    v_end_time TIME;
    v_slot_interval INTEGER;
    v_current_time TIME;
    v_slot_end_time TIME;
    v_is_taken BOOLEAN;
BEGIN
    -- Déterminer le jour de la semaine (0 = Dimanche, 1 = Lundi, etc.)
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Récupérer les horaires de base du médecin pour ce jour
    SELECT start_time, end_time, slot_duration_minutes
    INTO v_start_time, v_end_time, v_slot_interval
    FROM doctor_availability
    WHERE doctor_profile_id = p_doctor_id
      AND day_of_week = v_day_of_week
      AND is_available = true
    LIMIT 1;
    
    -- Si pas d'horaires définis, utiliser des horaires par défaut (9h-18h)
    IF v_start_time IS NULL THEN
        v_start_time := '09:00'::TIME;
        v_end_time := '18:00'::TIME;
        v_slot_interval := p_duration_minutes;
    END IF;
    
    -- Utiliser la durée demandée si différente de celle définie
    IF p_duration_minutes != v_slot_interval THEN
        v_slot_interval := p_duration_minutes;
    END IF;
    
    -- Générer les créneaux
    v_current_time := v_start_time;
    
    WHILE v_current_time < v_end_time LOOP
        -- Calculer l'heure de fin du créneau
        v_slot_end_time := v_current_time + (v_slot_interval || ' minutes')::INTERVAL;
        
        -- Vérifier si ce créneau chevauche un rendez-vous existant
        SELECT EXISTS (
            SELECT 1
            FROM appointments
            WHERE doctor_profile_id = p_doctor_id
              AND scheduled_date = p_date
              AND status IN ('scheduled', 'confirmed')
              AND (
                  -- Le créneau commence pendant un rendez-vous existant
                  (scheduled_time <= v_current_time AND 
                   (scheduled_time + (COALESCE(duration_minutes, 30) || ' minutes')::INTERVAL) > v_current_time)
                  OR
                  -- Le créneau se termine pendant un rendez-vous existant
                  (scheduled_time < v_slot_end_time AND 
                   (scheduled_time + (COALESCE(duration_minutes, 30) || ' minutes')::INTERVAL) >= v_slot_end_time)
                  OR
                  -- Le créneau englobe complètement un rendez-vous existant
                  (scheduled_time >= v_current_time AND 
                   (scheduled_time + (COALESCE(duration_minutes, 30) || ' minutes')::INTERVAL) <= v_slot_end_time)
              )
        ) INTO v_is_taken;
        
        -- Retourner le créneau avec son statut
        RETURN QUERY SELECT v_current_time, NOT v_is_taken;
        
        -- Passer au créneau suivant
        v_current_time := v_current_time + (v_slot_interval || ' minutes')::INTERVAL;
        
        -- Vérifier la pause déjeuner si définie
        -- (À implémenter si nécessaire)
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les disponibilités
CREATE POLICY "Anyone can view doctor availability"
    ON doctor_availability FOR SELECT
    USING (is_available = true);

-- Policy: Seuls les médecins peuvent modifier leurs propres disponibilités
CREATE POLICY "Doctors can manage their own availability"
    ON doctor_availability FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM doctor_profiles dp
            JOIN profiles p ON dp.profile_id = p.id
            WHERE dp.id = doctor_availability.doctor_profile_id
            AND p.user_id = auth.uid()
        )
    );

-- ============================================================================
-- Données de test (horaires par défaut pour médecins sans horaires définis)
-- ============================================================================
-- Pour le MVP, on peut utiliser cette fonction pour créer des horaires par défaut
-- ou calculer directement depuis appointments

COMMENT ON TABLE doctor_availability IS 'Horaires de base des médecins par jour de la semaine';
COMMENT ON COLUMN doctor_availability.day_of_week IS '0 = Dimanche, 1 = Lundi, ..., 6 = Samedi';
COMMENT ON COLUMN doctor_availability.appointment_types IS 'Types de consultations disponibles ce jour: in_person, teleconsultation, etc.';
