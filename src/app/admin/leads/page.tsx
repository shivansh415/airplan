import type { Metadata } from "next";
import { LeadsAdmin } from "./LeadsAdmin";

export const metadata: Metadata = {
  title: "Leads — I ARCH TECH",
  robots: { index: false, follow: false },
};

export default function LeadsPage() {
  return <LeadsAdmin />;
}
