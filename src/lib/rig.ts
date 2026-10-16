/**
 * Mutable, non-React state shared between scroll triggers, the DOM and the
 * WebGL frame loop. Written by ScrollTriggers / pointer handlers, read every frame.
 */
export const rig = {
  /** Section progress, each 0..1 */
  hangar: 0,
  sky: 0,
  title: 0,
  blueprint: 0,
  systems: 0,
  /** 0..1 how much the catalog covers the screen */
  catalog: 0,

  /** WebGL scene has rendered its first frames */
  ready: false,
  /** Hangar lights, animated by the intro sequence */
  lights: 0,
  /** Exploded view amount, tweened */
  explode: 0,
  /** Camera blend into the exploded view */
  explodeCam: 0,
  /** World z of the blueprint scan line while exploding / reassembling */
  scanOverride: 21.5,

  /** Screen positions of the blueprint dimension labels */
  dims: { o: 0, ax: 0, ay: 0, bx: 0, by: 0, len: "", span: "" },

  pointer: { x: 0, y: 0, cx: 0, cy: 0, inside: false },
  orbit: { az: 0, el: 0, taz: 0, tel: 0, zoom: 1, tzoom: 1, shift: 0 },
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
