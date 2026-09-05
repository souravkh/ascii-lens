import type { Cell, DisplayCell, ColorMode } from "./types";
import { colorRgb, colorGrey } from "./colorUtils";

/**
 * Resolves raw Cell data into render-ready DisplayCell data for the
 * current color mode. Kept as a pure function (no hooks, no state) so
 * it's trivial to unit test and to memoize from the outside.
 */
export function toDisplayGrid(
  grid: Cell[][],
  colorMode: ColorMode
): DisplayCell[][] {
  return grid.map((row) =>
    row.map((cell) => ({
      char: cell.char,
      color: cell.isBlank
        ? "transparent"
        : colorMode === "color"
        ? colorRgb(cell.r, cell.g, cell.b)
        : colorGrey(cell.brightness),
    }))
  );
}

/** Flattens the character grid into plain text for download/export. */
export function gridToText(grid: Cell[][]): string {
  return grid.map((row) => row.map((c) => c.char).join("")).join("\n");
}

export function downloadTextFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
