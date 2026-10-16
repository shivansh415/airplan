"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/scroll";
import { rig, smooth } from "@/lib/rig";
import { useUI } from "@/lib/store";

/**
 * Fixed colour field behind the WebGL canvas:
 * black hangar → sky → dawn cream (title) → drawing paper.
 */
export function Backdrop() {
  const dark = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const dawn = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => {
      // hard cut from hangar to sky, hidden by the light flood
      const d = rig.sky > 0.2 ? 0 : 1;
      if (flash.current) {
        const f = smooth(0.07, 0.19, rig.sky) * (1 - smooth(0.23, 0.4, rig.sky));
        flash.current.style.opacity = String(f);
        flash.current.style.transform = `scale(${1 + (1 - f) * 0.25})`;
      }
      if (dark.current) dark.current.style.opacity = String(d);
      if (glow.current) glow.current.style.opacity = String(rig.lights * (1 - rig.hangar * 0.5));
      if (sky.current) sky.current.style.opacity = String(1 - smooth(0.7, 1, rig.sky));
      if (dawn.current) dawn.current.style.opacity = String(1 - smooth(0.05, 0.35, rig.blueprint));
      if (grid.current)
        grid.current.style.opacity = String(smooth(0.2, 0.45, rig.blueprint) * (1 - 0.55 * smooth(0, 0.05, rig.systems)));
      const isDark = d > 0.5;
      if (useUI.getState().dark !== isDark) useUI.getState().set({ dark: isDark });
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <>
    <div
      ref={flash}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[4] opacity-0"
      style={{
        background:
          "radial-gradient(70% 60% at 45% 55%, #ffffff 0%, #fbfaf7 35%, rgba(246,243,236,0.96) 60%, rgba(236,232,224,0.9) 100%)",
      }}
    />
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-paper" />
      <div ref={grid} className="paper-grid absolute inset-0 opacity-0" />
      <div
        ref={dawn}
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, #b7cfdf 0%, #d9dcd8 34%, #ebe3d8 62%, #f3ede5 100%)" }}
      />
      <div
        ref={sky}
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, #6f9fc6 0%, #9cc0db 38%, #cddbe2 72%, #ece4d9 100%)" }}
      />
      <div ref={dark} className="absolute inset-0 bg-hangar">
        <div
          ref={glow}
          className="absolute inset-0 opacity-0"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 36%, rgba(120,124,132,0.42) 0%, rgba(40,42,46,0.25) 45%, rgba(5,5,5,0) 75%), radial-gradient(40% 12% at 50% 74%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 100%)",
          }}
        />
      </div>
    </div>
    </>
  );
}
