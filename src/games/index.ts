import { GameDefinition, GameInstance } from './types';
import { createTebakPetaGame } from './tebakPeta';
import { createSusunLapisanGame } from './susunLapisan';
import { createKuisKilatGame } from './kuisKilat';
import { createTemplateGame } from './template';
import { createDynamicKuisSoalGame } from './dynamicKuisSoal';
import { GameItem, Soal } from '../types';
import { DB } from '../services/db';

export const GAMES_CATALOG: GameDefinition[] = [
  {
    id: 'tebak-peta',
    nama: 'Tebak Peta Indonesia',
    ikon: '🗺️',
    deskripsi: 'Kenali lokasi kepulauan dan provinsi di Indonesia pada peta interaktif.',
    kelas: ['X-1', 'X-2', 'XI IPS 1', 'XI IPS 2', 'XII IPS 1', 'Semua'],
    bab: 'Peta, Penginderaan Jauh & SIG',
    aktif: true,
    skorMaks: 1000,
    poinBintang: 3,
    instansiasi: createTebakPetaGame,
  },
  {
    id: 'susun-lapisan',
    nama: 'Susun Lapisan Bumi & Atmosfer',
    ikon: '🌍',
    deskripsi: 'Teka-teki seret-dan-letakkan lapisan litosfer dan atmosfer ke urutan ketinggian yang benar.',
    kelas: ['X-1', 'X-2', 'XI IPS 1', 'XI IPS 2', 'XII IPS 1', 'Semua'],
    bab: 'Litosfer & Atmosfer',
    aktif: true,
    skorMaks: 500,
    poinBintang: 3,
    instansiasi: createSusunLapisanGame,
  },
  {
    id: 'kuis-kilat',
    nama: 'Kuis Kilat Geografi (Arcade Rush)',
    ikon: '⚡',
    deskripsi: 'Tantangan arcade cepat 10 detik per soal dengan pengganda kombo bertingkat!',
    kelas: ['X-1', 'X-2', 'XI IPS 1', 'XI IPS 2', 'XII IPS 1', 'Semua'],
    bab: 'Umum Geografi',
    aktif: true,
    skorMaks: 1500,
    poinBintang: 4,
    instansiasi: createKuisKilatGame,
  },
];

export function resolveGameRunner(game: GameItem): GameInstance {
  // 1. Jika bertipe Kuis dari Bank Soal
  if (game.tipe === 'kuis_bank_soal') {
    const bab = game.konfigurasi?.bab || game.bab;
    const allSoal = DB.soal.daftar(bab === 'Semua' ? undefined : bab);
    const durasi = game.konfigurasi?.durasiDetikPerSoal || 12;
    return createDynamicKuisSoalGame(allSoal, durasi);
  }

  // 2. Berdasarkan ID bawaan katalog
  if (game.id === 'tebak-peta') return createTebakPetaGame();
  if (game.id === 'susun-lapisan') return createSusunLapisanGame();
  if (game.id === 'kuis-kilat') return createKuisKilatGame();

  // 3. Fallback ke template game
  return createTemplateGame();
}
