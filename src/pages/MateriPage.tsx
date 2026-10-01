import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { Materi, Profile } from '../types';
import { DB } from '../services/db';
import { DAFTAR_BAB, DAFTAR_KELAS } from '../config/appConfig';

interface Props {
  user: Profile;
  onNavigate: (tab: string, meta?: any) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MateriPage: React.FC<Props> = ({ user, onNavigate, onNotify }) => {
  const isGuru = user.peran === 'guru';
  const [selectedBab, setSelectedBab] = useState<string>('Semua');
  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');
  const [search, setSearch] = useState<string>('');

  const [materiList, setMateriList] = useState<Materi[]>(DB.materi.daftar(user.peran, user.kelas));

  const refreshList = () => {
    setMateriList(DB.materi.daftar(user.peran, user.kelas));
  };

  const handleToggleStatus = (m: Materi) => {
    const newStatus = m.status === 'terbit' ? 'draft' : 'terbit';
    DB.materi.simpan({ ...m, status: newStatus });
    refreshList();
    onNotify(`Status materi diubah menjadi: ${newStatus.toUpperCase()}`, 'info');
  };

  const handleDelete = (id: string, judul: string) => {
    if (confirm(`Yakin ingin menghapus materi "${judul}"?`)) {
      DB.materi.hapus(id);
      refreshList();
      onNotify('Materi berhasil dihapus.', 'info');
    }
  };

  const filteredMateri = materiList.filter((m) => {
    const matchBab = selectedBab === 'Semua' || m.bab === selectedBab;
    const matchKelas = selectedKelas === 'Semua' || m.kelas === 'Semua' || m.kelas === selectedKelas;
    const matchSearch =
      m.judul.toLowerCase().includes(search.toLowerCase()) ||
      m.ringkasan.toLowerCase().includes(search.toLowerCase()) ||
      m.tag.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchBab && matchKelas && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            Materi Pelajaran Geografi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isGuru
              ? 'Dashboard pengelolaan artikel, modul bahan ajar, dan status penerbitan.'
              : 'Baca modul geografi interaktif dan dapatkan bintang apresiasi.'}
          </p>
        </div>

        {isGuru && (
          <button
            onClick={() => onNavigate('materi-editor')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tulis Materi Baru
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari judul, kata kunci, topik..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedBab}
            onChange={(e) => setSelectedBab(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="Semua">Semua Bab Geografi</option>
            {DAFTAR_BAB.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {isGuru && (
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {DAFTAR_KELAS.map((k) => (
                <option key={k} value={k}>
                  {k === 'Semua' ? 'Semua Kelas' : `Kelas ${k}`}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Materi List / Grid */}
      {filteredMateri.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada materi yang sesuai filter</h4>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata pencarian atau pilih bab lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMateri.map((mat) => {
            const isRead = DB.materi.isMateriDibaca(mat.id, user.id);
            return (
              <div
                key={mat.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 shadow-sm overflow-hidden flex flex-col transition group"
              >
                {/* Cover Image */}
                <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                  <img
                    src={mat.sampul_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'}
                    alt={mat.judul}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-sm text-emerald-400 text-[10px] font-bold">
                      {mat.bab}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur-sm text-white text-[10px] font-semibold">
                      {mat.kelas === 'Semua' ? 'Semua Kelas' : `Kelas ${mat.kelas}`}
                    </span>
                  </div>

                  {isGuru && (
                    <span
                      onClick={() => handleToggleStatus(mat)}
                      className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer shadow ${
                        mat.status === 'terbit'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                      title="Klik untuk ubah status terbit/draft"
                    >
                      {mat.status}
                    </span>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 transition">
                      {mat.judul}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {mat.ringkasan}
                    </p>
                  </div>

                  {/* Footer Meta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{mat.pembaca_count} pembaca</span>
                      {isRead && !isGuru && (
                        <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                          &bull; Tuntas ⭐
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isGuru ? (
                        <>
                          <button
                            onClick={() => onNavigate('materi-editor', { materiId: mat.id })}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition"
                            title="Edit Materi"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(mat.id, mat.judul)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 rounded-lg transition"
                            title="Hapus Materi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : null}

                      <button
                        onClick={() => onNavigate('materi-detail', { materiId: mat.id })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-sm ml-1"
                      >
                        Baca Modul
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
