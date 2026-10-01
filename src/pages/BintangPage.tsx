import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Medal,
  Printer,
  PlusCircle,
  Clock,
  Filter,
  Flame,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Profile } from '../types';
import { DB } from '../services/db';
import { DAFTAR_KELAS } from '../config/appConfig';
import { CertificateModal } from '../components/CertificateModal';

interface Props {
  user: Profile;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onStarUpdated?: () => void;
}

export const BintangPage: React.FC<Props> = ({ user, onNotify, onStarUpdated }) => {
  const isGuru = user.peran === 'guru';

  const [periode, setPeriode] = useState<'mingguan' | 'bulanan' | 'sepanjang_masa'>('sepanjang_masa');
  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<{
    siswa: Profile;
    totalBintang: number;
    peringkat: number;
  } | null>(null);

  // Manual Star Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [targetSiswaId, setTargetSiswaId] = useState('');
  const [manualPoin, setManualPoin] = useState(3);
  const [manualAlasan, setManualAlasan] = useState('');

  const leaderboard = DB.bintang.papanBintang(periode, selectedKelas);
  const badges = DB.lencana.daftarLencana();
  const allStudents = DB.auth.getAllProfiles().filter((p) => p.peran === 'siswa');

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  const handleBeriBintangManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSiswaId) {
      onNotify('Pilih siswa terlebih dahulu!', 'error');
      return;
    }

    DB.bintang.beriBintangManual(targetSiswaId, manualPoin, manualAlasan, user.id);
    setShowManualModal(false);
    setManualAlasan('');
    if (onStarUpdated) onStarUpdated();
    onNotify('Bintang apresiasi manual berhasil diberikan!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-500" />
            Papan Bintang & Apresiasi Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Penghargaan keaktifan belajar, ketuntasan ujian CBT, dan pencapaian lencana geografi.
          </p>
        </div>

        {isGuru && (
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition shadow-md self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Beri Bintang Manual
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          {(['sepanjang_masa', 'bulanan', 'mingguan'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                periode === p
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {p === 'sepanjang_masa' ? 'Sepanjang Masa' : p === 'bulanan' ? 'Bulan Ini' : 'Minggu Ini'}
            </button>
          ))}
        </div>

        <select
          value={selectedKelas}
          onChange={(e) => setSelectedKelas(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          {DAFTAR_KELAS.map((k) => (
            <option key={k} value={k}>
              {k === 'Semua' ? 'Semua Kelas' : `Kelas ${k}`}
            </option>
          ))}
        </select>
      </div>

      {/* TOP 3 PODIUM */}
      {leaderboard.length >= 3 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-white shadow-xl">
          <div className="text-center mb-6">
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
              Podium Bintang Teraktif
            </span>
            <h3 className="text-lg sm:text-xl font-black mt-1">Juara Apresiasi Belajar Geografi</h3>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-xl mx-auto pt-4">
            {/* Rank 2 (Silver) */}
            {top2 && (
              <div className="flex flex-col items-center">
                <img
                  src={top2.siswa.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                  alt={top2.siswa.nama}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-slate-400 mb-2"
                />
                <p className="font-bold text-xs sm:text-sm text-center truncate max-w-[90px] sm:max-w-[120px]">
                  {top2.siswa.nama.split(' ')[0]}
                </p>
                <span className="text-[10px] text-slate-400">Kelas {top2.siswa.kelas}</span>
                <div className="w-full h-24 sm:h-28 bg-slate-800 rounded-t-2xl flex flex-col items-center justify-center mt-3 border-t-4 border-slate-400">
                  <span className="text-lg sm:text-xl font-black">2</span>
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1 mt-1">
                    {top2.totalBintang} ⭐
                  </span>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold) */}
            {top1 && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">👑</span>
                  <img
                    src={top1.siswa.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={top1.siswa.nama}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-amber-400 shadow-lg shadow-amber-400/20 mb-2"
                  />
                </div>
                <p className="font-black text-xs sm:text-sm text-center text-amber-300 truncate max-w-[90px] sm:max-w-[120px]">
                  {top1.siswa.nama.split(' ')[0]}
                </p>
                <span className="text-[10px] text-slate-400">Kelas {top1.siswa.kelas}</span>
                <div className="w-full h-32 sm:h-36 bg-gradient-to-t from-amber-950/80 to-amber-900/60 rounded-t-2xl flex flex-col items-center justify-center mt-3 border-t-4 border-amber-400">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400">1</span>
                  <span className="text-sm text-amber-300 font-black flex items-center gap-1 mt-1">
                    {top1.totalBintang} ⭐
                  </span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3 && (
              <div className="flex flex-col items-center">
                <img
                  src={top3.siswa.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                  alt={top3.siswa.nama}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-amber-700 mb-2"
                />
                <p className="font-bold text-xs sm:text-sm text-center truncate max-w-[90px] sm:max-w-[120px]">
                  {top3.siswa.nama.split(' ')[0]}
                </p>
                <span className="text-[10px] text-slate-400">Kelas {top3.siswa.kelas}</span>
                <div className="w-full h-20 sm:h-22 bg-slate-800 rounded-t-2xl flex flex-col items-center justify-center mt-3 border-t-4 border-amber-700">
                  <span className="text-base sm:text-lg font-black">3</span>
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1 mt-1">
                    {top3.totalBintang} ⭐
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Daftar Peringkat Siswa
        </h3>

        <div className="space-y-2.5">
          {leaderboard.map((item, idx) => {
            const isMe = item.siswa.id === user.id;
            return (
              <div
                key={item.siswa.id}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-4 ${
                  isMe
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-900'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <img
                    src={item.siswa.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={item.siswa.nama}
                    className="w-10 h-10 rounded-xl object-cover"
                  />

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {item.siswa.nama}
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-600 text-white rounded font-bold">
                          Saya
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      NIS: {item.siswa.username} &bull; Kelas: {item.siswa.kelas}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-amber-500 flex items-center gap-1 justify-end">
                      {item.totalBintang} <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                    </span>
                    <span className="text-[10px] text-slate-400">Total Bintang</span>
                  </div>

                  {isGuru && (
                    <button
                      onClick={() =>
                        setSelectedStudentForCert({
                          siswa: item.siswa,
                          totalBintang: item.totalBintang,
                          peringkat: idx + 1,
                        })
                      }
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs font-bold transition shadow-sm"
                      title="Cetak Piagam Apresiasi Siswa"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Piagam
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Gallery Showcase */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-500" />
            Galeri Lencana Prestasi Geografi
          </h3>
          <p className="text-xs text-slate-500">
            Koleksi lencana kehormatan yang terbuka otomatis saat siswa mencapai target belajar.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center flex flex-col items-center justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-2xl mb-2">
                {b.ikon}
              </div>
              <h5 className="font-bold text-xs text-slate-900 dark:text-white">{b.nama}</h5>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{b.deskripsi}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Piagam Penghargaan */}
      {selectedStudentForCert && (
        <CertificateModal
          siswa={selectedStudentForCert.siswa}
          totalBintang={selectedStudentForCert.totalBintang}
          peringkat={selectedStudentForCert.peringkat}
          onClose={() => setSelectedStudentForCert(null)}
        />
      )}

      {/* Modal Beri Bintang Manual (Guru Only) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Beri Bintang Apresiasi Manual
              </h3>
              <button onClick={() => setShowManualModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBeriBintangManual} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Pilih Siswa</label>
                <select
                  value={targetSiswaId}
                  onChange={(e) => setTargetSiswaId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas}) - NIS: {s.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Jumlah Poin Bintang</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={manualPoin}
                  onChange={(e) => setManualPoin(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Alasan Pemberian Apresiasi</label>
                <input
                  type="text"
                  required
                  value={manualAlasan}
                  onChange={(e) => setManualAlasan(e.target.value)}
                  placeholder="Contoh: Sangat aktif saat diskusi mitigasi bencana gempa bumi"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 font-semibold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  Kirim Bintang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
