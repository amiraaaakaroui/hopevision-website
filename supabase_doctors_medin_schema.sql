-- ============================================================================
-- HopeVisionAI - External Doctors Schema (Med.in Integration)
-- ============================================================================
-- Table pour stocker les médecins collectés depuis Med.in, Google, etc.
-- ============================================================================

-- Table pour les médecins externes (scrapés)
CREATE TABLE IF NOT EXISTS external_doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medin_id TEXT UNIQUE, -- ID depuis Med.in (si disponible)
    source TEXT NOT NULL DEFAULT 'medin' CHECK (source IN ('medin', 'google', 'manual', 'other')),
    
    -- Informations de base
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    specialties TEXT[], -- Plusieurs spécialités possibles
    bio TEXT,
    image_url TEXT,
    
    -- Contact
    phone TEXT,
    email TEXT,
    website TEXT,
    
    -- Localisation
    address TEXT,
    city TEXT NOT NULL,
    postal_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Évaluations
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5), -- 0.00 à 5.00
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    
    -- Tarifs
    consultation_price DECIMAL(10, 2), -- en TND
    teleconsultation_price DECIMAL(10, 2), -- en TND
    
    -- Informations professionnelles
    license_number TEXT,
    certifications TEXT[], -- ['Télémédecine', 'HopeVisionAI', etc.]
    languages TEXT[], -- Langues parlées ['Français', 'Arabe', 'Anglais']
    years_experience INTEGER CHECK (years_experience >= 0),
    
    -- Disponibilités (stockées en JSONB pour flexibilité)
    -- Format: { "monday": { "start": "09:00", "end": "17:00", "available": true }, ... }
    availability JSONB,
    accepts_teleconsultation BOOLEAN DEFAULT false,
    
    -- Métadonnées
    is_verified BOOLEAN DEFAULT false, -- Vérifié manuellement par l'équipe
    is_active BOOLEAN DEFAULT true, -- Actif dans la plateforme
    linked_doctor_profile_id UUID REFERENCES doctor_profiles(id) ON DELETE SET NULL, -- Si médecin s'inscrit sur la plateforme
    last_synced_at TIMESTAMPTZ, -- Dernière synchronisation depuis source externe
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_external_doctors_city ON external_doctors(city);
CREATE INDEX IF NOT EXISTS idx_external_doctors_specialty ON external_doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_external_doctors_rating ON external_doctors(rating DESC);
CREATE INDEX IF NOT EXISTS idx_external_doctors_active ON external_doctors(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_external_doctors_verified ON external_doctors(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_external_doctors_linked ON external_doctors(linked_doctor_profile_id) WHERE linked_doctor_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_external_doctors_medin_id ON external_doctors(medin_id) WHERE medin_id IS NOT NULL;

-- Index GIN pour recherches dans les arrays
CREATE INDEX IF NOT EXISTS idx_external_doctors_specialties ON external_doctors USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_external_doctors_certifications ON external_doctors USING GIN(certifications);

-- Index pour géolocalisation (si lat/lng disponibles)
CREATE INDEX IF NOT EXISTS idx_external_doctors_location ON external_doctors(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_external_doctors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_external_doctors_updated_at ON external_doctors;
CREATE TRIGGER trg_update_external_doctors_updated_at
    BEFORE UPDATE ON external_doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_external_doctors_updated_at();

-- ============================================================================
-- Vue combinée pour afficher médecins (externes + inscrits)
-- ============================================================================
CREATE OR REPLACE VIEW doctors_combined AS
SELECT 
    'external' as source_type,
    ed.id,
    ed.name,
    ed.specialty,
    ed.specialties,
    ed.bio,
    ed.image_url,
    ed.phone,
    ed.email,
    ed.address,
    ed.city,
    ed.latitude,
    ed.longitude,
    ed.rating,
    ed.total_reviews,
    ed.consultation_price,
    ed.teleconsultation_price,
    ed.accepts_teleconsultation,
    ed.is_verified,
    ed.linked_doctor_profile_id,
    NULL::UUID as profile_id, -- Pas de profile pour externe
    NULL::UUID as user_id -- Pas d'user pour externe
FROM external_doctors ed
WHERE ed.is_active = true

UNION ALL

SELECT 
    'registered' as source_type,
    dp.id,
    p.full_name as name,
    dp.specialty,
    ARRAY[dp.specialty]::TEXT[] as specialties,
    dp.bio,
    p.avatar_url as image_url,
    p.phone_number as phone,
    p.email,
    NULL::TEXT as address, -- À ajouter si nécessaire
    NULL::TEXT as city, -- À ajouter si nécessaire
    NULL::DECIMAL as latitude,
    NULL::DECIMAL as longitude,
    dp.rating,
    dp.total_reviews,
    dp.consultation_price,
    NULL::DECIMAL as teleconsultation_price, -- À ajouter si nécessaire
    false as accepts_teleconsultation, -- À déterminer
    dp.is_verified,
    NULL::UUID as linked_doctor_profile_id,
    dp.profile_id,
    p.user_id
FROM doctor_profiles dp
JOIN profiles p ON dp.profile_id = p.id
WHERE p.is_deleted = false;

-- ============================================================================
-- Fonction pour rechercher médecins avec filtres
-- ============================================================================
CREATE OR REPLACE FUNCTION search_doctors(
    p_specialty TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_min_rating DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_accepts_teleconsultation BOOLEAN DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    source_type TEXT,
    name TEXT,
    specialty TEXT,
    specialties TEXT[],
    city TEXT,
    rating DECIMAL,
    total_reviews INTEGER,
    consultation_price DECIMAL,
    teleconsultation_price DECIMAL,
    accepts_teleconsultation BOOLEAN,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.source_type,
        dc.name,
        dc.specialty,
        dc.specialties,
        dc.city,
        dc.rating,
        dc.total_reviews,
        dc.consultation_price,
        dc.teleconsultation_price,
        dc.accepts_teleconsultation,
        dc.is_verified
    FROM doctors_combined dc
    WHERE 
        (p_specialty IS NULL OR dc.specialty = p_specialty OR p_specialty = ANY(dc.specialties))
        AND (p_city IS NULL OR dc.city ILIKE '%' || p_city || '%')
        AND (p_min_rating IS NULL OR dc.rating >= p_min_rating)
        AND (p_max_price IS NULL OR dc.consultation_price <= p_max_price)
        AND (p_accepts_teleconsultation IS NULL OR dc.accepts_teleconsultation = p_accepts_teleconsultation)
    ORDER BY 
        dc.is_verified DESC, -- Médecins vérifiés en premier
        dc.rating DESC NULLS LAST,
        dc.total_reviews DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS Policies (si nécessaire)
-- ============================================================================
-- Les médecins externes sont publics (lecture seule pour tous)
-- Seuls les admins peuvent modifier

ALTER TABLE external_doctors ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les médecins actifs
CREATE POLICY "Anyone can view active external doctors"
    ON external_doctors FOR SELECT
    USING (is_active = true);

-- Policy: Seuls les admins peuvent modifier
CREATE POLICY "Only admins can modify external doctors"
    ON external_doctors FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- Commentaires
-- ============================================================================
COMMENT ON TABLE external_doctors IS 'Médecins collectés depuis sources externes (Med.in, Google, etc.)';
COMMENT ON COLUMN external_doctors.medin_id IS 'ID unique depuis Med.in pour éviter les doublons';
COMMENT ON COLUMN external_doctors.source IS 'Source des données: medin, google, manual, other';
COMMENT ON COLUMN external_doctors.availability IS 'JSONB avec disponibilités par jour: {"monday": {"start": "09:00", "end": "17:00", "available": true}}';
COMMENT ON COLUMN external_doctors.linked_doctor_profile_id IS 'Lien vers doctor_profiles si le médecin s inscrit sur la plateforme';
