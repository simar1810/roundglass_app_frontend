"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  Dumbbell, 
  Pill, 
  AlertCircle,
  ArrowRight,
  Target,
  Award
} from "lucide-react";
import Link from "next/link";
import { getAnalyticsSummary } from "@/lib/fetchers/roundglassAnalytics";
import { formatMetricName, normalizeMetricValue } from "@/lib/utils/roundglassAnalytics";
import useSWR from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";

export default function AnalyticsOverview() {
  const { isLoading, error, data } = useSWR(
    "dashboard-analytics-summary",
    () => getAnalyticsSummary({ person: "coach" })
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ContentLoader />
        </CardContent>
      </Card>
    );
  }

  if (error || data?.status_code !== 200) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ContentError 
            title={error?.message || data?.message || "Failed to load analytics overview"}
            className="!min-h-[200px]"
          />
        </CardContent>
      </Card>
    );
  }

  const summaryData = data?.data;
  const overview = summaryData?.overview || {};
  const healthMetrics = summaryData?.healthMetrics || {};
  const preferences = summaryData?.preferences || {};

  // Calculate improvement trends
  const totalPlayers = overview.totalClients || 0;
  const playersWithHealthData = overview.clientsWithHealthData || 0;
  const playersWithTraining = overview.clientsWithTraining || 0;
  const playersWithSupplements = overview.clientsWithSupplements || 0;

  // Calculate percentages
  const healthDataPercentage = totalPlayers > 0 
    ? Math.round((playersWithHealthData / totalPlayers) * 100) 
    : 0;
  const trainingPercentage = totalPlayers > 0 
    ? Math.round((playersWithTraining / totalPlayers) * 100) 
    : 0;

  return (
    <Card className="h-full border border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="w-4 h-4 text-[var(--accent-1)]" />
              Analytics overview
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              High‑level snapshot of how your academy is doing today.
            </CardDescription>
          </div>
          <Link href="/coach/roundglass/analytics">
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
              View details
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900">
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Total players
              </span>
            </div>
            <div className="text-2xl font-semibold leading-tight text-blue-900 dark:text-blue-100">
              {totalPlayers}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-green-50/70 dark:bg-green-950/60 border border-green-100 dark:border-green-900">
            <div className="flex items-center gap-2 mb-1.5">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                With health data
              </span>
            </div>
            <div className="text-2xl font-semibold leading-tight text-green-900 dark:text-green-100">
              {playersWithHealthData}
            </div>
            <div className="text-[11px] text-green-600 dark:text-green-400 mt-1.5">
              {healthDataPercentage}% coverage
            </div>
          </div>

          <div className="p-3 rounded-lg bg-purple-50/70 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900">
            <div className="flex items-center gap-2 mb-1.5">
              <Dumbbell className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                Active training
              </span>
            </div>
            <div className="text-2xl font-semibold leading-tight text-purple-900 dark:text-purple-100">
              {playersWithTraining}
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1.5">
              {trainingPercentage}% active
            </div>
          </div>

          <div className="p-3 rounded-lg bg-orange-50/70 dark:bg-orange-950/60 border border-orange-100 dark:border-orange-900">
            <div className="flex items-center gap-2 mb-1.5">
              <Pill className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                With supplements
              </span>
            </div>
            <div className="text-2xl font-semibold leading-tight text-orange-900 dark:text-orange-100">
              {playersWithSupplements}
            </div>
          </div>
        </div>

        {/* Health Metrics Summary */}
        {healthMetrics && Object.keys(healthMetrics).length > 0 && (
          <div className="pt-3 border-t border-border/60">
            <h5 className="text-xs font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
              <Target className="w-3.5 h-3.5" />
              Key health metrics
            </h5>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(healthMetrics)
                .filter(([metric]) =>
                  ["bmi", "muscle", "fat", "weight", "rm", "bodyAge"].includes(metric)
                )
                .slice(0, 6)
                .map(([metric, stats]) => {
                  const displayValue =
                    typeof stats === "object" && stats !== null
                      ? stats.mean || stats.median || stats.value || "—"
                      : stats;

                  return (
                    <div
                      key={metric}
                      className="flex items-center justify-between rounded-md bg-muted/60 px-2.5 py-2"
                    >
                      <span className="text-xs font-medium truncate">
                        {formatMetricName(metric)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-medium px-2 py-0.5 leading-none"
                      >
                        {normalizeMetricValue(displayValue, metric, 1)}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-3 border-t border-border/60">
          <h5 className="text-xs font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
            <Award className="w-3.5 h-3.5" />
            Quick actions
          </h5>
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/coach/roundglass/analytics?tab=summary">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-8 px-2.5 text-xs"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                Summary
              </Button>
            </Link>
            <Link href="/coach/roundglass/analytics?tab=trends">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-8 px-2.5 text-xs"
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                Trends
              </Button>
            </Link>
            <Link href="/coach/roundglass/analytics?tab=rankings">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-8 px-2.5 text-xs"
              >
                <Award className="w-3.5 h-3.5 mr-1.5" />
                Rankings
              </Button>
            </Link>
            <Link href="/coach/clients">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-8 px-2.5 text-xs"
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Manage players
              </Button>
            </Link>
          </div>
        </div>

        {/* Alerts/Warnings */}
        {healthDataPercentage < 50 && totalPlayers > 0 && (
          <div className="pt-3 border-t border-border/60">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/70 border border-yellow-100 dark:border-yellow-800">
              <AlertCircle className="w-3.5 h-3.5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">
                  Low health data coverage
                </p>
                <p className="text-[11px] text-yellow-700 dark:text-yellow-300 mt-1 leading-relaxed">
                  Only {healthDataPercentage}% of players have health data. Nudge players to
                  complete their assessments to unlock better insights.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

