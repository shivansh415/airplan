import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PARTS, partById } from "@/data/parts";
import { BRAND } from "@/lib/brand";
import { PartView } from "@/components/PartView";

export function generateStaticParams() {
  return PARTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/parts/[id]">): Promise<Metadata> {
  const { id } = await params;
  const part = partById(id);
  return { title: part ? `${part.name} — ${BRAND.name}` : "Part not found" };
}

export default async function PartPage({ params }: PageProps<"/parts/[id]">) {
  const { id } = await params;
  if (!partById(id)) notFound();
  return <PartView id={id} />;
}
