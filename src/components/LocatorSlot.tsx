"use client";

import dynamic from "next/dynamic";
import type { Anchor } from "@/data/parts";

const PartLocator = dynamic(() => import("./three/PartLocator"), {
  ssr: false,
  loading: () => <div className="mono grid h-full place-items-center text-[11px] text-ink/40">LOADING AIRFRAME…</div>,
});

export function LocatorSlot({ anchor }: { anchor: Anchor }) {
  return <PartLocator anchor={anchor} />;
}
