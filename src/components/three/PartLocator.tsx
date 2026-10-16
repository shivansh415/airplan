"use client";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { AirlinerRig } from "./AirlinerRig";
import type { Anchor } from "@/data/parts";

function Locator({ anchor }: { anchor: Anchor }) {
  const air = useMemo(() => {
    const a = new AirlinerRig();
    a.scan = null;
    a.snap((id) => (id === anchor ? { solid: 1, bp: 0, highlight: 0.55 } : { solid: 0, bp: 0.65, fill: 0.04 }));
    return a;
  }, [anchor]);
  useEffect(() => () => air.dispose(), [air]);
  const focus = useMemo(() => air.focusOf([anchor]), [air, anchor]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    air.update(
      dt,
      t,
      (id) => (id === anchor ? { solid: 1, bp: 0, highlight: 0.35 + Math.sin(t * 2) * 0.2 } : { solid: 0, bp: 0.65, fill: 0.04 }),
      0.2,
    );
    const az = -2.2 + Math.sin(t * 0.18) * 0.9;
    const el = 0.42;
    const target = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), focus.center, 0.6);
    const dist = 47;
    state.camera.position.set(
      target.x + Math.sin(az) * Math.cos(el) * dist,
      target.y + Math.sin(el) * dist,
      target.z + Math.cos(az) * Math.cos(el) * dist,
    );
    state.camera.lookAt(target);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[-30, 50, -20]} intensity={2.2} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 40, 0]} rotation-x={Math.PI / 2} scale={[80, 80, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-50, 10, -10]} rotation-y={Math.PI / 2} scale={[60, 14, 1]} />
      </Environment>
      <primitive object={air.root} />
    </>
  );
}

export default function PartLocator({ anchor }: { anchor: Anchor }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 30, near: 0.5, far: 1000, position: [-40, 30, -40] }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.setClearColor(0x000000, 0);
      }}
    >
      <Locator anchor={anchor} />
    </Canvas>
  );
}
