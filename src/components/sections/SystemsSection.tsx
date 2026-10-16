"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, scrollToId } from "@/lib/scroll";
import { rig } from "@/lib/rig";
import { useUI } from "@/lib/store";
import { SYSTEMS, partsBySystem, type System } from "@/data/parts";
import { PartRow } from "@/components/PartCard";

/** Scroll tour: one chapter per aircraft system; the 3D camera flies to each. */
export function SystemsSection() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top center",
        end: "bottom center",
        onUpdate: (s) => {
          rig.systems = s.progress;
        },
        onRefresh: (s) => {
          rig.systems = s.progress;
        },
      });
      gsap.utils.toArray<HTMLElement>("[data-chapter]").forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll("[data-rise]"),
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.06,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 65%", toggleActions: "play none none reverse" },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="systems" className="relative z-[2]">
      {SYSTEMS.map((s, i) => (
        <Chapter key={s.id} system={s} index={i} />
      ))}
    </section>
  );
}

function Chapter({ system, index }: { system: System; index: number }) {
  const parts = partsBySystem(system.id);
  const set = useUI((s) => s.set);
  const shown = parts.slice(0, 5);

  const openCatalog = () => {
    set({ catalogSystem: system.id });
    scrollToId("catalog");
  };

  return (
    <article data-chapter className="relative flex min-h-[100svh] items-end md:items-center">
      <div
        className="pointer-events-none absolute inset-0 md:hidden"
        style={{ background: "linear-gradient(180deg, rgba(236,229,218,0) 38%, rgba(236,229,218,0.92) 58%, #ece5da 100%)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55%] md:block"
        style={{ background: "linear-gradient(90deg, rgba(236,229,218,0.96) 0%, rgba(236,229,218,0.86) 58%, rgba(236,229,218,0) 100%)" }}
      />
      <div className="relative w-full px-4 pb-10 pt-[50svh] md:w-[44%] md:max-w-[560px] md:px-10 md:py-24">
        {index === 0 && (
          <div data-rise className="eyebrow mb-10 text-ink/50">
            Systems tour — {SYSTEMS.length} chapters
          </div>
        )}
        <div data-rise className="mono flex items-center gap-3 text-[11px] text-ink/55">
          <span>
            {String(index + 1).padStart(2, "0")} / {SYSTEMS.length}
          </span>
          <span className="h-px w-10 bg-ink/25" />
          <span>{system.ata}</span>
        </div>
        <h3 data-rise className="display mt-4 text-[clamp(34px,4.2vw,64px)]">
          {system.name}
        </h3>
        <p data-rise className="mt-4 text-[clamp(17px,1.4vw,21px)] font-semibold leading-snug">
          {system.tagline}
        </p>
        <p data-rise className="mt-3 max-w-[440px] text-[15px] leading-relaxed text-ink/70">
          {system.description}
        </p>
        <div data-rise className="mt-7 space-y-0.5">
          {shown.map((p) => (
            <PartRow key={p.id} part={p} />
          ))}
        </div>
        <button
          data-rise
          onMouseEnter={() => set({ focus: null })}
          onClick={openCatalog}
          className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold underline decoration-ink/30 underline-offset-[6px] hover:decoration-ink"
        >
          All {parts.length} {system.name.toLowerCase()} parts in the catalog →
        </button>
      </div>
    </article>
  );
}
