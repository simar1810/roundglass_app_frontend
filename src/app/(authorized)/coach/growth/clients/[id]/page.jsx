"use client";

import ClientGrowthStatus from "@/components/pages/growth/ClientGrowthStatus";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

export default function Page() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className="content-container space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Client Growth Tracking</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Link
                href="/coach/growth/dashboard"
                className="hover:text-[var(--accent-1)] transition-colors"
              >
                Growth Dashboard
              </Link>
              <span>/</span>
              <span>Client Details</span>
            </div>
          </div>
        </div>
        <Link href="/coach/growth/dashboard">
          <Button variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Client Growth Status Component */}
      <ClientGrowthStatus clientId={id} />
    </div>
  );
}






