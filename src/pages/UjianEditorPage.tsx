import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  CheckSquare,
  Square,
  HelpCircle,
  FileCheck2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Profile, Soal, Ujian } from '../types';
import { DB } from '../services/db';
import { DAFTAR_BAB, DAFTAR_KELAS } from '../config/appConfig';

interface Props {
  user: Profile;
  ujianId?: string;
  onNavigate: (tab: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UjianEditorPage: React.FC<Props> = ({ user, ujianId, onNavigate, onNotify }) => {
  const existing = ujianId ? DB.ujian.getById(ujianId, 'guru').ujian : null;
  const allSoal = DB.soal.daftar();

  const [judul, setJudul] = useState(existing?.judul || '');
  const [bab, setBab] = useState(existing?.bab || DAFTAR_BAB[0]);
  const [kelas, setKelas] = useState(existing?.kelas || 'Semua');
  const [durasiMenit, setDurasiMenit] = useState(existing?.durasi_menit || 30);
  const [kkm, setKkm] = useState(existing?.kkm || 75);
  const [acakSoal, setAcakSoal] = useState(existing?.acak_soal ?? true);
  const [acakOpsi, setAcakOpsi] = useState(existing?.acak_opsi ?? true);
  const [tampilHasil, setTampilHasil] = useState<'langsung' | 'setelah_tutup' | 'tidak'>(
    existing?.tampil_hasil || 'langsung'
  );
  const [status, setStatus] = useState<'draft' | 'aktif' | 'selesai'>(existing?.status || 'draft');
  const [selectedSoalIds, setSelectedSoalIds] = useState<string[]>(existing?.soal_ids || []);

  const toggleSoal = (id: string) => {
    if (selectedSoalIds.includes(id)) {
      setSelectedSoalIds(selectedSoalIds.filter((s) => s !== id));
    } else {
      setSelectedSoalIds([...selectedSoalIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSoalIds.length === allSoal.length) {
      setSelectedSoalIds([]);
    } else {
      setSelectedSoalIds(allSoal.map((s) => s.id));
    }
  };

  const handleSave = () => {
    if (!judul.trim()) {
      onNotify('Judul ujian tidak boleh kosong!', 'error');
      return;
    }
    if (selectedSoalIds.length === 0) {
      onNotify('Pilih minimal 1 butir soal untuk ujian ini!', 'error');
      return;
    }

    DB.ujian.simpan({
      id: existing?.id,
      judul,
      bab,
      kelas,
      durasi_menit: Number(durasiMenit),
      kkm: Number(kkm),
      acak_soal: acakSoal,
      acak_opsi: acakOpsi,
      tampil_hasil: tampilHasil,
      status,
      soal_ids: selectedSoalIds,
    });

    onNotify('Pengaturan ujian CBT berhasil disimpan!', 'success');
    onNavigate('ujian');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('ujian')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Ujian
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
        >
          <Save className="w-4 h-4" />
          Simpan Ujian CBT
        </button>
      </div>

      {/* Settings Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-emerald-600" />
          Pengaturan Utama Penilaian CBT
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Judul Ujian / Penilaian Harian
            </label>
            <input
              type="text"
              placeholder="Contoh: Penilaian Harian 1: Litosfer & Tektonik"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Bab Geografi
            </label>
            <select
              value={bab}
              onChange={(e) => setBab(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
            >
              {DAFTAR_BAB.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Kelas
            </label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
            >
              {DAFTAR_KELAS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Durasi (Menit)
            </label>
            <input
              type="number"
              min={5}
              max={180}
              value={durasiMenit}
              onChange={(e) => setDurasiMenit(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              KKM Kelulusan
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={kkm}
              onChange={(e) => setKkm(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Status Ujian
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
            >
              <option value="draft">Draft (Disembunyikan)</option>
              <option value="aktif">Aktif (Dapat Dikerjakan)</option>
              <option value="selesai">Selesai (Ditutup)</option>
            </select>
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={acakSoal}
              onChange={(e) => setAcakSoal(e.target.checked)}
              className="rounded text-emerald-600"
            />
            <span>Acak Urutan Soal CBT</span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={acakOpsi}
              onChange={(e) => setAcakOpsi(e.target.checked)}
              className="rounded text-emerald-600"
            />
            <span>Acak Urutan Pilihan (A-E)</span>
          </label>

          <div className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Tampilkan Hasil:</label>
            <select
              value={tampilHasil}
              onChange={(e) => setTampilHasil(e.target.value as any)}
              className="w-full p-1 text-xs bg-transparent border-0 font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="langsung">Langsung Usai Ujian</option>
              <option value="setelah_tutup">Setelah Ujian Ditutup</option>
              <option value="tidak">Sembunyikan Nilai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Select Questions from Bank Soal */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Pilih Butir Soal dari Bank Soal ({selectedSoalIds.length} Soal Dipilih)
            </h3>
            <p className="text-xs text-slate-500">
              Centang soal-soal yang ingin disertakan pada paket ujian ini.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            {selectedSoalIds.length === allSoal.length ? 'Batal Pilih Semua' : 'Pilih Semua Soal'}
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {allSoal.map((s, idx) => {
            const isSelected = selectedSoalIds.includes(s.id);
            return (
              <div
                key={s.id}
                onClick={() => toggleSoal(s.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/40 dark:bg-slate-800/20'
                }`}
              >
                <div className="mt-0.5 text-emerald-600">
                  {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                </div>

                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">Soal #{idx + 1}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {s.bab}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-600">
                      Kunci: {s.kunci}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{s.teks}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
