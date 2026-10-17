"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  createdAt: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  interest: string;
  aircraft: string;
  parts: string;
  message: string;
  part: string;
  locale: string;
};

const COLUMNS: (keyof Lead)[] = ["createdAt", "name", "company", "email", "phone", "country", "interest", "aircraft", "parts", "message", "part", "locale"];

function toCsv(leads: Lead[]) {
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [COLUMNS.join(","), ...leads.map((l) => COLUMNS.map((c) => esc(l[c])).join(","))].join("\n");
}

/** Private list of quote requests. The key is kept only for this browser tab. */
export function LeadsAdmin() {
  const [key, setKey] = useState("");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (k: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads", { headers: { "x-admin-key": k }, cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error === "unauthorized" ? "Wrong key." : data.error === "disabled" ? "Admin key is not configured on the server." : "Could not load leads.");
      setLeads(data.leads);
      sessionStorage.setItem("leads-key", k);
    } catch (e) {
      setLeads(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("leads-key");
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved session once on mount
      setKey(saved);
      void load(saved);
    }
  }, []);

  const download = () => {
    if (!leads) return;
    const blob = new Blob(["﻿" + toCsv(leads)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `iarchtech-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <main dir="ltr" className="min-h-screen bg-paper px-4 py-10 text-ink md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="eyebrow text-ink/50">I ARCH TECH · private</div>
        <h1 className="display mt-3 text-[clamp(36px,5vw,64px)]">Quote requests</h1>

        <form
          className="mt-8 flex max-w-[560px] gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void load(key);
          }}
        >
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
            autoComplete="off"
            className="flex-1 rounded-full bg-white px-5 py-3 text-[15px] outline-none ring-1 ring-ink/10 focus:ring-ink/30"
          />
          <button className="btn btn-dark" disabled={!key || loading}>
            {loading ? "Loading…" : "Open"}
          </button>
        </form>
        {error && <p className="mt-4 text-[14px] text-red-700">{error}</p>}

        {leads && (
          <>
            <div className="mt-10 flex items-center justify-between">
              <span className="mono text-[12px] text-ink/60">{leads.length} requests · newest first</span>
              <div className="flex gap-3">
                <button onClick={() => load(key)} className="btn btn-ghost">
                  Refresh
                </button>
                <button onClick={download} className="btn btn-dark" disabled={!leads.length}>
                  Download CSV
                </button>
              </div>
            </div>
            {leads.length === 0 ? (
              <p className="mt-16 text-center text-ink/55">No requests yet.</p>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-2xl bg-white/70 ring-1 ring-ink/10">
                <table className="w-full min-w-[1100px] text-left text-[13.5px]">
                  <thead className="eyebrow text-[10px] text-ink/50">
                    <tr>
                      {["Date", "Name", "Company", "Contact", "Country", "Interest", "Aircraft", "Parts / message"].map((h) => (
                        <th key={h} className="border-b border-ink/10 px-4 py-3 font-normal">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id} className="align-top odd:bg-paper/40">
                        <td className="mono whitespace-nowrap px-4 py-3 text-[11.5px] text-ink/60">{new Date(l.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold">{l.name}</td>
                        <td className="px-4 py-3">{l.company}</td>
                        <td className="px-4 py-3">
                          {l.email && (
                            <a className="block underline" href={`mailto:${l.email}`}>
                              {l.email}
                            </a>
                          )}
                          {l.phone && <span className="block">{l.phone}</span>}
                        </td>
                        <td className="px-4 py-3">{l.country}</td>
                        <td className="px-4 py-3 capitalize">{l.interest}</td>
                        <td className="px-4 py-3">{l.aircraft}</td>
                        <td className="max-w-[380px] whitespace-pre-wrap px-4 py-3">
                          {l.part && <span className="mono block text-[11px] text-accent">part: {l.part}</span>}
                          {l.parts}
                          {l.message && <span className="mt-1 block text-ink/65">{l.message}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
