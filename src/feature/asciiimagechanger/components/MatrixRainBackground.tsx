import { useEffect, useRef } from "react";

// Reusing the same density characters as the ASCII converter itself,
// plus digits/letters — ties the background thematically to what the
// app actually does.
const CHARS = "01.:-=+*#%@ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FONT_SIZE = 16;

const HIGHLIGHT_COLOR = "rgba(255, 255, 255, 0.9)";
const HIGHLIGHT_CHANCE = 0.06; // ~6% of characters flash bright white

// No fixed palette — a fresh random hue is generated for every single
// character, every frame. HSL is used (not RGB) because picking a
// random hue (0-360) while keeping saturation/lightness fixed always
// produces a vivid, readable color — random RGB values often come out
// muddy or too dark/light to read against black.
function randomColor(): string {
  if (Math.random() < HIGHLIGHT_CHANCE) return HIGHLIGHT_COLOR;
  const hue = Math.floor(Math.random() * 360);
  return `hsla(${hue}, 90%, 60%, 0.8)`;
}

/**
 * MatrixRainBackground
 * -------------------
 * Purely decorative, purely presentational — no props. Unlike
 * BackgroundEffect (pure CSS), this needs a canvas + animation loop
 * because each frame redraws falling characters and fades old ones —
 * that's not expressible with CSS alone.
 *
 * useEffect here does three jobs, all cleaned up on unmount:
 *  1. Set up the canvas size (and re-run on window resize)
 *  2. Start a requestAnimationFrame loop
 *  3. Cancel that loop + remove the resize listener when the
 *     component unmounts, so it never leaks a running animation
 */
export function MatrixRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let columns = 0;
    let drops: number[] = [];
    let animationId: number;

    function setup() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      columns = Math.floor(canvas!.width / FONT_SIZE);
      // Stagger starting positions above the screen so the rain
      // doesn't all start in sync on load.
      drops = new Array(columns).fill(0).map(() => Math.random() * -100);
    }

    function draw() {
      // Translucent black rect over the whole canvas each frame:
      // this is what creates the fading trail behind each character
      // (previous frames aren't fully erased, just dimmed).
      ctx!.fillStyle = "rgba(0, 0, 0, 0.075)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      ctx!.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        ctx!.fillStyle = randomColor();
        ctx!.fillText(char, x, y);

        // Once a column's drop passes the bottom, randomly reset it
        // back above the screen so columns don't all loop in sync.
        if (y > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    }

    setup();
    window.addEventListener("resize", setup);
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", setup);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}