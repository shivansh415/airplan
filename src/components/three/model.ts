/**
 * Procedural, unbranded narrow-body airliner.
 *
 * Units are metres. Nose points to -Z, Y is up, the right wing is +X.
 * Every piece is its own geometry tagged with the catalog anchor it belongs to,
 * so the website can explode it, x-ray it and link it to spare parts.
 */
import * as THREE from "three";
import { mergeGeometries, mergeVertices, toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Anchor } from "@/data/parts";

export type Kind =
  | "fuselage"
  | "skin"
  | "belly"
  | "wing"
  | "seam"
  | "lip"
  | "chrome"
  | "titanium"
  | "metal"
  | "darkMetal"
  | "dark"
  | "glass"
  | "tyre"
  | "seat"
  | "fabric"
  | "carpet"
  | "cabin"
  | "tank"
  | "screen"
  | "red"
  | "green"
  | "white";

export type Pivot = "gearL" | "gearR" | "gearN";

export type Piece = {
  name: string;
  anchor: Anchor;
  kind: Kind;
  geometry: THREE.BufferGeometry;
  /** Custom blueprint lines (same local space as geometry). Falls back to EdgesGeometry. */
  lines?: THREE.BufferGeometry;
  /** Centre of the piece in model space. Geometry is stored relative to it. */
  origin: THREE.Vector3;
  explode: THREE.Vector3;
  internal: boolean;
  pivot?: Pivot;
  spin?: boolean;
  /** Gear doors: only shown while the gear is down. */
  gearDoor?: boolean;
};

export type AirlinerModel = {
  pieces: Piece[];
  pivots: Record<Pivot, THREE.Vector3>;
  bounds: Map<Anchor, THREE.Box3>;
};

export const DIMENSIONS = { length: 37.6, span: 36.4, height: 11.8 };

const V3 = THREE.Vector3;
const V2 = THREE.Vector2;
const TAU = Math.PI * 2;
const R = 1.98;
const NOSE = -18.8;
const TAIL = 18.8;
const NOSE_END = -12.5;
const TAIL_START = 6.5;
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/* ------------------------------------------------------------------ */
/* Fuselage                                                            */
/* ------------------------------------------------------------------ */

/** Cross-section at station z: centre height, vertical and horizontal half-size. */
export function section(z: number) {
  if (z < NOSE_END) {
    const t = clamp((z - NOSE) / (NOSE_END - NOSE), 0, 1);
    const tip = -0.55;
    const top = tip + (R - tip) * (1 - Math.pow(1 - t, 2.6));
    const bot = tip - (R + tip) * (1 - Math.pow(1 - t, 3.4));
    const hw = R * Math.pow(Math.max(0, 1 - Math.pow(1 - t, 2.3)), 0.55);
    return { cy: (top + bot) / 2, ry: (top - bot) / 2, hw };
  }
  if (z <= TAIL_START) return { cy: 0, ry: R, hw: R };
  const u = clamp((z - TAIL_START) / (TAIL - TAIL_START), 0, 1);
  const top = R - (R - 1.15) * Math.pow(u, 1.8);
  const bot = -R + (R + 0.62) * Math.pow(u, 1.2);
  const hw = R - (R - 0.3) * Math.pow(u, 1.5);
  return { cy: (top + bot) / 2, ry: (top - bot) / 2, hw };
}

/** Point on the skin. phi = 0 bottom, PI/2 right side, PI top, 3PI/2 left. */
export function skinPoint(z: number, phi: number, lift = 0, out = new V3()) {
  const s = section(z);
  return out.set((s.hw + lift) * Math.sin(phi), s.cy - (s.ry + lift) * Math.cos(phi), z);
}

/** phi on the right side for a given height. */
const phiAt = (z: number, y: number) => {
  const s = section(z);
  return Math.acos(clamp(-(y - s.cy) / s.ry, -1, 1));
};

function fuselageGrid(z0: number, z1: number) {
  const zs: number[] = [];
  let z = z0;
  while (z < z1 - 1e-4) {
    zs.push(z);
    z += z < -16.6 ? 0.1 : z < NOSE_END ? 0.2 : z < TAIL_START ? 0.6 : 0.28;
  }
  zs.push(z1);
  const SEG = 112;
  const W = SEG + 1;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const white = new THREE.Color("#f7f5f1");
  const belly = new THREE.Color("#c3c8cf");
  const c = new THREE.Color();
  const p = new V3();
  for (const zz of zs) {
    for (let k = 0; k <= SEG; k++) {
      const phi = (k / SEG) * TAU;
      skinPoint(zz, phi, 0, p);
      pos.push(p.x, p.y, p.z);
      const v = -Math.cos(phi);
      c.copy(white).lerp(belly, smoothstep(-0.2, -0.3, v));
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < zs.length - 1; i++) {
    for (let k = 0; k < SEG; k++) {
      const a = i * W + k;
      const b = a + 1;
      const d = a + W;
      const e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let i = 0; i < zs.length; i++) {
    const a = i * W;
    const b = a + SEG;
    const x = (n.getX(a) + n.getX(b)) / 2;
    const y = (n.getY(a) + n.getY(b)) / 2;
    const zz = (n.getZ(a) + n.getZ(b)) / 2;
    n.setXYZ(a, x, y, zz);
    n.setXYZ(b, x, y, zz);
  }

  const pts: number[] = [];
  const q = new V3();
  const ring = (zz: number) => {
    for (let k = 0; k < 72; k++) {
      skinPoint(zz, (k / 72) * TAU, 0, p);
      skinPoint(zz, ((k + 1) / 72) * TAU, 0, q);
      pts.push(p.x, p.y, p.z, q.x, q.y, q.z);
    }
  };
  ring(z0 + 0.001);
  ring(z1 - 0.001);
  for (let s = Math.ceil(z0 / 2.4) * 2.4; s < z1 - 0.5; s += 2.4) if (s > z0 + 0.5) ring(s);
  for (const phi of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 1.72, -1.72]) {
    const steps = Math.ceil((z1 - z0) / 0.25);
    for (let i = 0; i < steps; i++) {
      skinPoint(z0 + ((z1 - z0) * i) / steps, phi, 0, p);
      skinPoint(z0 + ((z1 - z0) * (i + 1)) / steps, phi, 0, q);
      pts.push(p.x, p.y, p.z, q.x, q.y, q.z);
    }
  }
  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return { g, lines };
}

/** Bilinear quad on the skin, corners as [z, phi]. */
function skinQuad(c: [number, number][], lift: number, nu = 10, nv = 10) {
  const pos: number[] = [];
  const idx: number[] = [];
  const p = new V3();
  for (let j = 0; j <= nv; j++) {
    const b = j / nv;
    for (let i = 0; i <= nu; i++) {
      const a = i / nu;
      const z = lerp(lerp(c[0][0], c[1][0], a), lerp(c[3][0], c[2][0], a), b);
      const phi = lerp(lerp(c[0][1], c[1][1], a), lerp(c[3][1], c[2][1], a), b);
      skinPoint(z, phi, lift, p);
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      idx.push(a, a + 1, a + nu + 1, a + 1, a + nu + 2, a + nu + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Rounded-rectangle outline sampled in (u, v); counts fixed so inner/outer match. */
function rrPath(w: number, h: number, r: number, nw: number, nh: number) {
  const pts: [number, number][] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  const x = w / 2 - r;
  const y = h / 2 - r;
  corner(x, -y, -Math.PI / 2);
  for (let i = 1; i < nh; i++) pts.push([w / 2, -y + (2 * y * i) / nh]);
  corner(x, y, 0);
  for (let i = 1; i < nw; i++) pts.push([x - (2 * x * i) / nw, h / 2]);
  corner(-x, y, Math.PI / 2);
  for (let i = 1; i < nh; i++) pts.push([-w / 2, y - (2 * y * i) / nh]);
  corner(-x, -y, Math.PI);
  for (let i = 1; i < nw; i++) pts.push([-x + (2 * x * i) / nw, -h / 2]);
  return pts;
}

/** Seam band around a rounded rectangle on the skin (door outlines). */
function skinSeam(zc: number, phic: number, w: number, h: number, r: number, band: number, lift: number) {
  const nw = Math.max(2, Math.ceil((w - 2 * r) / 0.06));
  const nh = Math.max(2, Math.ceil((h - 2 * r) / 0.06));
  const outer = rrPath(w, h, r, nw, nh);
  const inner = rrPath(w - 2 * band, h - 2 * band, Math.max(0.01, r - band), nw, nh);
  const hw = section(zc).hw;
  const pos: number[] = [];
  const idx: number[] = [];
  const p = new V3();
  const put = ([u, v]: [number, number]) => {
    skinPoint(zc + u, phic + v / hw, lift, p);
    pos.push(p.x, p.y, p.z);
  };
  outer.forEach(put);
  inner.forEach(put);
  const n = outer.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    idx.push(i, j, n + i, j, n + j, n + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Small flat shape (windows) wrapped onto the skin. */
function skinShape(shape: THREE.Shape, zc: number, phic: number, lift: number) {
  const g = new THREE.ShapeGeometry(shape, 4);
  const hw = section(zc).hw;
  const p = g.attributes.position;
  const v = new V3();
  for (let i = 0; i < p.count; i++) {
    skinPoint(zc + p.getX(i), phic + p.getY(i) / hw, lift, v);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/* ------------------------------------------------------------------ */
/* Lofted airfoil surfaces (wings, tail, pylons)                      */
/* ------------------------------------------------------------------ */

type Station = { le: THREE.Vector3; chord: number; tc: number; cdir: THREE.Vector3; tdir: THREE.Vector3; camber?: number };

function airfoil(s: number, tc: number, m = 0, p = 0.4): [number, number] {
  const yt = 5 * tc * (0.2969 * Math.sqrt(s) - 0.126 * s - 0.3516 * s * s + 0.2843 * s ** 3 - 0.1036 * s ** 4);
  const yc = m === 0 ? 0 : s < p ? (m / (p * p)) * (2 * p * s - s * s) : (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * s - s * s);
  return [yc + yt, yc - yt];
}

/**
 * Loft an airfoil between chord fractions f0..f1 through the given stations.
 * `sheet` turns it into a thin plate following the upper surface (spoilers).
 */
function loft(stations: Station[], f0 = 0, f1 = 1, n = 22, sheet?: [number, number]) {
  const ringPts = (st: Station) => {
    const up: THREE.Vector3[] = [];
    const lo: THREE.Vector3[] = [];
    for (let k = 0; k < n; k++) {
      const s = f0 + ((f1 - f0) * (1 - Math.cos((Math.PI * k) / (n - 1)))) / 2;
      const [u, l] = airfoil(s, st.tc, st.camber ?? 0);
      const base = st.le.clone().addScaledVector(st.cdir, s * st.chord);
      if (sheet) {
        up.push(base.clone().addScaledVector(st.tdir, u * st.chord + sheet[0]));
        lo.push(base.clone().addScaledVector(st.tdir, u * st.chord - sheet[1]));
      } else {
        up.push(base.clone().addScaledVector(st.tdir, u * st.chord));
        lo.push(base.clone().addScaledVector(st.tdir, l * st.chord));
      }
    }
    return [...up, ...lo.reverse()];
  };
  const rings = stations.map(ringPts);
  const M = rings[0].length;
  const pos: number[] = [];
  const idx: number[] = [];
  rings.forEach((r) => r.forEach((p) => pos.push(p.x, p.y, p.z)));
  for (let i = 0; i < rings.length - 1; i++)
    for (let k = 0; k < M; k++) {
      const a = i * M + k;
      const b = i * M + ((k + 1) % M);
      const c = a + M;
      const d = b + M;
      idx.push(a, c, b, b, c, d);
    }
  const cap = (ri: number, flip: boolean) => {
    const ctr = new V3();
    rings[ri].forEach((p) => ctr.add(p));
    ctr.multiplyScalar(1 / M);
    const ci = pos.length / 3;
    pos.push(ctr.x, ctr.y, ctr.z);
    for (let k = 0; k < M; k++) {
      const a = ri * M + k;
      const b = ri * M + ((k + 1) % M);
      if (flip) idx.push(ci, b, a);
      else idx.push(ci, a, b);
    }
  };
  cap(0, false);
  cap(rings.length - 1, true);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return toCreasedNormals(g, 0.55);
}

/* Wing planform */
const SPAN = 17;
const KINK = 6.3;
const LE = (x: number) => -3.5 + 0.512 * x;
const TE = (x: number) => (x < KINK ? 3.1 : 3.1 + 0.3364 * (x - KINK));
const DIHEDRAL = THREE.MathUtils.degToRad(5);
const WING_ROOT_Y = -1.15;
const wingY = (x: number) => WING_ROOT_Y + x * Math.tan(DIHEDRAL);

function wingStation(x: number, tcScale = 1): Station {
  const t = clamp(x / SPAN, 0, 1);
  const tw = THREE.MathUtils.degToRad(-3 * t);
  return {
    le: new V3(x, wingY(x), LE(x)),
    chord: TE(x) - LE(x),
    tc: lerp(0.15, 0.105, t) * tcScale,
    cdir: new V3(0, -Math.sin(tw), Math.cos(tw)),
    tdir: new V3(-Math.sin(DIHEDRAL), Math.cos(tw), Math.sin(tw)).normalize(),
    camber: 0.02,
  };
}

const spanStations = (x0: number, x1: number, tcScale = 1) => {
  const xs = [x0];
  if (x0 < KINK && x1 > KINK) xs.push(KINK);
  xs.push(x1);
  return xs.map((x) => wingStation(x, tcScale));
};

/* ------------------------------------------------------------------ */
/* Generic helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Merge geometries regardless of attribute differences (keeps position + normal).
 * Stays indexed when every input is indexed, which keeps rounded boxes ~4x lighter.
 */
function merge(list: THREE.BufferGeometry[]) {
  const indexed = list.every((g) => g.index);
  return mergeGeometries(
    list.map((g) => {
      const m = indexed ? g.clone() : g.index ? g.toNonIndexed() : g.clone();
      for (const k of Object.keys(m.attributes)) if (k !== "position" && k !== "normal") m.deleteAttribute(k);
      if (!m.attributes.normal) m.computeVertexNormals();
      return m;
    }),
  );
}

/** Dense pieces skip blueprint edge lines (they are unreadable at that density anyway). */
const NO_LINES = () => new THREE.BufferGeometry();

const RBOX_CACHE = new Map<string, THREE.BufferGeometry>();

function rbox(w: number, h: number, d: number, r: number, x: number, y: number, z: number, rx = 0, ry = 0) {
  const key = `${w}|${h}|${d}|${r}`;
  let tpl = RBOX_CACHE.get(key);
  if (!tpl) {
    const raw = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2));
    raw.deleteAttribute("uv");
    raw.deleteAttribute("normal");
    // RoundedBoxGeometry is non-indexed; welding it is ~6x fewer vertices.
    tpl = mergeVertices(raw, 1e-5);
    tpl.computeVertexNormals();
    RBOX_CACHE.set(key, tpl);
  }
  const g = tpl.clone();
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return g;
}

function cyl(r0: number, r1: number, h: number, axis: "x" | "y" | "z", x: number, y: number, z: number, seg = 28) {
  const g = new THREE.CylinderGeometry(r0, r1, h, seg);
  if (axis === "x") g.rotateZ(Math.PI / 2);
  if (axis === "z") g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

function cylinderBetween(a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 16) {
  const dir = new V3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), dir.normalize()));
  const mid = new V3().addVectors(a, b).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return g;
}

function tube(points: [number, number, number][], r: number, seg = 48) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new V3(...p)));
  return new THREE.TubeGeometry(curve, seg, r, 12, false);
}

function capsule(r: number, len: number, axis: "x" | "y" | "z", x: number, y: number, z: number) {
  const g = new THREE.CapsuleGeometry(r, len, 6, 20);
  if (axis === "x") g.rotateZ(Math.PI / 2);
  if (axis === "z") g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

/** Smooth lathe around Z from a few control points [radius, z]. */
function smoothLathe(ctrl: [number, number][], samples = 36, segs = 64) {
  const curve = new THREE.SplineCurve(ctrl.map(([r, z]) => new V2(r, z)));
  const pts = curve.getPoints(samples).map((p) => new V2(Math.max(p.x, 1e-4), p.y));
  const g = new THREE.LatheGeometry(pts, segs);
  g.rotateX(Math.PI / 2);
  return { g, pts };
}

/** Rings at a few profile points plus silhouette lines, for lathed parts. */
function latheLines(pts: THREE.Vector2[], rings = 4) {
  const out: number[] = [];
  const seg = 48;
  const step = Math.max(1, Math.floor((pts.length - 1) / rings));
  for (let i = 0; i < pts.length; i += step) {
    const r = pts[i].x;
    const z = pts[i].y;
    for (let k = 0; k < seg; k++) {
      const a0 = (k / seg) * TAU;
      const a1 = ((k + 1) / seg) * TAU;
      out.push(r * Math.sin(a0), -r * Math.cos(a0), z, r * Math.sin(a1), -r * Math.cos(a1), z);
    }
  }
  for (const phi of [0, Math.PI / 2, Math.PI, -Math.PI / 2])
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      out.push(a.x * Math.sin(phi), -a.x * Math.cos(phi), a.y, b.x * Math.sin(phi), -b.x * Math.cos(phi), b.y);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  return g;
}

/** Tyre: rounded cross-section lathed around the X axis. */
function tyre(rOuter: number, width: number, x: number, y: number, z: number) {
  const rc = rOuter - width * 0.36;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * TAU;
    const c = Math.cos(a);
    const s = Math.sin(a);
    pts.push(new V2(rc + width * 0.36 * Math.sign(c) * Math.pow(Math.abs(c), 0.45), (width / 2) * Math.sign(s) * Math.pow(Math.abs(s), 0.45)));
  }
  const g = new THREE.LatheGeometry(pts, 48);
  g.rotateZ(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

/** Wheel hub with dished face and bolt circle, on the X axis. */
function hub(r: number, width: number, x: number, y: number, z: number, side: 1 | -1) {
  const parts = [cyl(r, r, width * 0.98, "x", x, y, z, 32), cyl(r * 0.55, r * 0.7, 0.05, "x", x + side * width * 0.5, y, z, 24)];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    parts.push(cyl(0.022, 0.022, 0.06, "x", x + side * (width * 0.5 + 0.02), y + Math.cos(a) * r * 0.42, z + Math.sin(a) * r * 0.42, 8));
  }
  return merge(parts);
}

function mirrorX(g: THREE.BufferGeometry, lines = false) {
  const m = g.clone();
  m.scale(-1, 1, 1);
  if (lines) return m;
  if (m.index) {
    const a = m.index.array;
    for (let i = 0; i < a.length; i += 3) {
      const t = a[i + 1];
      a[i + 1] = a[i + 2];
      a[i + 2] = t;
    }
  } else {
    for (const name of Object.keys(m.attributes)) {
      const attr = m.attributes[name] as THREE.BufferAttribute;
      const s = attr.itemSize;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < attr.count; i += 3)
        for (let k = 0; k < s; k++) {
          const t = arr[(i + 1) * s + k];
          arr[(i + 1) * s + k] = arr[(i + 2) * s + k];
          arr[(i + 2) * s + k] = t;
        }
    }
  }
  return m;
}

/* ------------------------------------------------------------------ */
/* Builder                                                             */
/* ------------------------------------------------------------------ */

type AddOpts = {
  lines?: THREE.BufferGeometry;
  internal?: boolean;
  pivot?: Pivot;
  spin?: boolean;
  center?: THREE.Vector3;
  gearDoor?: boolean;
};

/** Number of yields in buildAirlinerSteps (for progress reporting). */
export const BUILD_STEPS = 19;

/** Build in one go (part pages). */
export function buildAirliner(): AirlinerModel {
  const gen = buildAirlinerSteps();
  let r = gen.next();
  while (!r.done) r = gen.next();
  return r.value;
}

/** Generator version: yields between sections so the page can keep animating. */
export function* buildAirlinerSteps(): Generator<void, AirlinerModel> {
  const pieces: Piece[] = [];

  const add = (name: string, anchor: Anchor, kind: Kind, geometry: THREE.BufferGeometry, explode: [number, number, number], opts: AddOpts = {}) => {
    geometry.computeBoundingBox();
    const c = opts.center ?? geometry.boundingBox!.getCenter(new V3());
    geometry.translate(-c.x, -c.y, -c.z);
    opts.lines?.translate(-c.x, -c.y, -c.z);
    pieces.push({
      name,
      anchor,
      kind,
      geometry,
      lines: opts.lines,
      origin: c,
      explode: new V3(...explode),
      internal: opts.internal ?? false,
      pivot: opts.pivot,
      spin: opts.spin,
      gearDoor: opts.gearDoor,
    });
  };

  /** Right-hand piece plus its mirrored left twin. */
  const addPair = (
    name: string,
    anchor: Anchor,
    kind: Kind,
    geometry: THREE.BufferGeometry,
    explode: [number, number, number],
    opts: Omit<AddOpts, "pivot"> & { pivot?: [Pivot, Pivot] } = {},
  ) => {
    const left = mirrorX(geometry);
    const leftLines = opts.lines ? mirrorX(opts.lines, true) : undefined;
    const leftCenter = opts.center ? new V3(-opts.center.x, opts.center.y, opts.center.z) : undefined;
    add(`${name} R`, anchor, kind, geometry, explode, { ...opts, pivot: opts.pivot?.[0] });
    add(`${name} L`, anchor, kind, left, [-explode[0], explode[1], explode[2]], {
      ...opts,
      lines: leftLines,
      center: leftCenter,
      pivot: opts.pivot?.[1],
    });
  };

  yield;
  /* ---------------- Fuselage ---------------- */
  const sections: [string, Anchor, number, number, [number, number, number]][] = [
    ["Radome", "radome", NOSE, -17.45, [0, 0, -7.5]],
    ["Forward fuselage", "fuselage", -17.45, -8, [0, 0, -3.4]],
    ["Centre fuselage", "fuselage", -8, 4, [0, 0, 0]],
    ["Aft fuselage", "fuselage", 4, 12, [0, 0, 3.4]],
    ["Tail cone", "fuselage", 12, TAIL, [0, 1.4, 7]],
  ];
  for (const [name, anchor, z0, z1, ex] of sections) {
    const { g, lines } = fuselageGrid(z0, z1);
    add(name, anchor, "fuselage", g, ex, { lines });
  }

  // Wing-to-body fairing
  {
    const { g } = smoothLathe(
      [
        [0.05, -5.6],
        [0.9, -4.6],
        [1.35, -2.6],
        [1.45, 0.2],
        [1.4, 3.2],
        [1.0, 5.4],
        [0.05, 7.2],
      ],
      40,
      48,
    );
    g.scale(1.55, 0.62, 1);
    g.translate(0, -1.45, 0);
    add("Belly fairing", "fuselage", "belly", g, [0, -3.2, 0]);
  }

  // APU exhaust
  {
    const s = section(TAIL);
    add("APU exhaust", "apu", "darkMetal", cyl(s.hw * 0.85, s.hw * 0.75, 0.25, "z", 0, s.cy, TAIL - 0.05, 24), [0, 1.4, 8]);
  }

  yield;
  /* ---------------- Cockpit glazing & cabin windows ---------------- */
  {
    const P = Math.PI;
    const panes: [number, number][][] = [
      [
        [-17.44, P - 0.04],
        [-17.3, P - 0.6],
        [-16.82, P - 0.64],
        [-16.9, P - 0.04],
      ],
      [
        [-17.26, P - 0.68],
        [-17.02, P - 1.1],
        [-16.6, P - 1.1],
        [-16.76, P - 0.7],
      ],
      [
        [-16.96, P - 1.17],
        [-16.84, P - 1.42],
        [-16.44, P - 1.4],
        [-16.56, P - 1.17],
      ],
    ];
    const geos: THREE.BufferGeometry[] = [];
    for (const q of panes) {
      geos.push(skinQuad(q, 0.012, 8, 8));
      geos.push(skinQuad(q.map(([z, p]) => [z, TAU - p] as [number, number]), 0.012, 8, 8));
    }
    add("Cockpit windshield", "cockpit", "glass", merge(geos), [0, 1.6, -8.4]);
  }
  {
    const right: THREE.BufferGeometry[] = [];
    for (let z = -11.3; z <= 9.9; z += 0.83) {
      if (z > -1.25 && z < 0.45) continue; // overwing exits
      right.push(skinShape(roundedRectShape(0.23, 0.34, 0.1), z, phiAt(z, 0.32), 0.006));
    }
    addPair("Cabin windows", "windows", "glass", merge(right), [2.4, 0, 0]);
  }

  yield;
  /* ---------------- Doors (panel + seam) ---------------- */
  {
    type Door = [string, number, number, 1 | -1, number, number, boolean, [number, number, number]];
    const doors: Door[] = [
      ["Forward passenger door", -12.7, 0.0, -1, 0.82, 1.85, false, [-3.4, 0, -2]],
      ["Aft passenger door", 8.2, 0.1, -1, 0.82, 1.85, false, [-3.4, 0, 2]],
      ["Forward service door", -12.7, 0.0, 1, 0.82, 1.85, false, [3.4, 0, -2]],
      ["Aft service door", 8.2, 0.1, 1, 0.82, 1.85, false, [3.4, 0, 2]],
      ["Overwing exit L1", -0.8, 0.28, -1, 0.5, 0.92, false, [-3.1, 0.4, 0]],
      ["Overwing exit L2", 0.0, 0.28, -1, 0.5, 0.92, false, [-3.1, 0.4, 0.4]],
      ["Overwing exit R1", -0.8, 0.28, 1, 0.5, 0.92, false, [3.1, 0.4, 0]],
      ["Overwing exit R2", 0.0, 0.28, 1, 0.5, 0.92, false, [3.1, 0.4, 0.4]],
      ["Forward cargo door", -7.2, -1.2, 1, 1.75, 1.25, true, [3.6, -1.8, 0]],
      ["Aft cargo door", 5.4, -1.2, 1, 1.75, 1.25, true, [3.6, -1.8, 0]],
    ];
    for (const [name, z, y, side, w, h, isBelly, ex] of doors) {
      const ph0 = phiAt(z, y);
      const ph = side > 0 ? ph0 : TAU - ph0;
      const hw = section(z).hw;
      const dph = h / hw / 2;
      const panel = skinQuad(
        [
          [z - w / 2, ph - dph],
          [z + w / 2, ph - dph],
          [z + w / 2, ph + dph],
          [z - w / 2, ph + dph],
        ],
        0.006,
        6,
        10,
      );
      const seam = skinSeam(z, ph, w, h, 0.14, 0.022, 0.011);
      panel.computeBoundingBox();
      const c = panel.boundingBox!.getCenter(new V3());
      add(name, "doors", isBelly ? "belly" : "skin", panel, ex, { center: c });
      add(`${name} seam`, "doors", "seam", seam, ex, { center: c.clone() });
      if (!isBelly && h > 1.5) {
        const up = side > 0 ? 1 : -1;
        add(`${name} window`, "doors", "glass", skinShape(roundedRectShape(0.18, 0.24, 0.08), z, ph + (up * 0.42) / hw, 0.014), ex, {
          center: c.clone(),
        });
      }
    }
  }

  yield;
  /* ---------------- Wings ---------------- */
  {
    const main = merge([
      loft(spanStations(0, 2.8), 0, 0.745),
      loft(spanStations(2.8, 16.4), 0.115, 0.745),
      loft(spanStations(16.4, SPAN), 0, 1),
      loft(spanStations(0, 1.9), 0.745, 1),
    ]);
    addPair("Wing", "wing", "wing", main, [4.8, 0, 0]);

    const tipY = wingY(SPAN);
    const shark = (theta: number, le: [number, number, number], chord: number): Station => {
      const th = THREE.MathUtils.degToRad(theta);
      return { le: new V3(...le), chord, tc: 0.09, cdir: new V3(0, 0, 1), tdir: new V3(-Math.sin(th), Math.cos(th), 0), camber: 0.01 };
    };
    const sharklet = loft([
      shark(0, [SPAN - 0.05, tipY, LE(SPAN) + 0.02], 1.48),
      shark(40, [SPAN + 0.32, tipY + 0.3, LE(SPAN) + 0.38], 1.18),
      shark(76, [SPAN + 0.55, tipY + 1.05, LE(SPAN) + 1.1], 0.82),
      shark(82, [SPAN + 0.68, tipY + 2.35, LE(SPAN) + 1.95], 0.42),
    ]);
    addPair("Sharklet", "wing", "wing", sharklet, [5.8, 1.2, 0.6]);

    const slats: [number, number][] = [
      [2.85, 6.3],
      [6.35, 11.2],
      [11.25, 16.35],
    ];
    slats.forEach(([a, b], i) => addPair(`Slat ${i + 1}`, "slats", "wing", loft(spanStations(a, b), 0, 0.108), [4.8 + i * 0.4, 0.7, -2.4]));

    const flaps: [number, number][] = [
      [1.95, 6.25],
      [6.35, 11.9],
    ];
    flaps.forEach(([a, b], i) => addPair(`Flap ${i + 1}`, "flaps", "wing", loft(spanStations(a, b), 0.752, 1), [4.8 + i * 0.4, -1, 2.8]));
    addPair("Aileron", "aileron", "wing", loft(spanStations(12.0, 16.35), 0.752, 1), [5.6, 0.3, 3]);

    const spoilers: [number, number][] = [
      [3.0, 6.25],
      [6.35, 8.9],
      [8.95, 11.85],
    ];
    spoilers.forEach(([a, b], i) =>
      addPair(`Spoiler ${i + 1}`, "spoilers", "wing", loft(spanStations(a, b), 0.58, 0.745, 10, [0.012, 0.012]), [4.8 + i * 0.4, 2, 0.6]),
    );

    const canoes: THREE.BufferGeometry[] = [];
    for (const x of [4.2, 7.4, 9.8, 12.2]) {
      const z0 = LE(x) + 0.55 * (TE(x) - LE(x));
      const { g } = smoothLathe(
        [
          [0.02, 0],
          [0.16, 0.5],
          [0.2, 1.4],
          [0.12, 2.6],
          [0.01, 3.3],
        ],
        20,
        20,
      );
      g.scale(0.9, 1.25, 1);
      g.translate(x, wingY(x) - 0.25, z0);
      canoes.push(g);
    }
    addPair("Flap track fairings", "flaps", "wing", merge(canoes), [4.8, -1.8, 2.4]);

    addPair("Wing fuel tank", "fuel", "tank", loft(spanStations(2.2, 13, 0.62), 0.18, 0.62, 14), [4.8, 3.6, 0], { internal: true });
    add("Centre fuel tank", "fuel", "tank", rbox(3.0, 0.6, 3.3, 0.2, 0, -1.3, 0.4), [0, 3.6, 0], { internal: true });
  }

  yield;
  /* ---------------- Engines ---------------- */
  {
    const EX = 5.8;
    const EY = -2.3;
    const EZ = -4.75;
    const engOff: [number, number, number] = [7, -3.6, 0];
    const ex = (x: number, y: number, z: number): [number, number, number] => [engOff[0] + x, engOff[1] + y, engOff[2] + z];
    const place = (g: THREE.BufferGeometry) => g.translate(EX, EY, EZ);

    const shells: [string, Kind, [number, number][], [number, number, number]][] = [
      [
        "Inlet lip",
        "lip",
        [
          [0.86, 0.34],
          [0.865, 0.12],
          [0.89, 0.025],
          [0.94, -0.004],
          [0.99, 0.025],
          [1.03, 0.12],
          [1.05, 0.34],
        ],
        ex(0, 0, -4.2),
      ],
      [
        "Inlet duct",
        "darkMetal",
        [
          [0.83, 0.98],
          [0.845, 0.65],
          [0.86, 0.34],
        ],
        ex(0, 0, -4.2),
      ],
      [
        "Engine inlet cowl",
        "skin",
        [
          [1.05, 0.34],
          [1.068, 0.66],
          [1.075, 0.98],
        ],
        ex(0, 0, -4.2),
      ],
      [
        "Fan cowl",
        "skin",
        [
          [1.075, 0.98],
          [1.085, 1.7],
          [1.075, 2.5],
        ],
        ex(0, 1.9, -0.8),
      ],
      [
        "Thrust reverser",
        "skin",
        [
          [1.075, 2.5],
          [1.05, 3.05],
          [0.96, 3.55],
          [0.88, 3.86],
        ],
        ex(0, 0, 1.6),
      ],
      [
        "Core cowl",
        "metal",
        [
          [0.72, 3.4],
          [0.69, 3.85],
          [0.6, 4.3],
          [0.5, 4.62],
        ],
        ex(0, 0, 3.1),
      ],
      [
        "Exhaust plug",
        "darkMetal",
        [
          [0.44, 4.45],
          [0.38, 4.9],
          [0.22, 5.3],
          [0.02, 5.52],
        ],
        ex(0, 0, 4.7),
      ],
    ];
    for (const [name, kind, ctrl, e] of shells) {
      const { g, pts } = smoothLathe(ctrl, 30, 72);
      place(g);
      const l = place(latheLines(pts, 3));
      addPair(name, "engine", kind, g, e, { lines: l });
    }

    // Fan: 30 wide-chord twisted blades + spinner
    const blades: number[] = [];
    const N = 30;
    for (let i = 0; i < N; i++) {
      const th = (i / N) * TAU;
      const er = new V3(Math.cos(th), Math.sin(th), 0);
      const et = new V3(-Math.sin(th), Math.cos(th), 0);
      const ez = new V3(0, 0, 1);
      const steps = 6;
      const edge = (k: number) => {
        const t = k / steps;
        const r = lerp(0.3, 0.82, t);
        const chord = lerp(0.2, 0.34, t);
        const beta = THREE.MathUtils.degToRad(lerp(62, 30, t));
        const cd = et.clone().multiplyScalar(Math.cos(beta)).addScaledVector(ez, Math.sin(beta));
        const c = er.clone().multiplyScalar(r);
        return [c.clone().addScaledVector(cd, -chord / 2), c.clone().addScaledVector(cd, chord / 2)];
      };
      for (let k = 0; k < steps; k++) {
        const [a0, b0] = edge(k);
        const [a1, b1] = edge(k + 1);
        blades.push(...a0.toArray(), ...b0.toArray(), ...a1.toArray(), ...b0.toArray(), ...b1.toArray(), ...a1.toArray());
      }
    }
    const bladeGeo = new THREE.BufferGeometry();
    bladeGeo.setAttribute("position", new THREE.Float32BufferAttribute(blades, 3));
    bladeGeo.computeVertexNormals();
    const { g: spinner } = smoothLathe(
      [
        [0.001, -0.42],
        [0.14, -0.3],
        [0.26, -0.08],
        [0.31, 0.12],
      ],
      24,
      40,
    );
    const fan = merge([bladeGeo, spinner, cyl(0.31, 0.31, 0.2, "z", 0, 0, 0.2, 40)]);
    fan.translate(EX, EY, EZ + 0.62);
    const fanL = mirrorX(fan);
    add("Fan R", "engine", "titanium", fan, ex(0, 0, -2.6), { spin: true, center: new V3(EX, EY, EZ + 0.62) });
    add("Fan L", "engine", "titanium", fanL, [-engOff[0], engOff[1], -2.6], { spin: true, center: new V3(-EX, EY, EZ + 0.62) });
    addPair("Fan face", "engine", "dark", cyl(0.83, 0.83, 0.02, "z", EX, EY, EZ + 0.9, 48), ex(0, 0, -2.3));

    const py = (y: number, le: number, chord: number): Station => ({
      le: new V3(EX, y, le),
      chord,
      tc: 0.1,
      cdir: new V3(0, 0, 1),
      tdir: new V3(1, 0, 0),
    });
    addPair("Pylon", "pylon", "skin", loft([py(-1.3, EZ + 1.2, 4.7), py(-1.02, EZ + 2.2, 4.3), py(-0.72, EZ + 3.4, 3.6)], 0, 1, 16), [6.2, -1.8, 0]);
  }

  yield;
  /* ---------------- Empennage ---------------- */
  {
    const HS = 6.3;
    const hm = THREE.MathUtils.degToRad(6);
    const hs = (x: number): Station => {
      const t = x / HS;
      return {
        le: new V3(x, 0.58 + x * Math.tan(hm), lerp(13.7, 17.0, t)),
        chord: lerp(3.8, 1.35, t),
        tc: lerp(0.11, 0.09, t),
        cdir: new V3(0, 0, 1),
        tdir: new V3(-Math.sin(hm), Math.cos(hm), 0),
      };
    };
    addPair("Horizontal stabiliser", "hstab", "wing", merge([loft([hs(0), hs(HS)], 0, 0.695), loft([hs(0), hs(0.8)], 0.7, 1)]), [3.4, 1.8, 6.6]);
    addPair("Elevator", "elevator", "wing", loft([hs(0.85), hs(HS - 0.05)], 0.705, 1), [4.0, 2.1, 8.4]);

    const VS = 6.2;
    const vs = (h: number): Station => {
      const t = h / VS;
      return {
        le: new V3(0, 1.45 + h, lerp(12.0, 16.75, t)),
        chord: lerp(5.7, 1.85, t),
        tc: lerp(0.11, 0.09, t),
        cdir: new V3(0, 0, 1),
        tdir: new V3(1, 0, 0),
      };
    };
    const fin = merge([loft([vs(0), vs(VS)], 0, 0.685), loft([vs(0), vs(0.3)], 0.69, 1), loft([vs(VS - 0.2), vs(VS)], 0.69, 1)]);
    const dorsal = loft(
      [
        { le: new V3(0, 1.62, 9.6), chord: 2.6, tc: 0.06, cdir: new V3(0, 0, 1), tdir: new V3(1, 0, 0) },
        { le: new V3(0, 2.5, 11.9), chord: 0.6, tc: 0.06, cdir: new V3(0, 0, 1), tdir: new V3(1, 0, 0) },
      ],
      0,
      1,
      12,
    );
    add("Vertical stabiliser", "vstab", "skin", merge([fin, dorsal]), [0, 4.6, 6.6]);
    add("Rudder", "rudder", "skin", loft([vs(0.32), vs(VS - 0.22)], 0.695, 1), [0, 5.2, 8.6]);
  }

  yield;
  /* ---------------- Landing gear ---------------- */
  const pivots: Record<Pivot, THREE.Vector3> = {
    gearR: new V3(3.4, -1.35, 2.3),
    gearL: new V3(-3.4, -1.35, 2.3),
    gearN: new V3(0, -1.6, -14.3),
  };
  {
    const GX = 3.4;
    const GZ = 2.3;
    const gEx = (x: number, y: number, z: number): [number, number, number] => [2.8 + x, -5.6 + y, z];
    const strut = merge([
      cyl(0.17, 0.17, 1.25, "y", GX, -1.95, GZ, 24),
      cyl(0.2, 0.2, 0.16, "y", GX, -2.55, GZ, 24),
      cylinderBetween(new V3(GX, -2.15, GZ), new V3(GX - 1.05, -1.72, GZ + 0.35), 0.07, 12),
      cylinderBetween(new V3(GX - 1.05, -1.72, GZ + 0.35), new V3(1.45, -1.2, GZ + 0.5), 0.07, 12),
      cyl(0.1, 0.1, 1.05, "x", GX, -3.42, GZ, 16),
    ]);
    addPair("Main gear strut", "main-gear", "metal", strut, gEx(0, 0, 0), { pivot: ["gearR", "gearL"] });
    const piston = merge([
      cyl(0.115, 0.115, 0.75, "y", GX, -2.95, GZ, 24),
      cylinderBetween(new V3(GX, -2.6, GZ - 0.16), new V3(GX, -2.92, GZ - 0.42), 0.035, 8),
      cylinderBetween(new V3(GX, -2.92, GZ - 0.42), new V3(GX, -3.22, GZ - 0.16), 0.035, 8),
    ]);
    addPair("Shock strut piston", "main-gear", "chrome", piston, gEx(0, -0.8, 0), { pivot: ["gearR", "gearL"] });
    addPair("Main gear door", "main-gear", "belly", rbox(0.05, 1.5, 0.95, 0.03, GX + 0.3, -2.1, GZ - 0.05), gEx(1.2, 0.6, 0), {
      pivot: ["gearR", "gearL"],
    });
    for (const dx of [-0.36, 0.36]) {
      const tag = dx < 0 ? "inner" : "outer";
      const side: 1 | -1 = dx < 0 ? -1 : 1;
      addPair(`Main tyre ${tag}`, "main-gear", "tyre", tyre(0.58, 0.34, GX + dx, -3.42, GZ), gEx(dx * 5, -0.8, 0), { pivot: ["gearR", "gearL"] });
      addPair(`Main wheel ${tag}`, "main-gear", "chrome", hub(0.33, 0.33, GX + dx, -3.42, GZ, side), gEx(dx * 3.4, -0.8, 0), {
        pivot: ["gearR", "gearL"],
      });
      addPair(`Carbon brake ${tag}`, "main-gear", "darkMetal", cyl(0.27, 0.27, 0.26, "x", GX + dx - side * 0.04, -3.42, GZ, 28), gEx(dx * 2, -0.8, 0), {
        pivot: ["gearR", "gearL"],
      });
    }

    const NZ = -14.3;
    const nStrut = merge([
      cyl(0.12, 0.12, 1.0, "y", 0, -2.1, NZ, 20),
      new THREE.TorusGeometry(0.16, 0.05, 10, 24).rotateX(Math.PI / 2).translate(0, -2.45, NZ),
      cyl(0.06, 0.06, 0.78, "x", 0, -3.57, NZ, 12),
    ]);
    add("Nose gear strut", "nose-gear", "metal", nStrut, [0, -5.2, -4.6], { pivot: "gearN" });
    add(
      "Nose gear piston",
      "nose-gear",
      "chrome",
      merge([
        cyl(0.085, 0.085, 0.75, "y", 0, -2.98, NZ, 16),
        cylinderBetween(new V3(0, -2.6, NZ + 0.12), new V3(0, -2.9, NZ + 0.32), 0.03, 8),
        cylinderBetween(new V3(0, -2.9, NZ + 0.32), new V3(0, -3.2, NZ + 0.12), 0.03, 8),
      ]),
      [0, -5.8, -4.6],
      { pivot: "gearN" },
    );
    for (const dx of [-0.25, 0.25]) {
      const tag = dx < 0 ? "L" : "R";
      const side: 1 | -1 = dx < 0 ? -1 : 1;
      add(`Nose tyre ${tag}`, "nose-gear", "tyre", tyre(0.39, 0.22, dx, -3.57, NZ), [dx * 6, -5.8, -4.6], { pivot: "gearN" });
      add(`Nose wheel ${tag}`, "nose-gear", "chrome", hub(0.21, 0.21, dx, -3.57, NZ, side), [dx * 4, -5.8, -4.6], { pivot: "gearN" });
    }
    add("Taxi light", "nose-gear", "white", new THREE.SphereGeometry(0.075, 14, 10).translate(0, -2.35, NZ - 0.15), [0, -5.2, -5.3], {
      pivot: "gearN",
    });
    for (const sx of [-1, 1]) {
      add(`Nose gear door ${sx < 0 ? "L" : "R"}`, "nose-gear", "belly", rbox(0.04, 0.75, 1.5, 0.02, sx * 0.42, -2.0, NZ + 0.1), [sx * 2, -4.4, -4.6], {
        gearDoor: true,
      });
    }
  }

  yield;
  /* ---------------- Lights ---------------- */
  {
    const tipY = wingY(SPAN);
    const dome = (r: number, flat = 0.55) => new THREE.SphereGeometry(r, 16, 10).scale(1, flat, 1);
    add("Navigation light green", "lights", "green", dome(0.07, 1).translate(SPAN + 0.02, tipY + 0.02, LE(SPAN) + 0.45), [5.8, 0, 0]);
    add("Navigation light red", "lights", "red", dome(0.07, 1).translate(-SPAN - 0.02, tipY + 0.02, LE(SPAN) + 0.45), [-5.8, 0, 0]);
    addPair("Strobe light", "lights", "white", dome(0.06, 1).translate(SPAN + 0.05, tipY + 0.02, TE(SPAN) - 0.15), [5.8, 0, 0]);
    add("Beacon upper", "lights", "red", dome(0.13).translate(0, R + 0.01, -1.2), [0, 1.6, 0]);
    add("Beacon lower", "lights", "red", dome(0.13).scale(1, -1, 1).translate(0, -2.03, 3.6), [0, -3.6, 0]);
    addPair("Landing light", "lights", "white", dome(0.11, 0.6).rotateX(Math.PI / 2).translate(2.3, wingY(2.3) - 0.12, LE(2.3) + 0.4), [4.8, -0.5, -0.6]);
    add("Tail strobe", "lights", "white", dome(0.06, 1).translate(0, section(TAIL).cy + 0.25, TAIL - 0.1), [0, 1.4, 8.2]);
    addPair("Logo light", "lights", "white", dome(0.06).translate(1.6, 0.85, 15.2), [3.4, 1.8, 6.6]);
  }

  yield;
  /* ---------------- Probes & antennas ---------------- */
  {
    const z = -15.6;
    const s = section(z);
    const pitot = merge([
      rbox(0.05, 0.16, 0.12, 0.02, s.hw + 0.02, 0.2, z),
      cylinderBetween(new V3(s.hw + 0.1, 0.2, z + 0.04), new V3(s.hw + 0.1, 0.2, z - 0.3), 0.022, 8),
      rbox(0.02, 0.07, 0.2, 0.01, s.hw + 0.03, -0.25, z + 0.55),
      cyl(0.04, 0.04, 0.01, "x", s.hw + 0.005, 0.0, z + 1.1, 12),
    ]);
    addPair("Pitot & AoA probes", "probes", "chrome", pitot, [2.8, 0.6, -6.8]);
    const blade = (y: number, z0: number, up: 1 | -1) =>
      loft(
        [
          { le: new V3(0, y, z0), chord: 0.55, tc: 0.12, cdir: new V3(0, 0, 1), tdir: new V3(1, 0, 0) },
          { le: new V3(0, y + up * 0.42, z0 + 0.32), chord: 0.22, tc: 0.12, cdir: new V3(0, 0, 1), tdir: new V3(1, 0, 0) },
        ],
        0,
        1,
        10,
      );
    add("Antennas", "probes", "dark", merge([blade(R - 0.02, -6, 1), blade(R - 0.02, 2.5, 1), blade(-2.0, -4, -1), blade(-1.98, 6.4, -1)]), [0, 2.4, 0]);
  }

  yield;
  /* ---------------- Interior ---------------- */
  yield* buildInterior(add);

  const bounds = new Map<Anchor, THREE.Box3>();
  for (const p of pieces) {
    p.geometry.computeBoundingBox();
    const b = p.geometry.boundingBox!.clone().translate(p.origin);
    const prev = bounds.get(p.anchor);
    bounds.set(p.anchor, prev ? prev.union(b) : b);
  }

  return { pieces, pivots, bounds };
}

/* ------------------------------------------------------------------ */
/* Interior & systems equipment                                       */
/* ------------------------------------------------------------------ */

type AddFn = (name: string, anchor: Anchor, kind: Kind, g: THREE.BufferGeometry, ex: [number, number, number], o?: AddOpts) => void;

/** One triple economy seat unit centred at (x, z). */
function seatUnit(x: number, z: number, fabric: THREE.BufferGeometry[], frame: THREE.BufferGeometry[]) {
  const y0 = -0.86;
  for (let i = -1; i <= 1; i++) {
    const sx = x + i * 0.46;
    fabric.push(rbox(0.43, 0.1, 0.44, 0.045, sx, y0 + 0.44, z));
    fabric.push(rbox(0.43, 0.66, 0.1, 0.045, sx, y0 + 0.82, z + 0.25, -0.16));
    fabric.push(rbox(0.36, 0.12, 0.06, 0.03, sx, y0 + 1.1, z + 0.21, -0.16));
  }
  for (let i = 0; i < 4; i++) frame.push(rbox(0.05, 0.05, 0.42, 0.02, x - 0.69 + i * 0.46, y0 + 0.62, z + 0.02));
  frame.push(rbox(1.38, 0.05, 0.08, 0.02, x, y0 + 0.36, z - 0.05));
  for (const sx of [x - 0.55, x + 0.55]) {
    frame.push(rbox(0.04, 0.36, 0.04, 0.015, sx, y0 + 0.18, z - 0.15));
    frame.push(rbox(0.04, 0.36, 0.04, 0.015, sx, y0 + 0.18, z + 0.15));
  }
}

/** Line-replaceable unit: rounded box with two front handles. */
function lru(w: number, h: number, d: number, x: number, y: number, z: number, body: THREE.BufferGeometry[], trim: THREE.BufferGeometry[]) {
  body.push(rbox(w, h, d, 0.025, x, y, z));
  for (const sx of [-w * 0.32, w * 0.32]) {
    trim.push(new THREE.TorusGeometry(0.045, 0.01, 6, 14, Math.PI).rotateY(Math.PI / 2).translate(x + sx, y, z - d / 2 - 0.005));
  }
  trim.push(rbox(w * 0.7, 0.012, 0.01, 0.004, x, y + h * 0.3, z - d / 2 - 0.004));
}

function* buildInterior(add: AddFn): Generator<void, void> {
  yield;
  /* Weather radar: parabolic dish on a gimbal */
  {
    const prof: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const r = (i / 16) * 0.62;
      prof.push(new V2(Math.max(r, 1e-3), 0.18 * (r / 0.62) ** 2));
    }
    const dish = new THREE.LatheGeometry(prof, 48);
    dish.rotateX(-Math.PI / 2);
    dish.translate(0, -0.25, -17.75);
    const gimbal = merge([
      new THREE.TorusGeometry(0.3, 0.025, 8, 32).translate(0, -0.25, -17.45),
      cyl(0.05, 0.05, 0.5, "z", 0, -0.25, -17.3, 12),
      rbox(0.4, 0.3, 0.25, 0.04, 0, -0.25, -17.05),
    ]);
    add("Weather radar antenna", "radome", "darkMetal", merge([dish, gimbal]), [0, 0, -5.6], { internal: true });
  }

  yield;
  /* Flight deck */
  {
    const panel = merge([
      rbox(2.3, 0.62, 0.22, 0.05, 0, 0.05, -16.25),
      rbox(2.4, 0.12, 0.45, 0.05, 0, 0.42, -16.2),
      rbox(0.45, 0.25, 0.9, 0.05, 0, -0.35, -15.65),
      rbox(1.5, 0.12, 0.9, 0.05, 0, 1.25, -15.7),
    ]);
    add("Instrument panel", "cockpit", "dark", panel, [0, 4.4, -7.2], { internal: true });
    const screens: THREE.BufferGeometry[] = [];
    for (const x of [-0.92, -0.52, 0.52, 0.92]) screens.push(new THREE.PlaneGeometry(0.34, 0.3).translate(x, 0.08, -16.13));
    screens.push(new THREE.PlaneGeometry(0.28, 0.26).translate(0, 0.08, -16.13));
    add("Flight displays", "cockpit", "screen", merge(screens), [0, 4.7, -6.8], { internal: true });
    const seats: THREE.BufferGeometry[] = [];
    for (const x of [-0.6, 0.6]) {
      seats.push(rbox(0.5, 0.12, 0.5, 0.05, x, -0.5, -15.1));
      seats.push(rbox(0.5, 0.82, 0.14, 0.06, x, -0.05, -14.82, -0.12));
      seats.push(rbox(0.3, 0.18, 0.1, 0.04, x, 0.45, -14.76, -0.12));
      seats.push(rbox(0.06, 0.06, 0.4, 0.02, x - 0.3, -0.25, -15.05));
      seats.push(rbox(0.06, 0.06, 0.4, 0.02, x + 0.3, -0.25, -15.05));
      seats.push(cyl(0.05, 0.08, 0.4, "y", x, -0.78, -15.1, 12));
    }
    add("Crew seats", "cockpit", "seat", merge(seats), [0, 4.2, -6.2], { internal: true });
  }

  yield;
  /* Avionics bay: rack frames with LRUs */
  {
    const frame: THREE.BufferGeometry[] = [];
    const body: THREE.BufferGeometry[] = [];
    const trim: THREE.BufferGeometry[] = [];
    for (const zr of [-14.4, -13.3]) {
      for (const sx of [-0.85, 0.85]) frame.push(rbox(0.04, 1.0, 0.04, 0.01, sx, -1.15, zr), rbox(0.04, 1.0, 0.04, 0.01, sx, -1.15, zr + 0.55));
      for (const sy of [-1.62, -1.15, -0.68]) frame.push(rbox(1.74, 0.03, 0.6, 0.01, 0, sy, zr + 0.27));
      for (let i = 0; i < 5; i++) {
        lru(0.28, 0.4, 0.5, -0.62 + i * 0.31, -1.4, zr + 0.28, body, trim);
        lru(0.28, 0.4, 0.5, -0.62 + i * 0.31, -0.93, zr + 0.28, body, trim);
      }
    }
    add("Avionics racks", "avionics", "metal", merge(frame), [0, -5.8, -6.6], { internal: true });
    add("Avionics LRUs", "avionics", "darkMetal", merge(body), [0, -5.8, -7.4], { internal: true });
    add("LRU handles", "avionics", "chrome", merge(trim), [0, -5.8, -7.4], { internal: true, lines: NO_LINES() });
  }

  yield;
  /* Electrical: batteries & transformer-rectifiers */
  {
    const bat: THREE.BufferGeometry[] = [];
    const fins: THREE.BufferGeometry[] = [];
    for (const sx of [-0.55, 0.55]) {
      bat.push(rbox(0.5, 0.32, 0.38, 0.04, sx, -1.35, -12.2));
      bat.push(cyl(0.03, 0.03, 0.42, "x", sx, -1.17, -12.2, 8));
    }
    for (let i = 0; i < 9; i++) fins.push(rbox(0.012, 0.22, 0.3, 0.004, -0.4 + i * 0.1, -1.38, -11.55));
    fins.push(rbox(0.95, 0.12, 0.34, 0.03, 0, -1.55, -11.55));
    add("Batteries", "electrical", "metal", merge(bat), [3.4, -5.6, -6.2], { internal: true });
    add("Transformer rectifiers", "electrical", "darkMetal", merge(fins), [3.4, -5.6, -5.4], { internal: true });
  }

  yield;
  /* Cabin: floor, seats, bins */
  {
    add("Cabin floor", "cabin", "carpet", rbox(3.5, 0.06, 21.6, 0.02, 0, -0.9, -0.6), [0, 6.4, 0], { internal: true });
    const fabric: THREE.BufferGeometry[] = [];
    const frame: THREE.BufferGeometry[] = [];
    for (let z = -10.4; z <= 9.4; z += 0.82) {
      if (z > -1.2 && z < 0.3) continue;
      seatUnit(-1.02, z, fabric, frame);
      seatUnit(1.02, z, fabric, frame);
    }
    add("Passenger seats", "cabin", "fabric", merge(fabric), [0, 7.6, 0], { internal: true, lines: NO_LINES() });
    add("Seat frames", "cabin", "metal", merge(frame), [0, 7.6, 0], { internal: true, lines: NO_LINES() });
    const binShape = new THREE.Shape();
    binShape.moveTo(0, 0);
    binShape.lineTo(0.5, 0);
    binShape.quadraticCurveTo(0.56, 0.22, 0.42, 0.42);
    binShape.lineTo(0.02, 0.42);
    binShape.lineTo(0, 0);
    const bin = new THREE.ExtrudeGeometry(binShape, { depth: 20.4, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 });
    const binR = bin.clone().translate(0.82, 0.8, -10.8);
    const binL = mirrorX(bin).translate(-0.82, 0.8, -10.8);
    add("Overhead bins", "cabin", "cabin", merge([binR, binL]), [0, 9.6, 0], { internal: true });
  }

  yield;
  /* Galleys & lavatories */
  {
    const galley = (z: number, dir: 1 | -1) => {
      const body = [rbox(2.7, 1.75, 0.8, 0.05, 0, 0.0, z)];
      const fronts: THREE.BufferGeometry[] = [];
      for (let i = 0; i < 4; i++) fronts.push(rbox(0.5, 0.82, 0.03, 0.02, -0.95 + i * 0.63, -0.38, z - dir * 0.41));
      for (let i = 0; i < 4; i++) fronts.push(rbox(0.5, 0.36, 0.03, 0.02, -0.95 + i * 0.63, 0.45, z - dir * 0.41));
      return { body, fronts };
    };
    const f = galley(-11.75, -1);
    const a = galley(10.5, 1);
    add("Forward galley", "galley", "cabin", merge(f.body), [0, 7.6, -3.6], { internal: true });
    add("Forward galley inserts", "galley", "metal", merge(f.fronts), [0, 7.6, -3.9], { internal: true });
    add("Aft galley", "galley", "cabin", merge([...a.body, rbox(0.95, 1.75, 0.95, 0.06, -0.85, 0.05, 9.6), rbox(0.95, 1.75, 0.95, 0.06, 0.85, 0.05, 9.6)]), [0, 7.6, 3.8], {
      internal: true,
    });
    add("Aft galley inserts", "galley", "metal", merge(a.fronts), [0, 7.6, 4.1], { internal: true });
  }

  yield;
  /* Air-conditioning packs in the belly */
  {
    const metal: THREE.BufferGeometry[] = [];
    const dark: THREE.BufferGeometry[] = [];
    for (const sx of [-0.78, 0.78]) {
      dark.push(rbox(0.85, 0.42, 0.7, 0.03, sx, -1.95, 0.9));
      for (let i = 0; i < 8; i++) metal.push(rbox(0.86, 0.01, 0.71, 0.004, sx, -2.12 + i * 0.05, 0.9));
      const { g: acm } = smoothLathe(
        [
          [0.08, -0.45],
          [0.2, -0.3],
          [0.17, 0],
          [0.2, 0.3],
          [0.08, 0.45],
        ],
        20,
        32,
      );
      metal.push(acm.translate(sx, -1.95, -0.3));
      metal.push(new THREE.TorusGeometry(0.2, 0.07, 10, 28).translate(sx, -1.95, -0.62));
      metal.push(new THREE.TorusGeometry(0.2, 0.07, 10, 28).translate(sx, -1.95, 0.02));
      metal.push(
        tube(
          [
            [sx, -1.75, 1.3],
            [sx * 0.9, -1.55, 1.8],
            [sx * 0.5, -1.25, 2.1],
            [sx * 0.2, -1.05, 2.4],
          ],
          0.09,
        ),
      );
      metal.push(
        tube(
          [
            [sx, -1.95, -0.75],
            [sx, -1.85, -1.3],
            [sx * 0.6, -1.4, -1.8],
          ],
          0.08,
        ),
      );
    }
    add("Air-conditioning packs", "packs", "metal", merge(metal), [0, -7, -1.2], { internal: true });
    add("Pack heat exchangers", "packs", "darkMetal", merge(dark), [0, -7, -0.6], { internal: true });
  }

  yield;
  /* Hydraulics in the main gear bay */
  {
    const dark: THREE.BufferGeometry[] = [];
    const metal: THREE.BufferGeometry[] = [];
    for (const sx of [-0.85, 0, 0.85]) {
      dark.push(capsule(0.17, 0.75, "z", sx, -1.75, 3.6));
      metal.push(cyl(0.19, 0.19, 0.04, "z", sx, -1.75, 3.15, 20));
    }
    for (const sx of [-0.45, 0.45]) {
      metal.push(cyl(0.12, 0.12, 0.32, "x", sx, -2.0, 2.85, 20));
      metal.push(cyl(0.16, 0.16, 0.04, "x", sx + Math.sign(sx) * 0.18, -2.0, 2.85, 20));
      metal.push(rbox(0.22, 0.2, 0.22, 0.03, sx - Math.sign(sx) * 0.22, -2.0, 2.85));
    }
    metal.push(
      tube(
        [
          [-0.85, -1.75, 4.1],
          [-0.6, -1.9, 4.4],
          [0.2, -2.0, 4.5],
          [0.85, -1.75, 4.1],
        ],
        0.025,
      ),
      tube(
        [
          [-0.45, -2.0, 2.65],
          [0, -2.1, 2.4],
          [0.45, -2.0, 2.65],
        ],
        0.025,
      ),
    );
    add("Hydraulic reservoirs", "hydraulic", "darkMetal", merge(dark), [3, -6.8, 4.6], { internal: true });
    add("Hydraulic pumps & lines", "hydraulic", "chrome", merge(metal), [3, -6.8, 4.2], { internal: true });
  }

  yield;
  /* APU: small gas turbine in the tail cone */
  {
    const yc = section(16.4).cy;
    const { g: core } = smoothLathe(
      [
        [0.16, -0.75],
        [0.3, -0.5],
        [0.36, -0.1],
        [0.32, 0.35],
        [0.22, 0.75],
      ],
      24,
      40,
    );
    core.translate(0, yc, 16.4);
    const parts = [
      core,
      new THREE.TorusGeometry(0.34, 0.06, 10, 32).translate(0, yc, 16.15),
      tube(
        [
          [0, yc + 0.2, 15.7],
          [0, yc + 0.45, 15.4],
          [0, yc + 0.55, 15.0],
        ],
        0.12,
      ),
      cyl(0.18, 0.2, 0.9, "z", 0, yc, 17.5, 24),
    ];
    add("APU", "apu", "metal", merge(parts), [0, 3, 8], { internal: true });
  }
}

/* ------------------------------------------------------------------ */
/* Top-view planform as SVG paths (used by the preloader drawing)     */
/* ------------------------------------------------------------------ */

export function planformPaths(): string[] {
  const f = (n: number) => n.toFixed(3);
  const poly = (pts: [number, number][], close = true) =>
    `M${pts.map(([x, z]) => `${f(x)} ${f(z)}`).join(" L")}${close ? " Z" : ""}`;
  const mirror = (pts: [number, number][]) => pts.map(([x, z]) => [-x, z] as [number, number]);

  const right: [number, number][] = [];
  for (let z = NOSE; z <= TAIL; z += 0.25) right.push([section(z).hw, z]);
  const fuselage = poly([...right, ...mirror(right).reverse()]);

  const hwR = section(0).hw;
  const wing: [number, number][] = [
    [hwR, LE(hwR)],
    [SPAN, LE(SPAN)],
    [SPAN + 0.62, LE(SPAN) + 1.7],
    [SPAN + 0.5, LE(SPAN) + 2.2],
    [SPAN, TE(SPAN)],
    [KINK, TE(KINK)],
    [hwR, TE(hwR)],
  ];
  const flapLine = (x0: number, x1: number, fr: number): [number, number][] => [
    [x0, chordAt(x0, fr)],
    ...(x0 < KINK && x1 > KINK ? [[KINK, chordAt(KINK, fr)] as [number, number]] : []),
    [x1, chordAt(x1, fr)],
  ];
  const hs: [number, number][] = [
    [0.9, 13.9],
    [6.3, 17.0],
    [6.3, 18.35],
    [0.6, 17.6],
  ];
  const nacelle = (x: number): [number, number][] => [
    [x - 1.0, -4.75],
    [x + 1.0, -4.75],
    [x + 1.06, -3.2],
    [x + 0.86, -0.9],
    [x + 0.5, -0.3],
    [x - 0.5, -0.3],
    [x - 0.86, -0.9],
    [x - 1.06, -3.2],
  ];
  return [
    fuselage,
    poly(wing),
    poly(mirror(wing)),
    poly(flapLine(1.95, 16.35, 0.75), false),
    poly(mirror(flapLine(1.95, 16.35, 0.75)), false),
    poly(flapLine(2.85, 16.35, 0.11), false),
    poly(mirror(flapLine(2.85, 16.35, 0.11)), false),
    poly(hs),
    poly(mirror(hs)),
    poly(nacelle(5.8)),
    poly(nacelle(-5.8)),
    poly(
      [
        [0, 11.9],
        [0, TAIL],
      ],
      false,
    ),
  ];
}

function chordAt(x: number, fr: number) {
  return LE(x) + fr * (TE(x) - LE(x));
}
