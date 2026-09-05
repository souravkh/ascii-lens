export type ColorMode = "color" | "bw" | "spectrum";

/**
 * Raw sampled data for one grid cell. This is the "model" — it never
 * changes based on UI choices like color mode or zoom, only on which
 * image was uploaded.
 */
export interface Cell {
  char: string;
  r: number;
  g: number;
  b: number;
  brightness: number; // 0-255, perceived brightness
  isBlank: boolean;
}

/**
 * Resolved data ready to render — the "view model". Computed from a
 * Cell plus the current color mode.
 */
export interface DisplayCell {
  char: string;
  color: string;
}
