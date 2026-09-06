import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useAsciiConverter } from "./hooks/useAsciiConverter";
import { toDisplayGrid, gridToText, downloadTextFile } from "./utils/gridUtils";
import { renderGridToCanvas, downloadCanvasAsPng } from "./utils/exportUtils";
import { Controls } from "./components/Controls";
import { AsciiCanvas } from "./components/AsciiCanvas";
import { MatrixRainBackground } from "./components/MatrixRainBackground";
import type { ColorMode } from "./types";

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
      className="relative
      min-h-screen w-full bg-black text-white 
      p-[20px_80px] box-border flex flex-col item-center overflow-hidden gap-5"
      style={{
        fontFamily:
          "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      }}
    >
      <MatrixRainBackground />

      <div 
       className="relative z-10 w-full max-w-[980px]" >      
        <h1 
        className="font-bold text-[22px] border-spacing-0.5 m-0">
          Image → ASCII
        </h1>
        <p
          className="text-[13px] text-yellow-400 mr-[6px_0_0]">
          Upload a picture, pick a view mode, then use the slider to zoom.
        </p>
      </div>

      <div
     className="relative z-[1] w-full max-w-[980px] flex flex-col items-center gap-[20px]"
      >
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
    </div>
  );
}
