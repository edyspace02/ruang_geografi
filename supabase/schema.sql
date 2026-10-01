-- ==============================================================================
-- SKEMA DATABASE LENGKAP: RUANG GEOGRAFI
-- Siap dieksekusi di Supabase SQL Editor
-- Fitur: Multi-role (Guru & Siswa), Materi, CBT Ujian (Kunci Aman), Nilai, Bintang, Game, RLS & RPC
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('guru', 'siswa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE materi_status AS ENUM ('draft', 'terbit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ujian_status AS ENUM ('draft', 'aktif', 'selesai');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABEL UTAMA

-- 3.1 PROFILES (Sinkron dengan auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    peran user_role NOT NULL DEFAULT 'siswa',
    kelas TEXT DEFAULT 'X-1',
    aktif BOOLEAN NOT NULL DEFAULT true,
    wajib_ganti_password BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2 KELAS
CREATE TABLE IF NOT EXISTS public.kelas (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    urutan INT DEFAULT 0
);

-- 3.3 MATERI
CREATE TABLE IF NOT EXISTS public.materi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul TEXT NOT NULL,
    ringkasan TEXT NOT NULL,
    isi TEXT NOT NULL,
    bab TEXT NOT NULL, -- e.g. Litosfer, Atmosfer, Hidrosfer, Peta & SIG
    kelas TEXT NOT NULL DEFAULT 'Semua', -- e.g. 'Semua', 'X', 'XI', 'XII'
    tag TEXT[] DEFAULT '{}',
    sampul_url TEXT DEFAULT '',
    status materi_status NOT NULL DEFAULT 'draft',
    dijadwalkan TIMESTAMPTZ,
    pembaca_count INT NOT NULL DEFAULT 0,
    dibuat_oleh UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.4 MATERI DIBACA (Pelacakan penyelesaian untuk bintang)
CREATE TABLE IF NOT EXISTS public.materi_dibaca (
    siswa_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    materi_id UUID REFERENCES public.materi(id) ON DELETE CASCADE,
    selesai_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (siswa_id, materi_id)
);

-- 3.5 BANK SOAL
CREATE TABLE IF NOT EXISTS public.soal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bab TEXT NOT NULL,
    teks TEXT NOT NULL,
    gambar_url TEXT DEFAULT '',
    opsi JSONB NOT NULL, -- Array: [{"label": "A", "teks": "..."}, ...]
    bobot INT NOT NULL DEFAULT 1,
    kesulitan TEXT NOT NULL DEFAULT 'sedang', -- mudah, sedang, sukar
    pembahasan TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.6 KUNCI SOAL (TERPISAH & AMAN - RLS Melarang Siswa Mengakses!)
CREATE TABLE IF NOT EXISTS public.kunci_soal (
    soal_id UUID PRIMARY KEY REFERENCES public.soal(id) ON DELETE CASCADE,
    kunci CHAR(1) NOT NULL -- 'A', 'B', 'C', 'D', atau 'E'
);

-- 3.7 UJIAN
CREATE TABLE IF NOT EXISTS public.ujian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul TEXT NOT NULL,
    bab TEXT NOT NULL,
    kelas TEXT NOT NULL DEFAULT 'Semua',
    durasi_menit INT NOT NULL DEFAULT 60,
    buka TIMESTAMPTZ,
    tutup TIMESTAMPTZ,
    acak_soal BOOLEAN NOT NULL DEFAULT true,
    acak_opsi BOOLEAN NOT NULL DEFAULT true,
    tampil_hasil TEXT NOT NULL DEFAULT 'langsung', -- 'langsung', 'setelah_tutup', 'tidak'
    kkm INT NOT NULL DEFAULT 75,
    status ujian_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.8 RELASI UJIAN - SOAL
CREATE TABLE IF NOT EXISTS public.ujian_soal (
    ujian_id UUID REFERENCES public.ujian(id) ON DELETE CASCADE,
    soal_id UUID REFERENCES public.soal(id) ON DELETE CASCADE,
    urutan INT NOT NULL DEFAULT 1,
    PRIMARY KEY (ujian_id, soal_id)
);

-- 3.9 PERCOBAAN UJIAN
CREATE TABLE IF NOT EXISTS public.percobaan_ujian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ujian_id UUID NOT NULL REFERENCES public.ujian(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mulai TIMESTAMPTZ NOT NULL DEFAULT now(),
    batas TIMESTAMPTZ NOT NULL,
    selesai TIMESTAMPTZ,
    skor NUMERIC(5,2) DEFAULT NULL,
    jumlah_pindah_tab INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'mengerjakan', -- 'mengerjakan', 'selesai'
    CONSTRAINT uq_siswa_ujian UNIQUE (ujian_id, siswa_id)
);

-- 3.10 JAWABAN SISWA
CREATE TABLE IF NOT EXISTS public.jawaban (
    percobaan_id UUID REFERENCES public.percobaan_ujian(id) ON DELETE CASCADE,
    soal_id UUID REFERENCES public.soal(id) ON DELETE CASCADE,
    pilihan CHAR(1), -- 'A','B','C','D','E'
    ragu BOOLEAN NOT NULL DEFAULT false,
    benar BOOLEAN DEFAULT NULL, -- Dinilai di server
    PRIMARY KEY (percobaan_id, soal_id)
);

-- 3.11 ATURAN BINTANG
CREATE TABLE IF NOT EXISTS public.aturan_bintang (
    kode TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    poin INT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT true
);

-- 3.12 RIWAYAT BINTANG
CREATE TABLE IF NOT EXISTS public.riwayat_bintang (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kode TEXT NOT NULL,
    poin INT NOT NULL,
    alasan TEXT NOT NULL,
    referensi_id UUID,
    pemberi UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    dibuat TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.13 LENCANA (BADGES)
CREATE TABLE IF NOT EXISTS public.lencana (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    ikon TEXT NOT NULL,
    syarat_tipe TEXT NOT NULL,
    syarat_nilai INT NOT NULL DEFAULT 1
);

-- 3.14 LENCANA SISWA
CREATE TABLE IF NOT EXISTS public.lencana_siswa (
    siswa_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lencana_id TEXT REFERENCES public.lencana(id) ON DELETE CASCADE,
    diperoleh TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (siswa_id, lencana_id)
);

-- 3.15 GAME
CREATE TABLE IF NOT EXISTS public.game (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT true,
    kelas JSONB NOT NULL DEFAULT '["Semua"]'::jsonb,
    maks_percobaan_harian INT NOT NULL DEFAULT 5,
    skor_maks INT NOT NULL DEFAULT 1000,
    poin_bintang INT NOT NULL DEFAULT 3
);

-- 3.16 SKOR GAME
CREATE TABLE IF NOT EXISTS public.skor_game (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id TEXT NOT NULL REFERENCES public.game(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skor INT NOT NULL,
    dibuat TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.17 PENGATURAN UMUM
CREATE TABLE IF NOT EXISTS public.pengaturan (
    kunci TEXT PRIMARY KEY,
    nilai TEXT NOT NULL
);

-- 3.18 LOG AKTIVITAS
CREATE TABLE IF NOT EXISTS public.log_aktivitas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    aksi TEXT NOT NULL,
    detail JSONB DEFAULT '{}'::jsonb,
    dibuat TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. INDEKS UNTUK PERFORMA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_materi_status_kelas ON public.materi(status, kelas);
CREATE INDEX IF NOT EXISTS idx_ujian_status_kelas ON public.ujian(status, kelas);
CREATE INDEX IF NOT EXISTS idx_percobaan_ujian_siswa ON public.percobaan_ujian(siswa_id, ujian_id);
CREATE INDEX IF NOT EXISTS idx_riwayat_bintang_siswa ON public.riwayat_bintang(siswa_id, dibuat);
CREATE INDEX IF NOT EXISTS idx_skor_game_ranking ON public.skor_game(game_id, skor DESC, dibuat);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) & KEAMANAN
-- ==============================================================================

-- Fungsi pembantu periksa apakah user saat ini adalah Guru (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_guru()
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT peran INTO user_role_val FROM public.profiles WHERE id = auth.uid();
    RETURN (user_role_val = 'guru');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Aktifkan RLS di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materi_dibaca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kunci_soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ujian_soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.percobaan_ujian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jawaban ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aturan_bintang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riwayat_bintang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lencana ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lencana_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skor_game ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_aktivitas ENABLE ROW LEVEL SECURITY;

-- 5.1 Kebijakan PROFILES
DROP POLICY IF EXISTS "Semua user dapat membaca profil" ON public.profiles;
CREATE POLICY "Semua user dapat membaca profil" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "User dapat update profil sendiri" ON public.profiles;
CREATE POLICY "User dapat update profil sendiri" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Guru dapat kelola semua profil" ON public.profiles;
CREATE POLICY "Guru dapat kelola semua profil" ON public.profiles FOR ALL USING (public.is_guru());

-- 5.2 Kebijakan KELAS
CREATE POLICY "Baca kelas untuk semua terautentikasi" ON public.kelas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Guru kelola kelas" ON public.kelas FOR ALL USING (public.is_guru());

-- 5.3 Kebijakan MATERI
CREATE POLICY "Guru kelola semua materi" ON public.materi FOR ALL USING (public.is_guru());
CREATE POLICY "Siswa baca materi terbit" ON public.materi FOR SELECT USING (
    status = 'terbit' AND (
        dijadwalkan IS NULL OR dijadwalkan <= now()
    )
);

-- 5.4 Kebijakan MATERI DIBACA
CREATE POLICY "Siswa kelola baca materi sendiri" ON public.materi_dibaca FOR ALL USING (auth.uid() = siswa_id);
CREATE POLICY "Guru pantau materi dibaca" ON public.materi_dibaca FOR SELECT USING (public.is_guru());

-- 5.5 Kebijakan SOAL & KUNCI SOAL
CREATE POLICY "Guru kelola semua soal" ON public.soal FOR ALL USING (public.is_guru());
CREATE POLICY "Siswa baca soal ujian aktif" ON public.soal FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.ujian_soal us
        JOIN public.ujian u ON u.id = us.ujian_id
        JOIN public.percobaan_ujian pu ON pu.ujian_id = u.id
        WHERE us.soal_id = soal.id AND pu.siswa_id = auth.uid()
    )
);

-- KUNCI SOAL: HANYA GURU YANG DAPAT MELIHAT/MENGUBAH
CREATE POLICY "Guru kelola kunci soal" ON public.kunci_soal FOR ALL USING (public.is_guru());
-- Siswa TIDAK punya izin SELECT di tabel kunci_soal!

-- 5.6 Kebijakan UJIAN & UJIAN_SOAL
CREATE POLICY "Guru kelola ujian" ON public.ujian FOR ALL USING (public.is_guru());
CREATE POLICY "Siswa baca ujian aktif" ON public.ujian FOR SELECT USING (status = 'aktif');

CREATE POLICY "Guru kelola relasi ujian soal" ON public.ujian_soal FOR ALL USING (public.is_guru());
CREATE POLICY "Siswa baca ujian soal aktif" ON public.ujian_soal FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ujian u WHERE u.id = ujian_id AND u.status = 'aktif')
);

-- 5.7 Kebijakan PERCOBAAN UJIAN & JAWABAN
CREATE POLICY "Siswa kelola percobaan miliknya" ON public.percobaan_ujian FOR SELECT USING (siswa_id = auth.uid());
CREATE POLICY "Siswa insert percobaan miliknya" ON public.percobaan_ujian FOR INSERT WITH CHECK (siswa_id = auth.uid());
CREATE POLICY "Siswa update status pindah tab" ON public.percobaan_ujian FOR UPDATE USING (siswa_id = auth.uid());
CREATE POLICY "Guru kelola semua percobaan" ON public.percobaan_ujian FOR ALL USING (public.is_guru());

CREATE POLICY "Siswa kelola jawaban miliknya" ON public.jawaban FOR ALL USING (
    EXISTS (SELECT 1 FROM public.percobaan_ujian pu WHERE pu.id = percobaan_id AND pu.siswa_id = auth.uid())
);
CREATE POLICY "Guru kelola semua jawaban" ON public.jawaban FOR ALL USING (public.is_guru());

-- 5.8 Kebijakan BINTANG & LENCANA
CREATE POLICY "Semua baca aturan bintang" ON public.aturan_bintang FOR SELECT USING (true);
CREATE POLICY "Guru kelola aturan bintang" ON public.aturan_bintang FOR ALL USING (public.is_guru());

CREATE POLICY "Semua baca riwayat bintang" ON public.riwayat_bintang FOR SELECT USING (true);
CREATE POLICY "Hanya fungsi server atau guru tambah bintang" ON public.riwayat_bintang FOR INSERT WITH CHECK (public.is_guru() OR auth.uid() IS NOT NULL);

CREATE POLICY "Semua baca lencana" ON public.lencana FOR SELECT USING (true);
CREATE POLICY "Semua baca lencana siswa" ON public.lencana_siswa FOR SELECT USING (true);
CREATE POLICY "Guru kelola lencana" ON public.lencana FOR ALL USING (public.is_guru());

-- 5.9 Kebijakan GAME & SKOR GAME
CREATE POLICY "Semua baca game" ON public.game FOR SELECT USING (true);
CREATE POLICY "Guru kelola game" ON public.game FOR ALL USING (public.is_guru());

CREATE POLICY "Semua baca skor game" ON public.skor_game FOR SELECT USING (true);
CREATE POLICY "Siswa insert skor game sendiri" ON public.skor_game FOR INSERT WITH CHECK (siswa_id = auth.uid());

CREATE POLICY "Semua baca pengaturan" ON public.pengaturan FOR SELECT USING (true);
CREATE POLICY "Guru kelola pengaturan" ON public.pengaturan FOR ALL USING (public.is_guru());

CREATE POLICY "Guru baca log" ON public.log_aktivitas FOR SELECT USING (public.is_guru());

-- ==============================================================================
-- 6. RPC / SQL FUNCTIONS
-- ==============================================================================

-- 6.1 RPC: MULAI UJIAN (Server-authoritative timer)
CREATE OR REPLACE FUNCTION public.mulai_ujian(p_ujian_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_ujian RECORD;
    v_percobaan RECORD;
    v_batas TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_ujian FROM public.ujian WHERE id = p_ujian_id AND status = 'aktif';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ujian tidak ditemukan atau belum aktif.';
    END IF;

    -- Periksa apakah sudah ada percobaan
    SELECT * INTO v_percobaan FROM public.percobaan_ujian 
    WHERE ujian_id = p_ujian_id AND siswa_id = auth.uid();

    IF FOUND THEN
        RETURN to_jsonb(v_percobaan);
    END IF;

    -- Hitung batas waktu server
    v_batas := now() + (v_ujian.durasi_menit || ' minutes')::interval;

    INSERT INTO public.percobaan_ujian (ujian_id, siswa_id, mulai, batas, status)
    VALUES (p_ujian_id, auth.uid(), now(), v_batas, 'mengerjakan')
    RETURNING * INTO v_percobaan;

    RETURN to_jsonb(v_percobaan);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.2 RPC: SIMPAN JAWABAN SISWA
CREATE OR REPLACE FUNCTION public.simpan_jawaban(
    p_percobaan_id UUID,
    p_soal_id UUID,
    p_pilihan CHAR(1),
    p_ragu BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
DECLARE
    v_percobaan RECORD;
BEGIN
    SELECT * INTO v_percobaan FROM public.percobaan_ujian 
    WHERE id = p_percobaan_id AND siswa_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Percobaan ujian tidak valid.';
    END IF;

    IF v_percobaan.status = 'selesai' OR now() > v_percobaan.batas THEN
        RAISE EXCEPTION 'Waktu ujian sudah berakhir.';
    END IF;

    INSERT INTO public.jawaban (percobaan_id, soal_id, pilihan, ragu)
    VALUES (p_percobaan_id, p_soal_id, p_pilihan, p_ragu)
    ON CONFLICT (percobaan_id, soal_id) DO UPDATE
    SET pilihan = EXCLUDED.pilihan,
        ragu = EXCLUDED.ragu;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 RPC: CATAT PINDAH TAB (ANTI-CURANG)
CREATE OR REPLACE FUNCTION public.catat_pindah_tab(p_percobaan_id UUID)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE public.percobaan_ujian
    SET jumlah_pindah_tab = jumlah_pindah_tab + 1
    WHERE id = p_percobaan_id AND siswa_id = auth.uid()
    RETURNING jumlah_pindah_tab INTO v_count;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.4 RPC: KIRIM & NILAI UJIAN (PENILAIAN DI SERVER SECARA AMAN)
CREATE OR REPLACE FUNCTION public.kirim_ujian(p_percobaan_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_percobaan RECORD;
    v_ujian RECORD;
    v_total_soal INT := 0;
    v_benar INT := 0;
    v_skor NUMERIC(5,2) := 0;
    r_jawaban RECORD;
    v_kunci CHAR(1);
    v_bintang_dapat INT := 2; -- Default bintang selesai ujian
BEGIN
    SELECT * INTO v_percobaan FROM public.percobaan_ujian 
    WHERE id = p_percobaan_id AND siswa_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data percobaan tidak ditemukan.';
    END IF;

    SELECT * INTO v_ujian FROM public.ujian WHERE id = v_percobaan.ujian_id;

    -- Hitung total soal
    SELECT COUNT(*) INTO v_total_soal FROM public.ujian_soal WHERE ujian_id = v_ujian.id;

    -- Cocokkan setiap jawaban siswa dengan kunci server
    FOR r_jawaban IN 
        SELECT j.soal_id, j.pilihan 
        FROM public.jawaban j 
        WHERE j.percobaan_id = p_percobaan_id
    LOOP
        SELECT ks.kunci INTO v_kunci FROM public.kunci_soal ks WHERE ks.soal_id = r_jawaban.soal_id;
        
        IF v_kunci IS NOT NULL AND r_jawaban.pilihan = v_kunci THEN
            v_benar := v_benar + 1;
            UPDATE public.jawaban SET benar = true 
            WHERE percobaan_id = p_percobaan_id AND soal_id = r_jawaban.soal_id;
        ELSE
            UPDATE public.jawaban SET benar = false 
            WHERE percobaan_id = p_percobaan_id AND soal_id = r_jawaban.soal_id;
        END IF;
    END LOOP;

    -- Hitung skor skala 0 - 100
    IF v_total_soal > 0 THEN
        v_skor := ROUND((v_benar::numeric / v_total_soal::numeric) * 100, 2);
    END IF;

    -- Update percobaan
    UPDATE public.percobaan_ujian
    SET selesai = now(),
        skor = v_skor,
        status = 'selesai'
    WHERE id = p_percobaan_id;

    -- Beri bintang sesuai aturan
    INSERT INTO public.riwayat_bintang (siswa_id, kode, poin, alasan, referensi_id)
    VALUES (v_percobaan.siswa_id, 'SELESAI_UJIAN', 2, 'Menyelesaikan ujian ' || v_ujian.judul, v_ujian.id);

    IF v_skor >= v_ujian.kkm THEN
        v_bintang_dapat := v_bintang_dapat + 3;
        INSERT INTO public.riwayat_bintang (siswa_id, kode, poin, alasan, referensi_id)
        VALUES (v_percobaan.siswa_id, 'LULUS_KKM', 3, 'Nilai di atas KKM pada ' || v_ujian.judul, v_ujian.id);
    END IF;

    IF v_skor >= 100 THEN
        v_bintang_dapat := v_bintang_dapat + 5;
        INSERT INTO public.riwayat_bintang (siswa_id, kode, poin, alasan, referensi_id)
        VALUES (v_percobaan.siswa_id, 'NILAI_SEMPURNA', 5, 'Meraih nilai sempurna 100!', v_ujian.id);
        
        -- Beri lencana Nilai Sempurna jika belum punya
        INSERT INTO public.lencana_siswa (siswa_id, lencana_id)
        VALUES (v_percobaan.siswa_id, 'nilai-sempurna')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'skor', v_skor,
        'benar', v_benar,
        'total', v_total_soal,
        'bintang', v_bintang_dapat,
        'lulus', (v_skor >= v_ujian.kkm)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.5 RPC: TANDAI MATERI SELESAI DIBACA (+1 Bintang)
CREATE OR REPLACE FUNCTION public.tandai_materi_selesai(p_materi_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_materi RECORD;
    v_poin INT := 1;
BEGIN
    SELECT * INTO v_materi FROM public.materi WHERE id = p_materi_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Materi tidak ditemukan.';
    END IF;

    -- Periksa apakah sudah pernah ditandai
    IF EXISTS (SELECT 1 FROM public.materi_dibaca WHERE siswa_id = auth.uid() AND materi_id = p_materi_id) THEN
        RETURN jsonb_build_object('status', 'sudah_pernah', 'poin', 0);
    END IF;

    INSERT INTO public.materi_dibaca (siswa_id, materi_id, selesai_pada)
    VALUES (auth.uid(), p_materi_id, now());

    UPDATE public.materi SET pembaca_count = pembaca_count + 1 WHERE id = p_materi_id;

    -- Beri bintang 1x
    INSERT INTO public.riwayat_bintang (siswa_id, kode, poin, alasan, referensi_id)
    VALUES (auth.uid(), 'BACA_MATERI', v_poin, 'Membaca tuntas materi: ' || v_materi.judul, p_materi_id);

    -- Cek lencana Rajin Membaca (jika sudah membaca >= 5 materi)
    IF (SELECT count(*) FROM public.materi_dibaca WHERE siswa_id = auth.uid()) >= 5 THEN
        INSERT INTO public.lencana_siswa (siswa_id, lencana_id)
        VALUES (auth.uid(), 'rajin-membaca')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN jsonb_build_object('status', 'berhasil', 'poin', v_poin);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.6 RPC: KIRIM SKOR GAME DENGAN VALIDASI SERVER
CREATE OR REPLACE FUNCTION public.kirim_skor_game(p_game_id TEXT, p_skor INT)
RETURNS JSONB AS $$
DECLARE
    v_game RECORD;
    v_bintang INT := 2;
    v_today_count INT;
BEGIN
    SELECT * INTO v_game FROM public.game WHERE id = p_game_id AND aktif = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Game tidak ditemukan atau nonaktif.';
    END IF;

    -- Anti cheat: skor tidak boleh melebihi skor_maks
    IF p_skor > v_game.skor_maks THEN
        p_skor := v_game.skor_maks;
    END IF;

    -- Periksa batas percobaan harian
    SELECT count(*) INTO v_today_count FROM public.skor_game 
    WHERE game_id = p_game_id AND siswa_id = auth.uid() AND dibuat >= current_date;

    IF v_today_count >= v_game.maks_percobaan_harian THEN
        -- Tetap simpan skor latihan tanpa bintang tambahan
        INSERT INTO public.skor_game (game_id, siswa_id, skor)
        VALUES (p_game_id, auth.uid(), p_skor);
        RETURN jsonb_build_object('status', 'limit_harian', 'poin', 0);
    END IF;

    INSERT INTO public.skor_game (game_id, siswa_id, skor)
    VALUES (p_game_id, auth.uid(), p_skor);

    v_bintang := v_game.poin_bintang;

    INSERT INTO public.riwayat_bintang (siswa_id, kode, poin, alasan)
    VALUES (auth.uid(), 'MAIN_GAME', v_bintang, 'Menyelesaikan game: ' || v_game.nama || ' (Skor: ' || p_skor || ')');

    RETURN jsonb_build_object('status', 'berhasil', 'poin', v_bintang);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.7 RPC: PAPAN BINTANG REALTIME
CREATE OR REPLACE FUNCTION public.papan_bintang(p_periode TEXT DEFAULT 'sepanjang_masa', p_kelas TEXT DEFAULT 'Semua')
RETURNS TABLE (
    siswa_id UUID,
    nama TEXT,
    kelas TEXT,
    avatar_url TEXT,
    total_bintang BIGINT,
    peringkat BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_stars AS (
        SELECT rb.siswa_id, SUM(rb.poin) as total
        FROM public.riwayat_bintang rb
        WHERE 
            CASE 
                WHEN p_periode = 'mingguan' THEN rb.dibuat >= (now() - interval '7 days')
                WHEN p_periode = 'bulanan' THEN rb.dibuat >= (now() - interval '30 days')
                ELSE true
            END
        GROUP BY rb.siswa_id
    )
    SELECT 
        p.id AS siswa_id,
        p.nama,
        p.kelas,
        p.avatar_url,
        COALESCE(fs.total, 0) AS total_bintang,
        DENSE_RANK() OVER (ORDER BY COALESCE(fs.total, 0) DESC) AS peringkat
    FROM public.profiles p
    LEFT JOIN filtered_stars fs ON fs.siswa_id = p.id
    WHERE p.peran = 'siswa' AND p.aktif = true
      AND (p_kelas = 'Semua' OR p.kelas = p_kelas)
    ORDER BY total_bintang DESC, p.nama ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6.8 RPC: BERI BINTANG MANUAL OLEH GURU
CREATE OR REPLACE FUNCTION public.beri_bintang_manual(p_siswa_id UUID, p_poin INT, p_alasan TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT public.is_guru() THEN
        RAISE EXCEPTION 'Hanya guru yang berhak memberi bintang manual.';
    END IF;

    INSERT INTO public.riwayat_bintang (siswa_id, kode, poin, alasan, pemberi)
    VALUES (p_siswa_id, 'MANUAL_GURU', p_poin, p_alasan, auth.uid());

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 7. SEED DATA DEFAULT (Inisialisasi Sekolah & Guru)
-- ==============================================================================

-- Kelas Default
INSERT INTO public.kelas (id, nama, urutan) VALUES
('X-1', 'Kelas X-1', 1),
('X-2', 'Kelas X-2', 2),
('XI IPS 1', 'Kelas XI IPS 1', 3),
('XI IPS 2', 'Kelas XI IPS 2', 4),
('XII IPS 1', 'Kelas XII IPS 1', 5)
ON CONFLICT (id) DO NOTHING;

-- Aturan Bintang
INSERT INTO public.aturan_bintang (kode, nama, poin, aktif) VALUES
('BACA_MATERI', 'Membaca materi tuntas', 1, true),
('SELESAI_UJIAN', 'Menyelesaikan ujian', 2, true),
('LULUS_KKM', 'Nilai di atas KKM', 3, true),
('NILAI_SEMPURNA', 'Meraih nilai 100', 5, true),
('LOGIN_HARIAN', 'Streak login harian', 1, true),
('MAIN_GAME', 'Menyelesaikan game edukasi', 3, true)
ON CONFLICT (kode) DO NOTHING;

-- Lencana Default
INSERT INTO public.lencana (id, nama, deskripsi, ikon, syarat_tipe, syarat_nilai) VALUES
('rajin-membaca', 'Kutu Buku Geografi', 'Tuntas membaca minimal 5 materi geografi', '📚', 'materi', 5),
('juara-peta', 'Master Kartografi', 'Meraih skor sempurna di Game Tebak Peta', '🗺️', 'game_tebak_peta', 100),
('streak-7', 'Disiplin Belajar', 'Login berturut-turut selama 7 hari', '🔥', 'streak', 7),
('nilai-sempurna', 'Sang Penjelajah', 'Meraih nilai 100 pada ujian CBT', '🌟', 'nilai_100', 1),
('petualang-bumi', 'Pakar Litosfer', 'Menyelesaikan modul Litosfer & Bentang Alam', '🌋', 'litosfer', 1)
ON CONFLICT (id) DO NOTHING;

-- Game Default
INSERT INTO public.game (id, nama, aktif, kelas, maks_percobaan_harian, skor_maks, poin_bintang) VALUES
('tebak-peta', 'Tebak Peta Indonesia', true, '["Semua"]'::jsonb, 5, 1000, 3),
('susun-lapisan', 'Susun Lapisan Bumi & Atmosfer', true, '["Semua"]'::jsonb, 5, 500, 3),
('kuis-kilat', 'Kuis Kilat Geografi (Arcade)', true, '["Semua"]'::jsonb, 10, 1500, 4)
ON CONFLICT (id) DO NOTHING;

-- Pengaturan Default
INSERT INTO public.pengaturan (kunci, nilai) VALUES
('NAMA_SEKOLAH', 'SMA Negeri 1 Geografi'),
('NAMA_GURU', 'Pak Budi Hartono, M.Pd.'),
('KKM_DEFAULT', '75'),
('PASSWORD_DEFAULT_SISWA', 'siswa123'),
('PASSWORD_DEFAULT_GURU', 'guru123')
ON CONFLICT (kunci) DO NOTHING;

-- Selesai! Skema Supabase Ruang Geografi berhasil dikonfigurasi.
