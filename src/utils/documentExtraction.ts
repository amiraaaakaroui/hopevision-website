
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Prefer bundled worker (no CORS) then CDN fallbacks
const PDFJS_VERSION = pdfjsLib.version || '5.4.449';
const workerSources = [
  pdfWorkerSrc,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`,
];

function configurePdfWorker() {
  for (const workerSrc of workerSources) {
    if (!workerSrc) continue;
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      console.log(`[Document Extraction] ✅ PDF.js worker configured: ${workerSrc}`);
      console.log(`[Document Extraction] Using pdfjs-dist version: ${PDFJS_VERSION}`);
      return true;
    } catch (error) {
      console.warn(`[Document Extraction] ⚠️ Failed to configure worker from ${workerSrc}:`, error);
    }
  }
  console.error('[Document Extraction] ❌ All worker sources failed. PDF extraction may not work.');
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[0];
  return false;
}

configurePdfWorker();

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutHandle: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle);
  }
};

/**
 * Download document from Supabase Storage (handles private URLs)
 */
async function downloadDocumentFromStorage(url: string): Promise<Blob> {
    try {
        // Check if it's a Supabase Storage URL
        if (url.includes('supabase.co/storage/v1/object')) {
            const { supabase } = await import('../lib/supabaseClient');
            
            // Extract bucket and path from URL
            // Format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.pdf
            const urlMatch = url.match(/\/storage\/v1\/object\/(public|authenticated)\/([^\/]+)\/(.+)/);
            if (!urlMatch) {
                // Try alternate format handling if needed, or fallback to fetch
                 console.log(`[Document Extraction] ⚠️ URL Supabase non standard, tentative de fetch direct: ${url}`);
                 // Fallthrough to fetch
            } else {
                const [, , bucketName, filePath] = urlMatch;
                // Decode the file path to handle spaces and special chars
                const decodedFilePath = decodeURIComponent(filePath);
                
                console.log(`[Document Extraction] 📥 Téléchargement depuis Supabase Storage: bucket=${bucketName}, path=${decodedFilePath}`);
                
                const { data, error } = await supabase.storage
                    .from(bucketName)
                    .download(decodedFilePath);
                
                if (error) {
                    console.warn(`[Document Extraction] ⚠️ Erreur Supabase Storage (${error.message}), tentative fetch direct...`);
                    // Fallthrough to fetch
                } else if (data) {
                    console.log(`[Document Extraction] ✅ Document téléchargé via Storage SDK: ${data.size} bytes, type: ${data.type}`);
                    return data;
                }
            }
        }

        // Public URL or fallback - use fetch
        console.log(`[Document Extraction] 📥 Téléchargement depuis URL publique: ${url.substring(0, 80)}...`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const blob = await response.blob();
        console.log(`[Document Extraction] ✅ Document téléchargé via fetch: ${blob.size} bytes, type: ${blob.type}`);
        return blob;
        
    } catch (error: any) {
        console.error(`[Document Extraction] ❌ Erreur lors du téléchargement:`, error);
        throw error;
    }
}

async function extractTextFromPdf(blob: Blob): Promise<string> {
    try {
        const arrayBuffer = await withTimeout(blob.arrayBuffer(), 20000, 'arrayBuffer conversion');
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await withTimeout(loadingTask.promise, 20000, 'pdf loading');

        let fullText = '';
        // Iterate over all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await withTimeout(pdf.getPage(i), 10000, `page ${i} load`);
            const textContent = await withTimeout(page.getTextContent(), 10000, `page ${i} textContent`);
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += `[Page ${i}] ${pageText}\n`;
        }
        return fullText.trim();
    } catch (error: any) {
        console.error('[Document Extraction] ❌ Erreur PDF.js:', error);
        throw new Error(`Échec extraction PDF: ${error.message}`);
    }
}

async function extractTextFromDocx(blob: Blob): Promise<string> {
    try {
        const arrayBuffer = await withTimeout(blob.arrayBuffer(), 20000, 'docx arrayBuffer');
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value.trim(); // The raw text
    } catch (error: any) {
        console.error('[Document Extraction] ❌ Erreur Mammoth (DOCX):', error);
        throw new Error(`Échec extraction DOCX: ${error.message}`);
    }
}

/**
 * Extract text from a single document URL
 */
async function extractTextFromUrl(url: string): Promise<string> {
    try {
        const lowerUrl = url.toLowerCase();
        const isPdf = lowerUrl.includes('.pdf') || lowerUrl.endsWith('.pdf');
        const isDocx = lowerUrl.includes('.docx') || lowerUrl.endsWith('.docx') || lowerUrl.includes('.doc');

        if (!isPdf && !isDocx) {
            return `[Format non supporté pour extraction texte: ${url.split('/').pop()}] (Image ou autre)`;
        }

        // Download document
        let documentBlob: Blob;
        try {
            documentBlob = await withTimeout(downloadDocumentFromStorage(url), 20000, 'document download');
        } catch (downloadError: any) {
            console.error(`[Document Extraction] ❌ Échec du téléchargement:`, downloadError);
            return `[Erreur de téléchargement pour ${url.split('/').pop()}: ${downloadError.message}]`;
        }

        // Process based on type
        let extractedText = '';
        if (isPdf) {
            extractedText = await extractTextFromPdf(documentBlob);
        } else if (isDocx) {
            extractedText = await extractTextFromDocx(documentBlob);
        }

        if (!extractedText) {
             return `[Aucun texte extrait du fichier ${url.split('/').pop()}]`;
        }

        console.log(`[Document Extraction] ✅ Extraction réussie (${isPdf ? 'PDF' : 'DOCX'}): ${extractedText.length} caractères`);
        return extractedText;

    } catch (error: any) {
        console.error(`Error extracting text from ${url}:`, error);
        return `[Erreur d'extraction pour ${url.split('/').pop()}: ${error.message}]`;
    }
}

/**
 * Extract text from multiple document URLs
 */
export async function extractTextFromDocuments(
    urls: string[],
    _cacheKey?: string // optional: patient_profile_id or pre_analysis_id for future caching
): Promise<string[]> {
    if (!urls || urls.length === 0) {
        console.log(`[Document Extraction] ⚠️ Aucun document à traiter`);
        return [];
    }

    console.log(`[Document Extraction] 🔍 Début traitement de ${urls.length} document(s)...`);
    
    const promises = urls.map(async (url, index) => {
        console.log(`[Document Extraction] 📄 Traitement document ${index + 1}/${urls.length}: ${url.split('/').pop()}`);
        const text = await extractTextFromUrl(url);
        
        // Add metadata to the text block
        const documentResult = `=== DOCUMENT ${index + 1} (${url.split('/').pop()}) ===\n${text}\n==================\n`;
        return documentResult;
    });

    const results = await Promise.all(promises);
    
    console.log(`[Document Extraction] ✅ Extraction complète: ${results.length} document(s) traités`);
    return results;
}
