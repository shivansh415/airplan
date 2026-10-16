import * as THREE from "three";
import type { Kind } from "./model";

export const PALETTE = {
  ink: "#2a2420",
  paper: "#ece5da",
  accent: "#2f5cff",
  accentSoft: "#8fb0ff",
};

type Spec = {
  color: string;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
};

export const KIND_SPECS: Record<Kind, Spec> = {
  fuselage: { color: "#ffffff", metalness: 0.08, roughness: 0.26, clearcoat: 0.85 },
  skin: { color: "#f6f4f0", metalness: 0.08, roughness: 0.26, clearcoat: 0.85 },
  belly: { color: "#c3c8cf", metalness: 0.1, roughness: 0.32, clearcoat: 0.6 },
  wing: { color: "#d9dde2", metalness: 0.25, roughness: 0.38, clearcoat: 0.35 },
  seam: { color: "#8e939b", metalness: 0.2, roughness: 0.6 },
  lip: { color: "#e3e7ec", metalness: 1, roughness: 0.14 },
  chrome: { color: "#eef1f4", metalness: 1, roughness: 0.08 },
  titanium: { color: "#a9afb7", metalness: 1, roughness: 0.28 },
  metal: { color: "#bcc1c7", metalness: 0.85, roughness: 0.3 },
  darkMetal: { color: "#4e535a", metalness: 0.8, roughness: 0.38 },
  dark: { color: "#1c1e22", metalness: 0.2, roughness: 0.5 },
  glass: { color: "#0e141c", metalness: 0.4, roughness: 0.04, clearcoat: 1 },
  tyre: { color: "#161616", metalness: 0, roughness: 0.88 },
  seat: { color: "#2b2e33", metalness: 0.1, roughness: 0.6 },
  fabric: { color: "#2c3a52", metalness: 0, roughness: 0.92 },
  carpet: { color: "#4a505c", metalness: 0, roughness: 0.95 },
  cabin: { color: "#e6e2da", metalness: 0, roughness: 0.55 },
  tank: { color: "#7aa6ef", metalness: 0.1, roughness: 0.3, opacity: 0.5 },
  screen: { color: "#0c1220", emissive: "#6aa2ff", emissiveIntensity: 1.6 },
  red: { color: "#ff2a2a", emissive: "#ff2a2a", emissiveIntensity: 4 },
  green: { color: "#2aff7a", emissive: "#2aff7a", emissiveIntensity: 4 },
  white: { color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 4 },
};

export function makeSolidMaterial(kind: Kind, clip: THREE.Plane) {
  const s = KIND_SPECS[kind];
  const m = new THREE.MeshPhysicalMaterial({
    color: s.color,
    metalness: s.metalness ?? 0,
    roughness: s.roughness ?? 0.5,
    clearcoat: s.clearcoat ?? 0,
    clearcoatRoughness: 0.15,
    emissive: s.emissive ?? "#000000",
    emissiveIntensity: s.emissiveIntensity ?? 1,
    transparent: true,
    opacity: s.opacity ?? 1,
    side: THREE.DoubleSide,
    clippingPlanes: [clip],
    vertexColors: kind === "fuselage",
  });
  m.userData.baseOpacity = s.opacity ?? 1;
  m.userData.baseEmissive = new THREE.Color(s.emissive ?? "#000000");
  m.userData.baseEmissiveIntensity = s.emissiveIntensity ?? 1;
  return m;
}

export const TRAIL_LENGTH = 24;

/** Uniforms shared by every blueprint material (brush trail, time). */
export const sharedBlueprintUniforms = {
  uTrail: { value: Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector4(0, -999, 0, 0)) },
  uRadius: { value: 3.4 },
  uBrush: { value: 0 },
  uTime: { value: 0 },
  uInk: { value: new THREE.Color(PALETTE.ink) },
  uFill: { value: new THREE.Color(PALETTE.paper) },
  uAccent: { value: new THREE.Color(PALETTE.accent) },
};

const vertex = /* glsl */ `
#include <common>
#include <clipping_planes_pars_vertex>
varying vec3 vN;
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
}
`;

const fragment = /* glsl */ `
#include <common>
#include <clipping_planes_pars_fragment>
uniform vec4 uTrail[${TRAIL_LENGTH}];
uniform float uRadius;
uniform float uBrush;
uniform float uTime;
uniform vec3 uInk;
uniform vec3 uFill;
uniform vec3 uAccent;
uniform float uInternal;
uniform float uFillOpacity;
uniform float uLineOpacity;
uniform float uReveal;
varying vec3 vN;
varying vec3 vW;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float brushMask(vec3 p) {
  float m = 0.0;
  float wobble = (noise(p.xz * 1.3 + uTime * 0.6) - 0.5) * 1.2;
  for (int i = 0; i < ${TRAIL_LENGTH}; i++) {
    vec4 t = uTrail[i];
    float r = uRadius * (0.55 + 0.45 * t.w);
    float d = length(p.xz - t.xz) + wobble;
    m = max(m, t.w * (1.0 - smoothstep(r * 0.45, r, d)));
  }
  return m * uBrush;
}

void main() {
  #include <clipping_planes_fragment>
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vW);
  float ndv = abs(dot(n, v));
  float rim = 1.0 - smoothstep(0.0, 0.3, ndv);
  float m = brushMask(vW);
  float edge = smoothstep(0.04, 0.3, m) * (1.0 - smoothstep(0.3, 0.85, m));

  if (uInternal > 0.5) {
    float vis = max(m, uReveal);
    if (vis < 0.02) discard;
    float diff = 0.45 + 0.55 * max(dot(n, normalize(vec3(0.35, 1.0, 0.25))), 0.0);
    vec3 c = mix(uAccent * (0.35 + 0.75 * diff), vec3(0.85, 0.9, 1.0), pow(rim, 2.0) * 0.55);
    float scan = 0.85 + 0.15 * sin(vW.z * 9.0 - uTime * 4.0);
    gl_FragColor = vec4(c * scan, vis * uLineOpacity);
  } else {
    float fillA = uFillOpacity * (1.0 - m);
    vec3 col = mix(uFill, uInk, rim);
    float a = max(fillA, rim * uLineOpacity * (1.0 - m * 0.7));
    col = mix(col, uAccent, edge);
    a = max(a, edge * 0.85 * uLineOpacity);
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }
  #include <colorspace_fragment>
}
`;

export function makeBlueprintMaterial(internal: boolean, clip: THREE.Plane) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      ...sharedBlueprintUniforms,
      uInternal: { value: internal ? 1 : 0 },
      uFillOpacity: { value: 0.92 },
      uLineOpacity: { value: 1 },
      uReveal: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    clipping: true,
    clippingPlanes: [clip],
    toneMapped: false,
  });
}

export function makeLineMaterial(clip: THREE.Plane) {
  return new THREE.LineBasicMaterial({
    color: PALETTE.ink,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    clippingPlanes: [clip],
    toneMapped: false,
  });
}

/** Lines for internal parts: only drawn under the x-ray brush (or when revealed). */
export function makeMaskedLineMaterial(clip: THREE.Plane) {
  return new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      #include <common>
      #include <clipping_planes_pars_vertex>
      varying vec3 vW;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <clipping_planes_pars_fragment>
      uniform vec4 uTrail[${TRAIL_LENGTH}];
      uniform float uRadius;
      uniform float uBrush;
      uniform float uLineOpacity;
      uniform float uReveal;
      varying vec3 vW;
      void main() {
        #include <clipping_planes_fragment>
        float m = 0.0;
        for (int i = 0; i < ${TRAIL_LENGTH}; i++) {
          vec4 t = uTrail[i];
          float r = uRadius * (0.55 + 0.45 * t.w);
          m = max(m, t.w * (1.0 - smoothstep(r * 0.45, r, length(vW.xz - t.xz))));
        }
        float a = max(m * uBrush, uReveal) * uLineOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(0.92, 0.95, 1.0), a * 0.9);
        #include <colorspace_fragment>
      }`,
    uniforms: {
      uTrail: sharedBlueprintUniforms.uTrail,
      uRadius: sharedBlueprintUniforms.uRadius,
      uBrush: sharedBlueprintUniforms.uBrush,
      uLineOpacity: { value: 1 },
      uReveal: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    clipping: true,
    clippingPlanes: [clip],
    toneMapped: false,
  });
}
