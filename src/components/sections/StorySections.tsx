"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, scrollToId } from "@/lib/scroll";
import { rig, smooth } from "@/lib/rig";
import { useUI } from "@/lib/store";
import { explodeAircraft } from "@/lib/explode";
import { ATA_CHAPTERS, PARTS, SYSTEMS } from "@/data/parts";
import { DIMENSIONS } from "@/components/three/model";
import { useT } from "@/i18n/client";
import { takeOff } from "@/lib/takeoff";

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
  const { t } = useT();
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
          className="absolute inset-x-0 bottom-[17vh] text-center transition-opacity duration-[2500ms] md:bottom-[15vh]"
          style={{ opacity: entered ? 1 : 0, transitionDelay: entered ? "1.6s" : "0s" }}
        >
          <span
            data-ghost
            className="display block whitespace-nowrap text-[10vw] leading-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.02) 90%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            I ARCH TECH
          </span>
        </div>
        <div
          className="absolute inset-0 transition-opacity duration-[1800ms]"
          style={{ opacity: entered ? 1 : 0, transitionDelay: entered ? "2s" : "0s" }}
        >
          <div data-fade className="eyebrow absolute inset-x-0 top-[17vh] text-center text-white/55">
            {t("brand.tagline")}
          </div>
          <p data-fade className="absolute bottom-10 start-4 hidden max-w-[300px] text-[15px] leading-relaxed text-white/70 md:start-10 md:block">
            {t("hangar.body", { parts: PARTS.length, systems: SYSTEMS.length })}
          </p>

          {/* tap the aircraft: pulsing hotspot just under the plane */}
          <button
            data-fade
            onClick={takeOff}
            className="pointer-events-auto absolute left-1/2 top-[60vh] flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/[0.07] py-2 pe-4 ps-2 text-[13px] font-semibold text-white/85 ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-white/15 md:top-[62vh]"
          >
            <span className="relative grid h-7 w-7 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            {t("hangar.tap")}
          </button>

          {/* scroll cue */}
          <div data-fade className="absolute inset-x-0 bottom-[4vh] flex flex-col items-center gap-3 md:bottom-8">
            <span className="relative block h-11 w-[26px] rounded-full border-[1.5px] border-white/70">
              <span className="absolute left-1/2 top-2 h-2 w-[3px] -translate-x-1/2 animate-[wheel_1.6s_ease-in-out_infinite] rounded-full bg-white" />
            </span>
            <span className="eyebrow text-white/80">{t("hangar.cue")}</span>
            <span className="flex flex-col items-center -space-y-1.5 text-white/50" aria-hidden>
              <span className="animate-[chev_1.6s_ease-in-out_infinite] text-[13px]">⌄</span>
              <span className="animate-[chev_1.6s_ease-in-out_0.2s_infinite] text-[13px]">⌄</span>
            </span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes wheel { 0% { transform: translate(-50%, 0); opacity: 1 } 70% { transform: translate(-50%, 12px); opacity: 0 } 100% { transform: translate(-50%, 0); opacity: 0 } }
        @keyframes chev { 0%, 100% { opacity: 0.2; transform: translateY(-2px) } 50% { opacity: 1; transform: translateY(2px) } }
      `}</style>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Sky                                                                      */
/* -------------------------------------------------------------------------- */

export function SkySection() {
  const ref = useRef<HTMLElement>(null);
  const { t } = useT();
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
            <div className="eyebrow text-white/80">{t("sky.l1eyebrow")}</div>
            <div className="display mt-4 text-[clamp(44px,7vw,110px)]">{t("sky.l1")}</div>
          </div>
          <div data-l2 className="absolute max-w-[820px] text-ink">
            <div className="eyebrow text-ink/60">{t("sky.l2eyebrow")}</div>
            <div className="display mt-4 text-[clamp(30px,4.4vw,68px)]">{t("sky.l2")}</div>
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
  const { t } = useT();
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
              {t("title.left")}
            </h2>
            <p data-meta className="mt-5 hidden max-w-[230px] text-[clamp(17px,1.6vw,26px)] font-semibold leading-[1.1] md:mt-8 md:block">
              {t("title.sub")}
            </p>
          </div>
          <h2
            data-word
            className="display absolute right-0 top-[52svh] whitespace-nowrap text-right text-[clamp(52px,8.2vw,170px)] md:static"
          >
            {t("title.right")}
          </h2>
        </div>
      </div>
      <div className={stickyFront}>
        <div data-meta className="absolute bottom-10 right-4 hidden w-[min(420px,calc(100%-2rem))] md:right-10 md:block">
          <div className="flex justify-between border-t border-ink/20 pt-3 text-[12px] font-bold uppercase tracking-[0.08em]">
            <span>{t("title.meta1")}</span>
            <span>{t("title.meta2")}</span>
          </div>
          <p className="mt-6 text-[15px] leading-relaxed text-ink/80">
            {t("title.body")}
          </p>
        </div>
        <div data-meta className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 md:block">
          <button onClick={() => scrollToId("blueprint")} className="btn pointer-events-auto">
            {t("title.cta")}
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
  const tr = useT();
  const { t } = tr;
  const trRef = useRef(tr);
  useEffect(() => {
    trRef.current = tr;
  }, [tr]);

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
        readout.current.textContent = trRef.current.t("bp.converting", { p: Math.round(p * 100).toString().padStart(3, "0") });
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope: ref },
  );

  const stats: [string, string][] = [
    [t("bp.stat.parts"), String(PARTS.length)],
    [t("bp.stat.systems"), String(SYSTEMS.length)],
    [t("bp.stat.ata"), String(ATA_CHAPTERS)],
    [t("bp.stat.categories"), "4"],
    [t("bp.stat.length"), `${DIMENSIONS.length} m`],
    [t("bp.stat.span"), `${DIMENSIONS.span} m`],
  ];

  return (
    <section ref={ref} id="blueprint" className="relative h-[380vh] text-ink">
      <div className={`${stickyBack} transition-opacity duration-700 ${exploded ? "opacity-0" : "opacity-100"}`}>
        <div data-spec className="absolute left-4 top-[15vh] md:left-10">
          <div className="eyebrow text-ink/60">{t("bp.eyebrow")}</div>
          <div className="display mt-3 text-[clamp(40px,5.6vw,96px)]">{t("bp.title")}</div>
        </div>
        <div data-spec className="absolute right-4 top-[15vh] hidden max-w-[300px] text-right md:right-10 md:block">
          <div className="eyebrow text-ink/60">{t("bp.rightEyebrow")}</div>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/75">{t("bp.rightBody")}</p>
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
            <span className="hidden md:inline">{t("bp.hintHover")}</span>
            <span className="md:hidden">{t("bp.hintTouch")}</span>
          </span>
          <button onClick={explodeAircraft} className={`btn btn-dark ${ready && !exploded ? "pointer-events-auto" : ""}`}>
            {t("bp.explore")}
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-[12px]">✦</span>
          </button>
        </div>
      </div>
    </section>
  );
}
