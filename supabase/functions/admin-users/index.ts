// Supabase Edge Function: admin-users
// Digunakan oleh Guru untuk membuat siswa massal, reset password, dan hapus akun secara aman
// Service role key HANYA berjalan di server (Edge Function) dan TIDAK PERNAH terekspos ke browser siswa.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Verifikasi bahwa user yang memanggil adalah GURU
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Tidak terautentikasi' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('peran')
      .eq('id', user.id)
      .single();

    if (profile?.peran !== 'guru') {
      return new Response(JSON.stringify({ error: 'Hanya guru yang berhak mengakses fungsi ini' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Inisialisasi Supabase Admin Client dengan Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { action } = body;

    // A. IMPOR SISWA MASSAL
    if (action === 'bulk_create') {
      const { students, defaultPassword = 'siswa123' } = body;
      // students: [{ nis: '1001', nama: 'Andi Pratama', kelas: 'X-1' }, ...]
      const results = [];

      for (const s of students) {
        const email = `${s.nis}@siswa.ruanggeografi.local`;
        try {
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { nama: s.nama, nis: s.nis, peran: 'siswa', kelas: s.kelas },
          });

          if (authError) {
            results.push({ nis: s.nis, success: false, error: authError.message });
          } else {
            // Upsert profile
            await supabaseAdmin.from('profiles').upsert({
              id: authData.user.id,
              username: s.nis,
              nama: s.nama,
              peran: 'siswa',
              kelas: s.kelas,
              wajib_ganti_password: true,
              aktif: true,
            });
            results.push({ nis: s.nis, success: true, id: authData.user.id });
          }
        } catch (err: any) {
          results.push({ nis: s.nis, success: false, error: err.message });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // B. RESET PASSWORD SISWA KE DEFAULT
    if (action === 'reset_password') {
      const { userId, newPassword = 'siswa123' } = body;
      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (resetError) throw resetError;

      await supabaseAdmin
        .from('profiles')
        .update({ wajib_ganti_password: true })
        .eq('id', userId);

      return new Response(JSON.stringify({ success: true, message: 'Password berhasil direset' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // C. HAPUS AKUN SISWA
    if (action === 'delete_user') {
      const { userId } = body;
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true, message: 'Akun berhasil dihapus' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Aksi tidak dikenali' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
