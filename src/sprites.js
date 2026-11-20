import {assetUrl} from './assets';

/** Loads any image URL (asset path or data URL) and resolves once it can be drawn. */
export const loadImage = url => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('image failed to load'));
  image.src = url;
});

let pending;
/** The two illustration sheets every print is built from. Loaded once and shared. */
export function loadSprites() {
  pending ||= Promise.all([loadImage(assetUrl('theme-atlas-v1.png')), loadImage(assetUrl('koi.png'))]).then(([atlas, koi]) => ({atlas, koi}));
  return pending;
}
