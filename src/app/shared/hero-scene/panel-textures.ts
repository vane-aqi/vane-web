import { Tone } from '../../core/models';

/**
 * Draws the miniature app screens that sit on the 3D glass panels.
 * Plain 2D canvas, no three.js, so it's easy to tweak and test on its own.
 */

export interface TileData {
  label: string;
  value: string;
  unit: string;
  status: string;
  tone: Tone;
}

export interface RoomData {
  name: string;
  label: string;
  tone: Tone | null;
  tones: Tone[];
}

export interface SceneData {
  room: string;
  verdict: string;
  verdictTone: Tone | null;
  sub: string;
  tiles: TileData[];
  rooms: RoomData[];
}

/** Colors read from the page's CSS variables, so the panels follow the theme. */
export interface Palette {
  dark: boolean;
  ink: string;
  ink2: string;
  muted: string;
  line: string;
  tone: Record<Tone, { fg: string; dot: string; fill: string }>;
}

export function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const tone = (t: Tone) => ({ fg: v(`--${t}-fg`), dot: v(`--${t}-dot`), fill: v(`--${t}-fill`) });
  return {
    dark: document.documentElement.dataset['theme'] === 'dark',
    ink: v('--ink'),
    ink2: v('--ink-2'),
    muted: v('--muted'),
    line: v('--line-strong'),
    tone: { good: tone('good'), watch: tone('watch'), alert: tone('alert') },
  };
}

const SANS = 'Archivo, system-ui, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

/** Wait for the fonts the panels use, or canvas text falls back to the system font. */
export function loadFonts(): Promise<unknown> {
  if (!document.fonts) return Promise.resolve();
  return Promise.all([
    document.fonts.load(`600 72px ${SANS}`),
    document.fonts.load(`400 20px ${MONO}`),
    document.fonts.load(`500 96px ${MONO}`),
  ]).catch(() => undefined);
}

/** A frosted wash plus a soft highlight in the top-left, like light on glass. */
function wash(ctx: CanvasRenderingContext2D, w: number, h: number, r: number, p: Palette): void {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, r);
  ctx.clip();
  ctx.fillStyle = p.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.24)';
  ctx.fillRect(0, 0, w, h);
  const sheen = ctx.createLinearGradient(0, 0, w * 0.7, h);
  sheen.addColorStop(0, p.dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.5)');
  sheen.addColorStop(0.4, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // A bright rim, the way light catches the edge of a glass sheet.
  ctx.lineWidth = 4;
  ctx.strokeStyle = p.dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.roundRect(2, 2, w - 4, h - 4, r - 2);
  ctx.stroke();
}

function mono(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string): void {
  ctx.font = `400 ${size}px ${MONO}`;
  ctx.fillStyle = color;
  ctx.fillText(text.toUpperCase().split('').join(String.fromCharCode(8202)), x, y);
}

function status(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: { fg: string; dot: string }): void {
  const sq = size * 0.5;
  ctx.fillStyle = color.dot;
  ctx.fillRect(x, y - sq - size * 0.12, sq, sq);
  ctx.font = `600 ${size}px ${SANS}`;
  ctx.fillStyle = color.fg;
  ctx.fillText(text, x + sq + size * 0.45, y);
}

/** The flat panel: a miniature dashboard for the main room. 1024 × 704. */
export function drawDashboard(canvas: HTMLCanvasElement, d: SceneData, p: Palette): void {
  const w = (canvas.width = 1024);
  const h = (canvas.height = 704);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  wash(ctx, w, h, 112, p);
  ctx.textBaseline = 'alphabetic';

  mono(ctx, 'Dashboard', 64, 86, 22, p.muted);
  ctx.font = `700 30px ${SANS}`;
  ctx.fillStyle = p.ink;
  ctx.textAlign = 'right';
  ctx.fillText('Vane', w - 64, 88);
  ctx.textAlign = 'left';

  ctx.font = `600 78px ${SANS}`;
  ctx.fillStyle = p.ink;
  ctx.fillText(d.room, 60, 186);
  ctx.font = `400 28px ${SANS}`;
  ctx.fillStyle = p.ink2;
  ctx.fillText(d.sub, 64, 234);

  if (d.verdictTone) {
    ctx.textAlign = 'right';
    ctx.font = `600 70px ${SANS}`;
    ctx.fillStyle = p.tone[d.verdictTone].fg;
    ctx.fillText(d.verdict, w - 64, 186);
    ctx.textAlign = 'left';
  }

  const gap = 20;
  const tw = (w - 128 - gap * 3) / 4;
  const ty = 280;
  const th = h - ty - 56;
  d.tiles.slice(0, 4).forEach((t, i) => {
    const x = 64 + i * (tw + gap);
    ctx.fillStyle = p.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.roundRect(x, ty, tw, th, 40);
    ctx.fill();
    mono(ctx, t.label, x + 24, ty + 56, 18, p.muted);
    ctx.font = `500 60px ${SANS}`;
    ctx.fillStyle = p.ink;
    ctx.fillText(t.value, x + 22, ty + 150);
    const vw = ctx.measureText(t.value).width;
    ctx.font = `400 20px ${MONO}`;
    ctx.fillStyle = p.muted;
    ctx.fillText(t.unit, x + 30 + vw, ty + 150);
    status(ctx, t.status, x + 24, ty + 206, 24, p.tone[t.tone]);
    ctx.fillStyle = p.tone[t.tone].fill;
    ctx.beginPath();
    ctx.roundRect(x + 24, ty + th - 52, tw - 48, 12, 6);
    ctx.fill();
  });
}

/** The curved panel: the list of rooms. 1400 × 560. */
export function drawRooms(canvas: HTMLCanvasElement, d: SceneData, p: Palette): void {
  const w = (canvas.width = 1400);
  const h = (canvas.height = 560);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  wash(ctx, w, h, 112, p);

  ctx.font = `600 54px ${SANS}`;
  ctx.fillStyle = p.ink;
  ctx.fillText('Monitors', 64, 96);
  ctx.textAlign = 'right';
  mono(ctx, `${d.rooms.length} rooms`, w - 64, 92, 22, p.muted);
  ctx.textAlign = 'left';

  const rowH = (h - 150) / Math.max(4, d.rooms.length);
  d.rooms.slice(0, 4).forEach((r, i) => {
    const y = 140 + i * rowH;
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, y);
    ctx.lineTo(w - 64, y);
    ctx.stroke();

    ctx.font = `600 36px ${SANS}`;
    ctx.fillStyle = p.ink;
    ctx.fillText(r.name, 64, y + rowH * 0.62);
    if (r.tone) status(ctx, r.label, 470, y + rowH * 0.6, 28, p.tone[r.tone]);
    else status(ctx, r.label, 470, y + rowH * 0.6, 28, { fg: p.muted, dot: p.line });

    const bx = 760;
    const bw = w - 64 - bx;
    const n = Math.max(1, r.tones.length);
    const seg = (bw - (n - 1) * 8) / n;
    r.tones.forEach((t, k) => {
      ctx.fillStyle = p.tone[t].fill;
      ctx.beginPath();
      ctx.roundRect(bx + k * (seg + 8), y + rowH * 0.42, seg, 14, 7);
      ctx.fill();
    });
    if (!r.tones.length) {
      ctx.fillStyle = p.line;
      ctx.fillRect(bx, y + rowH * 0.42 + 6, bw, 2);
    }
  });
}

/** The device's LED screen, showing one reading. 512 × 400. */
export function drawScreen(canvas: HTMLCanvasElement, room: string, t: TileData | undefined, tones: Tone[], active: number, p: Palette): void {
  const w = (canvas.width = 512);
  const h = (canvas.height = 400);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const led = '#c8f0d6';
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 44);
  ctx.clip();
  ctx.fillStyle = '#0b100e';
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.35, h * 0.55, 10, w * 0.35, h * 0.55, w * 0.7);
  glow.addColorStop(0, 'rgba(200,240,214,0.10)');
  glow.addColorStop(1, 'rgba(200,240,214,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.shadowColor = 'rgba(200,240,214,0.55)';
  ctx.shadowBlur = 14;
  ctx.globalAlpha = 0.6;
  mono(ctx, room, 40, 62, 22, led);
  ctx.globalAlpha = 1;
  tones.forEach((tone, i) => {
    ctx.globalAlpha = i === active ? 1 : 0.4;
    ctx.fillStyle = p.tone[tone].dot;
    ctx.fillRect(w - 40 - (tones.length - i) * 30, 50, 22, 8);
  });
  ctx.globalAlpha = 1;
  if (!t) return;
  ctx.globalAlpha = 0.8;
  mono(ctx, t.label, 40, 150, 28, led);
  ctx.globalAlpha = 1;
  ctx.font = `500 128px ${MONO}`;
  ctx.fillStyle = led;
  ctx.fillText(t.value, 34, 280);
  const vw = ctx.measureText(t.value).width;
  ctx.font = `400 34px ${MONO}`;
  ctx.globalAlpha = 0.75;
  ctx.fillText(t.unit, 52 + vw, 280);
  ctx.font = `400 28px ${MONO}`;
  ctx.fillText(t.status, 40, 340);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}
