-- Fix duplicate bucket name in existing jurnal_siswa records
-- Run this in Supabase SQL Editor

-- Update soal_tugas_path: remove duplicate 'soal-tugas-siswa/' prefix
UPDATE jurnal_siswa
SET soal_tugas_path = REPLACE(soal_tugas_path, 'soal-tugas-siswa/soal-tugas-siswa/', 'soal-tugas-siswa/')
WHERE soal_tugas_path LIKE 'soal-tugas-siswa/soal-tugas-siswa/%';

-- Update soal_tugas_url: remove duplicate 'soal-tugas-siswa/' segment in URL
-- URL format was: https://.../public/soal-tugas-siswa/soal-tugas-siswa/tentorId/...
-- Should be:     https://.../public/soal-tugas-siswa/tentorId/...
UPDATE jurnal_siswa
SET soal_tugas_url = REPLACE(soal_tugas_url, '/public/soal-tugas-siswa/soal-tugas-siswa/', '/public/soal-tugas-siswa/')
WHERE soal_tugas_url LIKE '%/public/soal-tugas-siswa/soal-tugas-siswa/%';

-- Verify the fix
SELECT id, sesi_siswa_id, soal_tugas_path, soal_tugas_url
FROM jurnal_siswa
ORDER BY created_at DESC
LIMIT 10;
