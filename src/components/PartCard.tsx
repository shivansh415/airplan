"use client";

import Image from "next/image";
import Link from "next/link";
import type { Part } from "@/data/parts";
import { useUI } from "@/lib/store";
import { useT } from "@/i18n/client";

export function PartCard({ part, size = "md" }: { part: Part; size?: "md" | "sm" }) {
  const set = useUI((s) => s.set);
  const tr = useT();
  return (
    <Link
      href={`/parts/${part.id}`}
      onMouseEnter={() => set({ focus: part.anchor })}
      onMouseLeave={() => set({ focus: null })}
      onClick={() => set({ focus: null })}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-[18px] bg-[#ece2d4]">
        <Image
          src={part.image}
          alt={tr.part(part).name}
          fill
          sizes={size === "sm" ? "160px" : "(max-width: 768px) 50vw, 25vw"}
          className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.05]"
        />
        <span className="mono absolute start-3 top-3 rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-ink/70 backdrop-blur">
          {part.ata}
        </span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold leading-tight">{tr.part(part).name}</div>
          <div className="mono mt-1 truncate text-[11px] text-ink-soft">{part.partNumber}</div>
        </div>
        <span className="chip shrink-0 text-[11px]">{tr.category(part.category).name}</span>
      </div>
    </Link>
  );
}

export function PartRow({ part, onClick }: { part: Part; onClick?: () => void }) {
  const set = useUI((s) => s.set);
  const tr = useT();
  return (
    <Link
      href={`/parts/${part.id}`}
      onClick={() => {
        set({ focus: null, selected: null });
        onClick?.();
      }}
      onMouseEnter={() => set({ focus: part.anchor })}
      onMouseLeave={() => set({ focus: null })}
      className="group flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-white/60"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#ece2d4]">
        <Image src={part.image} alt="" fill sizes="56px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-semibold">{tr.part(part).name}</div>
        <div className="mono mt-0.5 truncate text-[10.5px] text-ink-soft">
          {part.partNumber} · {tr.category(part.category).name}
        </div>
      </div>
      <span className="pe-2 text-ink/40 transition-transform group-hover:translate-x-1 group-hover:text-ink rtl:-scale-x-100 rtl:group-hover:-translate-x-1">→</span>
    </Link>
  );
}
