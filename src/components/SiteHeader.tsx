"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LanguageSwitcher, useT } from "@/i18n/client";

/** Header for content pages (About). Same wordmark as the explorer, plain links. */
export function SiteHeader({ dark = false }: { dark?: boolean }) {
  const { t } = useT();
  return (
    <header className={`absolute inset-x-0 top-0 z-30 ${dark ? "text-white" : "text-ink"}`}>
      <div className="mx-auto grid max-w-[1480px] grid-cols-[1fr_auto_1fr] items-center px-4 py-5 md:px-10 md:py-7">
        <nav className="hidden gap-8 text-[15px] font-semibold md:flex">
          <Link href="/" className="opacity-90 hover:opacity-60">
            {t("nav.aircraft")}
          </Link>
          <Link href="/#catalog" className="opacity-90 hover:opacity-60">
            {t("nav.catalog")}
          </Link>
          <Link href="/about" className="opacity-90 hover:opacity-60">
            {t("nav.about")}
          </Link>
        </nav>
        <Link href="/" className="col-start-2 text-center">
          <span className="wide text-[22px] font-light tracking-[0.02em] md:text-[26px]">{BRAND.name}</span>
          <span className="eyebrow mt-0.5 block text-[9px] opacity-60">{t("brand.sub")}</span>
        </Link>
        <div className="flex items-center justify-end gap-3 md:gap-5">
          <LanguageSwitcher />
          <a href="#contact" className={`btn hidden px-4 py-2 text-[13.5px] sm:inline-flex ${dark ? "" : "btn-dark"}`}>
            {t("cta.quote")}
          </a>
        </div>
      </div>
    </header>
  );
}
