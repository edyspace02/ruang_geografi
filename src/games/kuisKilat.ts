import { GameContext, GameInstance } from './types';

interface TriviaItem {
  tanya: string;
  opsi: string[];
  kunciIdx: number;
}

const TRIVIA_DATA: TriviaItem[] = [
  {
    tanya: 'Danau vulkanik terbesar di Asia Tenggara adalah...',
    opsi: ['Danau Toba', 'Danau Singkarak', 'Danau Poso', 'Danau Matano'],
    kunciIdx: 0,
  },
  {
    tanya: 'Garis khayal pemisah fauna Asiatis dengan peralihan (Wallacea) disebut...',
    opsi: ['Garis Weber', 'Garis Wallace', 'Garis Khatulistiwa', 'Garis Lydekker'],
    kunciIdx: 1,
  },
  {
    tanya: 'Puncak tertinggi di Indonesia dengan salju abadi adalah...',
    opsi: ['Gunung Kerinci', 'Gunung Rinjani', 'Puncak Jaya (Carstensz)', 'Gunung Semeru'],
    kunciIdx: 2,
  },
  {
    tanya: 'Hutan mangrove memiliki fungsi utama dalam pencegahan bencana berupa...',
    opsi: ['Gempa bumi tektonik', 'Abrasi pantai & Tsunami', 'Tanah longsor', 'Hujan asam'],
    kunciIdx: 1,
  },
  {
    tanya: 'Negara dengan garis pantai terpanjang kedua di dunia adalah...',
    opsi: ['Kanada', 'Indonesia', 'Rusia', 'Norwegia'],
    kunciIdx: 1,
  },
  {
    tanya: 'Lapisan atmosfer tempat terjadinya fenomena awan, hujan, dan badai adalah...',
    opsi: ['Stratosfer', 'Mesosfer', 'Troposfer', 'Termosfer'],
    kunciIdx: 2,
  },
];

export function createKuisKilatGame(): GameInstance {
  let animId: number;
  let canvasRef: HTMLCanvasElement;
  let ctxRef: CanvasRenderingContext2D;
  let context: GameContext;

  let currentIdx = 0;
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let timeLeft = 10;
  let timerInterval: any;
  let isGameOver = false;
  let feedbackTimer = 0;
  let feedbackText = '';
  let feedbackColor = '';

  function getMousePos(e: MouseEvent | Touch) {
    const rect = canvasRef.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasRef.width,
      y: ((e.clientY - rect.top) / rect.height) * canvasRef.height,
    };
  }

  function handleAnswer(choiceIdx: number) {
    if (isGameOver) return;
    const current = TRIVIA_DATA[currentIdx];

    if (choiceIdx === current.kunciIdx) {
      combo++;
      if (combo > maxCombo) maxCombo = combo;
      const speedBonus = timeLeft * 10;
      const roundScore = 100 * combo + speedBonus;
      score += roundScore;

      feedbackText = `+${roundScore} Poin! Kombo x${combo} 🔥`;
      feedbackColor = '#10b981';
      feedbackTimer = 30;
      context.putarSuara('benar');
    } else {
      combo = 0;
      score = Math.max(0, score - 20);
      feedbackText = `Kurang tepat! Kunci: ${current.opsi[current.kunciIdx]}`;
      feedbackColor = '#ef4444';
      feedbackTimer = 30;
      context.putarSuara('salah');
    }

    nextQuestion();
  }

  function nextQuestion() {
    currentIdx++;
    if (currentIdx >= TRIVIA_DATA.length) {
      endGame();
    } else {
      timeLeft = 10;
    }
  }

  function endGame() {
    isGameOver = true;
    clearInterval(timerInterval);
    context.putarSuara('menang');
    setTimeout(() => {
      context.selesai(score);
    }, 1800);
  }

  function checkClick(x: number, y: number) {
    if (isGameOver) return;
    const w = canvasRef.width;
    const h = canvasRef.height;
    const startY = h * 0.44;
    const btnH = 46;
    const spacingY = 56;
    const btnW = w * 0.86;
    const btnX = (w - btnW) / 2;

    for (let i = 0; i < 4; i++) {
      const by = startY + i * spacingY;
      if (x >= btnX && x <= btnX + btnW && y >= by && y <= by + btnH) {
        handleAnswer(i);
        break;
      }
    }
  }

  const onClick = (e: MouseEvent) => {
    const p = getMousePos(e);
    checkClick(p.x, p.y);
  };

  const onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const p = getMousePos(e.touches[0]);
      checkClick(p.x, p.y);
    }
  };

  function render() {
    const w = canvasRef.width;
    const h = canvasRef.height;

    // Fast arcade vibrant gradient
    const bgGrad = ctxRef.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#180728');
    bgGrad.addColorStop(0.5, '#2e1065');
    bgGrad.addColorStop(1, '#0f172a');
    ctxRef.fillStyle = bgGrad;
    ctxRef.fillRect(0, 0, w, h);

    // Top HUD
    ctxRef.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctxRef.fillRect(0, 0, w, 70);

    ctxRef.fillStyle = '#f8fafc';
    ctxRef.font = '800 15px sans-serif';
    ctxRef.textAlign = 'left';
    ctxRef.fillText(`Soal ${Math.min(currentIdx + 1, TRIVIA_DATA.length)}/${TRIVIA_DATA.length}`, 16, 28);

    if (combo > 1) {
      ctxRef.fillStyle = '#f59e0b';
      ctxRef.font = 'bold 13px sans-serif';
      ctxRef.fillText(`🔥 KOMBO x${combo}`, 16, 52);
    } else {
      ctxRef.fillStyle = '#94a3b8';
      ctxRef.font = '12px sans-serif';
      ctxRef.fillText('Kuis Kilat Arcade Geografi', 16, 52);
    }

    // Score & Timer Bar
    ctxRef.textAlign = 'right';
    ctxRef.fillStyle = '#fbbf24';
    ctxRef.font = 'bold 16px sans-serif';
    ctxRef.fillText(`Skor: ${score}`, w - 16, 28);

    // Dynamic timer bar
    const barWidth = 100;
    const progress = Math.max(0, timeLeft / 10);
    ctxRef.fillStyle = 'rgba(255,255,255,0.2)';
    ctxRef.fillRect(w - 16 - barWidth, 42, barWidth, 10);
    ctxRef.fillStyle = timeLeft <= 3 ? '#ef4444' : '#38bdf8';
    ctxRef.fillRect(w - 16 - barWidth, 42, barWidth * progress, 10);

    if (currentIdx < TRIVIA_DATA.length && !isGameOver) {
      const q = TRIVIA_DATA[currentIdx];

      // Question Card
      const cardW = w * 0.9;
      const cardX = (w - cardW) / 2;
      ctxRef.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctxRef.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctxRef.lineWidth = 1;
      ctxRef.beginPath();
      ctxRef.roundRect(cardX, 85, cardW, 85, 10);
      ctxRef.fill();
      ctxRef.stroke();

      ctxRef.fillStyle = '#ffffff';
      ctxRef.font = 'bold 15px sans-serif';
      ctxRef.textAlign = 'center';

      // Simple wrap text
      const words = q.tanya.split(' ');
      let line = '';
      let lineY = 118;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctxRef.measureText(testLine);
        if (metrics.width > cardW - 30 && n > 0) {
          ctxRef.fillText(line, w / 2, lineY);
          line = words[n] + ' ';
          lineY += 22;
        } else {
          line = testLine;
        }
      }
      ctxRef.fillText(line, w / 2, lineY);

      // 4 Option Buttons
      const startY = h * 0.44;
      const btnH = 46;
      const spacingY = 56;
      const btnW = w * 0.86;
      const btnX = (w - btnW) / 2;

      const labels = ['A', 'B', 'C', 'D'];
      const btnGradients = ['#4338ca', '#0284c7', '#059669', '#d97706'];

      q.opsi.forEach((opt, idx) => {
        const by = startY + idx * spacingY;

        ctxRef.fillStyle = btnGradients[idx];
        ctxRef.beginPath();
        ctxRef.roundRect(btnX, by, btnW, btnH, 8);
        ctxRef.fill();

        ctxRef.strokeStyle = 'rgba(255,255,255,0.4)';
        ctxRef.lineWidth = 1.5;
        ctxRef.stroke();

        ctxRef.fillStyle = '#ffffff';
        ctxRef.font = 'bold 14px sans-serif';
        ctxRef.textAlign = 'left';
        ctxRef.fillText(`${labels[idx]}. ${opt}`, btnX + 16, by + 28);
      });
    }

    // Feedback
    if (feedbackTimer > 0) {
      feedbackTimer--;
      ctxRef.fillStyle = feedbackColor;
      ctxRef.font = 'bold 14px sans-serif';
      ctxRef.textAlign = 'center';
      ctxRef.fillText(feedbackText, w / 2, h - 25);
    }

    // Game Over Banner
    if (isGameOver) {
      ctxRef.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctxRef.fillRect(0, 0, w, h);

      ctxRef.fillStyle = '#f59e0b';
      ctxRef.font = '800 24px sans-serif';
      ctxRef.textAlign = 'center';
      ctxRef.fillText('ARCADE RUSH SELESAI!', w / 2, h / 2 - 30);

      ctxRef.fillStyle = '#ffffff';
      ctxRef.font = 'bold 20px sans-serif';
      ctxRef.fillText(`Skor Akhir: ${score}`, w / 2, h / 2 + 10);

      ctxRef.fillStyle = '#38bdf8';
      ctxRef.font = '14px sans-serif';
      ctxRef.fillText(`Kombo Tertinggi: x${maxCombo}`, w / 2, h / 2 + 38);

      ctxRef.fillStyle = '#a7f3d0';
      ctxRef.font = '12px sans-serif';
      ctxRef.fillText('Menyimpan skor & membagikan bintang...', w / 2, h / 2 + 65);
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
      currentIdx = 0;
      score = 0;
      combo = 0;
      maxCombo = 0;
      timeLeft = 10;
      isGameOver = false;

      canvas.addEventListener('click', onClick);
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });

      timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          // Waktu habis untuk pertanyaan ini
          combo = 0;
          feedbackText = 'Waktu habis!';
          feedbackColor = '#ef4444';
          feedbackTimer = 25;
          context.putarSuara('salah');
          nextQuestion();
        }
      }, 1000);

      render();
    },
    hentikan() {
      if (animId) cancelAnimationFrame(animId);
      if (timerInterval) clearInterval(timerInterval);
      if (canvasRef) {
        canvasRef.removeEventListener('click', onClick);
        canvasRef.removeEventListener('touchstart', onTouchStart);
      }
    },
  };
}
