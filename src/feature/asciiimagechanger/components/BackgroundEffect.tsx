/**
 * BackgroundEffect
 * -------------------
 * Purely decorative, purely presentational — no props, no state, no
 * logic. Sits behind the actual app content as an absolutely
 * positioned layer.
 *
 * Two layers:
 *  1. A static dot-grid pattern (CSS radial-gradient tiled via
 *     background-size) — gives the terminal/ascii feel.
 *  2. Two soft, drifting radial glows behind the grid, for visual
 *     life. Uses a <style> tag for @keyframes since inline style
 *     objects can't express animations.
 */
export function BackgroundEffect() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <style>{`
        @keyframes bg-glow-drift-a {
          0%   { transform: translate(0%, 0%) scale(1); }
          50%  { transform: translate(25%, 20%) scale(1.15); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes bg-glow-drift-b {
          0%   { transform: translate(0%, 0%) scale(1); }
          50%  { transform: translate(-20%, -25%) scale(1.1); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
      `}</style>

      {/* Soft moving glow, underneath the dot grid */}
      <div
        style={{
          position: "absolute",
          top: "-25%",
          left: "-25%",
          width: "75%",
          height: "75%",
          background:
            "radial-gradient(circle, rgba(90,130,255,0.28) 0%, rgba(90,130,255,0) 70%)",
          animation: "bg-glow-drift-a 12s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-20%",
          width: "65%",
          height: "65%",
          background:
            "radial-gradient(circle, rgba(255,90,130,0.22) 0%, rgba(255,90,130,0) 70%)",
          animation: "bg-glow-drift-b 15s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Dot grid, drawn on top of the glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Faint vignette so the grid fades near the edges instead of
          cutting off sharply */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 35%, #000000 100%)",
        }}
      />
    </div>
  );
}