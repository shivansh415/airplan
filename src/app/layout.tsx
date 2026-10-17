import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans_Arabic, Inter, JetBrains_Mono } from "next/font/google";
import { LocaleSync } from "@/i18n/client";
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

export const metadata: Metadata = {
  title: "I ARCH TECH — Wholesale & Retail Aircraft Spare Parts",
  description:
    "I ARCH TECH (I Arch Tech Company): wholesale and retail aircraft spare parts. Explore the airliner, explode it into its systems and browse 144 catalogued components.",
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${cyrillic.variable} ${arabic.variable} ${mono.variable}`}>
      <body>
        <LocaleSync />
        {children}
      </body>
    </html>
  );
}
