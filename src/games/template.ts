import { GameContext, GameInstance } from './types';

/**
 * ============================================================================
 * TEMPLATE MODUL GAME KANVAS - RUANG GEOGRAFI
 * ============================================================================
 * 
 * CARA MEMBUAT GAME BARU:
 * 1. Duplikat file ini dan beri nama sesuai topik (contoh: `sungaiDanDanau.ts`).
 * 2. Terapkan logika permainan di dalam fungsi `mulai(canvas, ctx, konteks)`.
 * 3. Ketika permainan selesai, panggil `konteks.selesai(skorAkhir)`.
 *    Sistem Ruang Geografi akan otomatis:
 *    - Menyimpan skor ke tabel Supabase/Database
 *    - Menghitung dan memberikan Bintang Apresiasi kepada siswa
 *    - Memperbarui Papan Juara (Leaderboard) Top 10
 * 4. Daftarkan game Anda di `src/games/index.ts` pada array `GAMES_CATALOG`.
 * 
 * ============================================================================
 * CONTOH PROMPT UNTUK MEMINTA AI MEMBUAT GAME BARU:
 * ============================================================================
 * "Buatlah modul game geografi kanvas HTML5 baru untuk Ruang Geografi dengan topik
 *  'Mitigasi Bencana Erupsi Gunung Api'.
 *  Game harus mengikuti kontrak GameInstance:
 *  - fungsi mulai(canvas, ctx, konteks: GameContext)
 *  - fungsi hentikan()
 *  - memanggil konteks.selesai(skor) saat tamat
 *  - mendukung sentuhan HP dan klik mouse
 *  - menggunakan palet warna modern bertema bumi."
 * ============================================================================
 */

export function createTemplateGame(): GameInstance {
  let animId: number;
  let canvasRef: HTMLCanvasElement;
  let ctxRef: CanvasRenderingContext2D;
  let context: GameContext;
  let score = 0;
  let isGameOver = false;

  function render() {
    const w = canvasRef.width;
    const h = canvasRef.height;

    // 1. Bersihkan Kanvas / Gambar Latar Belakang
    ctxRef.fillStyle = '#0f172a';
    ctxRef.fillRect(0, 0, w, h);

    // 2. Gambar Antarmuka & Elemen Game
    ctxRef.fillStyle = '#38bdf8';
    ctxRef.font = 'bold 20px sans-serif';
    ctxRef.textAlign = 'center';
    ctxRef.fillText('Game Geografi Baru', w / 2, h / 2 - 30);

    ctxRef.fillStyle = '#94a3b8';
    ctxRef.font = '14px sans-serif';
    ctxRef.fillText(`Skor Saat Ini: ${score}`, w / 2, h / 2 + 10);

    // 3. Loop Animasi
    if (!isGameOver) {
      animId = requestAnimationFrame(render);
    }
  }

  function onClick() {
    if (isGameOver) return;
    score += 50;
    context.putarSuara('klik');

    if (score >= 300) {
      isGameOver = true;
      context.putarSuara('menang');
      setTimeout(() => {
        // PENTING: Panggil konteks.selesai untuk menyimpan skor ke server!
        context.selesai(score);
      }, 1000);
    }
  }

  return {
    mulai(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, ctxKontek: GameContext) {
      canvasRef = canvas;
      ctxRef = ctx;
      context = ctxKontek;
      score = 0;
      isGameOver = false;

      canvas.addEventListener('click', onClick);
      render();
    },
    hentikan() {
      if (animId) cancelAnimationFrame(animId);
      if (canvasRef) {
        canvasRef.removeEventListener('click', onClick);
      }
    },
  };
}

export const AI_GAME_PROMPT_TEMPLATE = `
Anda adalah game developer web edukasi. Buatlah modul game canvas baru untuk aplikasi Ruang Geografi.
Kontrak yang WAJIB dipatuhi:
1. Export fungsi pembuat game yang mengembalikan GameInstance { mulai(canvas, ctx, konteks), hentikan() }
2. Konteks menyediakan:
   - konteks.siswa: data profil siswa
   - konteks.putarSuara('benar' | 'salah' | 'menang' | 'klik')
   - konteks.selesai(skor: number): WAJIB dipanggil saat game berakhir
3. Responsif terhadap ukuran kanvas (width x height) dan mendukung sentuhan layar HP (touch) serta mouse.
4. Topik Geografi: [Isi topik di sini, misal: Peta Jalur Gempa Megathrust / Klasifikasi Iklim Koppen / Bentang Alam Karst]
`;
