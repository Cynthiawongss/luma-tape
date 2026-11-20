import {motifFor, allThemes} from './catalog.js';

// The print lives in one long canvas that maps onto the tape's arc-length coordinate.
export const PATTERN_START = -6, PATTERN_SPAN = 12.8;
export const PATTERN_W = 4096, PATTERN_H = 512;

// Deterministic randomness, so a theme always prints the same tape.
function seeded(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) { h = Math.imul(h ^ text.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// The source illustrations carry a faint leftover matte around every motif.
// Remove it once, so prints have clean edges instead of a dirty halo.
const cleaned = new WeakMap();
export function cleanSprite(image) {
  if (cleaned.has(image)) return cleaned.get(image);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width; canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height), d = pixels.data;
  for (let i = 3; i < d.length; i += 4) {
    const t = Math.max(0, Math.min(1, (d[i] - 70) / 110));
    d[i] = Math.round(t * t * (3 - 2 * t) * 255);
  }
  ctx.putImageData(pixels, 0, 0);
  cleaned.set(image, canvas);
  return canvas;
}

// Poisson-disc sampling (Bridson): points no closer than `radius`, evenly covering the canvas.
function scatter(w, h, radius, rng, tries = 24) {
  const cell = radius / Math.SQRT2, gw = Math.ceil(w / cell), gh = Math.ceil(h / cell), grid = new Int32Array(gw * gh).fill(-1), points = [], active = [];
  const add = (x, y) => { grid[Math.floor(y / cell) * gw + Math.floor(x / cell)] = points.length; active.push(points.length); points.push([x, y]); };
  const free = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    for (let j = Math.max(0, gy - 2); j <= Math.min(gh - 1, gy + 2); j++) for (let i = Math.max(0, gx - 2); i <= Math.min(gw - 1, gx + 2); i++) {
      const q = grid[j * gw + i];
      if (q >= 0 && (points[q][0] - x) ** 2 + (points[q][1] - y) ** 2 < radius * radius) return false;
    }
    return true;
  };
  add(rng() * w, rng() * h);
  while (active.length) {
    const pick = Math.floor(rng() * active.length), [px, py] = points[active[pick]];
    let placed = false;
    for (let n = 0; n < tries && !placed; n++) {
      const angle = rng() * Math.PI * 2, distance = radius * (1 + rng()), x = px + Math.cos(angle) * distance, y = py + Math.sin(angle) * distance;
      if (free(x, y)) { add(x, y); placed = true; }
    }
    if (!placed) active.splice(pick, 1);
  }
  return points;
}

const rgba = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${alpha})`;
};

function wave(ctx, r, x, y, length, bend) {
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + length * .3, y + bend, x + length * .65, y - bend, x + length, y + (r() - .5) * bend);
  ctx.stroke();
}

// ---- Grounds: one quiet background language per family, drawn in the tape's own colours.
const grounds = {
  water(ctx, r, c, amount) {
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      ctx.strokeStyle = rgba(c[1], .10 + r() * .08); ctx.lineWidth = 16 + r() * 30;
      wave(ctx, r, r() * PATTERN_W - 300, r() * PATTERN_H, 500 + r() * 700, 46);
    }
    for (let i = 0; i < 150 * amount; i++) {
      ctx.strokeStyle = r() > .3 ? `rgba(255,255,255,${.45 + r() * .4})` : rgba(c[1], .3);
      ctx.lineWidth = 1.6 + r() * 3.2;
      wave(ctx, r, r() * PATTERN_W, r() * PATTERN_H, 70 + r() * 190, 14 + r() * 22);
    }
  },
  garden(ctx, r, c, amount) {
    for (let i = 0; i < 64 * amount; i++) {
      const x = r() * PATTERN_W, y = r() * PATTERN_H, len = 60 + r() * 80, turn = r() * Math.PI * 2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(turn);
      ctx.strokeStyle = rgba(c[1], .55); ctx.fillStyle = rgba(c[1], .42); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .5, -12, len, 0); ctx.stroke();
      for (let k = 1; k <= 5; k++) {
        const px = len * k / 5.5, side = k % 2 ? 1 : -1;
        ctx.beginPath(); ctx.ellipse(px, side * 9 - 5, 12, 5.5, side * .7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    for (let i = 0; i < 120 * amount; i++) { ctx.fillStyle = rgba(c[2], .85); ctx.beginPath(); ctx.arc(r() * PATTERN_W, r() * PATTERN_H, 2 + r() * 4, 0, 7); ctx.fill(); }
  },
  cosmic(ctx, r, c, amount) {
    for (let i = 0; i < 26 * amount; i++) {
      ctx.strokeStyle = rgba(c[1], .32); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(r() * PATTERN_W, r() * PATTERN_H, 90 + r() * 200, 26 + r() * 60, r() * 3, 0, Math.PI * 2); ctx.stroke();
    }
    for (let i = 0; i < 380 * amount; i++) { ctx.fillStyle = r() > .5 ? `rgba(255,255,255,${.5 + r() * .5})` : rgba(c[2], .9); ctx.beginPath(); ctx.arc(r() * PATTERN_W, r() * PATTERN_H, .8 + r() * 2.6, 0, 7); ctx.fill(); }
    for (let i = 0; i < 70 * amount; i++) {
      const x = r() * PATTERN_W, y = r() * PATTERN_H, s = 7 + r() * 15;
      ctx.fillStyle = rgba(c[2], .95); ctx.beginPath();
      ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill();
    }
  },
  mineral(ctx, r, c, amount) {
    for (let i = 0; i < 90 * amount; i++) {
      const x = r() * PATTERN_W, y = r() * PATTERN_H, s = 36 + r() * 90, a = r() * 6.3;
      ctx.fillStyle = r() > .5 ? rgba(c[1], .13 + r() * .12) : `rgba(255,255,255,${.22 + r() * .25})`;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) { const t = a + k * 1.57 + (r() - .5) * .7, d = s * (.45 + r() * .55); ctx.lineTo(x + Math.cos(t) * d, y + Math.sin(t) * d); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(c[1], .28); ctx.lineWidth = 1.2; ctx.stroke();
    }
  },
  ember(ctx, r, c, amount) {
    for (let i = 0; i < 80 * amount; i++) {
      const x = r() * PATTERN_W, y = r() * PATTERN_H, s = 16 + r() * 34;
      ctx.save(); ctx.translate(x, y); ctx.rotate((r() - .5) * .9);
      ctx.fillStyle = r() > .4 ? rgba(c[1], .26) : rgba(c[2], .6);
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s * .9, -s * .1, s * .5, s * .8, 0, s * .8); ctx.bezierCurveTo(-s * .5, s * .8, -s * .9, -s * .1, 0, -s); ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < 260 * amount; i++) { ctx.fillStyle = rgba(c[2], .9); ctx.beginPath(); ctx.arc(r() * PATTERN_W, r() * PATTERN_H, 1 + r() * 3.4, 0, 7); ctx.fill(); }
  },
  sand(ctx, r, c, amount) {
    ctx.lineCap = 'round';
    for (let i = 0; i < 46 * amount; i++) {
      ctx.strokeStyle = r() > .35 ? rgba(c[1], .2 + r() * .16) : 'rgba(255,255,255,.5)'; ctx.lineWidth = 2 + r() * 5;
      wave(ctx, r, r() * PATTERN_W - 200, r() * PATTERN_H, 400 + r() * 800, 36);
    }
    for (let i = 0; i < 500 * amount; i++) { ctx.fillStyle = rgba(c[1], .3); ctx.beginPath(); ctx.arc(r() * PATTERN_W, r() * PATTERN_H, .8 + r() * 1.8, 0, 7); ctx.fill(); }
  },
};

function lilyPad(ctx, r, x, y, size) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 6.3);
  const fill = ctx.createRadialGradient(-size * .2, -size * .2, size * .1, 0, 0, size);
  fill.addColorStop(0, '#6fc27a'); fill.addColorStop(1, '#2b8757');
  ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, size, .22, Math.PI * 2 - .22); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(214,240,190,.75)'; ctx.lineWidth = Math.max(1.2, size * .028);
  for (let k = 0; k < 9; k++) { const a = .5 + k * .66; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * size * .86, Math.sin(a) * size * .86); ctx.stroke(); }
  ctx.restore();
}
function lotus(ctx, r, x, y, size) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 6.3);
  for (const [count, reach, tone] of [[9, 1, '#ffc9d8'], [7, .68, '#ffe4ea'], [5, .4, '#fff6f4']]) {
    for (let k = 0; k < count; k++) {
      ctx.save(); ctx.rotate(k / count * Math.PI * 2 + reach);
      const petal = ctx.createLinearGradient(0, 0, size * reach, 0); petal.addColorStop(0, '#fffaf6'); petal.addColorStop(1, tone);
      ctx.fillStyle = petal; ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(size * reach * .55, -size * .24, size * reach, 0); ctx.quadraticCurveTo(size * reach * .55, size * .24, 0, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(214,112,146,.45)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
  }
  ctx.fillStyle = '#f6c443'; ctx.beginPath(); ctx.arc(0, 0, size * .13, 0, 7); ctx.fill();
  ctx.restore();
}
function flecks(ctx, r, c, amount) {
  for (let i = 0; i < 150 * amount; i++) {
    const x = r() * PATTERN_W, y = r() * PATTERN_H, s = 3 + r() * 7, a = r() * 6.3;
    ctx.fillStyle = r() > .25 ? rgba(c[2], .95) : 'rgba(255,255,255,.95)';
    ctx.beginPath();
    for (let k = 0; k < 5; k++) { const t = a + k * 1.257, d = s * (.5 + r() * .6); ctx.lineTo(x + Math.cos(t) * d, y + Math.sin(t) * d); }
    ctx.closePath(); ctx.fill();
  }
}

/**
 * Draws the whole print in a 4096 × 512 logical space. Covers, the flat preview,
 * the 3D roll and the exports all call this one function, so they cannot disagree.
 */
export function drawPattern(ctx, {atlas, koi, theme = 'stream', mode = 'water', colors, artImage = null, scale = 1, fill = .6, skipKoi = false, look = 'classic'}) {
  if (artImage) {
    const tile = PATTERN_H * artImage.width / artImage.height;
    for (let x = 0; x < PATTERN_W; x += tile) ctx.drawImage(artImage, x, 0, tile, PATTERN_H);
    return;
  }
  const motifs = motifFor(theme);
  if (!motifs.length) return;
  const classic = look === 'classic';
  // The graphic looks read best with fewer, larger shapes.
  if (!classic) scale *= 1.5;
  const r = seeded(theme), amount = (.35 + fill * .9) * (classic ? 1 : .7), hasKoi = motifs.includes(-1);
  const sheet = atlas ? cleanSprite(atlas) : null, fish = koi ? cleanSprite(koi) : null;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (classic) grounds[mode]?.(ctx, r, colors, amount);
  else if (look === 'dreamy') dreamGround(ctx, r, colors);

  const stamp = (id, x, y, size, turn, flip) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(turn);
    if (id === -1) { if (!skipKoi && fish) { if (flip) ctx.scale(-1, 1); ctx.drawImage(fish, -size * .72, -size * .36, size * 1.44, size * .72); } }
    else if (sheet) { const cell = sheet.width / 6; ctx.drawImage(sheet, (id % 6) * cell, Math.floor(id / 6) * cell, cell, cell, -size / 2, -size / 2, size, size); }
    ctx.restore();
  };

  // Heroes: two staggered rows (a half-drop), large enough to read on the roll.
  const heroes = [], pitch = 250 * scale * (1.3 - fill * .42);
  for (let i = 0, x = pitch * .4; x < PATTERN_W; i++, x += pitch) {
    const id = motifs[i % motifs.length], koiMotif = id === -1;
    heroes.push({id, x: x + (r() - .5) * 40, y: PATTERN_H * (i % 2 ? .71 : .29) + (r() - .5) * 70,
      size: (koiMotif ? 225 : 200) * scale * (.9 + r() * .35), turn: (r() - .5) * (koiMotif ? 1.5 : .6), flip: r() > .5});
  }
  // Secondary layer: evenly spread, so the tape has neither holes nor clumps.
  const spots = scatter(PATTERN_W, PATTERN_H, (hasKoi ? 215 : 190) / Math.sqrt(amount), r);
  if (hasKoi) {
    for (const [x, y] of spots) { if (r() < .7) lilyPad(ctx, r, x, y, (36 + r() * 50) * scale); else lotus(ctx, r, x, y, (42 + r() * 30) * scale); }
  } else {
    // Small echoes of the theme's own motifs fill the gaps between the large ones.
    for (const [x, y] of spots) {
      if (heroes.some(h => Math.hypot(h.x - x, h.y - y) < h.size * .5 + 34 * scale)) continue;
      stamp(motifs[Math.floor(r() * motifs.length)], x, y, (68 + r() * 50) * scale, (r() - .5) * 1.6, false);
    }
  }
  if (classic) flecks(ctx, r, colors, amount);
  for (const h of heroes) stamp(h.id, h.x, h.y, h.size, h.turn, h.flip);
  ctx.restore();
}

// ---- Looks: the same print, re-rendered in a contemporary graphic language.
function dreamGround(ctx, r, c) {
  for (let i = 0; i < 26; i++) {
    const x = r() * PATTERN_W, y = r() * PATTERN_H, radius = 150 + r() * 260, tone = [c[1], c[2], '#ffffff', c[1]][i % 4];
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, rgba(tone, .85)); glow.addColorStop(1, rgba(tone, 0));
    ctx.fillStyle = glow; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
}
const luminance = (d, i) => (d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722) / 255;
function shrink(canvas, cellW, cellH) {
  const small = document.createElement('canvas'); small.width = Math.ceil(canvas.width / cellW); small.height = Math.ceil(canvas.height / cellH);
  const ctx = small.getContext('2d', {willReadFrequently: true}); ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, small.width * cellW, small.height * cellH, 0, 0, small.width, small.height);
  return {small, data: ctx.getImageData(0, 0, small.width, small.height).data};
}
const looks = {
  // Soft focus + film grain: shapes dissolve into colour.
  dreamy(canvas, ctx, r, c) {
    const {small} = shrink(canvas, 14, 14), w = canvas.width, h = canvas.height;
    // Recolour everything through the tape's own palette (dark → accent → white), so no
    // illustration keeps its literal colours.
    const sctx = small.getContext('2d'), tinted = sctx.getImageData(0, 0, small.width, small.height), t = tinted.data;
    const lo = channels(c[1]), mid = channels(c[2]), hi = [255, 255, 255];
    for (let i = 0; i < t.length; i += 4) {
      if (!t[i + 3]) continue;
      const l = luminance(t, i), a = l < .55 ? lo : mid, b = l < .55 ? mid : hi, k = l < .55 ? l / .55 : (l - .55) / .45;
      t[i] = a[0] + (b[0] - a[0]) * k; t[i + 1] = a[1] + (b[1] - a[1]) * k; t[i + 2] = a[2] + (b[2] - a[2]) * k;
    }
    sctx.putImageData(tinted, 0, 0);
    ctx.clearRect(0, 0, w, h); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, small.width * 14, small.height * 14);
    const image = ctx.getImageData(0, 0, w, h), d = image.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (r() - .5) * 64;
      if (d[i + 3] < 8) { d[i] = d[i + 1] = d[i + 2] = n > 0 ? 255 : 0; d[i + 3] = Math.abs(n) * 1.5; }
      else { d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    }
    ctx.putImageData(image, 0, 0);
  },
  // Pixel cross-stitch: flat thread colours with a dark outline on an even-weave grid,
  // plus small hand-drawn pixel charms in the gaps.
  stitch(canvas, ctx, r, c) {
    const cell = 16, {small, data} = shrink(canvas, cell, cell), w = canvas.width, h = canvas.height, cols = small.width, rows = small.height;
    const tone = new Uint8Array(cols * rows);   // 0 empty, 1 outline, 2 dark thread, 3 mid, 4 light
    for (let k = 0; k < tone.length; k++) if (data[k * 4 + 3] > 110) { const l = luminance(data, k * 4); tone[k] = l < .45 ? 2 : l < .8 ? 3 : 4; }
    const filled = (i, j) => i >= 0 && j >= 0 && i < cols && j < rows && tone[j * cols + i] > 1;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (!tone[j * cols + i] && (filled(i - 1, j) || filled(i + 1, j) || filled(i, j - 1) || filled(i, j + 1))) tone[j * cols + i] = 1;
    for (let n = 0; n < cols / 9; n++) {
      const charm = charms[Math.floor(r() * charms.length)], i0 = Math.floor(r() * (cols - 10)), j0 = Math.floor(r() * (rows - charm.length)), shade = r() > .5 ? 3 : 4;
      let clear = true;
      for (let j = -1; j <= charm.length && clear; j++) for (let i = -1; i <= charm[0].length; i++) if (tone[(j0 + j) * cols + i0 + i]) { clear = false; break; }
      if (clear) charm.forEach((line, j) => { for (let i = 0; i < line.length; i++) if (line[i] === 'X') tone[(j0 + j) * cols + i0 + i] = shade; });
    }
    const light = mixHex(c[2], '#ffffff', .7), threads = [null, c[1], c[1], c[2], light];
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = rgba(c[1], .12);
    for (let x = 0; x <= w; x += cell) ctx.fillRect(x, 0, 1, h);
    for (let y = 0; y <= h; y += cell) ctx.fillRect(0, y, w, 1);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const t = tone[j * cols + i]; if (!t) continue;
      ctx.fillStyle = threads[t]; ctx.fillRect(i * cell + 1, j * cell + 1, cell - 1, cell - 1);
    }
  },
  // Symbol art: every shape is typeset from rows of one repeated letter, with small technical marks around it.
  symbol(canvas, ctx, r, c, word) {
    const cw = 17, ch = 24, {small, data} = shrink(canvas, cw, ch), w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.font = '700 25px ui-monospace, "SF Mono", Menlo, Consolas, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let j = 0; j < small.height; j++) for (let i = 0; i < small.width; i++) {
      const k = (j * small.width + i) * 4, x = i * cw + cw / 2, y = j * ch + ch / 2;
      if (data[k + 3] > 95) { ctx.fillStyle = c[1]; ctx.fillText(word[j % word.length], x, y); }
      else if (r() < .014) { ctx.fillStyle = c[2]; ctx.fillText('+x*'[Math.floor(r() * 3)], x, y); }
    }
    ctx.strokeStyle = c[2]; ctx.lineWidth = 3;
    for (let i = 0; i < w / 900; i++) { const x = r() * w, y = 40 + r() * (h - 220), s = 90 + r() * 120; ctx.strokeRect(x, y, s * 1.3, s); }
  },
};
const charms = [
  ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
  ['XX.....XX', 'XXX.X.XXX', 'XXXXXXXXX', 'XXX.X.XXX', 'XX.....XX'],
  ['..X..', '..X..', 'XXXXX', '..X..', '..X..'],
  ['X...X', '.X.X.', '..X..', '.X.X.', 'X...X'],
  ['..X..', '.XXX.', 'XXXXX', '.XXX.', '..X..'],
];
const channels = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
function mixHex(a, b, t) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), m = s => Math.round((x >> s & 255) * (1 - t) + (y >> s & 255) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}
export const LOOKS = ['dreamy', 'stitch', 'symbol', 'classic'];
function applyLook(canvas, {look, colors, theme, artImage}) {
  if (artImage || !looks[look]) return;
  const word = (allThemes.find(t => t.id === theme)?.en || theme).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'LUMA';
  looks[look](canvas, canvas.getContext('2d', {willReadFrequently: true}), seeded(theme + look), colors, word);
}

export function makePattern(atlas, koi, c, artImage) {
  const canvas = document.createElement('canvas'); canvas.width = PATTERN_W; canvas.height = PATTERN_H;
  const options = {atlas, koi, theme: c.theme, mode: c.mode, colors: c.colors, artImage: c.art ? artImage : null, scale: c.patternScale, fill: c.patternFill, skipKoi: c.skipKoi, look: c.patternLook};
  drawPattern(canvas.getContext('2d', {willReadFrequently: true}), options); applyLook(canvas, options);
  return {canvas};
}

/** Paints a flat piece of tape (base colour + print) into any 2D canvas region of the pattern. */
export function paintFlat(canvas, options, {from = 0, to = PATTERN_W, base} = {}) {
  // Render the region at print resolution first, so the look's grid matches the roll exactly.
  const piece = document.createElement('canvas'); piece.width = Math.round(to - from); piece.height = PATTERN_H;
  const p = piece.getContext('2d', {willReadFrequently: true});
  p.translate(-from, 0); drawPattern(p, options); p.setTransform(1, 0, 0, 1, 0, 0);
  applyLook(piece, options);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (base) { ctx.fillStyle = base; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(piece, 0, 0, canvas.width, canvas.height);
}
