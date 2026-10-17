"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "@/lib/scroll";
import { rig } from "@/lib/rig";
import { useUI } from "@/lib/store";
import { CATEGORY_INFO, PARTS, SYSTEMS, systemById, type PartCategory } from "@/data/parts";
import { PartCard } from "@/components/PartCard";
import { BRAND } from "@/lib/brand";
import { useT } from "@/i18n/client";

const CATEGORIES = Object.keys(CATEGORY_INFO) as PartCategory[];

/** Search folding: case (Turkish İ/ı too), accents and Arabic letter variants. */
const fold = (s: string, locale: string) =>
  s
    .toLocaleLowerCase(locale)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

export function CatalogSection() {
  const ref = useRef<HTMLElement>(null);
  const system = useUI((s) => s.catalogSystem);
  const set = useUI((s) => s.set);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PartCategory | "all">("all");
  const tr = useT();
  const q = useDeferredValue(fold(query.trim(), tr.locale));
  const { t } = tr;

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top bottom",
        end: "top top",
        onUpdate: (s) => {
          rig.catalog = s.progress;
        },
        // also on (re)creation, e.g. coming back to the home page
        onRefresh: (s) => {
          rig.catalog = s.progress;
        },
      });
      ScrollTrigger.create({
        trigger: ref.current,
        // a hair early: scrolling *to* the catalog lands exactly on its top edge
        start: "top 2px",
        end: "bottom top",
        onToggle: (s) => useUI.getState().set({ covered: s.isActive }),
        onRefresh: (s) => useUI.getState().set({ covered: s.isActive }),
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
            [
              p.name,
              tr.part(p).name,
              p.partNumber,
              p.ata,
              p.description,
              tr.part(p).description,
              systemById(p.system).name,
              tr.system(p.system).name,
            ].some((s) => fold(s, tr.locale).includes(q))),
      ),
    [q, system, category, tr],
  );

  return (
    <section ref={ref} id="catalog" className="relative z-[5] bg-paper text-ink">
      <div className="mx-auto max-w-[1480px] px-4 pb-16 pt-28 md:px-10 md:pt-36">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="eyebrow text-ink/55">{t("cat.eyebrow")}</div>
            <h2 className="display mt-4 text-[clamp(48px,8vw,140px)]">{t("cat.title")}</h2>
          </div>
          <p className="max-w-[380px] text-[15px] leading-relaxed text-ink/70">
            {t("cat.intro")}
          </p>
        </div>

        <div className="sticky top-[var(--header-h,84px)] z-10 -mx-4 mt-12 bg-paper/90 px-4 py-4 backdrop-blur-md md:-mx-10 md:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <label className="flex flex-1 items-center gap-3 rounded-full bg-white px-5 py-3.5 shadow-[0_10px_30px_-18px_rgba(42,36,32,0.5)]">
              <span aria-hidden className="text-ink/40">⌕</span>
              <input
                type="search"
                aria-label={t("cat.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("cat.search")}
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink/35"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-ink/40 hover:text-ink" aria-label={t("cat.clear")}>
                  ×
                </button>
              )}
            </label>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {(["all", ...CATEGORIES] as const).map((c) => (
                <button key={c} data-on={category === c} onClick={() => setCategory(c)} className="chip">
                  {c === "all" ? t("cat.allCategories") : tr.category(c).name}
                </button>
              ))}
            </div>
          </div>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <button data-on={system === "all"} onClick={() => set({ catalogSystem: "all" })} className="chip">
              {t("cat.allSystems")}
            </button>
            {SYSTEMS.map((s) => (
              <button key={s.id} data-on={system === s.id} onClick={() => set({ catalogSystem: s.id })} className="chip">
                {tr.system(s.id).name}
              </button>
            ))}
          </div>
        </div>

        <div className="mono mt-6 flex items-center justify-between text-[11px] text-ink/55">
          <span>
            {t("cat.count", { n: results.length, total: PARTS.length })}
          </span>
          <span className="hidden md:inline">{t("cat.demoNote")}</span>
        </div>

        {results.length ? (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((p) => (
              <PartCard key={p.id} part={p} />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center text-ink/55">{t("cat.empty")}</div>
        )}

        <div className="mt-20 flex flex-col items-start justify-between gap-6 rounded-[28px] bg-ink px-6 py-10 text-paper-2 md:flex-row md:items-center md:px-12">
          <div>
            <h3 className="display text-[clamp(26px,3vw,44px)]">{t("cat.ctaTitle")}</h3>
            <p className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-paper-2/70">{t("cat.ctaBody")}</p>
          </div>
          <Link href="/about#contact" className="btn shrink-0">
            {t("about.ctaPrimary")}
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] text-white rtl:-scale-x-100">→</span>
          </Link>
        </div>

        <div className="mt-24 grid gap-6 border-t border-ink/15 pt-10 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <div key={c}>
              <div className="text-[15px] font-semibold">{tr.category(c).name}</div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink/65">{tr.category(c).info}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-ink/15">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-4 py-10 text-[13px] text-ink/60 md:flex-row md:items-center md:justify-between md:px-10">
          <span>
            <span className="wide block text-[18px] font-light text-ink">{BRAND.name}</span>
            <span className="mt-1 block">
              © 2026 {t("brand.company")}
            </span>
          </span>
          <span className="max-w-[640px]">
            {t("footer.disclaimer")}
          </span>
        </div>
      </footer>
    </section>
  );
}
