import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ANCHOR_LABELS,
  CATEGORY_INFO,
  PART_NUMBER_NOTE,
  PARTS,
  partById,
  partsBySystem,
  systemById,
} from "@/data/parts";
import { LocatorSlot } from "@/components/LocatorSlot";
import { PartCard } from "@/components/PartCard";

export function generateStaticParams() {
  return PARTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/parts/[id]">): Promise<Metadata> {
  const { id } = await params;
  const part = partById(id);
  return { title: part ? `${part.name} — Airframe parts` : "Part not found" };
}

export default async function PartPage({ params }: PageProps<"/parts/[id]">) {
  const { id } = await params;
  const part = partById(id);
  if (!part) notFound();

  const system = systemById(part.system);
  const index = PARTS.findIndex((p) => p.id === part.id);
  const prev = PARTS[(index - 1 + PARTS.length) % PARTS.length];
  const next = PARTS[(index + 1) % PARTS.length];
  const related = partsBySystem(part.system)
    .filter((p) => p.id !== part.id)
    .slice(0, 5);

  const rows: [string, React.ReactNode][] = [
    [
      "Part number",
      <span key="pn">
        <span className="mono">{part.partNumber}</span>
        <span className="block text-[12px] text-ink/50">Demo ID · {PART_NUMBER_NOTE.toLowerCase()}</span>
      </span>,
    ],
    ["ATA chapter", part.ata],
    ["System", system.name],
    ["Category", part.category],
    ["Location", part.location],
    ["Aircraft area", ANCHOR_LABELS[part.anchor]],
    ["Compatible aircraft", part.compatible.join(", ")],
    ["Datasheet", "Available on request"],
  ];

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-[1480px] items-center justify-between px-4 py-6 md:px-10">
        <Link href="/#catalog" className="text-[14px] font-semibold opacity-80 hover:opacity-100">
          ← Back to explorer
        </Link>
        <Link href="/" className="text-center">
          <span className="wide text-[22px] font-light">Airframe</span>
          <span className="eyebrow block text-[9px] opacity-60">Parts explorer</span>
        </Link>
        <span className="mono hidden text-[12px] opacity-60 sm:inline">
          {String(index + 1).padStart(3, "0")} / {PARTS.length}
        </span>
      </header>

      <section className="mx-auto grid max-w-[1480px] gap-10 px-4 pb-16 pt-6 md:grid-cols-[1.05fr_1fr] md:gap-16 md:px-10 md:pt-12">
        <div className="order-2 md:order-1">
          <div className="eyebrow text-ink/55">
            {system.name} · {part.ata}
          </div>
          <h1 className="display mt-4 text-[clamp(40px,5.6vw,92px)]">{part.name}</h1>
          <p className="mt-6 max-w-[560px] text-[18px] leading-relaxed text-ink/80">{part.description}</p>

          <dl className="mt-10 border-t border-ink/15">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[150px_1fr] gap-4 border-b border-ink/15 py-3.5 text-[15px] md:grid-cols-[200px_1fr]">
                <dt className="eyebrow pt-1 text-[10.5px] text-ink/50">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 rounded-2xl bg-white/60 p-5 text-[14px] leading-relaxed text-ink/75">
            <span className="font-semibold text-ink">{part.category}.</span> {CATEGORY_INFO[part.category]}
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="relative aspect-square overflow-hidden rounded-[32px] bg-[#ece2d4]">
            <Image src={part.image} alt={part.name} fill priority sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
            <span className="mono absolute bottom-4 left-4 rounded-full bg-white/70 px-3 py-1 text-[10.5px] text-ink/60 backdrop-blur">
              Illustrative image
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
          <div className="pointer-events-none absolute left-5 top-5 md:left-8 md:top-7">
            <div className="eyebrow text-ink/50">Where it sits</div>
            <div className="wide mt-2 text-[22px] font-semibold">{ANCHOR_LABELS[part.anchor]}</div>
            <div className="mt-1 text-[14px] text-ink/60">{part.location}</div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-[1480px] px-4 pb-10 pt-20 md:px-10">
          <div className="flex items-end justify-between">
            <h2 className="display text-[clamp(30px,3.4vw,52px)]">More {system.name.toLowerCase()}</h2>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-5">
            {related.map((p) => (
              <PartCard key={p.id} part={p} />
            ))}
          </div>
        </section>
      )}

      <nav className="mx-auto mt-10 grid max-w-[1480px] grid-cols-2 border-t border-ink/15 md:px-10">
        <Link href={`/parts/${prev.id}`} className="group px-4 py-8 md:px-0">
          <div className="eyebrow text-ink/50">← Previous</div>
          <div className="mt-2 text-[17px] font-semibold group-hover:underline">{prev.name}</div>
        </Link>
        <Link href={`/parts/${next.id}`} className="group border-l border-ink/15 px-4 py-8 text-right md:px-0">
          <div className="eyebrow text-ink/50">Next →</div>
          <div className="mt-2 text-[17px] font-semibold group-hover:underline">{next.name}</div>
        </Link>
      </nav>
    </main>
  );
}
