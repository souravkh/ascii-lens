import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useAsciiConverter } from "./useAsciiConverter";
import { toDisplayGrid, gridToText, downloadTextFile } from "./gridUtils";
import { Controls } from "./Controls";
import { AsciiCanvas } from "./AsciiCanvas";
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

  const handleDownload = () => {
    const text = gridToText(grid);
    const name = `${fileName.replace(/\.[^/.]+$/, "") || "ascii-art"}.txt`;
    downloadTextFile(text, name);
  };

  return (
    <main className="ascii-studio">
      <header className="studio-header">
        <div>
          <p className="eyebrow">ASCII LENS - PROFILE IMAGE</p>
          <h1>Turn a image into characters.</h1>
          <p className="studio-intro">
            A small, tactile workspace for translating pixels into expressive text.
          </p>
        </div>
        <div className="header-mark" aria-hidden="true">[ @#%*+=-. ]</div>
      </header>

      <Controls
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        zoom={zoom}
        onZoomChange={setZoom}
        hasGrid={grid.length > 0}
        fileName={fileName}
        onDownload={handleDownload}
      />

      <AsciiCanvas
        coloredGrid={coloredGrid}
        zoom={zoom}
        isProcessing={isProcessing}
        hasImage={grid.length > 0}
        error={error}
      />
      <footer className="studio-footer">
        <span>LOCAL PROCESSING</span>
        <span>100 COLUMNS / CHARACTER MAPPING</span>
      </footer>
    </main>
  );
}
