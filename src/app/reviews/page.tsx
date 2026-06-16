import type { Metadata } from "next";
import ReviewsPageContent from "./ReviewsPageContent";

export const metadata: Metadata = {
  title: "Reviews — UPLINK",
  description: "Read reviews and ratings from the UPLINK community. Share your experience with the premier WoW boosting marketplace.",
  openGraph: {
    title: "Reviews — UPLINK",
    description: "Read reviews and ratings from the UPLINK community. Share your experience with the premier WoW boosting marketplace.",
  },
};

export default function ReviewsPage() {
  return <ReviewsPageContent />;
}
