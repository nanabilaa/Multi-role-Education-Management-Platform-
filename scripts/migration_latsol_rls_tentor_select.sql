CREATE POLICY pengerjaan_tentor_select ON pengerjaans FOR SELECT USING (latihan_id IN (SELECT id FROM latihan_soals WHERE tentor_id = auth.uid()));
CREATE POLICY pengerjaan_siswa_update ON pengerjaans FOR UPDATE USING (siswa_id IN (SELECT id FROM siswa WHERE ortu_id = auth.uid() OR id = auth.uid()));
