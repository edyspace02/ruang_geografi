import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  Clock,
  CheckCircle,
  PlayCircle,
  BarChart3,
  Edit3,
  Trash2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Profile, Ujian } from '../types';
import { DB } from '../services/db';

interface Props {
  user: Profile;
  onNavigate: (tab: string, meta?: any) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UjianListPage: React.FC<Props> = ({ user, onNavigate, onNotify }) => {
  const isGuru = user.peran === 'guru';
  const [ujianList, setUjianList] = useState<Ujian[]>(DB.ujian.daftar(user.peran, user.kelas));

  const refreshList = () => {
    setUjianList(DB.ujian.daftar(user.peran, user.kelas));
  };

  const handleToggleStatus = (u: Ujian) => {
    const nextStatus = u.status === 'draft' ? 'aktif' : u.status === 'aktif' ? 'selesai' : 'draft';
    DB.ujian.simpan({ ...u, status: nextStatus });
    refreshList();
    onNotify(`Status ujian diubah menjadi: ${nextStatus.toUpperCase()}`, 'info');
  };

  const handleDelete = (id: string, judul: string) => {
    if (confirm(`Yakin ingin menghapus ujian "${judul}"?`)) {
      DB.ujian.hapus(id);
      refreshList();
      onNotify('Ujian berhasil dihapus.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-emerald-600" />
            Ujian & Penilaian CBT
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isGuru
              ? 'Kelola jadwal ujian CBT daring, durasi, KKM, dan pantau pengerjaan siswa.'
              : 'Daftar ujian geografi resmi berwaktu server dengan sistem anti-curang.'}
          </p>
        </div>

        {isGuru && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('bank-soal')}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Bank Soal
            </button>
            <button
              onClick={() => onNavigate('ujian-editor')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              Buat Ujian Baru
            </button>
          </div>
        )}
      </div>

      {/* Exam Cards */}
      {ujianList.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <FileCheck2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada ujian yang tersedia</h4>
          <p className="text-xs text-slate-400 mt-1">
            {isGuru ? 'Klik tombol "Buat Ujian Baru" untuk menyusun penilaian.' : 'Belum ada ujian aktif untuk kelas Anda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ujianList.map((uj) => {
            const perc = !isGuru ? DB.ujian.getPercobaan(uj.id, user.id) : null;
            const isCompleted = perc?.status === 'selesai';
            const isWorking = perc?.status === 'mengerjakan';

            return (
              <div
                key={uj.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 p-5 shadow-sm flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Bab: {uj.bab}
                    </span>

                    {isGuru ? (
                      <span
                        onClick={() => handleToggleStatus(uj)}
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded cursor-pointer ${
                          uj.status === 'aktif'
                            ? 'bg-emerald-600 text-white'
                            : uj.status === 'selesai'
                            ? 'bg-slate-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                        title="Klik untuk ubah status (Draft / Aktif / Selesai)"
                      >
                        {uj.status}
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isWorking
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {isCompleted ? 'Sudah Selesai' : isWorking ? 'Sedang Dikerjakan' : 'Belum Mulai'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                    {uj.judul}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{uj.durasi_menit} Menit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{uj.soal_ids.length} Butir Soal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>KKM: {uj.kkm}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Kelas: {uj.kelas}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {isGuru ? (
                    <>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onNavigate('ujian-editor', { ujianId: uj.id })}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition"
                          title="Edit Pengaturan Ujian"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(uj.id, uj.judul)}
                          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 rounded-lg transition"
                          title="Hapus Ujian"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => onNavigate('nilai', { ujianId: uj.id })}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Rekap Nilai Siswa
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        {isCompleted && (
                          <div className="text-xs">
                            <span className="text-slate-400">Skor Anda: </span>
                            <strong className="text-emerald-600 text-sm font-black">{perc.skor}</strong>
                            <span className="text-[10px] text-slate-400"> / 100</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onNavigate('ujian-cbt', { ujianId: uj.id })}
                        className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                          isCompleted
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <PlayCircle className="w-4 h-4" />
                        {isCompleted ? 'Tinjau Hasil & Soal' : isWorking ? 'Lanjutkan CBT' : 'Mulai Kerjakan'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
