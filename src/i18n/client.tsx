"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";
import { LOCALES, detectLocale, makeT, type Locale } from "./index";

type LocaleState = { locale: Locale; setLocale: (l: Locale) => void };

export const useLocale = create<LocaleState>((set) => ({
  locale: "en",
  setLocale: (locale) => {
    try {
      localStorage.setItem("locale", locale);
    } catch {
      /* storage unavailable */
    }
    set({ locale });
  },
}));

/** Translator for the current language. */
export function useT() {
  const locale = useLocale((s) => s.locale);
  return useMemo(() => makeT(locale), [locale]);
}

/** Picks up the saved / browser language and keeps <html lang dir> in sync. */
export function LocaleSync() {
  const locale = useLocale((s) => s.locale);
  useEffect(() => {
    const l = detectLocale();
    if (l !== useLocale.getState().locale) useLocale.setState({ locale: l });
  }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.lang = locale;
    el.dir = LOCALES.find((x) => x.code === locale)?.dir ?? "ltr";
    // the boot script holds the page until the detected language is on screen
    if (locale === detectLocale()) el.classList.remove("i18n-wait");
  }, [locale]);
  return null;
}

/** Compact language menu (EN / AR / RU / TR). */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const current = LOCALES.find((l) => l.code === locale)!;
  return (
    // positioning classes go on an outer box: `relative` here would override a caller's `absolute`
    <div className={className}>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={t.t("lang.label")}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[13px] font-semibold ring-1 ring-current/25 transition-opacity hover:opacity-70"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
          </svg>
          <span className="mono text-[11.5px]">{current.label}</span>
        </button>
        {open && (
          <ul className="absolute end-0 top-[calc(100%+8px)] z-[70] min-w-[150px] overflow-hidden rounded-2xl bg-paper-2 py-1.5 text-ink shadow-[0_20px_50px_-15px_rgba(0,0,0,0.45)] ring-1 ring-ink/10">
            {LOCALES.map((l) => (
              <li key={l.code}>
                <button
                  lang={l.code}
                  aria-current={l.code === locale}
                  onClick={() => {
                    setLocale(l.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-4 px-4 py-2 text-start text-[14px] hover:bg-ink/5 ${l.code === locale ? "font-semibold" : ""}`}
                >
                  <span>{l.name}</span>
                  <span className="mono text-[10.5px] opacity-50">
                    {l.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
