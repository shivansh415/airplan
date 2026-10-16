import { create } from "zustand";
import type { Anchor, SystemId } from "@/data/parts";

type UIState = {
  entered: boolean;
  sound: boolean;
  exploded: boolean;
  /** Anchor under the pointer in the 3D view */
  hovered: Anchor | null;
  /** Last non-null hovered anchor (keeps the hover card filled while it fades out) */
  lastHovered: Anchor | null;
  /** Anchor whose parts panel is open */
  selected: Anchor | null;
  /** Anchor highlighted from the DOM (part cards, catalog rows) */
  focus: Anchor | null;
  /** Active system chapter while scrolling the systems tour (-1 outside) */
  systemIndex: number;
  /** Blueprint scan finished: brush + Explore button available */
  drawingReady: boolean;
  /** Dark hangar theme for the header */
  dark: boolean;
  /** Catalog fully covers the screen: pause WebGL */
  covered: boolean;
  catalogSystem: SystemId | "all";

  set: (p: Partial<Omit<UIState, "set">>) => void;
};

export const useUI = create<UIState>((set) => ({
  entered: false,
  sound: false,
  exploded: false,
  hovered: null,
  lastHovered: null,
  selected: null,
  focus: null,
  systemIndex: -1,
  drawingReady: false,
  dark: true,
  covered: false,
  catalogSystem: "all",
  set: (p) => set(p),
}));
