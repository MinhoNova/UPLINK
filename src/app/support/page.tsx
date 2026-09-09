import type { Metadata } from "next";
import SupportPageContent from "./SupportPageContent";

export const metadata: Metadata = {
  title: "Support Center — UPLINK",
  description: "Open a support ticket and our team will help you out.",
};

export default function SupportPage() {
  return <SupportPageContent />;
}