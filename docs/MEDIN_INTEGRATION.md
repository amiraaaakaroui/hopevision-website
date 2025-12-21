# Intégration Med.in - Documentation

## Vue d'ensemble

Med.tn est une plateforme qui présente un annuaire des médecins en Tunisie avec des informations complètes : liste des médecins, descriptions, images, avis, données de contact, adresses, numéros de téléphone, emplacements, etc.

Ces informations existent également sur Google Maps et d'autres annuaires en ligne.

## Objectif

Collecter une base de données des médecins existants en Tunisie via web scraping et les afficher dans notre plateforme HopeVisionAI pour permettre aux patients de réserver des rendez-vous.

## Stratégie de Collecte

### Sources de données
1. **Med.tn** - Annuaire médical tunisien principal
2. **Google Maps** - Recherche "médecin Tunisie" avec filtres par spécialité
3. **Autres annuaires médicaux tunisiens** (si disponibles)

### Données à collecter

Pour chaque médecin :
- **Informations de base:**
  - Nom complet
  - Spécialité(s)
  - Photo/avatar
  - Description/Bio
  - Numéro de téléphone
  - Email (si disponible)

- **Localisation:**
  - Adresse complète
  - Ville
  - Code postal (si disponible)
  - Coordonnées GPS (latitude, longitude)
  - Distance depuis le patient (calculée dynamiquement)

- **Évaluations:**
  - Note moyenne (rating)
  - Nombre d'avis
  - Avis récents (optionnel)

- **Informations professionnelles:**
  - Numéro RPPS ou équivalent tunisien
  - Certifications
  - Années d'expérience (si disponible)
  - Langues parlées

- **Tarifs:**
  - Prix consultation
  - Prix téléconsultation (si disponible)
  - Prise en charge mutuelle (si disponible)

- **Disponibilités:**
  - Jours de consultation
  - Horaires
  - Disponibilité téléconsultation

## Architecture Technique

### Option 1 : Table dédiée `external_doctors`
Créer une table séparée pour les médecins externes scrapés, puis les synchroniser avec `doctor_profiles` si le médecin s'inscrit sur la plateforme.

**Avantages:**
- Séparation claire entre médecins externes et médecins inscrits
- Pas de pollution de `doctor_profiles` avec des données non vérifiées
- Facile à mettre à jour/supprimer

**Inconvénients:**
- Nécessite une logique de synchronisation
- Duplication potentielle si médecin s'inscrit

### Option 2 : Étendre `doctor_profiles`
Ajouter des champs à `doctor_profiles` pour indiquer si le médecin vient de Med.in et stocker les données externes.

**Avantages:**
- Une seule source de vérité
- Pas de duplication
- Facile à utiliser dans les requêtes

**Inconvénients:**
- Mélange médecins vérifiés et non vérifiés
- Nécessite un flag `is_external` ou `source`

### Option choisie : **Hybride**

Créer une table `external_doctors` pour stocker les médecins scrapés, avec possibilité de les lier à `doctor_profiles` si le médecin s'inscrit.

## Structure de Données

### Table `external_doctors`
```sql
CREATE TABLE external_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medin_id TEXT UNIQUE, -- ID depuis Med.in (si disponible)
  source TEXT NOT NULL DEFAULT 'medin', -- 'medin', 'google', 'manual'
  
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
  rating DECIMAL(3, 2), -- 0.00 à 5.00
  total_reviews INTEGER DEFAULT 0,
  
  -- Tarifs
  consultation_price DECIMAL(10, 2), -- en TND
  teleconsultation_price DECIMAL(10, 2), -- en TND
  
  -- Informations professionnelles
  license_number TEXT,
  certifications TEXT[],
  languages TEXT[], -- Langues parlées
  years_experience INTEGER,
  
  -- Disponibilités (stockées en JSONB pour flexibilité)
  availability JSONB, -- { "monday": { "start": "09:00", "end": "17:00" }, ... }
  accepts_teleconsultation BOOLEAN DEFAULT false,
  
  -- Métadonnées
  is_verified BOOLEAN DEFAULT false, -- Vérifié manuellement
  is_active BOOLEAN DEFAULT true,
  linked_doctor_profile_id UUID REFERENCES doctor_profiles(id), -- Si médecin s'inscrit
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Script de Scraping

### Outils recommandés
- **Puppeteer** ou **Playwright** pour le scraping JavaScript
- **Cheerio** pour le parsing HTML
- **Node.js** pour l'exécution

### Structure du script
```
scripts/
  sync-medin-doctors.ts
  scrapers/
    medin-scraper.ts
    google-scraper.ts
  utils/
    data-cleaner.ts
    geocoder.ts
```

### Processus de scraping
1. **Collecte initiale:**
   - Scraper Med.tn par spécialité
   - Scraper Google Maps par ville + spécialité
   - Nettoyer et normaliser les données

2. **Enrichissement:**
   - Géocodage des adresses (obtenir lat/lng)
   - Calcul des distances depuis centres urbains
   - Vérification des doublons

3. **Insertion en base:**
   - Vérifier si médecin existe déjà (par nom + spécialité + ville)
   - Insérer ou mettre à jour
   - Marquer comme non vérifié (`is_verified = false`)

4. **Synchronisation périodique:**
   - Mettre à jour les données existantes
   - Ajouter nouveaux médecins
   - Désactiver médecins qui ne sont plus disponibles

## Service d'Intégration

### `src/services/medinService.ts`

Fonctions principales :
- `fetchDoctorsFromMedin(specialty?, city?)` - Récupérer médecins depuis Med.in
- `syncDoctorsToDatabase(doctors)` - Synchroniser médecins en base
- `getDoctorById(medinId)` - Récupérer un médecin spécifique
- `searchDoctors(filters)` - Rechercher médecins avec filtres
- `updateDoctorAvailability(doctorId, availability)` - Mettre à jour disponibilités

## Utilisation dans l'Application

### Affichage dans BookingProviderSelection
1. Charger médecins depuis `external_doctors` ET `doctor_profiles`
2. Filtrer par spécialité, ville, disponibilité
3. Trier par recommandation IA, distance, rating
4. Afficher avec badge "Vérifié" si `is_verified = true`

### Synchronisation avec doctor_profiles
Si un médecin de `external_doctors` s'inscrit sur la plateforme :
1. Détecter correspondance (nom + spécialité + ville)
2. Créer `doctor_profile` avec `profile_id`
3. Lier `external_doctors.linked_doctor_profile_id`
4. Marquer `external_doctors.is_verified = true`

## Sécurité et Conformité

### Données personnelles
- Respecter RGPD pour les données collectées
- Permettre aux médecins de demander suppression
- Anonymiser les données si nécessaire

### Rate Limiting
- Limiter les requêtes de scraping
- Respecter les robots.txt
- Utiliser des délais entre requêtes

### Vérification
- Marquer toutes les données scrapées comme non vérifiées
- Permettre vérification manuelle par l'équipe
- Permettre aux médecins de corriger leurs données

## Prochaines Étapes

1. ✅ Créer schéma SQL `external_doctors`
2. ✅ Créer service `medinService.ts`
3. ⏳ Créer script de scraping `sync-medin-doctors.ts`
4. ⏳ Implémenter géocodage des adresses
5. ⏳ Créer interface admin pour vérifier/moderer médecins
6. ⏳ Implémenter synchronisation automatique périodique

## Notes

- Pour le MVP, on peut commencer avec des données manuelles ou un petit échantillon scrapé
- Le scraping complet peut être fait progressivement
- Prioriser les médecins des grandes villes (Tunis, Sfax, Sousse)
- Prioriser les spécialités les plus demandées
