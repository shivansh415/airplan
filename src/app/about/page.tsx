import type { Metadata } from "next";
import { AboutView } from "@/components/AboutView";

export const metadata: Metadata = {
  title: "About — I ARCH TECH | Wholesale & Retail Aircraft Spare Parts",
  description:
    "I Arch Tech Company is a Saudi limited liability company in Al Madinah Al Munawwarah supplying aircraft spare parts, wholesale and retail. Request a quote.",
};

export default function AboutPage() {
  return <AboutView />;
}
