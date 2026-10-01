import React, { useState } from 'react';
import {
  FileQuestion,
  Plus,
  FileText,
  Search,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  HelpCircle,
} from 'lucide-react';
import { Soal, Profile } from '../types';
import { DB } from '../services/db';
import { DAFTAR_BAB } from '../config/appConfig';

interface Props {
  user: Profile;
  onNavigate: (tab: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UjianBankSoalPage: React.FC<Props> = ({ user, onNavigate, onNotify }) => {
  const [soalList, setSoalList] = useState<Soal[]>(DB.soal.daftar());
  const [selectedBab, setSelectedBab] = useState<string>('Semua');
  const [search, setSearch] = useState<string>('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [editingSoal, setEditingSoal] = useState<Soal | null>(null);

  // Form State for Single Add
  const [formBab, setFormBab] = useState(DAFTAR_BAB[0]);
  const [formTeks, setFormTeks] = useState('');
  const [formGambarUrl, setFormGambarUrl] = useState('');
  const [formOpsiA, setFormOpsiA] = useState('');
  const [formOpsiB, setFormOpsiB] = useState('');
  const [formOpsiC, setFormOpsiC] = useState('');
  const [formOpsiD, setFormOpsiD] = useState('');
  const [formOpsiE, setFormOpsiE] = useState('');
  const [formKunci, setFormKunci] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [formPembahasan, setFormPembahasan] = useState('');
  const [formKesulitan, setFormKesulitan] = useState<'mudah' | 'sedang' | 'sukar'>('sedang');

  const refreshList = () => {
    setSoalList(DB.soal.daftar());
  };

  const handleOpenEdit = (s: Soal) => {
    setEditingSoal(s);
    setFormBab(s.bab);
    setFormTeks(s.teks);
    setFormGambarUrl(s.gambar_url || '');
    setFormOpsiA(s.opsi.find((o) => o.label === 'A')?.teks || '');
    setFormOpsiB(s.opsi.find((o) => o.label === 'B')?.teks || '');
    setFormOpsiC(s.opsi.find((o) => o.label === 'C')?.teks || '');
    setFormOpsiD(s.opsi.find((o) => o.label === 'D')?.teks || '');
    setFormOpsiE(s.opsi.find((o) => o.label === 'E')?.teks || '');
    setFormKunci((s.kunci as any) || 'A');
    setFormPembahasan(s.pembahasan || '');
    setFormKesulitan(s.kesulitan);
    setShowAddModal(true);
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeks.trim() || !formOpsiA.trim() || !formOpsiB.trim()) {
      onNotify('Teks soal dan minimal opsi A & B harus diisi!', 'error');
      return;
    }

    DB.soal.simpan({
      id: editingSoal?.id,
      bab: formBab,
      teks: formTeks,
      gambar_url: formGambarUrl,
      opsi: [
        { label: 'A', teks: formOpsiA },
        { label: 'B', teks: formOpsiB },
        { label: 'C', teks: formOpsiC },
        { label: 'D', teks: formOpsiD },
        { label: 'E', teks: formOpsiE },
      ],
      bobot: 1,
      kesulitan: formKesulitan,
      kunci: formKunci,
      pembahasan: formPembahasan,
    });

    setShowAddModal(false);
    setEditingSoal(null);
    refreshList();
    onNotify('Soal berhasil disimpan ke bank soal!', 'success');
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus soal ini dari bank soal?')) {
      DB.soal.hapus(id);
      refreshList();
      onNotify('Soal berhasil dihapus.', 'info');
    }
  };

  // Parser Impor Teks Soal Massal
  const handleParseAndImport = () => {
    if (!importText.trim()) return;

    const rawBlocks = importText.split(/\n(?=\d+[\.\)])/g);
    const parsedSoalList: Partial<Soal>[] = [];

    rawBlocks.forEach((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 3) return;

      let teks = '';
      const opsi: { label: 'A' | 'B' | 'C' | 'D' | 'E'; teks: string }[] = [];
      let kunci = 'A';
      let pembahasan = '';

      lines.forEach((line) => {
        // Match nomor awal misal "1. Teks..."
        const matchNum = line.match(/^\d+[\.\)]\s*(.+)/);
        if (matchNum && !teks) {
          teks = matchNum[1];
          return;
        }

        // Match opsi misal "A. Opsi A"
        const matchOpsi = line.match(/^([A-E])[\.\)]\s*(.+)/i);
        if (matchOpsi) {
          opsi.push({
            label: matchOpsi[1].toUpperCase() as any,
            teks: matchOpsi[2],
          });
          return;
        }

        // Match Kunci: B
        const matchKunci = line.match(/^(?:Kunci|Jawaban)\s*:\s*([A-E])/i);
        if (matchKunci) {
          kunci = matchKunci[1].toUpperCase();
          return;
        }

        // Match Pembahasan: ...
        const matchPembahasan = line.match(/^Pembahasan\s*:\s*(.+)/i);
        if (matchPembahasan) {
          pembahasan = matchPembahasan[1];
          return;
        }

        // Jika baris lanjutan teks soal
        if (!opsi.length && !line.startsWith('Kunci')) {
          teks += ' ' + line;
        }
      });

      if (teks && opsi.length >= 2) {
        parsedSoalList.push({
          bab: selectedBab !== 'Semua' ? selectedBab : DAFTAR_BAB[0],
          teks,
          opsi,
          kunci,
          pembahasan,
          kesulitan: 'sedang',
          bobot: 1,
        });
      }
    });

    if (parsedSoalList.length === 0) {
      onNotify('Format teks tidak sesuai. Pastikan ada nomor, opsi A-E, dan Kunci: X.', 'error');
      return;
    }

    const count = DB.soal.importBatch(parsedSoalList);
    setShowImportModal(false);
    setImportText('');
    refreshList();
    onNotify(`Berhasil mengimpor ${count} soal baru ke Bank Soal!`, 'success');
  };

  const filtered = soalList.filter((s) => {
    const matchBab = selectedBab === 'Semua' || s.bab === selectedBab;
    const matchSearch = s.teks.toLowerCase().includes(search.toLowerCase());
    return matchBab && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileQuestion className="w-6 h-6 text-emerald-600" />
            Bank Soal Geografi ({soalList.length} Soal)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Penyimpanan soal pilihan ganda, kunci jawaban, dan pembahasan materi geografi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition hover:bg-slate-100"
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            Impor dari Teks
          </button>
          <button
            onClick={() => {
              setEditingSoal(null);
              setFormTeks('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            Tambah Soal
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari teks soal atau kata kunci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <select
          value={selectedBab}
          onChange={(e) => setSelectedBab(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="Semua">Semua Bab Geografi</option>
          {DAFTAR_BAB.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Soal List */}
      <div className="space-y-4">
        {filtered.map((s, idx) => (
          <div
            key={s.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-600">#{idx + 1}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {s.bab}
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                  {s.kesulitan}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg"
                  title="Edit Soal"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg"
                  title="Hapus Soal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-900 dark:text-white font-medium leading-relaxed">
              {s.teks}
            </p>

            {/* Options display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              {s.opsi.map((opt) => (
                <div
                  key={opt.label}
                  className={`p-2 rounded-xl border flex items-center gap-2 ${
                    opt.label === s.kunci
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                      : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                      opt.label === s.kunci ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span>{opt.teks}</span>
                  {opt.label === s.kunci && (
                    <span className="text-[10px] text-emerald-600 font-extrabold ml-auto">(KUNCI)</span>
                  )}
                </div>
              ))}
            </div>

            {s.pembahasan && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                <strong className="text-slate-800 dark:text-slate-200">Pembahasan:</strong> {s.pembahasan}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Impor Teks Soal Cepat */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Impor Soal Massal dari Teks
              </h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-2">
              Salin dan tempelkan kumpulan soal pilihan ganda sesuai format di bawah ini:
            </p>

            <textarea
              rows={10}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`1. Lapisan bumi paling luar disebut...
A. Mantel
B. Kerak bumi
C. Inti luar
D. Inti dalam
E. Astenosfer
Kunci: B
Pembahasan: Kerak bumi adalah lapisan terluar.`}
              className="w-full p-3 font-mono text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Batal
              </button>
              <button
                onClick={handleParseAndImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Proses & Impor Soal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah / Edit Soal Tunggal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSoal ? 'Edit Butir Soal' : 'Tambah Soal Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Bab Geografi</label>
                  <select
                    value={formBab}
                    onChange={(e) => setFormBab(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {DAFTAR_BAB.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Tingkat Kesulitan</label>
                  <select
                    value={formKesulitan}
                    onChange={(e) => setFormKesulitan(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sukar">Sukar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Teks Pertanyaan</label>
                <textarea
                  rows={3}
                  required
                  value={formTeks}
                  onChange={(e) => setFormTeks(e.target.value)}
                  placeholder="Tuliskan butir soal geografi..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Opsi A - E */}
              <div className="space-y-2">
                <label className="font-bold block">Pilihan Jawaban (A - E)</label>
                {[
                  { label: 'A', val: formOpsiA, set: setFormOpsiA },
                  { label: 'B', val: formOpsiB, set: setFormOpsiB },
                  { label: 'C', val: formOpsiC, set: setFormOpsiC },
                  { label: 'D', val: formOpsiD, set: setFormOpsiD },
                  { label: 'E', val: formOpsiE, set: setFormOpsiE },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="w-6 font-bold text-center">{item.label}.</span>
                    <input
                      type="text"
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      placeholder={`Pilihan ${item.label}...`}
                      className="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold block mb-1">Kunci Jawaban Benar</label>
                  <select
                    value={formKunci}
                    onChange={(e) => setFormKunci(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950 font-bold text-emerald-700 dark:text-emerald-300"
                  >
                    <option value="A">Opsi A</option>
                    <option value="B">Opsi B</option>
                    <option value="C">Opsi C</option>
                    <option value="D">Opsi D</option>
                    <option value="E">Opsi E</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">URL Gambar Diagram (Opsional)</label>
                  <input
                    type="url"
                    value={formGambarUrl}
                    onChange={(e) => setFormGambarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Pembahasan Soal</label>
                <textarea
                  rows={2}
                  value={formPembahasan}
                  onChange={(e) => setFormPembahasan(e.target.value)}
                  placeholder="Penjelasan ilmiah jawaban benar..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
