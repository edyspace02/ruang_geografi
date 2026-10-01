export type UserRole = 'guru' | 'siswa';

export interface Profile {
  id: string;
  username: string; // NIS untuk siswa, username untuk guru
  nama: string;
  peran: UserRole;
  kelas: string;
  aktif: boolean;
  wajib_ganti_password: boolean;
  avatar_url?: string;
  created_at: string;
}

export type MateriStatus = 'draft' | 'terbit';

export interface Materi {
  id: string;
  judul: string;
  ringkasan: string;
  isi: string;
  bab: string; // Litosfer, Atmosfer, Hidrosfer, Pedosfer, Biosfer, Peta & SIG, dll
  kelas: string; // e.g. 'Semua', 'X-1', 'X-2', 'XI IPS 1', dll
  tag: string[];
  sampul_url?: string;
  status: MateriStatus;
  dijadwalkan?: string;
  pembaca_count: number;
  dibuat_oleh: string;
  created_at: string;
}

export interface SoalOption {
  label: 'A' | 'B' | 'C' | 'D' | 'E';
  teks: string;
}

export interface Soal {
  id: string;
  bab: string;
  teks: string;
  gambar_url?: string;
  opsi: SoalOption[];
  bobot: number;
  kesulitan: 'mudah' | 'sedang' | 'sukar';
  pembahasan?: string;
  kunci?: string; // Hanya tersedia untuk guru atau evaluasi server
}

export type UjianStatus = 'draft' | 'aktif' | 'selesai';
export type TampilHasil = 'langsung' | 'setelah_tutup' | 'tidak';

export interface Ujian {
  id: string;
  judul: string;
  bab: string;
  kelas: string;
  durasi_menit: number;
  buka?: string;
  tutup?: string;
  acak_soal: boolean;
  acak_opsi: boolean;
  tampil_hasil: TampilHasil;
  kkm: number;
  status: UjianStatus;
  created_at: string;
  soal_ids: string[];
}

export interface PercobaanUjian {
  id: string;
  ujian_id: string;
  siswa_id: string;
  mulai: string;
  batas: string;
  selesai?: string;
  skor?: number;
  jumlah_pindah_tab: number;
  status: 'mengerjakan' | 'selesai';
}

export interface Jawaban {
  percobaan_id: string;
  soal_id: string;
  pilihan?: string;
  ragu: boolean;
  benar?: boolean;
}

export interface AturanBintang {
  kode: string;
  nama: string;
  poin: number;
  aktif: boolean;
}

export interface RiwayatBintang {
  id: string;
  siswa_id: string;
  kode: string;
  poin: number;
  alasan: string;
  referensi_id?: string;
  pemberi?: string;
  dibuat: string;
}

export interface Lencana {
  id: string;
  nama: string;
  deskripsi: string;
  ikon: string;
  syarat_tipe: string;
  syarat_nilai: number;
}

export interface LencanaSiswa {
  siswa_id: string;
  lencana_id: string;
  diperoleh: string;
}

export type GameType = 'kanvas_file' | 'kuis_bank_soal' | 'kanvas_upload';
export type GameSessionMode = 'bebas' | 'wajib_sesi';

export interface GameItem {
  id: string;
  nama: string;
  ikon: string;
  deskripsi: string;
  kelas: string[];
  bab: string;
  aktif: boolean;
  skorMaks: number;
  poinBintang: number;
  tipe?: GameType;
  konfigurasi?: {
    bab?: string;
    durasiDetikPerSoal?: number;
    komboAktif?: boolean;
    soalIds?: string[];
  };
  fileGame?: string;
  urutan?: number;
  modeSesi?: GameSessionMode;
  diarsipkanPada?: string | null;
  poinJuara?: { juara1: number; juara2: number; juara3: number };
  maksPercobaanHarian?: number;
}

export type SesiStatus = 'dijadwalkan' | 'berlangsung' | 'ditutup';

export interface SesiGame {
  id: string;
  gameId: string;
  judul: string;
  kelas: string[];
  kode?: string;
  status: SesiStatus;
  mulai: string;
  batasWaktu?: string | null;
  ditutupPada?: string | null;
  maksPercobaan: number;
  dibuatOleh: string;
  bintangDibagikan: boolean;
}

export interface PesertaSesi {
  sesiId: string;
  siswaId: string;
  bergabungPada: string;
}

export interface SkorGame {
  id: string;
  game_id: string;
  siswa_id: string;
  skor: number;
  dibuat: string;
  sesi_id?: string;
}

export interface PengaturanSekolah {
  namaSekolah: string;
  namaGuru: string;
  kkmDefault: number;
  passwordDefaultSiswa: string;
  passwordDefaultGuru: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseConnected: boolean;
}

export type KategoriHapus =
  | 'nilai'
  | 'soal_ujian'
  | 'materi'
  | 'bintang'
  | 'game'
  | 'siswa'
  | 'log';

export interface PratinjauDampakItem {
  kategori: KategoriHapus;
  label: string;
  deskripsi: string;
  tabelTerkait: string[];
  jumlahBaris: number;
  jumlahFile?: number;
}

export interface PratinjauDampakResult {
  success: boolean;
  token?: string;
  frasaWajib?: string;
  kedaluwarsaDetik?: number;
  dampak?: Record<string, number>;
  totalBaris?: number;
  error?: string;
  paketSemua?: boolean;
}

export interface StatusCadangan {
  id: string;
  guruId: string;
  kategori: KategoriHapus[];
  namaFile: string;
  barisTotal: number;
  diunduhPada: string;
}

export interface LogPenghapusan {
  id: string;
  guruId: string;
  guruNama: string;
  waktu: string;
  kategori: KategoriHapus[];
  rincianDihapus: Record<string, number>;
  cadanganDiunduh: boolean;
  cadanganDilewati: boolean;
  status: 'sukses' | 'gagal';
  catatan?: string;
}

export interface HasilEksekusiHapus {
  success: boolean;
  waktu: string;
  kategori: KategoriHapus[];
  rincian: Record<string, number>;
  totalBarisDihapus: number;
  cadanganDilewati: boolean;
  pesan: string;
  storageHasil?: {
    materi: number;
    soal: number;
    avatar: number;
  };
  authSiswaHasil?: {
    berhasil: number;
    gagal: number;
  };
}
