import { GameContext, GameInstance } from './types';

interface Island {
  id: string;
  nama: string;
  deskripsi: string;
  color: string;
  points: [number, number][]; // normalized 0..1
  center: [number, number];
}

const ISLANDS: Island[] = [
  {
    id: 'sumatera',
    nama: 'Pulau Sumatera',
    deskripsi: 'Pulau terbesar ke-6 di dunia, kaya pegunungan Bukit Barisan dan Danau Toba.',
    color: '#059669',
    center: [0.18, 0.42],
    points: [
      [0.08, 0.22],
      [0.15, 0.22],
      [0.26, 0.48],
      [0.28, 0.60],
      [0.25, 0.66],
      [0.18, 0.52],
      [0.10, 0.32],
    ],
  },
  {
    id: 'jawa',
    nama: 'Pulau Jawa',
    deskripsi: 'Pusat populasi dan ekonomi Indonesia, memiliki deretan gunung berapi aktif.',
    color: '#d97706',
    center: [0.36, 0.72],
    points: [
      [0.26, 0.70],
      [0.48, 0.70],
      [0.46, 0.76],
      [0.26, 0.76],
    ],
  },
  {
    id: 'kalimantan',
    nama: 'Pulau Kalimantan',
    deskripsi: 'Paru-paru dunia dengan hutan hujan tropis tertua, bagian lempeng Sundaland stabil.',
    color: '#10b981',
    center: [0.42, 0.38],
    points: [
      [0.34, 0.26],
      [0.48, 0.24],
      [0.54, 0.36],
      [0.50, 0.52],
      [0.36, 0.52],
      [0.32, 0.38],
    ],
  },
  {
    id: 'sulawesi',
    nama: 'Pulau Sulawesi',
    deskripsi: 'Pulau berbentuk huruf K unik, zona transisi flora fauna Wallacea.',
    color: '#0284c7',
    center: [0.60, 0.44],
    points: [
      [0.56, 0.30],
      [0.64, 0.32],
      [0.60, 0.42],
      [0.64, 0.52],
      [0.58, 0.60],
      [0.55, 0.46],
    ],
  },
  {
    id: 'nusa_tenggara',
    nama: 'Bali & Nusa Tenggara',
    deskripsi: 'Gugusan kepulauan Sunda Kecil, dari Pulau Dewata hingga Komodo.',
    color: '#f59e0b',
    center: [0.58, 0.74],
    points: [
      [0.49, 0.72],
      [0.68, 0.72],
      [0.67, 0.77],
      [0.49, 0.77],
    ],
  },
  {
    id: 'maluku',
    nama: 'Kepulauan Maluku',
    deskripsi: 'Kepulauan rempah-rempah yang termasyhur dalam sejarah perdagangan dunia.',
    color: '#8b5cf6',
    center: [0.73, 0.45],
    points: [
      [0.68, 0.36],
      [0.76, 0.38],
      [0.75, 0.54],
      [0.69, 0.52],
    ],
  },
  {
    id: 'papua',
    nama: 'Pulau Papua',
    deskripsi: 'Pulau berbentuk burung cenderawasih, memiliki Puncak Jaya dengan gletser abadi.',
    color: '#16a34a',
    center: [0.88, 0.48],
    points: [
      [0.78, 0.40],
      [0.85, 0.36],
      [0.96, 0.42],
      [0.95, 0.62],
      [0.86, 0.58],
      [0.80, 0.48],
    ],
  },
];

export function createTebakPetaGame(): GameInstance {
  let animId: number;
  let canvasRef: HTMLCanvasElement;
  let ctxRef: CanvasRenderingContext2D;
  let context: GameContext;

  let currentTargetIndex = 0;
  let targetOrder: number[] = [];
  let score = 0;
  let timeLeft = 45;
  let timerInterval: any;
  let isGameOver = false;
  let hoveredIsland: Island | null = null;
  let feedbackText = '';
  let feedbackTimer = 0;
  let combo = 0;

  function shuffle(array: number[]) {
    return array.sort(() => Math.random() - 0.5);
  }

  function pointInPolygon(point: [number, number], vs: [number, number][]) {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0], yi = vs[i][1];
      const xj = vs[j][0], yj = vs[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function getMousePos(e: MouseEvent | Touch) {
    const rect = canvasRef.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return [x, y] as [number, number];
  }

  function checkIslandHit(pos: [number, number]): Island | null {
    // Check distance to center first for small touch forgiveness
    for (const island of ISLANDS) {
      const d = Math.hypot(pos[0] - island.center[0], pos[1] - island.center[1]);
      if (d < 0.08) return island;
      if (pointInPolygon(pos, island.points)) return island;
    }
    return null;
  }

  function handleInteraction(pos: [number, number]) {
    if (isGameOver) return;
    const targetIsland = ISLANDS[targetOrder[currentTargetIndex]];
    const hit = checkIslandHit(pos);

    if (hit && hit.id === targetIsland.id) {
      // Benar
      combo++;
      const bonus = combo * 40;
      const roundScore = 150 + bonus;
      score += roundScore;
      feedbackText = `Benar! +${roundScore} Poin (Kombo x${combo})`;
      feedbackTimer = 60;
      context.putarSuara('benar');

      currentTargetIndex++;
      if (currentTargetIndex >= targetOrder.length) {
        // Selesai semua pulau!
        winGame();
      }
    } else if (hit) {
      // Salah
      combo = 0;
      score = Math.max(0, score - 30);
      feedbackText = `Itu ${hit.nama}! Coba lagi.`;
      feedbackTimer = 60;
      context.putarSuara('salah');
    }
  }

  function winGame() {
    isGameOver = true;
    clearInterval(timerInterval);
    const timeBonus = timeLeft * 10;
    score += timeBonus;
    context.putarSuara('menang');
    setTimeout(() => {
      context.selesai(score);
    }, 1500);
  }

  function gameOver() {
    isGameOver = true;
    clearInterval(timerInterval);
    context.putarSuara('salah');
    setTimeout(() => {
      context.selesai(score);
    }, 1500);
  }

  // Event Listeners
  function onMouseMove(e: MouseEvent) {
    const pos = getMousePos(e);
    hoveredIsland = checkIslandHit(pos);
  }

  function onClick(e: MouseEvent) {
    const pos = getMousePos(e);
    handleInteraction(pos);
  }

  function onTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const pos = getMousePos(e.touches[0]);
      hoveredIsland = checkIslandHit(pos);
      handleInteraction(pos);
    }
  }

  function render() {
    const w = canvasRef.width;
    const h = canvasRef.height;

    // Background Lautan Samudera Indonesia
    const seaGradient = ctxRef.createLinearGradient(0, 0, 0, h);
    seaGradient.addColorStop(0, '#0f172a');
    seaGradient.addColorStop(0.5, '#0369a1');
    seaGradient.addColorStop(1, '#0284c7');
    ctxRef.fillStyle = seaGradient;
    ctxRef.fillRect(0, 0, w, h);

    // Grid garis lintang & bujur kartografi halus
    ctxRef.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctxRef.lineWidth = 1;
    for (let x = 0; x < w; x += w / 8) {
      ctxRef.beginPath();
      ctxRef.moveTo(x, 0);
      ctxRef.lineTo(x, h);
      ctxRef.stroke();
    }
    for (let y = 0; y < h; y += h / 6) {
      ctxRef.beginPath();
      ctxRef.moveTo(0, y);
      ctxRef.lineTo(w, y);
      ctxRef.stroke();
    }

    // Gambar Kepulauan
    ISLANDS.forEach((island) => {
      const isHovered = hoveredIsland?.id === island.id;
      ctxRef.beginPath();
      island.points.forEach(([px, py], idx) => {
        const x = px * w;
        const y = py * h;
        if (idx === 0) ctxRef.moveTo(x, y);
        else ctxRef.lineTo(x, y);
      });
      ctxRef.closePath();

      // Shadow
      ctxRef.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctxRef.shadowBlur = isHovered ? 15 : 6;
      ctxRef.fillStyle = isHovered ? '#fef08a' : island.color;
      ctxRef.fill();
      ctxRef.shadowBlur = 0;

      ctxRef.strokeStyle = isHovered ? '#ca8a04' : '#ffffff';
      ctxRef.lineWidth = isHovered ? 3 : 1.5;
      ctxRef.stroke();

      // Label Pulau
      ctxRef.fillStyle = isHovered ? '#1e293b' : 'rgba(255,255,255,0.9)';
      ctxRef.font = isHovered ? 'bold 13px sans-serif' : '11px sans-serif';
      ctxRef.textAlign = 'center';
      ctxRef.fillText(island.nama, island.center[0] * w, island.center[1] * h);
    });

    // Top HUD
    ctxRef.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctxRef.fillRect(0, 0, w, 65);

    // Target Prompt
    const currentTarget = ISLANDS[targetOrder[currentTargetIndex]];
    ctxRef.fillStyle = '#ffffff';
    ctxRef.font = 'bold 15px sans-serif';
    ctxRef.textAlign = 'left';
    ctxRef.fillText(`Target (${currentTargetIndex + 1}/${targetOrder.length}):`, 16, 26);

    ctxRef.fillStyle = '#38bdf8';
    ctxRef.font = '800 18px sans-serif';
    ctxRef.fillText(currentTarget ? currentTarget.nama.toUpperCase() : 'SELESAI!', 16, 50);

    // Score & Timer HUD
    ctxRef.textAlign = 'right';
    ctxRef.fillStyle = '#fbbf24';
    ctxRef.font = 'bold 16px sans-serif';
    ctxRef.fillText(`Skor: ${score}`, w - 16, 26);

    ctxRef.fillStyle = timeLeft <= 10 ? '#ef4444' : '#a7f3d0';
    ctxRef.font = 'bold 15px sans-serif';
    ctxRef.fillText(`Waktu: ${timeLeft}s`, w - 16, 50);

    // Feedback Alert Banner
    if (feedbackTimer > 0) {
      feedbackTimer--;
      ctxRef.fillStyle = feedbackText.includes('Benar') ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)';
      ctxRef.fillRect(w / 2 - 160, h - 55, 320, 36);
      ctxRef.fillStyle = '#ffffff';
      ctxRef.textAlign = 'center';
      ctxRef.font = 'bold 14px sans-serif';
      ctxRef.fillText(feedbackText, w / 2, h - 32);
    }

    // Game Over Overlay
    if (isGameOver) {
      ctxRef.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctxRef.fillRect(0, 0, w, h);
      ctxRef.fillStyle = '#38bdf8';
      ctxRef.font = '800 24px sans-serif';
      ctxRef.textAlign = 'center';
      ctxRef.fillText(currentTargetIndex >= targetOrder.length ? 'MISI SELESAI!' : 'WAKTU HABIS!', w / 2, h / 2 - 20);

      ctxRef.fillStyle = '#f8fafc';
      ctxRef.font = '16px sans-serif';
      ctxRef.fillText(`Total Skor Kamu: ${score}`, w / 2, h / 2 + 15);
      ctxRef.fillStyle = '#fbbf24';
      ctxRef.font = 'bold 14px sans-serif';
      ctxRef.fillText('Menyimpan skor & memberikan bintang...', w / 2, h / 2 + 45);
    }

    if (!isGameOver) {
      animId = requestAnimationFrame(render);
    }
  }

  return {
    mulai(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, ctxKontek: GameContext) {
      canvasRef = canvas;
      ctxRef = ctx;
      context = ctxKontek;

      // Inisialisasi giliran pulau
      targetOrder = shuffle(ISLANDS.map((_, i) => i)).slice(0, 5);
      currentTargetIndex = 0;
      score = 0;
      timeLeft = 45;
      isGameOver = false;
      combo = 0;

      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('click', onClick);
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });

      timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          gameOver();
        }
      }, 1000);

      render();
    },
    hentikan() {
      if (animId) cancelAnimationFrame(animId);
      if (timerInterval) clearInterval(timerInterval);
      if (canvasRef) {
        canvasRef.removeEventListener('mousemove', onMouseMove);
        canvasRef.removeEventListener('click', onClick);
        canvasRef.removeEventListener('touchstart', onTouchStart);
      }
    },
  };
}
