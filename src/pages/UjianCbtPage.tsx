import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  Flag,
  Sparkles,
  ShieldAlert,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Jawaban, PercobaanUjian, Profile, Soal, Ujian } from '../types';
import { DB } from '../services/db';

interface Props {
  user: Profile;
  ujianId: string;
  onNavigate: (tab: string, meta?: any) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onStarEarned?: () => void;
}

export const UjianCbtPage: React.FC<Props> = ({ user, ujianId, onNavigate, onNotify, onStarEarned }) => {
  const isGuru = user.peran === 'guru';
  const { ujian, soalList } = DB.ujian.getById(ujianId, isGuru ? 'guru' : 'siswa');

  const [percobaan, setPercobaan] = useState<PercobaanUjian | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [jawabanMap, setJawabanMap] = useState<Record<string, { pilihan: string; ragu: boolean }>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [tabSwitchAlert, setTabSwitchAlert] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultData, setResultData] = useState<any>(null);

  // 1. Inisialisasi CBT
  useEffect(() => {
    if (!ujian) return;

    // Mulai atau ambil percobaan ujian
    const perc = DB.ujian.mulaiUjian(ujianId, user.id);
    setPercobaan(perc);

    // Ambil jawaban yang sudah tersimpan sebelumnya
    const savedJwb = DB.ujian.getJawaban(perc.id);
    const map: Record<string, { pilihan: string; ragu: boolean }> = {};
    savedJwb.forEach((j) => {
      if (j.soal_id) {
        map[j.soal_id] = { pilihan: j.pilihan || '', ragu: j.ragu };
      }
    });
    setJawabanMap(map);

    // Hitung sisa waktu server
    const batasTime = new Date(perc.batas).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((batasTime - now) / 1000));
    setSecondsLeft(remaining);

    // Jika sudah selesai sebelumnya
    if (perc.status === 'selesai') {
      const allPercobaan = DB.ujian.getPercobaan(ujianId, user.id);
      setResultData({
        skor: allPercobaan?.skor ?? 0,
        benar: 0,
        total: soalList.length,
        lulus: (allPercobaan?.skor ?? 0) >= (ujian.kkm || 75),
        bintangDapat: 0,
        alreadyFinished: true,
      });
    }
  }, [ujianId]);

  // 2. Timer Countdown Server
  useEffect(() => {
    if (!percobaan || percobaan.status === 'selesai' || resultData) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [percobaan, resultData]);

  // 3. Anti-Curang: Deteksi Pindah Tab / Window Blur
  useEffect(() => {
    if (!percobaan || percobaan.status === 'selesai' || resultData) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (percobaan?.id) {
          const count = DB.ujian.catatPindahTab(percobaan.id);
          setTabSwitchAlert(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [percobaan, resultData]);

  const handleSelectOption = (soalId: string, label: string) => {
    if (percobaan?.status === 'selesai' || resultData) return;

    const cur = jawabanMap[soalId] || { pilihan: '', ragu: false };
    const updated = { ...cur, pilihan: label };

    setJawabanMap((prev) => ({ ...prev, [soalId]: updated }));
    DB.ujian.simpanJawaban(percobaan!.id, soalId, label, updated.ragu);
  };

  const handleToggleRagu = (soalId: string) => {
    if (percobaan?.status === 'selesai' || resultData) return;

    const cur = jawabanMap[soalId] || { pilihan: '', ragu: false };
    const updated = { ...cur, ragu: !cur.ragu };

    setJawabanMap((prev) => ({ ...prev, [soalId]: updated }));
    DB.ujian.simpanJawaban(percobaan!.id, soalId, updated.pilihan, updated.ragu);
  };

  const handleAutoSubmit = () => {
    onNotify('Waktu ujian telah berakhir! Sistem otomatis mengumpulkan lembar jawaban.', 'info');
    handleSubmitExam();
  };

  const handleSubmitExam = () => {
    if (!percobaan) return;

    setIsSubmitting(true);
    setTimeout(() => {
      try {
        const res = DB.ujian.kirimUjian(percobaan.id, user.id);
        setResultData(res);
        setIsSubmitting(false);

        if (onStarEarned) onStarEarned();

        // Confetti celebration if passed KKM
        if (res.lulus) {
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.6 },
          });
        }
      } catch (err: any) {
        setIsSubmitting(false);
        onNotify('Gagal mengumpulkan ujian: ' + err.message, 'error');
      }
    }, 600);
  };

  if (!ujian || soalList.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Ujian tidak ditemukan atau belum memiliki butir soal.</p>
        <button
          onClick={() => onNavigate('ujian')}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Daftar Ujian
        </button>
      </div>
    );
  }

  // Format Timer mm:ss
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = secondsLeft <= 180; // 3 menit terakhir

  // Current Question
  const currentSoal = soalList[currentIdx];
  const curJwb = jawabanMap[currentSoal?.id] || { pilihan: '', ragu: false };

  // ==========================================
  // HASIL UJIAN SCREEN
  // ==========================================
  if (resultData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-lg space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Hasil CBT Terverifikasi
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {ujian.judul}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Siswa: {user.nama} ({user.kelas})</p>
          </div>

          {/* Score Circle */}
          <div className="py-4">
            <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40">
              <span className="text-4xl font-black text-emerald-700 dark:text-emerald-400">
                {resultData.skor}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Skor Akhir
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-400">Standar KKM</p>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{ujian.kkm}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-slate-400">Status Kelulusan</p>
              <p className={`font-extrabold mt-0.5 ${resultData.lulus ? 'text-emerald-600' : 'text-rose-500'}`}>
                {resultData.lulus ? 'Tuntas / Lulus' : 'Belum Tuntas'}
              </p>
            </div>
          </div>

          {resultData.bintangDapat > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>Selamat! Kamu memperoleh +{resultData.bintangDapat} Bintang Apresiasi!</span>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => onNavigate('ujian')}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              Kembali ke Menu Ujian
            </button>
            <button
              onClick={() => onNavigate('bintang')}
              className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              Lihat Papan Bintang
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CBT LIVE RUNNER
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Anti-Cheat Alert Popup */}
      {tabSwitchAlert && (
        <div className="p-3.5 rounded-2xl bg-rose-950 text-rose-100 border border-rose-700 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong>Peringatan Integritas Ujian:</strong> Anda terdeteksi berpindah tab atau meninggalkan jendela ujian. Aktivitas ini dicatat dalam laporan guru.
            </div>
          </div>
          <button
            onClick={() => setTabSwitchAlert(false)}
            className="px-3 py-1 bg-rose-800 hover:bg-rose-700 rounded-lg text-xs font-bold shrink-0 ml-2"
          >
            Saya Mengerti
          </button>
        </div>
      )}

      {/* CBT Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
            CBT Ruang Geografi &bull; {ujian.kelas}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
            {ujian.judul}
          </h3>
        </div>

        {/* Server Countdown Timer */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base ${
            isTimeCritical
              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 text-rose-600 dark:text-rose-400 animate-pulse'
              : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 text-emerald-700 dark:text-emerald-300'
          }`}
          title="Batas waktu dihitung dari jam server"
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>{timeDisplay}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Soal Area (3 Cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-extrabold text-slate-900 dark:text-white">
                Soal Nomor {currentIdx + 1} dari {soalList.length}
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-amber-600 dark:text-amber-400 font-bold">
                <input
                  type="checkbox"
                  checked={curJwb.ragu}
                  onChange={() => handleToggleRagu(currentSoal.id)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <Flag className="w-3.5 h-3.5" />
                <span>Ragu-ragu</span>
              </label>
            </div>

            {/* Question Text */}
            <div className="py-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {currentSoal.teks}
            </div>

            {/* Diagram Image if any */}
            {currentSoal.gambar_url && (
              <div className="my-3 rounded-xl overflow-hidden max-h-60 border border-slate-200 dark:border-slate-700">
                <img src={currentSoal.gambar_url} alt="Soal Peta" className="w-full h-full object-contain" />
              </div>
            )}

            {/* Options A - E */}
            <div className="space-y-2.5 mt-4">
              {currentSoal.opsi.map((opt) => {
                const isSelected = curJwb.pilihan === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelectOption(currentSoal.id, opt.label)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition flex items-center gap-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="leading-snug">{opt.teks}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" /> Soal Sebelumnya
            </button>

            {currentIdx === soalList.length - 1 ? (
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Mengirim Lembar Jawaban...' : 'Kumpulkan Ujian'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx(Math.min(soalList.length - 1, currentIdx + 1))}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition"
              >
                Soal Berikutnya <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Palette Sidebar (1 Col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Navigasi Nomor Soal
            </h4>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 my-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block" /> Dijawab
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Ragu-ragu
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 inline-block" /> Belum
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded ring-2 ring-emerald-500 inline-block" /> Aktif
              </span>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
              {soalList.map((s, idx) => {
                const jwb = jawabanMap[s.id];
                const isAnswered = !!jwb?.pilihan;
                const isRagu = !!jwb?.ragu;
                const isCurrent = currentIdx === idx;

                let bgClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                if (isRagu) {
                  bgClass = 'bg-amber-500 text-white';
                } else if (isAnswered) {
                  bgClass = 'bg-emerald-600 text-white';
                }

                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center transition ${bgClass} ${
                      isCurrent ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 scale-105' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Selesai & Kumpulkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
