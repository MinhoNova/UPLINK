import type { Metadata } from "next";
import ShopPageContent from "./ShopPageContent";

export const metadata: Metadata = {
  title: "Secret Club Shop — UPLINK",
  description:
    "Subscribe to UPLINK Secret Club. Unlock exclusive perks: profile GIFs, banner effects, lobby VFX, auto-apply, hidden identity, and Community Club access.",
  openGraph: {
    title: "Secret Club Shop — UPLINK",
    description:
      "Subscribe to UPLINK Secret Club. Unlock exclusive perks: profile GIFs, banner effects, lobby VFX, auto-apply, hidden identity, and Community Club access.",
  },
};

export default function ShopPage() {
  return <ShopPageContent />;
}
