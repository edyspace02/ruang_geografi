import React, { useState } from 'react';
import {
  Globe2,
  Star,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Database,
  BookOpen,
  LogOut,
  ChevronDown,
  UserCheck,
  Award,
} from 'lucide-react';
import { Profile } from '../types';
import { DB } from '../services/db';

interface NavbarProps {
  user: Profile | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  starBalance: number;
  onOpenSupabase: () => void;
  onOpenGuide: () => void;
  onSwitchUser: (newUser: Profile) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  darkMode,
  setDarkMode,
  soundEnabled,
  setSoundEnabled,
  starBalance,
  onOpenSupabase,
  onOpenGuide,
  onSwitchUser,
  onLogout,
}) => {
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);
  const profiles = DB.auth.getAllProfiles();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & School Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Globe2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                Ruang Geografi
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                SMA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Media Pembelajaran, CBT & Game Edukasi
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Star Balance (For Students or General) */}
          {user && (
            <div
              title={`Saldo Bintang Apresiasi: ${starBalance} Bintang`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 shadow-sm"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-500 animate-bounce" />
              <span className="font-extrabold text-sm">{starBalance}</span>
              <span className="text-xs font-medium hidden md:inline">Bintang</span>
            </div>
          )}

          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition"
              title="Ganti peran demo (Guru / Siswa)"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden lg:inline">{user?.nama?.split(' ')[0] || 'Peran'}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-600 text-white rounded font-bold uppercase">
                {user?.peran || 'Role'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showSwitchDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Ganti Akun Demo Pengujian:
                </div>
                <div className="space-y-1">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSwitchUser(p);
                        setShowSwitchDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                        user?.id === p.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <p className="font-semibold truncate">{p.nama}</p>
                        <p className="text-[10px] text-slate-400">
                          {p.peran === 'guru' ? 'Guru Geografi' : `Siswa Kelas ${p.kelas}`}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          p.peran === 'guru' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.peran}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Supabase Status / Config (Khusus Guru) */}
          {user?.peran === 'guru' && (
            <button
              onClick={onOpenSupabase}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              title="Koneksi Database Supabase & SQL Schema"
              aria-label="Koneksi Supabase"
            >
              <Database className="w-4 h-4 text-emerald-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </button>
          )}

          {/* Panduan Guru (Khusus Guru) */}
          {user?.peran === 'guru' && (
            <button
              onClick={onOpenGuide}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Buku Panduan Guru & Langkah Setup"
              aria-label="Panduan Guru"
            >
              <BookOpen className="w-4 h-4 text-sky-500" />
            </button>
          )}

          {/* Sound FX Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={soundEnabled ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'}
            aria-label="Suara"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={darkMode ? 'Ubah ke Mode Terang' : 'Ubah ke Mode Gelap'}
            aria-label="Tema"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title="Keluar dari Aplikasi"
            aria-label="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
