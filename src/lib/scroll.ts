"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let instance: Lenis | null = null;

export function startLenis() {
  if (instance) return instance;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lenis = new Lenis({ lerp: reduced ? 1 : 0.085, smoothWheel: !reduced, wheelMultiplier: 0.9 });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  (lenis as Lenis & { _tick?: typeof tick })._tick = tick;
  instance = lenis;
  if (process.env.NODE_ENV !== "production") Object.assign(window, { __lenis: lenis });
  return lenis;
}

export function stopLenis() {
  if (!instance) return;
  const tick = (instance as Lenis & { _tick?: (t: number) => void })._tick;
  if (tick) gsap.ticker.remove(tick);
  instance.destroy();
  instance = null;
}

export const getLenis = () => instance;

export function scrollToId(id: string, offset = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) instance.scrollTo(el, { offset, duration: 2.2 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export { gsap, ScrollTrigger };
