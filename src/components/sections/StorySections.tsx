"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, scrollToId } from "@/lib/scroll";
import { rig, smooth } from "@/lib/rig";
import { useUI } from "@/lib/store";
import { explodeAircraft } from "@/lib/explode";
import { ATA_CHAPTERS, PARTS, SYSTEMS } from "@/data/parts";
import { DIMENSIONS } from "@/components/three/model";
import { BRAND } from "@/lib/brand";

const stickyBack = "sticky top-0 h-[100svh] w-full overflow-hidden z-0";
const stickyFront = "sticky top-0 -mt-[100svh] h-[100svh] w-full overflow-hidden z-[2] pointer-events-none";

function track(el: HTMLElement | null, key: "hangar" | "sky" | "title" | "blueprint") {
  ScrollTrigger.create({
    trigger: el,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (s) => {
      rig[key] = s.progress;
    },
    onRefresh: (s) => {
      rig[key] = s.progress;
    },
  });
}

/* -------------------------------------------------------------------------- */
/* 1. Hangar                                                                   */
/* -------------------------------------------------------------------------- */

export function HangarSection() {
  const ref = useRef<HTMLElement>(null);
  const entered = useUI((s) => s.entered);

  useGSAP(
    () => {
      track(ref.current, "hangar");
      gsap
        .timeline({ scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: true } })
        .to("[data-fade]", { opacity: 0, y: -50, stagger: 0.04, ease: "none", duration: 0.35 }, 0.12)
        .to("[data-ghost]", { opacity: 0, yPercent: 12, ease: "none", duration: 0.5 }, 0.1);
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="top" className="relative h-[260vh] text-white">
      <div className={stickyBack} />
      <div className={stickyFront}>
        <div
          className="absolute inset-x-0 bottom-[7vh] text-center transition-opacity duration-[2500ms]"
          style={{ opacity: entered ? 1 : 0, transitionDelay: entered ? "1.6s" : "0s" }}
        >
          <span
            data-ghost
            className="display block text-[10.2vw] leading-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.02) 90%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            AIRFROMNERZA
          </span>
        </div>
        <div
          className="absolute inset-0 transition-opacity duration-[1800ms]"
          style={{ opacity: entered ? 1 : 0, transitionDelay: entered ? "2s" : "0s" }}
        >
          <div data-fade className="eyebrow absolute inset-x-0 top-[17vh] text-center text-white/55">
            {BRAND.tagline}
          </div>
          <p data-fade className="absolute bottom-10 left-4 max-w-[300px] text-[15px] leading-relaxed text-white/70 md:left-10">
            Spare parts for airline fleets, supplied wholesale and retail. {PARTS.length} parts across {SYSTEMS.length} aircraft systems, from the hangar floor to the last O-ring.
          </p>
          <div data-fade className="absolute bottom-10 right-4 flex items-center gap-4 md:right-10">
            <span className="eyebrow text-white/60">Scroll to take off</span>
            <span className="relative block h-10 w-px overflow-hidden bg-white/20">
              <span className="absolute inset-x-0 top-0 h-4 animate-[drop_1.8s_ease-in-out_infinite] bg-white" />
            </span>
          </div>
        </div>
      </div>
      <style>{`@keyframes drop { 0% { transform: translateY(-100%) } 100% { transform: translateY(260%) } }`}</style>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Sky                                                                      */
/* -------------------------------------------------------------------------- */

export function SkySection() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      track(ref.current, "sky");
      gsap
        .timeline({ scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: true } })
        .fromTo("[data-l1]", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.1, ease: "none" }, 0.3)
        .to("[data-l1]", { opacity: 0, y: -40, duration: 0.1, ease: "none" }, 0.5)
        .fromTo("[data-l2]", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.1, ease: "none" }, 0.82)
        .to("[data-l2]", { opacity: 0, y: -40, duration: 0.06, ease: "none" }, 0.94);
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="sky" className="relative h-[420vh]">
      <div className={stickyBack} />
      <div className={stickyFront}>
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <div data-l1 className="absolute bottom-[14vh] text-white [text-shadow:0_2px_30px_rgba(40,60,90,0.35)]">
            <div className="eyebrow text-white/80">Gear up · flaps up</div>
            <div className="display mt-4 text-[clamp(44px,7vw,110px)]">Lift off.</div>
          </div>
          <div data-l2 className="absolute max-w-[820px] text-ink">
            <div className="eyebrow text-ink/60">Flight level 370</div>
            <div className="display mt-4 text-[clamp(30px,4.4vw,68px)]">Above the clouds, every component has a place.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Title — plane flies up between the words                                 */
/* -------------------------------------------------------------------------- */

export function TitleSection() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      track(ref.current, "title");
      gsap
        .timeline({ scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: true } })
        .fromTo("[data-word]", { opacity: 0, y: 70 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.18, ease: "none" }, 0.02)
        .fromTo("[data-meta]", { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.03, duration: 0.15, ease: "none" }, 0.18)
        .to("[data-word], [data-meta]", { opacity: 0, y: -80, stagger: 0.02, duration: 0.16, ease: "none" }, 0.82);
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="explore" className="relative h-[280vh] text-ink">
      <div className={stickyBack}>
        <div className="absolute inset-x-4 top-[17%] md:inset-x-10 md:top-[38%] md:flex md:items-start md:justify-between">
          <div>
            <h2 data-word className="display whitespace-nowrap text-[clamp(52px,8.2vw,170px)]">
              Every part
            </h2>
            <p data-meta className="mt-5 hidden max-w-[230px] text-[clamp(17px,1.6vw,26px)] font-semibold leading-[1.1] md:mt-8 md:block">
              Mapped to where it lives on the aircraft
            </p>
          </div>
          <h2
            data-word
            className="display absolute right-0 top-[52svh] whitespace-nowrap text-right text-[clamp(52px,8.2vw,170px)] md:static"
          >
            in place
          </h2>
        </div>
      </div>
      <div className={stickyFront}>
        <div data-meta className="absolute bottom-10 right-4 hidden w-[min(420px,calc(100%-2rem))] md:right-10 md:block">
          <div className="flex justify-between border-t border-ink/20 pt-3 text-[12px] font-bold uppercase tracking-[0.08em]">
            <span>Narrow-body</span>
            <span>Twin turbofan</span>
          </div>
          <p className="mt-6 text-[15px] leading-relaxed text-ink/80">
            A generic single-aisle airliner stands in as the reference airframe. When the fleet type is confirmed, the catalog and model follow it.
          </p>
        </div>
        <div data-meta className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 md:block">
          <button onClick={() => scrollToId("blueprint")} className="btn pointer-events-auto">
            Inspect the airframe
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] text-white">↓</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Blueprint — the aircraft is redrawn as a technical drawing              */
/* -------------------------------------------------------------------------- */

export function BlueprintSection() {
  const ref = useRef<HTMLElement>(null);
  const readout = useRef<HTMLDivElement>(null);
  const ready = useUI((s) => s.drawingReady);
  const exploded = useUI((s) => s.exploded);

  useGSAP(
    () => {
      track(ref.current, "blueprint");
      gsap
        .timeline({ scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: true } })
        .fromTo("[data-spec]", { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.025, duration: 0.12, ease: "none" }, 0.1)
        .to("[data-spec]", { opacity: 0, y: -30, stagger: 0.01, duration: 0.06, ease: "none" }, 0.94);
      const tick = () => {
        if (!readout.current) return;
        const p = smooth(0.3, 0.62, rig.blueprint);
        const show = p > 0.001 && p < 0.999;
        readout.current.style.opacity = show ? "1" : "0";
        readout.current.textContent = `Converting to technical drawing — ${Math.round(p * 100)
          .toString()
          .padStart(3, "0")}%`;
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope: ref },
  );

  const stats: [string, string][] = [
    ["Parts catalogued", String(PARTS.length)],
    ["Aircraft systems", String(SYSTEMS.length)],
    ["ATA chapters", String(ATA_CHAPTERS)],
    ["Part categories", "4"],
    ["Overall length", `${DIMENSIONS.length} m`],
    ["Wingspan", `${DIMENSIONS.span} m`],
  ];

  return (
    <section ref={ref} id="blueprint" className="relative h-[380vh] text-ink">
      <div className={`${stickyBack} transition-opacity duration-700 ${exploded ? "opacity-0" : "opacity-100"}`}>
        <div data-spec className="absolute left-4 top-[15vh] md:left-10">
          <div className="eyebrow text-ink/60">Reference airframe</div>
          <div className="display mt-3 text-[clamp(40px,5.6vw,96px)]">Narrow-body</div>
        </div>
        <div data-spec className="absolute right-4 top-[15vh] hidden max-w-[300px] text-right md:right-10 md:block">
          <div className="eyebrow text-ink/60">Single aisle · twin engine</div>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/75">
            Every area of the drawing links to catalogued spare parts. Hover to see what sits beneath the skin.
          </p>
        </div>
        <dl className="absolute bottom-10 left-4 hidden grid-cols-2 md:grid gap-x-10 gap-y-5 md:left-10">
          {stats.map(([k, v]) => (
            <div key={k} data-spec>
              <dt className="eyebrow text-[10px] text-ink/50">{k}</dt>
              <dd className="mt-1 text-[clamp(18px,1.7vw,26px)] font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <table data-spec className="mono absolute bottom-10 right-4 hidden border border-ink/25 text-[10.5px] text-ink/70 md:right-10 md:table">
          <tbody>
            {[
              ["DWG", "AF-NB-000"],
              ["TITLE", "General arrangement"],
              ["SCALE", "NTS"],
              ["REV", "A — demo"],
            ].map(([a, b]) => (
              <tr key={a} className="border-b border-ink/15 last:border-0">
                <td className="border-r border-ink/15 px-3 py-1.5 tracking-[0.14em]">{a}</td>
                <td className="px-3 py-1.5">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={stickyFront}>
        <div ref={readout} className="mono absolute inset-x-0 top-[24vh] text-center text-[11px] tracking-[0.18em] text-accent opacity-0 transition-opacity" />
        <div
          className={`absolute inset-x-0 bottom-[4vh] flex flex-col items-center gap-3 transition-all duration-700 md:inset-x-auto md:bottom-auto md:right-10 md:top-[46vh] md:items-end ${
            ready && !exploded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <span className="eyebrow rounded-full bg-paper/80 px-3 py-1.5 text-ink/70 backdrop-blur">
            <span className="hidden md:inline">Hover</span>
            <span className="md:hidden">Drag over</span> the drawing to x-ray it
          </span>
          <button onClick={explodeAircraft} className={`btn btn-dark ${ready && !exploded ? "pointer-events-auto" : ""}`}>
            Explore parts
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-[12px]">✦</span>
          </button>
        </div>
      </div>
    </section>
  );
}
