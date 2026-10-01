import { GameContext, GameInstance } from './types';

interface LayerItem {
  id: string;
  order: number; // 0 = Troposfer (terbawah), 4 = Eksosfer (teratas)
  name: string;
  altitude: string;
  description: string;
  color: string;
  // Drag state
  currentX: number;
  currentY: number;
  homeX: number;
  homeY: number;
  placedSlot: number | null;
}

const LAYERS_DEF = [
  { id: 'tropo', order: 0, name: '1. Troposfer', altitude: '0 - 12 km', description: 'Tempat fenomena cuaca, awan & kehidupan', color: '#10b981' },
  { id: 'strato', order: 1, name: '2. Stratosfer', altitude: '12 - 50 km', description: 'Mengandung lapisan ozon penahan sinar UV', color: '#06b6d4' },
  { id: 'meso', order: 2, name: '3. Mesosfer', altitude: '50 - 85 km', description: 'Membakar dan menghancurkan meteorit jatuh', color: '#3b82f6' },
  { id: 'termo', order: 3, name: '4. Termosfer', altitude: '85 - 500 km', description: 'Terjadi aurora & pemantulan sinyal radio', color: '#8b5cf6' },
  { id: 'ekso', order: 4, name: '5. Eksosfer', altitude: '> 500 km', description: 'Batas angkasa luar & lintasan satelit', color: '#ec4899' },
];

export function createSusunLapisanGame(): GameInstance {
  let animId: number;
  let canvasRef: HTMLCanvasElement;
  let ctxRef: CanvasRenderingContext2D;
  let context: GameContext;

  let layers: LayerItem[] = [];
  let draggedLayer: LayerItem | null = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let score = 0;
  let moves = 0;
  let isCompleted = false;

  function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function initPositions() {
    const w = canvasRef.width;
    const h = canvasRef.height;

    const scrambled = shuffle(LAYERS_DEF);
    const cardWidth = Math.min(220, w * 0.42);
    const cardHeight = 44;
    const startY = 85;
    const spacingY = 56;

    layers = scrambled.map((item, idx) => {
      const hx = 20;
      const hy = startY + idx * spacingY;
      return {
        ...item,
        currentX: hx,
        currentY: hy,
        homeX: hx,
        homeY: hy,
        placedSlot: null,
      };
    });
  }

  function getMousePos(e: MouseEvent | Touch) {
    const rect = canvasRef.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasRef.width,
      y: ((e.clientY - rect.top) / rect.height) * canvasRef.height,
    };
  }

  function handleStart(x: number, y: number) {
    if (isCompleted) return;
    const cardW = Math.min(220, canvasRef.width * 0.42);
    const cardH = 44;

    // Check layer under cursor (reverse order to pick topmost)
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (x >= l.currentX && x <= l.currentX + cardW && y >= l.currentY && y <= l.currentY + cardH) {
        draggedLayer = l;
        dragOffsetX = x - l.currentX;
        dragOffsetY = y - l.currentY;
        context.putarSuara('klik');
        break;
      }
    }
  }

  function handleMove(x: number, y: number) {
    if (draggedLayer) {
      draggedLayer.currentX = x - dragOffsetX;
      draggedLayer.currentY = y - dragOffsetY;
    }
  }

  function handleEnd() {
    if (!draggedLayer) return;

    const w = canvasRef.width;
    const h = canvasRef.height;
    const slotX = w * 0.52;
    const slotW = w * 0.44;
    const slotH = 46;
    const startY = 85;
    const spacingY = 56;

    let snapped = false;

    // Check 5 slots: slot 4 is Eksosfer (top, y index 0), slot 0 is Troposfer (bottom, y index 4)
    for (let i = 0; i < 5; i++) {
      const targetSlotOrder = 4 - i; // 4: eksosfer, 3: termo, 2: meso, 1: strato, 0: tropo
      const sy = startY + i * spacingY;

      // Distance check to slot
      if (
        draggedLayer.currentX + slotW / 2 >= slotX &&
        draggedLayer.currentX <= slotX + slotW &&
        draggedLayer.currentY + slotH / 2 >= sy &&
        draggedLayer.currentY <= sy + slotH
      ) {
        moves++;
        if (draggedLayer.order === targetSlotOrder) {
          // Benar! Snap ke slot
          draggedLayer.currentX = slotX + 4;
          draggedLayer.currentY = sy + 2;
          draggedLayer.placedSlot = targetSlotOrder;
          context.putarSuara('benar');
          snapped = true;
        } else {
          // Salah posisi
          context.putarSuara('salah');
        }
        break;
      }
    }

    if (!snapped) {
      // Snap kembali ke home jika tidak pas
      draggedLayer.currentX = draggedLayer.homeX;
      draggedLayer.currentY = draggedLayer.homeY;
      draggedLayer.placedSlot = null;
    }

    draggedLayer = null;

    // Cek apakah semua 5 lapisan sudah berada di tempat yang benar
    const allCorrect = layers.every((l) => l.placedSlot === l.order);
    if (allCorrect && !isCompleted) {
      isCompleted = true;
      score = Math.max(200, 500 - (moves - 5) * 30);
      context.putarSuara('menang');
      setTimeout(() => {
        context.selesai(score);
      }, 1600);
    }
  }

  // Event handlers
  const onMouseDown = (e: MouseEvent) => {
    const p = getMousePos(e);
    handleStart(p.x, p.y);
  };
  const onMouseMove = (e: MouseEvent) => {
    const p = getMousePos(e);
    handleMove(p.x, p.y);
  };
  const onMouseUp = () => handleEnd();

  const onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const p = getMousePos(e.touches[0]);
      handleStart(p.x, p.y);
    }
  };
  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const p = getMousePos(e.touches[0]);
      handleMove(p.x, p.y);
    }
  };
  const onTouchEnd = () => handleEnd();

  function render() {
    const w = canvasRef.width;
    const h = canvasRef.height;

    // Background Kosmik ke Atmosfer
    const bgGrad = ctxRef.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.4, '#1e1b4b');
    bgGrad.addColorStop(0.7, '#075985');
    bgGrad.addColorStop(1, '#064e3b');
    ctxRef.fillStyle = bgGrad;
    ctxRef.fillRect(0, 0, w, h);

    // Header HUD
    ctxRef.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctxRef.fillRect(0, 0, w, 68);

    ctxRef.fillStyle = '#f8fafc';
    ctxRef.font = '800 16px sans-serif';
    ctxRef.textAlign = 'left';
    ctxRef.fillText('Susun Lapisan Atmosfer Bumi', 16, 28);

    ctxRef.fillStyle = '#94a3b8';
    ctxRef.font = '12px sans-serif';
    ctxRef.fillText('Tarik kotak lapisan ke kolom ketinggian yang sesuai!', 16, 50);

    // Draw Right Drop Column (Altitude Slots)
    const slotX = w * 0.52;
    const slotW = w * 0.44;
    const slotH = 46;
    const startY = 85;
    const spacingY = 56;

    for (let i = 0; i < 5; i++) {
      const sy = startY + i * spacingY;
      const slotOrder = 4 - i;
      const refDef = LAYERS_DEF.find((l) => l.order === slotOrder);

      // Slot container
      ctxRef.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctxRef.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctxRef.lineWidth = 1.5;
      ctxRef.fillRect(slotX, sy, slotW, slotH);
      ctxRef.strokeRect(slotX, sy, slotW, slotH);

      // Altitude indicator
      ctxRef.fillStyle = '#38bdf8';
      ctxRef.font = 'bold 11px monospace';
      ctxRef.textAlign = 'right';
      ctxRef.fillText(refDef?.altitude || '', slotX + slotW - 8, sy + 28);

      ctxRef.fillStyle = 'rgba(255,255,255,0.4)';
      ctxRef.font = '11px sans-serif';
      ctxRef.textAlign = 'left';
      ctxRef.fillText(`[Slot Ketinggian #${5 - i}]`, slotX + 8, sy + 28);
    }

    // Draw Left Source Guide
    ctxRef.fillStyle = 'rgba(255,255,255,0.6)';
    ctxRef.font = 'bold 12px sans-serif';
    ctxRef.textAlign = 'left';
    ctxRef.fillText('PILIHAN LAPISAN:', 20, 78);

    ctxRef.fillText('KOLOM KETINGGIAN (ATMOSFER):', slotX, 78);

    // Draw Layers Cards
    const cardW = Math.min(220, w * 0.42);
    const cardH = 44;

    layers.forEach((l) => {
      const isDragging = draggedLayer?.id === l.id;
      const isPlaced = l.placedSlot !== null;

      ctxRef.save();
      if (isDragging) {
        ctxRef.shadowColor = 'rgba(250, 204, 21, 0.5)';
        ctxRef.shadowBlur = 15;
      }

      ctxRef.fillStyle = isPlaced ? '#059669' : l.color;
      ctxRef.beginPath();
      ctxRef.roundRect(l.currentX, l.currentY, cardW, cardH, 6);
      ctxRef.fill();

      ctxRef.strokeStyle = isDragging ? '#facc15' : 'rgba(255, 255, 255, 0.8)';
      ctxRef.lineWidth = isDragging ? 3 : 1;
      ctxRef.stroke();

      // Card Text
      ctxRef.fillStyle = '#ffffff';
      ctxRef.font = 'bold 12px sans-serif';
      ctxRef.textAlign = 'left';
      ctxRef.fillText(l.name, l.currentX + 8, l.currentY + 18);

      ctxRef.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctxRef.font = '10px sans-serif';
      ctxRef.fillText(l.description.substring(0, 30) + '...', l.currentX + 8, l.currentY + 34);

      ctxRef.restore();
    });

    // Victory Banner
    if (isCompleted) {
      ctxRef.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctxRef.fillRect(0, 0, w, h);

      ctxRef.fillStyle = '#34d399';
      ctxRef.font = '800 24px sans-serif';
      ctxRef.textAlign = 'center';
      ctxRef.fillText('LUAR BIASA! TERSUSUN SEMPURNA!', w / 2, h / 2 - 20);

      ctxRef.fillStyle = '#fbbf24';
      ctxRef.font = 'bold 18px sans-serif';
      ctxRef.fillText(`Skor: +${score} Poin`, w / 2, h / 2 + 15);

      ctxRef.fillStyle = '#f8fafc';
      ctxRef.font = '13px sans-serif';
      ctxRef.fillText('Menyimpan skor & memberikan bintang apresiasi...', w / 2, h / 2 + 45);
    }

    if (!isCompleted) {
      animId = requestAnimationFrame(render);
    }
  }

  return {
    mulai(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, ctxKontek: GameContext) {
      canvasRef = canvas;
      ctxRef = ctx;
      context = ctxKontek;
      isCompleted = false;
      score = 0;
      moves = 0;

      initPositions();

      canvas.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);

      render();
    },
    hentikan() {
      if (animId) cancelAnimationFrame(animId);
      if (canvasRef) {
        canvasRef.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        canvasRef.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      }
    },
  };
}
