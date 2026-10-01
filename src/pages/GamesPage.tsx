import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Settings,
  Users,
  Flame,
  Key,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { resolveGameRunner } from '../games';
import { GameInstance } from '../games/types';
import { GameItem, Profile, SesiGame } from '../types';
import { DB } from '../services/db';
import { sound } from '../utils/audio';

interface Props {
  user: Profile;
  soundEnabled: boolean;
  onNavigate?: (tab: string, meta?: any) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onStarEarned?: () => void;
}

export const GamesPage: React.FC<Props> = ({
  user,
  soundEnabled,
  onNavigate,
  onNotify,
  onStarEarned,
}) => {
  const isGuru = user.peran === 'guru';

  // Game data from DB
  const [games, setGames] = useState<GameItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<SesiGame[]>([]);
  const [activeGame, setActiveGame] = useState<GameItem | null>(null);
  const [activeSesi, setActiveSesi] = useState<SesiGame | null>(null);

  // Leaderboard
  const [gameLeaderboard, setGameLeaderboard] = useState<any[]>([]);
  const [selectedLeaderboardGame, setSelectedLeaderboardGame] = useState<string>('tebak-peta');
  const [activeTab, setActiveTab] = useState<'main' | 'peringkat' | 'sesi'>('main');

  // PIN modal for sessions
  const [pinModalSesi, setPinModalSesi] = useState<SesiGame | null>(null);
  const [enteredPin, setEnteredPin] = useState('');

  // Canvas Runner Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const instanceRef = useRef<GameInstance | null>(null);

  // Load games & sessions
  const refreshGamesAndSessions = () => {
    const allActive = DB.game.daftar(false);
    if (isGuru) {
      setGames(allActive);
    } else {
      const filtered = allActive.filter(
        (g) => g.kelas.includes('Semua') || g.kelas.includes(user.kelas)
      );
      setGames(filtered);
    }

    const liveSessions = DB.sesi.daftar('berlangsung');
    if (isGuru) {
      setActiveSessions(liveSessions);
    } else {
      const forStudent = liveSessions.filter(
        (s) => s.kelas.includes('Semua') || s.kelas.includes(user.kelas)
      );
      setActiveSessions(forStudent);
    }
  };

  useEffect(() => {
    refreshGamesAndSessions();
  }, [user, isGuru]);

  // Refresh Leaderboard
  useEffect(() => {
    if (selectedLeaderboardGame) {
      setGameLeaderboard(DB.game.papanJuara(selectedLeaderboardGame, 'sepanjang_masa'));
    }
  }, [selectedLeaderboardGame]);

  const handleStartGame = (game: GameItem, sesi?: SesiGame) => {
    // Mode sesi wajib check for students
    if (!isGuru && game.modeSesi === 'wajib_sesi' && !sesi) {
      const matchingSesi = activeSessions.find((s) => s.gameId === game.id);
      if (!matchingSesi) {
        onNotify(
          'Game ini dalam mode "Sesi Wajib". Hanya dapat dimainkan saat sesi kompetisi dibuka oleh guru.',
          'error'
        );
        return;
      }
      handleInitiateSessionPlay(matchingSesi);
      return;
    }

    // Attempt limit check for student in a session
    if (!isGuru && sesi) {
      const attempts = DB.sesi.getSiswaAttemptCount(sesi.id, user.id);
      if (attempts >= sesi.maksPercobaan) {
        onNotify(
          `Batas percobaan kamu untuk sesi "${sesi.judul}" sudah tercapai (${sesi.maksPercobaan}x).`,
          'error'
        );
        return;
      }
    }

    setActiveSesi(sesi || null);
    setActiveGame(game);
  };

  const handleInitiateSessionPlay = (sesi: SesiGame) => {
    const targetGame = DB.game.getById(sesi.gameId);
    if (!targetGame) {
      onNotify('Game untuk sesi ini tidak ditemukan.', 'error');
      return;
    }

    // Check attempts
    const attempts = DB.sesi.getSiswaAttemptCount(sesi.id, user.id);
    if (!isGuru && attempts >= sesi.maksPercobaan) {
      onNotify(
        `Batas percobaan (${sesi.maksPercobaan}x) untuk sesi ini telah tercapai.`,
        'error'
      );
      return;
    }

    // If PIN required
    if (sesi.kode && sesi.kode.trim().length > 0 && !isGuru) {
      setPinModalSesi(sesi);
      setEnteredPin('');
      return;
    }

    handleStartGame(targetGame, sesi);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalSesi) return;

    if (enteredPin.trim().toUpperCase() !== pinModalSesi.kode?.trim().toUpperCase()) {
      onNotify('Kode PIN sesi salah. Silakan tanyakan ke guru pengampu.', 'error');
      return;
    }

    const targetGame = DB.game.getById(pinModalSesi.gameId);
    setPinModalSesi(null);
    if (targetGame) {
      handleStartGame(targetGame, pinModalSesi);
    }
  };

  const handleCloseGame = () => {
    if (instanceRef.current) {
      instanceRef.current.hentikan();
      instanceRef.current = null;
    }
    setActiveGame(null);
    setActiveSesi(null);
  };

  // Run Game Engine on Canvas Mount
  useEffect(() => {
    if (!activeGame || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = window.innerWidth < 640;
    const displayWidth = Math.min(window.innerWidth - 32, 720);
    const displayHeight = isMobile ? 480 : 440;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    const gameInstance = resolveGameRunner(activeGame);
    instanceRef.current = gameInstance;

    // Start with game context
    gameInstance.mulai(canvas, ctx, {
      siswa: user,
      lebar: displayWidth,
      tinggi: displayHeight,
      suaraAktif: soundEnabled,
      putarSuara: (type) => {
        if (soundEnabled) sound.play(type);
      },
      selesai: (skorAkhir) => {
        // Record score to server/database with optional session ID
        const res = DB.game.kirimSkor(activeGame.id, user.id, skorAkhir, activeSesi?.id);

        if (res.bintang > 0) {
          confetti({
            particleCount: 75,
            spread: 75,
            origin: { y: 0.6 },
          });
          onNotify(
            `Luar biasa! Skor ${skorAkhir} tersimpan. Kamu mendapat +${res.bintang} Bintang Apresiasi!`,
            'success'
          );
          if (onStarEarned) onStarEarned();
        } else {
          onNotify(`Permainan selesai! Skor Anda: ${skorAkhir}.`, 'info');
        }

        // Refresh ranking & sessions
        setGameLeaderboard(DB.game.papanJuara(activeGame.id, 'sepanjang_masa'));
        refreshGamesAndSessions();
      },
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.hentikan();
        instanceRef.current = null;
      }
    };
  }, [activeGame]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Gamepad2 className="w-6 h-6 text-emerald-600" />
            Game Edukasi Geografi (Canvas)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Asah kecerdasan spasial melalui permainan kanvas interaktif dan kumpulkan bintang apresiasi.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Guru Quick Button to Kelola Game */}
          {isGuru && onNavigate && (
            <button
              onClick={() => onNavigate('kelola-game')}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <Settings className="w-4 h-4" />
              <span>Kelola Game & Sesi</span>
            </button>
          )}

          {/* Navigation Tabs (Only standard tabs: Pilihan Game & Papan Juara) */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
            <button
              onClick={() => setActiveTab('main')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                activeTab === 'main'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pilihan Game
            </button>
            <button
              onClick={() => setActiveTab('peringkat')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                activeTab === 'peringkat'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Papan Juara
            </button>
            {activeSessions.length > 0 && (
              <button
                onClick={() => setActiveTab('sesi')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
                  activeTab === 'sesi'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
                }`}
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Sesi Aktif ({activeSessions.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE COMPETITION SESSION BANNER FOR STUDENTS */}
      {activeSessions.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                    Sesi Kompetisi Berlangsung
                  </span>
                  <span className="text-xs text-amber-100 font-semibold">
                    {activeSessions[0].kelas.join(', ')}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold mt-0.5">
                  {activeSessions[0].judul}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right text-xs">
                <p className="text-[11px] text-amber-100">Batas Percobaan</p>
                <p className="font-extrabold">
                  {DB.sesi.getSiswaAttemptCount(activeSessions[0].id, user.id)} / {activeSessions[0].maksPercobaan}x
                </p>
              </div>

              <button
                onClick={() => handleInitiateSessionPlay(activeSessions[0])}
                className="px-4 py-2 bg-white text-orange-600 hover:bg-orange-50 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-orange-600" />
                Gabung Sesi Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Pilihan Game */}
      {activeTab === 'main' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Gamepad2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                Belum ada game yang aktif untuk kelas Anda
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Guru dapat mengaktifkan game melalui menu Kelola Game.
              </p>
            </div>
          ) : (
            games.map((game) => {
              const matchingSession = activeSessions.find((s) => s.gameId === game.id);
              const isWajibSesi = game.modeSesi === 'wajib_sesi';

              return (
                <div
                  key={game.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-emerald-500/50 flex flex-col justify-between transition group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-3xl shadow-inner">
                        {game.ikon}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                          <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                          +{game.poinBintang}⭐
                        </span>
                        {isWajibSesi && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900">
                            Wajib Sesi
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {game.bab}
                        </span>
                        {game.tipe === 'kuis_bank_soal' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                            Bank Soal
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                        {game.nama}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-2">
                        {game.deskripsi}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Maks: {game.skorMaks} Poin
                    </span>

                    {matchingSession ? (
                      <button
                        onClick={() => handleInitiateSessionPlay(matchingSession)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md"
                      >
                        <Trophy className="w-3.5 h-3.5 fill-white" />
                        Main Sesi Aktif
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartGame(game)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Mainkan
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Papan Juara Per Game */}
      {activeTab === 'peringkat' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Papan Juara Top 10 Game Geografi
              </h3>
              <p className="text-xs text-slate-500">
                Skor tertinggi yang tercatat secara real-time pada game terpilih.
              </p>
            </div>

            <select
              value={selectedLeaderboardGame}
              onChange={(e) => setSelectedLeaderboardGame(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {gameLeaderboard.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Belum ada skor yang tercatat untuk game ini.
              </p>
            ) : (
              gameLeaderboard.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-900'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.siswa?.nama || 'Anonim'}
                      </p>
                      <p className="text-[10px] text-slate-400">Kelas {item.siswa?.kelas || 'X'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-600">{item.skor} Poin</span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Daftar Sesi Kompetisi Berlangsung */}
      {activeTab === 'sesi' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Sesi Kompetisi Game yang Sedang Berlangsung
            </h3>
            {isGuru && onNavigate && (
              <button
                onClick={() => onNavigate('kelola-game')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                Atur & Buka Sesi Baru &rarr;
              </button>
            )}
          </div>

          {activeSessions.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              Tidak ada sesi kompetisi yang sedang berlangsung saat ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map((sesi) => {
                const gameObj = DB.game.getById(sesi.gameId);
                const attemptsUsed = DB.sesi.getSiswaAttemptCount(sesi.id, user.id);
                const isLimitReached = !isGuru && attemptsUsed >= sesi.maksPercobaan;

                return (
                  <div
                    key={sesi.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Kelas {sesi.kelas.join(', ')}
                        </span>
                        {sesi.kode && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center gap-1">
                            <Key className="w-3 h-3" /> PIN: {isGuru ? sesi.kode : 'Terkunci'}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                        {sesi.judul}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>{gameObj?.ikon} {gameObj?.nama}</span>
                        <span>&bull;</span>
                        <span>Maks: {sesi.maksPercobaan}x Percobaan</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {isGuru ? `${DB.sesi.getPesertaCount(sesi.id)} Siswa Bergabung` : `Percobaan Anda: ${attemptsUsed} / ${sesi.maksPercobaan}`}
                      </span>

                      <button
                        disabled={isLimitReached}
                        onClick={() => handleInitiateSessionPlay(sesi)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                          isLimitReached
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                      >
                        {isLimitReached ? 'Percobaan Habis' : 'Masuk Sesi'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: INPUT PIN SESI */}
      {pinModalSesi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                Masukkan Kode Sesi
              </h3>
              <button
                onClick={() => setPinModalSesi(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500 dark:text-slate-400">
              Sesi "<strong>{pinModalSesi.judul}</strong>" diproteksi dengan kode PIN oleh guru.
            </p>

            <form onSubmit={handleConfirmPin} className="space-y-4">
              <div>
                <label className="font-bold block mb-1">Kode PIN Sesi</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value.toUpperCase())}
                  placeholder="Contoh: PETA1"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center text-sm font-bold uppercase tracking-widest"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModalSesi(null)}
                  className="px-4 py-2 font-semibold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                >
                  Buka Permainan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GAME RUNNER CANVAS MODAL */}
      {activeGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col items-center">
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-white">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeGame.ikon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base">{activeGame.nama}</h3>
                    {activeSesi && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                        🏆 Sesi: {activeSesi.judul}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{activeGame.bab}</p>
                </div>
              </div>

              <button
                onClick={handleCloseGame}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
                title="Tutup Permainan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The Active HTML5 Canvas */}
            <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950 flex items-center justify-center w-full">
              <canvas
                ref={canvasRef}
                className="block max-w-full h-auto cursor-crosshair touch-none select-none"
              />
            </div>

            <p className="text-[11px] text-slate-400 mt-3 text-center">
              Gunakan mouse atau sentuhan jari pada layar ponsel untuk berinteraksi dengan permainan kanvas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
