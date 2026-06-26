import { getSiteUrl } from "@/lib/siteUrl";
import TalentsPageClient from "./TalentsPageClient";

const siteUrl = getSiteUrl();

export const metadata = {
  title: "WoW Talents — All Spec Talent Builds for Raid & Mythic+ | UPLINK",
  description:
    "Browse all World of Warcraft spec talent builds. Filter by role, class, or search by name. BIS gear, enchants, gems, and talent trees for every spec.",
  alternates: { canonical: `${siteUrl}/wow/talents` },
};

export default function TalentsPage() {
  return <TalentsPageClient />;
}
