"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "@/lib/scroll";
import { rig } from "@/lib/rig";
import { useUI } from "@/lib/store";
import { CATEGORY_INFO, PARTS, SYSTEMS, systemById, type PartCategory } from "@/data/parts";
import { PartCard } from "@/components/PartCard";

const CATEGORIES = Object.keys(CATEGORY_INFO) as PartCategory[];

export function CatalogSection() {
  const ref = useRef<HTMLElement>(null);
  const system = useUI((s) => s.catalogSystem);
  const set = useUI((s) => s.set);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PartCategory | "all">("all");
  const q = useDeferredValue(query.trim().toLowerCase());

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top bottom",
        end: "top top",
        onUpdate: (s) => {
          rig.catalog = s.progress;
        },
      });
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top top",
        end: "bottom top",
        onToggle: (s) => useUI.getState().set({ covered: s.isActive }),
      });
    },
    { scope: ref },
  );

  const results = useMemo(
    () =>
      PARTS.filter(
        (p) =>
          (system === "all" || p.system === system) &&
          (category === "all" || p.category === category) &&
          (!q ||
            p.name.toLowerCase().includes(q) ||
            p.partNumber.toLowerCase().includes(q) ||
            p.ata.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            systemById(p.system).name.toLowerCase().includes(q)),
      ),
    [q, system, category],
  );

  return (
    <section ref={ref} id="catalog" className="relative z-[5] bg-paper text-ink">
      <div className="mx-auto max-w-[1480px] px-4 pb-16 pt-28 md:px-10 md:pt-36">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="eyebrow text-ink/55">Parts catalog</div>
            <h2 className="display mt-4 text-[clamp(48px,8vw,140px)]">The catalog</h2>
          </div>
          <p className="max-w-[380px] text-[15px] leading-relaxed text-ink/70">
            Search by name, ATA chapter or demo part number. Filter by aircraft system or part category. Open any part for its full sheet.
          </p>
        </div>

        <div className="sticky top-[var(--header-h,84px)] z-10 -mx-4 mt-12 bg-paper/90 px-4 py-4 backdrop-blur-md md:-mx-10 md:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <label className="flex flex-1 items-center gap-3 rounded-full bg-white px-5 py-3.5 shadow-[0_10px_30px_-18px_rgba(42,36,32,0.5)]">
              <span className="text-ink/40">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search parts, e.g. “brake”, “ATA 32”, “DEMO-29”"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink/35"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-ink/40 hover:text-ink" aria-label="Clear search">
                  ×
                </button>
              )}
            </label>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {(["all", ...CATEGORIES] as const).map((c) => (
                <button key={c} data-on={category === c} onClick={() => setCategory(c)} className="chip">
                  {c === "all" ? "All categories" : c}
                </button>
              ))}
            </div>
          </div>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <button data-on={system === "all"} onClick={() => set({ catalogSystem: "all" })} className="chip">
              All systems
            </button>
            {SYSTEMS.map((s) => (
              <button key={s.id} data-on={system === s.id} onClick={() => set({ catalogSystem: s.id })} className="chip">
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mono mt-6 flex items-center justify-between text-[11px] text-ink/55">
          <span>
            {results.length} of {PARTS.length} parts
          </span>
          <span className="hidden md:inline">Demo data · part numbers are placeholders</span>
        </div>

        {results.length ? (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((p) => (
              <PartCard key={p.id} part={p} />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center text-ink/55">No parts match. Try another word or clear the filters.</div>
        )}

        <div className="mt-24 grid gap-6 border-t border-ink/15 pt-10 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <div key={c}>
              <div className="text-[15px] font-semibold">{c}</div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink/65">{CATEGORY_INFO[c]}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-ink/15">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-4 py-10 text-[13px] text-ink/60 md:flex-row md:items-center md:justify-between md:px-10">
          <span className="wide text-[18px] font-light text-ink">Airframe</span>
          <span className="max-w-[640px]">
            Demonstration catalog for a generic narrow-body airliner. Part numbers (DEMO-xx-xxx) are placeholders. Real part numbers, compatibility and
            availability are to be confirmed by the supplier against the aircraft IPC.
          </span>
        </div>
      </footer>
    </section>
  );
}
