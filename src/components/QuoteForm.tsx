"use client";

import { useEffect, useRef, useState } from "react";
import { partById } from "@/data/parts";
import { COMPANY } from "@/lib/company";
import { useT } from "@/i18n/client";
import type { UIKey } from "@/i18n/en";

type Interest = "wholesale" | "retail" | "both";
const INTERESTS: { id: Interest; label: UIKey }[] = [
  { id: "wholesale", label: "form.interest.wholesale" },
  { id: "retail", label: "form.interest.retail" },
  { id: "both", label: "form.interest.both" },
];

const field =
  "peer w-full rounded-2xl bg-white px-4 pb-2.5 pt-6 text-[15px] text-ink outline-none ring-1 ring-ink/10 transition-shadow placeholder:text-transparent focus:ring-2 focus:ring-accent/60";
const label =
  "pointer-events-none absolute start-4 top-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/45 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[14px] peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-[0.08em]";

/** Lead form: posts to /api/leads. Picks up ?part=<id> to pre-fill the request. */
export function QuoteForm() {
  const tr = useT();
  const { t } = tr;
  const [interest, setInterest] = useState<Interest>("wholesale");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [partId, setPartId] = useState("");
  const [prefill, setPrefill] = useState("");
  const startedAt = useRef(0);
  const thanks = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    const id = new URLSearchParams(window.location.search).get("part") ?? "";
    const p = id ? partById(id) : undefined;
    if (p) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the URL on mount
      setPartId(p.id);
      setPrefill(`${p.name} (${p.ata}, ${p.partNumber})`);
    }
  }, []);

  // move focus to the confirmation so keyboard / screen-reader users hear it
  useEffect(() => {
    if (state === "done") thanks.current?.focus();
  }, [state]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (v("name").length < 2 || (!v("email") && !v("phone"))) {
      setError(t("form.errRequired"));
      setState("error");
      return;
    }
    if (v("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) {
      setError(t("form.errEmail"));
      setState("error");
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v("name"),
          company: v("company"),
          email: v("email"),
          phone: v("phone"),
          country: v("country"),
          aircraft: v("aircraft"),
          parts: v("parts"),
          message: v("message"),
          website: v("website"),
          interest,
          part: partId,
          locale: tr.locale,
          page: window.location.pathname + window.location.search,
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setError(t("form.error", { email: COMPANY.email }));
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div role="status" className="rounded-[28px] bg-white p-8 text-center shadow-[0_30px_80px_-40px_rgba(42,36,32,0.5)] md:p-12">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent text-[22px] text-white">✓</div>
        <h3 ref={thanks} tabIndex={-1} className="wide mt-6 outline-none text-[clamp(22px,2.4vw,30px)] font-semibold">{t("form.successTitle")}</h3>
        <p className="mx-auto mt-3 max-w-[420px] text-[15px] leading-relaxed text-ink/65">{t("form.successBody")}</p>
        <button
          onClick={() => {
            startedAt.current = Date.now();
            setState("idle");
          }}
          className="btn btn-ghost mt-8"
        >
          {t("form.again")}
        </button>
      </div>
    );
  }

  const optional = <span className="ms-1 normal-case tracking-normal opacity-70">({t("form.optional")})</span>;
  return (
    <form onSubmit={submit} noValidate className="rounded-[28px] bg-white/60 p-5 shadow-[0_30px_80px_-40px_rgba(42,36,32,0.5)] ring-1 ring-ink/5 backdrop-blur md:p-8">
      {/* honeypot: hidden from people, irresistible to bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />

      <fieldset>
        <legend className="eyebrow mb-3 text-[10.5px] text-ink/55">{t("form.interest")}</legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button
              key={i.id}
              type="button"
              data-on={interest === i.id}
              onClick={() => setInterest(i.id)}
              className="chip px-4 py-2 text-[13.5px]"
              aria-pressed={interest === i.id}
            >
              {t(i.label)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <label className="relative block">
          <input name="name" required autoComplete="name" placeholder=" " className={field} />
          <span className={label}>{t("form.name")} *</span>
        </label>
        <label className="relative block">
          <input name="company" autoComplete="organization" placeholder=" " className={field} />
          <span className={label}>{t("form.company")}</span>
        </label>
        <label className="relative block">
          <input name="email" type="email" autoComplete="email" placeholder=" " className={field} dir="ltr" />
          <span className={label}>{t("form.email")} *</span>
        </label>
        <label className="relative block">
          <input name="phone" type="tel" autoComplete="tel" placeholder=" " className={field} dir="ltr" />
          <span className={label}>{t("form.phone")}</span>
        </label>
        <label className="relative block">
          <input name="country" autoComplete="country-name" placeholder=" " className={field} />
          <span className={label}>{t("form.country")}</span>
        </label>
        <label className="relative block">
          <input name="aircraft" placeholder=" " className={field} />
          <span className={label}>{t("form.aircraft")}</span>
          <span className="mt-1 block px-1 text-[11.5px] text-ink/45">{t("form.aircraftPh")}</span>
        </label>
        <label className="relative block md:col-span-2">
          <textarea key={prefill} defaultValue={prefill} name="parts" rows={3} placeholder=" " className={`${field} resize-y`} />
          <span className={label}>{t("form.parts")}</span>
          <span className="mt-1 block px-1 text-[11.5px] text-ink/45">{t("form.partsPh")}</span>
        </label>
        <label className="relative block md:col-span-2">
          <textarea name="message" rows={3} placeholder=" " className={`${field} resize-y`} />
          <span className={label}>
            {t("form.message")}
            {optional}
          </span>
        </label>
      </div>

      {state === "error" && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12.5px] text-ink/50">{t("form.privacy")}</p>
        <button type="submit" disabled={state === "sending"} className="btn btn-dark justify-center px-7 disabled:opacity-60">
          {state === "sending" ? t("form.sending") : t("form.submit")}
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-[12px] rtl:-scale-x-100">→</span>
        </button>
      </div>
    </form>
  );
}
