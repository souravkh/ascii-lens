import { useCallback, useRef, useState } from "react";
import type { Cell } from "./types";
import { DENSITY, COLS, ASPECT_CORRECTION } from "./constants";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface UseAsciiConverterResult {
  grid: Cell[][];
  fileName: string;
  isProcessing: boolean;
  error: string;
  processImage: (file: File) => void;
}

/**
 * Encapsulates "how do I turn an image file into an ASCII grid" —
 * completely independent of how it's rendered or controlled. Because
 * the logic lives here rather than inside a component, it can be:
 *  - reused by a different UI (e.g. a CLI, a different layout)
 *  - unit tested by mocking File/Image/Canvas
 *  - reasoned about without touching any JSX
 */
export function useAsciiConverter(): UseAsciiConverterResult {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const processImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError("");
    setIsProcessing(true);
    setFileName(file.name);

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        try {
          const rows = Math.max(
            1,
            Math.round((img.height / img.width) * COLS * ASPECT_CORRECTION)
          );

          const canvas = canvasRef.current ?? document.createElement("canvas");
          canvasRef.current = canvas;
          canvas.width = COLS;
          canvas.height = rows;

          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas not supported");

          ctx.clearRect(0, 0, COLS, rows);
          ctx.drawImage(img, 0, 0, COLS, rows);

          const { data } = ctx.getImageData(0, 0, COLS, rows);
          const newGrid: Cell[][] = [];

          for (let y = 0; y < rows; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < COLS; x++) {
              const idx = (y * COLS + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const alpha = data[idx + 3];

              const brightness =
                (0.299 * r + 0.587 * g + 0.114 * b) * (alpha / 255);

              if (alpha < 16) {
                row.push({ char: " ", r, g, b, brightness, isBlank: true });
                continue;
              }

              const normalized = clamp(brightness / 255, 0, 1);
              const shadowLift = Math.max(0, (0.36 - normalized) * 0.8);
              const contrastBoost = Math.pow(
                clamp(normalized + shadowLift, 0, 1),
                0.82
              );

              const level = Math.min(
                DENSITY.length - 1,
                Math.floor(contrastBoost * (DENSITY.length - 1))
              );
              const char = DENSITY[level];

              row.push({ char, r, g, b, brightness, isBlank: char === " " });
            }
            newGrid.push(row);
          }

          setGrid(newGrid);
        } catch {
          setError("Something went wrong turning that image into ASCII art.");
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setError("Couldn't read that file as an image.");
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setError("Couldn't read that file.");
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  }, []);

  return { grid, fileName, isProcessing, error, processImage };
}
