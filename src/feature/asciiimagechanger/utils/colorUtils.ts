function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function rgbToHue(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  if (delta === 0) return 0;

  let hue = 0;
  if (max === rn) hue = ((gn - bn) / delta) % 6;
  else if (max === gn) hue = (bn - rn) / delta + 2;
  else hue = (rn - gn) / delta + 4;

  return (hue * 60 + 360) % 360;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/**
 * Full-color mode: uses the region's actual sampled color, boosted so
 * it pops against black, with extra lightening for already-bright
 * pixels so highlights read as distinctly light rather than just
 * "less dark".
 */
export function colorRgb(r: number, g: number, b: number): string {
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const boost = luminance < 0.35 ? 1.9 : 1.45;

  let br = r * boost;
  let bg = g * boost;
  let bb = b * boost;

  if (luminance < 0.45) {
    const lift = (0.45 - luminance) * 190;
    br += lift;
    bg += lift;
    bb += lift;
  }

  if (luminance > 0.55) {
    const extra = (luminance - 0.55) * 170;
    br += extra;
    bg += extra;
    bb += extra;
  }

  br = clamp(Math.round(br), 0, 255);
  bg = clamp(Math.round(bg), 0, 255);
  bb = clamp(Math.round(bb), 0, 255);

  const darkFloor = 55 + (0.35 - Math.max(0, luminance)) * 140;
  return `rgb(${Math.max(br, darkFloor)}, ${Math.max(bg, darkFloor)}, ${Math.max(bb, darkFloor)})`;
}

export function colorSpectrum(
  r: number,
  g: number,
  b: number,
  x: number,
  y: number,
  totalCols: number,
  totalRows: number
): string {
  const brightness = (r + g + b) / 765;
  const luminance = clamp((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, 0, 1);

  const baseHue = rgbToHue(r, g, b);
  const posHue = ((x / Math.max(1, totalCols)) * 150 + (y / Math.max(1, totalRows)) * 110) % 360;
  const hue = (baseHue * 0.3 + posHue + 22) % 360;

  const sat = clamp(38 + brightness * 32, 36, 72);
  const light = clamp(28 + luminance * 46, 30, 68);

  const [rr, gg, bb] = hslToRgb(hue, sat, light);

  const darkFloor = 40 + (1 - luminance) * 42;
  return `rgb(${Math.max(rr, darkFloor)}, ${Math.max(gg, darkFloor)}, ${Math.max(bb, darkFloor)})`;
}

/**
 * Black & white mode: maps brightness to a grey value. Floored so
 * dark areas stay visible as dim grey, and pushed harder toward pure
 * white at the top end so bright regions read as properly white.
 */
export function colorGrey(brightness: number): string {
  const t = brightness / 255;
  const v = clamp(Math.round(45 + Math.pow(t, 0.6) * 215), 0, 255);
  return `rgb(${v}, ${v}, ${v})`;
}
