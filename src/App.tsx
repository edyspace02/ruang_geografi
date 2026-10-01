import React, { useState, useEffect } from 'react';
import { Profile } from './types';
import { DB } from './services/db';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { PasswordChangeModal } from './components/PasswordChangeModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { SupabaseModal } from './components/SupabaseModal';
import { GuideModal } from './components/GuideModal';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MateriPage } from './pages/MateriPage';
import { MateriEditorPage } from './pages/MateriEditorPage';
import { MateriDetailPage } from './pages/MateriDetailPage';
import { UjianListPage } from './pages/UjianListPage';
import { UjianEditorPage } from './pages/UjianEditorPage';
import { UjianCbtPage } from './pages/UjianCbtPage';
import { UjianBankSoalPage } from './pages/UjianBankSoalPage';
import { RekapNilaiPage } from './pages/RekapNilaiPage';
import { BintangPage } from './pages/BintangPage';
import { GamesPage } from './pages/GamesPage';
import { KelolaGamePage } from './pages/KelolaGamePage';
import { SiswaManagerPage } from './pages/SiswaManagerPage';
import { ProfilePage } from './pages/ProfilePage';
import { PengaturanPage } from './pages/PengaturanPage';

export default function App() {
  const [user, setUser] = useState<Profile | null>(() => DB.auth.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<string>('beranda');
  const [routeMeta, setRouteMeta] = useState<any>({});
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('rg_dark') === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [starBalance, setStarBalance] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Sync dark mode class on HTML root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('rg_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('rg_dark', 'false');
    }
  }, [darkMode]);

  // Sync star balance on user change
  const refreshStarBalance = () => {
    if (user) {
      setStarBalance(DB.bintang.getSaldo(user.id));
    }
  };

  useEffect(() => {
    refreshStarBalance();
  }, [user]);

  // Toast Notification Trigger
  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Navigation Helper
  const navigateTo = (tab: string, meta?: any) => {
    setCurrentTab(tab);
    setRouteMeta(meta || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Handlers
  const handleLoginSuccess = (loggedInUser: Profile) => {
    setUser(loggedInUser);
    setCurrentTab('beranda');
    notify(`Selamat datang, ${loggedInUser.nama}!`, 'success');
  };

  const handleSwitchUser = (newUser: Profile) => {
    DB.auth.setCurrentUser(newUser);
    setUser(newUser);
    setCurrentTab('beranda');
    notify(`Beralih akun ke: ${newUser.nama} (${newUser.peran.toUpperCase()})`, 'info');
  };

  const handleLogout = () => {
    DB.auth.logout();
    setUser(null);
    setCurrentTab('beranda');
    notify('Anda telah berhasil keluar dari akun.', 'info');
  };

  // If Not Logged In, Render Login Page
  if (!user) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onOpenGuide={() => setShowGuideModal(true)}
        />
        {showGuideModal && <GuideModal onClose={() => setShowGuideModal(false)} />}
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Mandatory Password Change Enforcement for New Accounts */}
      {user.wajib_ganti_password && (
        <PasswordChangeModal
          user={user}
          onSuccess={() => {
            setUser({ ...user, wajib_ganti_password: false });
            notify('Password baru berhasil disimpan! Selamat belajar.', 'success');
          }}
        />
      )}

      {/* Main Top Navigation */}
      <Navbar
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        starBalance={starBalance}
        onOpenSupabase={() => setShowSupabaseModal(true)}
        onOpenGuide={() => setShowGuideModal(true)}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
      />

      {/* App Body: Sidebar + Main Workspace */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={navigateTo}
          user={user}
          onOpenSupabase={() => setShowSupabaseModal(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden">
          {currentTab === 'beranda' && (
            <DashboardPage
              user={user}
              onNavigate={navigateTo}
              onOpenGuide={() => setShowGuideModal(true)}
            />
          )}

          {currentTab === 'materi' && (
            <MateriPage user={user} onNavigate={navigateTo} onNotify={notify} />
          )}

          {currentTab === 'materi-editor' && (
            <MateriEditorPage
              user={user}
              materiId={routeMeta?.materiId}
              onNavigate={navigateTo}
              onNotify={notify}
            />
          )}

          {currentTab === 'materi-detail' && (
            <MateriDetailPage
              user={user}
              materiId={routeMeta?.materiId}
              onNavigate={navigateTo}
              onNotify={notify}
              onStarEarned={refreshStarBalance}
            />
          )}

          {currentTab === 'ujian' && (
            <UjianListPage user={user} onNavigate={navigateTo} onNotify={notify} />
          )}

          {currentTab === 'ujian-editor' && (
            <UjianEditorPage
              user={user}
              ujianId={routeMeta?.ujianId}
              onNavigate={navigateTo}
              onNotify={notify}
            />
          )}

          {currentTab === 'ujian-cbt' && (
            <UjianCbtPage
              user={user}
              ujianId={routeMeta?.ujianId}
              onNavigate={navigateTo}
              onNotify={notify}
              onStarEarned={refreshStarBalance}
            />
          )}

          {currentTab === 'bank-soal' && (
            <UjianBankSoalPage user={user} onNavigate={navigateTo} onNotify={notify} />
          )}

          {currentTab === 'nilai' && (
            <RekapNilaiPage
              user={user}
              initialUjianId={routeMeta?.ujianId}
              onNotify={notify}
            />
          )}

          {currentTab === 'bintang' && (
            <BintangPage
              user={user}
              onNotify={notify}
              onStarUpdated={refreshStarBalance}
            />
          )}

          {currentTab === 'games' && (
            <GamesPage
              user={user}
              soundEnabled={soundEnabled}
              onNavigate={navigateTo}
              onNotify={notify}
              onStarEarned={refreshStarBalance}
            />
          )}

          {currentTab === 'kelola-game' && (
            <KelolaGamePage
              user={user}
              onNavigate={navigateTo}
              onNotify={notify}
            />
          )}

          {currentTab === 'siswa' && (
            <SiswaManagerPage user={user} onNotify={notify} />
          )}

          {currentTab === 'pengaturan' && (
            <PengaturanPage
              user={user}
              onNotify={notify}
              onOpenSupabaseModal={() => setShowSupabaseModal(true)}
            />
          )}

          {currentTab === 'profil' && (
            <ProfilePage user={user} onNotify={notify} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentTab={currentTab} setCurrentTab={navigateTo} />

      {/* Modals */}
      {showSupabaseModal && (
        <SupabaseModal
          onClose={() => setShowSupabaseModal(false)}
          onNotify={notify}
        />
      )}

      {showGuideModal && (
        <GuideModal onClose={() => setShowGuideModal(false)} />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
