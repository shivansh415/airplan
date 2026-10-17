# I ARCH TECH — Wholesale & Retail Aircraft Spare Parts

Website for **I Arch Tech Company**: a cinematic, interactive showcase of narrow-body airliner spare parts, supplied wholesale and retail.

- Hangar intro → flight above the clouds → "Every part / in place"
- Aircraft redrawn as a technical drawing, with an x-ray brush on hover
- Exploded view: every part floats apart, hover for details, click for its parts
- 14-chapter systems tour and a searchable catalog of 144 parts, each with its own page

Built with Next.js, React Three Fiber (three.js), GSAP + ScrollTrigger and Lenis. The airliner is generated procedurally in `src/components/three/model.ts` (generic, unbranded).

## Run locally

```bash
npm install
npm run dev
```

## Catalog data

All parts live in `src/data/parts.ts` and part images in `public/parts/`. Part numbers (`DEMO-xx-xxx`) and compatibility are placeholders until confirmed by the supplier against the aircraft IPC. Images are AI-generated and illustrative.
