"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tabChange } from "@/lib/formatter";
import { BarChart3 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AnalyticsErrorBoundary from "@/components/common/AnalyticsErrorBoundary";
import TeamDataExport from "@/components/pages/roundglass/TeamDataExport";
import RequireScope from "@/components/common/RequireScope";

// Import all analytics components
import AnalyticsSummary from "@/components/pages/roundglass/AnalyticsSummary";
import CategoryComparison from "@/components/pages/roundglass/CategoryComparison";
import TrendsAnalysis from "@/components/pages/roundglass/TrendsAnalysis";
import ClientRanking from "@/components/pages/roundglass/ClientRanking";
import CorrelationsAnalysis from "@/components/pages/roundglass/CorrelationsAnalysis";
import DistributionAnalysis from "@/components/pages/roundglass/DistributionAnalysis";
import PreferencesAnalysis from "@/components/pages/roundglass/PreferencesAnalysis";

const tabItems = [
  {
    id: 1,
    title: "Summary",
    value: "summary",
  },
  {
    id: 2,
    title: "Group Comparison",
    value: "category-comparison",
  },
  {
    id: 3,
    title: "Trends",
    value: "trends",
  },
  {
    id: 4,
    title: "Rankings",
    value: "rankings",
  },
  {
    id: 5,
    title: "Correlations",
    value: "correlations",
  },
  {
    id: 6,
    title: "Distribution",
    value: "distribution",
  },
  {
    id: 7,
    title: "Preferences",
    value: "preferences",
  },
];

export default function Page() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();

  // Get selected tab from URL, default to "summary"
  const selectedTab = tabItems.map((item) => item.value).includes(params.get("tab"))
    ? params.get("tab")
    : "summary";

  // Handle tab change
  const handleTabChange = (value) => {
    tabChange(value, router, params, pathname);
  };

  // Category filtering is handled per-tab (more intuitive for users).
  const defaultCategoryIdsForExport = [];

  return (
    <RequireScope scope="analytics">
      <AnalyticsErrorBoundary
        message="An error occurred while loading the analytics dashboard. Please try refreshing the page."
        onReset={() => window.location.reload()}
      >
        <div className="content-container space-y-6">
        {/* Header Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Roundglass Analytics
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Comprehensive analytics and insights for your players
                </p>
              </div>
              <div className="flex gap-2">
                <TeamDataExport
                  defaultCategoryIds={defaultCategoryIdsForExport}
                  defaultFormat="excel"
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Global date filters removed (each tab can manage its own date range if needed). */}
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <Tabs
          value={selectedTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-6">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.value}
              className="text-sm"
            >
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="summary" className="mt-0">
          <AnalyticsSummary />
        </TabsContent>

        <TabsContent value="category-comparison" className="mt-0">
          <CategoryComparison />
        </TabsContent>

        <TabsContent value="trends" className="mt-0">
          <TrendsAnalysis />
        </TabsContent>

        <TabsContent value="rankings" className="mt-0">
          <ClientRanking />
        </TabsContent>

        <TabsContent value="correlations" className="mt-0">
          <CorrelationsAnalysis />
        </TabsContent>

        <TabsContent value="distribution" className="mt-0">
          <DistributionAnalysis />
        </TabsContent>

        <TabsContent value="preferences" className="mt-0">
          <PreferencesAnalysis />
        </TabsContent>
        </Tabs>
      </div>
      </AnalyticsErrorBoundary>
    </RequireScope>
  );
}

