-- ==============================================================================
-- MIGRASI DATABASE: FITUR KELOLA GAME & SESI GAME GURU
-- File: supabase/migrasi_kelola_game.sql
-- Aman dijalankan di atas schema.sql lama (Idempotent / IF NOT EXISTS)
-- ==============================================================================

-- 1. PERBARUI TABEL GAME DENGAN KOLOM BARU
ALTER TABLE public.game 
ADD COLUMN IF NOT EXISTS tipe TEXT NOT NULL DEFAULT 'kanvas_file',
ADD COLUMN IF NOT EXISTS konfigurasi JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS file_game TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS urutan INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS mode_sesi TEXT NOT NULL DEFAULT 'bebas', -- 'bebas' atau 'wajib_sesi'
ADD COLUMN IF NOT EXISTS diarsipkan_pada TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS poin_juara1 INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS poin_juara2 INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS poin_juara3 INT DEFAULT 2,
ADD COLUMN IF NOT EXISTS game_nama_cadangan TEXT DEFAULT NULL;

-- 2. TABEL BARU: SESI GAME (KOMPETISI KELAS REALTIME)
CREATE TABLE IF NOT EXISTS public.sesi_game (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id TEXT REFERENCES public.game(id) ON DELETE CASCADE,
    judul TEXT NOT NULL,
    kelas JSONB NOT NULL DEFAULT '["Semua"]'::jsonb,
    kode VARCHAR(10) DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'berlangsung', -- 'dijadwalkan', 'berlangsung', 'ditutup'
    mulai TIMESTAMPTZ NOT NULL DEFAULT now(),
    batas_waktu TIMESTAMPTZ DEFAULT NULL,
    ditutup_pada TIMESTAMPTZ DEFAULT NULL,
    maks_percobaan INT NOT NULL DEFAULT 3,
    dibuat_oleh UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    bintang_dibagikan BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABEL BARU: PESERTA SESI
CREATE TABLE IF NOT EXISTS public.peserta_sesi (
    sesi_id UUID REFERENCES public.sesi_game(id) ON DELETE CASCADE,
    siswa_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    bergabung_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (sesi_id, siswa_id)
);

-- 4. PERBARUI TABEL SKOR GAME AGAR MEMILIKI RELASI SESI
ALTER TABLE public.skor_game 
ADD COLUMN IF NOT EXISTS sesi_id UUID REFERENCES public.sesi_game(id) ON DELETE SET NULL;

-- 5. INDEKS TAMBAHAN UNTUK PERFORMA REALTIME & QUERY
CREATE INDEX IF NOT EXISTS idx_game_diarsipkan ON public.game(diarsipkan_pada, urutan);
CREATE INDEX IF NOT EXISTS idx_sesi_game_status ON public.sesi_game(status, batas_waktu);
CREATE INDEX IF NOT EXISTS idx_skor_game_sesi ON public.skor_game(sesi_id, skor DESC);

-- 6. ROW LEVEL SECURITY (RLS) UNTUK SESI GAME
ALTER TABLE public.sesi_game ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta_sesi ENABLE ROW LEVEL SECURITY;

-- 6.1 Kebijakan SESI GAME
DROP POLICY IF EXISTS "Guru kelola semua sesi game" ON public.sesi_game;
CREATE POLICY "Guru kelola semua sesi game" ON public.sesi_game FOR ALL USING (public.is_guru());

DROP POLICY IF EXISTS "Siswa baca sesi kelasnya" ON public.sesi_game;
CREATE POLICY "Siswa baca sesi kelasnya" ON public.sesi_game FOR SELECT USING (
    status = 'berlangsung' OR status = 'ditutup'
);

-- 6.2 Kebijakan PESERTA SESI
DROP POLICY IF EXISTS "Guru kelola semua peserta sesi" ON public.peserta_sesi;
CREATE POLICY "Guru kelola semua peserta sesi" ON public.peserta_sesi FOR ALL USING (public.is_guru());

DROP POLICY IF EXISTS "Siswa kelola kepesertaan sendiri" ON public.peserta_sesi;
CREATE POLICY "Siswa kelola kepesertaan sendiri" ON public.peserta_sesi FOR ALL USING (auth.uid() = siswa_id);

-- 7. FUNGSI-FUNGSI RPC (SECURITY DEFINER)

-- 7.1 Tambah Game Baru oleh Guru
CREATE OR REPLACE FUNCTION public.tambah_game(
    p_id TEXT,
    p_nama TEXT,
    p_ikon TEXT,
    p_deskripsi TEXT,
    p_bab TEXT,
    p_kelas JSONB,
    p_skor_maks INT,
    p_poin_bintang INT,
    p_maks_percobaan INT,
    p_tipe TEXT DEFAULT 'kanvas_file',
    p_konfigurasi JSONB DEFAULT '{}'::jsonb,
    p_file_game TEXT DEFAULT '',
    p_mode_sesi TEXT DEFAULT 'bebas',
    p_juara1 INT DEFAULT 5,
    p_juara2 INT DEFAULT 3,
    p_juara3 INT DEFAULT 2
)
RETURNS JSONB AS $$
BEGIN
    IF NOT public.is_guru() THEN
        RAISE EXCEPTION 'Hanya guru yang berhak menambah game.';
    END IF;

    -- Validasi ID (huruf kecil dan tanda hubung)
    IF p_id !~ '^[a-z0-9\-]+$' THEN
        RAISE EXCEPTION 'ID Game hanya boleh berupa huruf kecil, angka, dan tanda hubung.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.game WHERE id = p_id) THEN
        RAISE EXCEPTION 'Game dengan ID "%" sudah terdaftar.', p_id;
    END IF;

    INSERT INTO public.game (
        id, nama, ikon, deskripsi, bab, kelas, skor_maks, poin_bintang,
        maks_percobaan_harian, aktif, tipe, konfigurasi, file_game, mode_sesi,
        poin_juara1, poin_juara2, poin_juara3
    ) VALUES (
        p_id, p_nama, p_ikon, p_deskripsi, p_bab, p_kelas, p_skor_maks, p_poin_bintang,
        p_maks_percobaan, true, p_tipe, p_konfigurasi, p_file_game, p_mode_sesi,
        p_juara1, p_juara2, p_juara3
    );

    -- Log aktivitas
    INSERT INTO public.log_aktivitas (user_id, aksi, detail)
    VALUES (auth.uid(), 'TAMBAH_GAME', jsonb_build_object('game_id', p_id, 'nama', p_nama));

    RETURN jsonb_build_object('success', true, 'id', p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.2 Ubah Game oleh Guru
CREATE OR REPLACE FUNCTION public.ubah_game(
    p_id TEXT,
    p_nama TEXT,
    p_ikon TEXT,
    p_deskripsi TEXT,
    p_bab TEXT,
    p_kelas JSONB,
    p_skor_maks INT,
    p_poin_bintang INT,
    p_maks_percobaan INT,
    p_aktif BOOLEAN,
    p_mode_sesi TEXT,
    p_konfigurasi JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT public.is_guru() THEN
        RAISE EXCEPTION 'Hanya guru yang berhak mengubah game.';
    END IF;

    UPDATE public.game SET
        nama = p_nama,
        ikon = p_ikon,
        deskripsi = p_deskripsi,
        bab = p_bab,
        kelas = p_kelas,
        skor_maks = p_skor_maks,
        poin_bintang = p_poin_bintang,
        maks_percobaan_harian = p_maks_percobaan,
        aktif = p_aktif,
        mode_sesi = p_mode_sesi,
        konfigurasi = p_konfigurasi
    WHERE id = p_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.3 Arsipkan Game (Soft Delete)
CREATE OR REPLACE FUNCTION public.arsipkan_game(p_game_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT public.is_guru() THEN
        RAISE EXCEPTION 'Hanya guru yang berhak mengarsipkan game.';
    END IF;

    -- Proteksi: Jangan izinkan jika ada sesi yang sedang berlangsung
    IF EXISTS (SELECT 1 FROM public.sesi_game WHERE game_id = p_game_id AND status = 'berlangsung') THEN
        RAISE EXCEPTION 'Game tidak dapat diarsipkan karena masih memiliki sesi yang sedang berlangsung. Tutup sesi terlebih dahulu.';
    END IF;

    UPDATE public.game 
    SET diarsipkan_pada = now(), aktif = false
    WHERE id = p_game_id;

    INSERT INTO public.log_aktivitas (user_id, aksi, detail)
    VALUES (auth.uid(), 'ARSIPKAN_GAME', jsonb_build_object('game_id', p_game_id));

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.4 Pulihkan Game dari Arsip
CREATE OR REPLACE FUNCTION public.pulihkan_game(p_game_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT public.is_guru() THEN
        RAISE EXCEPTION 'Hanya guru yang berhak memulihkan game.';
    END IF;

    UPDATE public.game 
    SET diarsipkan_pada = NULL, aktif = true
    WHERE id = p_game_id;

    INSERT INTO public.log_aktivitas (user_id, aksi, detail)
    VALUES (auth.uid(), 'PULIHKAN_GAME', jsonb_build_object('game_id', p_game_id));

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.5 Hapus Game Permanen (Dengan Opsi Pertahankan Riwayat Skor)
CREATE OR REPLACE FUNCTION public.hapus_game_permanen(
    p_game_id TEXT,
    p_hapus_riwayat BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    v_game RECORD;
    v_skor_count INT;
    v_sesi_count INT;
BEGIN
    IF NOT public.is_guru() THEN
        RAISE EXCEPTION 'Hanya guru yang berhak menghapus game permanen.';
    END IF;

    SELECT * INTO v_game FROM public.game WHERE id = p_game_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Game tidak ditemukan.';
    END IF;

    IF v_game.diarsipkan_pada IS NULL THEN
        RAISE EXCEPTION 'Game harus diarsipkan terlebih dahulu sebelum dapat dihapus permanen.';
    END IF;

    SELECT count(*) INTO v_skor_count FROM public.skor_game WHERE game_id = p_game_id;
    SELECT count(*) INTO v_sesi_count FROM public.sesi_game WHERE game_id = p_game_id;

    IF p_hapus_riwayat THEN
        -- Hapus total beserta skor
        DELETE FROM public.skor_game WHERE game_id = p_game_id;
        DELETE FROM public.sesi_game WHERE game_id = p_game_id;
        DELETE FROM public.game WHERE id = p_game_id;
    ELSE
        -- Simpan nama cadangan agar riwayat siswa tidak hilang
        UPDATE public.skor_game SET game_id = NULL WHERE game_id = p_game_id;
        DELETE FROM public.game WHERE id = p_game_id;
    END IF;

    INSERT INTO public.log_aktivitas (user_id, aksi, detail)
    VALUES (auth.uid(), 'HAPUS_GAME_PERMANEN', jsonb_build_object('game_id', p_game_id, 'nama', v_game.nama, 'hapus_riwayat', p_hapus_riwayat));

    RETURN jsonb_build_object('success', true, 'skor_terdampak', v_skor_count, 'sesi_terdampak', v_sesi_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.6 Buka Sesi Game Baru oleh Guru
CREATE OR REPLACE FUNCTION public.buka_sesi_game(
    p_game_id TEXT,
    p_judul TEXT,
    p_kelas JSONB,
    p_durasi_menit INT DEFAULT 30, -- 0 jika tanpa batas waktu
    p_kode TEXT DEFAULT NULL,
    p_maks_percobaan INT DEFAULT 3
)
RETURNS JSONB AS $$
DECLARE
    v_sesi RECORD;
    v_batas TIMESTAMPTZ := NULL;
BEGIN
    IF NOT public.is_guru() THEN
        RAISE EXCEPTION 'Hanya guru yang berhak membuka sesi game.';
    END IF;

    -- Cek apakah game aktif
    IF NOT EXISTS (SELECT 1 FROM public.game WHERE id = p_game_id AND diarsipkan_pada IS NULL) THEN
        RAISE EXCEPTION 'Game tidak ditemukan atau sedang diarsipkan.';
    END IF;

    -- Cek apakah sudah ada sesi berlangsung untuk game ini di kelas yang sama
    IF EXISTS (
        SELECT 1 FROM public.sesi_game 
        WHERE game_id = p_game_id AND status = 'berlangsung'
    ) THEN
        RAISE EXCEPTION 'Game ini sudah memiliki sesi yang sedang aktif. Tutup sesi sebelumnya terlebih dahulu.';
    END IF;

    IF p_durasi_menit > 0 THEN
        v_batas := now() + (p_durasi_menit || ' minutes')::interval;
    END IF;

    INSERT INTO public.sesi_game (
        game_id, judul, kelas, kode, status, mulai, batas_waktu, maks_percobaan, dibuat_oleh
    ) VALUES (
        p_game_id, p_judul, p_kelas, UPPER(NULLIF(TRIM(p_kode), '')), 'berlangsung', now(), v_batas, p_maks_percobaan, auth.uid()
    ) RETURNING * INTO v_sesi;

    INSERT INTO public.log_aktivitas (user_id, aksi, detail)
    VALUES (auth.uid(), 'BUKA_SESI_GAME', jsonb_build_object('sesi_id', v_sesi.id, 'game_id', p_game_id, 'judul', p_judul));

    RETURN to_jsonb(v_sesi);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.7 Tutup Sesi Game & Bagikan Bintang Juara (Idempoten)
CREATE OR REPLACE FUNCTION public.tutup_sesi_game(p_sesi_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_sesi RECORD;
    v_game RECORD;
    r_juara RECORD;
    v_rank INT := 0;
    v_poin INT;
BEGIN
    IF NOT public.is_guru() THEN
        RAISE EXCEPTION 'Hanya guru yang berhak menutup sesi game.';
    END IF;

    SELECT * INTO v_sesi FROM public.sesi_game WHERE id = p_sesi_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sesi tidak ditemukan.';
    END IF;

    IF v_sesi.status = 'ditutup' THEN
        RETURN jsonb_build_object('status', 'sudah_ditutup');
    END IF;

    SELECT * INTO v_game FROM public.game WHERE id = v_sesi.game_id;

    -- Update status sesi menjadi ditutup
    UPDATE public.sesi_game 
    SET status = 'ditutup', ditutup_pada = now()
    WHERE id = p_sesi_id;

    -- Bagikan bintang apresiasi untuk Top 3 Juara Sesi jika belum dibagikan
    IF NOT v_sesi.bintang_dibagikan THEN
        FOR r_juara IN
            SELECT siswa_id, MAX(skor) as max_skor
            FROM public.skor_game
            WHERE sesi_id = p_sesi_id
            GROUP BY siswa_id
            ORDER BY max_skor DESC
            LIMIT 3
        LOOP
            v_rank := v_rank + 1;
            IF v_rank = 1 THEN
                v_poin := COALESCE(v_game.poin_juara1, 5);
            ELSIF v_rank = 2 THEN
                v_poin := COALESCE(v_game.poin_juara2, 3);
            ELSE
                v_poin := COALESCE(v_game.poin_juara3, 2);
            END IF;

            INSERT INTO public.riwayat_bintang (siswa_id, kode, poin, alasan, referensi_id)
            VALUES (
                r_juara.siswa_id,
                'JUARA_SESI_GAME',
                v_poin,
                'Juara ' || v_rank || ' Sesi Kompetisi: ' || v_sesi.judul,
                p_sesi_id
            );
        END LOOP;

        UPDATE public.sesi_game SET bintang_dibagikan = true WHERE id = p_sesi_id;
    END IF;

    INSERT INTO public.log_aktivitas (user_id, aksi, detail)
    VALUES (auth.uid(), 'TUTUP_SESI_GAME', jsonb_build_object('sesi_id', p_sesi_id));

    RETURN jsonb_build_object('success', true, 'status', 'ditutup');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.8 Gabung Sesi Game oleh Siswa
CREATE OR REPLACE FUNCTION public.gabung_sesi_game(p_sesi_id UUID, p_kode TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_sesi RECORD;
    v_siswa RECORD;
BEGIN
    SELECT * INTO v_sesi FROM public.sesi_game WHERE id = p_sesi_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sesi game tidak ditemukan.';
    END IF;

    -- Periksa apakah sesi masih aktif
    IF v_sesi.status != 'berlangsung' OR (v_sesi.batas_waktu IS NOT NULL AND now() > v_sesi.batas_waktu) THEN
        RAISE EXCEPTION 'Sesi kompetisi ini sudah berakhir atau ditutup.';
    END IF;

    -- Periksa kode jika disyaratkan
    IF v_sesi.kode IS NOT NULL AND v_sesi.kode != '' THEN
        IF p_kode IS NULL OR UPPER(TRIM(p_kode)) != v_sesi.kode THEN
            RAISE EXCEPTION 'Kode sesi tidak tepat. Silakan tanyakan kode sesi ke guru.';
        END IF;
    END IF;

    -- Periksa kelas siswa
    SELECT * INTO v_siswa FROM public.profiles WHERE id = auth.uid();
    IF v_siswa.peran != 'guru' THEN
        IF NOT (v_sesi.kelas @> '["Semua"]'::jsonb OR v_sesi.kelas @> jsonb_build_array(v_siswa.kelas)) THEN
            RAISE EXCEPTION 'Sesi ini khusus untuk kelas %.', v_sesi.kelas;
        END IF;
    END IF;

    -- Catat bergabung
    INSERT INTO public.peserta_sesi (sesi_id, siswa_id)
    VALUES (p_sesi_id, auth.uid())
    ON CONFLICT (sesi_id, siswa_id) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'sesi_id', p_sesi_id, 'game_id', v_sesi.game_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.9 Sesi Aktif Saya (Untuk Banner Siswa Realtime)
CREATE OR REPLACE FUNCTION public.sesi_aktif_saya()
RETURNS TABLE (
    sesi_id UUID,
    game_id TEXT,
    game_nama TEXT,
    game_ikon TEXT,
    judul TEXT,
    kode_wajib BOOLEAN,
    batas_waktu TIMESTAMPTZ,
    sisa_detik BIGINT,
    maks_percobaan INT,
    sudah_bergabung BOOLEAN
) AS $$
DECLARE
    v_kelas TEXT;
BEGIN
    SELECT kelas INTO v_kelas FROM public.profiles WHERE id = auth.uid();

    RETURN QUERY
    SELECT 
        sg.id AS sesi_id,
        sg.game_id,
        g.nama AS game_nama,
        g.ikon AS game_ikon,
        sg.judul,
        (sg.kode IS NOT NULL AND sg.kode != '') AS kode_wajib,
        sg.batas_waktu,
        CASE 
            WHEN sg.batas_waktu IS NOT NULL THEN GREATEST(0::bigint, EXTRACT(EPOCH FROM (sg.batas_waktu - now()))::bigint)
            ELSE 999999::bigint
        END AS sisa_detik,
        sg.maks_percobaan,
        EXISTS (SELECT 1 FROM public.peserta_sesi ps WHERE ps.sesi_id = sg.id AND ps.siswa_id = auth.uid()) AS sudah_bergabung
    FROM public.sesi_game sg
    JOIN public.game g ON g.id = sg.game_id
    WHERE sg.status = 'berlangsung'
      AND (sg.batas_waktu IS NULL OR sg.batas_waktu > now())
      AND (sg.kelas @> '["Semua"]'::jsonb OR sg.kelas @> jsonb_build_array(v_kelas) OR public.is_guru())
    ORDER BY sg.mulai DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7.10 Papan Skor Sesi Realtime
CREATE OR REPLACE FUNCTION public.papan_sesi(p_sesi_id UUID)
RETURNS TABLE (
    siswa_id UUID,
    nama TEXT,
    kelas TEXT,
    avatar_url TEXT,
    skor_tertinggi INT,
    jumlah_percobaan BIGINT,
    terakhir_main TIMESTAMPTZ,
    peringkat BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH best_scores AS (
        SELECT 
            sk.siswa_id,
            MAX(sk.skor) AS max_skor,
            COUNT(sk.id) AS attempts,
            MAX(sk.dibuat) AS last_played
        FROM public.skor_game sk
        WHERE sk.sesi_id = p_sesi_id
        GROUP BY sk.siswa_id
    )
    SELECT 
        p.id AS siswa_id,
        p.nama,
        p.kelas,
        p.avatar_url,
        bs.max_skor AS skor_tertinggi,
        bs.attempts AS jumlah_percobaan,
        bs.last_played AS terakhir_main,
        DENSE_RANK() OVER (ORDER BY bs.max_skor DESC, bs.last_played ASC) AS peringkat
    FROM best_scores bs
    JOIN public.profiles p ON p.id = bs.siswa_id
    ORDER BY peringkat ASC, bs.max_skor DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7.11 Ringkasan Sesi Lengkap (Untuk Guru & Cetak Laporan)
CREATE OR REPLACE FUNCTION public.ringkasan_sesi(p_sesi_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_sesi RECORD;
    v_total_peserta INT := 0;
    v_rata_rata NUMERIC(6,2) := 0;
    v_tertinggi INT := 0;
BEGIN
    SELECT * INTO v_sesi FROM public.sesi_game WHERE id = p_sesi_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sesi tidak ditemukan.';
    END IF;

    SELECT 
        COUNT(DISTINCT siswa_id),
        COALESCE(ROUND(AVG(skor), 2), 0),
        COALESCE(MAX(skor), 0)
    INTO v_total_peserta, v_rata_rata, v_tertinggi
    FROM public.skor_game
    WHERE sesi_id = p_sesi_id;

    RETURN jsonb_build_object(
        'sesi', to_jsonb(v_sesi),
        'total_peserta', v_total_peserta,
        'rata_rata', v_rata_rata,
        'tertinggi', v_tertinggi
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Selesai! Skrip migrasi kelola game berhasil disiapkan.
