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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--accent-1)]" />
              Analytics Overview
            </CardTitle>
            <CardDescription>
              Quick insights into your academy's performance
            </CardDescription>
          </div>
          <Link href="/coach/roundglass/analytics">
            <Button variant="outline" size="sm">
              View Full Analytics
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Players</span>
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {totalPlayers}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">With Health Data</span>
            </div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {playersWithHealthData}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-2">
              {healthDataPercentage}% coverage
            </div>
          </div>

          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Training</span>
            </div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {playersWithTraining}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              {trainingPercentage}% active
            </div>
          </div>

          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">With Supplements</span>
            </div>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
              {playersWithSupplements}
            </div>
          </div>
        </div>

        {/* Health Metrics Summary */}
        {healthMetrics && Object.keys(healthMetrics).length > 0 && (
          <div className="pt-5 border-t">
            <h5 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Key Health Metrics
            </h5>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(healthMetrics)
                .filter(([metric]) => 
                  ["bmi", "muscle", "fat", "weight", "rm", "bodyAge"].includes(metric)
                )
                .slice(0, 6)
                .map(([metric, stats]) => {
                  // Handle both object (with mean, median, etc.) and number values
                  const displayValue = typeof stats === 'object' && stats !== null
                    ? stats.mean || stats.median || stats.value || '—'
                    : stats;
                  
                  return (
                    <div key={metric} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <span className="text-sm font-medium">
                        {formatMetricName(metric)}
                      </span>
                      <Badge variant="secondary" className="text-sm">
                        {normalizeMetricValue(displayValue, metric, 1)}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-5 border-t">
          <h5 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Quick Actions
          </h5>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/coach/roundglass/analytics?tab=summary">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Summary
              </Button>
            </Link>
            <Link href="/coach/roundglass/analytics?tab=trends">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Trends
              </Button>
            </Link>
            <Link href="/coach/roundglass/analytics?tab=rankings">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Award className="w-4 h-4 mr-2" />
                Player Rankings
              </Button>
            </Link>
            <Link href="/coach/clients">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Players
              </Button>
            </Link>
          </div>
        </div>

        {/* Alerts/Warnings */}
        {healthDataPercentage < 50 && totalPlayers > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                  Low Health Data Coverage
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Only {healthDataPercentage}% of players have health data. Consider encouraging more players to complete their health assessments.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

