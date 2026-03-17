"use client";

import AnalyticsPrintButton from "@/components/common/AnalyticsPrintButton";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getAnalyticsSummary } from "@/lib/fetchers/roundglassAnalytics";
import { getAppClients } from "@/lib/fetchers/app";
import {
    calculateTrendDirection,
    formatMetricName,
    formatPercentile,
    getPercentileColor,
    normalizeMetricValue,
} from "@/lib/utils/roundglassAnalytics";
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Award,
    BarChart3,
    Dumbbell,
    Minus,
    Pill,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

function isMongoObjectId(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || "").trim());
}

export default function AnalyticsSummary({ categoryId = "all" }) {
  // State for filters
  const [focusQuery, setFocusQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(""); // resolved Mongo _id used by analytics APIs
  const [isResolvingClient, setIsResolvingClient] = useState(false);

  // Build API params
  const apiParams = useMemo(() => {
    const params = {
      person: "coach",
    };

    if (categoryId && categoryId !== "all") {
      params.categoryId = categoryId;
    }

    if (selectedClientId) {
      params.clientId = selectedClientId;
    }

    return params;
  }, [categoryId, selectedClientId]);

  // Build SWR key
  const swrKey = useMemo(() => {
    const keyParts = ["roundglass/analytics-summary", "coach"];

    if (categoryId && categoryId !== "all") {
      keyParts.push(`category:${categoryId}`);
    }

    if (selectedClientId) {
      keyParts.push(`client:${selectedClientId}`);
    }

    return keyParts.join("|");
  }, [categoryId, selectedClientId]);

  // Fetch summary data
  const { isLoading, error, data } = useSWR(swrKey, () => getAnalyticsSummary(apiParams));

  const summaryData = data?.data;
  const overview = summaryData?.overview;
  const healthMetrics = summaryData?.healthMetrics;
  const preferences = summaryData?.preferences;
  const trends = summaryData?.trends;
  const rankings = summaryData?.rankings;

  // Get top performers (clients with highest average percentile)
  const topPerformers = useMemo(() => {
    if (!rankings) return [];

    const clientRankings = {};
    Object.entries(rankings).forEach(([metric, data]) => {
      // Note: This assumes rankings structure includes clientId
      // If not, we'll need to aggregate differently
      if (data.clientId) {
        if (!clientRankings[data.clientId]) {
          clientRankings[data.clientId] = [];
        }
        clientRankings[data.clientId].push(data.percentile);
      }
    });

    return Object.entries(clientRankings)
      .map(([clientId, percentiles]) => ({
        clientId,
        avgPercentile: percentiles.reduce((a, b) => a + b, 0) / percentiles.length,
      }))
      .sort((a, b) => b.avgPercentile - a.avgPercentile)
      .slice(0, 5);
  }, [rankings]);

  // Get areas needing attention (metrics with low percentiles)
  const areasNeedingAttention = useMemo(() => {
    if (!rankings) return [];

    return Object.entries(rankings)
      .map(([metric, data]) => ({
        metric,
        percentile: data.percentile || 0,
        value: data.value,
      }))
      .filter((item) => item.percentile < 25)
      .sort((a, b) => a.percentile - b.percentile)
      .slice(0, 5);
  }, [rankings]);

  // Handle refresh
  const handleRefresh = () => {
    mutate(swrKey);
    toast.success("Data refreshed");
  };

  const resolveAndSetClient = async (raw) => {
    const query = String(raw || "").trim();

    if (!query) {
      setSelectedClientId("");
      return;
    }

    if (isMongoObjectId(query)) {
      setSelectedClientId(query);
      return;
    }

    setIsResolvingClient(true);
    try {
      const res = await getAppClients({ page: 1, limit: 50, search: query });
      const clients = res?.data?.clients || res?.data || [];

      const normalizedQuery = query.toLowerCase();
      const exactMatches = (Array.isArray(clients) ? clients : [])
        .filter((c) => {
          const clientCode = String(c?.clientId || "").toLowerCase();
          const mongoId = String(c?._id || c?.id || "").toLowerCase();
          return clientCode === normalizedQuery || mongoId === normalizedQuery;
        });

      if (exactMatches.length === 1) {
        const resolvedId = String(exactMatches[0]?._id || exactMatches[0]?.id || "");
        if (!resolvedId) throw new Error("Could not resolve client.");
        setSelectedClientId(resolvedId);
        return;
      }

      if (exactMatches.length > 1) {
        toast.error("Multiple players matched. Please enter an exact Client ID / Player ID.");
        return;
      }

      toast.error("No player found. Search by Client ID / Player ID (exact), or paste the full ID.");
    } catch (e) {
      toast.error(e?.message || "Could not search players. Please try again.");
    } finally {
      setIsResolvingClient(false);
    }
  };

  if (isLoading) return <ContentLoader />;

  if (error || data?.status_code !== 200) {
    return (
      <ContentError
        title={error?.message || data?.message || "Failed to load analytics summary"}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analytics Summary</CardTitle>
              <CardDescription>
                Comprehensive overview of all player analytics and metrics
              </CardDescription>
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <AnalyticsPrintButton
                variant="outline"
                size="sm"
                title="Analytics Summary Report"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
            {/* Client Filter (Optional) */}
            <div>
              <label className="text-sm font-medium mb-2 block">Focus on Player (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Search by Player ID"
                  value={focusQuery}
                  onChange={(e) => {
                    setFocusQuery(e.target.value);
                    // Don’t invalidate data on every keystroke; only apply after user action.
                    setSelectedClientId("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") resolveAndSetClient(focusQuery);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resolveAndSetClient(focusQuery)}
                  disabled={isResolvingClient}
                >
                  {isResolvingClient ? "Searching..." : "Search"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFocusQuery("");
                    setSelectedClientId("");
                  }}
                  disabled={isResolvingClient && !focusQuery}
                >
                  Clear
                </Button>
              </div>
              {selectedClientId ? (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Showing analytics for selected player.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Tip: Enter the exact Client ID.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">{overview.totalClients || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Health Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                <div className="text-2xl font-bold">{overview.clientsWithHealthData || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div className="text-2xl font-bold">{overview.clientsWithPreferences || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Training
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-purple-600" />
                <div className="text-2xl font-bold">{overview.clientsWithTraining || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Supplements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-orange-600" />
                <div className="text-2xl font-bold">{overview.clientsWithSupplements || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Injuries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="text-2xl font-bold">{overview.clientsWithInjuries || 0}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health Metrics Summary */}
      {healthMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Health Metrics Summary</CardTitle>
            <CardDescription>Key health metrics statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Mean</TableHead>
                    <TableHead>Median</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(healthMetrics)
                    .filter(([metric]) =>
                      ["bmi", "muscle", "fat", "weight"].includes(metric)
                    )
                    .map(([metric, stats]) => (
                      <TableRow key={metric}>
                        <TableCell className="font-medium">
                          {formatMetricName(metric)}
                        </TableCell>
                        <TableCell>
                          {normalizeMetricValue(stats.mean, metric)}
                        </TableCell>
                        <TableCell>
                          {normalizeMetricValue(stats.median, metric)}
                        </TableCell>
                        <TableCell>
                          {normalizeMetricValue(stats.min, metric)}
                        </TableCell>
                        <TableCell>
                          {normalizeMetricValue(stats.max, metric)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences Summary */}
      {preferences && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Training Summary */}
          {preferences.training && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Training Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {preferences.training.topFrequencies &&
                    Object.entries(preferences.training.topFrequencies)
                      .slice(0, 5)
                      .map(([frequency, count]) => (
                        <div key={frequency} className="flex items-center justify-between">
                          <span className="text-sm">{frequency}</span>
                          <Badge variant="secondary">{count} players</Badge>
                        </div>
                      ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supplements Summary */}
          {preferences.supplements && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Supplements Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {preferences.supplements.mostCommon &&
                    Object.entries(preferences.supplements.mostCommon)
                      .slice(0, 5)
                      .map(([supplement, count]) => (
                        <div key={supplement} className="flex items-center justify-between">
                          <span className="text-sm">{supplement}</span>
                          <Badge variant="secondary">{count} players</Badge>
                        </div>
                      ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Injuries Summary */}
          {preferences.injuries && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Injuries Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {preferences.injuries.commonTypes &&
                    Object.entries(preferences.injuries.commonTypes)
                      .slice(0, 5)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm">{type}</span>
                          <Badge variant="destructive">{count} cases</Badge>
                        </div>
                      ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Trends Summary */}
      {trends && (
        <Card>
          <CardHeader>
            <CardTitle>Trends Summary</CardTitle>
            <CardDescription>Direction indicators for key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(trends)
                .filter(([metric]) => ["bmi", "muscle", "fat", "weight"].includes(metric))
                .map(([metric, trendData]) => {
                  const trendInfo = calculateTrendDirection(trendData);
                  return (
                    <Card key={metric}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {formatMetricName(metric)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {trendInfo.direction === "increasing" && (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          )}
                          {trendInfo.direction === "decreasing" && (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                          {trendInfo.direction === "stable" && (
                            <Minus className="h-5 w-5 text-gray-600" />
                          )}
                          <Badge
                            variant={
                              trendInfo.direction === "increasing"
                                ? "default"
                                : trendInfo.direction === "decreasing"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {trendInfo.direction.charAt(0).toUpperCase() +
                              trendInfo.direction.slice(1)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Rate: {trendInfo.rate > 0 ? "+" : ""}
                          {trendInfo.rate.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings Summary */}
      {rankings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performers
              </CardTitle>
              <CardDescription>Players with highest average percentile rankings</CardDescription>
            </CardHeader>
            <CardContent>
              {topPerformers.length > 0 ? (
                <div className="space-y-2">
                  {topPerformers.map((performer, index) => (
                    <div
                      key={performer.clientId}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="text-sm font-medium">Player {performer.clientId.slice(-6)}</span>
                      </div>
                      <Badge variant="default">
                        {Math.round(performer.avgPercentile)}th percentile
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No ranking data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Areas Needing Attention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Areas Needing Attention
              </CardTitle>
              <CardDescription>Metrics with low percentile rankings</CardDescription>
            </CardHeader>
            <CardContent>
              {areasNeedingAttention.length > 0 ? (
                <div className="space-y-2">
                  {areasNeedingAttention.map((area) => {
                    const color = getPercentileColor(area.percentile);
                    return (
                      <div
                        key={area.metric}
                        className="flex items-center justify-between p-2 rounded-md bg-orange-50 dark:bg-orange-950/20"
                      >
                        <span className="text-sm font-medium">
                          {formatMetricName(area.metric)}
                        </span>
                        <Badge
                          variant={color === "red" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {formatPercentile(area.percentile)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  All metrics are performing well
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Navigate to detailed analytics views</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/coach/roundglass/analytics?tab=category-comparison">
              <Button variant="outline" className="w-full justify-between">
                Category Comparison
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/coach/roundglass/analytics?tab=trends">
              <Button variant="outline" className="w-full justify-between">
                Trends Analysis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/coach/roundglass/analytics?tab=rankings">
              <Button variant="outline" className="w-full justify-between">
                Player Rankings
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/coach/roundglass/analytics?tab=correlations">
              <Button variant="outline" className="w-full justify-between">
                Correlations
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/coach/roundglass/analytics?tab=distribution">
              <Button variant="outline" className="w-full justify-between">
                Distribution
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/coach/roundglass/analytics?tab=preferences">
              <Button variant="outline" className="w-full justify-between">
                Preferences
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {!isLoading && !summaryData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Summary Data Available</h3>
              <p className="text-muted-foreground">
                Analytics summary data will appear here once players have health data
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

