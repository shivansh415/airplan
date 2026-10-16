"use client";

import { gsap, getLenis } from "./scroll";
import { rig } from "./rig";
import { useUI } from "./store";
import { audio } from "./audio";

let tl: gsap.core.Timeline | null = null;

/** Blueprint → solid, camera swings to three-quarter, every part floats apart. */
export function explodeAircraft() {
  const { set } = useUI.getState();
  set({ exploded: true, selected: null, hovered: null });
  getLenis()?.stop();
  audio.whoosh(1.8, true);
  Object.assign(rig.orbit, { az: 0, el: 0, taz: 0, tel: 0, zoom: 1, tzoom: 1 });
  tl?.kill();
  tl = gsap
    .timeline()
    .to(rig, { scanOverride: -60, duration: 1.5, ease: "power2.inOut" }, 0)
    .to(rig, { explodeCam: 1, duration: 2, ease: "power3.inOut" }, 0.15)
    .to(rig, { explode: 1, duration: 2.2, ease: "expo.inOut" }, 0.55);
}

/** Parts fly home, camera returns, the drawing is redrawn. */
export function reassembleAircraft() {
  const { set } = useUI.getState();
  set({ selected: null, hovered: null, focus: null });
  audio.whoosh(1.5, false);
  tl?.kill();
  tl = gsap
    .timeline({
      onComplete: () => {
        set({ exploded: false });
        getLenis()?.start();
      },
    })
    .to(rig, { explode: 0, duration: 1.7, ease: "expo.inOut" }, 0)
    .to(rig, { explodeCam: 0, duration: 1.7, ease: "power3.inOut" }, 0.45)
    .to(rig, { scanOverride: 21.5, duration: 1.4, ease: "power2.inOut" }, 1.2);
}
