/**
 * Test Runner for HopeVisionAI
 * Exécute des tests automatisés pour vérifier le fonctionnement de l'application
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️  Fichier .env non trouvé. Utilisation des variables d\'environnement système.');
}

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const openaiApiKey = process.env.VITE_OPENAI_API_KEY || '';

// Résultats des tests
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Fonction utilitaire pour les tests (gère sync/async)
async function test(name, fn) {
  try {
    const possiblePromise = fn();
    const result = possiblePromise instanceof Promise ? await possiblePromise : possiblePromise;

    if (result === true || (result && result.passed)) {
      testResults.passed++;
      testResults.tests.push({ name, status: '✅ PASSED', message: result.message || '' });
      console.log(`✅ ${name}`);
      if (result && result.message) console.log(`   ${result.message}`);
    } else {
      testResults.failed++;
      testResults.tests.push({ name, status: '❌ FAILED', message: result?.message || result || 'Test failed' });
      console.log(`❌ ${name}`);
      console.log(`   ${result?.message || result}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: '❌ ERROR', message: error.message });
    console.log(`❌ ${name}`);
    console.log(`   Erreur: ${error.message}`);
  }
}

function warn(message) {
  testResults.warnings++;
  console.log(`⚠️  ${message}`);
}

// Tests
console.log('\n🧪 Démarrage des tests HopeVisionAI\n');
console.log('=' .repeat(60));

// Test 1: Configuration des variables d'environnement
console.log('\n📋 Test 1: Configuration');
test('Variables d\'environnement Supabase', () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { passed: false, message: 'VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquantes' };
  }
  if (!supabaseUrl.startsWith('http')) {
    return { passed: false, message: 'VITE_SUPABASE_URL doit être une URL valide' };
  }
  return { passed: true, message: `Supabase URL: ${supabaseUrl.substring(0, 30)}...` };
});

test('Variable d\'environnement OpenAI', () => {
  if (!openaiApiKey) {
    warn('VITE_OPENAI_API_KEY non configurée - Les tests IA seront ignorés');
    return { passed: true, message: 'OpenAI non configuré (optionnel pour certains tests)' };
  }
  if (!openaiApiKey.startsWith('sk-')) {
    return { passed: false, message: 'VITE_OPENAI_API_KEY doit commencer par "sk-"' };
  }
  return { passed: true, message: 'OpenAI API key configurée' };
});

// Test 2: Connexion Supabase
console.log('\n📋 Test 2: Connexion Supabase');
let supabase;
test('Initialisation client Supabase', () => {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    if (!supabase) {
      return { passed: false, message: 'Échec de création du client Supabase' };
    }
    return { passed: true, message: 'Client Supabase créé avec succès' };
  } catch (error) {
    return { passed: false, message: `Erreur: ${error.message}` };
  }
});

test('Connexion à Supabase (ping)', async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { passed: false, message: `Erreur de connexion: ${error.message}` };
    }
    return { passed: true, message: 'Connexion Supabase réussie' };
  } catch (error) {
    return { passed: false, message: `Erreur: ${error.message}` };
  }
});

// Test 3: Structure de la base de données
console.log('\n📋 Test 3: Structure Base de Données');
const requiredTables = [
  'profiles',
  'patient_profiles',
  'doctor_profiles',
  'pre_analyses',
  'ai_reports',
  'diagnostic_hypotheses',
  'chat_precision_messages',
  'appointments',
  'doctor_notes',
  'documents'
];

for (const table of requiredTables) {
  test(`Table ${table} existe`, async () => {
    try {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        if (error.code === '42P01') {
          return { passed: false, message: `Table ${table} n'existe pas` };
        }
        // Autres erreurs peuvent être normales (RLS, etc.)
        return { passed: true, message: `Table ${table} accessible (erreur RLS possible: ${error.code})` };
      }
      return { passed: true, message: `Table ${table} accessible` };
    } catch (error) {
      return { passed: false, message: `Erreur: ${error.message}` };
    }
  });
}

// Test 4: Storage Buckets
console.log('\n📋 Test 4: Storage Supabase');
const requiredBuckets = ['patient-documents', 'patient-images', 'patient-audio'];

for (const bucket of requiredBuckets) {
  test(`Bucket ${bucket} existe`, async () => {
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      if (error) {
        if (error.message.includes('not found') || error.statusCode === 404) {
          return { passed: false, message: `Bucket ${bucket} n'existe pas. Créez-le dans Supabase Dashboard > Storage` };
        }
        return { passed: true, message: `Bucket ${bucket} accessible (erreur: ${error.message})` };
      }
      return { passed: true, message: `Bucket ${bucket} accessible` };
    } catch (error) {
      return { passed: false, message: `Erreur: ${error.message}` };
    }
  });
}

// Test 5: Fonctions utilitaires
console.log('\n📋 Test 5: Fonctions Utilitaires');
test('Fichier medicalContext.ts existe', () => {
  const path = join(__dirname, '..', 'src', 'utils', 'medicalContext.ts');
  if (existsSync(path)) {
    return { passed: true, message: 'medicalContext.ts trouvé' };
  }
  return { passed: false, message: 'medicalContext.ts non trouvé' };
});

test('Fichier aiReportService.ts existe', () => {
  const path = join(__dirname, '..', 'src', 'services', 'aiReportService.ts');
  if (existsSync(path)) {
    return { passed: true, message: 'aiReportService.ts trouvé' };
  }
  return { passed: false, message: 'aiReportService.ts non trouvé' };
});

test('Fichier openaiService.ts existe', () => {
  const path = join(__dirname, '..', 'src', 'lib', 'openaiService.ts');
  if (existsSync(path)) {
    return { passed: true, message: 'openaiService.ts trouvé' };
  }
  return { passed: false, message: 'openaiService.ts non trouvé' };
});

// Test 6: Test de la fonction buildUnifiedMedicalContext (si possible)
console.log('\n📋 Test 6: Fonctionnalités Core');
test('Structure du contexte médical unifié', async () => {
  try {
    // Importer dynamiquement le module
    const { buildUnifiedMedicalContext } = await import('../src/utils/medicalContext.ts');
    
    const testData = {
      textInput: 'Test symptôme',
      selectedChips: ['5 jours', 'Toux sèche'],
      imageUrls: ['https://example.com/image.jpg'],
      documentUrls: ['https://example.com/doc.pdf'],
      voiceTranscripts: 'Transcription test',
      chatMessages: [],
      patientProfile: { age: 30, gender: 'male' }
    };
    
    const context = buildUnifiedMedicalContext(testData);
    
    if (!context.combined_text_block) {
      return { passed: false, message: 'combined_text_block manquant' };
    }
    if (!context.text_symptoms) {
      return { passed: false, message: 'text_symptoms manquant' };
    }
    if (context.combined_text_block.includes('Test symptôme')) {
      return { passed: true, message: 'Contexte unifié généré correctement' };
    }
    return { passed: false, message: 'Le contexte ne contient pas les données attendues' };
  } catch (error) {
    return { passed: false, message: `Erreur: ${error.message}` };
  }
});

test('Contexte multimodal complet (texte + voix + images + documents + chat + profil)', async () => {
  try {
    const { buildUnifiedMedicalContext } = await import('../src/utils/medicalContext.ts');

    const testData = {
      textInput: 'Douleur thoracique depuis 3 jours',
      voiceTranscripts: ['Essoufflement à l’effort', 'Toux nocturne'],
      selectedChips: ['3 jours', 'Fièvre légère', 'Toux sèche'],
      imageUrls: ['https://example.com/img1.png', 'https://example.com/img2.jpg'],
      documentUrls: ['https://example.com/doc1.pdf', 'https://example.com/doc2.docx'],
      documentContents: ['Doc1 contenu extrait', 'Doc2 contenu extrait'],
      chatMessages: [
        { role: 'user', content: 'Je ressens une pression' },
        { role: 'assistant', content: 'Depuis quand ?' },
        { role: 'user', content: 'Trois jours' },
      ],
      patientProfile: { age: 45, gender: 'female', allergies: ['pollen'], medicalHistory: 'hypertension' },
    };

    const context = buildUnifiedMedicalContext(testData);

    const combined = context.combined_text_block;
    const checks = [
      combined.includes('Douleur thoracique'),
      combined.includes('Essoufflement'),
      combined.includes('Fièvre légère'),
      combined.includes('image(s) fournie(s)'),
      combined.includes('Documents médicaux'),
      combined.includes('Doc1 contenu extrait'),
      combined.includes('hypertension'),
    ];

    if (checks.every(Boolean)) {
      return { passed: true, message: 'Toutes les modalités sont présentes dans le contexte unifié' };
    }
    return { passed: false, message: 'Certaines modalités manquent dans le contexte combiné' };
  } catch (error) {
    return { passed: false, message: `Erreur: ${error.message}` };
  }
});

test('Intégration mockée génération de rapport (sans réseau)', async () => {
  const originalFetch = global.fetch;
  try {
    const { generateAIReport } = await import('../src/lib/openaiService.ts');

    let capturedPayload = null;
    process.env.VITE_OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || 'sk-test-mock';

    global.fetch = async (_url, options) => {
      capturedPayload = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: 'Résumé ok',
                  explainability_data: {},
                  diagnostic_hypotheses: [],
                  overall_severity: 'low',
                  overall_confidence: 50,
                  primary_diagnosis: 'test',
                  primary_diagnosis_confidence: 50,
                  recommendation_action: '',
                  recommendation_text: '',
                }),
              },
            },
          ],
        }),
      };
    };

    const preAnalysisData = {
      unifiedContext: {
        combined_text_block: 'CTX',
        document_contents: ['DOC CONTENU'],
        image_urls: [],
      },
      textInput: 'Symptômes textuels',
      voiceTranscript: 'Transcription vocale',
      selectedChips: ['fièvre', '3 jours'],
      imageUrls: [],
      documentUrls: ['doc1.pdf'],
      documentContents: ['DOC CONTENU'],
      chatAnswers: 'Réponses patient',
      chatMessages: [
        { role: 'user', content: 'Bonjour' },
        { role: 'assistant', content: 'Comment ça va ?' },
      ],
      patientProfile: { age: 40, gender: 'male', allergies: ['pollen'] },
    };

    const result = await generateAIReport(preAnalysisData, preAnalysisData.chatMessages, preAnalysisData.imageUrls);

    const payloadString = JSON.stringify(capturedPayload || {});
    const hasDoc = payloadString.includes('DOC CONTENU');
    const hasVoice = payloadString.includes('Transcription vocale');
    const hasText = payloadString.includes('Symptômes textuels');
    const hasChip = payloadString.includes('fièvre');

    if (result.primary_diagnosis === 'test' && hasDoc && hasVoice && hasText && hasChip) {
      return { passed: true, message: 'Prompt généré en local avec toutes les modalités texte/voix/docs/chips' };
    }
    return { passed: false, message: 'Le prompt mocké ne contient pas toutes les modalités attendues' };
  } catch (error) {
    return { passed: false, message: `Erreur: ${error.message}` };
  } finally {
    global.fetch = originalFetch;
  }
});

// Test 7: Test OpenAI (si configuré)
if (openaiApiKey) {
  console.log('\n📋 Test 7: Intégration OpenAI');
  test('OpenAI API accessible', async () => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        }
      });
      
      if (response.status === 401) {
        return { passed: false, message: 'OpenAI API key invalide' };
      }
      if (response.status === 429) {
        return { passed: true, message: 'OpenAI API accessible (rate limit atteint, mais API fonctionne)' };
      }
      if (response.ok) {
        return { passed: true, message: 'OpenAI API accessible et fonctionnelle' };
      }
      return { passed: false, message: `OpenAI API erreur: ${response.status}` };
    } catch (error) {
      return { passed: false, message: `Erreur de connexion: ${error.message}` };
    }
  });
} else {
  console.log('\n📋 Test 7: Intégration OpenAI (ignoré - API key non configurée)');
}

// Test 8: Fichiers de configuration
console.log('\n📋 Test 8: Configuration Projet');
test('package.json existe', () => {
  const path = join(__dirname, '..', 'package.json');
  if (existsSync(path)) {
    const pkg = JSON.parse(readFileSync(path, 'utf-8'));
    if (pkg.dependencies['@supabase/supabase-js']) {
      return { passed: true, message: 'package.json valide avec dépendances Supabase' };
    }
    return { passed: false, message: 'Dépendance @supabase/supabase-js manquante' };
  }
  return { passed: false, message: 'package.json non trouvé' };
});

test('vite.config.ts existe', () => {
  const path = join(__dirname, '..', 'vite.config.ts');
  if (existsSync(path)) {
    return { passed: true, message: 'vite.config.ts trouvé' };
  }
  return { passed: false, message: 'vite.config.ts non trouvé' };
});

test('tsconfig.json existe', () => {
  const path = join(__dirname, '..', 'tsconfig.json');
  if (existsSync(path)) {
    return { passed: true, message: 'tsconfig.json trouvé' };
  }
  return { passed: false, message: 'tsconfig.json non trouvé' };
});

// Résumé
console.log('\n' + '='.repeat(60));
console.log('\n📊 Résumé des Tests\n');

console.log(`✅ Tests réussis: ${testResults.passed}`);
console.log(`❌ Tests échoués: ${testResults.failed}`);
console.log(`⚠️  Avertissements: ${testResults.warnings}`);

const totalTests = testResults.passed + testResults.failed;
const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;

console.log(`\n📈 Taux de réussite: ${successRate}%`);

if (testResults.failed > 0) {
  console.log('\n❌ Tests échoués:');
  testResults.tests
    .filter(t => t.status.includes('FAILED') || t.status.includes('ERROR'))
    .forEach(t => {
      console.log(`   - ${t.name}: ${t.message}`);
    });
}

if (testResults.warnings > 0) {
  console.log('\n⚠️  Avertissements:');
  testResults.tests
    .filter(t => t.status.includes('WARNING'))
    .forEach(t => {
      console.log(`   - ${t.name}: ${t.message}`);
    });
}

console.log('\n' + '='.repeat(60));

// Code de sortie
process.exit(testResults.failed > 0 ? 1 : 0);

