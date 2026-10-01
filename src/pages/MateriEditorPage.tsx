import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Eye,
  CheckCircle,
  Heading,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Image,
  Video,
  Sparkles,
} from 'lucide-react';
import { Materi, Profile } from '../types';
import { DB } from '../services/db';
import { DAFTAR_BAB, DAFTAR_KELAS } from '../config/appConfig';

interface Props {
  user: Profile;
  materiId?: string;
  onNavigate: (tab: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MateriEditorPage: React.FC<Props> = ({ user, materiId, onNavigate, onNotify }) => {
  const existing = materiId ? DB.materi.getById(materiId) : null;

  const [judul, setJudul] = useState(existing?.judul || '');
  const [ringkasan, setRingkasan] = useState(existing?.ringkasan || '');
  const [isi, setIsi] = useState(existing?.isi || '');
  const [bab, setBab] = useState(existing?.bab || DAFTAR_BAB[0]);
  const [kelas, setKelas] = useState(existing?.kelas || 'Semua');
  const [sampulUrl, setSampulUrl] = useState(existing?.sampul_url || '');
  const [tagInput, setTagInput] = useState(existing?.tag?.join(', ') || 'Geografi, Litosfer, Bahan Ajar');
  const [status, setStatus] = useState<'draft' | 'terbit'>(existing?.status || 'draft');
  const [activeTab, setActiveTab] = useState<'tulis' | 'pratinjau'>('tulis');
  const [isSaving, setIsSaving] = useState(false);

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('isi-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end);
    const replacement = before + (selected || 'teks di sini') + after;

    const updated = current.substring(0, start) + replacement + current.substring(end);
    setIsi(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 12));
    }, 50);
  };

  const handleInsertYouTube = () => {
    const url = prompt('Masukkan tautan atau ID video YouTube (misal: dQw4w9WgXcQ):');
    if (url) {
      let videoId = url;
      if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      }
      insertText(
        `\n<div class="my-4 aspect-video rounded-xl overflow-hidden shadow-lg"><iframe class="w-full h-full" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>\n`
      );
    }
  };

  const handleInsertImage = () => {
    const url = prompt('Masukkan URL gambar geografi/diagram (atau tautan Unsplash):', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800');
    if (url) {
      insertText(`\n<p class="text-center my-4"><img src="${url}" alt="Diagram Geografi" class="rounded-xl mx-auto shadow-md max-h-96" /><em class="text-xs text-slate-500 block mt-1">Gambar: Ilustrasi materi terkait</em></p>\n`);
    }
  };

  const handleSave = (newStatus: 'draft' | 'terbit') => {
    if (!judul.trim()) {
      onNotify('Judul materi tidak boleh kosong!', 'error');
      return;
    }

    setIsSaving(true);
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const saved = DB.materi.simpan({
      id: existing?.id,
      judul,
      ringkasan,
      isi,
      bab,
      kelas,
      sampul_url: sampulUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      tag: tags,
      status: newStatus,
      dibuat_oleh: user.id,
    });

    setIsSaving(false);
    onNotify(
      newStatus === 'terbit'
        ? 'Materi berhasil diterbitkan untuk siswa!'
        : 'Draft materi berhasil disimpan.',
      'success'
    );
    onNavigate('materi');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('materi')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Materi
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Simpan Draft
          </button>
          <button
            onClick={() => handleSave('terbit')}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md"
          >
            <Save className="w-4 h-4" />
            Terbitkan Sekarang
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Judul Materi Pembelajaran
            </label>
            <input
              type="text"
              placeholder="Contoh: Litosfer: Dinamika Kerak Bumi & Erupsi Vulkanik"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Bab / Topik Geografi
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {k === 'Semua' ? 'Semua Kelas' : `Kelas ${k}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              URL Gambar Sampul (Opsional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={sampulUrl}
              onChange={(e) => setSampulUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tag / Label (Pisahkan koma)
            </label>
            <input
              type="text"
              placeholder="Litosfer, Gunung Api, Tektonik"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Ringkasan Singkat (Muncul di kartu materi)
          </label>
          <textarea
            rows={2}
            placeholder="Tuliskan 1-2 kalimat ringkasan tentang apa yang dipelajari pada bab ini..."
            value={ringkasan}
            onChange={(e) => setRingkasan(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
          />
        </div>

        {/* Tab Editor / Preview */}
        <div className="pt-2">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('tulis')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'tulis'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tulis Konten
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pratinjau')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'pratinjau'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Pratinjau Hasil
              </button>
            </div>

            {/* Quick Rich Text Toolbar */}
            {activeTab === 'tulis' && (
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => insertText('<h3>', '</h3>')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                  title="Sub Judul (H3)"
                >
                  <Heading className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('<strong>', '</strong>')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                  title="Tebal (Bold)"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('<em>', '</em>')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                  title="Miring (Italic)"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('<ul>\n  <li>', '</li>\n</ul>')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                  title="Daftar Peluru"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('<ol>\n  <li>', '</li>\n</ol>')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                  title="Daftar Berurutan"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertText('<blockquote>"', '"</blockquote>')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                  title="Kutipan Geografi"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleInsertImage}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                  title="Sisipkan Gambar Diagram"
                >
                  <Image className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleInsertYouTube}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-rose-500"
                  title="Sisipkan Video YouTube"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {activeTab === 'tulis' ? (
            <textarea
              id="isi-textarea"
              rows={16}
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              placeholder="Tuliskan materi pelajaran di sini. Anda dapat menggunakan format teks kaya dan tag HTML sederhana seperti <h3>, <p>, <strong>, <ul>, <li>..."
              className="w-full mt-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-mono leading-relaxed focus:ring-2 focus:ring-emerald-500"
            />
          ) : (
            <div className="mt-3 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 prose dark:prose-invert max-w-none">
              <h1 className="text-xl font-bold">{judul || 'Judul Materi Belum Diisi'}</h1>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    isi ||
                    '<p class="text-slate-400 italic">Konten materi belum ditulis.</p>',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
