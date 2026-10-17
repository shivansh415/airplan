"use client";

import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Reflector } from "three/addons/objects/Reflector.js";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AirlinerRig, type AnchorLook } from "./AirlinerRig";
import { Clouds } from "./Clouds";
import { PALETTE, TRAIL_LENGTH, sharedBlueprintUniforms } from "./materials";
import { DIMENSIONS } from "./model";
import { rig, smooth, easeInOut } from "@/lib/rig";
import { useUI } from "@/lib/store";
import { audio } from "@/lib/audio";
import { takeOff } from "@/lib/takeoff";
import { SYSTEMS, type Anchor, type SystemId } from "@/data/parts";

const V3 = THREE.Vector3;

type Shot = { pos: THREE.Vector3; target: THREE.Vector3; up: THREE.Vector3 };
const shot = (): Shot => ({ pos: new V3(), target: new V3(), up: new V3(0, 1, 0) });
const setShot = (s: Shot, p: [number, number, number], t: [number, number, number], u: [number, number, number] = [0, 1, 0]) => {
  s.pos.set(...p);
  s.target.set(...t);
  s.up.set(...u);
  return s;
};
const mixShot = (out: Shot, b: Shot, t: number) => {
  if (t <= 0) return out;
  out.pos.lerp(b.pos, t);
  out.target.lerp(b.target, t);
  out.up.lerp(b.up, t).normalize();
  return out;
};

/** Which anchors light up per system chapter. */
export const SYSTEM_FOCUS: Anchor[][] = SYSTEMS.map((s) =>
  s.id === "consumables" ? ["engine", "hydraulic", "packs", "galley", "main-gear", "lights"] : s.anchors,
);

/** Camera direction per system chapter: azimuth (0 = from the tail), elevation, distance factor. */
const VIEWS: Record<SystemId, [number, number, number]> = {
  engines: [-2.35, 0.22, 2.4],
  apu: [0.55, 0.32, 3.2],
  "landing-gear": [-2.0, -0.02, 1.55],
  "flight-controls": [2.6, 0.8, 1.15],
  hydraulics: [-1.25, -0.18, 2.8],
  fuel: [-2.7, 0.95, 1.25],
  electrical: [-2.2, 0.12, 3.2],
  avionics: [-2.45, 0.25, 2.1],
  lighting: [-2.3, 0.6, 1.1],
  "air-conditioning": [-1.0, -0.25, 2.8],
  cabin: [-1.85, 0.7, 1.3],
  "doors-windows": [-1.55, 0.2, 1.25],
  protection: [-2.4, 0.45, 1.5],
  consumables: [-2.2, 0.45, 1.15],
};

function makeConeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.2); float a = pow(vUv.y, 1.6) * f * uOpacity; gl_FragColor = vec4(vec3(1.0,0.96,0.9)*a, a); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/** Black hangar floor with a soft, distance-faded planar reflection. */
function makeFloor(mobile: boolean) {
  const res = mobile ? 512 : 1024;
  const floor = new Reflector(new THREE.PlaneGeometry(320, 320), {
    textureWidth: res,
    textureHeight: res,
    clipBias: 0.003,
    shader: {
      name: "HangarFloor",
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        uOpacity: { value: 1 },
      },
      vertexShader: /* glsl */ `
        uniform mat4 textureMatrix; varying vec4 vUv; varying vec2 vUv2;
        void main(){ vUv = textureMatrix * vec4(position, 1.0); vUv2 = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform float uOpacity; varying vec4 vUv; varying vec2 vUv2;
        void main(){
          vec4 base = texture2DProj(tDiffuse, vUv);
          float d = length((vUv2 - 0.5) * vec2(1.0, 1.6)) * 2.0;
          float fade = 1.0 - smoothstep(0.02, 0.32, d);
          gl_FragColor = vec4(base.rgb * 0.17 * fade, uOpacity);
          #include <colorspace_fragment>
        }`,
    },
  });
  const m = floor.material as THREE.ShaderMaterial;
  m.transparent = true;
  m.depthWrite = false;
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4.0;
  floor.renderOrder = -1;
  return floor;
}

/** Builds the airliner in slices (so the preloader keeps animating), then mounts the scene. */
export function Experience({ mobile }: { mobile: boolean }) {
  const [air, setAir] = useState<AirlinerRig | null>(null);
  useEffect(() => {
    let alive = true;
    let made: AirlinerRig | null = null;
    AirlinerRig.createAsync((p) => {
      rig.loadProgress = p * 0.9;
    })
      .then((a) => {
        if (alive) {
          made = a;
          setAir(a);
        } else a.dispose();
      });
    return () => {
      alive = false;
      made?.dispose();
    };
  }, []);
  if (!air) return null;
  return <Scene air={air} mobile={mobile} />;
}

function Scene({ air, mobile }: { air: AirlinerRig; mobile: boolean }) {
  const { camera, size, scene, gl } = useThree();
  const setFrameloop = useThree((s) => s.setFrameloop);

  // Hold rendering until every shader in the scene is compiled in the background,
  // so the first frame doesn't freeze the page (and the preloader) while compiling.
  useLayoutEffect(() => {
    let alive = true;
    // Only worth it with parallel compile support; without it three's promise never resolves.
    const parallel = gl.getContext().getExtension("KHR_parallel_shader_compile") !== null;
    if (!parallel) {
      rig.loadProgress = 1;
      return;
    }
    setFrameloop("never");
    const timeout = new Promise((r) => setTimeout(r, 4000));
    Promise.race([gl.compileAsync(scene, camera), timeout])
      .catch(() => undefined)
      .then(() => {
        if (!alive) return;
        rig.loadProgress = 1;
        setFrameloop("always");
      });
    return () => {
      alive = false;
      setFrameloop("always");
    };
  }, [gl, scene, camera, setFrameloop]);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __scene: scene, __rig: rig, __camera: camera, __ui: useUI, __air: air });
  }, [scene, camera, air]);

  const spot = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const floor = useMemo(() => makeFloor(mobile), [mobile]);
  useEffect(() => () => floor.dispose(), [floor]);
  const shadows = useRef<THREE.Group>(null);
  const cone = useMemo(() => makeConeMaterial(), []);
  const scanBar = useRef<THREE.Group>(null);

  // camera state (eased)
  const cam = useMemo(() => ({ pos: new V3(-55, -1.6, 5), target: new V3(0, -1, 0), up: new V3(0, 1, 0), init: false }), []);
  const shots = useMemo(() => ({ out: shot(), tmp: shot(), a: shot(), b: shot() }), []);
  const prevMode = useRef<"scan" | "explode" | "systems">("scan");
  const flightPrev = useRef(0);
  const framesDrawn = useRef(0);
  const hangarHover = useRef(false);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ground = useMemo(() => new THREE.Plane(new V3(0, 1, 0), 0), []);
  const trail = useMemo(() => ({ last: new V3(0, 0, -999), hit: new V3(), ndc: new THREE.Vector2(), lastPointer: "" }), []);

  // Pointer → normalised device coords (canvas is fixed full-screen).
  useEffect(() => {
    const move = (e: PointerEvent) => {
      rig.pointer.cx = e.clientX;
      rig.pointer.cy = e.clientY;
      rig.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      rig.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      rig.pointer.inside = true;
    };
    const leave = () => (rig.pointer.inside = false);
    // In the systems tour, clicking a highlighted part opens its parts panel.
    const hitsAircraft = (cx: number, cy: number) => {
      const ndc = new THREE.Vector2((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
      const rc = new THREE.Raycaster();
      rc.setFromCamera(ndc, camera);
      return rc.intersectObjects(air.pickables, false).some((h) => ((h.object as THREE.Mesh).material as THREE.Material).visible);
    };
    const click = (e: MouseEvent) => {
      const ui = useUI.getState();
      // In the hangar: click / tap the aircraft to play the take-off.
      if (!ui.exploded && ui.entered && rig.sky < 0.02 && !(e.target as HTMLElement).closest("a, button, input, aside")) {
        if (hitsAircraft(e.clientX, e.clientY)) takeOff();
        return;
      }
      if (ui.exploded || rig.systems <= 0 || rig.catalog > 0.5 || !ui.hovered) return;
      if ((e.target as HTMLElement).closest("a, button, input, aside")) return;
      ui.set({ selected: ui.hovered });
    };
    window.addEventListener("click", click);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("click", click);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [camera, air]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    // ready once a few frames are on screen (first frames include shader compilation)
    if (!rig.ready && ++framesDrawn.current > 4) rig.ready = true;
    const t = state.clock.elapsedTime;
    const ui = useUI.getState();
    const aspect = size.width / size.height;
    const wide = Math.max(1, 1.7 / aspect); // push the camera back on narrow screens
    const N = SYSTEMS.length;

    /* ------------------------------ stage ------------------------------ */
    // The hangar → sky cut happens while the screen is washed out white.
    const flight = rig.sky > 0.2 ? 1 : 0;
    const day = flight;
    if (flight !== flightPrev.current) {
      if (flight) audio.whoosh(2.4, true);
      flightPrev.current = flight;
      cam.init = false; // hard cut
    }
    const explodeActive = ui.exploded || rig.explode > 0.001 || rig.explodeCam > 0.001;
    const mode: "scan" | "explode" | "systems" = explodeActive ? "explode" : rig.systems > 0.0001 ? "systems" : "scan";
    const sysF = THREE.MathUtils.clamp(rig.systems * N - 0.5, 0, N - 1);
    const sysIdx = Math.round(sysF);
    const scanP = smooth(0.3, 0.62, rig.blueprint);

    if (mode !== prevMode.current) {
      if (prevMode.current === "scan" && mode === "systems") air.snap(() => ({ solid: 0, bp: 1 }));
      if (prevMode.current === "systems" && mode === "scan") air.snap(() => ({ solid: 1, bp: 1 }));
      prevMode.current = mode;
    }
    if (mode === "systems" && ui.systemIndex !== sysIdx) ui.set({ systemIndex: sysIdx });
    if (mode !== "systems" && ui.systemIndex !== -1) ui.set({ systemIndex: -1 });

    const ready = mode === "scan" && rig.blueprint > 0.66 && rig.blueprint < 0.999;
    if (ready !== ui.drawingReady) ui.set({ drawingReady: ready });

    air.scan = mode === "systems" ? null : mode === "explode" ? rig.scanOverride : THREE.MathUtils.lerp(-21, 21.5, scanP);
    air.explode = rig.explode;
    const gearTarget = mode === "systems" || mode === "explode" ? 1 : flight ? 1 - smooth(0.27, 0.42, rig.sky) : 1;
    air.gear += (gearTarget - air.gear) * (1 - Math.exp(-dt * 3));
    const fanTarget = mode === "explode" ? 0.6 : mode === "systems" ? 2 : flight ? 18 * (1 - scanP) : 7 * smooth(0.02, 0.18, rig.sky);
    air.fanSpeed += (fanTarget - air.fanSpeed) * (1 - Math.exp(-dt * 2));

    const focusSet = SYSTEM_FOCUS[sysIdx];
    const look = (a: Anchor): Partial<AnchorLook> => {
      const hl = ui.hovered === a ? 1 : ui.selected === a ? 0.75 : ui.focus === a ? 0.85 : 0;
      if (mode === "systems") {
        return focusSet.includes(a)
          ? { solid: 1, bp: 0, fill: 0, highlight: hl * 0.9 }
          : { solid: 0, bp: 0.5, fill: 0.04 };
      }
      return { solid: 1, bp: 1, fill: 0.93, highlight: mode === "explode" ? hl : 0 };
    };
    air.update(dt, t, look, 1 - Math.exp(-dt * 6));
    const fm = mode === "scan" ? flight * (1 - smooth(0, 0.45, rig.title)) : 0;
    air.root.rotation.set(Math.sin(t * 0.31) * 0.025 * fm, 0, Math.sin(t * 0.23) * 0.06 * fm);
    air.root.position.y = Math.sin(t * 0.5) * 0.35 * fm;

    /* ------------------------------ brush ------------------------------ */
    const brushOn = ready && !ui.exploded ? 1 : 0;
    const u = sharedBlueprintUniforms;
    u.uBrush.value = mode === "scan" ? u.uBrush.value + (brushOn - u.uBrush.value) * (1 - Math.exp(-dt * 5)) : 0;
    u.uTime.value = t;
    const tr = u.uTrail.value;
    for (let i = 1; i < TRAIL_LENGTH; i++) tr[i].w = Math.max(0, tr[i].w - dt * 0.6);
    if (brushOn && rig.pointer.inside) {
      trail.ndc.set(rig.pointer.x, rig.pointer.y);
      raycaster.setFromCamera(trail.ndc, camera);
      if (raycaster.ray.intersectPlane(ground, trail.hit)) {
        tr[0].set(trail.hit.x, 0, trail.hit.z, Math.min(1, tr[0].w + dt * 4));
        if (trail.hit.distanceTo(trail.last) > 0.7) {
          for (let i = TRAIL_LENGTH - 1; i > 1; i--) tr[i].copy(tr[i - 1]);
          tr[1].set(trail.hit.x, 0, trail.hit.z, 1);
          trail.last.copy(trail.hit);
        }
      }
    } else if (mode !== "scan") {
      for (const p of tr) p.w = 0;
    } else {
      tr[0].w = Math.max(0, tr[0].w - dt * 2);
    }

    /* ------------------------------ hover ------------------------------ */
    const pointerKey = `${rig.pointer.x.toFixed(4)}:${rig.pointer.y.toFixed(4)}`;
    const canHover = (mode === "explode" && rig.explode > 0.6) || (mode === "systems" && rig.catalog < 0.5);
    if (canHover && rig.pointer.inside && pointerKey !== trail.lastPointer) {
      trail.lastPointer = pointerKey;
      trail.ndc.set(rig.pointer.x, rig.pointer.y);
      raycaster.setFromCamera(trail.ndc, camera);
      const hits = raycaster.intersectObjects(air.pickables, false);
      const hit = hits.find((h) => {
        const m = (h.object as THREE.Mesh).material as THREE.Material;
        return m.visible && m.opacity > 0.5;
      });
      const a = (hit?.object.userData.anchor as Anchor | undefined) ?? null;
      if (a !== ui.hovered) {
        ui.set(a ? { hovered: a, lastHovered: a } : { hovered: null });
        if (a) audio.tick();
        if (mode === "systems") document.body.style.cursor = a ? "pointer" : "";
      }
    } else if (!canHover && ui.hovered) {
      ui.set({ hovered: null });
      document.body.style.cursor = "";
    }
    // hangar: pointer cursor over the aircraft (it is clickable to take off)
    const hangarHot = mode === "scan" && ui.entered && rig.sky < 0.02;
    if (hangarHot && rig.pointer.inside && pointerKey !== trail.lastPointer) {
      trail.lastPointer = pointerKey;
      trail.ndc.set(rig.pointer.x, rig.pointer.y);
      raycaster.setFromCamera(trail.ndc, camera);
      const over = raycaster.intersectObjects(air.pickables, false).length > 0;
      if (over !== hangarHover.current) {
        hangarHover.current = over;
        document.body.style.cursor = over ? "pointer" : "";
      }
    } else if (!hangarHot && hangarHover.current) {
      hangarHover.current = false;
      document.body.style.cursor = "";
    }

    /* ------------------------------ camera ------------------------------ */
    const S = shots;
    const out = S.out;
    if (!flight) {
      // Hangar: big side profile → low front three-quarter → push in on the engine
      setShot(out, [-44 * wide, -1.3, 5], [0, -1.0, 0]);
      setShot(S.b, [-25 * wide, 1.2, -24 * wide], [0, -0.6, -3]);
      mixShot(out, S.b, easeInOut(rig.hangar));
      setShot(S.b, [-11 * wide, -0.9, -15.5], [-3.5, -1.7, -6]);
      mixShot(out, S.b, easeInOut(smooth(0, 0.2, rig.sky)));
    } else {
      // In flight: reveal from the front, arc along the side, rise behind, then straight down
      setShot(out, [-23 * wide, 6.5, -33 * wide], [0, 0.4, -4]);
      setShot(S.b, [-37 * wide, 2.2, 5], [0, 0, 0]);
      mixShot(out, S.b, easeInOut(smooth(0.42, 0.62, rig.sky)));
      setShot(S.b, [-15 * wide, 21, 37 * wide], [0, 0, -2]);
      mixShot(out, S.b, easeInOut(smooth(0.62, 0.8, rig.sky)));
      setShot(S.b, [0, 175 * Math.min(wide, 1.6), -46], [0, 0, -46.01], [0, 0, -1]);
      mixShot(out, S.b, easeInOut(smooth(0.8, 1, rig.sky)));
    }
    // Title: plane flies up into frame and grows
    const hT = Math.max(66, 60 / aspect);
    setShot(S.b, [0, hT, 0.2], [0, 0, 0.21], [0, 0, -1]);
    mixShot(out, S.b, easeInOut(smooth(0, 0.62, rig.title)));
    // Blueprint: settle back so the whole aircraft fits with the specs around it
    const hB = Math.max(96, 86 / aspect);
    setShot(S.b, [0, hB, 0.4], [0, 0, 0.41], [0, 0, -1]);
    mixShot(out, S.b, easeInOut(smooth(0, 0.28, rig.blueprint)));

    // Systems tour
    if (rig.systems > 0) {
      const i0 = Math.floor(sysF);
      const i1 = Math.min(i0 + 1, N - 1);
      const k = smooth(0.3, 0.7, sysF - i0);
      const sysShot = (i: number, s: Shot) => {
        const sys = SYSTEMS[i];
        const [az, el, kd] = VIEWS[sys.id];
        const f = air.focusOf(SYSTEM_FOCUS[i]);
        const dist = Math.max(f.radius * kd + 7, 11) * (mobile ? 1.6 : 1) * Math.min(wide, 1.8);
        const dir = new V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
        s.pos.copy(f.center).addScaledVector(dir, dist);
        s.target.copy(f.center);
        s.up.set(0, 1, 0);
        // frame the subject off-centre: right on desktop (text on the left), high on mobile
        const fwd = new V3().subVectors(s.target, s.pos).normalize();
        const right = new V3().crossVectors(fwd, s.up).normalize();
        if (mobile) s.target.addScaledVector(s.up, -dist * 0.1);
        else s.target.addScaledVector(right, -dist * 0.17);
        s.pos.add(new V3().subVectors(s.target, f.center));
        return s;
      };
      sysShot(i0, S.a);
      sysShot(i1, S.tmp);
      mixShot(S.a, S.tmp, k);
      mixShot(out, S.a, easeInOut(smooth(0, 0.55 / N, rig.systems)));
    }

    // Exploded view with drag-orbit
    if (rig.explodeCam > 0) {
      const o = rig.orbit;
      o.az += (o.taz - o.az) * (1 - Math.exp(-dt * 5));
      o.el += (o.tel - o.el) * (1 - Math.exp(-dt * 5));
      o.zoom += (o.tzoom - o.zoom) * (1 - Math.exp(-dt * 5));
      const az = -2.25 + o.az;
      const el = THREE.MathUtils.clamp(0.48 + o.el, -0.2, 1.35);
      const dist = 60 * Math.min(wide, 2.2) * o.zoom;
      const dir = new V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      S.b.target.set(0, 0.5, 0);
      S.b.pos.copy(S.b.target).addScaledVector(dir, dist);
      S.b.up.set(0, 1, 0);
      // keep the model clear of the side panel when it is open
      o.shift = (o.shift ?? 0) + ((ui.selected && !mobile ? 1 : 0) - (o.shift ?? 0)) * (1 - Math.exp(-dt * 4));
      if (!mobile) {
        // clear the parts list on the left, and the parts panel on the right when open
        const right = new V3().crossVectors(new V3().subVectors(S.b.target, S.b.pos).normalize(), S.b.up).normalize();
        const off = right.multiplyScalar(dist * (0.16 * o.shift - 0.07));
        S.b.target.add(off);
        S.b.pos.add(off);
      }
      mixShot(out, S.b, easeInOut(rig.explodeCam));
    }

    const ce = cam.init ? 1 - Math.exp(-dt * 9) : 1;
    cam.init = true;
    cam.pos.lerp(out.pos, ce);
    cam.target.lerp(out.target, ce);
    cam.up.lerp(out.up, ce).normalize();
    camera.position.copy(cam.pos);
    camera.up.copy(cam.up);
    camera.lookAt(cam.target);

    /* ------------------------------ lights ------------------------------ */
    const night = 1 - day;
    const L = rig.lights;
    if (spot.current) spot.current.intensity = 3200 * L * night;
    if (rim.current) rim.current.intensity = 6 * L * night;
    if (key.current) key.current.intensity = 4.2 * day;
    if (amb.current) amb.current.intensity = 0.04 + 0.05 * day;
    if (hemi.current) hemi.current.intensity = 1.1 * day;
    scene.environmentIntensity = 0.05 * L * night + 0.55 * day;
    cone.uniforms.uOpacity.value = 0.32 * L * night * (1 - rig.hangar * 0.6);

    {
      const o = 1 - flight;
      (floor.material as THREE.ShaderMaterial).uniforms.uOpacity.value = o;
      floor.visible = o > 0.01;
    }
    if (shadows.current) {
      const o = smooth(0.15, 0.7, rig.title) * (1 - smooth(0.12, 0.3, rig.blueprint)) * (mode === "scan" ? 1 : 0);
      shadows.current.visible = o > 0.01;
      shadows.current.traverse((c) => {
        const m = (c as THREE.Mesh).material as THREE.Material | undefined;
        if (m) m.opacity = o * 0.55;
      });
    }

    if (scanBar.current) {
      const s = air.scan;
      const show = s !== null && s > -20 && s < 21 && (mode === "explode" || (scanP > 0.002 && scanP < 0.998));
      scanBar.current.visible = show;
      if (show && s !== null) scanBar.current.position.set(0, 0.5, s);
    }

    audio.setScene(night * L * (1 - smooth(0.05, 0.2, rig.sky) * 0.5), day * (1 - smooth(0.2, 0.6, rig.title)));
  });

  return (
    <>
      <ambientLight ref={amb} intensity={0.05} />
      <directionalLight ref={key} position={[-40, 55, -35]} intensity={0} color="#fff1df" />
      <hemisphereLight ref={hemi} args={["#d8e7f7", "#a8977f", 0]} />
      <directionalLight ref={rim} position={[40, 6, 10]} intensity={0} color="#e8eef7" />
      <spotLight ref={spot} position={[0, 26, -2]} angle={0.55} penumbra={0.9} decay={2} distance={0} intensity={0} color="#fff6ea">
        <object3D attach="target" position={[0, -4, -1]} />
      </spotLight>
      <mesh position={[0, 11, -2]} material={cone}>
        <coneGeometry args={[15, 30, 48, 1, true]} />
      </mesh>

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 40, 0]} rotation-x={Math.PI / 2} scale={[80, 80, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-50, 10, -10]} rotation-y={Math.PI / 2} scale={[60, 14, 1]} color="#fff1df" />
        <Lightformer form="rect" intensity={1.1} position={[50, 6, 10]} rotation-y={-Math.PI / 2} scale={[60, 10, 1]} color="#dfe9ff" />
        <Lightformer form="rect" intensity={0.6} position={[0, -30, 0]} rotation-x={-Math.PI / 2} scale={[80, 80, 1]} color="#e9e1d4" />
      </Environment>

      <primitive object={air.root} />

      <primitive object={floor} />

      <group ref={shadows}>
        <ContactShadows position={[0, -6, 0]} scale={90} blur={2.8} far={14} resolution={mobile ? 256 : 512} opacity={0.5} color="#3b2f25" />
      </group>

      <Clouds count={mobile ? 40 : 80} opacity={() => (rig.sky > 0.2 ? 1 : 0) * (1 - smooth(0.1, 0.45, rig.title))} />

      <group ref={scanBar} visible={false}>
        <mesh>
          <boxGeometry args={[40, 0.06, 0.07]} />
          <meshBasicMaterial color={PALETTE.accent} toneMapped={false} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}>
          <planeGeometry args={[40, 3]} />
          <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.12} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      <Dimensions air={air} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Dimension lines drawn in the blueprint stage                               */
/* -------------------------------------------------------------------------- */

function Dimensions({ air }: { air: AirlinerRig }) {
  const { geo, total, lenLabel, spanLabel, posLen, posSpan } = useMemo(() => {
    const wing = air.model.bounds.get("wing")!;
    const half = Math.max(Math.abs(wing.min.x), Math.abs(wing.max.x));
    const nose = -18.8;
    const tail = 18.9;
    const xr = half + 4;
    const zb = tail + 4;
    const pts: number[] = [];
    const seg = (a: number[], b: number[]) => pts.push(...a, ...b);
    // length (right side)
    seg([xr, 0, nose], [xr, 0, tail]);
    seg([xr - 0.8, 0, nose], [xr + 0.8, 0, nose]);
    seg([xr - 0.8, 0, tail], [xr + 0.8, 0, tail]);
    seg([2.5, 0, nose], [xr + 1.2, 0, nose]);
    // span (below the tail)
    seg([-half, 0, zb], [half, 0, zb]);
    seg([-half, 0, zb - 0.8], [-half, 0, zb + 0.8]);
    seg([half, 0, zb - 0.8], [half, 0, zb + 0.8]);
    seg([half, 0, 8], [half, 0, zb + 1.2]);
    seg([-half, 0, 8], [-half, 0, zb + 1.2]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return {
      geo,
      total: pts.length / 3,
      lenLabel: `${DIMENSIONS.length.toFixed(1)} m`,
      spanLabel: `${(half * 2).toFixed(1)} m`,
      posLen: [xr + 1.6, 0, 0] as [number, number, number],
      posSpan: [0, 0, zb + 1.8] as [number, number, number],
    };
  }, [air]);
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: PALETTE.accent, transparent: true, toneMapped: false }), []);
  const v = useMemo(() => new V3(), []);
  useEffect(() => {
    rig.dims.len = lenLabel;
    rig.dims.span = spanLabel;
  }, [lenLabel, spanLabel]);

  useFrame(({ camera, size }) => {
    const ui = useUI.getState();
    const d = smooth(0.6, 0.76, rig.blueprint) * (ui.exploded || rig.systems > 0 ? 0 : 1) * (1 - rig.explodeCam);
    const count = Math.floor((total * d) / 2) * 2;
    geo.setDrawRange(0, count);
    mat.opacity = d;
    rig.dims.o = smooth(0.5, 1, d);
    v.set(...posLen).project(camera);
    rig.dims.ax = ((v.x + 1) / 2) * size.width;
    rig.dims.ay = ((1 - v.y) / 2) * size.height;
    v.set(...posSpan).project(camera);
    rig.dims.bx = ((v.x + 1) / 2) * size.width;
    rig.dims.by = ((1 - v.y) / 2) * size.height;
  });

  return <lineSegments geometry={geo} material={mat} />;
}
