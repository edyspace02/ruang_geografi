import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Plus,
  Play,
  Archive,
  RotateCcw,
  Trash2,
  Edit3,
  Clock,
  Users,
  Trophy,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Search,
  Key,
  FileQuestion,
  HelpCircle,
  X,
  ExternalLink,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { GameItem, Profile, SesiGame } from '../types';
import { DB } from '../services/db';
import { DAFTAR_BAB, DAFTAR_KELAS } from '../config/appConfig';

interface Props {
  user: Profile;
  onNavigate: (tab: string, meta?: any) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const KelolaGamePage: React.FC<Props> = ({ user, onNavigate, onNotify }) => {
  const [activeTab, setActiveTab] = useState<'daftar' | 'sesi' | 'arsip'>('daftar');
  const [games, setGames] = useState<GameItem[]>(DB.game.daftar(false));
  const [archivedGames, setArchivedGames] = useState<GameItem[]>(DB.game.daftarArsip());
  const [sesiList, setSesiList] = useState<SesiGame[]>(DB.sesi.daftar());

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterBab, setFilterBab] = useState('Semua');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'file' | 'bank_soal' | 'upload'>('file');
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);

  // Form Tambah Game (File / Standar)
  const [formId, setFormId] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formIkon, setFormIkon] = useState('🗺️');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formBab, setFormBab] = useState(DAFTAR_BAB[0]);
  const [formKelas, setFormKelas] = useState<string[]>(['Semua']);
  const [formSkorMaks, setFormSkorMaks] = useState(1000);
  const [formPoinBintang, setFormPoinBintang] = useState(3);
  const [formMaksPercobaanHarian, setFormMaksPercobaanHarian] = useState(5);
  const [formModeSesi, setFormModeSesi] = useState<'bebas' | 'wajib_sesi'>('bebas');
  const [formJuara1, setFormJuara1] = useState(5);
  const [formJuara2, setFormJuara2] = useState(3);
  const [formJuara3, setFormJuara3] = useState(2);

  // Form Tambah Game (Bank Soal)
  const [quizBab, setQuizBab] = useState(DAFTAR_BAB[0]);
  const [quizDurasiPerSoal, setQuizDurasiPerSoal] = useState(12);

  // Modal Buka Sesi
  const [showBukaSesiModal, setShowBukaSesiModal] = useState(false);
  const [sesiGameTarget, setSesiGameTarget] = useState<GameItem | null>(null);
  const [sesiJudul, setSesiJudul] = useState('');
  const [sesiKelas, setSesiKelas] = useState<string[]>(['X-1']);
  const [sesiDurasiMenit, setSesiDurasiMenit] = useState(30);
  const [sesiKode, setSesiKode] = useState('');
  const [sesiMaksPercobaan, setSesiMaksPercobaan] = useState(3);

  // Modal Pemantau Sesi (Live Monitor)
  const [activeMonitorSesiId, setActiveMonitorSesiId] = useState<string | null>(null);
  const [monitorRingkasan, setMonitorRingkasan] = useState<any>(null);

  // Modal Hapus Permanen
  const [gameToDelete, setGameToDelete] = useState<GameItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteWipeHistory, setDeleteWipeHistory] = useState(false);
  const [impactData, setImpactData] = useState<{ skorCount: number; sesiCount: number; siswaCount: number } | null>(null);

  const refreshData = () => {
    setGames(DB.game.daftar(false));
    setArchivedGames(DB.game.daftarArsip());
    setSesiList(DB.sesi.daftar());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Poll monitor if modal open
  useEffect(() => {
    if (!activeMonitorSesiId) return;
    const interval = setInterval(() => {
      const ringkasan = DB.sesi.ringkasanSesi(activeMonitorSesiId);
      setMonitorRingkasan(ringkasan);
    }, 1500);
    return () => clearInterval(interval);
  }, [activeMonitorSesiId]);

  // Handler: Tambah / Edit Game
  const handleSaveGame = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingGame) {
      const res = DB.game.ubahGame(editingGame.id, {
        nama: formNama.trim(),
        ikon: formIkon.trim() || '🎮',
        deskripsi: formDeskripsi.trim(),
        bab: formBab,
        kelas: formKelas,
        skorMaks: Number(formSkorMaks),
        poinBintang: Number(formPoinBintang),
        maksPercobaanHarian: Number(formMaksPercobaanHarian),
        modeSesi: formModeSesi,
        poinJuara: { juara1: formJuara1, juara2: formJuara2, juara3: formJuara3 },
      });

      if (res.success) {
        onNotify('Pengaturan game berhasil diperbarui!', 'success');
        setShowAddModal(false);
        setEditingGame(null);
        refreshData();
      } else {
        onNotify(res.error || 'Gagal mengubah game', 'error');
      }
      return;
    }

    if (addMode === 'bank_soal') {
      const autoId = `kuis-${quizBab.toLowerCase().replace(/[^a-z0-9]/g, '-')}`.slice(0, 24);
      const res = DB.game.tambahGame({
        id: autoId,
        nama: formNama.trim() || `Kuis Kilat: ${quizBab}`,
        ikon: formIkon || '⚡',
        deskripsi: formDeskripsi.trim() || `Tantangan kuis cepat arcade dari bank soal bab ${quizBab}`,
        bab: quizBab,
        kelas: formKelas,
        skorMaks: 1200,
        poinBintang: Number(formPoinBintang),
        tipe: 'kuis_bank_soal',
        konfigurasi: {
          bab: quizBab,
          durasiDetikPerSoal: Number(quizDurasiPerSoal),
          komboAktif: true,
        },
        modeSesi: formModeSesi,
        poinJuara: { juara1: formJuara1, juara2: formJuara2, juara3: formJuara3 },
        maksPercobaanHarian: Number(formMaksPercobaanHarian),
      });

      if (res.success) {
        onNotify('Game Kuis dari Bank Soal berhasil dibuat dan siap dimainkan!', 'success');
        setShowAddModal(false);
        refreshData();
      } else {
        onNotify(res.error || 'Gagal membuat game kuis.', 'error');
      }
      return;
    }

    // Default: Daftarkan dari file
    const res = DB.game.tambahGame({
      id: formId.trim().toLowerCase(),
      nama: formNama.trim(),
      ikon: formIkon.trim() || '🎮',
      deskripsi: formDeskripsi.trim(),
      bab: formBab,
      kelas: formKelas,
      skorMaks: Number(formSkorMaks),
      poinBintang: Number(formPoinBintang),
      tipe: 'kanvas_file',
      modeSesi: formModeSesi,
      poinJuara: { juara1: formJuara1, juara2: formJuara2, juara3: formJuara3 },
      maksPercobaanHarian: Number(formMaksPercobaanHarian),
    });

    if (res.success) {
      onNotify('Game baru berhasil didaftarkan!', 'success');
      setShowAddModal(false);
      resetForm();
      refreshData();
    } else {
      onNotify(res.error || 'Gagal mendaftarkan game.', 'error');
    }
  };

  const resetForm = () => {
    setFormId('');
    setFormNama('');
    setFormIkon('🗺️');
    setFormDeskripsi('');
    setFormBab(DAFTAR_BAB[0]);
    setFormKelas(['Semua']);
    setFormSkorMaks(1000);
    setFormPoinBintang(3);
    setFormMaksPercobaanHarian(5);
    setFormModeSesi('bebas');
    setEditingGame(null);
  };

  const handleOpenEdit = (g: GameItem) => {
    setEditingGame(g);
    setFormId(g.id);
    setFormNama(g.nama);
    setFormIkon(g.ikon);
    setFormDeskripsi(g.deskripsi);
    setFormBab(g.bab);
    setFormKelas(g.kelas);
    setFormSkorMaks(g.skorMaks);
    setFormPoinBintang(g.poinBintang);
    setFormMaksPercobaanHarian(g.maksPercobaanHarian || 5);
    setFormModeSesi(g.modeSesi || 'bebas');
    setFormJuara1(g.poinJuara?.juara1 || 5);
    setFormJuara2(g.poinJuara?.juara2 || 3);
    setFormJuara3(g.poinJuara?.juara3 || 2);
    setAddMode('file');
    setShowAddModal(true);
  };

  const handleToggleAktif = (g: GameItem) => {
    DB.game.ubahGame(g.id, { aktif: !g.aktif });
    refreshData();
    onNotify(`Game "${g.nama}" sekarang ${!g.aktif ? 'AKTIF' : 'NONAKTIF'}.`, 'info');
  };

  const handleArsipkan = (g: GameItem) => {
    if (confirm(`Yakin ingin mengarsipkan game "${g.nama}"? Game akan disembunyikan dari siswa namun skor dan riwayat bintang tetap aman.`)) {
      const res = DB.game.arsipkanGame(g.id);
      if (res.success) {
        onNotify(`Game "${g.nama}" berhasil diarsipkan.`, 'info');
        refreshData();
      } else {
        onNotify(res.error || 'Gagal mengarsipkan game.', 'error');
      }
    }
  };

  const handlePulihkan = (g: GameItem) => {
    const res = DB.game.pulihkanGame(g.id);
    if (res.success) {
      onNotify(`Game "${g.nama}" dipulihkan dari arsip dan kembali aktif.`, 'success');
      refreshData();
    } else {
      onNotify(res.error || 'Gagal memulihkan game.', 'error');
    }
  };

  const handleOpenHapusPermanen = (g: GameItem) => {
    const impact = DB.game.hitungDampakHapus(g.id);
    setGameToDelete(g);
    setImpactData(impact);
    setDeleteConfirmText('');
    setDeleteWipeHistory(false);
  };

  const handleExecuteHapusPermanen = () => {
    if (!gameToDelete) return;
    if (deleteConfirmText.trim().toLowerCase() !== gameToDelete.nama.trim().toLowerCase()) {
      onNotify('Nama konfirmasi tidak cocok. Ketik nama game persis sama untuk menghapus.', 'error');
      return;
    }

    const res = DB.game.hapusGamePermanen(gameToDelete.id, deleteWipeHistory);
    if (res.success) {
      onNotify(`Game "${gameToDelete.nama}" berhasil dihapus permanen.`, 'success');
      setGameToDelete(null);
      refreshData();
    } else {
      onNotify(res.error || 'Gagal menghapus game.', 'error');
    }
  };

  // Handler: Buka Sesi Baru
  const handleOpenBukaSesi = (g: GameItem) => {
    setSesiGameTarget(g);
    setSesiJudul(`Kompetisi ${g.nama} (${DAFTAR_KELAS[1]})`);
    setSesiKelas([DAFTAR_KELAS[1]]);
    setSesiDurasiMenit(30);
    setSesiKode('');
    setSesiMaksPercobaan(3);
    setShowBukaSesiModal(true);
  };

  const handleSimpanBukaSesi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesiGameTarget) return;

    const res = DB.sesi.bukaSesi({
      gameId: sesiGameTarget.id,
      judul: sesiJudul,
      kelas: sesiKelas,
      durasiMenit: Number(sesiDurasiMenit),
      kode: sesiKode || undefined,
      maksPercobaan: Number(sesiMaksPercobaan),
      dibuatOleh: user.id,
    });

    if (res.success) {
      onNotify(`Sesi kompetisi "${sesiJudul}" berhasil dibuka! Siswa kelas terkait sekarang melihat banner bergabung.`, 'success');
      setShowBukaSesiModal(false);
      setActiveTab('sesi');
      refreshData();
    } else {
      onNotify(res.error || 'Gagal membuka sesi.', 'error');
    }
  };

  const handleTutupSesi = (sesi: SesiGame) => {
    if (confirm(`Tutup sesi kompetisi "${sesi.judul}" sekarang? Bintang apresiasi juara akan otomatis dibagikan ke Top 3.`)) {
      const res = DB.sesi.tutupSesi(sesi.id);
      if (res.success) {
        onNotify(`Sesi "${sesi.judul}" telah ditutup. Bintang apresiasi telah dibagikan!`, 'success');
        refreshData();
        if (activeMonitorSesiId === sesi.id) {
          setMonitorRingkasan(DB.sesi.ringkasanSesi(sesi.id));
        }
      }
    }
  };

  const handleBukaUlangSesi = (sesi: SesiGame) => {
    const durasi = prompt('Buka ulang sesi untuk berapa menit ke depan?', '30');
    if (durasi && Number(durasi) > 0) {
      DB.sesi.bukaUlangSesi(sesi.id, Number(durasi));
      onNotify(`Sesi "${sesi.judul}" berhasil dibuka kembali selama ${durasi} menit.`, 'success');
      refreshData();
    }
  };

  const handleDuplikasiSesi = (sesi: SesiGame) => {
    const kelasInput = prompt('Masukkan kelas baru untuk duplikasi sesi (contoh: X-2 atau XI IPS 1):', 'X-2');
    if (kelasInput) {
      const res = DB.sesi.duplikasiSesi(sesi.id, [kelasInput.trim()]);
      if (res.success) {
        onNotify(`Sesi berhasil diduplikasi untuk kelas ${kelasInput}!`, 'success');
        refreshData();
      }
    }
  };

  const handleOpenMonitor = (sesiId: string) => {
    setActiveMonitorSesiId(sesiId);
    setMonitorRingkasan(DB.sesi.ringkasanSesi(sesiId));
  };

  const handleExportCSVMonitor = () => {
    if (!monitorRingkasan) return;
    let csv = 'Peringkat,Nama Siswa,Kelas,Skor Tertinggi,Jumlah Percobaan,Terakhir Main\n';
    monitorRingkasan.papan.forEach((p: any, idx: number) => {
      csv += `${idx + 1},"${p.siswa?.nama || 'Anonim'}","${p.siswa?.kelas || '-'}",${p.skor},${p.percobaan},"${p.terakhirMain}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sesi-skor-${monitorRingkasan.sesi.judul.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('File CSV hasil sesi berhasil diunduh.', 'success');
  };

  const filteredGames = games.filter((g) => {
    const matchSearch = g.nama.toLowerCase().includes(search.toLowerCase()) || g.bab.toLowerCase().includes(search.toLowerCase());
    const matchBab = filterBab === 'Semua' || g.bab === filterBab;
    return matchSearch && matchBab;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Gamepad2 className="w-6 h-6 text-emerald-600" />
            Kelola Game & Sesi Kompetisi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Tambah game baru, kelola status, soft delete/arsip, dan selenggarakan sesi turnamen kelas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('games')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            Lihat Sebagai Siswa
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            Tambah Game Baru
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('daftar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'daftar'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Daftar Game Aktif ({games.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sesi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition relative ${
            activeTab === 'sesi'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Sesi Kompetisi Kelas ({sesiList.filter((s) => s.status === 'berlangsung').length} Aktif)</span>
          {sesiList.some((s) => s.status === 'berlangsung') && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-2 right-2" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('arsip')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'arsip'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Game Diarsipkan ({archivedGames.length})</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR GAME */}
      {activeTab === 'daftar' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari game atau bab geografi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={filterBab}
              onChange={(e) => setFilterBab(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              <option value="Semua">Semua Bab</option>
              {DAFTAR_BAB.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between transition hover:border-emerald-500/50"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-3xl">
                      {game.ikon}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => handleToggleAktif(game)}
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full cursor-pointer transition shadow-sm ${
                          game.aktif
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                        title="Klik untuk ubah aktif/nonaktif"
                      >
                        {game.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {game.modeSesi === 'wajib_sesi' ? 'Sesi Wajib' : 'Mode Bebas'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {game.nama}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {game.deskripsi}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] text-slate-500 dark:text-slate-400">
                    <div>
                      <strong>Bab:</strong> <span className="text-slate-700 dark:text-slate-300">{game.bab}</span>
                    </div>
                    <div>
                      <strong>Kelas:</strong> {game.kelas.join(', ')}
                    </div>
                    <div>
                      <strong>Skor Maks:</strong> {game.skorMaks}
                    </div>
                    <div>
                      <strong>Bintang Reguler:</strong> +{game.poinBintang}⭐
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(game)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg"
                      title="Edit Pengaturan Game"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArsipkan(game)}
                      className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 rounded-lg"
                      title="Arsipkan Game (Soft Delete)"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenBukaSesi(game)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Buka Sesi Kelas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SESI KOMPETISI KELAS */}
      {activeTab === 'sesi' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
            <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Tentang Sesi Kompetisi:</strong> Saat Anda membuka sesi, siswa di kelas terkait akan melihat banner undangan realtime di layar mereka. Anda dapat memantau perolehan skor secara live dan menutup sesi kapan saja untuk membagikan bintang apresiasi ke Top 3.
            </div>
          </div>

          <div className="space-y-3">
            {sesiList.map((sesi) => {
              const game = DB.game.getById(sesi.gameId);
              const isAktif = sesi.status === 'berlangsung';
              const pesertaCount = DB.sesi.getPesertaCount(sesi.id);

              return (
                <div
                  key={sesi.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isAktif
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {sesi.status}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Kelas: {sesi.kelas.join(', ')}
                      </span>
                      {sesi.kode && (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 rounded font-extrabold">
                          KODE: {sesi.kode}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{game?.ikon || '🎮'}</span>
                      <span>{sesi.judul}</span>
                    </h4>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-1">
                      <span>Mulai: {new Date(sesi.mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      {sesi.batasWaktu && (
                        <span>Batas: {new Date(sesi.batasWaktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                      <span>Peserta Bergabung: <strong>{pesertaCount}</strong> Siswa</span>
                      <span>Maks. Percobaan: {sesi.maksPercobaan}x per siswa</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenMonitor(sesi.id)}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <Trophy className="w-4 h-4" />
                      Layar Pemantau
                    </button>

                    {isAktif ? (
                      <button
                        onClick={() => handleTutupSesi(sesi)}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Tutup Sesi
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleBukaUlangSesi(sesi)}
                          className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold transition"
                          title="Buka Ulang Sesi"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplikasiSesi(sesi)}
                          className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold transition"
                          title="Duplikasi Sesi untuk Kelas Lain"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: GAME DIARSIPKAN (SOFT DELETE) */}
      {activeTab === 'arsip' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
            <Archive className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Arsip Game:</strong> Game yang diarsipkan disembunyikan dari siswa namun seluruh riwayat skor, sesi, dan bintang apresiasi siswa tetap terjaga. Anda dapat memulihkannya kembali kapan saja atau menghapus permanen jika benar-benar tidak dibutuhkan.
            </div>
          </div>

          {archivedGames.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Archive className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Tidak ada game yang sedang diarsipkan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedGames.map((g) => (
                <div
                  key={g.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{g.ikon}</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{g.nama}</h4>
                      <p className="text-xs text-slate-400">
                        ID: <code>{g.id}</code> &bull; Diarsipkan pada: {new Date(g.diarsipkanPada || '').toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePulihkan(g)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Pulihkan Game
                    </button>
                    <button
                      onClick={() => handleOpenHapusPermanen(g)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Permanen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT GAME */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-emerald-600" />
                {editingGame ? 'Edit Pengaturan Game' : 'Tambah Game Geografi Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingGame && (
              <div className="flex gap-2 my-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setAddMode('file')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    addMode === 'file' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Cara A: Dari File Game
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('bank_soal')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    addMode === 'bank_soal' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Cara B: Kuis dari Bank Soal (Tanpa Coding)
                </button>
              </div>
            )}

            <form onSubmit={handleSaveGame} className="space-y-4 text-xs">
              {addMode === 'bank_soal' && !editingGame && (
                <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <FileQuestion className="w-4 h-4 text-sky-600" />
                    Pilih Sumber Soal dari Bank Soal
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Bab Soal</label>
                      <select
                        value={quizBab}
                        onChange={(e) => setQuizBab(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        <option value="Semua">Semua Bab</option>
                        {DAFTAR_BAB.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Durasi per Soal (Detik)</label>
                      <input
                        type="number"
                        min={5}
                        max={30}
                        value={quizDurasiPerSoal}
                        onChange={(e) => setQuizDurasiPerSoal(Number(e.target.value))}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold block mb-1">Nama Game</label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Petualangan Litosfer"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Ikon Emoji</label>
                  <input
                    type="text"
                    required
                    value={formIkon}
                    onChange={(e) => setFormIkon(e.target.value)}
                    placeholder="🗺️"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-lg"
                  />
                </div>
              </div>

              {!editingGame && addMode === 'file' && (
                <div>
                  <label className="font-bold block mb-1">
                    ID Unik Game (Huruf kecil & tanda hubung, misal: <code>tebak-danau</code>)
                  </label>
                  <input
                    type="text"
                    required
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="tebak-danau"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="font-bold block mb-1">Deskripsi Permainan</label>
                <textarea
                  rows={2}
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  placeholder="Penjelasan instruksi dan objektif belajar..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Bab Geografi</label>
                  <select
                    value={formBab}
                    onChange={(e) => setFormBab(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {DAFTAR_BAB.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Mode Permainan</label>
                  <select
                    value={formModeSesi}
                    onChange={(e) => setFormModeSesi(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="bebas">Mode Bebas (Bisa dimainkan kapan saja)</option>
                    <option value="wajib_sesi">Sesi Wajib (Hanya bisa dimainkan saat ada sesi guru)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1">Skor Maksimum</label>
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    value={formSkorMaks}
                    onChange={(e) => setFormSkorMaks(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Bintang Reguler</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formPoinBintang}
                    onChange={(e) => setFormPoinBintang(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-amber-600"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Batas Main / Hari</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formMaksPercobaanHarian}
                    onChange={(e) => setFormMaksPercobaanHarian(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">
                  Bintang Apresiasi Juara Sesi (Top 3):
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Juara 1 (Emas)</label>
                    <input
                      type="number"
                      value={formJuara1}
                      onChange={(e) => setFormJuara1(Number(e.target.value))}
                      className="w-full p-1.5 rounded-lg border font-bold text-amber-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Juara 2 (Perak)</label>
                    <input
                      type="number"
                      value={formJuara2}
                      onChange={(e) => setFormJuara2(Number(e.target.value))}
                      className="w-full p-1.5 rounded-lg border font-bold text-slate-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Juara 3 (Perunggu)</label>
                    <input
                      type="number"
                      value={formJuara3}
                      onChange={(e) => setFormJuara3(Number(e.target.value))}
                      className="w-full p-1.5 rounded-lg border font-bold text-amber-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
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
                  Simpan Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUKA SESI KELAS */}
      {showBukaSesiModal && sesiGameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                Buka Sesi Kompetisi Baru
              </h3>
              <button onClick={() => setShowBukaSesiModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimpanBukaSesi} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Game</label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold flex items-center gap-2">
                  <span className="text-lg">{sesiGameTarget.ikon}</span>
                  <span>{sesiGameTarget.nama}</span>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Judul Sesi / Turnamen</label>
                <input
                  type="text"
                  required
                  value={sesiJudul}
                  onChange={(e) => setSesiJudul(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Target Kelas</label>
                  <select
                    value={sesiKelas[0]}
                    onChange={(e) => setSesiKelas([e.target.value])}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {DAFTAR_KELAS.map((k) => (
                      <option key={k} value={k}>{k === 'Semua' ? 'Semua Kelas' : `Kelas ${k}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Durasi Sesi (Menit)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={sesiDurasiMenit}
                    onChange={(e) => setSesiDurasiMenit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Kode Sesi (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Misal: PETA1"
                    value={sesiKode}
                    onChange={(e) => setSesiKode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Maks. Percobaan / Siswa</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={sesiMaksPercobaan}
                    onChange={(e) => setSesiMaksPercobaan(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBukaSesiModal(false)}
                  className="px-4 py-2 font-semibold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Buka Sesi Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LAYAR PEMANTAU SESI (LIVE MONITOR) */}
      {activeMonitorSesiId && monitorRingkasan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  monitorRingkasan.sesi.status === 'berlangsung' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-200 text-slate-700'
                }`}>
                  Status: {monitorRingkasan.sesi.status.toUpperCase()}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {monitorRingkasan.sesi.judul}
                </h3>
              </div>

              <button onClick={() => setActiveMonitorSesiId(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Peserta</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{monitorRingkasan.totalPeserta} Siswa</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Skor Tertinggi</span>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{monitorRingkasan.tertinggi}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Rata-Rata</span>
                <p className="text-xl font-black text-sky-500 mt-0.5">{monitorRingkasan.rataRata}</p>
              </div>
            </div>

            {/* Live Leaderboard */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Papan Juara Real-Time Sesi
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSVMonitor}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Ekspor CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {monitorRingkasan.papan.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Belum ada peserta yang mengumpulkan skor dalam sesi ini.</p>
                ) : (
                  monitorRingkasan.papan.map((item: any, idx: number) => (
                    <div
                      key={item.siswa?.id || idx}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black ${
                          idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.siswa?.nama || 'Anonim'}</p>
                          <p className="text-[10px] text-slate-400">Kelas {item.siswa?.kelas || '-'} &bull; {item.percobaan}x bermain</p>
                        </div>
                      </div>

                      <span className="text-sm font-black text-emerald-600">{item.skor} Poin</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">Pembaruan otomatis tiap beberapa detik</span>
              {monitorRingkasan.sesi.status === 'berlangsung' && (
                <button
                  onClick={() => handleTutupSesi(monitorRingkasan.sesi)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  Tutup Sesi & Bagikan Bintang
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HAPUS PERMANEN DENGAN KONFIRMASI 2 LANGKAH */}
      {gameToDelete && impactData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Hapus Game Permanen
                </h3>
                <p className="text-xs text-rose-600">Tindakan ini tidak dapat dibatalkan!</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <p className="font-bold">Dampak Penghapusan Game "{gameToDelete.nama}":</p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                <li>{impactData.skorCount} skor tercatat pada database</li>
                <li>{impactData.sesiCount} riwayat sesi kompetisi kelas</li>
                <li>{impactData.siswaCount} siswa yang pernah bermain</li>
                <li>Bintang apresiasi siswa yang sudah diperoleh tetap aman (tidak dicabut).</li>
              </ul>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteWipeHistory}
                onChange={(e) => setDeleteWipeHistory(e.target.checked)}
                className="rounded text-rose-600"
              />
              <span>Hapus bersih seluruh riwayat skor game ini (bukan cadangan)</span>
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ketik nama game persis: <strong className="text-rose-600">{gameToDelete.nama}</strong>
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Ketik nama game di sini..."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGameToDelete(null)}
                className="px-4 py-2 font-semibold text-slate-500 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim().toLowerCase() !== gameToDelete.nama.trim().toLowerCase()}
                onClick={handleExecuteHapusPermanen}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Hapus Game Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
