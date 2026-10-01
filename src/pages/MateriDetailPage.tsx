import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Calendar,
  User,
  Eye,
  Type,
  Moon,
  Sun,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DB } from '../services/db';
import { Profile } from '../types';

interface Props {
  user: Profile;
  materiId: string;
  onNavigate: (tab: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onStarEarned?: () => void;
}

export const MateriDetailPage: React.FC<Props> = ({ user, materiId, onNavigate, onNotify, onStarEarned }) => {
  const materi = DB.materi.getById(materiId);
  const isGuru = user.peran === 'guru';
  const [isRead, setIsRead] = useState<boolean>(DB.materi.isMateriDibaca(materiId, user.id));
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [sepiaMode, setSepiaMode] = useState(false);

  if (!materi) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Materi tidak ditemukan.</p>
        <button
          onClick={() => onNavigate('materi')}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Daftar Materi
        </button>
      </div>
    );
  }

  const handleMarkAsRead = () => {
    if (isRead) return;

    const res = DB.materi.tandaiSelesai(materiId, user.id);
    if (res.success) {
      setIsRead(true);
      if (onStarEarned) onStarEarned();

      // Confetti celebration
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });

      onNotify('Hebat! Anda tuntas membaca materi ini dan mendapatkan +1 Bintang Apresiasi!', 'success');
    }
  };

  const fontSizeClasses = {
    sm: 'text-xs sm:text-sm',
    base: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation & Reader Controls */}
      <div className="flex items-center justify-between gap-2 no-print">
        <button
          onClick={() => onNavigate('materi')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Daftar Materi
        </button>

        {/* Reader Customizer Toolbar */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
          <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold">UKURAN FONT:</span>
            {(['sm', 'base', 'lg', 'xl'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`w-6 h-6 rounded flex items-center justify-center font-bold ${
                  fontSize === size
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {size === 'sm' ? 'A-' : size === 'base' ? 'A' : size === 'lg' ? 'A+' : 'A++'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSepiaMode(!sepiaMode)}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
              sepiaMode ? 'bg-amber-100 text-amber-900' : 'text-slate-600 dark:text-slate-300'
            }`}
            title="Mode Baca Hangat / Sepia"
          >
            Sepia
          </button>
        </div>
      </div>

      {/* Main Article Container */}
      <article
        className={`rounded-3xl border shadow-sm p-6 sm:p-10 transition-colors ${
          sepiaMode
            ? 'bg-amber-50/70 text-amber-950 border-amber-200'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Header Metadata */}
        <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
              {materi.bab}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              Kelas: {materi.kelas}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            {materi.judul}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Pak Guru Geografi
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(materi.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {materi.pembaca_count} kali dibaca
            </span>
          </div>
        </div>

        {/* Hero Cover Image */}
        {materi.sampul_url && (
          <div className="my-6 rounded-2xl overflow-hidden max-h-96 shadow-md">
            <img
              src={materi.sampul_url}
              alt={materi.judul}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Lead Summary */}
        {materi.ringkasan && (
          <div className="my-6 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-600 text-slate-700 dark:text-slate-300 text-xs sm:text-sm italic leading-relaxed">
            "{materi.ringkasan}"
          </div>
        )}

        {/* Content Body */}
        <div
          className={`space-y-4 leading-relaxed prose dark:prose-invert max-w-none ${fontSizeClasses[fontSize]}`}
          dangerouslySetInnerHTML={{ __html: materi.isi }}
        />

        {/* Tags */}
        {materi.tag && materi.tag.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-400">Kata Kunci:</span>
            {materi.tag.map((t) => (
              <span
                key={t}
                className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Bottom Finish Reading Card (for students) */}
        {!isGuru && (
          <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isRead ? 'Hebat! Kamu Sudah Membaca Tuntas Materi Ini' : 'Selesai Membaca Modul Ini?'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {isRead
                ? 'Bintang apresiasi sebesar +1 Bintang sudah ditambahkan ke saldomu.'
                : 'Tekan tombol di bawah untuk menandai materi telah selesai dibaca dan klaim +1 Bintang Apresiasi!'}
            </p>

            <button
              onClick={handleMarkAsRead}
              disabled={isRead}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md ${
                isRead
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isRead ? 'Sudah Tuntas (+1⭐ Diperoleh)' : 'Tandai Selesai Dibaca (+1⭐)'}
            </button>
          </div>
        )}
      </article>
    </div>
  );
};
