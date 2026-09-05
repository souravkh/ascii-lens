function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Full-color mode: uses the region's actual sampled color, boosted so
 * it pops against black, with extra lightening for already-bright
 * pixels so highlights read as distinctly light rather than just
 * "less dark".
 */
export function colorRgb(r: number, g: number, b: number): string {
  const boost = 1.35;
  let br = r * boost;
  let bg = g * boost;
  let bb = b * boost;

  const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;

  if (lightness > 0.45) {
    const extra = (lightness - 0.45) * 2 * 140; // 0 at mid, up to ~140 at max
    br += extra;
    bg += extra;
    bb += extra;
  }

  br = clamp(Math.round(br), 0, 255);
  bg = clamp(Math.round(bg), 0, 255);
  bb = clamp(Math.round(bb), 0, 255);

  // Floor very dark colors slightly so they don't vanish into the
  // black background entirely.
  if (lightness < 0.12) {
    return `rgb(${Math.max(br, 40)}, ${Math.max(bg, 40)}, ${Math.max(bb, 40)})`;
  }
  return `rgb(${br}, ${bg}, ${bb})`;
}

/**
 * Black & white mode: maps brightness to a grey value. Floored so
 * dark areas stay visible as dim grey, and pushed harder toward pure
 * white at the top end so bright regions read as properly white.
 */
export function colorGrey(brightness: number): string {
  const t = brightness / 255;
  const v = clamp(Math.round(70 + Math.pow(t, 0.55) * 200), 0, 255);
  return `rgb(${v}, ${v}, ${v})`;
}
