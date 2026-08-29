-- Migration: Create jurnal_siswa table for student work tracking
-- This table stores soal/tugas photos per student per journal session

-- =====================================================
-- LANGKAH 2: Create jurnal_siswa table
-- =====================================================
CREATE TABLE IF NOT EXISTS jurnal_siswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_siswa_id UUID NOT NULL REFERENCES sesi_siswa(id) ON DELETE CASCADE,
  jurnal_id UUID NOT NULL REFERENCES jurnal(id) ON DELETE CASCADE,
  soal_tugas_url TEXT,
  soal_tugas_path TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sesi_siswa_id, jurnal_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_jurnal_siswa_sesi_siswa ON jurnal_siswa(sesi_siswa_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_siswa_jurnal ON jurnal_siswa(jurnal_id);

-- =====================================================
-- LANGKAH 6: Add RLS policies for jurnal_siswa
-- =====================================================

-- Enable RLS
ALTER TABLE jurnal_siswa ENABLE ROW LEVEL SECURITY;

-- Policy: Tutor (tentor) can insert/update/delete their own journal student work
CREATE POLICY "Tentor can manage jurnal_siswa" ON jurnal_siswa
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sesi s
      JOIN jurnal j ON j.sesi_id = s.id
      WHERE j.id = jurnal_siswa.jurnal_id
      AND s.tentor_id = auth.uid()
    )
  );

-- Policy: Parents can only view their children's journal student work
CREATE POLICY "Ortu can view jurnal_siswa" ON jurnal_siswa
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM siswa
      WHERE siswa.id = (
        SELECT ss.siswa_id FROM sesi_siswa ss WHERE ss.id = jurnal_siswa.sesi_siswa_id
      )
      AND siswa.ortu_id = auth.uid()
    )
  );

-- =====================================================
-- Helper function to get ortu_id for a siswa
-- =====================================================
CREATE OR REPLACE FUNCTION get_siswa_ortu_id(siswa_uuid UUID)
RETURNS UUID AS $$
  SELECT ortu_id FROM siswa WHERE id = siswa_uuid;
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- Add updated_at trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jurnal_siswa_updated_at
  BEFORE UPDATE ON jurnal_siswa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE jurnal_siswa IS 'Stores student work (soal/tugas) photos per journal session';
COMMENT ON COLUMN jurnal_siswa.soal_tugas_url IS 'Public URL of the student work photo';
COMMENT ON COLUMN jurnal_siswa.soal_tugas_path IS 'Storage path of the student work photo';
COMMENT ON COLUMN jurnal_siswa.catatan IS 'Notes about the student work';
