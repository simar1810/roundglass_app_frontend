"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { tabChange } from "@/lib/formatter";
import { useAppSelector } from "@/providers/global/hooks";
import { format } from "date-fns";
import { CalendarIcon, Download, BarChart3, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AnalyticsErrorBoundary from "@/components/common/AnalyticsErrorBoundary";

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
    title: "Category Comparison",
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

  const { client_categories = [] } = useAppSelector((state) => state.coach.data);

  // Get selected tab from URL, default to "summary"
  const selectedTab = tabItems.map((item) => item.value).includes(params.get("tab"))
    ? params.get("tab")
    : "summary";

  // Global filters state
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    params.get("categoryId") || "all"
  );
  const [dateFrom, setDateFrom] = useState(
    params.get("dateFrom")
      ? new Date(params.get("dateFrom"))
      : undefined
  );
  const [dateTo, setDateTo] = useState(
    params.get("dateTo")
      ? new Date(params.get("dateTo"))
      : undefined
  );
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  // Prepare category options
  const categoryOptions = useMemo(() => {
    return client_categories.map((cat) => ({
      value: cat._id,
      label: cat.name || cat.title || "Unknown",
    }));
  }, [client_categories]);

  // Handle tab change
  const handleTabChange = (value) => {
    tabChange(value, router, params, pathname);
  };

  // Handle export all data
  const handleExportAll = () => {
    toast.info("Export functionality coming soon");
    // TODO: Implement export all analytics data
  };

  // Update URL params when filters change
  const updateFilterParams = (key, value) => {
    const newParams = new URLSearchParams(params.toString());
    if (value && value !== "all") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  // Handle category change
  const handleCategoryChange = (value) => {
    setSelectedCategoryId(value);
    // If "all" is selected, remove the categoryId param
    if (value === "all") {
      const newParams = new URLSearchParams(params.toString());
      newParams.delete("categoryId");
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    } else {
      updateFilterParams("categoryId", value);
    }
  };

  // Handle date from change
  const handleDateFromChange = (date) => {
    setDateFrom(date);
    if (date) {
      updateFilterParams("dateFrom", format(date, "yyyy-MM-dd"));
    } else {
      const newParams = new URLSearchParams(params.toString());
      newParams.delete("dateFrom");
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
    setDateFromOpen(false);
  };

  // Handle date to change
  const handleDateToChange = (date) => {
    setDateTo(date);
    if (date) {
      updateFilterParams("dateTo", format(date, "yyyy-MM-dd"));
    } else {
      const newParams = new URLSearchParams(params.toString());
      newParams.delete("dateTo");
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
    setDateToOpen(false);
  };

  return (
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
                Comprehensive analytics and insights for your clients
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/coach/roundglass/analytics/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleExportAll}>
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Global Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category (Optional)</label>
              <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date From (Optional)</label>
              <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={handleDateFromChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date To (Optional)</label>
              <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={handleDateToChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
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
  );
}

