// lib/storage.ts
// Supabase Storage helpers for student work photos

import { createClient } from '@supabase/supabase-js'

const BUCKET_NAME = 'soal-tugas-siswa'

/**
 * Get Supabase storage URL for student work bucket
 */
export function getStorageUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  return supabaseUrl
}

/**
 * Upload student work photo to Supabase Storage
 * Returns the public URL and storage path
 */
export async function uploadStudentWorkPhoto(
  file: Buffer | ArrayBuffer,
  fileName: string,
  contentType: string,
  tentorId: string,
  sesiId: string,
  siswaId: string
): Promise<{ publicUrl: string; path: string }> {
  const { createClient } = await import('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are not configured')
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  
  // Create path: tentor_id/sesi_id/siswa_id/filename
  const ext = fileName.split('.').pop() || 'jpg'
  const path = `${tentorId}/${sesiId}/${siswaId}/${Date.now()}.${ext}`
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType,
      upsert: true,
    })
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
  
  if (!data) {
    throw new Error('Upload failed: no data returned')
  }
  
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)
  
  return {
    publicUrl: urlData.publicUrl,
    path: data.path,
  }
}

/**
 * Delete student work photo from Supabase Storage
 */
export async function deleteStudentWorkPhoto(
  path: string
): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are not configured')
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])
  
  if (error) {
    console.error('Failed to delete photo:', error)
    // Don't throw - deletion failure shouldn't block the operation
  }
}

/**
 * Get public URL for a student work photo
 * Note: In a private bucket, this requires signed URLs or public URL generation
 */
export function getStudentWorkPublicUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  
  // For private buckets, we need to use the storage API to get a signed URL
  // or the public URL directly if RLS allows public access
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${path}`
}

/**
 * Validate that a file is an image and under the size limit
 */
export function validateStudentWorkFile(
  file: File | Blob,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File harus berupa gambar' }
  }
  
  // Check file size
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    return { valid: false, error: `Ukuran foto maksimal ${maxSizeMB}MB` }
  }
  
  return { valid: true }
}
