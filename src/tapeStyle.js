// Old saved bead designs now open as ordinary opaque tape.
export function normalizeTapeStyle(style) {
  return style === 'world' ? 'world' : 'paper';
}

export function tapeMaterialSettings(style, density = .35, exporting = false) {
  const paper = normalizeTapeStyle(style) === 'paper';
  const amount = Math.max(0, Math.min(1, density));
  return {
    transmission: paper || exporting ? 0 : 1,
    transparent: !paper && exporting,
    opacity: !paper && exporting ? .38 + amount * .32 : 1,
    depthWrite: paper || !exporting,
    roughness: paper ? .96 : .007,
    clearcoat: paper ? 0 : .65,
    clearcoatRoughness: paper ? .55 : .018,
    envMapIntensity: paper ? .08 : 1,
    specularIntensity: paper ? .12 : 1,
    iridescence: paper ? 0 : .025,
    thickness: paper ? .009 : .012 + amount * .075,
  };
}
