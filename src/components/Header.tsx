"use client";

import { useEffect, useRef } from "react";
import { useUI } from "@/lib/store";
import { audio } from "@/lib/audio";
import { scrollToId } from "@/lib/scroll";
import { PARTS } from "@/data/parts";
import { BRAND } from "@/lib/brand";

const NAV = [
  { id: "explore", label: "Aircraft" },
  { id: "blueprint", label: "Explode" },
  { id: "systems", label: "Systems" },
  { id: "catalog", label: "Catalog" },
];

export function Header() {
  const dark = useUI((s) => s.dark);
  const sound = useUI((s) => s.sound);
  const exploded = useUI((s) => s.exploded);
  const set = useUI((s) => s.set);
  const covered = useUI((s) => s.covered);
  const ref = useRef<HTMLElement>(null);

  // expose the header height so sticky bars can sit just below it
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toggleSound = () => {
    const on = !sound;
    audio.setEnabled(on);
    set({ sound: on });
  };

  return (
    <header
      ref={ref}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ${dark ? "text-white" : "text-ink"} ${
        covered ? "bg-paper/85 backdrop-blur-md" : ""
      } ${
        exploded ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ transitionProperty: "color, opacity, background-color" }}
    >
      <div className="mx-auto grid grid-cols-[1fr_auto_1fr] items-center px-4 py-5 md:px-10 md:py-7">
        <nav className="hidden gap-8 text-[15px] font-semibold md:flex">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => scrollToId(n.id)} className="opacity-90 transition-opacity hover:opacity-60">
              {n.label}
            </button>
          ))}
        </nav>
        <button onClick={() => scrollToId("top")} className="col-start-2 text-center" aria-label="Back to top">
          <span className="wide text-[22px] font-light tracking-[0.02em] md:text-[26px]">{BRAND.name}</span>
          <span className="eyebrow mt-0.5 block text-[9px] opacity-60">Wholesale · Retail spare parts</span>
        </button>
        <div className="flex items-center justify-end gap-5 text-[14px] font-semibold md:gap-8">
          <span className="mono hidden text-[12px] opacity-70 sm:inline">{PARTS.length} parts · demo catalog</span>
          <button onClick={toggleSound} className="flex items-center gap-2" aria-pressed={sound} aria-label="Toggle sound">
            <span className="flex h-3.5 items-end gap-[2px]">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-[2px] bg-current"
                  style={{
                    height: sound ? undefined : 3,
                    animation: sound ? `eq 0.9s ${i * 0.13}s ease-in-out infinite alternate` : "none",
                  }}
                />
              ))}
            </span>
            <span className="hidden sm:inline">Sound {sound ? "on" : "off"}</span>
          </button>
        </div>
      </div>
      <style>{`@keyframes eq { from { height: 3px } to { height: 14px } }`}</style>
    </header>
  );
}
