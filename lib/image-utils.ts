// lib/image-utils.ts
// Image compression utility for student work photos

export interface CompressedImage {
  blob: Blob
  width: number
  height: number
  originalSize: number
  compressedSize: number
}

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  maxSizeMB: 1,
}

/**
 * Compress an image file to reduce its size while maintaining quality
 * Uses canvas-based compression in browser environment
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > opts.maxWidth) {
        height = (height * opts.maxWidth) / width
        width = opts.maxWidth
      }
      
      if (height > opts.maxHeight) {
        width = (width * opts.maxHeight) / height
        height = opts.maxHeight
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      // Try to compress as JPEG first
      let quality = opts.quality
      let blob: Blob | null = null
      let attempts = 0
      const maxAttempts = 5
      
      const tryCompress = () => {
        canvas.toBlob(
          (b) => {
            if (!b) {
              reject(new Error('Failed to compress image'))
              return
            }
            
            const sizeMB = b.size / (1024 * 1024)
            
            if (sizeMB > opts.maxSizeMB && quality > 0.3 && attempts < maxAttempts) {
              // Reduce quality and try again
              quality -= 0.15
              attempts++
              tryCompress()
            } else {
              blob = b
              resolve({
                blob,
                width,
                height,
                originalSize: file.size,
                compressedSize: blob.size,
              })
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      tryCompress()
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    // Load the image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Validate image file before upload
 */
export interface ImageValidationResult {
  valid: boolean
  error?: string
  file?: File
}

export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): ImageValidationResult {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File harus berupa gambar' }
  }
  
  // Check file size (default 5MB for validation photos, but压缩后应该更小)
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    return { 
      valid: false, 
      error: `Ukuran foto maksimal ${maxSizeMB}MB` 
    }
  }
  
  // Check for valid image extensions
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !validExtensions.includes(ext)) {
    return { 
      valid: false, 
      error: 'Format foto tidak valid. Gunakan JPG, PNG, GIF, atau WebP' 
    }
  }
  
  return { valid: true, file }
}

/**
 * Convert blob to base64 for preview
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert blob to base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Check if browser supports image compression
 */
export function supportsImageCompression(): boolean {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  return canvas.getContext('2d') !== null
}
