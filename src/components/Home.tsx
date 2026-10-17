"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { ScrollTrigger, startLenis, stopLenis } from "@/lib/scroll";
import { useUI } from "@/lib/store";
import { rig } from "@/lib/rig";
import { audio } from "@/lib/audio";
import { Backdrop } from "./Backdrop";
import { Header } from "./Header";
import { Gate } from "./Gate";
import { BlueprintSection, HangarSection, SkySection, TitleSection } from "./sections/StorySections";
import { SystemsSection } from "./sections/SystemsSection";
import { CatalogSection } from "./sections/CatalogSection";
import { AnchorPanel, BrushCursor, DimensionLabels, ExplodeOverlay, HoverCard } from "./sections/ExplodeOverlay";

const HomeCanvas = dynamic(() => import("./HomeCanvas"), { ssr: false });

// Where the tour was left, so browser Back from a part page lands in the same place.
let savedScroll = 0;
let poppedBack = false;
if (typeof window !== "undefined") window.addEventListener("popstate", () => (poppedBack = true));

export function Home() {
  useEffect(() => {
    const prevRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    const lenis = startLenis();
    const ui = useUI.getState();
    // anything left open from an earlier visit (exploded view, parts panel, hover highlight)
    ui.set({ exploded: false, selected: null, hovered: null, focus: null });
    Object.assign(rig, { explode: 0, explodeCam: 0, scanOverride: 21.5 });
    const back = poppedBack;
    poppedBack = false;
    if (!ui.entered) {
      window.scrollTo(0, 0);
      lenis.stop();
    } else {
      rig.lights = 1;
      // land on the requested section (/#catalog) or where the visitor left off (Back)
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        const hash = window.location.hash.slice(1);
        if (hash && document.getElementById(hash)) lenis.scrollTo(`#${hash}`, { immediate: true, force: true });
        else lenis.scrollTo(back ? savedScroll : 0, { immediate: true, force: true });
      });
    }
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    const vis = () => audio.pause(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => {
      savedScroll = window.scrollY;
      window.removeEventListener("load", refresh);
      document.removeEventListener("visibilitychange", vis);
      history.scrollRestoration = prevRestoration;
      document.body.style.cursor = "";
      audio.setScene(0, 0);
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
