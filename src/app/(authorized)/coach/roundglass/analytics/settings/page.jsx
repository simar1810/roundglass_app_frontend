"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/coach/roundglass/analytics");
  }, [router]);

  return null;
}

