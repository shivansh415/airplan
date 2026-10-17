import { NextResponse } from "next/server";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { timingSafeEqual, randomUUID } from "node:crypto";
import path from "node:path";

/**
 * Quote requests from the About page form.
 * Stored as JSON lines outside the app folder so deploys never touch them
 * (default: ../airplan-data/leads.jsonl next to the app).
 */
const LEADS_FILE = process.env.LEADS_FILE || path.join(/* turbopackIgnore: true */ process.cwd(), "..", "airplan-data", "leads.jsonl");
const INTERESTS = new Set(["wholesale", "retail", "both"]);
const recent = new Map<string, number[]>();

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+\n/g, "\n").slice(0, max) : "");

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (hits.length >= 5) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  recent.set(ip, [...hits, now]);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Bots: hidden honeypot field filled in, or submitted faster than a human could type.
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  if (str(body.website, 200) || (startedAt && now - startedAt < 2500)) return NextResponse.json({ ok: true });

  const lead = {
    id: randomUUID(),
    createdAt: new Date(now).toISOString(),
    name: str(body.name, 120),
    company: str(body.company, 160),
    email: str(body.email, 160).toLowerCase(),
    phone: str(body.phone, 40),
    country: str(body.country, 80),
    interest: INTERESTS.has(String(body.interest)) ? String(body.interest) : "",
    aircraft: str(body.aircraft, 120),
    parts: str(body.parts, 1500),
    message: str(body.message, 3000),
    part: str(body.part, 120),
    locale: str(body.locale, 5),
    page: str(body.page, 300),
    ip,
    userAgent: str(req.headers.get("user-agent"), 300),
  };

  if (lead.name.length < 2 || (!lead.email && !lead.phone)) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  try {
    await mkdir(path.dirname(LEADS_FILE), { recursive: true });
    await appendFile(LEADS_FILE, JSON.stringify(lead) + "\n", "utf8");
  } catch (e) {
    console.error("[leads] could not store lead", e);
    return NextResponse.json({ ok: false, error: "storage" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** Admin listing. Requires the x-admin-key header to match LEADS_ADMIN_KEY. */
export async function GET(req: Request) {
  const expected = process.env.LEADS_ADMIN_KEY;
  const given = req.headers.get("x-admin-key") ?? "";
  if (!expected) return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let raw = "";
  try {
    raw = await readFile(LEADS_FILE, "utf8");
  } catch {
    /* no leads yet */
  }
  const leads = raw
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
  return NextResponse.json({ ok: true, leads }, { headers: { "Cache-Control": "no-store" } });
}
