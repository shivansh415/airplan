import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans_Arabic, Inter, JetBrains_Mono } from "next/font/google";
import { LocaleSync } from "@/i18n/client";
import { PARTS } from "@/data/parts";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  // no Arial metric fallback: it would grab Cyrillic/Arabic glyphs before our real fonts
  adjustFontFallback: false,
});

// Archivo has no Cyrillic or Arabic glyphs: these take over per character.
const cyrillic = Inter({
  variable: "--font-cyrillic",
  subsets: ["cyrillic"],
});

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
});

// Runs before first paint: marks JS, applies the saved / browser language direction, and
// holds the page (max 1.5 s, see globals.css) until the right language has rendered.
const BOOT = `(function(){var d=document.documentElement;d.classList.add("js");try{var l=null;try{l=localStorage.getItem("locale")}catch(e){}var ok={en:1,ar:1,ru:1,tr:1};if(!ok[l])l=(navigator.language||"en").slice(0,2).toLowerCase();if(!ok[l])l="en";if(l!=="en"){d.lang=l;d.dir=l==="ar"?"rtl":"ltr";d.classList.add("i18n-wait")}}catch(e){}})();`;

const description = `I ARCH TECH (I Arch Tech Company): wholesale and retail aircraft spare parts. Explore the airliner, explode it into its systems and browse ${PARTS.length} catalogued components.`;

export const metadata: Metadata = {
  metadataBase: new URL("https://airfromnerza.com"),
  title: "I ARCH TECH — Wholesale & Retail Aircraft Spare Parts",
  description,
  openGraph: { type: "website", siteName: "I ARCH TECH", title: "I ARCH TECH — Wholesale & Retail Aircraft Spare Parts", description },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} ${cyrillic.variable} ${arabic.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>
        <LocaleSync />
        {children}
      </body>
    </html>
  );
}
