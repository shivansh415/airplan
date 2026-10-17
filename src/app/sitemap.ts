import type { MetadataRoute } from "next";
import { PARTS } from "@/data/parts";

const BASE = "https://airfromnerza.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, priority: 1 },
    { url: `${BASE}/about`, priority: 0.9 },
    ...PARTS.map((p) => ({ url: `${BASE}/parts/${p.id}`, priority: 0.6 })),
  ];
}
