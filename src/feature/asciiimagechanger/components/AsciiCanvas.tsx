import type { DisplayCell } from "../types";
import { COLS, CELL_W, LINE_H, FONT_SIZE } from "../constants";

interface AsciiCanvasProps {
  coloredGrid: DisplayCell[][];
  zoom: number; // percent
  isProcessing: boolean;
  hasImage: boolean;
  error: string;
}

/**
 * Purely presentational: given resolved DisplayCells and a zoom
 * percentage, it draws them. It never touches raw pixel data, image
 * decoding, or color math — all of that already happened upstream.
 *
 * Zoom is applied as a CSS transform (GPU repaint) rather than by
 * recalculating every cell's font-size/width, which is what keeps the
 * slider smooth regardless of how many cells are on screen.
 */
export function AsciiCanvas({
  coloredGrid,
  zoom,
  isProcessing,
  hasImage,
  error,
}: AsciiCanvasProps) {
  const scale = zoom / 100;
  const rows = coloredGrid.length;
  const baseWidth = COLS * CELL_W;
  const baseHeight = rows * LINE_H;

  return (
    <>
      {error && <div className="ascii-error" role="alert">{error}</div>}

      <div className={`ascii-canvas ${hasImage ? "has-image" : "is-empty"}`}>
        {isProcessing ? (
          <span className="canvas-message">Converting image...</span>
        ) : !hasImage ? (
          <div className="empty-canvas">
            <span className="empty-glyph">+-----+<br />| @#% |<br />+-----+</span>
            <strong>Your canvas is waiting</strong>
            <span>Choose an image above to begin rendering.</span>
          </div>
        ) : (
          <div style={{ width: baseWidth * scale, height: baseHeight * scale }}>
            <div
              style={{
                width: baseWidth,
                height: baseHeight,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <pre
                style={{
                  margin: 0,
                  lineHeight: `${LINE_H}px`,
                  fontSize: FONT_SIZE,
                  fontFamily: "inherit",
                  whiteSpace: "pre",
                  letterSpacing: 0,
                }}
              >
                {coloredGrid.map((row, y) => (
                  <div key={y} style={{ display: "flex" }}>
                    {row.map((cell, x) => (
                      <span
                        key={x}
                        style={{
                          color: cell.color,
                          width: `${CELL_W}px`,
                          display: "inline-block",
                          textAlign: "center",
                        }}
                      >
                        {cell.char}
                      </span>
                    ))}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
