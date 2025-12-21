/**
 * Image Download Utility
 * Downloads images from Supabase Storage (handles both public and private URLs)
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Extract bucket and path from Supabase Storage URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/patient-images/path/to/image.jpg
 * Returns: { bucket: 'patient-images', path: 'path/to/image.jpg' }
 */
function parseSupabaseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Find 'object' in path and extract bucket and file path
    const objectIndex = pathParts.indexOf('object');
    if (objectIndex === -1) return null;
    
    const publicOrSignIndex = objectIndex + 1;
    if (publicOrSignIndex >= pathParts.length) return null;
    
    const bucketIndex = publicOrSignIndex + 1;
    if (bucketIndex >= pathParts.length) return null;
    
    const bucket = pathParts[bucketIndex];
    const path = pathParts.slice(bucketIndex + 1).join('/');
    
    return { bucket, path };
  } catch (error) {
    console.error('[ImageDownload] Error parsing URL:', error);
    return null;
  }
}

/**
 * Download image from Supabase Storage
 * Handles both public and private URLs
 */
export async function downloadImageFromStorage(imageUrl: string): Promise<Blob> {
  console.log(`[ImageDownload] Downloading image from: ${imageUrl.substring(0, 80)}...`);
  
  // Check if it's a Supabase Storage URL
  const storageInfo = parseSupabaseStorageUrl(imageUrl);
  
  if (storageInfo) {
    // Use Supabase Storage API for private/public buckets
    console.log(`[ImageDownload] Using Supabase Storage API: bucket=${storageInfo.bucket}, path=${storageInfo.path}`);
    
    const { data, error } = await supabase.storage
      .from(storageInfo.bucket)
      .download(storageInfo.path);
    
    if (error) {
      console.error(`[ImageDownload] Supabase Storage download failed:`, error);
      // Fallback to fetch if Storage API fails
      console.log(`[ImageDownload] Falling back to fetch()...`);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      return await response.blob();
    }
    
    if (!data) {
      throw new Error('No data returned from Supabase Storage');
    }
    
    console.log(`[ImageDownload] ✅ Image downloaded successfully from Supabase Storage`);
    return data;
  } else {
    // Not a Supabase Storage URL, use regular fetch
    console.log(`[ImageDownload] Using regular fetch() for non-Supabase URL`);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText} (${response.status})`);
    }
    
    const blob = await response.blob();
    console.log(`[ImageDownload] ✅ Image downloaded successfully via fetch()`);
    return blob;
  }
}

