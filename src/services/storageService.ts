/**
 * Storage Service
 * Handles all file upload operations (images, documents, audio)
 * Separated from UI components for Clean Architecture
 */

import { supabase } from '../lib/supabaseClient';

export interface UploadFileParams {
  file: File;
  patientProfileId: string;
  bucket: 'patient-images' | 'patient-documents' | 'patient-audio';
  folder: 'images' | 'documents' | 'audio';
}

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
  // Validate file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `${file.name} est trop volumineux (max ${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Generate unique file name
 */
function generateFileName(patientProfileId: string, folder: string, originalFileName: string): string {
  const fileExt = originalFileName.split('.').pop() || 'file';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${patientProfileId}/${folder}/${timestamp}-${random}.${fileExt}`;
}

/**
 * Upload a single file to Supabase Storage
 */
export async function uploadFile({
  file,
  patientProfileId,
  bucket,
  folder,
}: UploadFileParams): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate file name
  const fileName = generateFileName(patientProfileId, folder, file.name);

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Erreur lors de l'upload: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erreur lors de l\'upload: aucune donnée retournée');
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw new Error('Erreur lors de la récupération de l\'URL publique');
  }

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  patientProfileId: string,
  bucket: 'patient-images' | 'patient-documents' | 'patient-audio',
  folder: 'images' | 'documents' | 'audio'
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const result = await uploadFile({ file, patientProfileId, bucket, folder });
      results.push(result);
    } catch (error: any) {
      errors.push(`${file.name}: ${error.message}`);
      console.error(`Error uploading ${file.name}:`, error);
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(`Échec de tous les uploads:\n${errors.join('\n')}`);
  }

  if (errors.length > 0) {
    console.warn('Certains fichiers n\'ont pas pu être uploadés:', errors);
  }

  return results;
}

/**
 * Upload image file
 */
export async function uploadImage(
  file: File,
  patientProfileId: string
): Promise<UploadResult> {
  // Validate image type
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} n'est pas une image valide`);
  }

  return uploadFile({
    file,
    patientProfileId,
    bucket: 'patient-images',
    folder: 'images',
  });
}

/**
 * Upload multiple image files
 */
export async function uploadImages(
  files: File[],
  patientProfileId: string
): Promise<UploadResult[]> {
  // Validate all files are images
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      throw new Error(`${file.name} n'est pas une image valide`);
    }
  }

  return uploadFiles(files, patientProfileId, 'patient-images', 'images');
}

/**
 * Upload document file
 */
export async function uploadDocument(
  file: File,
  patientProfileId: string
): Promise<UploadResult> {
  return uploadFile({
    file,
    patientProfileId,
    bucket: 'patient-documents',
    folder: 'documents',
  });
}

/**
 * Upload audio file
 */
export async function uploadAudio(
  file: File,
  patientProfileId: string
): Promise<UploadResult> {
  return uploadFile({
    file,
    patientProfileId,
    bucket: 'patient-audio',
    folder: 'audio',
  });
}

/**
 * Create document record in database
 */
export async function createDocumentRecord(params: {
  patientProfileId: string;
  preAnalysisId?: string | null;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
}): Promise<void> {
  const { error } = await supabase.from('documents').insert({
    patient_profile_id: params.patientProfileId,
    pre_analysis_id: params.preAnalysisId || null,
    file_name: params.fileName,
    file_url: params.fileUrl,
    file_type: params.fileType,
    file_size_bytes: params.fileSizeBytes,
    ai_extraction_status: 'pending',
  });

  if (error) {
    console.error('[StorageService] Error creating document record:', error);
    // Don't throw - document is uploaded, just metadata insert failed
  }
}

