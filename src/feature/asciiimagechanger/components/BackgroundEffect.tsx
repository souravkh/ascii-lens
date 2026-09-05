/**
 * BackgroundEffect
 * -------------------
 * Purely decorative, purely presentational — no props, no state, no
 * logic. Sits behind the actual app content as an absolutely
 * positioned layer. Kept as its own component (rather than inline
 * styles on the root div) so it can be swapped out or removed later
 * without touching any conversion or UI logic.
 *
 * Two layers:
 *  1. A static dot-grid pattern (CSS radial-gradient tiled via
 *     background-size) — gives the terminal/ascii feel.
 *  2. A soft, slowly drifting radial glow behind the grid, purely for
 *     subtle visual life. Uses a <style> tag for @keyframes since
 *     inline style objects can't express animations.
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
        @keyframes bg-glow-drift {
          0%   { transform: translate(-10%, -10%); }
          50%  { transform: translate(10%, 15%); }
          100% { transform: translate(-10%, -10%); }
        }
      `}</style>

      {/* Soft moving glow, underneath the dot grid */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-20%",
          width: "70%",
          height: "70%",
          background:
            "radial-gradient(circle, rgba(80,120,255,0.10) 0%, rgba(80,120,255,0) 70%)",
          animation: "bg-glow-drift 22s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-15%",
          width: "60%",
          height: "60%",
          background:
            "radial-gradient(circle, rgba(255,90,120,0.08) 0%, rgba(255,90,120,0) 70%)",
          animation: "bg-glow-drift 28s ease-in-out infinite reverse",
        }}
      />

      {/* Dot grid, drawn on top of the glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Faint vignette so the grid fades near the edges instead of
          cutting off sharply */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, #000000 100%)",
        }}
      />
    </div>
  );
}
