import React, { useState } from 'react';
import {
  User,
  Key,
  Award,
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Profile } from '../types';
import { DB } from '../services/db';

interface Props {
  user: Profile;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfilePage: React.FC<Props> = ({ user, onNotify }) => {
  const isGuru = user.peran === 'guru';

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  // Avatar URL edit
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');

  const starBalance = DB.bintang.getSaldo(user.id);
  const starHistory = DB.bintang.getRiwayat(user.id);
  const myBadges = DB.lencana.getLencanaSiswa(user.id);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      onNotify('Password baru minimal harus 6 karakter!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onNotify('Konfirmasi password baru tidak cocok!', 'error');
      return;
    }

    setSavingPass(true);
    setTimeout(() => {
      DB.auth.changePassword(user.id, newPassword);
      setSavingPass(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onNotify('Password berhasil diperbarui!', 'success');
    }, 400);
  };

  const handleUpdateAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    DB.auth.updateProfile(user.id, { avatar_url: avatarUrl });
    onNotify('Foto profil berhasil diperbarui!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <img
            src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={user.nama}
            className="w-24 h-24 rounded-3xl object-cover ring-4 ring-emerald-500/30 shadow-md"
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {user.nama}
            </h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
              {user.peran}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isGuru ? 'Guru Pengampu Mata Pelajaran Geografi' : `Siswa Kelas ${user.kelas} &bull; NIS: ${user.username}`}
          </p>

          {!isGuru && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Sparkles className="w-4 h-4 fill-amber-400" />
                {starBalance} Bintang Apresiasi
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Award className="w-4 h-4" />
                {myBadges.length} Lencana Terkumpul
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            Ganti Password Pribadi
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                Password Baru (Min. 6 Karakter)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ketik password baru..."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                Ulangi Password Baru
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Konfirmasi password..."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={savingPass}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm"
            >
              {savingPass ? 'Menyimpan...' : 'Perbarui Password'}
            </button>
          </form>

          {/* Avatar edit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <form onSubmit={handleUpdateAvatar} className="space-y-2 text-xs">
              <label className="font-semibold block text-slate-700 dark:text-slate-300">
                Ubah URL Foto Avatar
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl text-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Badges Earned */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Lencana Prestasi Saya
          </h3>

          {myBadges.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada lencana yang diraih. Rajin membaca materi dan selesaikan ujian CBT untuk membuka lencana!
            </p>
          ) : (
            <div className="space-y-2.5">
              {myBadges.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3"
                >
                  <span className="text-2xl">{b.ikon}</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{b.nama}</h5>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{b.deskripsi}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Star Transaction Timeline */}
      {!isGuru && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Riwayat Perolehan Bintang Apresiasi
          </h3>

          {starHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada catatan bintang.</p>
          ) : (
            <div className="space-y-2">
              {starHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.alasan}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.dibuat).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <span className="font-black text-amber-500 flex items-center gap-1">
                    +{item.poin} ⭐
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
