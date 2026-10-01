import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Search,
  Filter,
  KeyRound,
  Trash2,
  CheckCircle2,
  X,
  ShieldCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Profile } from '../types';
import { DB } from '../services/db';
import { DAFTAR_KELAS } from '../config/appConfig';

interface Props {
  user: Profile;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SiswaManagerPage: React.FC<Props> = ({ user, onNotify }) => {
  const [students, setStudents] = useState<Profile[]>(
    DB.auth.getAllProfiles().filter((p) => p.peran === 'siswa')
  );
  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Form single
  const [singleNis, setSingleNis] = useState('');
  const [singleNama, setSingleNama] = useState('');
  const [singleKelas, setSingleKelas] = useState('X-1');

  // Form bulk
  const [bulkText, setBulkText] = useState('');

  const refreshList = () => {
    setStudents(DB.auth.getAllProfiles().filter((p) => p.peran === 'siswa'));
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleNis.trim() || !singleNama.trim()) {
      onNotify('NIS dan Nama Siswa wajib diisi!', 'error');
      return;
    }

    const res = DB.auth.createStudent({
      nis: singleNis.trim(),
      nama: singleNama.trim(),
      kelas: singleKelas,
    });

    if (res.success) {
      setShowAddModal(false);
      setSingleNis('');
      setSingleNama('');
      refreshList();
      onNotify('Siswa berhasil ditambahkan dengan password default siswa123', 'success');
    } else {
      onNotify(res.error || 'Gagal menambahkan siswa.', 'error');
    }
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    const list: { nis: string; nama: string; kelas: string }[] = [];

    lines.forEach((line) => {
      // Split by comma or semicolon or tab
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        list.push({
          nis: parts[0],
          nama: parts[1],
          kelas: parts[2] || 'X-1',
        });
      }
    });

    if (list.length === 0) {
      onNotify('Format teks tidak sesuai. Gunakan: NIS, Nama Lengkap, Kelas', 'error');
      return;
    }

    const res = DB.auth.bulkCreateStudents(list);
    setShowBulkModal(false);
    setBulkText('');
    refreshList();
    onNotify(
      `Impor massal selesai: ${res.added} siswa ditambahkan, ${res.skipped} dilewati (sudah ada).`,
      'success'
    );
  };

  const handleResetPassword = (s: Profile) => {
    if (confirm(`Reset password "${s.nama}" ke password default (siswa123)?`)) {
      DB.auth.resetPassword(s.id);
      refreshList();
      onNotify(`Password siswa ${s.nama} telah direset ke default. Siswa wajib ganti password saat login.`, 'success');
    }
  };

  const handleToggleActive = (s: Profile) => {
    DB.auth.toggleActive(s.id);
    refreshList();
    onNotify(`Status akun ${s.nama} diubah.`, 'info');
  };

  const handleDelete = (s: Profile) => {
    if (confirm(`Yakin ingin menghapus siswa "${s.nama}" secara permanen? Seluruh riwayat ujian dan bintang akan dihapus.`)) {
      DB.auth.deleteUser(s.id);
      refreshList();
      onNotify(`Akun siswa ${s.nama} berhasil dihapus.`, 'info');
    }
  };

  const filtered = students.filter((s) => {
    const matchKelas = selectedKelas === 'Semua' || s.kelas === selectedKelas;
    const matchSearch =
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase());
    return matchKelas && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600" />
            Manajemen Akun Siswa ({students.length} Siswa)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar data siswa, impor massal dari CSV/absen, dan reset password siswa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition hover:bg-slate-100"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Impor Massal (CSV/Teks)
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama atau NIS siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          />
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

      {/* Table of Students */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">NIS / Username</th>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Kelas</th>
                <th className="p-4">Status Akun</th>
                <th className="p-4">Ganti Password</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {s.username}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={s.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={s.nama}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="font-bold text-slate-900 dark:text-white">{s.nama}</span>
                    </div>
                  </td>
                  <td className="p-4">Kelas {s.kelas}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                        s.aktif
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {s.aktif ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="p-4">
                    {s.wajib_ganti_password ? (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                        Wajib Ganti
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sudah Diubah</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleResetPassword(s)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg"
                        title="Reset Password ke Default (siswa123)"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Siswa Tunggal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tambah Siswa Baru
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSingle} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Nomor Induk Siswa (NIS)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1006"
                  value={singleNis}
                  onChange={(e) => setSingleNis(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Fajar Nugraha"
                  value={singleNama}
                  onChange={(e) => setSingleNama(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Kelas</label>
                <select
                  value={singleKelas}
                  onChange={(e) => setSingleKelas(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  {DAFTAR_KELAS.filter((k) => k !== 'Semua').map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-slate-500">
                Password awal siswa otomatis disetel ke <strong>siswa123</strong>. Siswa diwajibkan menggantinya pada login perdana.
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
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Impor Massal Siswa */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Impor Siswa Massal
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-2">
              Tempelkan daftar siswa dengan format: <strong>NIS, Nama Lengkap, Kelas</strong> (satu siswa per baris).
            </p>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`1007, Maya Safitri, X-1
1008, Dimas Setiawan, X-1
1009, Nadya Aurelia, X-2`}
              className="w-full p-3 font-mono text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500"
              >
                Batal
              </button>
              <button
                onClick={handleBulkImport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Proses Impor Siswa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
