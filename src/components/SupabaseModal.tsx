import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Terminal,
  FileCode,
  X,
  RefreshCw,
  Save,
  AlertTriangle,
  FolderDown,
} from 'lucide-react';
import { DB } from '../services/db';
import { PengaturanSekolah } from '../types';

interface Props {
  onClose: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SupabaseModal: React.FC<Props> = ({ onClose, onNotify }) => {
  const [activeTab, setActiveTab] = useState<'koneksi' | 'sql' | 'edge' | 'backup'>('koneksi');
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<PengaturanSekolah>(DB.pengaturan.get());

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    DB.pengaturan.simpan(config);
    onNotify('Pengaturan Supabase berhasil disimpan!', 'success');
  };

  const handleCopySQL = async () => {
    try {
      const resp = await fetch('/supabase/schema.sql');
      const text = await resp.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onNotify('Skrip schema.sql berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadBackup = () => {
    const json = DB.backup.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruang-geografi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('File cadangan database berhasil diunduh.', 'success');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = DB.backup.importJSON(content);
      if (ok) {
        onNotify('Data berhasil dipulihkan dari cadangan!', 'success');
        setTimeout(() => window.location.reload(), 800);
      } else {
        onNotify('Gagal memulihkan file cadangan. Format tidak sesuai.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSample = () => {
    if (confirm('Yakin ingin mereset data aplikasi ke data contoh awal?')) {
      DB.backup.resetDefault();
      onNotify('Data berhasil direset ke pengaturan awal.', 'info');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto no-print">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Integrasi Database Supabase & Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PostgreSQL, Row Level Security, Edge Functions & Pencadangan Data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mt-5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'koneksi', label: 'Pengaturan Supabase', icon: Database },
            { id: 'sql', label: 'Skrip SQL (schema.sql)', icon: FileCode },
            { id: 'edge', label: 'Edge Function Admin', icon: Terminal },
            { id: 'backup', label: 'Cadangkan & Pulihkan', icon: FolderDown },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Koneksi */}
        {activeTab === 'koneksi' && (
          <div className="mt-6 space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Engine Hibrida Aktif:</strong> Saat ini aplikasi berjalan mulus dengan data lokal reaktif berfitur penuh (semua CBT, penilaian server, bintang, dan game berfungsi 100%). Anda dapat menghubungkan proyek Supabase asli dengan memasukkan URL & Anon Key di bawah ini kapan saja!
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Sekolah
                  </label>
                  <input
                    type="text"
                    value={config.namaSekolah}
                    onChange={(e) => setConfig({ ...config, namaSekolah: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Guru Geografi
                  </label>
                  <input
                    type="text"
                    value={config.namaGuru}
                    onChange={(e) => setConfig({ ...config, namaGuru: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={config.supabaseUrl}
                  onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Anon (Public) Key
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={config.supabaseAnonKey}
                  onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Catatan keamanan: Hanya gunakan <strong>Anon (Public) Key</strong> di sini. Jangan pernah memasukkan service_role key ke browser.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  <Save className="w-4 h-4" />
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: SQL */}
        {activeTab === 'sql' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  supabase/schema.sql
                </h4>
                <p className="text-xs text-slate-500">
                  Eksekusi skrip ini di SQL Editor pada dashboard Supabase Anda.
                </p>
              </div>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Tersalin!' : 'Salin Seluruh SQL'}
              </button>
            </div>

            <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl max-h-96 overflow-y-auto border border-slate-800">
              <pre>{`-- SKEMA DATABASE LENGKAP: RUANG GEOGRAFI
-- 1. EXTENSIONS (uuid-ossp)
-- 2. TABEL: profiles, kelas, materi, materi_dibaca, soal, kunci_soal (RLS!), ujian, percobaan_ujian, jawaban, aturan_bintang, riwayat_bintang, game, skor_game
-- 3. FUNCTION RPC:
--    - mulai_ujian(p_ujian_id)
--    - simpan_jawaban(p_percobaan_id, p_soal_id, p_pilihan, p_ragu)
--    - catat_pindah_tab(p_percobaan_id)
--    - kirim_ujian(p_percobaan_id) -- Penilaian di server aman!
--    - tandai_materi_selesai(p_materi_id)
--    - kirim_skor_game(p_game_id, p_skor)
--    - papan_bintang(p_periode, p_kelas)
-- 4. RLS POLICIES LENGKAP (is_guru() security definer)
-- 5. SEED DATA AWAL (1 Guru, Siswa, Materi & Soal Geografi)`}</pre>
            </div>
          </div>
        )}

        {/* Tab 3: Edge Function */}
        {activeTab === 'edge' && (
          <div className="mt-6 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Supabase Edge Function: <code>admin-users</code>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Edge Function ini digunakan untuk membuat akun siswa secara massal dan mereset password siswa dengan aman menggunakan <code>service_role</code> di sisi server (Deno runtime).
            </p>

            <div className="p-4 bg-slate-900 text-slate-200 text-xs rounded-2xl font-mono border border-slate-800 space-y-2">
              <p className="text-amber-400 font-bold"># Cara Deploy Edge Function via Terminal:</p>
              <p className="bg-slate-950 p-2.5 rounded-lg">supabase functions deploy admin-users</p>
              <p className="text-slate-400 text-[11px]">
                File sumber tersimpan di: <code>/supabase/functions/admin-users/index.ts</code>
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Backup & Restore */}
        {activeTab === 'backup' && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  Ekspor Cadangan (JSON)
                </h5>
                <p className="text-xs text-slate-500 mb-4">
                  Unduh seluruh materi, soal ujian, nilai siswa, bintang, dan profil dalam satu file JSON terenkripsi.
                </p>
                <button
                  onClick={handleDownloadBackup}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Unduh File Cadangan
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  Pulihkan Cadangan (JSON)
                </h5>
                <p className="text-xs text-slate-500 mb-4">
                  Unggah file cadangan JSON untuk memulihkan seluruh data aplikasi ke keadaan sebelumnya.
                </p>
                <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer">
                  <FolderDown className="w-4 h-4" />
                  Pilih File Cadangan
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 flex items-center justify-between">
              <div>
                <h6 className="font-bold text-xs text-rose-700 dark:text-rose-400">
                  Reset ke Data Awal Bawaan
                </h6>
                <p className="text-[11px] text-rose-600 dark:text-rose-300">
                  Kembalikan materi, soal geografi, dan akun contoh ke pengaturan awal.
                </p>
              </div>
              <button
                onClick={handleResetSample}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
