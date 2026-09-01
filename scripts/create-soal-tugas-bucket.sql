-- Create soal-tugas-siswa bucket if it doesn't exist
-- Run this in Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public)
VALUES ('soal-tugas-siswa', 'soal-tugas-siswa', true)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'soal-tugas-siswa';
