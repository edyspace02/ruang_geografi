import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Download,
  Key,
  CheckCircle2,
  Clock,
  X,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  CheckSquare,
  Square,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Database,
  RefreshCw,
} from 'lucide-react';
import { DB } from '../services/db';
import { HasilEksekusiHapus, KategoriHapus, Profile } from '../types';

interface Props {
  user: Profile;
  onClose: () => void;
  onSuccess: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const KATEGORI_CONFIG: {
  id: KategoriHapus;
  label: string;
  deskripsi: string;
  tabel: string;
}[] = [
  {
    id: 'nilai',
    label: 'Nilai & Percobaan Ujian CBT',
    deskripsi: 'Seluruh riwayat nilai, lembar jawaban siswa, dan riwayat percobaan CBT.',
    tabel: 'percobaan_ujian, jawaban',
  },
  {
    id: 'soal_ujian',
    label: 'Daftar Ujian & Bank Soal',
    deskripsi: 'Modul ujian CBT, kunci jawaban, dan bank butir soal (+ file lampiran gambar di storage).',
    tabel: 'ujian, ujian_soal, soal, kunci_soal',
  },
  {
    id: 'materi',
    label: 'Materi Pelajaran Geografi',
    deskripsi: 'Artikel bahan ajar, modul materi, dan riwayat membaca siswa (+ file media di storage).',
    tabel: 'materi, materi_dibaca',
  },
  {
    id: 'bintang',
    label: 'Poin Bintang & Lencana Siswa',
    deskripsi: 'Seluruh saldo bintang apresiasi dan lencana penghargaan yang telah diraih siswa.',
    tabel: 'riwayat_bintang, lencana_siswa',
  },
  {
    id: 'game',
    label: 'Riwayat Game Edukasi & Sesi',
    deskripsi: 'Skor permainan kanvas, sesi turnamen kelas, dan daftar peserta sesi.',
    tabel: 'skor_game, sesi_game, peserta_sesi',
  },
  {
    id: 'siswa',
    label: 'Data Akun Siswa (Bukan Guru)',
    deskripsi: 'Akun seluruh siswa di database profiles dan Auth (+ foto profil avatar di storage).',
    tabel: 'profiles (peran siswa) + auth.users',
  },
  {
    id: 'log',
    label: 'Log Aktivitas Pengguna',
    deskripsi: 'Catatan aktivitas harian aplikasi (kecuali log audit penghapusan zona berbahaya).',
    tabel: 'log_aktivitas',
  },
];

export const ZonaBerbahayaModal: React.FC<Props> = ({ user, onClose, onSuccess, onNotify }) => {
  const isGuru = user.peran === 'guru';
  const config = DB.pengaturan.get();

  // Stepper State: 1 = Pilih & Pratinjau, 2 = Cadangan, 3 = Frasa Konfirmasi, 4 = Password & Countdown, 5 = Hasil
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Kategori Terpilih
  const [selectedCategories, setSelectedCategories] = useState<KategoriHapus[]>([
    'nilai',
    'bintang',
    'game',
  ]);

  // Dry Run / Token State
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryRunError, setDryRunError] = useState('');
  const [dryRunResult, setDryRunResult] = useState<{
    token: string;
    frasaWajib: string;
    dampak: Record<string, number>;
    totalBaris: number;
    paketSemua: boolean;
  } | null>(null);

  // Cadangan State
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [backupFilename, setBackupFilename] = useState('');
  const [backupTime, setBackupTime] = useState<string | null>(null);
  const [skipBackup, setSkipBackup] = useState(false);
  const [backupTestResult, setBackupTestResult] = useState<{ valid: boolean; totalBaris: number } | null>(null);

  // Konfirmasi Frasa
  const [enteredPhrase, setEnteredPhrase] = useState('');

  // Password Guru & Countdown
  const [teacherPassword, setTeacherPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [canSubmitDelete, setCanSubmitDelete] = useState(false);
  const [seedDefaults, setSeedDefaults] = useState(true);

  // Eksekusi State
  const [isDeleting, setIsDeleting] = useState(false);
  const [executionResult, setExecutionResult] = useState<HasilEksekusiHapus | null>(null);

  // Check last backup on mount
  useEffect(() => {
    const last = DB.bahaya.getStatusCadanganTerakhir(user.id);
    if (last) {
      setBackupFilename(last.namaFile);
      setBackupTime(last.diunduhPada);
    }
  }, [user.id]);

  // Countdown timer on step 4
  useEffect(() => {
    if (step === 4) {
      setCountdown(5);
      setCanSubmitDelete(false);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanSubmitDelete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  // Handler: Pemilihan Kategori
  const toggleCategory = (id: KategoriHapus) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
    setDryRunResult(null); // Reset token jika pilihan berubah
  };

  const applyPresetSemester = () => {
    setSelectedCategories(['nilai', 'bintang', 'game']);
    setDryRunResult(null);
  };

  const applyPresetAll = () => {
    setSelectedCategories(['nilai', 'soal_ujian', 'materi', 'bintang', 'game', 'siswa', 'log']);
    setDryRunResult(null);
  };

  // LANGKAH 1 -> 2: Lakukan Pratinjau (Dry Run)
  const handleRunPreview = () => {
    if (selectedCategories.length === 0) {
      onNotify('Pilih minimal satu kategori data untuk dihapus.', 'error');
      return;
    }

    setIsDryRunning(true);
    setDryRunError('');

    setTimeout(() => {
      const res = DB.bahaya.pratinjau(selectedCategories);
      setIsDryRunning(false);

      if (res.success && res.token && res.frasaWajib) {
        setDryRunResult({
          token: res.token,
          frasaWajib: res.frasaWajib,
          dampak: res.dampak || {},
          totalBaris: res.totalBaris || 0,
          paketSemua: !!res.paketSemua,
        });
        setStep(2);
        onNotify('Pratinjau dampak berhasil dihitung tanpa menghapus data.', 'info');
      } else {
        setDryRunError(res.error || 'Gagal menghitung pratinjau dampak.');
        onNotify(res.error || 'Gagal menghitung pratinjau.', 'error');
      }
    }, 400);
  };

  // LANGKAH 2: Unduh Cadangan JSON
  const handleDownloadBackup = () => {
    const { data, filename, totalBaris } = DB.bahaya.unduhCadanganKategori(selectedCategories);
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', jsonStr);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    a.remove();

    setBackupDownloaded(true);
    setBackupFilename(filename);
    setBackupTime(new Date().toISOString());
    setBackupTestResult({ valid: true, totalBaris });
    onNotify(`Cadangan data (${totalBaris} baris) berhasil diunduh!`, 'success');
  };

  // Uji Berkas Cadangan
  const handleVerifyBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = DB.bahaya.verifikasiBerkasCadangan(content);
      if (res.valid) {
        setBackupTestResult({ valid: true, totalBaris: res.totalBaris });
        onNotify(`Berkas cadangan terverifikasi valid (${res.totalBaris} baris data)!`, 'success');
      } else {
        setBackupTestResult(null);
        onNotify(res.error || 'Berkas cadangan tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // LANGKAH 4 -> 5: Eksekusi Penghapusan
  const handleExecuteDelete = () => {
    if (!dryRunResult) return;
    if (!teacherPassword) {
      onNotify('Masukkan password akun guru untuk konfirmasi autentikasi.', 'error');
      return;
    }

    setIsDeleting(true);

    setTimeout(() => {
      try {
        const res = DB.bahaya.eksekusiHapus(
          selectedCategories,
          dryRunResult.token,
          enteredPhrase,
          teacherPassword,
          skipBackup,
          seedDefaults
        );

        setIsDeleting(false);
        setExecutionResult(res);
        setStep(5);
        onNotify('Penghapusan database berhasil diselesaikan!', 'success');
      } catch (err: any) {
        setIsDeleting(false);
        onNotify(err.message || 'Gagal mengeksekusi penghapusan database.', 'error');
      }
    }, 1200);
  };

  // Unduh Laporan Hasil Penghapusan
  const handleDownloadReport = () => {
    if (!executionResult) return;
    const reportText = `=====================================================
LAPORAN AUDIT PENGHAPUSAN DATABASE RUANG GEOGRAFI
=====================================================
Waktu Pelaksanaan : ${new Date(executionResult.waktu).toLocaleString('id-ID')}
Guru Pelaksana    : ${user.nama} (${user.username})
Sekolah           : ${config.namaSekolah}
Status Cadangan   : ${executionResult.cadanganDilewati ? 'DILEWATI (Tanpa Cadangan)' : 'DIUNDUH SEBELUMNYA'}
Total Baris Data  : ${executionResult.totalBarisDihapus} baris terhapus

RINCIAN TABEL DIHAPUS:
${Object.entries(executionResult.rincian)
  .map(([k, v]) => `- ${k.replace(/_/g, ' ').toUpperCase()}: ${v} baris`)
  .join('\n')}

STORAGE & AUTH:
- File Storage Materi : ${executionResult.storageHasil?.materi || 0} file dibersihkan
- File Storage Soal   : ${executionResult.storageHasil?.soal || 0} file dibersihkan
- File Storage Avatar : ${executionResult.storageHasil?.avatar || 0} file dibersihkan
- Akun Siswa Auth     : ${executionResult.authSiswaHasil?.berhasil || 0} akun dinonaktifkan/dibersihkan

Tindakan Rekomendasi:
1. Simpan laporan ini sebagai arsip administrasi kurikulum/lab.
2. Jika akun siswa ikut dibersihkan, lakukan impor siswa baru via menu Data Siswa.
=====================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_penghapusan_db_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onNotify('Laporan audit berhasil diunduh.', 'success');
  };

  if (!isGuru) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border-2 border-rose-500/80 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-6 text-slate-800 dark:text-slate-200">
        {/* Header Zona Berbahaya */}
        <div className="flex items-start justify-between pb-4 border-b border-rose-200 dark:border-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 ring-4 ring-rose-500/20">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-rose-600 text-white tracking-wider">
                  Zona Berbahaya
                </span>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                  Khusus Guru Pengampu
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Hapus & Kosongkan Database Aman
              </h3>
            </div>
          </div>

          {step !== 5 && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Stepper Progress Bar */}
        <div className="py-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
            <span className={step >= 1 ? 'text-rose-600 font-black' : ''}>1. Pilih Cakupan</span>
            <span className={step >= 2 ? 'text-rose-600 font-black' : ''}>2. Cadangan</span>
            <span className={step >= 3 ? 'text-rose-600 font-black' : ''}>3. Frasa Kunci</span>
            <span className={step >= 4 ? 'text-rose-600 font-black' : ''}>4. Verifikasi Password</span>
            <span className={step === 5 ? 'text-emerald-600 font-black' : ''}>5. Selesai</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                step === 5 ? 'bg-emerald-500' : 'bg-rose-600'
              }`}
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LANGKAH 1: PILIH CAKUPAN & PRATINJAU DAMPAK */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-xs mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Ketentuan Keamanan Tingkat Server:
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                <li>Hanya mengosongkan <strong>isi data</strong> (baris tabel). Struktur tabel, fungsi, RLS, trigger, dan bucket <strong>TIDAK PERNAH DIHAPUS</strong>.</li>
                <li><strong>Akun Guru</strong>, pengaturan nama sekolah, dan master aturan bawaan diproteksi permanen di server dan tidak dapat dipilih.</li>
              </ul>
            </div>

            {/* Tombol Paket Cepat */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-bold text-slate-500 text-[11px]">Paket Cepat:</span>
              <button
                type="button"
                onClick={applyPresetSemester}
                className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-bold hover:bg-amber-100 transition"
              >
                Reset Semester (Nilai, Bintang & Game)
              </button>
              <button
                type="button"
                onClick={applyPresetAll}
                className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 font-bold hover:bg-rose-100 transition"
              >
                Kosongkan Semua Data Kecuali Guru
              </button>
            </div>

            {/* Error Pratinjau Jika Ada Ujian Aktif / Rate Limit */}
            {dryRunError && (
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Penghapusan Ditolak Sistem</p>
                  <p className="text-[11px] mt-0.5">{dryRunError}</p>
                </div>
              </div>
            )}

            {/* Daftar Kotak Centang Per Kategori */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {KATEGORI_CONFIG.map((cat) => {
                const checked = selectedCategories.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      checked
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 text-rose-600">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 fill-rose-600 text-white" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {cat.label}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          {cat.tabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {cat.deskripsi}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">
                Terpilih: <strong>{selectedCategories.length}</strong> kategori
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-semibold text-slate-500 hover:text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedCategories.length === 0 || isDryRunning}
                  onClick={handleRunPreview}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {isDryRunning ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      Menghitung Dampak...
                    </>
                  ) : (
                    <>
                      <span>Lihat Dampak (Dry Run)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LANGKAH 2: CADANGAN WAJIB */}
        {/* ========================================================================= */}
        {step === 2 && dryRunResult && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
              <h4 className="font-bold flex items-center gap-1.5 text-xs mb-1">
                <Download className="w-4 h-4 text-amber-600" />
                Langkah Pengaman 2: Wajib Mengunduh Cadangan
              </h4>
              <p className="text-[11px] leading-relaxed">
                Sebelum data dihapus, Anda harus mengunduh file cadangan data terpilih. File JSON ini nantinya dapat dipulihkan sewaktu-waktu jika terjadi kekeliruan.
              </p>
            </div>

            {/* Rincian Hasil Pratinjau */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Total Baris Data yang Akan Dihapus:
                </span>
                <span className="text-base font-black text-rose-600">
                  {dryRunResult.totalBaris} Baris
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                {Object.entries(dryRunResult.dampak).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k.replace(/_/g, ' ')}:</span>
                    <strong className="text-slate-900 dark:text-white">{v}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Tombol Unduh Cadangan */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 mx-auto flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                  Unduh Cadangan Resmi Ruang Geografi
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menyimpan seluruh data {selectedCategories.join(', ')} ke berkas JSON terenkapsulasi.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadBackup}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan Sekarang</span>
              </button>

              {backupTime && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Cadangan tercatat: {new Date(backupTime).toLocaleTimeString('id-ID')} ({backupFilename})
                </p>
              )}
            </div>

            {/* Uji Berkas Cadangan */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-[11px]">
              <div>
                <span className="font-bold block text-slate-700 dark:text-slate-300">
                  Uji Verifikasi Integritas Cadangan (Opsional):
                </span>
                <span className="text-slate-500">
                  Periksa apakah file cadangan valid dan dapat dibaca sebelum melanjutkan.
                </span>
              </div>
              <label className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold rounded-lg cursor-pointer">
                Pilih Berkas Uji
                <input
                  type="file"
                  accept=".json"
                  onChange={handleVerifyBackupFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Pilihan Lewati Cadangan Dengan Sadar */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 cursor-pointer">
              <input
                type="checkbox"
                checked={skipBackup}
                onChange={(e) => setSkipBackup(e.target.checked)}
                className="mt-0.5 rounded text-rose-600"
              />
              <span className="text-[11px] text-rose-800 dark:text-rose-300 font-semibold leading-relaxed">
                Saya sadar dan sengaja melewati pencadangan. Saya memahami bahwa data yang dihapus <strong>TIDAK DAPAT DIKEMBALIKAN</strong> tanpa file cadangan.
              </span>
            </label>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>

              <button
                type="button"
                disabled={!backupDownloaded && !skipBackup && !backupTime}
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <span>Lanjut ke Konfirmasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LANGKAH 3: RINGKASAN MERAH & FRASA KUNCI */}
        {/* ========================================================================= */}
        {step === 3 && dryRunResult && (
          <div className="space-y-4 text-xs">
            {/* Ringkasan Merah Tegas */}
            <div className="p-4 rounded-2xl bg-rose-600 text-white shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-rose-100 font-bold uppercase tracking-wider text-[10px]">
                <AlertTriangle className="w-4 h-4" />
                Peringatan Terakhir Sebelum Tindakan Dijalankan
              </div>
              <p className="text-sm font-extrabold leading-snug">
                Anda akan menghapus {dryRunResult.totalBaris} baris data pada kategori:{' '}
                {selectedCategories.join(', ').toUpperCase()}.
              </p>
              <p className="text-xs text-rose-100 leading-relaxed">
                Tindakan ini permanen dan mengubah isi database. Semua ujian, nilai, materi, atau akun siswa yang dipilih akan segera hilang dari aplikasi.
              </p>
            </div>

            {/* Input Frasa Konfirmasi */}
            <div className="space-y-2">
              <label className="font-bold block text-slate-800 dark:text-slate-200">
                Ketik frasa konfirmasi berikut persis sama (huruf besar):
              </label>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-center text-xs font-black text-rose-600 select-all border border-slate-300 dark:border-slate-700">
                {dryRunResult.frasaWajib}
              </div>

              <input
                type="text"
                required
                autoFocus
                value={enteredPhrase}
                onChange={(e) => setEnteredPhrase(e.target.value)}
                placeholder="Ketik frasa konfirmasi di sini..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-center uppercase tracking-wider"
              />

              {enteredPhrase && enteredPhrase.trim().toUpperCase() !== dryRunResult.frasaWajib.toUpperCase() && (
                <p className="text-[11px] text-rose-600 font-semibold text-center">
                  Frasa belum cocok. Harap ketik persis sama termasuk tanda hubung jika ada.
                </p>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>

              <button
                type="button"
                disabled={enteredPhrase.trim().toUpperCase() !== dryRunResult.frasaWajib.toUpperCase()}
                onClick={() => setStep(4)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <span>Verifikasi Password Guru</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LANGKAH 4: PASSWORD GURU & HITUNG MUNDUR 5 DETIK */}
        {/* ========================================================================= */}
        {step === 4 && dryRunResult && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Lock className="w-4 h-4 text-rose-600" />
                Autentikasi Ulang: Masukkan Password Akun Guru
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Untuk mencegah penyalahgunaan sesi yang tertinggal di komputer sekolah/laboratorium, verifikasi ulang password guru Anda wajib dimasukkan.
              </p>
            </div>

            {/* Input Password Guru */}
            <div>
              <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                Password Guru ({user.nama})
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  placeholder="Ketik password akun guru Anda..."
                  className="w-full p-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Opsi Seed Ulang Idempoten */}
            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={seedDefaults}
                onChange={(e) => setSeedDefaults(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Jalankan ulang seed data bawaan aman (master aturan bintang & game bawaan tetap siap dimainkan).
              </span>
            </label>

            {/* Tombol Eksekusi dengan Countdown 5 Detik */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!canSubmitDelete || isDeleting || !teacherPassword}
                onClick={handleExecuteDelete}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400/50 text-white font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
              >
                {isDeleting ? (
                  <>
                    <RotateCcw className="w-5 h-5 animate-spin" />
                    <span>Mengeksekusi Pembersihan Database...</span>
                  </>
                ) : !canSubmitDelete ? (
                  <>
                    <Clock className="w-5 h-5 animate-pulse" />
                    <span>Tombol Aktif Dalam {countdown} Detik...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>KOSONGKAN DATABASE SEKARANG</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-500"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LANGKAH 5: LAPORAN HASIL PENGHAPUSAN */}
        {/* ========================================================================= */}
        {step === 5 && executionResult && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Database Berhasil Dikosongkan!
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                {executionResult.pesan}
              </p>
            </div>

            {/* Rincian Hasil */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-bold border-b border-slate-200 dark:border-slate-700 pb-2">
                <span>Total Baris Terhapus:</span>
                <span className="text-emerald-600">{executionResult.totalBarisDihapus} Baris</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                {Object.entries(executionResult.rincian).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k.replace(/_/g, ' ')}:</span>
                    <strong className="text-slate-900 dark:text-white">{v}</strong>
                  </div>
                ))}
              </div>

              {selectedCategories.includes('siswa') && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
                  Catatan: Akun siswa telah dibersihkan. Anda dapat mengimpor siswa baru melalui menu <strong>Data Siswa</strong>.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadReport}
                className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Unduh Laporan Audit (TXT)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                  window.location.reload();
                }}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Selesai & Muat Ulang Aplikasi</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
