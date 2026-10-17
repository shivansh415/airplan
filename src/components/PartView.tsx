"use client";

import Image from "next/image";
import Link from "next/link";
import { PARTS, partById, partsBySystem } from "@/data/parts";
import { LocatorSlot } from "@/components/LocatorSlot";
import { PartCard } from "@/components/PartCard";
import { BRAND } from "@/lib/brand";
import { LanguageSwitcher, useT } from "@/i18n/client";

/** Full part sheet (client side so it follows the chosen language). */
export function PartView({ id }: { id: string }) {
  const tr = useT();
  const { t } = tr;
  const part = partById(id)!;
  const p = tr.part(part);
  const system = tr.system(part.system);
  const index = PARTS.findIndex((x) => x.id === part.id);
  const prev = PARTS[(index - 1 + PARTS.length) % PARTS.length];
  const next = PARTS[(index + 1) % PARTS.length];
  const related = partsBySystem(part.system)
    .filter((x) => x.id !== part.id)
    .slice(0, 5);
  const category = tr.category(part.category);

  const rows: [string, React.ReactNode][] = [
    [
      t("part.number"),
      <span key="pn">
        <span className="mono">{part.partNumber}</span>
        <span className="block text-[12px] text-ink/50">{t("part.demoNote")}</span>
      </span>,
    ],
    [t("part.ata"), part.ata],
    [t("part.system"), system.name],
    [t("part.category"), category.name],
    [t("part.location"), p.location],
    [t("part.area"), tr.anchor(part.anchor)],
    [t("part.compatible"), t("part.compatibleValue")],
    [t("part.supply"), t("part.supplyValue")],
    [t("part.datasheet"), t("part.datasheetValue")],
  ];

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="mx-auto grid max-w-[1480px] grid-cols-[1fr_auto_1fr] items-center px-4 py-6 md:px-10">
        <Link href="/#catalog" className="text-[14px] font-semibold opacity-80 hover:opacity-100">
          {t("part.back")}
        </Link>
        <Link href="/" className="text-center">
          <span className="wide text-[22px] font-light">{BRAND.name}</span>
          <span className="eyebrow block text-[9px] opacity-60">{t("brand.sub")}</span>
        </Link>
        <div className="flex items-center justify-end gap-4">
          <span className="mono hidden text-[12px] opacity-60 sm:inline">
            {String(index + 1).padStart(3, "0")} / {PARTS.length}
          </span>
          <LanguageSwitcher />
        </div>
      </header>

      <section className="mx-auto grid max-w-[1480px] gap-10 px-4 pb-16 pt-6 md:grid-cols-[1.05fr_1fr] md:gap-16 md:px-10 md:pt-12">
        <div className="order-2 md:order-1">
          <div className="eyebrow text-ink/55">
            {system.name} · {part.ata}
          </div>
          <h1 className="display mt-4 text-[clamp(36px,5.2vw,88px)]">{p.name}</h1>
          <p className="mt-6 max-w-[560px] text-[18px] leading-relaxed text-ink/80">{p.description}</p>

          <dl className="mt-10 border-t border-ink/15">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[150px_1fr] gap-4 border-b border-ink/15 py-3.5 text-[15px] md:grid-cols-[200px_1fr]">
                <dt className="eyebrow pt-1 text-[10.5px] text-ink/50">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 rounded-2xl bg-white/60 p-5 text-[14px] leading-relaxed text-ink/75">
            <span className="font-semibold text-ink">{category.name}.</span> {category.info}
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="relative aspect-square overflow-hidden rounded-[32px] bg-[#ece2d4]">
            <Image src={part.image} alt={p.name} fill priority sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
            <span className="mono absolute bottom-4 start-4 rounded-full bg-white/70 px-3 py-1 text-[10.5px] text-ink/60 backdrop-blur">
              {t("part.illustrative")}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 md:px-10">
        <div className="relative overflow-hidden rounded-[32px] border border-ink/10">
          <div className="paper-grid absolute inset-0 opacity-60" />
          <div className="relative h-[52svh] min-h-[340px]">
            <LocatorSlot anchor={part.anchor} />
          </div>
          <div className="pointer-events-none absolute start-5 top-5 md:start-8 md:top-7">
            <div className="eyebrow text-ink/50">{t("part.whereItSits")}</div>
            <div className="wide mt-2 text-[22px] font-semibold">{tr.anchor(part.anchor)}</div>
            <div className="mt-1 text-[14px] text-ink/60">{p.location}</div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-[1480px] px-4 pb-10 pt-20 md:px-10">
          <h2 className="display text-[clamp(28px,3.4vw,52px)]">{t("part.more", { system: system.name })}</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-5">
            {related.map((x) => (
              <PartCard key={x.id} part={x} />
            ))}
          </div>
        </section>
      )}

      <nav className="mx-auto mt-10 grid max-w-[1480px] grid-cols-2 border-t border-ink/15 md:px-10">
        <Link href={`/parts/${prev.id}`} className="group px-4 py-8 md:px-0">
          <div className="eyebrow text-ink/50">{t("part.prev")}</div>
          <div className="mt-2 text-[17px] font-semibold group-hover:underline">{tr.part(prev).name}</div>
        </Link>
        <Link href={`/parts/${next.id}`} className="group border-s border-ink/15 px-4 py-8 text-end md:px-0">
          <div className="eyebrow text-ink/50">{t("part.next")}</div>
          <div className="mt-2 text-[17px] font-semibold group-hover:underline">{tr.part(next).name}</div>
        </Link>
      </nav>
    </main>
  );
}
