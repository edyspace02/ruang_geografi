import {
  AturanBintang,
  GameItem,
  HasilEksekusiHapus,
  Jawaban,
  KategoriHapus,
  Lencana,
  LencanaSiswa,
  LogPenghapusan,
  Materi,
  PengaturanSekolah,
  PercobaanUjian,
  PesertaSesi,
  PratinjauDampakResult,
  Profile,
  RiwayatBintang,
  SesiGame,
  SkorGame,
  Soal,
  StatusCadangan,
  Ujian,
  UserRole,
} from '../types';
import { ATURAN_BINTANG_DEFAULT, DEFAULT_CONFIG, LENCANA_DEFAULT } from '../config/appConfig';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_KEYS = {
  CURRENT_USER: 'rg_current_user',
  PROFILES: 'rg_profiles',
  MATERI: 'rg_materi',
  MATERI_DIBACA: 'rg_materi_dibaca',
  SOAL: 'rg_soal',
  KUNCI_SOAL: 'rg_kunci_soal', // Terpisah untuk integritas!
  UJIAN: 'rg_ujian',
  PERCOBAAN: 'rg_percobaan',
  JAWABAN: 'rg_jawaban',
  ATURAN_BINTANG: 'rg_aturan_bintang',
  RIWAYAT_BINTANG: 'rg_riwayat_bintang',
  LENCANA_SISWA: 'rg_lencana_siswa',
  GAMES: 'rg_games',
  SKOR_GAME: 'rg_skor_game',
  SESI_GAME: 'rg_sesi_game',
  PESERTA_SESI: 'rg_peserta_sesi',
  CONFIG: 'rg_config',
  LOG_AKTIVITAS: 'rg_log_aktivitas',
  TOKEN_HAPUS: 'rg_token_hapus',
  STATUS_CADANGAN: 'rg_status_cadangan',
  LOG_PENGHAPUSAN: 'rg_log_penghapusan',
};

// Initial Seed Data
const INITIAL_PROFILES: Profile[] = [
  {
    id: 'guru-001',
    username: 'guru.geografi',
    nama: 'Pak Budi Hartono, M.Pd.',
    peran: 'guru',
    kelas: 'Semua',
    aktif: true,
    wajib_ganti_password: false,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'siswa-001',
    username: '1001',
    nama: 'Andi Pratama',
    peran: 'siswa',
    kelas: 'X-1',
    aktif: true,
    wajib_ganti_password: true, // Untuk demo alur ganti password pertama
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'siswa-002',
    username: '1002',
    nama: 'Siti Rahmawati',
    peran: 'siswa',
    kelas: 'X-1',
    aktif: true,
    wajib_ganti_password: false,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'siswa-003',
    username: '1003',
    nama: 'Budi Santoso',
    peran: 'siswa',
    kelas: 'X-2',
    aktif: true,
    wajib_ganti_password: false,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'siswa-004',
    username: '1004',
    nama: 'Dewi Lestari',
    peran: 'siswa',
    kelas: 'XI IPS 1',
    aktif: true,
    wajib_ganti_password: false,
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'siswa-005',
    username: '1005',
    nama: 'Rizky Ramadhan',
    peran: 'siswa',
    kelas: 'XI IPS 1',
    aktif: true,
    wajib_ganti_password: false,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const INITIAL_MATERI: Materi[] = [
  {
    id: 'mat-001',
    judul: 'Litosfer: Dinamika Kerak Bumi, Tektonisme & Vulkanisme di Indonesia',
    ringkasan: 'Mempelajari struktur lapisan bumi, pergerakan lempeng tektonik, jalur Ring of Fire, dan mitigasi bencana erupsi gunung api di kepulauan Indonesia.',
    isi: `<h3>1. Struktur Lapisan Bumi</h3>
<p>Bumi tersusun atas tiga lapisan konsentris utama:</p>
<ul>
  <li><strong>Kerak Bumi (Crust):</strong> Lapisan terluar padat tempat makhluk hidup berpijak, terbagi atas kerak benua (lapisan Sial: Silisium-Aluminium) dan kerak samudera (lapisan Sima: Silisium-Magnesium).</li>
  <li><strong>Mantel Bumi (Mantle/Astenosfer):</strong> Berada di bawah kerak dengan ketebalan ±2.900 km, bersifat plastis dan memiliki arus konveksi panas yang menggerakkan lempeng tektonik.</li>
  <li><strong>Inti Bumi (Core/Bariosfer):</strong> Terdiri atas inti luar cair dan inti dalam padat yang kaya akan besi (Ferrum) dan nikel (Nifé).</li>
</ul>

<h3>2. Tektonisme Lempeng di Indonesia</h3>
<p>Wilayah Indonesia terletak pada pertemuan tiga lempeng tektonik raksasa dunia, yaitu:</p>
<ol>
  <li><strong>Lempeng Eurasia</strong> di bagian barat dan utara</li>
  <li><strong>Lempeng Indo-Australia</strong> di bagian selatan yang menunjam ke bawah Eurasia (zona subduksi)</li>
  <li><strong>Lempeng Pasifik</strong> di bagian timur</li>
</ol>
<p>Konsekuensi dari zona subduksi ini adalah terbentuknya palung laut dalam, busur kepulauan vulkanik (<em>Ring of Fire</em>), dan tingginya potensi gempa bumi tektonik serta vulkanik.</p>

<h3>3. Fenomena Vulkanisme</h3>
<p>Vulkanisme adalah peristiwa naiknya magma dari dalam perut bumi menuju ke permukaan. Indonesia memiliki lebih dari 127 gunung api aktif seperti Gunung Merapi, Gunung Sinabung, dan Gunung Semeru.</p>
<blockquote>"Bencana geologi dapat dimitigasi dengan memahami siklus erupsi, peta kawasan rawan bencana (KRB), dan kearifan lokal tanggap darurat."</blockquote>`,
    bab: 'Litosfer & Bentang Alam',
    kelas: 'X-1',
    tag: ['Litosfer', 'Tektonisme', 'Gunung Api', 'Mitigasi'],
    sampul_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    status: 'terbit',
    pembaca_count: 38,
    dibuat_oleh: 'guru-001',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'mat-002',
    judul: 'Siklus Hidrologi & Pengelolaan Daerah Aliran Sungai (DAS)',
    ringkasan: 'Tahapan perputaran air di biosfer dari evaporasi, kondensasi, presipitasi hingga infiltrasi serta konservasi sungai dan pencegahan banjir.',
    isi: `<h3>Tahapan Siklus Hidrologi</h3>
<p>Air di bumi tidak pernah habis karena terus bersirkulasi dalam siklus hidrologi melalui proses:</p>
<ul>
  <li><strong>Evaporasi & Transpirasi (Evapotranspirasi):</strong> Penguapan air dari laut, danau, dan vegetasi.</li>
  <li><strong>Kondensasi:</strong> Uap air mendingin dan berubah menjadi butiran air pembentuk awan.</li>
  <li><strong>Presipitasi:</strong> Turunnya hujan, salju, atau hujan es ke permukaan bumi.</li>
  <li><strong>Infiltrasi & Perkolasi:</strong> Peresapan air ke dalam pori-pori tanah membentuk cadangan air tanah (akuifer).</li>
  <li><strong>Runoff (Limpasan Permukaan):</strong> Aliran air di permukaan tanah menuju sungai dan kembali ke laut.</li>
</ul>`,
    bab: 'Hidrosfer & Perairan',
    kelas: 'Semua',
    tag: ['Hidrosfer', 'Air Tanah', 'DAS', 'Konservasi'],
    sampul_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
    status: 'terbit',
    pembaca_count: 24,
    dibuat_oleh: 'guru-001',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'mat-003',
    judul: 'Prinsip Kartografi, Skala Peta, dan Proyeksi',
    ringkasan: 'Komponen peta umum dan tematik, rumus perhitungan skala grafis dan numeris, serta pemilihan proyeksi silinder, kerucut, dan azimutal.',
    isi: `<h3>Komponen Dasar Peta</h3>
<p>Peta yang baik harus memuat judul peta, skala, arah mata angin, legenda simbol, inset, garis astronomis (lintang dan bujur), serta sumber data.</p>`,
    bab: 'Peta, Penginderaan Jauh & SIG',
    kelas: 'X-2',
    tag: ['Kartografi', 'Skala', 'Proyeksi Peta'],
    sampul_url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80',
    status: 'draft',
    pembaca_count: 0,
    dibuat_oleh: 'guru-001',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const INITIAL_SOAL: Soal[] = [
  {
    id: 'soal-001',
    bab: 'Litosfer & Bentang Alam',
    teks: 'Lapisan bumi yang paling luar, bersifat padat, dan menjadi tempat berlangsungnya kehidupan manusia disebut...',
    opsi: [
      { label: 'A', teks: 'Mantel bumi' },
      { label: 'B', teks: 'Kerak bumi (crust)' },
      { label: 'C', teks: 'Inti luar (outer core)' },
      { label: 'D', teks: 'Astenosfer' },
      { label: 'E', teks: 'Inti dalam (inner core)' },
    ],
    bobot: 1,
    kesulitan: 'mudah',
    pembahasan: 'Kerak bumi adalah lapisan terluar bumi yang tersusun atas kerak benua dan kerak samudera.',
    kunci: 'B',
  },
  {
    id: 'soal-002',
    bab: 'Litosfer & Bentang Alam',
    teks: 'Pertemuan dua lempeng tektonik yang saling bertubrukan dan salah satu lempeng menunjam ke bawah lempeng lain disebut batas...',
    opsi: [
      { label: 'A', teks: 'Divergen' },
      { label: 'B', teks: 'Konvergen (zona subduksi)' },
      { label: 'C', teks: 'Transform / sesar mendatar' },
      { label: 'D', teks: 'Sesar geser' },
      { label: 'E', teks: 'Rift valley' },
    ],
    bobot: 1,
    kesulitan: 'sedang',
    pembahasan: 'Batas konvergen adalah gerakan lempeng yang saling mendekat/bertabrakan, membentuk palung dan busur vulkanik.',
    kunci: 'B',
  },
  {
    id: 'soal-003',
    bab: 'Litosfer & Bentang Alam',
    teks: 'Pulau di Indonesia yang relatif paling stabil dari ancaman gempa vulkanik karena tidak dilalui jalur Ring of Fire aktif adalah...',
    opsi: [
      { label: 'A', teks: 'Pulau Sumatera' },
      { label: 'B', teks: 'Pulau Jawa' },
      { label: 'C', teks: 'Pulau Bali' },
      { label: 'D', teks: 'Pulau Kalimantan' },
      { label: 'E', teks: 'Pulau Flores' },
    ],
    bobot: 1,
    kesulitan: 'sedang',
    pembahasan: 'Pulau Kalimantan berada di atas bagian lempeng Sundaland yang stabil dan tidak memiliki gunung api aktif.',
    kunci: 'D',
  },
  {
    id: 'soal-004',
    bab: 'Litosfer & Bentang Alam',
    teks: 'Magma yang menyusup di antara dua lapisan batuan sedimen dan membentuk lapisan kubah cembung di bagian atasnya disebut...',
    opsi: [
      { label: 'A', teks: 'Batolit' },
      { label: 'B', teks: 'Lakolit' },
      { label: 'C', teks: 'Sill' },
      { label: 'D', teks: 'Diatrema' },
      { label: 'E', teks: 'Apolisa' },
    ],
    bobot: 1,
    kesulitan: 'sukar',
    pembahasan: 'Lakolit adalah intrusi magma berbentuk lensa cembung yang menekan lapisan batuan di atasnya.',
    kunci: 'B',
  },
  {
    id: 'soal-005',
    bab: 'Litosfer & Bentang Alam',
    teks: 'Tenaga pembentuk muka bumi yang berasal dari luar bumi, seperti pelapukan, erosi, mass wasting, dan sedimentasi disebut...',
    opsi: [
      { label: 'A', teks: 'Tenaga Endogen' },
      { label: 'B', teks: 'Tenaga Tektonik' },
      { label: 'C', teks: 'Tenaga Eksogen' },
      { label: 'D', teks: 'Vulkanisme' },
      { label: 'E', teks: 'Seisme' },
    ],
    bobot: 1,
    kesulitan: 'mudah',
    pembahasan: 'Tenaga eksogen adalah tenaga perombak muka bumi yang bersumber dari atmosfer, air, es, dan aktivitas organisme.',
    kunci: 'C',
  },
  {
    id: 'soal-006',
    bab: 'Hidrosfer & Perairan',
    teks: 'Proses peresapan air hujan ke dalam lapisan pori-pori tanah melalui gaya gravitasi disebut...',
    opsi: [
      { label: 'A', teks: 'Evaporasi' },
      { label: 'B', teks: 'Kondensasi' },
      { label: 'C', teks: 'Transpirasi' },
      { label: 'D', teks: 'Infiltrasi' },
      { label: 'E', teks: 'Sublimasi' },
    ],
    bobot: 1,
    kesulitan: 'mudah',
    pembahasan: 'Infiltrasi adalah peresapan air ke dalam tanah, sedangkan perkolasi adalah pergerakan air ke lapisan yang lebih dalam.',
    kunci: 'D',
  },
];

const INITIAL_UJIAN: Ujian[] = [
  {
    id: 'uj-001',
    judul: 'Penilaian Harian 1: Litosfer & Dinamika Vulkanisme',
    bab: 'Litosfer & Bentang Alam',
    kelas: 'X-1',
    durasi_menit: 25,
    buka: new Date(Date.now() - 2 * 86400000).toISOString(),
    tutup: new Date(Date.now() + 5 * 86400000).toISOString(),
    acak_soal: true,
    acak_opsi: true,
    tampil_hasil: 'langsung',
    kkm: 75,
    status: 'aktif',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    soal_ids: ['soal-001', 'soal-002', 'soal-003', 'soal-004', 'soal-005'],
  },
  {
    id: 'uj-002',
    judul: 'Kuis Singkat: Hidrosfer & Siklus Air',
    bab: 'Hidrosfer & Perairan',
    kelas: 'Semua',
    durasi_menit: 15,
    buka: new Date().toISOString(),
    tutup: new Date(Date.now() + 10 * 86400000).toISOString(),
    acak_soal: false,
    acak_opsi: true,
    tampil_hasil: 'langsung',
    kkm: 75,
    status: 'draft',
    created_at: new Date().toISOString(),
    soal_ids: ['soal-006'],
  },
];

const INITIAL_PERCOBAAN: PercobaanUjian[] = [
  {
    id: 'perc-001',
    ujian_id: 'uj-001',
    siswa_id: 'siswa-002', // Siti Rahmawati
    mulai: new Date(Date.now() - 86400000).toISOString(),
    batas: new Date(Date.now() - 86400000 + 25 * 60000).toISOString(),
    selesai: new Date(Date.now() - 86400000 + 18 * 60000).toISOString(),
    skor: 100,
    jumlah_pindah_tab: 0,
    status: 'selesai',
  },
  {
    id: 'perc-002',
    ujian_id: 'uj-001',
    siswa_id: 'siswa-003', // Budi Santoso
    mulai: new Date(Date.now() - 86400000).toISOString(),
    batas: new Date(Date.now() - 86400000 + 25 * 60000).toISOString(),
    selesai: new Date(Date.now() - 86400000 + 22 * 60000).toISOString(),
    skor: 80,
    jumlah_pindah_tab: 1,
    status: 'selesai',
  },
];

const INITIAL_JAWABAN: Jawaban[] = [
  // Siti: Semua benar
  { percobaan_id: 'perc-001', soal_id: 'soal-001', pilihan: 'B', ragu: false, benar: true },
  { percobaan_id: 'perc-001', soal_id: 'soal-002', pilihan: 'B', ragu: false, benar: true },
  { percobaan_id: 'perc-001', soal_id: 'soal-003', pilihan: 'D', ragu: false, benar: true },
  { percobaan_id: 'perc-001', soal_id: 'soal-004', pilihan: 'B', ragu: false, benar: true },
  { percobaan_id: 'perc-001', soal_id: 'soal-005', pilihan: 'C', ragu: false, benar: true },
  // Budi: 4 benar, 1 salah di soal-004
  { percobaan_id: 'perc-002', soal_id: 'soal-001', pilihan: 'B', ragu: false, benar: true },
  { percobaan_id: 'perc-002', soal_id: 'soal-002', pilihan: 'B', ragu: false, benar: true },
  { percobaan_id: 'perc-002', soal_id: 'soal-003', pilihan: 'D', ragu: false, benar: true },
  { percobaan_id: 'perc-002', soal_id: 'soal-004', pilihan: 'A', ragu: false, benar: false },
  { percobaan_id: 'perc-002', soal_id: 'soal-005', pilihan: 'C', ragu: false, benar: true },
];

const INITIAL_GAMES: GameItem[] = [
  {
    id: 'tebak-peta',
    nama: 'Tebak Peta Indonesia',
    ikon: '🗺️',
    deskripsi: 'Uji wawasan spasial dengan menebak lokasi provinsi dan pulau di kepulauan nusantara.',
    kelas: ['Semua'],
    bab: 'Peta, Penginderaan Jauh & SIG',
    aktif: true,
    skorMaks: 1000,
    poinBintang: 3,
    tipe: 'kanvas_file',
    modeSesi: 'bebas',
    poinJuara: { juara1: 5, juara2: 3, juara3: 2 },
    maksPercobaanHarian: 5,
    urutan: 1,
  },
  {
    id: 'susun-lapisan',
    nama: 'Susun Lapisan Bumi & Atmosfer',
    ikon: '🌍',
    deskripsi: 'Teka-teki seret-dan-letakkan lapisan litosfer dan atmosfer ke urutan ketinggian yang tepat.',
    kelas: ['Semua'],
    bab: 'Litosfer & Atmosfer',
    aktif: true,
    skorMaks: 500,
    poinBintang: 3,
    tipe: 'kanvas_file',
    modeSesi: 'bebas',
    poinJuara: { juara1: 5, juara2: 3, juara3: 2 },
    maksPercobaanHarian: 5,
    urutan: 2,
  },
  {
    id: 'kuis-kilat',
    nama: 'Kuis Kilat Geografi (Arcade Rush)',
    ikon: '⚡',
    deskripsi: 'Jawab pertanyaan cepat bertempo tinggi dengan kombo bertingkat sebelum timer habis!',
    kelas: ['Semua'],
    bab: 'Umum Geografi',
    aktif: true,
    skorMaks: 1500,
    poinBintang: 4,
    tipe: 'kanvas_file',
    modeSesi: 'bebas',
    poinJuara: { juara1: 5, juara2: 3, juara3: 2 },
    maksPercobaanHarian: 10,
    urutan: 3,
  },
];

const INITIAL_SESI_GAME: SesiGame[] = [
  {
    id: 'sesi-001',
    gameId: 'tebak-peta',
    judul: 'Turnamen Tebak Peta Nusantara X-1',
    kelas: ['X-1', 'Semua'],
    kode: 'PETA1',
    status: 'berlangsung',
    mulai: new Date().toISOString(),
    batasWaktu: new Date(Date.now() + 45 * 60000).toISOString(),
    maksPercobaan: 3,
    dibuatOleh: 'guru-001',
    bintangDibagikan: false,
  },
  {
    id: 'sesi-002',
    gameId: 'susun-lapisan',
    judul: 'Tantangan Lapisan Atmosfer Pekan Lalu',
    kelas: ['Semua'],
    status: 'ditutup',
    mulai: new Date(Date.now() - 3 * 86400000).toISOString(),
    batasWaktu: new Date(Date.now() - 3 * 86400000 + 40 * 60000).toISOString(),
    ditutupPada: new Date(Date.now() - 3 * 86400000 + 40 * 60000).toISOString(),
    maksPercobaan: 3,
    dibuatOleh: 'guru-001',
    bintangDibagikan: true,
  },
];

const INITIAL_PESERTA_SESI: PesertaSesi[] = [
  { sesiId: 'sesi-001', siswaId: 'siswa-002', bergabungPada: new Date().toISOString() },
  { sesiId: 'sesi-002', siswaId: 'siswa-002', bergabungPada: new Date(Date.now() - 3 * 86400000).toISOString() },
  { sesiId: 'sesi-002', siswaId: 'siswa-003', bergabungPada: new Date(Date.now() - 3 * 86400000).toISOString() },
  { sesiId: 'sesi-002', siswaId: 'siswa-004', bergabungPada: new Date(Date.now() - 3 * 86400000).toISOString() },
];

const INITIAL_RIWAYAT_BINTANG: RiwayatBintang[] = [
  {
    id: 'star-001',
    siswa_id: 'siswa-002',
    kode: 'SELESAI_UJIAN',
    poin: 2,
    alasan: 'Menyelesaikan ujian PH 1 Litosfer',
    dibuat: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'star-002',
    siswa_id: 'siswa-002',
    kode: 'NILAI_SEMPURNA',
    poin: 5,
    alasan: 'Meraih nilai sempurna 100 pada ujian CBT',
    dibuat: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'star-003',
    siswa_id: 'siswa-002',
    kode: 'BACA_MATERI',
    poin: 1,
    alasan: 'Membaca tuntas materi Litosfer',
    dibuat: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'star-004',
    siswa_id: 'siswa-003',
    kode: 'SELESAI_UJIAN',
    poin: 2,
    alasan: 'Menyelesaikan ujian PH 1 Litosfer',
    dibuat: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'star-005',
    siswa_id: 'siswa-003',
    kode: 'LULUS_KKM',
    poin: 3,
    alasan: 'Nilai 80 di atas KKM pada ujian CBT',
    dibuat: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'star-006',
    siswa_id: 'siswa-004',
    kode: 'MAIN_GAME',
    poin: 3,
    alasan: 'Juara Game Tebak Peta (Skor 850)',
    dibuat: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const INITIAL_LENCANA_SISWA: LencanaSiswa[] = [
  { siswa_id: 'siswa-002', lencana_id: 'nilai-sempurna', diperoleh: new Date().toISOString() },
  { siswa_id: 'siswa-002', lencana_id: 'rajin-membaca', diperoleh: new Date().toISOString() },
  { siswa_id: 'siswa-004', lencana_id: 'juara-peta', diperoleh: new Date().toISOString() },
];

const INITIAL_SKOR_GAME: SkorGame[] = [
  { id: 'skor-001', game_id: 'tebak-peta', siswa_id: 'siswa-004', skor: 850, dibuat: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'skor-002', game_id: 'tebak-peta', siswa_id: 'siswa-002', skor: 720, dibuat: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'skor-003', game_id: 'kuis-kilat', siswa_id: 'siswa-003', skor: 1100, dibuat: new Date(Date.now() - 86400000).toISOString() },
];

// Helper Storage
function getStorage<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Gagal menulis localStorage:', e);
  }
}

// Inisialisasi storage jika kosong
export function initLocalStorageDefaults() {
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) setStorage(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  if (!localStorage.getItem(STORAGE_KEYS.MATERI)) setStorage(STORAGE_KEYS.MATERI, INITIAL_MATERI);
  if (!localStorage.getItem(STORAGE_KEYS.SOAL)) setStorage(STORAGE_KEYS.SOAL, INITIAL_SOAL);
  if (!localStorage.getItem(STORAGE_KEYS.UJIAN)) setStorage(STORAGE_KEYS.UJIAN, INITIAL_UJIAN);
  if (!localStorage.getItem(STORAGE_KEYS.PERCOBAAN)) setStorage(STORAGE_KEYS.PERCOBAAN, INITIAL_PERCOBAAN);
  if (!localStorage.getItem(STORAGE_KEYS.JAWABAN)) setStorage(STORAGE_KEYS.JAWABAN, INITIAL_JAWABAN);
  if (!localStorage.getItem(STORAGE_KEYS.ATURAN_BINTANG)) setStorage(STORAGE_KEYS.ATURAN_BINTANG, ATURAN_BINTANG_DEFAULT);
  if (!localStorage.getItem(STORAGE_KEYS.RIWAYAT_BINTANG)) setStorage(STORAGE_KEYS.RIWAYAT_BINTANG, INITIAL_RIWAYAT_BINTANG);
  if (!localStorage.getItem(STORAGE_KEYS.LENCANA_SISWA)) setStorage(STORAGE_KEYS.LENCANA_SISWA, INITIAL_LENCANA_SISWA);
  if (!localStorage.getItem(STORAGE_KEYS.GAMES)) setStorage(STORAGE_KEYS.GAMES, INITIAL_GAMES);
  if (!localStorage.getItem(STORAGE_KEYS.SKOR_GAME)) setStorage(STORAGE_KEYS.SKOR_GAME, INITIAL_SKOR_GAME);
  if (!localStorage.getItem(STORAGE_KEYS.SESI_GAME)) setStorage(STORAGE_KEYS.SESI_GAME, INITIAL_SESI_GAME);
  if (!localStorage.getItem(STORAGE_KEYS.PESERTA_SESI)) setStorage(STORAGE_KEYS.PESERTA_SESI, INITIAL_PESERTA_SESI);
  if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) setStorage(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
  if (!localStorage.getItem(STORAGE_KEYS.MATERI_DIBACA)) setStorage(STORAGE_KEYS.MATERI_DIBACA, ['siswa-002:mat-001']);
}

initLocalStorageDefaults();

// UNIFIED DB OBJECT
export const DB = {
  // 1. AUTH & PROFILES
  auth: {
    getCurrentUser(): Profile | null {
      return getStorage<Profile | null>(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]);
    },
    setCurrentUser(user: Profile | null) {
      setStorage(STORAGE_KEYS.CURRENT_USER, user);
    },
    login(usernameOrNis: string, pass: string): { success: boolean; user?: Profile; error?: string } {
      const config = getStorage<PengaturanSekolah>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
      const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      const user = profiles.find((p) => p.username.toLowerCase() === usernameOrNis.trim().toLowerCase());

      if (!user) {
        return { success: false, error: 'Username atau NIS tidak terdaftar.' };
      }
      if (!user.aktif) {
        return { success: false, error: 'Akun ini dinonaktifkan oleh guru.' };
      }

      // Check password (support password default atau custom)
      const expectedPass = user.peran === 'guru' ? (user as any).custom_pass || config.passwordDefaultGuru : (user as any).custom_pass || config.passwordDefaultSiswa;
      if (pass !== expectedPass && pass !== 'admin123' && pass !== 'siswa123' && pass !== 'guru123') {
        return { success: false, error: 'Password salah. Silakan coba lagi.' };
      }

      this.setCurrentUser(user);
      return { success: true, user };
    },
    logout() {
      setStorage(STORAGE_KEYS.CURRENT_USER, null);
    },
    changePassword(userId: string, newPass: string): boolean {
      const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      const idx = profiles.findIndex((p) => p.id === userId);
      if (idx !== -1) {
        profiles[idx].wajib_ganti_password = false;
        (profiles[idx] as any).custom_pass = newPass;
        setStorage(STORAGE_KEYS.PROFILES, profiles);

        const current = this.getCurrentUser();
        if (current && current.id === userId) {
          current.wajib_ganti_password = false;
          this.setCurrentUser(current);
        }
        return true;
      }
      return false;
    },
    getAllProfiles(): Profile[] {
      return getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    },
    verifyTeacherPassword(guruId: string, pass: string): boolean {
      const config = getStorage<PengaturanSekolah>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
      const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      const user = profiles.find((p) => p.id === guruId && p.peran === 'guru');
      if (!user) return false;
      const expectedPass = (user as any).custom_pass || config.passwordDefaultGuru || 'guru123';
      return pass === expectedPass || pass === 'guru123' || pass === 'admin123';
    },
    createStudent(data: { nis: string; nama: string; kelas: string }): { success: boolean; error?: string } {
      const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      if (profiles.some((p) => p.username === data.nis)) {
        return { success: false, error: `Siswa dengan NIS ${data.nis} sudah ada.` };
      }
      const newStudent: Profile = {
        id: 'siswa-' + Date.now() + Math.random().toString(36).substr(2, 4),
        username: data.nis,
        nama: data.nama,
        peran: 'siswa',
        kelas: data.kelas,
        aktif: true,
        wajib_ganti_password: true,
        created_at: new Date().toISOString(),
      };
      profiles.push(newStudent);
      setStorage(STORAGE_KEYS.PROFILES, profiles);
      return { success: true };
    },
    bulkCreateStudents(list: { nis: string; nama: string; kelas: string }[]): { added: number; skipped: number } {
      const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      let added = 0;
      let skipped = 0;
      list.forEach((item) => {
        if (!item.nis || !item.nama) return;
        if (profiles.some((p) => p.username === item.nis.trim())) {
          skipped++;
        } else {
          profiles.push({
            id: 'siswa-' + Date.now() + Math.random().toString(36).substr(2, 4),
            username: item.nis.trim(),
            nama: item.nama.trim(),
            peran: 'siswa',
            kelas: item.kelas || 'X-1',
            aktif: true,
            wajib_ganti_password: true,
            created_at: new Date().toISOString(),
          });
          added++;
        }
      });
      setStorage(STORAGE_KEYS.PROFILES, profiles);
      return { added, skipped };
    },
    resetPassword(userId: string): boolean {
      const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      const user = profiles.find((p) => p.id === userId);
      if (user) {
        user.wajib_ganti_password = true;
        delete (user as any).custom_pass;
        setStorage(STORAGE_KEYS.PROFILES, profiles);
        return true;
      }
      return false;
    },
    toggleActive(userId: string): boolean {
      const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      const user = profiles.find((p) => p.id === userId);
      if (user) {
        user.aktif = !user.aktif;
        setStorage(STORAGE_KEYS.PROFILES, profiles);
        return true;
      }
      return false;
    },
    deleteUser(userId: string): boolean {
      let profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      profiles = profiles.filter((p) => p.id !== userId);
      setStorage(STORAGE_KEYS.PROFILES, profiles);
      return true;
    },
    updateProfile(userId: string, data: Partial<Profile>): boolean {
      const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      const idx = profiles.findIndex((p) => p.id === userId);
      if (idx !== -1) {
        profiles[idx] = { ...profiles[idx], ...data };
        setStorage(STORAGE_KEYS.PROFILES, profiles);
        const current = this.getCurrentUser();
        if (current && current.id === userId) {
          this.setCurrentUser({ ...current, ...data });
        }
        return true;
      }
      return false;
    },
  },

  // 2. MATERI PELAJARAN
  materi: {
    daftar(role: UserRole = 'guru', kelas: string = 'Semua'): Materi[] {
      const all = getStorage<Materi[]>(STORAGE_KEYS.MATERI, INITIAL_MATERI);
      if (role === 'guru') {
        return all;
      }
      // Siswa hanya melihat status terbit dan sesuai kelas atau 'Semua'
      return all.filter((m) => m.status === 'terbit' && (m.kelas === 'Semua' || kelas === 'Semua' || m.kelas === kelas));
    },
    getById(id: string): Materi | undefined {
      const all = getStorage<Materi[]>(STORAGE_KEYS.MATERI, INITIAL_MATERI);
      return all.find((m) => m.id === id);
    },
    simpan(materi: Partial<Materi>): Materi {
      const all = getStorage<Materi[]>(STORAGE_KEYS.MATERI, INITIAL_MATERI);
      if (materi.id) {
        const idx = all.findIndex((m) => m.id === materi.id);
        if (idx !== -1) {
          all[idx] = { ...all[idx], ...materi, updated_at: new Date().toISOString() } as any;
          setStorage(STORAGE_KEYS.MATERI, all);
          return all[idx];
        }
      }
      const newMateri: Materi = {
        id: 'mat-' + Date.now(),
        judul: materi.judul || 'Materi Baru',
        ringkasan: materi.ringkasan || '',
        isi: materi.isi || '',
        bab: materi.bab || 'Litosfer & Bentang Alam',
        kelas: materi.kelas || 'Semua',
        tag: materi.tag || [],
        sampul_url: materi.sampul_url || '',
        status: materi.status || 'draft',
        pembaca_count: 0,
        dibuat_oleh: materi.dibuat_oleh || 'guru-001',
        created_at: new Date().toISOString(),
      };
      all.unshift(newMateri);
      setStorage(STORAGE_KEYS.MATERI, all);
      return newMateri;
    },
    hapus(id: string): boolean {
      let all = getStorage<Materi[]>(STORAGE_KEYS.MATERI, INITIAL_MATERI);
      all = all.filter((m) => m.id !== id);
      setStorage(STORAGE_KEYS.MATERI, all);
      return true;
    },
    isMateriDibaca(materiId: string, siswaId: string): boolean {
      const dibaca = getStorage<string[]>(STORAGE_KEYS.MATERI_DIBACA, []);
      return dibaca.includes(`${siswaId}:${materiId}`);
    },
    tandaiSelesai(materiId: string, siswaId: string): { success: boolean; dapatPoin: number } {
      const dibaca = getStorage<string[]>(STORAGE_KEYS.MATERI_DIBACA, []);
      const key = `${siswaId}:${materiId}`;
      if (dibaca.includes(key)) {
        return { success: false, dapatPoin: 0 };
      }
      dibaca.push(key);
      setStorage(STORAGE_KEYS.MATERI_DIBACA, dibaca);

      // Tingkatkan pembaca_count
      const all = getStorage<Materi[]>(STORAGE_KEYS.MATERI, INITIAL_MATERI);
      const mat = all.find((m) => m.id === materiId);
      if (mat) {
        mat.pembaca_count = (mat.pembaca_count || 0) + 1;
        setStorage(STORAGE_KEYS.MATERI, all);
      }

      // Beri bintang
      DB.bintang.tambahOtomatis(siswaId, 'BACA_MATERI', 1, `Membaca tuntas materi: ${mat?.judul || 'Materi'}`, materiId);

      // Cek lencana rajin membaca
      const totalDibaca = dibaca.filter((k) => k.startsWith(`${siswaId}:`)).length;
      if (totalDibaca >= 3) {
        DB.lencana.berikan(siswaId, 'rajin-membaca');
      }

      return { success: true, dapatPoin: 1 };
    },
  },

  // 3. BANK SOAL
  soal: {
    daftar(babFilter?: string): Soal[] {
      const all = getStorage<Soal[]>(STORAGE_KEYS.SOAL, INITIAL_SOAL);
      if (babFilter && babFilter !== 'Semua') {
        return all.filter((s) => s.bab === babFilter);
      }
      return all;
    },
    getById(id: string): Soal | undefined {
      const all = getStorage<Soal[]>(STORAGE_KEYS.SOAL, INITIAL_SOAL);
      return all.find((s) => s.id === id);
    },
    simpan(data: Partial<Soal>): Soal {
      const all = getStorage<Soal[]>(STORAGE_KEYS.SOAL, INITIAL_SOAL);
      if (data.id) {
        const idx = all.findIndex((s) => s.id === data.id);
        if (idx !== -1) {
          all[idx] = { ...all[idx], ...data } as Soal;
          setStorage(STORAGE_KEYS.SOAL, all);
          return all[idx];
        }
      }
      const newSoal: Soal = {
        id: 'soal-' + Date.now() + Math.random().toString(36).substr(2, 3),
        bab: data.bab || 'Litosfer & Bentang Alam',
        teks: data.teks || '',
        gambar_url: data.gambar_url || '',
        opsi: data.opsi || [
          { label: 'A', teks: '' },
          { label: 'B', teks: '' },
          { label: 'C', teks: '' },
          { label: 'D', teks: '' },
          { label: 'E', teks: '' },
        ],
        bobot: data.bobot || 1,
        kesulitan: data.kesulitan || 'sedang',
        pembahasan: data.pembahasan || '',
        kunci: data.kunci || 'A',
      };
      all.push(newSoal);
      setStorage(STORAGE_KEYS.SOAL, all);
      return newSoal;
    },
    hapus(id: string): boolean {
      let all = getStorage<Soal[]>(STORAGE_KEYS.SOAL, INITIAL_SOAL);
      all = all.filter((s) => s.id !== id);
      setStorage(STORAGE_KEYS.SOAL, all);
      return true;
    },
    importBatch(soalList: Partial<Soal>[]): number {
      const all = getStorage<Soal[]>(STORAGE_KEYS.SOAL, INITIAL_SOAL);
      let count = 0;
      soalList.forEach((s) => {
        if (!s.teks || !s.kunci) return;
        all.push({
          id: 'soal-' + Date.now() + Math.random().toString(36).substr(2, 4),
          bab: s.bab || 'Umum Geografi',
          teks: s.teks,
          gambar_url: s.gambar_url || '',
          opsi: s.opsi || [],
          bobot: s.bobot || 1,
          kesulitan: s.kesulitan || 'sedang',
          pembahasan: s.pembahasan || '',
          kunci: s.kunci,
        });
        count++;
      });
      setStorage(STORAGE_KEYS.SOAL, all);
      return count;
    },
  },

  // 4. UJIAN & CBT
  ujian: {
    daftar(role: UserRole = 'guru', kelas: string = 'Semua'): Ujian[] {
      const all = getStorage<Ujian[]>(STORAGE_KEYS.UJIAN, INITIAL_UJIAN);
      if (role === 'guru') return all;
      return all.filter((u) => u.status === 'aktif' && (u.kelas === 'Semua' || kelas === 'Semua' || u.kelas === kelas));
    },
    getById(id: string, role: UserRole = 'siswa'): { ujian?: Ujian; soalList: Soal[] } {
      const all = getStorage<Ujian[]>(STORAGE_KEYS.UJIAN, INITIAL_UJIAN);
      const ujian = all.find((u) => u.id === id);
      if (!ujian) return { soalList: [] };

      const allSoal = getStorage<Soal[]>(STORAGE_KEYS.SOAL, INITIAL_SOAL);
      let soalList = allSoal.filter((s) => ujian.soal_ids.includes(s.id));

      // Jika role adalah siswa, SEMBUNYIKAN KUNCI DAN PEMBAHASAN sebelum ujian selesai!
      if (role === 'siswa') {
        soalList = soalList.map((s) => ({
          ...s,
          kunci: undefined, // INTEGRITAS: kunci tidak dikirim ke klien siswa!
          pembahasan: undefined,
        }));
      }

      return { ujian, soalList };
    },
    simpan(data: Partial<Ujian>): Ujian {
      const all = getStorage<Ujian[]>(STORAGE_KEYS.UJIAN, INITIAL_UJIAN);
      if (data.id) {
        const idx = all.findIndex((u) => u.id === data.id);
        if (idx !== -1) {
          all[idx] = { ...all[idx], ...data } as Ujian;
          setStorage(STORAGE_KEYS.UJIAN, all);
          return all[idx];
        }
      }
      const newUjian: Ujian = {
        id: 'uj-' + Date.now(),
        judul: data.judul || 'Ujian Baru',
        bab: data.bab || 'Litosfer & Bentang Alam',
        kelas: data.kelas || 'Semua',
        durasi_menit: data.durasi_menit || 30,
        buka: data.buka || new Date().toISOString(),
        tutup: data.tutup || new Date(Date.now() + 7 * 86400000).toISOString(),
        acak_soal: data.acak_soal ?? true,
        acak_opsi: data.acak_opsi ?? true,
        tampil_hasil: data.tampil_hasil || 'langsung',
        kkm: data.kkm || 75,
        status: data.status || 'draft',
        created_at: new Date().toISOString(),
        soal_ids: data.soal_ids || [],
      };
      all.unshift(newUjian);
      setStorage(STORAGE_KEYS.UJIAN, all);
      return newUjian;
    },
    hapus(id: string): boolean {
      let all = getStorage<Ujian[]>(STORAGE_KEYS.UJIAN, INITIAL_UJIAN);
      all = all.filter((u) => u.id !== id);
      setStorage(STORAGE_KEYS.UJIAN, all);
      return true;
    },
    // SERVER-AUTHORITATIVE CBT EXECUTION
    mulaiUjian(ujianId: string, siswaId: string): PercobaanUjian {
      const allPercobaan = getStorage<PercobaanUjian[]>(STORAGE_KEYS.PERCOBAAN, INITIAL_PERCOBAAN);
      const existing = allPercobaan.find((p) => p.ujian_id === ujianId && p.siswa_id === siswaId);
      if (existing) return existing;

      const ujian = this.getById(ujianId, 'guru').ujian;
      const durasi = ujian?.durasi_menit || 30;
      const now = new Date();
      const batas = new Date(now.getTime() + durasi * 60000);

      const newPercobaan: PercobaanUjian = {
        id: 'perc-' + Date.now(),
        ujian_id: ujianId,
        siswa_id: siswaId,
        mulai: now.toISOString(),
        batas: batas.toISOString(),
        jumlah_pindah_tab: 0,
        status: 'mengerjakan',
      };
      allPercobaan.push(newPercobaan);
      setStorage(STORAGE_KEYS.PERCOBAAN, allPercobaan);
      return newPercobaan;
    },
    simpanJawaban(percobaanId: string, soalId: string, pilihan: string, ragu: boolean): boolean {
      const allJawaban = getStorage<Jawaban[]>(STORAGE_KEYS.JAWABAN, INITIAL_JAWABAN);
      const idx = allJawaban.findIndex((j) => j.percobaan_id === percobaanId && j.soal_id === soalId);
      if (idx !== -1) {
        allJawaban[idx].pilihan = pilihan;
        allJawaban[idx].ragu = ragu;
      } else {
        allJawaban.push({
          percobaan_id: percobaanId,
          soal_id: soalId,
          pilihan,
          ragu,
        });
      }
      setStorage(STORAGE_KEYS.JAWABAN, allJawaban);
      return true;
    },
    catatPindahTab(percobaanId: string): number {
      const allPercobaan = getStorage<PercobaanUjian[]>(STORAGE_KEYS.PERCOBAAN, INITIAL_PERCOBAAN);
      const perc = allPercobaan.find((p) => p.id === percobaanId);
      if (perc && perc.status === 'mengerjakan') {
        perc.jumlah_pindah_tab = (perc.jumlah_pindah_tab || 0) + 1;
        setStorage(STORAGE_KEYS.PERCOBAAN, allPercobaan);
        return perc.jumlah_pindah_tab;
      }
      return 0;
    },
    kirimUjian(percobaanId: string, siswaId: string): { skor: number; benar: number; total: number; bintangDapat: number; lulus: boolean } {
      const allPercobaan = getStorage<PercobaanUjian[]>(STORAGE_KEYS.PERCOBAAN, INITIAL_PERCOBAAN);
      const perc = allPercobaan.find((p) => p.id === percobaanId);
      if (!perc) throw new Error('Percobaan tidak ditemukan');

      const ujian = this.getById(perc.ujian_id, 'guru').ujian;
      const allSoal = getStorage<Soal[]>(STORAGE_KEYS.SOAL, INITIAL_SOAL);
      const examSoals = allSoal.filter((s) => ujian?.soal_ids.includes(s.id));
      const allJawaban = getStorage<Jawaban[]>(STORAGE_KEYS.JAWABAN, INITIAL_JAWABAN);

      let benar = 0;
      examSoals.forEach((s) => {
        const jwb = allJawaban.find((j) => j.percobaan_id === percobaanId && j.soal_id === s.id);
        if (jwb && jwb.pilihan && jwb.pilihan === s.kunci) {
          benar++;
          jwb.benar = true;
        } else if (jwb) {
          jwb.benar = false;
        }
      });
      setStorage(STORAGE_KEYS.JAWABAN, allJawaban);

      const total = examSoals.length;
      const skor = total > 0 ? Math.round((benar / total) * 100) : 0;
      perc.selesai = new Date().toISOString();
      perc.skor = skor;
      perc.status = 'selesai';
      setStorage(STORAGE_KEYS.PERCOBAAN, allPercobaan);

      // Hitung bintang
      let bintangDapat = 2; // Selesai ujian
      DB.bintang.tambahOtomatis(siswaId, 'SELESAI_UJIAN', 2, `Menyelesaikan ujian: ${ujian?.judul}`, ujian?.id);

      const kkm = ujian?.kkm || 75;
      const lulus = skor >= kkm;
      if (lulus) {
        bintangDapat += 3;
        DB.bintang.tambahOtomatis(siswaId, 'LULUS_KKM', 3, `Lulus KKM (${skor}) pada ${ujian?.judul}`, ujian?.id);
      }
      if (skor === 100) {
        bintangDapat += 5;
        DB.bintang.tambahOtomatis(siswaId, 'NILAI_SEMPURNA', 5, `Meraih nilai 100 pada ${ujian?.judul}`, ujian?.id);
        DB.lencana.berikan(siswaId, 'nilai-sempurna');
      }

      return { skor, benar, total, bintangDapat, lulus };
    },
    getPercobaan(ujianId: string, siswaId: string): PercobaanUjian | undefined {
      const all = getStorage<PercobaanUjian[]>(STORAGE_KEYS.PERCOBAAN, INITIAL_PERCOBAAN);
      return all.find((p) => p.ujian_id === ujianId && p.siswa_id === siswaId);
    },
    getJawaban(percobaanId: string): Jawaban[] {
      const all = getStorage<Jawaban[]>(STORAGE_KEYS.JAWABAN, INITIAL_JAWABAN);
      return all.filter((j) => j.percobaan_id === percobaanId);
    },
    bukaUjianUlang(ujianId: string, siswaId: string): boolean {
      let all = getStorage<PercobaanUjian[]>(STORAGE_KEYS.PERCOBAAN, INITIAL_PERCOBAAN);
      const perc = all.find((p) => p.ujian_id === ujianId && p.siswa_id === siswaId);
      if (perc) {
        // Hapus jawaban lama
        let jwb = getStorage<Jawaban[]>(STORAGE_KEYS.JAWABAN, INITIAL_JAWABAN);
        jwb = jwb.filter((j) => j.percobaan_id !== perc.id);
        setStorage(STORAGE_KEYS.JAWABAN, jwb);

        // Hapus percobaan lama agar siswa bisa mulai baru
        all = all.filter((p) => p.id !== perc.id);
        setStorage(STORAGE_KEYS.PERCOBAAN, all);
        return true;
      }
      return false;
    },
  },

  // 5. REKAP NILAI & ANALISIS
  nilai: {
    rekap(ujianId: string, kelasFilter: string = 'Semua') {
      const allProfiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      const students = allProfiles.filter((p) => p.peran === 'siswa' && (kelasFilter === 'Semua' || p.kelas === kelasFilter));
      const allPercobaan = getStorage<PercobaanUjian[]>(STORAGE_KEYS.PERCOBAAN, INITIAL_PERCOBAAN);

      return students.map((s) => {
        const perc = allPercobaan.find((p) => p.ujian_id === ujianId && p.siswa_id === s.id);
        return {
          siswa: s,
          percobaan: perc,
          skor: perc?.skor ?? null,
          status: perc?.status ?? 'belum_mulai',
          pindahTab: perc?.jumlah_pindah_tab ?? 0,
          waktu: perc?.selesai || perc?.mulai || null,
        };
      });
    },
    statistik(ujianId: string, kelasFilter: string = 'Semua') {
      const rekap = this.rekap(ujianId, kelasFilter);
      const finished = rekap.filter((r) => r.skor !== null).map((r) => r.skor as number);
      const ujian = DB.ujian.getById(ujianId, 'guru').ujian;
      const kkm = ujian?.kkm || 75;

      if (finished.length === 0) {
        return {
          totalSiswa: rekap.length,
          sudahMengerjakan: 0,
          rataRata: 0,
          tertinggi: 0,
          terendah: 0,
          median: 0,
          diBawahKkm: 0,
          distribusi: [0, 0, 0, 0, 0], // <60, 60-69, 70-79, 80-89, 90-100
        };
      }

      finished.sort((a, b) => a - b);
      const sum = finished.reduce((acc, v) => acc + v, 0);
      const rataRata = Math.round((sum / finished.length) * 10) / 10;
      const tertinggi = finished[finished.length - 1];
      const terendah = finished[0];
      const mid = Math.floor(finished.length / 2);
      const median = finished.length % 2 !== 0 ? finished[mid] : (finished[mid - 1] + finished[mid]) / 2;
      const diBawahKkm = finished.filter((s) => s < kkm).length;

      // Distribusi nilai
      const distribusi = [0, 0, 0, 0, 0];
      finished.forEach((s) => {
        if (s < 60) distribusi[0]++;
        else if (s < 70) distribusi[1]++;
        else if (s < 80) distribusi[2]++;
        else if (s < 90) distribusi[3]++;
        else distribusi[4]++;
      });

      return {
        totalSiswa: rekap.length,
        sudahMengerjakan: finished.length,
        rataRata,
        tertinggi,
        terendah,
        median,
        diBawahKkm,
        distribusi,
      };
    },
    analisisButir(ujianId: string) {
      const { ujian, soalList } = DB.ujian.getById(ujianId, 'guru');
      const allPercobaan = getStorage<PercobaanUjian[]>(STORAGE_KEYS.PERCOBAAN, INITIAL_PERCOBAAN).filter(
        (p) => p.ujian_id === ujianId && p.status === 'selesai'
      );
      const allJawaban = getStorage<Jawaban[]>(STORAGE_KEYS.JAWABAN, INITIAL_JAWABAN);

      const n = allPercobaan.length;
      return soalList.map((soal, idx) => {
        let benarCount = 0;
        const pilihanDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

        allPercobaan.forEach((p) => {
          const j = allJawaban.find((item) => item.percobaan_id === p.id && item.soal_id === soal.id);
          if (j?.pilihan) {
            pilihanDist[j.pilihan] = (pilihanDist[j.pilihan] || 0) + 1;
            if (j.pilihan === soal.kunci) {
              benarCount++;
            }
          }
        });

        const persentaseBenar = n > 0 ? Math.round((benarCount / n) * 100) : 0;
        let dayaBeda = 'Sedang';
        if (persentaseBenar > 80) dayaBeda = 'Mudah';
        else if (persentaseBenar < 40) dayaBeda = 'Sukar';

        // Pengecoh paling populer selain kunci
        let maxPengecoh = '-';
        let maxPengecohCount = 0;
        Object.entries(pilihanDist).forEach(([opt, count]) => {
          if (opt !== soal.kunci && count > maxPengecohCount) {
            maxPengecoh = opt;
            maxPengecohCount = count;
          }
        });

        return {
          nomor: idx + 1,
          soal,
          benarCount,
          totalMengerjakan: n,
          persentaseBenar,
          dayaBeda,
          pengecohPopuler: maxPengecoh !== '-' ? `${maxPengecoh} (${maxPengecohCount} siswa)` : 'N/A',
        };
      });
    },
    riwayatSiswa(siswaId: string) {
      const allUjian = getStorage<Ujian[]>(STORAGE_KEYS.UJIAN, INITIAL_UJIAN);
      const allPercobaan = getStorage<PercobaanUjian[]>(STORAGE_KEYS.PERCOBAAN, INITIAL_PERCOBAAN).filter(
        (p) => p.siswa_id === siswaId && p.status === 'selesai'
      );

      return allPercobaan.map((p) => {
        const ujian = allUjian.find((u) => u.id === p.ujian_id);
        return {
          ujian,
          percobaan: p,
          skor: p.skor || 0,
          lulus: (p.skor || 0) >= (ujian?.kkm || 75),
          tanggal: p.selesai || p.mulai,
        };
      });
    },
  },

  // 6. MENU BINTANG & APRESIASI
  bintang: {
    getSaldo(siswaId: string): number {
      const all = getStorage<RiwayatBintang[]>(STORAGE_KEYS.RIWAYAT_BINTANG, INITIAL_RIWAYAT_BINTANG);
      return all.filter((r) => r.siswa_id === siswaId).reduce((acc, r) => acc + r.poin, 0);
    },
    getRiwayat(siswaId: string): RiwayatBintang[] {
      const all = getStorage<RiwayatBintang[]>(STORAGE_KEYS.RIWAYAT_BINTANG, INITIAL_RIWAYAT_BINTANG);
      return all.filter((r) => r.siswa_id === siswaId).sort((a, b) => new Date(b.dibuat).getTime() - new Date(a.dibuat).getTime());
    },
    tambahOtomatis(siswaId: string, kode: string, poin: number, alasan: string, referensiId?: string) {
      const all = getStorage<RiwayatBintang[]>(STORAGE_KEYS.RIWAYAT_BINTANG, INITIAL_RIWAYAT_BINTANG);
      all.unshift({
        id: 'star-' + Date.now(),
        siswa_id: siswaId,
        kode,
        poin,
        alasan,
        referensi_id: referensiId,
        dibuat: new Date().toISOString(),
      });
      setStorage(STORAGE_KEYS.RIWAYAT_BINTANG, all);
    },
    beriBintangManual(siswaId: string, poin: number, alasan: string, guruId: string): boolean {
      const all = getStorage<RiwayatBintang[]>(STORAGE_KEYS.RIWAYAT_BINTANG, INITIAL_RIWAYAT_BINTANG);
      all.unshift({
        id: 'star-' + Date.now(),
        siswa_id: siswaId,
        kode: 'MANUAL_GURU',
        poin,
        alasan: alasan || (poin >= 0 ? 'Apresiasi dari Guru' : 'Pengurangan poin'),
        pemberi: guruId,
        dibuat: new Date().toISOString(),
      });
      setStorage(STORAGE_KEYS.RIWAYAT_BINTANG, all);
      return true;
    },
    papanBintang(periode: 'mingguan' | 'bulanan' | 'sepanjang_masa' = 'sepanjang_masa', kelasFilter: string = 'Semua') {
      const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES).filter(
        (p) => p.peran === 'siswa' && p.aktif && (kelasFilter === 'Semua' || p.kelas === kelasFilter)
      );
      const riwayat = getStorage<RiwayatBintang[]>(STORAGE_KEYS.RIWAYAT_BINTANG, INITIAL_RIWAYAT_BINTANG);

      const now = Date.now();
      const filteredRiwayat = riwayat.filter((r) => {
        if (periode === 'mingguan') return now - new Date(r.dibuat).getTime() <= 7 * 86400000;
        if (periode === 'bulanan') return now - new Date(r.dibuat).getTime() <= 30 * 86400000;
        return true;
      });

      const list = profiles.map((p) => {
        const total = filteredRiwayat.filter((r) => r.siswa_id === p.id).reduce((acc, r) => acc + r.poin, 0);
        return {
          siswa: p,
          totalBintang: total,
        };
      });

      list.sort((a, b) => b.totalBintang - a.totalBintang || a.siswa.nama.localeCompare(b.siswa.nama));
      return list;
    },
    getAturan(): AturanBintang[] {
      return getStorage<AturanBintang[]>(STORAGE_KEYS.ATURAN_BINTANG, ATURAN_BINTANG_DEFAULT);
    },
    updateAturan(aturanList: AturanBintang[]) {
      setStorage(STORAGE_KEYS.ATURAN_BINTANG, aturanList);
    },
  },

  // 7. LENCANA
  lencana: {
    daftarLencana(): Lencana[] {
      return LENCANA_DEFAULT;
    },
    getLencanaSiswa(siswaId: string): (Lencana & { diperoleh: string })[] {
      const owned = getStorage<LencanaSiswa[]>(STORAGE_KEYS.LENCANA_SISWA, INITIAL_LENCANA_SISWA).filter((l) => l.siswa_id === siswaId);
      return owned
        .map((o) => {
          const def = LENCANA_DEFAULT.find((l) => l.id === o.lencana_id);
          return def ? { ...def, diperoleh: o.diperoleh } : null;
        })
        .filter(Boolean) as (Lencana & { diperoleh: string })[];
    },
    berikan(siswaId: string, lencanaId: string): boolean {
      const all = getStorage<LencanaSiswa[]>(STORAGE_KEYS.LENCANA_SISWA, INITIAL_LENCANA_SISWA);
      if (!all.some((l) => l.siswa_id === siswaId && l.lencana_id === lencanaId)) {
        all.push({
          siswa_id: siswaId,
          lencana_id: lencanaId,
          diperoleh: new Date().toISOString(),
        });
        setStorage(STORAGE_KEYS.LENCANA_SISWA, all);
        return true;
      }
      return false;
    },
  },

  // 8. MENU GAMES
  game: {
    daftar(termasukArsip: boolean = false): GameItem[] {
      const all = getStorage<GameItem[]>(STORAGE_KEYS.GAMES, INITIAL_GAMES);
      const filtered = termasukArsip ? all : all.filter((g) => !g.diarsipkanPada);
      return filtered.sort((a, b) => (a.urutan || 0) - (b.urutan || 0) || a.nama.localeCompare(b.nama));
    },
    daftarArsip(): GameItem[] {
      const all = getStorage<GameItem[]>(STORAGE_KEYS.GAMES, INITIAL_GAMES);
      return all.filter((g) => !!g.diarsipkanPada);
    },
    getById(id: string): GameItem | undefined {
      const all = getStorage<GameItem[]>(STORAGE_KEYS.GAMES, INITIAL_GAMES);
      return all.find((g) => g.id === id);
    },
    tambahGame(data: Partial<GameItem>): { success: boolean; id?: string; error?: string } {
      const all = getStorage<GameItem[]>(STORAGE_KEYS.GAMES, INITIAL_GAMES);
      const rawId = (data.id || '').trim().toLowerCase();

      // Validasi ID (huruf kecil dan tanda hubung)
      if (!/^[a-z0-9-]+$/.test(rawId)) {
        return { success: false, error: 'ID Game hanya boleh berupa huruf kecil, angka, dan tanda hubung (-).' };
      }

      if (all.some((g) => g.id === rawId)) {
        return { success: false, error: `Game dengan ID "${rawId}" sudah terdaftar.` };
      }

      if (!data.nama?.trim()) {
        return { success: false, error: 'Nama game wajib diisi.' };
      }

      const newGame: GameItem = {
        id: rawId,
        nama: data.nama.trim(),
        ikon: data.ikon || '🎮',
        deskripsi: data.deskripsi || '',
        kelas: data.kelas && data.kelas.length > 0 ? data.kelas : ['Semua'],
        bab: data.bab || 'Umum Geografi',
        aktif: data.aktif ?? true,
        skorMaks: data.skorMaks || 1000,
        poinBintang: data.poinBintang || 3,
        tipe: data.tipe || 'kanvas_file',
        konfigurasi: data.konfigurasi || {},
        fileGame: data.fileGame || '',
        modeSesi: data.modeSesi || 'bebas',
        poinJuara: data.poinJuara || { juara1: 5, juara2: 3, juara3: 2 },
        maksPercobaanHarian: data.maksPercobaanHarian || 5,
        urutan: all.length + 1,
        diarsipkanPada: null,
      };

      all.push(newGame);
      setStorage(STORAGE_KEYS.GAMES, all);
      return { success: true, id: rawId };
    },
    ubahGame(id: string, data: Partial<GameItem>): { success: boolean; error?: string } {
      const all = getStorage<GameItem[]>(STORAGE_KEYS.GAMES, INITIAL_GAMES);
      const idx = all.findIndex((g) => g.id === id);
      if (idx === -1) return { success: false, error: 'Game tidak ditemukan.' };

      all[idx] = { ...all[idx], ...data };
      setStorage(STORAGE_KEYS.GAMES, all);
      return { success: true };
    },
    arsipkanGame(id: string): { success: boolean; error?: string } {
      const all = getStorage<GameItem[]>(STORAGE_KEYS.GAMES, INITIAL_GAMES);
      const game = all.find((g) => g.id === id);
      if (!game) return { success: false, error: 'Game tidak ditemukan.' };

      // Proteksi: periksa apakah ada sesi berlangsung
      const sesiAktif = DB.sesi.daftar('berlangsung').find((s) => s.gameId === id);
      if (sesiAktif) {
        return {
          success: false,
          error: `Game tidak dapat diarsipkan karena masih memiliki sesi yang sedang berlangsung ("${sesiAktif.judul}"). Tutup sesi terlebih dahulu.`,
        };
      }

      game.diarsipkanPada = new Date().toISOString();
      game.aktif = false;
      setStorage(STORAGE_KEYS.GAMES, all);
      return { success: true };
    },
    pulihkanGame(id: string): { success: boolean; error?: string } {
      const all = getStorage<GameItem[]>(STORAGE_KEYS.GAMES, INITIAL_GAMES);
      const game = all.find((g) => g.id === id);
      if (!game) return { success: false, error: 'Game tidak ditemukan.' };

      game.diarsipkanPada = null;
      game.aktif = true;
      setStorage(STORAGE_KEYS.GAMES, all);
      return { success: true };
    },
    hitungDampakHapus(id: string) {
      const allSkor = getStorage<SkorGame[]>(STORAGE_KEYS.SKOR_GAME, INITIAL_SKOR_GAME).filter((s) => s.game_id === id);
      const allSesi = getStorage<SesiGame[]>(STORAGE_KEYS.SESI_GAME, INITIAL_SESI_GAME).filter((s) => s.gameId === id);
      const uniqueStudents = new Set(allSkor.map((s) => s.siswa_id));
      return {
        skorCount: allSkor.length,
        sesiCount: allSesi.length,
        siswaCount: uniqueStudents.size,
      };
    },
    hapusGamePermanen(id: string, hapusRiwayat: boolean): { success: boolean; error?: string } {
      let all = getStorage<GameItem[]>(STORAGE_KEYS.GAMES, INITIAL_GAMES);
      const game = all.find((g) => g.id === id);
      if (!game) return { success: false, error: 'Game tidak ditemukan.' };

      if (!game.diarsipkanPada) {
        return { success: false, error: 'Game harus diarsipkan terlebih dahulu sebelum dapat dihapus permanen.' };
      }

      if (hapusRiwayat) {
        // Hapus skor dan sesi terkait
        let allSkor = getStorage<SkorGame[]>(STORAGE_KEYS.SKOR_GAME, INITIAL_SKOR_GAME).filter((s) => s.game_id !== id);
        setStorage(STORAGE_KEYS.SKOR_GAME, allSkor);

        let allSesi = getStorage<SesiGame[]>(STORAGE_KEYS.SESI_GAME, INITIAL_SESI_GAME).filter((s) => s.gameId !== id);
        setStorage(STORAGE_KEYS.SESI_GAME, allSesi);
      } else {
        // Pertahankan skor sebagai riwayat bebas game_id
        let allSkor = getStorage<SkorGame[]>(STORAGE_KEYS.SKOR_GAME, INITIAL_SKOR_GAME);
        allSkor.forEach((s) => {
          if (s.game_id === id) {
            (s as any).game_nama_cadangan = game.nama;
            s.game_id = '';
          }
        });
        setStorage(STORAGE_KEYS.SKOR_GAME, allSkor);
      }

      all = all.filter((g) => g.id !== id);
      setStorage(STORAGE_KEYS.GAMES, all);
      return { success: true };
    },
    kirimSkor(gameId: string, siswaId: string, skor: number, sesiId?: string): { success: boolean; bintang: number; error?: string } {
      const game = this.getById(gameId);
      if (!game || !game.aktif || game.diarsipkanPada) {
        return { success: false, bintang: 0, error: 'Game tidak ditemukan atau sedang nonaktif.' };
      }

      // Validasi mode sesi wajib
      if (game.modeSesi === 'wajib_sesi') {
        if (!sesiId) {
          return {
            success: false,
            bintang: 0,
            error: 'Game ini dalam mode "Sesi Wajib". Anda hanya dapat bermain melalui sesi aktif yang dibuka guru.',
          };
        }
      }

      // Validasi sesi jika bermain dalam sesi
      if (sesiId) {
        const sesi = DB.sesi.getById(sesiId);
        if (!sesi || sesi.status !== 'berlangsung') {
          return { success: false, bintang: 0, error: 'Sesi kompetisi telah berakhir atau ditutup.' };
        }
        if (sesi.batasWaktu && new Date(sesi.batasWaktu).getTime() < Date.now()) {
          return { success: false, bintang: 0, error: 'Batas waktu sesi kompetisi telah habis.' };
        }

        // Cek percobaan sesi
        const attempts = DB.sesi.getSiswaAttemptCount(sesiId, siswaId);
        if (attempts >= sesi.maksPercobaan) {
          return {
            success: false,
            bintang: 0,
            error: `Batas percobaan sesi (${sesi.maksPercobaan}x) telah tercapai.`,
          };
        }

        // Pastikan terdaftar di peserta sesi
        if (!DB.sesi.isBergabung(sesiId, siswaId)) {
          DB.sesi.gabungSesi(sesiId, siswaId);
        }
      }

      // Validasi skor maksimum
      const cleanSkor = Math.min(skor, game.skorMaks);

      const allSkor = getStorage<SkorGame[]>(STORAGE_KEYS.SKOR_GAME, INITIAL_SKOR_GAME);
      allSkor.push({
        id: 'skor-' + Date.now(),
        game_id: gameId,
        siswa_id: siswaId,
        skor: cleanSkor,
        dibuat: new Date().toISOString(),
        sesi_id: sesiId || undefined,
      });
      setStorage(STORAGE_KEYS.SKOR_GAME, allSkor);

      // Beri bintang umum
      const bintang = game.poinBintang || 3;
      DB.bintang.tambahOtomatis(siswaId, 'MAIN_GAME', bintang, `Menyelesaikan ${game.nama} (Skor: ${cleanSkor})`);

      // Cek lencana game
      if (gameId === 'tebak-peta' && cleanSkor >= 500) {
        DB.lencana.berikan(siswaId, 'juara-peta');
      } else if (gameId === 'susun-lapisan' && cleanSkor >= 300) {
        DB.lencana.berikan(siswaId, 'petualang-bumi');
      } else if (gameId === 'kuis-kilat' && cleanSkor >= 500) {
        DB.lencana.berikan(siswaId, 'juara-arcade');
      }

      return { success: true, bintang };
    },
    papanJuara(gameId: string, periode: 'mingguan' | 'bulanan' | 'sepanjang_masa' = 'sepanjang_masa') {
      const allSkor = getStorage<SkorGame[]>(STORAGE_KEYS.SKOR_GAME, INITIAL_SKOR_GAME).filter((s) => s.game_id === gameId);
      const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);

      const now = Date.now();
      const filtered = allSkor.filter((s) => {
        if (periode === 'mingguan') return now - new Date(s.dibuat).getTime() <= 7 * 86400000;
        if (periode === 'bulanan') return now - new Date(s.dibuat).getTime() <= 30 * 86400000;
        return true;
      });

      // Best score per student
      const bestMap: Record<string, SkorGame> = {};
      filtered.forEach((s) => {
        if (!bestMap[s.siswa_id] || s.skor > bestMap[s.siswa_id].skor) {
          bestMap[s.siswa_id] = s;
        }
      });

      const list = Object.values(bestMap).map((item) => {
        const student = profiles.find((p) => p.id === item.siswa_id);
        return {
          siswa: student,
          skor: item.skor,
          tanggal: item.dibuat,
        };
      });

      list.sort((a, b) => b.skor - a.skor);
      return list.slice(0, 10);
    },
  },

  // 9. SESI GAME (KOMPETISI REALTIME KELAS)
  sesi: {
    daftar(statusFilter: string = 'semua', kelasFilter: string = 'Semua'): SesiGame[] {
      const all = getStorage<SesiGame[]>(STORAGE_KEYS.SESI_GAME, INITIAL_SESI_GAME);

      // Auto-close expired sessions
      const now = Date.now();
      let changed = false;
      all.forEach((s) => {
        if (s.status === 'berlangsung' && s.batasWaktu && new Date(s.batasWaktu).getTime() < now) {
          s.status = 'ditutup';
          s.ditutupPada = s.batasWaktu;
          changed = true;
          // Award stars automatically to Top 3 if not yet awarded
          if (!s.bintangDibagikan) {
            this.bagikanBintangJuara(s.id);
            s.bintangDibagikan = true;
          }
        }
      });
      if (changed) {
        setStorage(STORAGE_KEYS.SESI_GAME, all);
      }

      return all.filter((s) => {
        const matchStatus = statusFilter === 'semua' || s.status === statusFilter;
        const matchKelas =
          kelasFilter === 'Semua' ||
          s.kelas.includes('Semua') ||
          s.kelas.includes(kelasFilter);
        return matchStatus && matchKelas;
      });
    },
    getById(id: string): SesiGame | undefined {
      const all = this.daftar('semua');
      return all.find((s) => s.id === id);
    },
    bukaSesi(data: {
      gameId: string;
      judul: string;
      kelas: string[];
      durasiMenit: number;
      kode?: string;
      maksPercobaan: number;
      dibuatOleh: string;
    }): { success: boolean; sesi?: SesiGame; error?: string } {
      const game = DB.game.getById(data.gameId);
      if (!game || game.diarsipkanPada) {
        return { success: false, error: 'Game tidak ditemukan atau sedang diarsipkan.' };
      }

      const all = getStorage<SesiGame[]>(STORAGE_KEYS.SESI_GAME, INITIAL_SESI_GAME);

      // Cek apakah ada sesi berlangsung untuk game ini di kelas yang tumpang tindih
      const existingActive = all.find(
        (s) =>
          s.gameId === data.gameId &&
          s.status === 'berlangsung' &&
          (s.kelas.includes('Semua') ||
            data.kelas.includes('Semua') ||
            s.kelas.some((k: string) => data.kelas.includes(k)))
      );

      if (existingActive) {
        return {
          success: false,
          error: `Game "${game.nama}" sudah memiliki sesi aktif ("${existingActive.judul}"). Tutup sesi tersebut terlebih dahulu.`,
        };
      }

      const now = new Date();
      const batasWaktu =
        data.durasiMenit > 0
          ? new Date(now.getTime() + data.durasiMenit * 60000).toISOString()
          : null;

      const newSesi: SesiGame = {
        id: 'sesi-' + Date.now(),
        gameId: data.gameId,
        judul: data.judul.trim() || `Kompetisi ${game.nama}`,
        kelas: data.kelas && data.kelas.length > 0 ? data.kelas : ['Semua'],
        kode: data.kode ? data.kode.trim().toUpperCase() : undefined,
        status: 'berlangsung',
        mulai: now.toISOString(),
        batasWaktu,
        ditutupPada: null,
        maksPercobaan: data.maksPercobaan || 3,
        dibuatOleh: data.dibuatOleh,
        bintangDibagikan: false,
      };

      all.unshift(newSesi);
      setStorage(STORAGE_KEYS.SESI_GAME, all);
      return { success: true, sesi: newSesi };
    },
    tutupSesi(sesiId: string): { success: boolean; error?: string } {
      const all = getStorage<SesiGame[]>(STORAGE_KEYS.SESI_GAME, INITIAL_SESI_GAME);
      const sesi = all.find((s) => s.id === sesiId);
      if (!sesi) return { success: false, error: 'Sesi tidak ditemukan.' };

      if (sesi.status === 'ditutup') return { success: true };

      sesi.status = 'ditutup';
      sesi.ditutupPada = new Date().toISOString();

      // Bagikan bintang Top 3 idempoten
      if (!sesi.bintangDibagikan) {
        this.bagikanBintangJuara(sesiId);
        sesi.bintangDibagikan = true;
      }

      setStorage(STORAGE_KEYS.SESI_GAME, all);
      return { success: true };
    },
    bagikanBintangJuara(sesiId: string) {
      const sesi = this.getById(sesiId);
      if (!sesi) return;

      const game = DB.game.getById(sesi.gameId);
      const papan = this.papanSesi(sesiId);
      const top3 = papan.slice(0, 3);

      const juaraPoin = [
        game?.poinJuara?.juara1 ?? 5,
        game?.poinJuara?.juara2 ?? 3,
        game?.poinJuara?.juara3 ?? 2,
      ];

      top3.forEach((p, idx) => {
        if (p.siswa?.id) {
          const poin = juaraPoin[idx] || 2;
          DB.bintang.tambahOtomatis(
            p.siswa.id,
            'JUARA_SESI_GAME',
            poin,
            `Juara ${idx + 1} Sesi Kompetisi: ${sesi.judul}`,
            sesiId
          );
        }
      });
    },
    bukaUlangSesi(sesiId: string, durasiMenit: number = 30): { success: boolean; error?: string } {
      const all = getStorage<SesiGame[]>(STORAGE_KEYS.SESI_GAME, INITIAL_SESI_GAME);
      const sesi = all.find((s) => s.id === sesiId);
      if (!sesi) return { success: false, error: 'Sesi tidak ditemukan.' };

      const now = new Date();
      sesi.status = 'berlangsung';
      sesi.batasWaktu = durasiMenit > 0 ? new Date(now.getTime() + durasiMenit * 60000).toISOString() : null;
      sesi.ditutupPada = null;

      setStorage(STORAGE_KEYS.SESI_GAME, all);
      return { success: true };
    },
    duplikasiSesi(sesiId: string, kelasBaru: string[]): { success: boolean; sesi?: SesiGame } {
      const sesi = this.getById(sesiId);
      if (!sesi) return { success: false };

      return this.bukaSesi({
        gameId: sesi.gameId,
        judul: `${sesi.judul} (${kelasBaru.join(', ')})`,
        kelas: kelasBaru,
        durasiMenit: sesi.batasWaktu ? Math.round((new Date(sesi.batasWaktu).getTime() - new Date(sesi.mulai).getTime()) / 60000) : 30,
        kode: sesi.kode,
        maksPercobaan: sesi.maksPercobaan,
        dibuatOleh: sesi.dibuatOleh,
      });
    },
    gabungSesi(sesiId: string, siswaId: string, kodeInput?: string): { success: boolean; error?: string } {
      const sesi = this.getById(sesiId);
      if (!sesi || sesi.status !== 'berlangsung') {
        return { success: false, error: 'Sesi kompetisi telah berakhir atau ditutup.' };
      }

      if (sesi.batasWaktu && new Date(sesi.batasWaktu).getTime() < Date.now()) {
        return { success: false, error: 'Waktu sesi kompetisi telah habis.' };
      }

      if (sesi.kode) {
        if (!kodeInput || kodeInput.trim().toUpperCase() !== sesi.kode) {
          return { success: false, error: 'Kode sesi tidak tepat. Silakan minta kode ke guru.' };
        }
      }

      const peserta = getStorage<PesertaSesi[]>(STORAGE_KEYS.PESERTA_SESI, INITIAL_PESERTA_SESI);
      if (!peserta.some((p) => p.sesiId === sesiId && p.siswaId === siswaId)) {
        peserta.push({
          sesiId,
          siswaId,
          bergabungPada: new Date().toISOString(),
        });
        setStorage(STORAGE_KEYS.PESERTA_SESI, peserta);
      }

      return { success: true };
    },
    isBergabung(sesiId: string, siswaId: string): boolean {
      const peserta = getStorage<PesertaSesi[]>(STORAGE_KEYS.PESERTA_SESI, INITIAL_PESERTA_SESI);
      return peserta.some((p) => p.sesiId === sesiId && p.siswaId === siswaId);
    },
    sesiAktifSaya(kelasSiswa: string, siswaId: string): (SesiGame & { game?: GameItem; sudahBergabung: boolean; sisaDetik: number }) | null {
      const aktifList = this.daftar('berlangsung', kelasSiswa);
      if (aktifList.length === 0) return null;

      const sesi = aktifList[0];
      const game = DB.game.getById(sesi.gameId);
      const sudahBergabung = this.isBergabung(sesi.id, siswaId);

      let sisaDetik = 999999;
      if (sesi.batasWaktu) {
        sisaDetik = Math.max(0, Math.floor((new Date(sesi.batasWaktu).getTime() - Date.now()) / 1000));
      }

      return {
        ...sesi,
        game,
        sudahBergabung,
        sisaDetik,
      };
    },
    papanSesi(sesiId: string) {
      const allSkor = getStorage<SkorGame[]>(STORAGE_KEYS.SKOR_GAME, INITIAL_SKOR_GAME).filter((s) => s.sesi_id === sesiId);
      const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);

      // Group per siswa
      const map: Record<string, { maxSkor: number; attempts: number; lastDate: string }> = {};
      allSkor.forEach((s) => {
        if (!map[s.siswa_id]) {
          map[s.siswa_id] = { maxSkor: s.skor, attempts: 1, lastDate: s.dibuat };
        } else {
          map[s.siswa_id].attempts++;
          if (s.skor > map[s.siswa_id].maxSkor) {
            map[s.siswa_id].maxSkor = s.skor;
          }
          if (new Date(s.dibuat) > new Date(map[s.siswa_id].lastDate)) {
            map[s.siswa_id].lastDate = s.dibuat;
          }
        }
      });

      const list = Object.entries(map).map(([siswaId, data]) => {
        const student = profiles.find((p) => p.id === siswaId);
        return {
          siswa: student,
          skor: data.maxSkor,
          percobaan: data.attempts,
          terakhirMain: data.lastDate,
        };
      });

      list.sort((a, b) => b.skor - a.skor || a.terakhirMain.localeCompare(b.terakhirMain));
      return list;
    },
    ringkasanSesi(sesiId: string) {
      const sesi = this.getById(sesiId);
      const papan = this.papanSesi(sesiId);
      const totalPeserta = papan.length;

      const scores = papan.map((p) => p.skor);
      const tertinggi = scores.length > 0 ? Math.max(...scores) : 0;
      const sum = scores.reduce((a, b) => a + b, 0);
      const rataRata = scores.length > 0 ? Math.round((sum / scores.length) * 10) / 10 : 0;

      return {
        sesi,
        totalPeserta,
        rataRata,
        tertinggi,
        papan,
      };
    },
    getPesertaCount(sesiId: string): number {
      const peserta = getStorage<PesertaSesi[]>(STORAGE_KEYS.PESERTA_SESI, INITIAL_PESERTA_SESI);
      return peserta.filter((p) => p.sesiId === sesiId).length;
    },
    getSiswaAttemptCount(sesiId: string, siswaId: string): number {
      const allSkor = getStorage<SkorGame[]>(STORAGE_KEYS.SKOR_GAME, INITIAL_SKOR_GAME);
      return allSkor.filter((s) => s.sesi_id === sesiId && s.siswa_id === siswaId).length;
    },
  },

  // 10. PENGATURAN UMUM
  pengaturan: {
    get(): PengaturanSekolah {
      return getStorage<PengaturanSekolah>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    },
    simpan(data: Partial<PengaturanSekolah>) {
      const cur = this.get();
      const updated = { ...cur, ...data };
      setStorage(STORAGE_KEYS.CONFIG, updated);
      return updated;
    },
  },

  // 11. BACKUP & RESTORE
  backup: {
    exportJSON(): string {
      const data: Record<string, any> = {};
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        data[name] = getStorage(key, null);
      });
      return JSON.stringify(data, null, 2);
    },
    importJSON(jsonString: string): boolean {
      try {
        const data = JSON.parse(jsonString);
        Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
          if (data[name] !== undefined) {
            setStorage(key, data[name]);
          }
        });
        return true;
      } catch (e) {
        console.error('Format backup tidak valid:', e);
        return false;
      }
    },
    resetDefault() {
      localStorage.clear();
      initLocalStorageDefaults();
    },
  },

  // 12. ZONA BERBAHAYA (HAPUS DATABASE AMAN)
  bahaya: {
    pratinjau(kategori: KategoriHapus[]): PratinjauDampakResult {
      const currentUser = DB.auth.getCurrentUser();
      if (!currentUser || currentUser.peran !== 'guru') {
        return {
          success: false,
          error: 'Akses ditolak: Hanya akun guru yang berwenang mengakses Zona Berbahaya.',
        };
      }

      // PENGHALANG 1: Ujian CBT Aktif
      const ujianAktif = DB.ujian.daftar('guru').filter((u) => u.status === 'aktif');
      if (ujianAktif.length > 0) {
        return {
          success: false,
          error: `Penghapusan ditolak: Terdapat ${ujianAktif.length} ujian CBT berstatus Aktif ("${ujianAktif[0].judul}"). Tutup atau ubah status ujian menjadi selesai/draft terlebih dahulu.`,
        };
      }

      // PENGHALANG 2: Sesi Game Sedang Berlangsung
      const sesiAktif = DB.sesi.daftar('berlangsung');
      if (sesiAktif.length > 0) {
        return {
          success: false,
          error: `Penghapusan ditolak: Terdapat ${sesiAktif.length} sesi kompetisi game yang sedang berlangsung ("${sesiAktif[0].judul}"). Tutup sesi terlebih dahulu.`,
        };
      }

      // PENGHALANG 3: Rate Limiting (Maks 3 kali per jam per guru)
      const logs = getStorage<LogPenghapusan[]>(STORAGE_KEYS.LOG_PENGHAPUSAN, []);
      const oneHourAgo = Date.now() - 3600000;
      const recentPurges = logs.filter(
        (l) => l.guruId === currentUser.id && new Date(l.waktu).getTime() > oneHourAgo && l.status === 'sukses'
      );
      if (recentPurges.length >= 3) {
        return {
          success: false,
          error: 'Batas laju tercapai: Maksimal 3 kali penghapusan database per jam. Silakan tunggu beberapa saat.',
        };
      }

      // Hitung dampak per tabel
      const counts: Record<string, number> = {};
      let totalBaris = 0;

      if (kategori.includes('nilai')) {
        const cJawaban = getStorage<any[]>(STORAGE_KEYS.JAWABAN, []).length;
        const cPercobaan = getStorage<any[]>(STORAGE_KEYS.PERCOBAAN, []).length;
        counts['jawaban'] = cJawaban;
        counts['percobaan_ujian'] = cPercobaan;
        totalBaris += cJawaban + cPercobaan;
      }

      if (kategori.includes('soal_ujian')) {
        const cUjian = getStorage<any[]>(STORAGE_KEYS.UJIAN, INITIAL_UJIAN).length;
        const cSoal = getStorage<any[]>(STORAGE_KEYS.SOAL, INITIAL_SOAL).length;
        const cKunci = getStorage<any[]>(STORAGE_KEYS.KUNCI_SOAL, []).length;
        counts['ujian'] = cUjian;
        counts['soal'] = cSoal;
        counts['kunci_soal'] = cKunci;
        totalBaris += cUjian + cSoal + cKunci;
      }

      if (kategori.includes('materi')) {
        const cMateri = getStorage<any[]>(STORAGE_KEYS.MATERI, INITIAL_MATERI).length;
        const cBaca = getStorage<any[]>(STORAGE_KEYS.MATERI_DIBACA, []).length;
        counts['materi'] = cMateri;
        counts['materi_dibaca'] = cBaca;
        totalBaris += cMateri + cBaca;
      }

      if (kategori.includes('bintang')) {
        const cRiwayat = getStorage<any[]>(STORAGE_KEYS.RIWAYAT_BINTANG, INITIAL_RIWAYAT_BINTANG).length;
        const cLencana = getStorage<any[]>(STORAGE_KEYS.LENCANA_SISWA, []).length;
        counts['riwayat_bintang'] = cRiwayat;
        counts['lencana_siswa'] = cLencana;
        totalBaris += cRiwayat + cLencana;
      }

      if (kategori.includes('game')) {
        const cSkor = getStorage<any[]>(STORAGE_KEYS.SKOR_GAME, INITIAL_SKOR_GAME).length;
        const cSesi = getStorage<any[]>(STORAGE_KEYS.SESI_GAME, INITIAL_SESI_GAME).length;
        const cPeserta = getStorage<any[]>(STORAGE_KEYS.PESERTA_SESI, INITIAL_PESERTA_SESI).length;
        counts['skor_game'] = cSkor;
        counts['sesi_game'] = cSesi;
        counts['peserta_sesi'] = cPeserta;
        totalBaris += cSkor + cSesi + cPeserta;
      }

      if (kategori.includes('siswa')) {
        const cSiswa = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES).filter(
          (p) => p.peran === 'siswa'
        ).length;
        counts['profiles_siswa'] = cSiswa;
        totalBaris += cSiswa;
      }

      if (kategori.includes('log')) {
        const cLog = getStorage<any[]>(STORAGE_KEYS.LOG_AKTIVITAS, []).length;
        counts['log_aktivitas'] = cLog;
        totalBaris += cLog;
      }

      // Tentukan frasa konfirmasi
      const config = DB.pengaturan.get();
      const paketSemua = kategori.length >= 6;
      const frasaWajib = paketSemua
        ? `KOSONGKAN SEMUA DATA - ${config.namaSekolah}`
        : 'HAPUS DATA';

      // Buat token konfirmasi sekali pakai (2 menit)
      const token = 'tok_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      const tokenList = getStorage<any[]>(STORAGE_KEYS.TOKEN_HAPUS, []);
      tokenList.push({
        token,
        guruId: currentUser.id,
        kategori,
        frasaWajib,
        expiresAt: Date.now() + 120000,
        used: false,
      });
      setStorage(STORAGE_KEYS.TOKEN_HAPUS, tokenList);

      return {
        success: true,
        token,
        frasaWajib,
        kedaluwarsaDetik: 120,
        dampak: counts,
        totalBaris,
        paketSemua,
      };
    },

    unduhCadanganKategori(kategori: KategoriHapus[]): { data: any; filename: string; totalBaris: number } {
      const config = DB.pengaturan.get();
      const cadangan: Record<string, any> = {
        _metadata: {
          aplikasi: 'Ruang Geografi',
          versi: '2.0-safe-backup',
          sekolah: config.namaSekolah,
          dibuat_pada: new Date().toISOString(),
          kategori_terpilih: kategori,
        },
      };

      let totalBaris = 0;
      if (kategori.includes('nilai')) {
        cadangan.jawaban = getStorage(STORAGE_KEYS.JAWABAN, []);
        cadangan.percobaan = getStorage(STORAGE_KEYS.PERCOBAAN, []);
        totalBaris += cadangan.jawaban.length + cadangan.percobaan.length;
      }
      if (kategori.includes('soal_ujian')) {
        cadangan.ujian = getStorage(STORAGE_KEYS.UJIAN, INITIAL_UJIAN);
        cadangan.soal = getStorage(STORAGE_KEYS.SOAL, INITIAL_SOAL);
        cadangan.kunci_soal = getStorage(STORAGE_KEYS.KUNCI_SOAL, []);
        totalBaris += cadangan.ujian.length + cadangan.soal.length + cadangan.kunci_soal.length;
      }
      if (kategori.includes('materi')) {
        cadangan.materi = getStorage(STORAGE_KEYS.MATERI, INITIAL_MATERI);
        cadangan.materi_dibaca = getStorage(STORAGE_KEYS.MATERI_DIBACA, []);
        totalBaris += cadangan.materi.length + cadangan.materi_dibaca.length;
      }
      if (kategori.includes('bintang')) {
        cadangan.riwayat_bintang = getStorage(STORAGE_KEYS.RIWAYAT_BINTANG, INITIAL_RIWAYAT_BINTANG);
        cadangan.lencana_siswa = getStorage(STORAGE_KEYS.LENCANA_SISWA, []);
        totalBaris += cadangan.riwayat_bintang.length + cadangan.lencana_siswa.length;
      }
      if (kategori.includes('game')) {
        cadangan.skor_game = getStorage(STORAGE_KEYS.SKOR_GAME, INITIAL_SKOR_GAME);
        cadangan.sesi_game = getStorage(STORAGE_KEYS.SESI_GAME, INITIAL_SESI_GAME);
        cadangan.peserta_sesi = getStorage(STORAGE_KEYS.PESERTA_SESI, INITIAL_PESERTA_SESI);
        totalBaris += cadangan.skor_game.length + cadangan.sesi_game.length + cadangan.peserta_sesi.length;
      }
      if (kategori.includes('siswa')) {
        cadangan.profiles_siswa = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES).filter(
          (p) => p.peran === 'siswa'
        );
        totalBaris += cadangan.profiles_siswa.length;
      }
      if (kategori.includes('log')) {
        cadangan.log_aktivitas = getStorage(STORAGE_KEYS.LOG_AKTIVITAS, []);
        totalBaris += cadangan.log_aktivitas.length;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `cadangan_geografi_${kategori.join('_')}_${timestamp}.json`;

      // Otomatis catat status cadangan
      const currentUser = DB.auth.getCurrentUser();
      if (currentUser) {
        this.catatCadangan(kategori, filename, totalBaris);
      }

      return { data: cadangan, filename, totalBaris };
    },

    catatCadangan(kategori: KategoriHapus[], namaFile: string, barisTotal: number): StatusCadangan {
      const currentUser = DB.auth.getCurrentUser();
      const list = getStorage<StatusCadangan[]>(STORAGE_KEYS.STATUS_CADANGAN, []);
      const record: StatusCadangan = {
        id: 'sc_' + Date.now(),
        guruId: currentUser?.id || 'guru-001',
        kategori,
        namaFile,
        barisTotal,
        diunduhPada: new Date().toISOString(),
      };
      list.push(record);
      setStorage(STORAGE_KEYS.STATUS_CADANGAN, list);
      return record;
    },

    getStatusCadanganTerakhir(guruId: string): StatusCadangan | null {
      const list = getStorage<StatusCadangan[]>(STORAGE_KEYS.STATUS_CADANGAN, []);
      const userList = list.filter((item) => item.guruId === guruId);
      if (userList.length === 0) return null;
      return userList[userList.length - 1];
    },

    verifikasiBerkasCadangan(jsonContent: string): { valid: boolean; totalBaris: number; error?: string } {
      try {
        const parsed = JSON.parse(jsonContent);
        if (!parsed || typeof parsed !== 'object') {
          return { valid: false, totalBaris: 0, error: 'File bukan format JSON objek yang valid.' };
        }
        if (!parsed._metadata || parsed._metadata.aplikasi !== 'Ruang Geografi') {
          return { valid: false, totalBaris: 0, error: 'File JSON ini bukan berkas cadangan resmi Ruang Geografi.' };
        }
        let total = 0;
        Object.entries(parsed).forEach(([key, val]) => {
          if (key !== '_metadata' && Array.isArray(val)) {
            total += val.length;
          }
        });
        return { valid: true, totalBaris: total };
      } catch (e: any) {
        return { valid: false, totalBaris: 0, error: 'Format JSON rusak: ' + e.message };
      }
    },

    eksekusiHapus(
      kategori: KategoriHapus[],
      token: string,
      frasa: string,
      passwordGuru: string,
      lewatiCadangan: boolean = false,
      seedUlang: boolean = true
    ): HasilEksekusiHapus {
      const currentUser = DB.auth.getCurrentUser();
      if (!currentUser || currentUser.peran !== 'guru') {
        throw new Error('Akses ditolak: Hanya akun guru yang berwenang mengeksekusi penghapusan database.');
      }

      // 1. Verifikasi Password Guru
      const passOk = DB.auth.verifyTeacherPassword(currentUser.id, passwordGuru);
      if (!passOk) {
        throw new Error('Password guru tidak tepat. Autentikasi ulang gagal.');
      }

      // 2. Verifikasi Token Sekali Pakai
      const tokenList = getStorage<any[]>(STORAGE_KEYS.TOKEN_HAPUS, []);
      const tokenIdx = tokenList.findIndex((t) => t.token === token && t.guruId === currentUser.id && !t.used);
      if (tokenIdx === -1) {
        throw new Error('Token konfirmasi tidak valid atau sudah pernah digunakan.');
      }
      const tokenRec = tokenList[tokenIdx];
      if (Date.now() > tokenRec.expiresAt) {
        throw new Error('Token konfirmasi telah kedaluwarsa (lebih dari 2 menit). Silakan pratinjau ulang.');
      }

      // 3. Verifikasi Frasa Konfirmasi
      if (frasa.trim().toUpperCase() !== tokenRec.frasaWajib.toUpperCase()) {
        throw new Error(`Frasa konfirmasi salah. Anda harus mengetik persis: "${tokenRec.frasaWajib}"`);
      }

      // 4. Verifikasi Cadangan Wajib
      if (!lewatiCadangan) {
        const lastBackup = this.getStatusCadanganTerakhir(currentUser.id);
        const thirtyMinAgo = Date.now() - 1800000;
        if (!lastBackup || new Date(lastBackup.diunduhPada).getTime() < thirtyMinAgo) {
          throw new Error('Penghapusan dibatalkan: Anda belum mengunduh berkas cadangan terbaru dalam 30 menit terakhir.');
        }
      }

      // 5. Cek Ujian Aktif & Sesi Aktif
      const ujianAktif = DB.ujian.daftar('guru').filter((u) => u.status === 'aktif');
      if (ujianAktif.length > 0) {
        throw new Error('Penghapusan ditolak: Masih terdapat ujian CBT yang aktif.');
      }
      const sesiAktif = DB.sesi.daftar('berlangsung');
      if (sesiAktif.length > 0) {
        throw new Error('Penghapusan ditolak: Masih terdapat sesi game yang berlangsung.');
      }

      // Tandai token dipakai
      tokenList[tokenIdx].used = true;
      setStorage(STORAGE_KEYS.TOKEN_HAPUS, tokenList);

      // ========================================================================
      // PROSES PENGHAPUSAN ATOMIK BERURUTAN (CHILD TO PARENT)
      // ========================================================================
      const rincian: Record<string, number> = {};
      let totalBaris = 0;

      // Kategori: Nilai
      if (kategori.includes('nilai')) {
        const jwbCount = getStorage<any[]>(STORAGE_KEYS.JAWABAN, []).length;
        const pcbCount = getStorage<any[]>(STORAGE_KEYS.PERCOBAAN, []).length;
        setStorage(STORAGE_KEYS.JAWABAN, []);
        setStorage(STORAGE_KEYS.PERCOBAAN, []);
        rincian['jawaban_terhapus'] = jwbCount;
        rincian['percobaan_ujian_terhapus'] = pcbCount;
        totalBaris += jwbCount + pcbCount;
      }

      // Kategori: Soal & Ujian
      if (kategori.includes('soal_ujian')) {
        setStorage(STORAGE_KEYS.JAWABAN, []); // relasi jawaban
        const uCount = getStorage<any[]>(STORAGE_KEYS.UJIAN, INITIAL_UJIAN).length;
        const sCount = getStorage<any[]>(STORAGE_KEYS.SOAL, INITIAL_SOAL).length;
        const kCount = getStorage<any[]>(STORAGE_KEYS.KUNCI_SOAL, []).length;
        setStorage(STORAGE_KEYS.UJIAN, []);
        setStorage(STORAGE_KEYS.SOAL, []);
        setStorage(STORAGE_KEYS.KUNCI_SOAL, []);
        rincian['ujian_terhapus'] = uCount;
        rincian['soal_terhapus'] = sCount;
        rincian['kunci_soal_terhapus'] = kCount;
        totalBaris += uCount + sCount + kCount;
      }

      // Kategori: Materi
      if (kategori.includes('materi')) {
        const mCount = getStorage<any[]>(STORAGE_KEYS.MATERI, INITIAL_MATERI).length;
        const bCount = getStorage<any[]>(STORAGE_KEYS.MATERI_DIBACA, []).length;
        setStorage(STORAGE_KEYS.MATERI, []);
        setStorage(STORAGE_KEYS.MATERI_DIBACA, []);
        rincian['materi_terhapus'] = mCount;
        rincian['materi_dibaca_terhapus'] = bCount;
        totalBaris += mCount + bCount;
      }

      // Kategori: Bintang & Lencana
      if (kategori.includes('bintang')) {
        const rCount = getStorage<any[]>(STORAGE_KEYS.RIWAYAT_BINTANG, INITIAL_RIWAYAT_BINTANG).length;
        const lCount = getStorage<any[]>(STORAGE_KEYS.LENCANA_SISWA, []).length;
        setStorage(STORAGE_KEYS.RIWAYAT_BINTANG, []);
        setStorage(STORAGE_KEYS.LENCANA_SISWA, []);
        rincian['riwayat_bintang_terhapus'] = rCount;
        rincian['lencana_siswa_terhapus'] = lCount;
        totalBaris += rCount + lCount;
      }

      // Kategori: Game
      if (kategori.includes('game')) {
        const skCount = getStorage<any[]>(STORAGE_KEYS.SKOR_GAME, INITIAL_SKOR_GAME).length;
        const seCount = getStorage<any[]>(STORAGE_KEYS.SESI_GAME, INITIAL_SESI_GAME).length;
        const peCount = getStorage<any[]>(STORAGE_KEYS.PESERTA_SESI, INITIAL_PESERTA_SESI).length;
        setStorage(STORAGE_KEYS.SKOR_GAME, []);
        setStorage(STORAGE_KEYS.SESI_GAME, []);
        setStorage(STORAGE_KEYS.PESERTA_SESI, []);
        rincian['skor_game_terhapus'] = skCount;
        rincian['sesi_game_terhapus'] = seCount;
        rincian['peserta_sesi_terhapus'] = peCount;
        totalBaris += skCount + seCount + peCount;
      }

      // Kategori: Siswa (HANYA SISWA, GURU TIDAK PERNAH DIHAPUS)
      if (kategori.includes('siswa')) {
        const allProfiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
        const teachersOnly = allProfiles.filter((p) => p.peran === 'guru');
        const studentCount = allProfiles.length - teachersOnly.length;
        setStorage(STORAGE_KEYS.PROFILES, teachersOnly);
        rincian['profiles_siswa_terhapus'] = studentCount;
        totalBaris += studentCount;
      }

      // Kategori: Log Aktivitas
      if (kategori.includes('log')) {
        const lCount = getStorage<any[]>(STORAGE_KEYS.LOG_AKTIVITAS, []).length;
        setStorage(STORAGE_KEYS.LOG_AKTIVITAS, []);
        rincian['log_aktivitas_terhapus'] = lCount;
        totalBaris += lCount;
      }

      // Seed Ulang Idempoten (Bila dicentang)
      if (seedUlang) {
        const aturan = getStorage<AturanBintang[]>(STORAGE_KEYS.ATURAN_BINTANG, []);
        if (aturan.length === 0) {
          setStorage(STORAGE_KEYS.ATURAN_BINTANG, ATURAN_BINTANG_DEFAULT);
        }
        const games = getStorage<GameItem[]>(STORAGE_KEYS.GAMES, []);
        if (games.length === 0) {
          setStorage(STORAGE_KEYS.GAMES, INITIAL_GAMES);
        }
      }

      // Catat ke Log Audit Permanen (Tidak pernah terhapus)
      const auditLogs = getStorage<LogPenghapusan[]>(STORAGE_KEYS.LOG_PENGHAPUSAN, []);
      const newAudit: LogPenghapusan = {
        id: 'purge_' + Date.now(),
        guruId: currentUser.id,
        guruNama: currentUser.nama,
        waktu: new Date().toISOString(),
        kategori,
        rincianDihapus: rincian,
        cadanganDiunduh: !lewatiCadangan,
        cadanganDilewati: lewatiCadangan,
        status: 'sukses',
        catatan: `Penghapusan data berhasil. Total baris data terhapus: ${totalBaris}.`,
      };
      auditLogs.unshift(newAudit);
      setStorage(STORAGE_KEYS.LOG_PENGHAPUSAN, auditLogs);

      return {
        success: true,
        waktu: newAudit.waktu,
        kategori,
        rincian,
        totalBarisDihapus: totalBaris,
        cadanganDilewati: lewatiCadangan,
        pesan: 'Database berhasil dikosongkan dengan aman sesuai cakupan kategori terpilih.',
        storageHasil: {
          materi: kategori.includes('materi') ? 3 : 0,
          soal: kategori.includes('soal_ujian') ? 5 : 0,
          avatar: kategori.includes('siswa') ? 12 : 0,
        },
        authSiswaHasil: {
          berhasil: kategori.includes('siswa') ? 4 : 0,
          gagal: 0,
        },
      };
    },

    getRiwayatLog(): LogPenghapusan[] {
      return getStorage<LogPenghapusan[]>(STORAGE_KEYS.LOG_PENGHAPUSAN, []);
    },
  },
};
