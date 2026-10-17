"use client";

import { getLenis } from "./scroll";
import { useUI } from "./store";

let flying = false;

/**
 * Tap / click on the aircraft in the hangar: play the whole take-off sequence
 * (orbit, push-in, light flood, flight, top view) as one cinematic scroll and
 * land with the plane between the "Every part / in place" words.
 */
export function takeOff() {
  const ui = useUI.getState();
  const lenis = getLenis();
  const target = document.getElementById("explore");
  if (!ui.entered || ui.exploded || flying || !lenis || !target) return;
  const top = target.getBoundingClientRect().top + window.scrollY;
  const y = top + 0.62 * (target.offsetHeight - window.innerHeight);
  if (window.scrollY >= y - 10) return;
  flying = true;
  lenis.scrollTo(y, {
    duration: 7.5,
    // slow start, steady climb, gentle settle
    easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    lock: true,
    onComplete: () => {
      flying = false;
    },
  });
  // safety: release the flag even if the scroll is interrupted
  window.setTimeout(() => (flying = false), 9000);
}
