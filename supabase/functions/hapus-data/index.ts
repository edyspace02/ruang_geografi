// Supabase Edge Function: hapus-data
// Digunakan oleh Guru untuk membersihkan file di Supabase Storage & menghapus akun Siswa di Supabase Auth
// File ini berjalan di lingkungan aman server (Deno) menggunakan Service Role Key

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestPayload {
  kategori: string[]; // 'materi' | 'soal_ujian' | 'siswa'
  token: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Konfigurasi environment Supabase belum lengkap di server.');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Header Authorization diperlukan' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inisialisasi client admin dengan service_role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verifikasi JWT pengguna pemanggil
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token sesi tidak valid atau telah kedaluwarsa' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verifikasi peran pemanggil harus GURU
    const { data: profile, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('peran, nama')
      .eq('id', user.id)
      .single();

    if (profError || profile?.peran !== 'guru') {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Hanya akun guru yang diizinkan menjalankan fungsi ini.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: RequestPayload = await req.json();
    const { kategori } = payload;

    const hasil = {
      storage: {
        materi: 0,
        soal: 0,
        avatar: 0,
      },
      authSiswa: {
        berhasil: 0,
        gagal: 0,
      },
      errors: [] as string[],
    };

    // 3. PENGHAPUSAN FILE STORAGE DI BUCKET
    // Helper: Kosongkan isi bucket
    async function kosongkanBucket(bucketName: string): Promise<number> {
      try {
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from(bucketName)
          .list('', { limit: 500 });

        if (listError || !files || files.length === 0) return 0;

        const filePaths = files.map((f) => f.name).filter(Boolean);
        if (filePaths.length === 0) return 0;

        const { error: removeError } = await supabaseAdmin.storage
          .from(bucketName)
          .remove(filePaths);

        if (removeError) {
          hasil.errors.push(`Gagal menghapus file di bucket ${bucketName}: ${removeError.message}`);
          return 0;
        }

        return filePaths.length;
      } catch (err: any) {
        hasil.errors.push(`Error bucket ${bucketName}: ${err.message}`);
        return 0;
      }
    }

    // Bucket materi
    if (kategori.includes('materi')) {
      hasil.storage.materi = await kosongkanBucket('materi');
    }

    // Bucket soal
    if (kategori.includes('soal_ujian')) {
      hasil.storage.soal = await kosongkanBucket('soal');
    }

    // Bucket avatar (hanya avatar siswa)
    if (kategori.includes('siswa')) {
      hasil.storage.avatar = await kosongkanBucket('avatar');

      // 4. PENGHAPUSAN AKUN SISWA DARI SUPABASE AUTH (BATCHING)
      // Dapatkan semua user auth
      const { data: usersData, error: listUsersErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (!listUsersErr && usersData?.users) {
        // Filter HANYA siswa (@siswa.ruanggeografi.local)
        // PROTEKSI MUTLAK: Guru TIDAK PERNAH DIHAPUS
        const studentUsers = usersData.users.filter((u) => {
          const email = u.email || '';
          return (
            email.endsWith('@siswa.ruanggeografi.local') &&
            !email.endsWith('@guru.ruanggeografi.local') &&
            u.id !== user.id
          );
        });

        // Hapus secara kelompok (batching 10 per batch)
        const batchSize = 10;
        for (let i = 0; i < studentUsers.length; i += batchSize) {
          const batch = studentUsers.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (st) => {
              try {
                const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(st.id);
                if (delErr) {
                  hasil.authSiswa.gagal++;
                  hasil.errors.push(`Gagal hapus auth ${st.email}: ${delErr.message}`);
                } else {
                  hasil.authSiswa.berhasil++;
                }
              } catch (e: any) {
                hasil.authSiswa.gagal++;
                hasil.errors.push(`Exception auth ${st.email}: ${e.message}`);
              }
            })
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        waktu: new Date().toISOString(),
        hasil,
        pesan: 'Pembersihan Storage dan Akun Siswa selesai diproses.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Terjadi kesalahan pada Edge Function hapus-data',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
