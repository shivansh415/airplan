"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { ScrollTrigger, startLenis, stopLenis } from "@/lib/scroll";
import { useUI } from "@/lib/store";
import { rig } from "@/lib/rig";
import { Backdrop } from "./Backdrop";
import { Header } from "./Header";
import { Gate } from "./Gate";
import { BlueprintSection, HangarSection, SkySection, TitleSection } from "./sections/StorySections";
import { SystemsSection } from "./sections/SystemsSection";
import { CatalogSection } from "./sections/CatalogSection";
import { AnchorPanel, BrushCursor, DimensionLabels, ExplodeOverlay, HoverCard } from "./sections/ExplodeOverlay";

const HomeCanvas = dynamic(() => import("./HomeCanvas"), { ssr: false });

export function Home() {
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const lenis = startLenis();
    if (!useUI.getState().entered) {
      window.scrollTo(0, 0);
      lenis.stop();
    } else {
      rig.lights = 1;
    }
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      stopLenis();
    };
  }, []);

  return (
    <main>
      <Backdrop />
      <HomeCanvas />
      <Header />
      <Gate />
      <HangarSection />
      <SkySection />
      <TitleSection />
      <BlueprintSection />
      <SystemsSection />
      <CatalogSection />
      <ExplodeOverlay />
      <AnchorPanel />
      <BrushCursor />
      <DimensionLabels />
      <HoverCard />
    </main>
  );
}
