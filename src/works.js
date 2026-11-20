import {normalizeTapeStyle} from './tapeStyle.js';

// One roll's editable design. Old saves lack the newer fields, so every read goes through here.
export const SESSION_KEY = 'luma-tape:studio:v1';
export const LEGACY_KEYS = ['tape-studio-v4', 'tape-world-v1'];
export const WORKS_KEY = 'luma-tape:works:v1';

const unit = (value, fallback) => (typeof value === 'number' && value >= 0 && value <= 1 ? value : fallback);
const isColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

export function normalizeDesign(raw, themes) {
  const theme = themes.find(t => t.id === raw?.theme);
  if (!theme) return null;
  const colors = Array.isArray(raw.colors) && raw.colors.length === 3 && raw.colors.every(isColor) ? raw.colors : theme.colors;
  return {
    theme: theme.id,
    colors,
    style: normalizeTapeStyle(raw.style),
    glitter: unit(raw.glitter, .85),
    density: unit(raw.density, .35),
    ripple: unit(raw.ripple, .48),
    scale: typeof raw.scale === 'number' && raw.scale >= .6 && raw.scale <= 1.4 ? raw.scale : 1,
    fill: unit(raw.fill, .6),
    // Saves from before the looks existed were watercolour prints.
    look: ['dreamy', 'stitch', 'symbol', 'classic'].includes(raw.look) ? raw.look : 'classic',
    art: typeof raw.art === 'string' && raw.art.startsWith('data:image/') ? raw.art : '',
  };
}

export function parseWorks(text, themes) {
  try {
    const list = JSON.parse(text || '[]');
    if (!Array.isArray(list)) return [];
    return list.flatMap(item => {
      const design = normalizeDesign(item?.design, themes);
      return design && typeof item.id === 'string' ? [{id: item.id, name: String(item.name || '未命名'), savedAt: Number(item.savedAt) || 0, thumb: typeof item.thumb === 'string' ? item.thumb : '', design}] : [];
    });
  } catch { return []; }
}

/** Updates the work with the same id, or adds a new one at the front. */
export function upsertWork(works, work) {
  return works.some(w => w.id === work.id) ? works.map(w => (w.id === work.id ? {...w, ...work} : w)) : [work, ...works];
}
