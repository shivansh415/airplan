"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ATA_CHAPTERS, PARTS, SYSTEMS } from "@/data/parts";
import { PLANFORM_PATHS } from "@/lib/planform";
import { SiteHeader } from "@/components/SiteHeader";
import { QuoteForm } from "@/components/QuoteForm";
import { COMPANY, CREDIT } from "@/lib/company";
import { useT } from "@/i18n/client";
import type { UIKey } from "@/i18n/en";

/** Fade-and-rise sections as they scroll into view. */
function useReveal() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = root.current?.querySelectorAll<HTMLElement>("[data-reveal]") ?? [];
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.in = "1";
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -12% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return root;
}

const STORY: [UIKey, UIKey][] = [
  ["about.s1.title", "about.s1.body"],
  ["about.s2.title", "about.s2.body"],
  ["about.s3.title", "about.s3.body"],
];
const STEPS: [UIKey, UIKey][] = [
  ["about.p1.title", "about.p1.body"],
  ["about.p2.title", "about.p2.body"],
  ["about.p3.title", "about.p3.body"],
];

export function AboutView() {
  const tr = useT();
  const { t } = tr;
  const root = useReveal();
  const paths = PLANFORM_PATHS;

  const stats: [string, UIKey][] = [
    [String(PARTS.length), "about.statParts"],
    [String(SYSTEMS.length), "about.statSystems"],
    [String(ATA_CHAPTERS), "about.statAta"],
    ["2", "about.statModes"],
  ];
  const company: [UIKey, React.ReactNode][] = [
    ["about.company.legalName", tr.locale === "ar" ? COMPANY.legalNameAr : t("brand.company")],
    ["about.company.form", t("about.company.formValue")],
    ["about.company.registeredWith", t("about.company.registeredWithValue")],
    ["about.company.irn", <span key="irn" className="mono" dir="ltr">{COMPANY.investmentRegistrationNo}</span>],
    ["about.company.location", t("about.company.locationValue")],
    [
      "about.company.email",
      <a key="mail" href={`mailto:${COMPANY.email}`} className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink" dir="ltr">
        {COMPANY.email}
      </a>,
    ],
  ];

  return (
    <div ref={root} className="about bg-paper text-ink">
      {/* ------------------------------ hero ------------------------------ */}
      <section className="relative overflow-hidden bg-hangar text-white">
        <SiteHeader dark />
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "96px 96px",
            backgroundPosition: "center",
          }}
        />
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 70% 45%, rgba(120,124,132,0.28), transparent 70%)" }} />
        <div className="relative mx-auto grid min-h-[100svh] max-w-[1480px] items-center gap-10 px-4 pb-16 pt-32 md:grid-cols-[1.1fr_1fr] md:px-10">
          <div>
            <div data-reveal className="eyebrow text-white/55">
              {t("about.eyebrow")}
            </div>
            <h1 data-reveal className="display mt-5 text-[clamp(44px,6.4vw,110px)]">
              {t("about.title")}
            </h1>
            <p data-reveal className="mt-7 max-w-[520px] text-[clamp(16px,1.3vw,19px)] leading-relaxed text-white/70">
              {t("about.lead")}
            </p>
            <div data-reveal className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#contact" className="btn">
                {t("about.ctaPrimary")}
                <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] text-white">↓</span>
              </a>
              <Link href="/#catalog" className="text-[15px] font-semibold text-white/70 underline decoration-white/30 underline-offset-[6px] hover:text-white">
                {t("about.ctaSecondary")}
              </Link>
            </div>
          </div>
          <svg viewBox="-21 -20.5 42 41" className="about-plane mx-auto h-[min(60vh,80vw)] w-[min(60vh,80vw)] overflow-visible" aria-hidden>
            {paths.map((d, i) => (
              <path key={i} d={d} pathLength={1} fill="none" stroke="white" strokeWidth={0.07} strokeLinejoin="round" style={{ animationDelay: `${0.15 + i * 0.09}s` }} />
            ))}
          </svg>
        </div>
      </section>

      {/* ------------------------------ story ------------------------------ */}
      <section className="mx-auto max-w-[1480px] px-4 py-24 md:px-10 md:py-36">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-20">
          <div className="md:sticky md:top-24 md:self-start">
            <div data-reveal className="eyebrow text-ink/55">
              {t("about.storyEyebrow")}
            </div>
            <h2 data-reveal className="display mt-4 text-[clamp(34px,4.2vw,68px)]">
              {t("about.storyTitle")}
            </h2>
          </div>
          <ol className="space-y-12">
            {STORY.map(([title, body], i) => (
              <li key={title} data-reveal className="grid grid-cols-[56px_1fr] gap-5 border-t border-ink/15 pt-8">
                <span className="mono text-[13px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="wide text-[clamp(20px,1.9vw,28px)] font-semibold leading-tight">{t(title)}</h3>
                  <p className="mt-3 max-w-[560px] text-[16px] leading-relaxed text-ink/70">{t(body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------ numbers ------------------------------ */}
      <section className="border-y border-ink/10 bg-paper-2">
        <dl className="mx-auto grid max-w-[1480px] grid-cols-2 gap-y-10 px-4 py-14 md:grid-cols-4 md:px-10">
          {stats.map(([n, k]) => (
            <div key={k} data-reveal className="px-2">
              <dd className="display text-[clamp(44px,5vw,84px)]">{n}</dd>
              <dt className="eyebrow mt-2 text-ink/55">{t(k)}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------ process ------------------------------ */}
      <section className="mx-auto max-w-[1480px] px-4 py-24 md:px-10 md:py-32">
        <div data-reveal className="eyebrow text-ink/55">
          {t("about.processEyebrow")}
        </div>
        <h2 data-reveal className="display mt-4 max-w-[900px] text-[clamp(34px,4.2vw,68px)]">
          {t("about.processTitle")}
        </h2>
        <ol className="mt-14 grid gap-4 md:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} data-reveal className="rounded-[26px] bg-white/60 p-7 ring-1 ring-ink/5" style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-[14px] font-semibold text-paper-2">{i + 1}</span>
              <h3 className="wide mt-6 text-[20px] font-semibold leading-tight">{t(title)}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/65">{t(body)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------ contact / lead form ------------------------------ */}
      <section id="contact" className="scroll-mt-6 bg-paper-2">
        <div className="mx-auto grid max-w-[1480px] gap-12 px-4 py-24 md:grid-cols-[1fr_1.25fr] md:gap-16 md:px-10 md:py-32">
          <div>
            <div data-reveal className="eyebrow text-ink/55">
              {t("form.eyebrow")}
            </div>
            <h2 data-reveal className="display mt-4 text-[clamp(34px,4.2vw,68px)]">
              {t("form.title")}
            </h2>
            <p data-reveal className="mt-6 max-w-[460px] text-[16px] leading-relaxed text-ink/70">
              {t("form.lead")}
            </p>
            <div data-reveal className="mt-10">
              <div className="eyebrow text-[10.5px] text-ink/50">{t("form.nextTitle")}</div>
              <ol className="mt-4 space-y-3">
                {(["form.next1", "form.next2", "form.next3"] as UIKey[]).map((k, i) => (
                  <li key={k} className="flex items-center gap-3 text-[15px]">
                    <span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-full ring-1 ring-ink/20 text-[11px]">{i + 1}</span>
                    {t(k)}
                  </li>
                ))}
              </ol>
            </div>

            <dl data-reveal className="mt-12 border-t border-ink/15">
              <div className="eyebrow pt-5 text-[10.5px] text-ink/50">{t("about.companyEyebrow")}</div>
              {company.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[150px_1fr] gap-4 border-b border-ink/10 py-3 text-[14.5px] md:grid-cols-[190px_1fr]">
                  <dt className="text-ink/50">{t(k)}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div data-reveal>
            <QuoteForm />
          </div>
        </div>
      </section>

      {/* ------------------------------ credit ------------------------------ */}
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-[1480px] flex-col items-center justify-between gap-3 px-4 py-8 text-[12.5px] text-ink/50 md:flex-row md:px-10">
          <span>© 2026 {tr.locale === "ar" ? COMPANY.legalNameAr : t("brand.company")}</span>
          <span>
            {t("credit.line")}{" "}
            <a href={CREDIT.url} target="_blank" rel="noopener" className="font-semibold text-ink/70 hover:text-ink">
              {CREDIT.name}
            </a>{" "}
            <span dir="ltr">(jstechlabs.com)</span>
          </span>
        </div>
      </footer>

      <style>{`
        html.js .about [data-reveal] { opacity: 0; transform: translateY(28px); transition: opacity 0.9s cubic-bezier(.2,.7,.2,1), transform 0.9s cubic-bezier(.2,.7,.2,1); }
        html.js .about [data-reveal][data-in="1"] { opacity: 1; transform: none; }
        .about-plane path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: about-draw 1.8s cubic-bezier(.6,.1,.2,1) forwards; }
        @keyframes about-draw { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) { html.js .about [data-reveal] { opacity: 1; transform: none; } .about-plane path { stroke-dashoffset: 0; animation: none; } }
        @media print { html.js .about [data-reveal] { opacity: 1; transform: none; } .about-plane path { stroke-dashoffset: 0; animation: none; } }
      `}</style>
    </div>
  );
}
