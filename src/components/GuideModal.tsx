import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  X,
  Compass,
  Key,
  Users,
  FileCheck2,
  Award,
  Gamepad2,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const GuideModal: React.FC<Props> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<number>(1);

  const sections = [
    { id: 1, title: '1. Arsitektur & Alur Sistem', icon: Compass },
    { id: 2, title: '2. Setup Supabase (Langkah demi Langkah)', icon: Key },
    { id: 3, title: '3. Panduan Akun & Impor Siswa', icon: Users },
    { id: 4, title: '4. Menulis Materi & Bab Geografi', icon: BookOpen },
    { id: 5, title: '5. CBT Ujian & Impor Soal Cepat', icon: FileCheck2 },
    { id: 6, title: '6. Rekap Nilai & Analisis Butir', icon: Award },
    { id: 7, title: '7. Menu Bintang & Cetak Sertifikat', icon: Sparkles },
    { id: 8, title: '8. Menambah Game Baru + Prompt AI', icon: Gamepad2 },
    { id: 9, title: '9. Checklist Uji Sebelum Dipakai di Kelas', icon: CheckSquare },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto no-print">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Buku Panduan Guru & Administrator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Panduan praktis pengoperasian Ruang Geografi tanpa memerlukan keahlian coding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col md:flex-row gap-6 mt-4 overflow-hidden flex-1">
          {/* Section Selector Sidebar */}
          <div className="w-full md:w-64 shrink-0 overflow-y-auto pr-1 space-y-1">
            {sections.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </div>

          {/* Section Reader Details */}
          <div className="flex-1 overflow-y-auto pr-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed">
            {activeSection === 1 && (
              <div className="space-y-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  1. Arsitektur & Alur Kerja Ruang Geografi
                </h4>
                <p>
                  Ruang Geografi dirancang dengan konsep <strong>Zero-Friction</strong> bagi guru:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li><strong>Lapisan Database Bersama:</strong> Berjalan di atas Supabase (PostgreSQL) dengan perlindungan Row Level Security (RLS) ketat.</li>
                  <li><strong>Integritas CBT Server:</strong> Kunci jawaban tidak pernah dikirim ke browser siswa saat ujian berlangsung. Nilai dihitung langsung oleh fungsi server PostgreSQL (<code>kirim_ujian</code>).</li>
                  <li><strong>Penghargaan Bintang Otomatis:</strong> Setiap aktivitas belajar (membaca materi, menyelesaikan ujian, mencapai KKM, juara game) memicu trigger pemberian bintang ke akun siswa.</li>
                  <li><strong>Engine Modular Game:</strong> Guru dapat menambah game geografi baru tanpa perlu mengubah kode inti aplikasi.</li>
                </ul>
              </div>
            )}

            {activeSection === 2 && (
              <div className="space-y-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  2. Panduan Setup Supabase untuk Guru (Non-Programmer)
                </h4>
                <ol className="list-decimal pl-5 space-y-2 text-xs">
                  <li>Buka <strong>supabase.com</strong> dan buat akun gratis.</li>
                  <li>Klik tombol <strong>"New Project"</strong>, beri nama proyek <em>"Ruang Geografi"</em>, dan tentukan password database.</li>
                  <li>Setelah proyek siap, masuk ke menu <strong>SQL Editor</strong> di bilah navigasi kiri.</li>
                  <li>Buka tombol <strong>Supabase</strong> di navbar aplikasi ini, pilih tab <strong>"Skrip SQL"</strong>, lalu klik <strong>"Salin Seluruh SQL"</strong>.</li>
                  <li>Tempelkan ke SQL Editor di Supabase, lalu tekan tombol hijau <strong>"RUN"</strong>.</li>
                  <li>Masuk ke menu <strong>Project Settings &gt; API</strong> di Supabase, salin <em>Project URL</em> dan <em>anon public key</em> ke dalam dialog Supabase di aplikasi ini.</li>
                  <li>Selesai! Database Ruang Geografi kini terhubung penuh di cloud.</li>
                </ol>
              </div>
            )}

            {activeSection === 3 && (
              <div className="space-y-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  3. Panduan Akun Guru & Impor Siswa Massal
                </h4>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs">
                  <strong>Akun Bawaan:</strong><br />
                  &bull; Guru: Username <code>guru.geografi</code> | Password: <code>guru123</code><br />
                  &bull; Siswa: NIS (contoh: <code>1001</code>) | Password: <code>siswa123</code>
                </div>
                <p className="text-xs">
                  <strong>Impor Massal Siswa:</strong> Masuk ke menu <em>Data Siswa</em> &gt; klik <em>"Impor Massal"</em>. Anda cukup menempelkan teks daftar siswa dari Excel atau buku absen dengan format:
                </p>
                <pre className="p-2.5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl">
{`1001, Andi Pratama, X-1
1002, Siti Rahmawati, X-1
1003, Budi Santoso, X-2`}
                </pre>
                <p className="text-xs">
                  Semua siswa baru otomatis mendapatkan status <code>wajib_ganti_password</code>, sehingga mereka akan langsung diminta membuat password pribadi pada saat pertama kali login.
                </p>
              </div>
            )}

            {activeSection === 4 && (
              <div className="space-y-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  4. Menulis Materi Pelajaran Geografi (Gaya Blogger)
                </h4>
                <p className="text-xs">
                  Masuk ke menu <strong>Materi Pelajaran</strong> &gt; klik <strong>"Tulis Materi Baru"</strong>:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li>Tentukan Bab materi: <em>Litosfer, Atmosfer, Hidrosfer, Pedosfer, Biosfer, Peta & SIG, Mitigasi Bencana</em>.</li>
                  <li>Targetkan untuk kelas tertentu atau <em>Semua Kelas</em>.</li>
                  <li>Gunakan toolbar editor untuk membuat judul bab, poin peluru, kutipan penting, atau menyematkan diagram geografi.</li>
                  <li>Simpan sebagai <strong>Draft</strong> untuk pratinjau, atau ubah status menjadi <strong>Terbit</strong> agar siswa dapat mulai membaca.</li>
                  <li>Siswa yang membaca sampai tuntas akan otomatis mendapat <strong>+1 Bintang Apresiasi</strong>.</li>
                </ul>
              </div>
            )}

            {activeSection === 5 && (
              <div className="space-y-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  5. CBT Ujian Online & Impor Soal Cepat
                </h4>
                <p className="text-xs">
                  Guru dapat mengimpor puluhan soal pilihan ganda sekaligus ke Bank Soal tanpa perlu mengetik satu per satu:
                </p>
                <pre className="p-2.5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl">
{`1. Lapisan terluar bumi tempat makhluk hidup berpijak disebut...
A. Mantel bumi
B. Kerak bumi
C. Inti luar
D. Inti dalam
E. Astenosfer
Kunci: B
Pembahasan: Kerak bumi terdiri dari kerak benua dan samudera.`}
                </pre>
                <p className="text-xs">
                  <strong>Fitur Anti-Curang:</strong> Selama ujian berlangsung, sistem menghitung berapa kali siswa berpindah tab atau meminimalkan layar browser. Waktu dihitung berdasarkan batas jam server sehingga siswa tidak bisa memanipulasi jam perangkat mereka.
                </p>
              </div>
            )}

            {activeSection === 6 && (
              <div className="space-y-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  6. Rekap Nilai & Analisis Butir Soal
                </h4>
                <p className="text-xs">
                  Pada menu <strong>Rekap Nilai</strong>, guru mendapatkan gambaran analitik lengkap:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li><strong>Statistik Kelas:</strong> Rata-rata nilai, skor tertinggi, terendah, median, dan jumlah siswa di bawah KKM.</li>
                  <li><strong>Grafik Distribusi:</strong> Visualisasi sebaran rentang nilai siswa.</li>
                  <li><strong>Analisis Butir Soal:</strong> Mengidentifikasi soal mana yang tergolong <em>Mudah, Sedang, atau Sukar</em>, serta melihat pengecoh pilihan yang paling banyak menjebak siswa.</li>
                  <li><strong>Buka Ujian Ulang:</strong> Tombol khusus bagi guru untuk memberikan kesempatan remedial kepada siswa tertentu.</li>
                  <li><strong>Ekspor:</strong> Unduh nilai dalam format CSV atau cetak lembar nilai resmi.</li>
                </ul>
              </div>
            )}

            {activeSection === 7 && (
              <div className="space-y-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  7. Menu Bintang Apresiasi & Cetak Piagam
                </h4>
                <p className="text-xs">
                  Siswa sangat termotivasi dengan penghargaan berkala:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li>Podium Top 3 menampilkan siswa teraktif dengan bintang tertinggi.</li>
                  <li>Lencana otomatis terbuka saat syarat terpenuhi (contoh: <em>Kutu Buku Geografi, Master Kartografi, Bintang Prestasi</em>).</li>
                  <li>Guru dapat menambahkan bintang manual kapan saja (misal: "Aktif bertanya saat praktikum peta").</li>
                  <li>Klik tombol <strong>"Cetak Piagam Apresiasi"</strong> untuk mengunduh sertifikat berformat PDF siap cetak dengan nama siswa dan tanda tangan guru.</li>
                </ul>
              </div>
            )}

            {activeSection === 8 && (
              <div className="space-y-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  8. Menambah Game Edukasi Baru
                </h4>
                <p className="text-xs">
                  Semua game Ruang Geografi berbasis HTML5 Canvas yang modular:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-xs">
                  <li>Buka folder <code>src/games/template.ts</code> untuk melihat contoh format kontrak game.</li>
                  <li>Kirim prompt ke AI untuk membuat game baru (contoh: <em>"Buat game canvas tebak bentang alam karst"</em>).</li>
                  <li>Daftarkan file game baru di <code>src/games/index.ts</code>.</li>
                  <li>Game langsung muncul otomatis di kartu permainan siswa!</li>
                </ol>
              </div>
            )}

            {activeSection === 9 && (
              <div className="space-y-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  9. Checklist Pengujian Sebelum Digunakan di Kelas
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Pastikan akun guru dapat login dan mengakses menu kelola siswa & bank soal.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Uji satu akun siswa contoh untuk memastikan form ganti password pertama berfungsi.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Uji pengerjaan 1 ujian CBT: pastikan timer berjalan dan nilai otomatis tersimpan di rekap nilai.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Buka game Tebak Peta dan Kuis Kilat dari HP untuk menguji responsivitas layar sentuh.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Lakukan ekspor cadangan database berkala melalui menu Supabase &gt; Cadangkan.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
