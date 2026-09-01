-- Storage policies for soal-tugas-siswa bucket
-- Run this in Supabase SQL Editor

-- ============================================
-- BUCKET: soal-tugas-siswa
-- ============================================

-- First, ensure bucket exists (run once in dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('soal-tugas-siswa', 'soal-tugas-siswa', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLICIES FOR storage.objects
-- ============================================

-- 1. Allow authenticated users to read (SELECT) files
-- This is needed for ortu to view uploaded images
CREATE POLICY "Allow authenticated users to read soal-tugas-siswa"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'soal-tugas-siswa'
);

-- 2. Allow tentor role to insert (upload) files
-- Assuming role = 'tentor' is set via profiles.role
CREATE POLICY "Allow tentor to upload soal-tugas-siswa"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'soal-tugas-siswa'
  AND (
    -- Check if user has tentor role via profiles table
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'tentor'
    )
  )
);

-- 3. Allow tentor to update (update) their own files
CREATE POLICY "Allow tentor to update soal-tugas-siswa"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'soal-tugas-siswa'
  AND (
    -- User owns the file (created_by matches)
    auth.uid() = owner
    OR owner IS NULL
  )
)
WITH CHECK (
  bucket_id = 'soal-tugas-siswa'
  AND (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'tentor'
    )
  )
);

-- 4. Allow tentor to delete their own files
CREATE POLICY "Allow tentor to delete soal-tugas-siswa"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'soal-tugas-siswa'
  AND (
    -- User owns the file
    auth.uid() = owner
    OR owner IS NULL
  )
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check existing policies:
-- SELECT * FROM storage.policies WHERE bucket_id = 'soal-tugas-siswa';

-- Check buckets:
-- SELECT * FROM storage.buckets WHERE id = 'soal-tugas-siswa';

-- ============================================
-- NOTE
-- ============================================
-- If the above policies don't work, try these alternatives:
--
-- Option A: If using service_role key (bypasses RLS):
-- The upload should work if using service_role client
--
-- Option B: Simplified policy (less secure):
-- CREATE POLICY "Allow public read access"
-- ON storage.objects FOR SELECT TO public USING (bucket_id = 'soal-tugas-siswa');
--
-- CREATE POLICY "Allow authenticated insert"
-- ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'soal-tugas-siswa');
