import type { ChangeEvent, RefObject } from "react";
import type { ColorMode } from "./types";

interface ControlsProps {
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  hasGrid: boolean;
  fileName: string;
  onDownload: () => void;
}

/**
 * Purely presentational: every value it shows and every action it
 * triggers comes from props. It has no idea how conversion works,
 * how the grid is built, or what "zoom" does to the canvas — it just
 * reports user intent upward.
 */
export function Controls({
  fileInputRef,
  onFileChange,
  colorMode,
  onColorModeChange,
  zoom,
  onZoomChange,
  hasGrid,
  fileName,
  onDownload,
}: ControlsProps) {
  return (
    <section className="control-deck" aria-label="ASCII controls">
      <div className="control-row">
        <button
          className="upload-button"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="button-icon">+</span> Choose image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          style={{ display: "none" }}
        />

        <div className="mode-switch" role="group" aria-label="Color mode">
          {(["color", "bw"] as ColorMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onColorModeChange(mode)}
              className={colorMode === mode ? "mode-button active" : "mode-button"}
            >
              {mode === "color" ? "Color" : "Black & white"}
            </button>
          ))}
        </div>

        {hasGrid && (
          <button className="download-button" onClick={onDownload}>Export .txt <span>↗</span></button>
        )}

        {fileName && (
          <span className="file-name" title={fileName}>{fileName}</span>
        )}
      </div>

      {hasGrid && (
        <div className="zoom-control">
          <span className="control-label">ZOOM</span>
          <input
            type="range"
            min={1}
            max={300}
            step={1}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="zoom-range"
          />
          <span className="zoom-value">
            {zoom}%
          </span>
        </div>
      )}
    </section>
  );
}
