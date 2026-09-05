import type { DisplayCell } from "../types";
import { COLS, CELL_W, LINE_H, FONT_SIZE } from "../constants";

/**
 * Draws the resolved (colored) grid onto an off-screen canvas at a
 * given supersampling scale, so the exported PNG looks crisp even
 * though the on-screen render is small. This is independent of the
 * UI zoom — export quality shouldn't depend on what zoom % the user
 * happened to leave the slider at.
 */
export function renderGridToCanvas(
  coloredGrid: DisplayCell[][],
  exportScale = 2
): HTMLCanvasElement {
  const rows = coloredGrid.length;
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL_W * exportScale;
  canvas.height = rows * LINE_H * exportScale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Fixed black background, matching the on-screen render.
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${FONT_SIZE * exportScale}px "JetBrains Mono", "Fira Code", ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  coloredGrid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell.char === " " || cell.color === "transparent") return;
      ctx.fillStyle = cell.color;
      const cx = x * CELL_W * exportScale + (CELL_W * exportScale) / 2;
      const cy = y * LINE_H * exportScale + (LINE_H * exportScale) / 2;
      ctx.fillText(cell.char, cx, cy);
    });
  });

  return canvas;
}

export function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string
): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
