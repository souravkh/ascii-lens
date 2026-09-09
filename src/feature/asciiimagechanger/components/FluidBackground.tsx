import { useEffect, useRef } from "react";

/**
 * FluidBackground
 * -------------------
 * A hand-written WebGL fluid simulation (Navier-Stokes solver via
 * ping-ponged framebuffers) that paints a colorful trail behind the
 * mouse. This replaces the earlier npm `webgl-fluid` package version
 * with a custom implementation ported from a similar effect, with
 * three bugs fixed along the way:
 *
 *  1. Attribute location for `aPosition` was hardcoded to 0 without
 *     ever calling gl.bindAttribLocation() before linking. WebGL does
 *     NOT guarantee attribute 0 is auto-assigned to the first
 *     attribute — some drivers assign differently, causing broken or
 *     blank rendering on certain browsers/GPUs. Fixed by explicitly
 *     binding location 0 to "aPosition" for every program, before
 *     gl.linkProgram() is called.
 *  2. Dissipation values (0.97 / 0.98 per frame, i.e. ~60 times a
 *     second) made the trail fade almost instantly. Raised closer to
 *     0.995 / 0.996 so the trail stays visible for a couple of
 *     seconds instead of a fraction of one.
 *  3. Shader compile/link failures were silently ignored, making any
 *     future GLSL typo very hard to debug. Added error logging via
 *     gl.getShaderInfoLog / gl.getProgramInfoLog.
 *
 * Sits at zIndex 0 as a decorative layer. The canvas itself stays
 * non-interactive so it never blocks the UI, while its pointer
 * listeners follow the whole window so the trail remains visible
 * across the full screen even when the content panel is on top.
 */

const BASE_VERT = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const COPY_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying vec2 vUv;
uniform sampler2D uTexture;
void main () {
  vec3 dye = texture2D(uTexture, vUv).rgb;
  float alpha = clamp(length(dye), 0.0, 1.0);
  gl_FragColor = vec4(dye, alpha);
}`;

const SPLAT_FRAG = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main () {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}`;

const ADVECTION_FRAG = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  gl_FragColor = dissipation * texture2D(uSource, coord);
  gl_FragColor.a = 1.0;
}`;

const DIVERGENCE_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const PRESSURE_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

const GRADIENT_SUBTRACT_FRAG = `
precision mediump float;
precision mediump sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  attach: (id: number) => number;
}

interface DoubleFBO {
  read: FBO;
  write: FBO;
  swap: () => void;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
  label: string
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // FIX (bug 3): surface compile errors instead of failing silently.
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`[FluidBackground] Shader compile error (${label}):`, gl.getShaderInfoLog(shader));
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertSrc: string,
  fragSrc: string,
  label: string
) {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc, `${label} vertex`);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc, `${label} fragment`);
  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);

  // FIX (bug 1): explicitly bind "aPosition" to attribute location 0
  // for every program, before linking. Without this, WebGL is free to
  // assign a different location per program/driver, which silently
  // breaks rendering (blank canvas or garbage geometry) on whichever
  // browsers/GPUs don't happen to default to 0.
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(`[FluidBackground] Program link error (${label}):`, gl.getProgramInfoLog(program));
  }

  const uniforms: Record<string, WebGLUniformLocation> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i)!;
    uniforms[info.name] = gl.getUniformLocation(program, info.name)!;
  }

  return { program, uniforms };
}

function createFBO(
  gl: WebGLRenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filtering: number
): FBO {
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    texture,
    fbo,
    width: w,
    height: h,
    attach(id: number) {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    },
  };
}

function createDoubleFBO(
  gl: WebGLRenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filtering: number
): DoubleFBO {
  let read = createFBO(gl, w, h, internalFormat, format, type, filtering);
  let write = createFBO(gl, w, h, internalFormat, format, type, filtering);
  return {
    get read() { return read; },
    get write() { return write; },
    swap() { [read, write] = [write, read]; },
  };
}

function HSVtoRGB(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    default: return [v, p, q];
  }
}

// FIX (bug 2): these were 0.97 / 0.98, applied ~60x/sec — the trail
// was down to ~16-30% strength after just one second. Values closer
// to 1 mean slower decay, so the trail reads as an actual trail
// rather than a quick-fading dot.
const VELOCITY_DISSIPATION = 0.995;
const DYE_DISSIPATION = 0.996;
const PRESSURE_ITERATIONS = 20;

export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
    }) as WebGLRenderingContext | null;
    if (!gl) return;

    gl.clearColor(0, 0, 0, 0);

    function resize() {
      canvas!.width = canvas!.clientWidth;
      canvas!.height = canvas!.clientHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const halfFloat = gl.getExtension("OES_texture_half_float");
    gl.getExtension("OES_texture_half_float_linear");
    const HALF = halfFloat ? halfFloat.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

    const copyProg = createProgram(gl, BASE_VERT, COPY_FRAG, "copy");
    const splatProg = createProgram(gl, BASE_VERT, SPLAT_FRAG, "splat");
    const advProg = createProgram(gl, BASE_VERT, ADVECTION_FRAG, "advection");
    const divProg = createProgram(gl, BASE_VERT, DIVERGENCE_FRAG, "divergence");
    const presProg = createProgram(gl, BASE_VERT, PRESSURE_FRAG, "pressure");
    const gradProg = createProgram(gl, BASE_VERT, GRADIENT_SUBTRACT_FRAG, "gradient-subtract");

    const SIM_RES = 128;
    const DYE_RES = 512;
    const texelSize = [1 / SIM_RES, 1 / SIM_RES];

    let velocity = createDoubleFBO(gl, SIM_RES, SIM_RES, gl.RGBA, gl.RGBA, HALF, gl.LINEAR);
    let dye = createDoubleFBO(gl, DYE_RES, DYE_RES, gl.RGBA, gl.RGBA, HALF, gl.LINEAR);
    const divergence = createFBO(gl, SIM_RES, SIM_RES, gl.RGBA, gl.RGBA, HALF, gl.NEAREST);
    let pressure = createDoubleFBO(gl, SIM_RES, SIM_RES, gl.RGBA, gl.RGBA, HALF, gl.NEAREST);

    function drawQuad(target: FBO | null) {
      if (target) {
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, target.fbo);
        gl!.viewport(0, 0, target.width, target.height);
      } else {
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
        gl!.viewport(0, 0, canvas!.width, canvas!.height);
      }
      gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);
      gl!.enableVertexAttribArray(0);
      gl!.drawArrays(gl!.TRIANGLE_FAN, 0, 4);
    }

    function splat(x: number, y: number, dx: number, dy: number, color: number[]) {
      const aspect = canvas!.width / canvas!.height;

      gl!.useProgram(splatProg.program);
      gl!.uniform1i(splatProg.uniforms.uTarget, velocity.read.attach(0));
      gl!.uniform1f(splatProg.uniforms.aspectRatio, aspect);
      gl!.uniform2f(splatProg.uniforms.point, x / canvas!.width, 1 - y / canvas!.height);
      gl!.uniform3f(splatProg.uniforms.color, dx, -dy, 0);
      gl!.uniform1f(splatProg.uniforms.radius, 0.0015);
      drawQuad(velocity.write);
      velocity.swap();

      gl!.uniform1i(splatProg.uniforms.uTarget, dye.read.attach(0));
      gl!.uniform3f(splatProg.uniforms.color, color[0], color[1], color[2]);
      gl!.uniform1f(splatProg.uniforms.radius, 0.003);
      drawQuad(dye.write);
      dye.swap();
    }

    let lastX = 0;
    let lastY = 0;
    let colorHue = Math.random();

    function handleMove(x: number, y: number) {
      const rect = canvas!.getBoundingClientRect();
      const localX = x - rect.left;
      const localY = y - rect.top;
      const dx = localX - lastX;
      const dy = localY - lastY;

      colorHue = (colorHue + 0.01) % 1;
      const [r, g, b] = HSVtoRGB(colorHue, 1, 1);

      splat(localX, localY, dx * 5, dy * 5, [r * 0.3, g * 0.3, b * 0.3]);
      lastX = localX;
      lastY = localY;
    }

    function onPointerMove(e: PointerEvent) {
      handleMove(e.clientX, e.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      if (!e.touches?.length) return;
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    let animId: number;
    const DT = 0.016;

    function step() {
      gl!.disable(gl!.BLEND);

      gl!.useProgram(advProg.program);
      gl!.uniform2fv(advProg.uniforms.texelSize, texelSize);
      gl!.uniform1i(advProg.uniforms.uVelocity, velocity.read.attach(0));
      gl!.uniform1i(advProg.uniforms.uSource, velocity.read.attach(0));
      gl!.uniform1f(advProg.uniforms.dt, DT);
      gl!.uniform1f(advProg.uniforms.dissipation, VELOCITY_DISSIPATION);
      drawQuad(velocity.write);
      velocity.swap();

      gl!.uniform1i(advProg.uniforms.uVelocity, velocity.read.attach(0));
      gl!.uniform1i(advProg.uniforms.uSource, dye.read.attach(1));
      gl!.uniform1f(advProg.uniforms.dissipation, DYE_DISSIPATION);
      drawQuad(dye.write);
      dye.swap();

      gl!.useProgram(divProg.program);
      gl!.uniform2fv(divProg.uniforms.texelSize, texelSize);
      gl!.uniform1i(divProg.uniforms.uVelocity, velocity.read.attach(0));
      drawQuad(divergence);

      gl!.useProgram(presProg.program);
      gl!.uniform2fv(presProg.uniforms.texelSize, texelSize);
      gl!.uniform1i(presProg.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        gl!.uniform1i(presProg.uniforms.uPressure, pressure.read.attach(1));
        drawQuad(pressure.write);
        pressure.swap();
      }

      gl!.useProgram(gradProg.program);
      gl!.uniform2fv(gradProg.uniforms.texelSize, texelSize);
      gl!.uniform1i(gradProg.uniforms.uPressure, pressure.read.attach(0));
      gl!.uniform1i(gradProg.uniforms.uVelocity, velocity.read.attach(1));
      drawQuad(velocity.write);
      velocity.swap();

      gl!.useProgram(copyProg.program);
      gl!.uniform1i(copyProg.uniforms.uTexture, dye.read.attach(0));
      drawQuad(null);

      animId = requestAnimationFrame(step);
    }

    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}