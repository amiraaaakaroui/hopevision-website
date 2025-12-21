/**
 * Image Analysis Utility
 * Analyzes medical images using OpenAI Vision API and adds descriptions to context
 */

import { analyzeImage } from '../lib/openaiService';

/**
 * Analyze all images and return their descriptions
 */
export async function analyzeAllImages(imageUrls: string[]): Promise<string[]> {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }

  const analyses: string[] = [];
  
  // Analyze images in parallel for better performance
  const analysisPromises = imageUrls.map(async (url, index) => {
    try {
      console.log(`[Image Analysis] 🔍 Début analyse image ${index + 1}/${imageUrls.length}`);
      console.log(`[Image Analysis] 📷 URL: ${url.substring(0, 80)}...`);
      
      const analysis = await analyzeImage(url, 'Analyse cette image médicale et décris les éléments visuels pertinents pour le diagnostic.');
      
      // CRITICAL: Log the complete analysis result
      console.log(`[Image Analysis] ✅ Analyse complétée pour image ${index + 1}/${imageUrls.length}`);
      console.log(`[Image Analysis] 📊 Résultat de l'analyse (${analysis.length} caractères):`);
      console.log(`[Image Analysis] ========== ANALYSE IMAGE ${index + 1} ==========`);
      console.log(analysis);
      console.log(`[Image Analysis] ==========================================`);
      
      return `Image ${index + 1}:\n${analysis}`;
    } catch (error: any) {
      console.error(`[Image Analysis] ❌ Erreur lors de l'analyse de l'image ${index + 1}:`, error);
      console.error(`[Image Analysis] Détails de l'erreur:`, {
        message: error.message,
        stack: error.stack,
        url: url.substring(0, 80)
      });
      return `Image ${index + 1}: Erreur lors de l'analyse - ${error.message}`;
    }
  });

  const results = await Promise.all(analysisPromises);
  analyses.push(...results.filter(Boolean));

  console.log(`[Image Analysis] ✅ Analyse complète terminée: ${analyses.length} images analysées`);
  console.log(`[Image Analysis] 📋 Résumé des analyses:`);
  analyses.forEach((analysis, idx) => {
    console.log(`[Image Analysis]   - Image ${idx + 1}: ${analysis.length} caractères`);
  });
  
  return analyses;
}

/**
 * Format image analyses for inclusion in medical context
 */
export function formatImageAnalyses(analyses: string[]): string {
  if (analyses.length === 0) {
    return '';
  }

  let formatted = '\n#### Analyse détaillée des images :\n';
  analyses.forEach((analysis, index) => {
    formatted += `\n---\n${analysis}\n`;
  });
  
  return formatted;
}

