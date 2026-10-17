"use client";

import dynamic from "next/dynamic";
import type { Anchor } from "@/data/parts";
import { useT } from "@/i18n/client";

function Loading() {
  const { t } = useT();
  return <div className="mono grid h-full place-items-center text-[11px] uppercase text-ink/40">{t("part.loading")}</div>;
}

const PartLocator = dynamic(() => import("./three/PartLocator"), {
  ssr: false,
  loading: () => <Loading />,
});

export function LocatorSlot({ anchor }: { anchor: Anchor }) {
  return <PartLocator anchor={anchor} />;
}
