"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, getLenis } from "@/lib/scroll";
import { rig } from "@/lib/rig";
import { useUI } from "@/lib/store";
import { audio } from "@/lib/audio";
import { PLANFORM_PATHS } from "@/lib/planform";
import { PARTS, SYSTEMS } from "@/data/parts";
import { BRAND } from "@/lib/brand";
import { LanguageSwitcher, useT } from "@/i18n/client";

const STATUS_KEYS = ["gate.status1", "gate.status2", "gate.status3", "gate.status4", "gate.status5"] as const;
const DOTS = 28;

/**
 * Preloader: the aircraft is drafted line by line on a dark grid while the
 * scene loads, then the screen opens like hangar doors and the lights come on.
 */
export function Gate() {
  const [ready, setReady] = useState(false);
  // already entered earlier in this visit (e.g. back from a part page)
  const [gone, setGone] = useState(() => useUI.getState().entered);
  const set = useUI((s) => s.set);
  const tr = useT();
  const trRef = useRef(tr);
  useEffect(() => {
    trRef.current = tr;
  }, [tr]);
  const statusText = (i: number) =>
    trRef.current.t(STATUS_KEYS[Math.min(STATUS_KEYS.length - 1, i)], { parts: PARTS.length, systems: SYSTEMS.length });
  const paths = PLANFORM_PATHS;

  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const dots = useRef<HTMLDivElement>(null);
  const doorL = useRef<HTMLDivElement>(null);
  const doorR = useRef<HTMLDivElement>(null);
  const seam = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gone) return;
    const start = performance.now();
    const p = { v: 0 };
    let done = false;
    let builtAt = 0;
    const tick = () => {
      // Real progress (airliner build) with a short minimum so the drawing always plays.
      const now = performance.now();
      const tp = Math.min(1, (now - start) / 2200);
      if (rig.loadProgress >= 1 && !builtAt) builtAt = now;
      // never hang: if frames don't report in (slow GPU, no WebGL) carry on shortly after the build
      const ready = rig.ready || (builtAt > 0 && now - builtAt > 2500) || now - start > 15000;
      const target = ready ? tp : Math.min(tp, 0.08 + 0.84 * rig.loadProgress);
      const dt = Math.min(0.5, gsap.ticker.deltaRatio() / 60);
      p.v += (target - p.v) * (1 - Math.exp(-dt * 4.5));
      const v = target >= 1 && p.v > 0.97 ? 1 : p.v;
      if (counter.current) counter.current.textContent = String(Math.round(v * 100)).padStart(3, "0");
      if (status.current) status.current.textContent = statusText(Math.floor(v * STATUS_KEYS.length));
      svg.current?.querySelectorAll<SVGPathElement>("path[data-draw]").forEach((el, i) => {
        const local = Math.min(1, Math.max(0, (v - i * 0.035) / 0.55));
        el.style.strokeDashoffset = String(1 - local);
      });
      dots.current?.querySelectorAll<HTMLSpanElement>("span").forEach((el, i) => {
        const on = v * DOTS > i;
        el.style.opacity = on ? "1" : "0.18";
        el.style.boxShadow = on ? "0 0 10px 2px rgba(255,236,190,0.55)" : "none";
      });
      if (v === 1 && !done) {
        done = true;
        svg.current?.classList.add("is-done");
        setReady(true);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [gone]);

  // keep keyboard focus inside the preloader while it covers the page
  useEffect(() => {
    if (gone || !root.current?.parentElement) return;
    const behind = [...root.current.parentElement.children].filter((el) => el !== root.current);
    behind.forEach((el) => el.setAttribute("inert", ""));
    return () => behind.forEach((el) => el.removeAttribute("inert"));
  }, [gone]);

  const entering = useRef(false);
  const enter = (withSound: boolean) => {
    if (!ready || entering.current) return;
    entering.current = true;
    audio.setEnabled(withSound);
    set({ entered: true, sound: withSound });
    if (withSound) {
      audio.clunk(0.7);
      audio.whoosh(2.2, false);
    }
    const tl = gsap.timeline({ onComplete: () => setGone(true) });
    tl.to(content.current, { opacity: 0, y: -24, duration: 0.6, ease: "power2.in" }, 0)
      .fromTo(seam.current, { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.35)
      .to(doorL.current, { xPercent: -101, duration: 1.8, ease: "expo.inOut" }, 0.75)
      .to(doorR.current, { xPercent: 101, duration: 1.8, ease: "expo.inOut" }, 0.75)
      .to(seam.current, { scaleX: 60, opacity: 0, duration: 1.2, ease: "power2.out" }, 0.85);

    // hangar lights: flicker, flicker, on
    const L = (at: number, v: number, d: number, s?: number) =>
      tl.to(
        rig,
        {
          lights: v,
          duration: d,
          ease: "none",
          onStart: () => {
            if (s) audio.clunk(s);
          },
        },
        at,
      );
    L(1.9, 0.35, 0.04, 0.6);
    L(1.94, 0.05, 0.12);
    L(2.12, 0.6, 0.04, 0.8);
    L(2.16, 0.15, 0.18);
    L(2.6, 1, 0.05, 1);
    tl.add(() => {
      const lenis = getLenis();
      lenis?.start();
      // deep link such as /#catalog: go there once the doors are open
      const hash = window.location.hash.slice(1);
      if (lenis && hash && document.getElementById(hash)) lenis.scrollTo(`#${hash}`, { duration: 1.6 });
    }, 2.7);
  };

  if (gone) return null;

  const grid =
    "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)";
  const door = "absolute inset-y-0 w-1/2 overflow-hidden bg-[#050505]";

  return (
    <div ref={root} className="fixed inset-0 z-[80] text-white">
      {/* hangar doors */}
      <div ref={doorL} className={`${door} left-0 border-r border-white/5`}>
        <div className="absolute inset-0 w-[200%]" style={{ backgroundImage: grid, backgroundSize: "120px 120px,120px 120px,24px 24px,24px 24px", backgroundPosition: "center" }} />
      </div>
      <div ref={doorR} className={`${door} right-0`}>
        <div className="absolute inset-0 -left-full w-[200%]" style={{ backgroundImage: grid, backgroundSize: "120px 120px,120px 120px,24px 24px,24px 24px", backgroundPosition: "center" }} />
      </div>
      <div
        ref={seam}
        className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 opacity-0"
        style={{ background: "linear-gradient(180deg, transparent, #fff 20%, #fff 80%, transparent)", boxShadow: "0 0 40px 10px rgba(255,248,230,0.6)" }}
      />

      <div ref={content} className="absolute inset-0">
        {/* corner marks */}
        {[
          "left-5 top-5 border-l border-t",
          "right-5 top-5 border-r border-t",
          "left-5 bottom-5 border-l border-b",
          "right-5 bottom-5 border-r border-b",
        ].map((c) => (
          <span key={c} className={`absolute h-5 w-5 border-white/30 ${c}`} />
        ))}
        <div className="mono absolute left-9 top-8 text-[10px] tracking-[0.18em] text-white/40">
          I ARCH TECH / AIRCRAFT SPARE PARTS
          <br />
          DWG AF-NB-000 · REV A
        </div>
        <LanguageSwitcher className="absolute bottom-24 left-9 text-white/80 md:bottom-auto md:left-auto md:right-9 md:top-24" />
        <div className="mono absolute right-9 top-8 hidden text-right text-[10px] tracking-[0.18em] text-white/40 sm:block">
          N 24°26′ · E 54°39′
          <br />
          HANGAR 03 · BAY 2
        </div>

        {/* crosshair */}
        <span className="absolute inset-x-0 top-1/2 h-px bg-white/[0.06]" />
        <span className="absolute inset-y-0 left-1/2 w-px bg-white/[0.06]" />

        {/* the drawing */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg ref={svg} viewBox="-21 -20.5 42 41" className="gate-plane h-[min(54vh,72vw)] w-[min(54vh,72vw)] overflow-visible">
            {paths.map((d, i) => (
              <path
                key={i}
                data-draw
                d={d}
                pathLength={1}
                fill="none"
                stroke="white"
                strokeWidth={0.07}
                strokeLinejoin="round"
                style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
              />
            ))}
          </svg>
        </div>

        {/* readouts */}
        <div className="absolute bottom-10 left-9 md:bottom-12">
          <div className="eyebrow text-white/45">
            <span ref={status}>{tr.t("gate.status1")}</span>
            <span className="ml-1 inline-block animate-pulse">_</span>
          </div>
          <div ref={dots} className="mt-4 flex gap-[7px]">
            {Array.from({ length: DOTS }, (_, i) => (
              <span key={i} className="block h-[5px] w-[5px] rounded-full bg-[#ffe9b8] opacity-20 transition-[opacity,box-shadow] duration-300" />
            ))}
          </div>
        </div>
        <div className="absolute bottom-6 right-9 text-right md:bottom-8">
          <span ref={counter} className="display block text-[clamp(64px,10vw,150px)] font-light leading-none tabular-nums text-white/90">
            000
          </span>
        </div>

        {/* title + enter */}
        <div className="absolute inset-x-0 top-[8vh] text-center">
          <div className="eyebrow text-white/45">{tr.t("brand.company")}</div>
          <h1 className="display mt-4 text-[clamp(38px,6vw,92px)] font-light">{BRAND.name}</h1>
          <div className="mt-3 text-[14px] text-white/50">{tr.t("brand.tagline")}</div>
        </div>
        <div
          className={`absolute inset-x-0 bottom-[15vh] flex flex-col items-center gap-4 transition-all duration-700 sm:flex-row sm:justify-center md:bottom-[17vh] ${
            ready ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
          }`}
        >
          <button onClick={() => enter(true)} disabled={!ready} className="btn">
            {tr.t("gate.enterSound")}
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] text-white">♪</span>
          </button>
          <button onClick={() => enter(false)} disabled={!ready} className="text-[14px] font-semibold text-white/55 transition-colors hover:text-white">
            {tr.t("gate.enterSilent")}
          </button>
        </div>
      </div>

      <style>{`
        .gate-plane path { transition: stroke 1.2s, filter 1.2s; }
        .gate-plane.is-done path { stroke: #fff; filter: drop-shadow(0 0 6px rgba(255,240,210,0.6)); }
      `}</style>
    </div>
  );
}
