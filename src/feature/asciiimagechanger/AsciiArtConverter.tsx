import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useAsciiConverter } from "./useAsciiConverter";
import { toDisplayGrid, gridToText, downloadTextFile } from "./gridUtils";
import { renderGridToCanvas, downloadCanvasAsPng } from "./exportUtils";
import { Controls } from "./Controls";
import { AsciiCanvas } from "./AsciiCanvas";
import type { ColorMode } from "./types";

const mutedText = "#a3a3a3";

/**
 * Container component. It owns two kinds of state:
 *  1. Delegated to useAsciiConverter — the actual conversion logic
 *     (grid, isProcessing, error, fileName). This is "business logic".
 *  2. Local UI-only state — zoom and colorMode. These don't need a
 *     hook of their own because nothing about them is reusable or
 *     complex; they're just view preferences.
 *
 * Everything below this component is presentational and stateless.
 */
export default function AsciiArtConverter() {
  const { grid, fileName, isProcessing, error, processImage } =
    useAsciiConverter();

  const [zoom, setZoom] = useState(37);
  const [colorMode, setColorMode] = useState<ColorMode>("color");
  const fileInputRef = useRef<HTMLInputElement>(null!);

  // Expensive-ish (loops over every cell) but only reruns when the
  // grid or color mode actually change — not on every zoom tick.
  const coloredGrid = useMemo(
    () => toDisplayGrid(grid, colorMode),
    [grid, colorMode]
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setZoom(37);
    processImage(file);
  };

  const handleDownloadText = () => {
    const text = gridToText(grid);
    const name = `${fileName.replace(/\.[^/.]+$/, "") || "ascii-art"}.txt`;
    downloadTextFile(text, name);
  };

  const handleDownloadPng = () => {
    const canvas = renderGridToCanvas(coloredGrid, 2); // 2x supersampled
    const name = `${fileName.replace(/\.[^/.]+$/, "") || "ascii-art"}.png`;
    downloadCanvasAsPng(canvas, name);
  };

  return (
    <div
      style={{
        minHeight: "100%",
        width: "100%",
        background: "#000000",
        color: "#f5f5f5",
        fontFamily:
          "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        padding: "32px 20px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 980 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
          Image → ASCII
        </h1>
        <p style={{ fontSize: 13, color: mutedText, margin: "6px 0 0" }}>
          Upload a picture, pick color or black & white, then use the slider to zoom.
        </p>
      </div>

      <Controls
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        zoom={zoom}
        onZoomChange={setZoom}
        hasGrid={grid.length > 0}
        fileName={fileName}
        onDownloadText={handleDownloadText}
        onDownloadPng={handleDownloadPng}
      />

      <AsciiCanvas
        coloredGrid={coloredGrid}
        zoom={zoom}
        isProcessing={isProcessing}
        hasImage={grid.length > 0}
        error={error}
      />
    </div>
  );
}
