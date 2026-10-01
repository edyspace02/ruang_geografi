import React from 'react';
import {
  BookOpen,
  FileCheck2,
  Award,
  Gamepad2,
  Users,
  Flame,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Clock,
  CheckCircle2,
  PlayCircle,
  PlusCircle,
} from 'lucide-react';
import { Profile } from '../types';
import { DB } from '../services/db';

interface Props {
  user: Profile;
  onNavigate: (tab: string, meta?: any) => void;
  onOpenGuide: () => void;
}

export const DashboardPage: React.FC<Props> = ({ user, onNavigate, onOpenGuide }) => {
  const isGuru = user.peran === 'guru';
  const config = DB.pengaturan.get();

  // Guru Stats
  const allStudents = DB.auth.getAllProfiles().filter((p) => p.peran === 'siswa');
  const allMateri = DB.materi.daftar('guru');
  const allUjian = DB.ujian.daftar('guru');
  const activeUjian = allUjian.filter((u) => u.status === 'aktif');
  const leaderboard = DB.bintang.papanBintang('sepanjang_masa', 'Semua');
  const topStudents = leaderboard.slice(0, 3);

  // Siswa Stats
  const starBalance = DB.bintang.getSaldo(user.id);
  const myBadges = DB.lencana.getLencanaSiswa(user.id);
  const siswaMateri = DB.materi.daftar('siswa', user.kelas);
  const siswaUjian = DB.ujian.daftar('siswa', user.kelas);
  const recentHistory = DB.nilai.riwayatSiswa(user.id);

  if (isGuru) {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              Dashboard Guru Geografi
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
              Selamat Datang, {user.nama}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Kelola materi pembelajaran, selenggarakan ujian CBT daring, pantau analitik ketuntasan siswa, dan apresiasi bintang di <strong>{config.namaSekolah}</strong>.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={() => onNavigate('materi', { action: 'baru' })}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Tulis Materi Baru
              </button>
              <button
                onClick={() => onNavigate('ujian', { action: 'baru' })}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs backdrop-blur-sm border border-white/20 transition"
              >
                <FileCheck2 className="w-4 h-4" />
                Buat Ujian CBT
              </button>
              <button
                onClick={() => onNavigate('kelola-game')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition shadow-md"
              >
                <Gamepad2 className="w-4 h-4" />
                Kelola Game & Sesi
              </button>
              <button
                onClick={onOpenGuide}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600/80 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition"
              >
                <BookOpen className="w-4 h-4" />
                Buku Panduan
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Siswa Aktif</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{allStudents.length}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Tersebar di {config.namaSekolah}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Materi Terbit</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {allMateri.filter((m) => m.status === 'terbit').length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">{allMateri.length} total modul</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ujian Berlangsung</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeUjian.length}</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">Status CBT Aktif</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Bintang</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {leaderboard.reduce((a, b) => a + b.totalBintang, 0)}
              </h3>
              <p className="text-[11px] text-teal-600 font-semibold mt-1">Apresiasi Belajar</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2 Column Layout: Ujian Aktif & Top Siswa */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ujian Aktif List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Ujian CBT Sedang Aktif
              </h3>
              <button
                onClick={() => onNavigate('ujian')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeUjian.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada ujian yang berstatus aktif saat ini.</p>
            ) : (
              <div className="space-y-3">
                {activeUjian.map((uj) => (
                  <div
                    key={uj.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4 transition"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{uj.judul}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Bab: {uj.bab} &bull; Target: {uj.kelas} &bull; Durasi: {uj.durasi_menit} Menit &bull; KKM: {uj.kkm}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('nilai', { ujianId: uj.id })}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shrink-0"
                    >
                      Pantau Nilai
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top 3 Bintang Siswa */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Siswa Paling Aktif (Top 3)
              </h3>
              <button
                onClick={() => onNavigate('bintang')}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
              >
                Papan Juara
              </button>
            </div>

            <div className="space-y-3">
              {topStudents.map((item, idx) => (
                <div
                  key={item.siswa.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                        {item.siswa.nama}
                      </p>
                      <p className="text-[10px] text-slate-400">Kelas {item.siswa.kelas}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600 font-extrabold text-xs">
                    <span>{item.totalBintang}</span>
                    <Sparkles className="w-3 h-3 fill-amber-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Siswa
  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-800 to-sky-900 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold border border-emerald-400/30">
              Siswa Kelas {user.kelas}
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-bold border border-amber-400/30">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Streak 3 Hari
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
            Halo, {user.nama}! Siap Belajar Geografi?
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm mt-2 leading-relaxed">
            Kumpulkan Bintang Apresiasi dengan membaca materi tuntas, menuntaskan ujian CBT, dan memuncaki papan juara Game Edukasi!
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-xs">
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span><strong>{starBalance}</strong> Bintang Terkumpul</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-xs">
              <Award className="w-4 h-4 text-emerald-300" />
              <span><strong>{myBadges.length}</strong> Lencana Diraih</span>
            </div>
          </div>
        </div>
      </div>

      {/* CBT Ujian Alert (If Available) */}
      {siswaUjian.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                Ujian CBT Tersedia
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {siswaUjian[0].judul}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Durasi: {siswaUjian[0].durasi_menit} Menit &bull; KKM: {siswaUjian[0].kkm}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('ujian-cbt', { ujianId: siswaUjian[0].id })}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition self-start sm:self-auto shrink-0 flex items-center gap-1.5"
          >
            <PlayCircle className="w-4 h-4" />
            Mulai Ujian Sekarang
          </button>
        </div>
      )}

      {/* 2 Column: Materi Terbaru & Main Game */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Materi Pelajaran Terbaru */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Materi Pelajaran Terbaru
            </h3>
            <button
              onClick={() => onNavigate('materi')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {siswaMateri.slice(0, 3).map((mat) => {
              const sudahDibaca = DB.materi.isMateriDibaca(mat.id, user.id);
              return (
                <div
                  key={mat.id}
                  onClick={() => onNavigate('materi-detail', { materiId: mat.id })}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4 transition cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {mat.bab}
                      </span>
                      {sudahDibaca && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Sudah Dibaca (+1⭐)
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                      {mat.judul}
                    </h4>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0 transition" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Edukasi Promo Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 mb-3">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold">Tantangan Game Geografi</h3>
            <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
              Mainkan Tebak Peta Indonesia & Susun Lapisan Bumi. Dapatkan poin bintang ekstra untuk setiap kemenangan!
            </p>
          </div>
          <button
            onClick={() => onNavigate('games')}
            className="w-full mt-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
          >
            <Gamepad2 className="w-4 h-4" />
            Main Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
