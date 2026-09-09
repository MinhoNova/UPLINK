"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/analytics/view", { method: "POST" }).catch(() => {});
  }, [pathname]);

  return null;
}