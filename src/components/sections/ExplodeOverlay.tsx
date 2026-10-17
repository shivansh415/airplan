"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/scroll";
import { rig } from "@/lib/rig";
import { useUI } from "@/lib/store";
import { reassembleAircraft } from "@/lib/explode";
import { ANCHOR_LABELS, PARTS, partsByAnchor, type Anchor } from "@/data/parts";
import { PartRow } from "@/components/PartCard";
import { useT } from "@/i18n/client";

const ANCHORS = (Object.keys(ANCHOR_LABELS) as Anchor[]).filter((a) => partsByAnchor(a).length > 0);

/** UI over the exploded aircraft: orbit, hover label, group list, reassemble. */
export function ExplodeOverlay() {
  const tr = useT();
  const exploded = useUI((s) => s.exploded);
  const hovered = useUI((s) => s.hovered);
  const selected = useUI((s) => s.selected);
  const set = useUI((s) => s.set);
  const drag = useRef({ down: false, x: 0, y: 0, moved: 0 });

  useEffect(() => {
    if (!exploded) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (useUI.getState().selected) set({ selected: null });
        else reassembleAircraft();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [exploded, set]);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { down: true, x: e.clientX, y: e.clientY, moved: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.moved += Math.abs(dx) + Math.abs(dy);
    d.x = e.clientX;
    d.y = e.clientY;
    rig.orbit.taz -= dx * 0.006;
    rig.orbit.tel = Math.max(-0.65, Math.min(0.85, rig.orbit.tel + dy * 0.004));
  };
  const onUp = () => {
    const d = drag.current;
    d.down = false;
    if (d.moved < 6) {
      const h = useUI.getState().hovered;
      set({ selected: h ?? null });
    }
  };
  const onWheel = (e: React.WheelEvent) => {
    rig.orbit.tzoom = Math.max(0.45, Math.min(1.5, rig.orbit.tzoom * (1 + e.deltaY * 0.001)));
  };

  return (
    <div className={`fixed inset-0 z-[40] transition-opacity duration-700 ${exploded ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div
        className={`absolute inset-0 touch-none ${hovered ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onWheel={onWheel}
      />

      <div className="pointer-events-none absolute left-4 top-6 md:left-10 md:top-8">
        <div className="eyebrow text-ink/60">{tr.t("ex.eyebrow", { n: PARTS.length })}</div>
        <div className="display mt-2 text-[clamp(30px,3.6vw,56px)]">{tr.t("ex.title")}</div>
        <div className="mono mt-3 text-[11px] text-ink/55">{tr.t("ex.hint")}</div>
      </div>

      <ul className="no-scrollbar absolute bottom-28 left-4 top-48 hidden w-[250px] overflow-y-auto pr-2 md:left-10 md:block">
        {ANCHORS.map((a) => (
          <li key={a}>
            <button
              onMouseEnter={() => set({ focus: a })}
              onMouseLeave={() => set({ focus: null })}
              onClick={() => set({ selected: a })}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13.5px] transition-colors ${
                selected === a || hovered === a ? "bg-ink text-paper-2" : "hover:bg-ink/5"
              }`}
            >
              <span>{tr.anchor(a)}</span>
              <span className="mono text-[10.5px] opacity-60">{partsByAnchor(a).length}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="absolute inset-x-0 bottom-8 flex justify-center">
        <button onClick={reassembleAircraft} className="btn btn-dark">
          {tr.t("ex.reassemble")}
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-[12px]">↺</span>
        </button>
      </div>
    </div>
  );
}

/** Slide-in panel listing the parts of one aircraft area. */
export function AnchorPanel() {
  const selected = useUI((s) => s.selected);
  const tr = useT();
  const set = useUI((s) => s.set);
  const parts = selected ? partsByAnchor(selected) : [];
  const systems = Array.from(new Set(parts.map((p) => tr.system(p.system).name)));

  return (
    <aside
      className={`fixed z-[45] flex flex-col bg-paper-2/95 shadow-[0_30px_80px_-20px_rgba(42,36,32,0.45)] backdrop-blur-xl transition-transform duration-[700ms] ease-[cubic-bezier(.2,.8,.2,1)]
      inset-x-0 bottom-0 max-h-[70svh] rounded-t-[28px] md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:max-h-none md:w-[420px] md:rounded-[28px]
      ${selected ? "translate-y-0 md:translate-x-0" : "translate-y-[110%] md:translate-x-[115%] md:translate-y-0"}`}
      aria-hidden={!selected}
    >
      <div className="flex items-start justify-between gap-4 p-6 pb-4">
        <div>
          <div className="eyebrow text-ink/55">{systems.join(" · ")}</div>
          <h3 className="wide mt-2 text-[26px] font-semibold leading-tight">{selected ? tr.anchor(selected) : ""}</h3>
          <div className="mono mt-2 text-[11px] text-ink/55">{tr.t("panel.count", { n: parts.length })}</div>
        </div>
        <button onClick={() => set({ selected: null })} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/5 text-[18px] hover:bg-ink/10" aria-label={tr.t("panel.close")}>
          ×
        </button>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
        {parts.map((p) => (
          <PartRow key={p.id} part={p} />
        ))}
      </div>
    </aside>
  );
}

/** Soft ring that follows the pointer while the x-ray brush is active. */
export function BrushCursor() {
  const ready = useUI((s) => s.drawingReady);
  const exploded = useUI((s) => s.exploded);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tick = () => {
      if (ring.current) ring.current.style.transform = `translate3d(${rig.pointer.cx}px, ${rig.pointer.cy}px, 0) translate(-50%, -50%)`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return (
    <div
      ref={ring}
      className={`pointer-events-none fixed left-0 top-0 z-[3] hidden h-24 w-24 rounded-full border border-accent/60 transition-opacity duration-500 md:block ${
        ready && !exploded ? "opacity-100" : "opacity-0"
      }`}
      style={{ boxShadow: "0 0 40px rgba(47,92,255,0.25), inset 0 0 30px rgba(47,92,255,0.15)" }}
    >
      <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
    </div>
  );
}

/** Labels for the blueprint dimension lines, positioned from the WebGL projection. */
export function DimensionLabels() {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tick = () => {
      const d = rig.dims;
      if (a.current) {
        a.current.style.opacity = String(d.o);
        a.current.style.transform = `translate3d(${d.ax}px, ${d.ay}px, 0) translate(-50%, -50%) rotate(90deg)`;
        a.current.textContent = `L ${d.len}`;
      }
      if (b.current) {
        b.current.style.opacity = String(d.o);
        b.current.style.transform = `translate3d(${d.bx}px, ${d.by}px, 0) translate(-50%, -50%)`;
        b.current.textContent = `SPAN ${d.span}`;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  const cls = "mono pointer-events-none fixed left-0 top-0 z-[2] whitespace-nowrap bg-paper/85 px-1.5 py-0.5 text-[11px] tracking-[0.12em] text-accent opacity-0";
  return (
    <>
      <div ref={a} className={cls} />
      <div ref={b} className={cls} />
    </>
  );
}

/** Rich hover card: shows what a part of the aircraft is, wherever the 3D model is interactive. */
export function HoverCard() {
  const tr = useT();
  const hovered = useUI((s) => s.hovered);
  const selected = useUI((s) => s.selected);
  const exploded = useUI((s) => s.exploded);
  const systemIndex = useUI((s) => s.systemIndex);
  const shown = useUI((s) => s.lastHovered);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => {
      const el = card.current;
      if (!el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      let x = rig.pointer.cx + 22;
      let y = rig.pointer.cy + 18;
      if (x + w > window.innerWidth - 12) x = rig.pointer.cx - w - 22;
      if (y + h > window.innerHeight - 12) y = window.innerHeight - h - 12;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  const active = !!hovered && !selected && (exploded || systemIndex >= 0);
  const a = shown;
  const parts = a ? partsByAnchor(a) : [];
  const hero = parts[0];
  const systems = Array.from(new Set(parts.map((p) => tr.system(p.system).name)));

  return (
    <div
      ref={card}
      className={`pointer-events-none fixed left-0 top-0 z-[46] hidden w-[300px] overflow-hidden rounded-[22px] bg-paper-2/95 shadow-[0_24px_60px_-18px_rgba(42,36,32,0.55)] ring-1 ring-ink/5 backdrop-blur-xl transition-[opacity,scale] duration-300 md:block ${
        active ? "scale-100 opacity-100" : "scale-95 opacity-0"
      }`}
    >
      {a && hero && (
        <>
          <div className="relative h-[150px] bg-[#ece2d4]">
            <Image src={hero.image} alt="" fill sizes="300px" className="object-cover" />
            <span className="mono absolute left-3 top-3 rounded-full bg-white/75 px-2 py-0.5 text-[10px] text-ink/70">{hero.ata}</span>
            <span className="mono absolute right-3 top-3 rounded-full bg-ink px-2 py-0.5 text-[10px] text-paper-2">{tr.t("hover.parts", { n: parts.length })}</span>
          </div>
          <div className="p-4">
            <div className="eyebrow text-[10px] text-ink/50">{systems.join(" · ")}</div>
            <div className="wide mt-1.5 text-[19px] font-semibold leading-tight">{tr.anchor(a)}</div>
            <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-ink/65">{tr.part(hero).description}</p>
            <ul className="mt-3 space-y-1 border-t border-ink/10 pt-3">
              {parts.slice(0, 3).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="truncate font-medium">{tr.part(p).name}</span>
                  <span className="mono shrink-0 text-[10px] text-ink/50">{tr.category(p.category).name}</span>
                </li>
              ))}
            </ul>
            <div className="mono mt-3 text-[10.5px] text-accent">{tr.t("hover.open")}</div>
          </div>
        </>
      )}
    </div>
  );
}
