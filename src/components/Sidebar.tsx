import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  FileQuestion,
  BarChart3,
  Award,
  Gamepad2,
  Users,
  User,
  Settings,
  Sliders,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Profile } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: Profile | null;
  onOpenSupabase: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, user, onOpenSupabase }) => {
  const isGuru = user?.peran === 'guru';

  const menuItems = [
    { id: 'beranda', label: 'Beranda', icon: LayoutDashboard, role: 'all' },
    { id: 'materi', label: 'Materi Pelajaran', icon: BookOpen, role: 'all' },
    { id: 'ujian', label: 'Ujian CBT', icon: FileCheck2, role: 'all' },
    { id: 'bank-soal', label: 'Bank Soal', icon: FileQuestion, role: 'guru' },
    { id: 'nilai', label: isGuru ? 'Rekap & Analisis' : 'Riwayat Nilai', icon: BarChart3, role: 'all' },
    { id: 'bintang', label: 'Papan Bintang', icon: Award, role: 'all' },
    { id: 'games', label: 'Game Edukasi', icon: Gamepad2, role: 'all' },
    { id: 'kelola-game', label: 'Kelola Game & Sesi', icon: Sliders, role: 'guru' },
    { id: 'siswa', label: 'Data Siswa', icon: Users, role: 'guru' },
    { id: 'pengaturan', label: 'Pengaturan & Zona Berbahaya', icon: Settings, role: 'guru' },
    { id: 'profil', label: 'Profil Saya', icon: User, role: 'all' },
  ];

  const filteredItems = menuItems.filter((m) => m.role === 'all' || (m.role === 'guru' && isGuru));

  return (
    <aside className="w-64 shrink-0 hidden md:block bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 min-h-[calc(100vh-4rem)] no-print">
      {/* User Badge Info */}
      <div className="p-3.5 mb-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.nama}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/30"
          />
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.nama || 'Pengguna'}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                {user?.peran}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isGuru ? 'Pengampu' : `Kelas ${user?.kelas}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Navigation */}
      <nav className="space-y-1.5">
        <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Menu Navigasi
        </div>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition duration-150 ${
                active
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Database & Cloud status widget (Khusus Guru) */}
      {isGuru && (
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onOpenSupabase}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 text-left hover:border-emerald-500/50 transition group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Supabase Status
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              RLS & RPC Aktif. Klik untuk melihat Skema SQL & Edge Function.
            </p>
          </button>
        </div>
      )}
    </aside>
  );
};
