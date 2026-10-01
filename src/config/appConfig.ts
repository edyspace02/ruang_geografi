import { AturanBintang, Lencana, PengaturanSekolah } from '../types';

export const DEFAULT_CONFIG: PengaturanSekolah = {
  namaSekolah: 'SMA Negeri 1 Geografi',
  namaGuru: 'Pak Budi Hartono, M.Pd.',
  kkmDefault: 75,
  passwordDefaultSiswa: 'siswa123',
  passwordDefaultGuru: 'guru123',
  supabaseUrl: '',
  supabaseAnonKey: '',
  supabaseConnected: false,
};

export const DAFTAR_KELAS = ['Semua', 'X-1', 'X-2', 'XI IPS 1', 'XI IPS 2', 'XII IPS 1'];

export const DAFTAR_BAB = [
  'Litosfer & Bentang Alam',
  'Pedosfer & Tanah',
  'Atmosfer & Iklim',
  'Hidrosfer & Perairan',
  'Biosfer & Persebaran Flora-Fauna',
  'Peta, Penginderaan Jauh & SIG',
  'Mitigasi Bencana Alam',
  'Dinamika Kependudukan',
];

export const ATURAN_BINTANG_DEFAULT: AturanBintang[] = [
  { kode: 'BACA_MATERI', nama: 'Membaca tuntas materi', poin: 1, aktif: true },
  { kode: 'SELESAI_UJIAN', nama: 'Menyelesaikan ujian CBT', poin: 2, aktif: true },
  { kode: 'LULUS_KKM', nama: 'Nilai di atas KKM', poin: 3, aktif: true },
  { kode: 'NILAI_SEMPURNA', nama: 'Meraih nilai sempurna 100', poin: 5, aktif: true },
  { kode: 'LOGIN_HARIAN', nama: 'Login harian berturut-turut', poin: 1, aktif: true },
  { kode: 'MAIN_GAME', nama: 'Menyelesaikan game edukasi', poin: 3, aktif: true },
];

export const LENCANA_DEFAULT: Lencana[] = [
  {
    id: 'rajin-membaca',
    nama: 'Kutu Buku Geografi',
    deskripsi: 'Tuntas membaca minimal 3 materi pelajaran geografi',
    ikon: '📚',
    syarat_tipe: 'materi',
    syarat_nilai: 3,
  },
  {
    id: 'juara-peta',
    nama: 'Master Kartografi',
    deskripsi: 'Menyelesaikan Game Tebak Peta dengan skor tinggi',
    ikon: '🗺️',
    syarat_tipe: 'game_tebak_peta',
    syarat_nilai: 500,
  },
  {
    id: 'streak-7',
    nama: 'Disiplin Belajar',
    deskripsi: 'Login aktif secara beruntun',
    ikon: '🔥',
    syarat_tipe: 'streak',
    syarat_nilai: 3,
  },
  {
    id: 'nilai-sempurna',
    nama: 'Bintang Prestasi',
    deskripsi: 'Mencetak nilai sempurna 100 pada ujian CBT',
    ikon: '🌟',
    syarat_tipe: 'nilai_100',
    syarat_nilai: 1,
  },
  {
    id: 'petualang-bumi',
    nama: 'Pakar Litosfer & Gunung Api',
    deskripsi: 'Menyelesaikan puzzle susun lapisan bumi',
    ikon: '🌋',
    syarat_tipe: 'game_lapisan',
    syarat_nilai: 1,
  },
  {
    id: 'juara-arcade',
    nama: 'Kilat Tangkas Geografi',
    deskripsi: 'Mencapai kombo tinggi di Kuis Kilat Geografi',
    ikon: '⚡',
    syarat_tipe: 'game_kuis_kilat',
    syarat_nilai: 500,
  },
];
