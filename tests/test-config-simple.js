/**
 * Test de Configuration Simple - HopeVisionAI
 * Version CommonJS pour compatibilité
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Vérification de la Configuration HopeVisionAI\n');
console.log('='.repeat(60));

let errors = [];
let warnings = [];

// Test 1: Fichier .env
console.log('\n📋 1. Variables d\'Environnement');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ Fichier .env trouvé');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const optionalVars = [
    'VITE_OPENAI_API_KEY',
    'VITE_OPENAI_MODEL'
  ];
  
  for (const varName of requiredVars) {
    if (envContent.includes(varName + '=')) {
      const value = envContent.split(varName + '=')[1]?.split('\n')[0]?.trim();
      if (value && value.length > 0) {
        console.log(`✅ ${varName} configurée`);
      } else {
        errors.push(`${varName} est vide`);
        console.log(`❌ ${varName} est vide`);
      }
    } else {
      errors.push(`${varName} manquante`);
      console.log(`❌ ${varName} manquante`);
    }
  }
  
  for (const varName of optionalVars) {
    if (envContent.includes(varName + '=')) {
      const value = envContent.split(varName + '=')[1]?.split('\n')[0]?.trim();
      if (value && value.length > 0) {
        console.log(`✅ ${varName} configurée`);
      } else {
        warnings.push(`${varName} est vide (optionnel)`);
        console.log(`⚠️  ${varName} est vide (optionnel)`);
      }
    } else {
      warnings.push(`${varName} non configurée (optionnel)`);
      console.log(`⚠️  ${varName} non configurée (optionnel)`);
    }
  }
} else {
  errors.push('Fichier .env non trouvé');
  console.log('❌ Fichier .env non trouvé');
  console.log('   Créez un fichier .env à la racine du projet avec:');
  console.log('   VITE_SUPABASE_URL=...');
  console.log('   VITE_SUPABASE_ANON_KEY=...');
  console.log('   VITE_OPENAI_API_KEY=... (optionnel)');
}

// Test 2: Fichiers essentiels
console.log('\n📋 2. Fichiers Essentiels');
const essentialFiles = [
  { path: 'package.json', name: 'package.json' },
  { path: 'vite.config.ts', name: 'vite.config.ts' },
  { path: 'tsconfig.json', name: 'tsconfig.json' },
  { path: 'src/App.tsx', name: 'App.tsx' },
  { path: 'src/lib/supabaseClient.ts', name: 'supabaseClient.ts' },
  { path: 'src/lib/openaiService.ts', name: 'openaiService.ts' },
  { path: 'src/services/aiReportService.ts', name: 'aiReportService.ts' },
  { path: 'src/utils/medicalContext.ts', name: 'medicalContext.ts' }
];

for (const file of essentialFiles) {
  const fullPath = path.join(__dirname, '..', file.path);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file.name} trouvé`);
  } else {
    errors.push(`${file.name} manquant`);
    console.log(`❌ ${file.name} manquant`);
  }
}

// Test 3: Dépendances package.json
console.log('\n📋 3. Dépendances NPM');
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  const requiredDeps = [
    '@supabase/supabase-js',
    'react',
    'react-dom',
    'vite'
  ];
  
  for (const dep of requiredDeps) {
    if (deps[dep]) {
      console.log(`✅ ${dep} installé (${deps[dep]})`);
    } else {
      errors.push(`Dépendance ${dep} manquante`);
      console.log(`❌ ${dep} manquante`);
    }
  }
}

// Test 4: Structure des dossiers
console.log('\n📋 4. Structure des Dossiers');
const essentialDirs = [
  'src',
  'src/components',
  'src/lib',
  'src/services',
  'src/utils',
  'src/types',
  'src/hooks'
];

for (const dir of essentialDirs) {
  const fullPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${dir}/ existe`);
  } else {
    warnings.push(`Dossier ${dir}/ manquant`);
    console.log(`⚠️  ${dir}/ manquant`);
  }
}

// Résumé
console.log('\n' + '='.repeat(60));
console.log('\n📊 Résumé\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Tous les tests de configuration sont passés !');
  console.log('\n🚀 Vous pouvez maintenant lancer:');
  console.log('   npm run dev');
  console.log('\n📝 Pour les tests manuels, suivez:');
  console.log('   tests/manual-test-checklist.md');
} else {
  if (errors.length > 0) {
    console.log(`❌ ${errors.length} erreur(s) trouvée(s):`);
    errors.forEach(err => console.log(`   - ${err}`));
  }
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} avertissement(s):`);
    warnings.forEach(warn => console.log(`   - ${warn}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Veuillez corriger les erreurs avant de continuer.');
    process.exit(1);
  } else {
    console.log('\n⚠️  Des avertissements ont été détectés, mais vous pouvez continuer.');
  }
}

console.log('\n' + '='.repeat(60));

