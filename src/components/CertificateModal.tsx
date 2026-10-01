import React from 'react';
import { Award, Printer, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { Profile } from '../types';
import { DEFAULT_CONFIG } from '../config/appConfig';
import { DB } from '../services/db';

interface Props {
  siswa: Profile;
  totalBintang: number;
  peringkat: number;
  onClose: () => void;
}

export const CertificateModal: React.FC<Props> = ({ siswa, totalBintang, peringkat, onClose }) => {
  const config = DB.pengaturan.get();
  const currentDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative my-8">
        {/* Modal Header Actions (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Pratinjau Sertifikat Apresiasi Siswa
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas Area */}
        <div className="mt-4 p-8 sm:p-12 border-8 border-double border-amber-600/60 bg-amber-50/20 dark:bg-slate-950 rounded-xl text-center relative overflow-hidden print-break-inside-avoid">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 left-2 text-amber-600 text-2xl font-serif">❖</div>
          <div className="absolute top-2 right-2 text-amber-600 text-2xl font-serif">❖</div>
          <div className="absolute bottom-2 left-2 text-amber-600 text-2xl font-serif">❖</div>
          <div className="absolute bottom-2 right-2 text-amber-600 text-2xl font-serif">❖</div>

          {/* School Name */}
          <p className="text-xs uppercase tracking-widest font-extrabold text-emerald-800 dark:text-emerald-400">
            {config.namaSekolah || DEFAULT_CONFIG.namaSekolah}
          </p>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">
            Komunitas Belajar Ruang Geografi
          </p>

          <div className="my-6">
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-slate-900 dark:text-white uppercase">
              Piagam Penghargaan
            </h1>
            <div className="w-24 h-1 bg-amber-500 mx-auto mt-2 rounded-full" />
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Diberikan dengan penuh rasa bangga dan apresiasi kepada:
          </p>

          <h2 className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 my-4 tracking-tight">
            {siswa.nama}
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            NIS: <strong className="text-slate-800 dark:text-slate-200">{siswa.username}</strong> &bull; Kelas:{' '}
            <strong className="text-slate-800 dark:text-slate-200">{siswa.kelas}</strong>
          </p>

          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-lg mx-auto mt-4 leading-relaxed">
            Atas dedikasi, keaktifan luar biasa, dan ketuntasan belajar dalam mata pelajaran <strong>Geografi</strong>,
            berhasil mengumpulkan <strong>{totalBintang} Bintang Apresiasi</strong> dan meraih{' '}
            <strong>Peringkat ke-{peringkat}</strong> di Ruang Geografi.
          </p>

          {/* Signatures */}
          <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-xs text-slate-700 dark:text-slate-300">
            <div>
              <p className="text-[11px] text-slate-500">Tanggal Terbit</p>
              <p className="font-semibold mt-1">{currentDate}</p>
              <div className="mt-8 text-center">
                <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-full border border-amber-300">
                  RESMI TERVERIFIKASI
                </span>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Guru Mata Pelajaran</p>
              <div className="h-10 flex items-center justify-center font-serif italic text-slate-400 text-sm">
                (Tertanda secara digital)
              </div>
              <p className="font-bold underline text-slate-900 dark:text-white">
                {config.namaGuru || DEFAULT_CONFIG.namaGuru}
              </p>
              <p className="text-[10px] text-slate-500">NIP / Pendidik Geografi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
