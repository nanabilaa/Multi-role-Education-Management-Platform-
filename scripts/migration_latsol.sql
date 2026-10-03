-- Migration LatSol (Latihan Soal)
CREATE TABLE IF NOT EXISTS latihan_soals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  mapel TEXT NOT NULL,
  kelas TEXT NOT NULL,
  materi TEXT,
  deskripsi TEXT,
  deadline DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','dipublikasikan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS soals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latihan_id UUID REFERENCES latihan_soals(id) ON DELETE CASCADE,
  tipe_soal TEXT NOT NULL CHECK (tipe_soal IN ('pilihan_ganda','essay')),
  pertanyaan TEXT NOT NULL,
  opsi_a TEXT,
  opsi_b TEXT,
  opsi_c TEXT,
  opsi_d TEXT,
  jawaban_benar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pengerjaans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
  latihan_id UUID REFERENCES latihan_soals(id) ON DELETE CASCADE,
  nilai INTEGER,
  status TEXT DEFAULT 'menunggu' CHECK (status IN ('menunggu','selesai','menunggu_koreksi')),
  tanggal_selesai TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(siswa_id, latihan_id)
);

CREATE TABLE IF NOT EXISTS jawaban_siswas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengerjaan_id UUID REFERENCES pengerjaans(id) ON DELETE CASCADE,
  soal_id UUID REFERENCES soals(id) ON DELETE CASCADE,
  jawaban TEXT,
  nilai INTEGER,
  catatan_tentor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
