import React, { useState } from 'react';
import {
  Settings,
  School,
  User,
  Key,
  Database,
  Download,
  FolderDown,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Trash2,
  Save,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { DB } from '../services/db';
import { Profile } from '../types';
import { ZonaBerbahayaModal } from '../components/ZonaBerbahayaModal';

interface Props {
  user: Profile;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenSupabaseModal?: () => void;
}

export const PengaturanPage: React.FC<Props> = ({ user, onNotify, onOpenSupabaseModal }) => {
  const isGuru = user.peran === 'guru';
  const [config, setConfig] = useState(DB.pengaturan.get());
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState(DB.bahaya.getRiwayatLog());

  // Form states
  const [namaSekolah, setNamaSekolah] = useState(config.namaSekolah);
  const [namaGuru, setNamaGuru] = useState(config.namaGuru);
  const [kkmDefault, setKkmDefault] = useState(config.kkmDefault);
  const [passSiswa, setPassSiswa] = useState(config.passwordDefaultSiswa);
  const [passGuru, setPassGuru] = useState(config.passwordDefaultGuru);

  const handleSaveGeneralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = DB.pengaturan.simpan({
      namaSekolah: namaSekolah.trim(),
      namaGuru: namaGuru.trim(),
      kkmDefault: Number(kkmDefault),
      passwordDefaultSiswa: passSiswa.trim(),
      passwordDefaultGuru: passGuru.trim(),
    });
    setConfig(updated);
    onNotify('Pengaturan umum sekolah berhasil diperbarui!', 'success');
  };

  const handleExportAllBackup = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(DB.backup.exportJSON());
    const a = document.createElement('a');
    a.setAttribute('href', jsonStr);
    a.setAttribute('download', `cadangan_lengkap_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    onNotify('Cadangan lengkap database berhasil diunduh.', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = DB.backup.importJSON(content);
      if (success) {
        onNotify('Data berhasil dipulihkan dari berkas cadangan!', 'success');
        window.location.reload();
      } else {
        onNotify('Gagal memulihkan cadangan: format JSON tidak sesuai.', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (!isGuru) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
          Akses Dibatasi
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Halaman Pengaturan hanya dapat diakses oleh akun Guru Pengampu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-emerald-600" />
          Pengaturan Sistem & Database
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Konfigurasi identitas sekolah, pencadangan data, serta pembersihan aman database.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Pengaturan Identitas Sekolah & Standar KKM */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-600" />
            Identitas Sekolah & Kurikulum
          </h3>

          <form onSubmit={handleSaveGeneralConfig} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                Nama Sekolah
              </label>
              <input
                type="text"
                required
                value={namaSekolah}
                onChange={(e) => setNamaSekolah(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                Nama Guru Pengampu Geografi
              </label>
              <input
                type="text"
                required
                value={namaGuru}
                onChange={(e) => setNamaGuru(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  KKM Default
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  required
                  value={kkmDefault}
                  onChange={(e) => setKkmDefault(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-center"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Pass Default Siswa
                </label>
                <input
                  type="text"
                  required
                  value={passSiswa}
                  onChange={(e) => setPassSiswa(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  Pass Default Guru
                </label>
                <input
                  type="text"
                  required
                  value={passGuru}
                  onChange={(e) => setPassGuru(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-2"
            >
              <Save className="w-4 h-4" />
              Simpan Pengaturan
            </button>
          </form>
        </div>

        {/* 2. Cadangkan & Pulihkan */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-sky-500" />
              Cadangkan & Pulihkan Seluruh Data
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Simpan salinan cadangan berkala sebelum melakukan perubahan besar atau ujian akhir semester.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Ekspor Cadangan (JSON)</h4>
                  <p className="text-[11px] text-slate-500">Materi, soal, nilai, dan akun siswa.</p>
                </div>
                <button
                  onClick={handleExportAllBackup}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Pulihkan dari Berkas</h4>
                  <p className="text-[11px] text-slate-500">Unggah berkas JSON hasil ekspor.</p>
                </div>
                <label className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer">
                  <FolderDown className="w-3.5 h-3.5" />
                  Pulihkan
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4 text-emerald-500" />
              Buka Konfigurasi & Skema Supabase
            </button>
          )}
        </div>
      </div>

      {/* 3. ZONA BERBAHAYA: HAPUS DATABASE (BORDER MERAH TEGAS) */}
      <div className="rounded-3xl border-2 border-rose-500/80 bg-gradient-to-br from-rose-50/60 via-white to-rose-50/20 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 p-6 sm:p-7 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rose-200 dark:border-rose-900/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-rose-600 text-white">
                Zona Berbahaya
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                Hapus & Kosongkan Isi Database
              </h3>
            </div>
          </div>

          <button
            onClick={() => setShowDangerModal(true)}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-rose-600/30 transition flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Buka Menu Hapus Database</span>
          </button>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
          <p>
            Menu ini digunakan oleh guru pengampu saat <strong>pergantian semester atau tahun ajaran baru</strong> untuk mengosongkan riwayat nilai, lembar ujian, bintang, atau akun siswa lama secara aman.
          </p>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-rose-200 dark:border-rose-900/40 text-[11px] space-y-1">
            <p className="font-bold text-rose-700 dark:text-rose-400">
              Perlindungan Keamanan Tingkat Server:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-500 dark:text-slate-400">
              <li><strong>Akun Guru TIDAK PERNAH DIHAPUS</strong>, demikian pula struktur tabel, fungsi RPC, dan trigger.</li>
              <li>Wajib melalui <strong>Pratinjau Dampak</strong>, <strong>Unduhan Cadangan</strong>, <strong>Ketik Frasa Konfirmasi</strong>, <strong>Verifikasi Password Guru</strong>, dan <strong>Hitung Mundur 5 Detik</strong>.</li>
              <li>Otomatis menolak jika ada ujian CBT yang berstatus aktif atau turnamen game yang sedang berjalan.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. RIWAYAT LOG AUDIT PENGHAPUSAN */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Riwayat Audit Pembersihan Database
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Jejak audit permanen setiap aksi penghapusan di zona berbahaya.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {auditLogs.length} Catatan
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            Belum ada riwayat penghapusan database yang tercatat.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {log.guruNama}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                      {log.kategori.join(', ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {log.catatan} &bull; {log.cadanganDiunduh ? 'Cadangan Terunduh' : 'Tanpa Cadangan'}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.waktu).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Zona Berbahaya */}
      {showDangerModal && (
        <ZonaBerbahayaModal
          user={user}
          onClose={() => setShowDangerModal(false)}
          onSuccess={() => {
            setAuditLogs(DB.bahaya.getRiwayatLog());
          }}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
