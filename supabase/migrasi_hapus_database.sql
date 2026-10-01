-- ==============================================================================
-- MIGRASI DATABASE: FITUR HAPUS DATABASE AMAN (ZONA BERBAHAYA)
-- RUANG GEOGRAFI
-- File: supabase/migrasi_hapus_database.sql
-- AMAN dijalankan di atas skema yang sudah ada (Idempoten: IF NOT EXISTS / CREATE OR REPLACE)
-- KETENTUAN UTAMA:
-- 1. Mengosongkan DATA (DELETE), BUKAN struktur (TIDAK ADA DROP TABLE / SCHEMA).
-- 2. Memeriksa is_guru() di setiap operasi.
-- 3. Token sekali pakai (one-time token) berumur pendek (2 menit).
-- 4. Menolak jika ada ujian aktif atau sesi game yang sedang berlangsung.
-- 5. Foreign Key Safe (penghapusan anak dulu, baru induk).
-- 6. Akun guru, pengaturan sekolah, aturan bintang default TIDAK PERNAH terhapus.
-- ==============================================================================

-- 1. TABEL: token_hapus (Token konfirmasi sekali pakai berumur pendek)
CREATE TABLE IF NOT EXISTS public.token_hapus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  kategori text[] NOT NULL,
  frasa_wajib text NOT NULL,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  kedaluwarsa_pada timestamptz NOT NULL,
  dipakai_pada timestamptz,
  sudah_dipakai boolean NOT NULL DEFAULT false
);

ALTER TABLE public.token_hapus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hanya guru yang dapat mengakses token_hapus" ON public.token_hapus;
CREATE POLICY "Hanya guru yang dapat mengakses token_hapus"
  ON public.token_hapus FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND peran = 'guru')
  );

-- 2. TABEL: log_penghapusan (Jejak audit permanen, tidak bisa dihapus oleh fitur ini)
CREATE TABLE IF NOT EXISTS public.log_penghapusan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id uuid NOT NULL,
  guru_nama text NOT NULL,
  waktu timestamptz NOT NULL DEFAULT now(),
  kategori text[] NOT NULL,
  rincian_dihapus jsonb NOT NULL,
  cadangan_diunduh boolean NOT NULL DEFAULT true,
  cadangan_dilewati boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'sukses',
  catatan text
);

ALTER TABLE public.log_penghapusan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hanya guru yang dapat membaca log_penghapusan" ON public.log_penghapusan;
CREATE POLICY "Hanya guru yang dapat membaca log_penghapusan"
  ON public.log_penghapusan FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND peran = 'guru')
  );

-- Klien TIDAK boleh update/delete log_penghapusan
DROP POLICY IF EXISTS "Tolak manipulasi klien pada log_penghapusan" ON public.log_penghapusan;
CREATE POLICY "Tolak manipulasi klien pada log_penghapusan"
  ON public.log_penghapusan FOR UPDATE
  TO authenticated
  USING (false);

-- 3. TABEL: status_cadangan (Mencatat bukti unduhan cadangan sebelum penghapusan)
CREATE TABLE IF NOT EXISTS public.status_cadangan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kategori text[] NOT NULL,
  nama_file text NOT NULL,
  baris_total integer NOT NULL DEFAULT 0,
  diunduh_pada timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.status_cadangan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hanya guru yang dapat mengakses status_cadangan" ON public.status_cadangan;
CREATE POLICY "Hanya guru yang dapat mengakses status_cadangan"
  ON public.status_cadangan FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND peran = 'guru')
  );

-- 4. FUNGSI RPC: catat_cadangan
CREATE OR REPLACE FUNCTION public.catat_cadangan(
  p_kategori text[],
  p_nama_file text,
  p_baris_total integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_guru boolean;
BEGIN
  SELECT (peran = 'guru') INTO v_is_guru FROM public.profiles WHERE id = v_uid;
  IF v_is_guru IS NOT TRUE THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya guru yang dapat mencatat unduhan cadangan.';
  END IF;

  INSERT INTO public.status_cadangan (guru_id, kategori, nama_file, baris_total, diunduh_pada)
  VALUES (v_uid, p_kategori, p_nama_file, p_baris_total, now());

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Cadangan berhasil dicatat sebagai prasyarat keamanan.',
    'diunduh_pada', now()
  );
END;
$$;

-- 5. FUNGSI RPC: pratinjau_hapus (DRY RUN & GENERATE TOKEN)
CREATE OR REPLACE FUNCTION public.pratinjau_hapus(
  p_kategori text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_guru boolean;
  v_ujian_aktif integer;
  v_sesi_aktif integer;
  v_rate_limit_count integer;
  v_counts jsonb := '{}'::jsonb;
  v_token text;
  v_frasa text;
  v_semua boolean := false;
  v_nama_sekolah text := 'SMA Negeri 1 Geografi';
BEGIN
  -- Cek wewenang guru
  SELECT (peran = 'guru') INTO v_is_guru FROM public.profiles WHERE id = v_uid;
  IF v_is_guru IS NOT TRUE THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya akun guru yang berwenang mengakses Zona Berbahaya.';
  END IF;

  -- PENGHALANG KONDISI BERJALAN 1: Cek apakah ada ujian CBT yang sedang aktif
  SELECT count(*) INTO v_ujian_aktif FROM public.ujian WHERE status = 'aktif';
  IF v_ujian_aktif > 0 THEN
    RAISE EXCEPTION 'Penghapusan ditolak: Ada % ujian CBT berstatus Aktif. Tutup atau arsipkan ujian terlebih dahulu.', v_ujian_aktif;
  END IF;

  -- PENGHALANG KONDISI BERJALAN 2: Cek sesi game yang sedang berlangsung
  SELECT count(*) INTO v_sesi_aktif FROM public.sesi_game WHERE status = 'berlangsung';
  IF v_sesi_aktif > 0 THEN
    RAISE EXCEPTION 'Penghapusan ditolak: Ada % sesi kompetisi game yang sedang berlangsung. Selesaikan sesi terlebih dahulu.', v_sesi_aktif;
  END IF;

  -- PEMBATASAN LAJU: Maksimal 3 kali penghapusan per jam per guru
  SELECT count(*) INTO v_rate_limit_count
  FROM public.log_penghapusan
  WHERE guru_id = v_uid AND waktu > now() - interval '1 hour' AND status = 'sukses';
  IF v_rate_limit_count >= 3 THEN
    RAISE EXCEPTION 'Batas laju tercapai: Maksimal 3 kali penghapusan database per jam. Silakan tunggu beberapa saat.';
  END IF;

  -- Hitung dampak per kategori terpilih
  -- Kategori 1: nilai
  IF 'nilai' = ANY(p_kategori) THEN
    v_counts := v_counts || jsonb_build_object(
      'jawaban', (SELECT count(*) FROM public.jawaban),
      'percobaan_ujian', (SELECT count(*) FROM public.percobaan_ujian)
    );
  END IF;

  -- Kategori 2: soal_ujian
  IF 'soal_ujian' = ANY(p_kategori) THEN
    v_counts := v_counts || jsonb_build_object(
      'ujian', (SELECT count(*) FROM public.ujian),
      'ujian_soal', (SELECT count(*) FROM public.ujian_soal),
      'soal', (SELECT count(*) FROM public.soal),
      'kunci_soal', (SELECT count(*) FROM public.kunci_soal)
    );
  END IF;

  -- Kategori 3: materi
  IF 'materi' = ANY(p_kategori) THEN
    v_counts := v_counts || jsonb_build_object(
      'materi', (SELECT count(*) FROM public.materi),
      'materi_dibaca', (SELECT count(*) FROM public.materi_dibaca)
    );
  END IF;

  -- Kategori 4: bintang
  IF 'bintang' = ANY(p_kategori) THEN
    v_counts := v_counts || jsonb_build_object(
      'riwayat_bintang', (SELECT count(*) FROM public.riwayat_bintang),
      'lencana_siswa', (SELECT count(*) FROM public.lencana_siswa)
    );
  END IF;

  -- Kategori 5: game
  IF 'game' = ANY(p_kategori) THEN
    v_counts := v_counts || jsonb_build_object(
      'skor_game', (SELECT count(*) FROM public.skor_game),
      'sesi_game', (SELECT count(*) FROM public.sesi_game),
      'peserta_sesi', (SELECT count(*) FROM public.peserta_sesi)
    );
  END IF;

  -- Kategori 6: siswa
  IF 'siswa' = ANY(p_kategori) THEN
    v_counts := v_counts || jsonb_build_object(
      'profiles_siswa', (SELECT count(*) FROM public.profiles WHERE peran = 'siswa')
    );
  END IF;

  -- Kategori 7: log
  IF 'log' = ANY(p_kategori) THEN
    v_counts := v_counts || jsonb_build_object(
      'log_aktivitas', (SELECT count(*) FROM public.log_aktivitas)
    );
  END IF;

  -- Tentukan frasa konfirmasi
  IF array_length(p_kategori, 1) >= 6 THEN
    v_semua := true;
    SELECT coalesce(nama_sekolah, 'SMA Negeri 1 Geografi') INTO v_nama_sekolah FROM public.pengaturan LIMIT 1;
    v_frasa := 'KOSONGKAN SEMUA DATA - ' || v_nama_sekolah;
  ELSE
    v_frasa := 'HAPUS DATA';
  END IF;

  -- Buat token konfirmasi sekali pakai (berlaku 2 menit)
  v_token := encode(gen_random_bytes(16), 'hex');

  INSERT INTO public.token_hapus (guru_id, token, kategori, frasa_wajib, kedaluwarsa_pada)
  VALUES (v_uid, v_token, p_kategori, v_frasa, now() + interval '2 minutes');

  RETURN jsonb_build_object(
    'success', true,
    'token', v_token,
    'frasa_wajib', v_frasa,
    'kedaluwarsa_detik', 120,
    'dampak', v_counts,
    'paket_semua', v_semua
  );
END;
$$;

-- 6. FUNGSI RPC: hapus_data (EKSEKUSI DALAM SATU TRANSAKSI ATOMIK)
CREATE OR REPLACE FUNCTION public.hapus_data(
  p_kategori text[],
  p_token text,
  p_frasa text,
  p_lewati_cadangan boolean DEFAULT false,
  p_seed_ulang boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_guru_nama text;
  v_is_guru boolean;
  v_token_rec record;
  v_ujian_aktif integer;
  v_sesi_aktif integer;
  v_has_cadangan boolean;
  v_laporan jsonb := '{}'::jsonb;
  v_total_deleted integer := 0;
  v_cnt integer;
BEGIN
  -- 1. Validasi wewenang guru
  SELECT nama, (peran = 'guru') INTO v_guru_nama, v_is_guru
  FROM public.profiles WHERE id = v_uid;

  IF v_is_guru IS NOT TRUE THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya akun guru yang berwenang mengeksekusi penghapusan database.';
  END IF;

  -- 2. Validasi Token Konfirmasi Sekali Pakai
  SELECT * INTO v_token_rec FROM public.token_hapus
  WHERE token = p_token AND guru_id = v_uid AND sudah_dipakai = false;

  IF v_token_rec.id IS NULL THEN
    RAISE EXCEPTION 'Token tidak valid atau sudah pernah digunakan.';
  END IF;

  IF v_token_rec.kedaluwarsa_pada < now() THEN
    RAISE EXCEPTION 'Token konfirmasi telah kedaluwarsa (lebih dari 2 menit). Silakan lakukan pratinjau ulang.';
  END IF;

  -- 3. Validasi Frasa Konfirmasi
  IF trim(upper(p_frasa)) <> trim(upper(v_token_rec.frasa_wajib)) THEN
    RAISE EXCEPTION 'Frasa konfirmasi tidak cocok. Anda harus mengetik persis: %', v_token_rec.frasa_wajib;
  END IF;

  -- 4. Validasi Cadangan Wajib
  IF p_lewati_cadangan IS NOT TRUE THEN
    SELECT EXISTS (
      SELECT 1 FROM public.status_cadangan
      WHERE guru_id = v_uid AND diunduh_pada > now() - interval '30 minutes'
    ) INTO v_has_cadangan;

    IF v_has_cadangan IS NOT TRUE THEN
      RAISE EXCEPTION 'Penghapusan dibatalkan: Anda belum mengunduh cadangan terbaru. Silakan unduh cadangan terlebih dahulu atau centang konfirmasi lewati cadangan dengan sadar.';
    END IF;
  END IF;

  -- 5. Validasi Ujian Aktif & Sesi Aktif
  SELECT count(*) INTO v_ujian_aktif FROM public.ujian WHERE status = 'aktif';
  IF v_ujian_aktif > 0 THEN
    RAISE EXCEPTION 'Penghapusan ditolak: Terdapat ujian CBT berstatus aktif.';
  END IF;

  SELECT count(*) INTO v_sesi_aktif FROM public.sesi_game WHERE status = 'berlangsung';
  IF v_sesi_aktif > 0 THEN
    RAISE EXCEPTION 'Penghapusan ditolak: Terdapat sesi game yang sedang berlangsung.';
  END IF;

  -- Tandai token dipakai
  UPDATE public.token_hapus
  SET sudah_dipakai = true, dipakai_pada = now()
  WHERE id = v_token_rec.id;

  -- ============================================================================
  -- EKSEKUSI PENGHAPUSAN BERURUTAN (FOREIGN KEY SAFE: ANAK DULU BARU INDUK)
  -- ============================================================================

  -- Kategori 1: NILAI (jawaban -> percobaan_ujian)
  IF 'nilai' = ANY(p_kategori) THEN
    DELETE FROM public.jawaban;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('jawaban_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;

    DELETE FROM public.percobaan_ujian;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('percobaan_ujian_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;
  END IF;

  -- Kategori 2: UJIAN & BANK SOAL (ujian_soal, kunci_soal -> ujian, soal)
  IF 'soal_ujian' = ANY(p_kategori) THEN
    DELETE FROM public.jawaban; -- jika belum dihapus
    DELETE FROM public.ujian_soal;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('relasi_ujian_soal_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;

    DELETE FROM public.kunci_soal;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('kunci_soal_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;

    DELETE FROM public.ujian;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('ujian_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;

    DELETE FROM public.soal;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('soal_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;
  END IF;

  -- Kategori 3: MATERI (materi_dibaca -> materi)
  IF 'materi' = ANY(p_kategori) THEN
    DELETE FROM public.materi_dibaca;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('riwayat_baca_materi_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;

    DELETE FROM public.materi;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('materi_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;
  END IF;

  -- Kategori 4: BINTANG & LENCANA (riwayat_bintang, lencana_siswa)
  IF 'bintang' = ANY(p_kategori) THEN
    DELETE FROM public.riwayat_bintang;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('riwayat_bintang_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;

    DELETE FROM public.lencana_siswa;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('lencana_siswa_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;
  END IF;

  -- Kategori 5: GAME (skor_game, peserta_sesi, sesi_game)
  -- Catatan: tabel `game` dipertahankan; jika ada game kustom yang dihapus diatur terpisah
  IF 'game' = ANY(p_kategori) THEN
    DELETE FROM public.skor_game;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('skor_game_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;

    DELETE FROM public.peserta_sesi;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('peserta_sesi_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;

    DELETE FROM public.sesi_game;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('sesi_game_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;
  END IF;

  -- Kategori 6: SISWA (profiles peran 'siswa')
  -- Catatan: Akun GURU TIDAK PERNAH DIHAPUS!
  IF 'siswa' = ANY(p_kategori) THEN
    -- Hapus relasi siswa jika belum
    DELETE FROM public.jawaban WHERE siswa_id IN (SELECT id FROM public.profiles WHERE peran = 'siswa');
    DELETE FROM public.percobaan_ujian WHERE siswa_id IN (SELECT id FROM public.profiles WHERE peran = 'siswa');
    DELETE FROM public.riwayat_bintang WHERE siswa_id IN (SELECT id FROM public.profiles WHERE peran = 'siswa');
    DELETE FROM public.lencana_siswa WHERE siswa_id IN (SELECT id FROM public.profiles WHERE peran = 'siswa');
    DELETE FROM public.skor_game WHERE siswa_id IN (SELECT id FROM public.profiles WHERE peran = 'siswa');
    DELETE FROM public.peserta_sesi WHERE siswa_id IN (SELECT id FROM public.profiles WHERE peran = 'siswa');
    DELETE FROM public.materi_dibaca WHERE siswa_id IN (SELECT id FROM public.profiles WHERE peran = 'siswa');

    DELETE FROM public.profiles WHERE peran = 'siswa';
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('profil_siswa_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;
  END IF;

  -- Kategori 7: LOG AKTIVITAS
  IF 'log' = ANY(p_kategori) THEN
    DELETE FROM public.log_aktivitas;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_laporan := v_laporan || jsonb_build_object('log_aktivitas_terhapus', v_cnt);
    v_total_deleted := v_total_deleted + v_cnt;
  END IF;

  -- PEMBERSIHAN / SEED ULANG IDEMPOTEN (Bila dicentang)
  IF p_seed_ulang THEN
    -- Pastikan aturan bintang default terisi bila kosong
    IF NOT EXISTS (SELECT 1 FROM public.aturan_bintang LIMIT 1) THEN
      INSERT INTO public.aturan_bintang (kode, nama, poin, aktif) VALUES
        ('BACA_MATERI', 'Membaca Materi Pelajaran Tuntas', 1, true),
        ('KUIS_SEMPURNA', 'Nilai 100 pada Kuis / Ujian Harian', 5, true),
        ('KUIS_TUNTAS', 'Menuntaskan Ujian di atas KKM', 2, true),
        ('JUARA_GAME_1', 'Juara 1 Sesi Game Edukasi', 5, true),
        ('JUARA_GAME_2', 'Juara 2 Sesi Game Edukasi', 3, true),
        ('JUARA_GAME_3', 'Juara 3 Sesi Game Edukasi', 2, true),
        ('APRESIASI_GURU', 'Bonus Khusus dari Guru Pengampu', 3, true)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- CATAT KE LOG PENGAWASAN AUDIT (log_penghapusan tidak pernah dikosongkan)
  INSERT INTO public.log_penghapusan (
    guru_id,
    guru_nama,
    waktu,
    kategori,
    rincian_dihapus,
    cadangan_diunduh,
    cadangan_dilewati,
    status,
    catatan
  ) VALUES (
    v_uid,
    v_guru_nama,
    now(),
    p_kategori,
    v_laporan,
    NOT p_lewati_cadangan,
    p_lewati_cadangan,
    'sukses',
    format('Penghapusan database zona berbahaya berhasil dieksekusi. Total baris: %s.', v_total_deleted)
  );

  RETURN jsonb_build_object(
    'success', true,
    'waktu', now(),
    'kategori', p_kategori,
    'rincian', v_laporan,
    'total_baris_dihapus', v_total_deleted,
    'cadangan_dilewati', p_lewati_cadangan,
    'pesan', 'Database berhasil dikosongkan dengan aman sesuai cakupan kategori yang dipilih.'
  );
END;
$$;

-- 7. FUNGSI RPC: riwayat_penghapusan (Untuk Guru Memeriksa Audit Log)
CREATE OR REPLACE FUNCTION public.riwayat_penghapusan()
RETURNS TABLE (
  id uuid,
  guru_nama text,
  waktu timestamptz,
  kategori text[],
  rincian jsonb,
  cadangan_diunduh boolean,
  cadangan_dilewati boolean,
  status text,
  catatan text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND peran = 'guru'
  ) THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya akun guru yang dapat melihat riwayat penghapusan database.';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.guru_nama,
    l.waktu,
    l.kategori,
    l.rincian_dihapus,
    l.cadangan_diunduh,
    l.cadangan_dilewati,
    l.status,
    l.catatan
  FROM public.log_penghapusan l
  ORDER BY l.waktu DESC
  LIMIT 50;
END;
$$;
