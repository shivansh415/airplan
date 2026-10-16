"use client";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";

/** Soft cumulus puff: many overlapping blobs, lit from above. */
function makePuffTexture(seed0: number) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  let seed = seed0;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const blobs: [number, number, number][] = [];
  for (let i = 0; i < 34; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.7) * 70;
    blobs.push([128 + Math.cos(a) * d * 1.25, 140 + Math.sin(a) * d * 0.5 - rand() * 18, 22 + rand() * 38]);
  }
  // shadowed underside first, bright tops on top
  for (const pass of [0, 1]) {
    for (const [x, y, r] of blobs) {
      const oy = pass === 0 ? 8 : -4;
      const grd = g.createRadialGradient(x, y + oy, 0, x, y + oy, r);
      const col = pass === 0 ? "196,204,216" : "255,255,255";
      const a = pass === 0 ? 0.28 : 0.34;
      grd.addColorStop(0, `rgba(${col},${a})`);
      grd.addColorStop(0.6, `rgba(${col},${a * 0.5})`);
      grd.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y + oy, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type Props = {
  count: number;
  /** returns 0..1 visibility for this frame */
  opacity: () => number;
};

/** A sea of clouds below the aircraft, streaming aft to sell speed, plus a few wisps up close. */
export function Clouds({ count, opacity }: Props) {
  const { group, sprites } = useMemo(() => {
    const textures = [makePuffTexture(7), makePuffTexture(91), makePuffTexture(313)];
    const group = new THREE.Group();
    const sprites: { s: THREE.Sprite; base: number; speed: number }[] = [];
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      const deck = i < count * 0.8;
      const mat = new THREE.SpriteMaterial({
        map: textures[i % 3],
        transparent: true,
        depthWrite: false,
        opacity: 0,
        fog: false,
      });
      const s = new THREE.Sprite(mat);
      if (deck) {
        s.position.set((rand() - 0.5) * 260, -16 - rand() * 22, -190 + rand() * 300);
        const sc = 45 + rand() * 60;
        s.scale.set(sc, sc * 0.55, 1);
      } else {
        // wisps passing beside / above the aircraft
        const side = rand() > 0.5 ? 1 : -1;
        s.position.set(side * (26 + rand() * 40), -6 + rand() * 14, -160 + rand() * 260);
        const sc = 18 + rand() * 22;
        s.scale.set(sc, sc * 0.5, 1);
      }
      group.add(s);
      sprites.push({ s, base: deck ? 0.75 + rand() * 0.25 : 0.35 + rand() * 0.3, speed: deck ? 16 : 34 });
    }
    return { group, sprites };
  }, [count]);

  useFrame((_, dt) => {
    const o = opacity();
    group.visible = o > 0.005;
    if (!group.visible) return;
    for (const c of sprites) {
      (c.s.material as THREE.SpriteMaterial).opacity = o * c.base;
      c.s.position.z += c.speed * Math.min(dt, 0.05);
      if (c.s.position.z > 110) c.s.position.z -= 300;
    }
  });

  return <primitive object={group} />;
}
