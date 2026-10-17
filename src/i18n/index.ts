import en from "./locales/en.json";
import ar from "./locales/ar.json";
import ru from "./locales/ru.json";
import tr from "./locales/tr.json";
import type { UIKey } from "./en";
import type { Anchor, Part, PartCategory, SystemId } from "@/data/parts";

export type Locale = "en" | "ar" | "ru" | "tr";

export const LOCALES: { code: Locale; label: string; name: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "EN", name: "English", dir: "ltr" },
  { code: "ar", label: "AR", name: "العربية", dir: "rtl" },
  { code: "ru", label: "RU", name: "Русский", dir: "ltr" },
  { code: "tr", label: "TR", name: "Türkçe", dir: "ltr" },
];

type Dict = typeof en;
const DICTS: Record<Locale, Dict> = { en, ar: ar as Dict, ru: ru as Dict, tr: tr as Dict };

export const isLocale = (v: unknown): v is Locale => LOCALES.some((l) => l.code === v);

export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem("locale");
    if (isLocale(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  const nav = (typeof navigator !== "undefined" ? navigator.language : "en").slice(0, 2).toLowerCase();
  return isLocale(nav) ? nav : "en";
}

const fill = (s: string, vars?: Record<string, string | number>) =>
  vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;

export function makeT(locale: Locale) {
  const d = DICTS[locale] ?? en;
  const t = (key: UIKey, vars?: Record<string, string | number>) =>
    fill((d.ui as Record<string, string>)[key] ?? (en.ui as Record<string, string>)[key] ?? key, vars);

  return {
    locale,
    dir: LOCALES.find((l) => l.code === locale)?.dir ?? "ltr",
    t,
    part: (p: Part) => {
      const x = (d.parts as Record<string, { name: string; description: string; location: string }>)[p.id];
      return { name: x?.name ?? p.name, description: x?.description ?? p.description, location: x?.location ?? p.location };
    },
    system: (id: SystemId) => (d.systems as Record<string, { name: string; tagline: string; description: string }>)[id] ?? en.systems[id],
    anchor: (a: Anchor) => (d.anchors as Record<string, string>)[a] ?? en.anchors[a],
    category: (c: PartCategory) => (d.categories as Record<string, { name: string; info: string }>)[c] ?? en.categories[c],
  };
}

export type Translator = ReturnType<typeof makeT>;
