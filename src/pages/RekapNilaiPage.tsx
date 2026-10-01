import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { Profile, Ujian } from '../types';
import { DB } from '../services/db';
import { DAFTAR_KELAS } from '../config/appConfig';

interface Props {
  user: Profile;
  initialUjianId?: string;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const RekapNilaiPage: React.FC<Props> = ({ user, initialUjianId, onNotify }) => {
  const isGuru = user.peran === 'guru';
  const allUjian = DB.ujian.daftar('guru');

  const [selectedUjianId, setSelectedUjianId] = useState<string>(
    initialUjianId || (allUjian.length > 0 ? allUjian[0].id : '')
  );
  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');
  const [activeTab, setActiveTab] = useState<'rekap' | 'analisis'>('rekap');

  // If student: only view their own test history!
  if (!isGuru) {
    const studentHistory = DB.nilai.riwayatSiswa(user.id);
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Riwayat Nilai & Hasil Ujian Saya
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Catatan skor penilaian harian dan evaluasi CBT yang telah Anda tuntaskan.
          </p>
        </div>

        {studentHistory.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 text-xs">Anda belum menyelesaikan ujian CBT apapun.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentHistory.map((h, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Bab: {h.ujian?.bab}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {h.ujian?.judul}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Standar KKM: {h.ujian?.kkm || 75} &bull; Selesai: {new Date(h.tanggal).toLocaleDateString('id-ID')}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600">{h.skor}</span>
                  <p className={`text-[10px] font-bold ${h.lulus ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {h.lulus ? 'LULUS KKM' : 'REMEDIAL'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Teacher View
  const currentUjian = allUjian.find((u) => u.id === selectedUjianId);
  const rekapList = selectedUjianId ? DB.nilai.rekap(selectedUjianId, selectedKelas) : [];
  const stats = selectedUjianId ? DB.nilai.statistik(selectedUjianId, selectedKelas) : null;
  const analisis = selectedUjianId ? DB.nilai.analisisButir(selectedUjianId) : [];

  const handleExportCSV = () => {
    if (!currentUjian || rekapList.length === 0) return;

    let csv = 'NIS,Nama Siswa,Kelas,Skor CBT,Status,Pindah Tab,Waktu Selesai\n';
    rekapList.forEach((r) => {
      csv += `"${r.siswa.username}","${r.siswa.nama}","${r.siswa.kelas}",${r.skor ?? 'N/A'},"${r.status}",${r.pindahTab},"${r.waktu || '-'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-nilai-${currentUjian.judul.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('File CSV Rekap Nilai berhasil diunduh.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBukaUlang = (siswaId: string, nama: string) => {
    if (confirm(`Buka kembali kesempatan ujian CBT untuk "${nama}" (Remedial)? Jawaban lama akan direset.`)) {
      const ok = DB.ujian.bukaUjianUlang(selectedUjianId, siswaId);
      if (ok) {
        onNotify(`Ujian untuk ${nama} berhasil dibuka ulang.`, 'success');
        // re-render
        setSelectedUjianId(selectedUjianId);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Rekap Nilai & Analisis Butir Soal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Statistik evaluasi belajar geografi, daya pembeda soal, dan ekspor lembar nilai resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition hover:bg-slate-100"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            Ekspor CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap Nilai
          </button>
        </div>
      </div>

      {/* Selectors and Tabs */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between no-print">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Pilih Ujian:</label>
            <select
              value={selectedUjianId}
              onChange={(e) => setSelectedUjianId(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {allUjian.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.judul} (Kelas: {u.kelas})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Filter Kelas:</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {DAFTAR_KELAS.map((k) => (
                <option key={k} value={k}>
                  {k === 'Semua' ? 'Semua Kelas' : `Kelas ${k}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'rekap'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Tabel Nilai Siswa
          </button>
          <button
            onClick={() => setActiveTab('analisis')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'analisis'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Analisis Butir Soal
          </button>
        </div>
      </div>

      {/* Print Title Header (Only visible when printed) */}
      <div className="hidden print-only mb-6 text-center">
        <h2 className="text-xl font-black uppercase tracking-wider">Laporan Hasil Penilaian CBT Geografi</h2>
        <p className="text-sm font-bold text-slate-700 mt-1">{currentUjian?.judul}</p>
        <p className="text-xs text-slate-500">
          Standar KKM: {currentUjian?.kkm} &bull; Kelas: {selectedKelas} &bull; Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Rata-Rata</span>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mt-1">{stats.rataRata}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Tertinggi</span>
            <h4 className="text-xl font-black text-emerald-600 mt-1">{stats.tertinggi}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Terendah</span>
            <h4 className="text-xl font-black text-rose-500 mt-1">{stats.terendah}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Median</span>
            <h4 className="text-xl font-black text-sky-500 mt-1">{stats.median}</h4>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Di Bawah KKM</span>
            <h4 className="text-xl font-black text-amber-600 mt-1">{stats.diBawahKkm} Siswa</h4>
          </div>
        </div>
      )}

      {/* Tab 1: Rekap Nilai Siswa Table */}
      {activeTab === 'rekap' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">NIS</th>
                  <th className="p-3.5">Nama Siswa</th>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5">Skor CBT</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Pindah Tab</th>
                  <th className="p-3.5 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {rekapList.map((row) => {
                  const kkm = currentUjian?.kkm || 75;
                  const lulus = (row.skor ?? 0) >= kkm;

                  return (
                    <tr key={row.siswa.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 font-mono text-slate-500">{row.siswa.username}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{row.siswa.nama}</td>
                      <td className="p-3.5 text-slate-500">{row.siswa.kelas}</td>
                      <td className="p-3.5">
                        {row.skor !== null ? (
                          <span className="text-sm font-black text-emerald-600">{row.skor}</span>
                        ) : (
                          <span className="text-slate-400 italic">Belum Mengerjakan</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {row.skor !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              lulus
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {lulus ? 'TUNTAS' : 'REMEDIAL'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {row.pindahTab > 0 ? (
                          <span className="text-amber-600 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {row.pindahTab}x
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="p-3.5 no-print">
                        {row.skor !== null && (
                          <button
                            onClick={() => handleBukaUlang(row.siswa.id, row.siswa.nama)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg text-[11px] font-bold transition"
                            title="Buka ujian ulang untuk remedial siswa ini"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Buka Ulang
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Analisis Butir Soal */}
      {activeTab === 'analisis' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Analisis Butir Soal CBT
            </h3>
            <p className="text-xs text-slate-500">
              Menilai tingkat kesulitan butir soal dan efektivitas pengecoh jawaban.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase">
                <tr>
                  <th className="p-3">No.</th>
                  <th className="p-3">Pertanyaan</th>
                  <th className="p-3">Kunci</th>
                  <th className="p-3">Menjawab Benar</th>
                  <th className="p-3">Daya Beda</th>
                  <th className="p-3">Pengecoh Terbanyak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {analisis.map((item) => (
                  <tr key={item.nomor} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300">#{item.nomor}</td>
                    <td className="p-3 max-w-sm truncate text-slate-800 dark:text-slate-200">{item.soal.teks}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600">{item.soal.kunci}</td>
                    <td className="p-3 font-semibold">
                      {item.benarCount} / {item.totalMengerjakan} ({item.persentaseBenar}%)
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.dayaBeda === 'Mudah'
                            ? 'bg-sky-100 text-sky-800'
                            : item.dayaBeda === 'Sukar'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.dayaBeda}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{item.pengecohPopuler}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
