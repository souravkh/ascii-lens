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
  onDownloadText: () => void;
  onDownloadPng: () => void;
}

const panelBorder = "#262626";
const mutedText = "#a3a3a3";

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
  onDownloadText,
  onDownloadPng,
}: ControlsProps) {
  return (
    <>
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: `1px solid ${panelBorder}`,
            background: "#171717",
            color: "inherit",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Choose image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          style={{ display: "none" }}
        />

        <div
          style={{
            display: "flex",
            border: `1px solid ${panelBorder}`,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {(["color", "bw", "spectrum"] as ColorMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onColorModeChange(mode)}
              style={{
                padding: "9px 14px",
                border: "none",
                background: colorMode === mode ? "#f5f5f5" : "transparent",
                color: colorMode === mode ? "#111111" : "inherit",
                fontSize: 13,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {mode === "color" ? "Color" : mode === "bw" ? "Black & white" : "Spectrum"}
            </button>
          ))}
        </div>

        {hasGrid && (
          <>
            <button
              onClick={onDownloadText}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                border: `1px solid ${panelBorder}`,
                background: "transparent",
                color: "inherit",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Download .txt
            </button>
            <button
              onClick={onDownloadPng}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                border: `1px solid ${panelBorder}`,
                background: "transparent",
                color: "inherit",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Download PNG
            </button>
          </>
        )}

        {fileName && (
          <span style={{ fontSize: 12, color: mutedText }}>{fileName}</span>
        )}
      </div>

      {hasGrid && (
        <div
          style={{
            width: "100%",
            maxWidth: 980,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 12, color: mutedText, whiteSpace: "nowrap" }}>
            Zoom
          </span>
          <input
            type="range"
            min={1}
            max={300}
            step={1}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            style={{ flex: 1, accentColor: "#f5f5f5" }}
          />
          <span
            style={{ fontSize: 12, color: mutedText, width: 44, textAlign: "right" }}
          >
            {zoom}%
          </span>
        </div>
      )}
    </>
  );
}
