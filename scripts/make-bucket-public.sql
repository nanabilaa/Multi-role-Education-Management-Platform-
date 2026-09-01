-- Make soal-tugas-siswa bucket PUBLIC
-- Run this in Supabase SQL Editor

UPDATE storage.buckets
SET public = true
WHERE id = 'soal-tugas-siswa';

-- Verify
SELECT id, name, public FROM storage.buckets WHERE id = 'soal-tugas-siswa';
