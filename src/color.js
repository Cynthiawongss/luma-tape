// OKLCH helpers after Björn Ottosson's OKLab (public domain). Channels are 0–1, hue in radians.
const lin = c => (c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
const gam = c => (c <= .0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - .055);

export function hexToOklch(hex) {
  const n = parseInt(hex.slice(1), 16), r = lin((n >> 16 & 255) / 255), g = lin((n >> 8 & 255) / 255), b = lin((n & 255) / 255);
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  const L = .2104542553 * l + .793617785 * m - .0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, B = .0259040371 * l + .7827717662 * m - .808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}

function toRgb(L, C, h) {
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, s = (L - .0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s];
}

export function oklchToHex([L, C, h]) {
  // Outside sRGB, give up chroma rather than clipping channels, so the hue stays true.
  let rgb = toRgb(L, C, h);
  for (let i = 0; i < 24 && rgb.some(v => v < -.0005 || v > 1.0005); i++) { C *= .9; rgb = toRgb(L, C, h); }
  return '#' + rgb.map(v => Math.round(gam(Math.min(1, Math.max(0, v))) * 255).toString(16).padStart(2, '0')).join('');
}

/** From one base colour: a deeper, slightly cooler print colour and a pale warm accent that stay readable on it. */
export function harmonize(base) {
  const [L, C, h] = hexToOklch(base);
  const deep = oklchToHex([Math.max(.28, L - .3), Math.min(.2, C * 1.15 + .02), h - .17]);
  const accent = oklchToHex([Math.min(.97, Math.max(.9, L + .18)), .07, h + 2.6]);
  return [base, deep, accent];
}
