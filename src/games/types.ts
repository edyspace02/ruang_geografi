import { Profile } from '../types';

export interface GameContext {
  siswa: Profile;
  lebar: number;
  tinggi: number;
  suaraAktif: boolean;
  selesai: (skorAkhir: number) => void;
  putarSuara: (tipe: 'benar' | 'salah' | 'menang' | 'klik') => void;
}

export interface GameInstance {
  mulai: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, konteks: GameContext) => void;
  hentikan: () => void;
}

export interface GameDefinition {
  id: string;
  nama: string;
  ikon: string;
  deskripsi: string;
  kelas: string[];
  bab: string;
  aktif: boolean;
  skorMaks: number;
  poinBintang: number;
  instansiasi: () => GameInstance;
}
