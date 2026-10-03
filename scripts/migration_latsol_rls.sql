-- RLS Policies untuk LatSol
ALTER TABLE latihan_soals ENABLE ROW LEVEL SECURITY;
ALTER TABLE soals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengerjaans ENABLE ROW LEVEL SECURITY;
ALTER TABLE jawaban_siswas ENABLE ROW LEVEL SECURITY;

-- Tentor bisa insert/update/delete latihan miliknya
CREATE POLICY latihan_tentor_insert ON latihan_soals FOR INSERT WITH CHECK (tentor_id = auth.uid());
CREATE POLICY latihan_tentor_update ON latihan_soals FOR UPDATE USING (tentor_id = auth.uid());
CREATE POLICY latihan_tentor_delete ON latihan_soals FOR DELETE USING (tentor_id = auth.uid());
CREATE POLICY latihan_tentor_select ON latihan_soals FOR SELECT USING (tentor_id = auth.uid() OR status = 'dipublikasikan');

-- Soal: tentor bisa kelola soal latihan miliknya
CREATE POLICY soal_tentor_insert ON soals FOR INSERT WITH CHECK (latihan_id IN (SELECT id FROM latihan_soals WHERE tentor_id = auth.uid()));
CREATE POLICY soal_tentor_select ON soals FOR SELECT USING (latihan_id IN (SELECT id FROM latihan_soals WHERE tentor_id = auth.uid() OR status = 'dipublikasikan'));

-- Pengerjaan: siswa bisa insert miliknya, orang tua bisa lihat via siswa
CREATE POLICY pengerjaan_siswa_insert ON pengerjaans FOR INSERT WITH CHECK (siswa_id IN (SELECT id FROM siswa WHERE ortu_id = auth.uid() OR id = auth.uid()));
CREATE POLICY pengerjaan_siswa_select ON pengerjaans FOR SELECT USING (siswa_id IN (SELECT id FROM siswa WHERE ortu_id = auth.uid() OR id = auth.uid()));

-- Jawaban siswa: siswa bisa insert, tentor bisa lihat
CREATE POLICY jawaban_siswa_insert ON jawaban_siswas FOR INSERT WITH CHECK (pengerjaan_id IN (SELECT id FROM pengerjaans WHERE siswa_id IN (SELECT id FROM siswa WHERE ortu_id = auth.uid() OR id = auth.uid())));
CREATE POLICY jawaban_tentor_select ON jawaban_siswas FOR SELECT USING (pengerjaan_id IN (SELECT id FROM pengerjaans WHERE latihan_id IN (SELECT id FROM latihan_soals WHERE tentor_id = auth.uid())));

CREATE POLICY pengerjaan_tentor_select ON pengerjaans FOR SELECT USING (latihan_id IN (SELECT id FROM latihan_soals WHERE tentor_id = auth.uid()));
