"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { Experience } from "./three/Experience";
import { useUI } from "@/lib/store";

export default function HomeCanvas() {
  const covered = useUI((s) => s.covered);
  const [mobile] = useState(() => window.innerWidth < 768);

  return (
    <Canvas
      style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}
      frameloop={covered ? "never" : "always"}
      dpr={mobile ? [1, 1.5] : [1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.5, far: 2000, position: [-55, -1.4, 6] }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.setClearColor(0x000000, 0);
      }}
    >
      <Suspense fallback={null}>
        <Experience mobile={mobile} />
      </Suspense>
    </Canvas>
  );
}
