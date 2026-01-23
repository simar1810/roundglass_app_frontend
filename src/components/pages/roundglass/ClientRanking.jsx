"use client";

import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import SelectMultiple from "@/components/SelectMultiple";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getClientRanking } from "@/lib/fetchers/roundglassAnalytics";
import { getAppClientPortfolioDetails } from "@/lib/fetchers/app";
import {
  formatPercentile,
  formatMetricName,
  normalizeMetricValue,
  getPercentileColor,
  formatRank,
} from "@/lib/utils/roundglassAnalytics";
import { nameInitials } from "@/lib/formatter";
import { useAppSelector } from "@/providers/global/hooks";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw, TrendingUp, TrendingDown, Award, AlertCircle } from "lucide-react";

// Available metrics
const AVAILABLE_METRICS = [
  { value: "bmi", label: "BMI" },
  { value: "muscle", label: "Muscle %" },
  { value: "fat", label: "Fat %" },
  { value: "rm", label: "Resting Metabolic Rate" },
  { value: "ideal_weight", label: "Ideal Weight" },
  { value: "bodyAge", label: "Body Age" },
  { value: "visceral_fat", label: "Visceral Fat" },
  { value: "weight", label: "Weight" },
  { value: "sub_fat", label: "Subcutaneous Fat" },
  { value: "chest", label: "Chest" },
  { value: "arm", label: "Arm" },
  { value: "abdomen", label: "Abdomen" },
  { value: "waist", label: "Waist" },
  { value: "hip", label: "Hip" },
  { value: "thighs", label: "Thighs" },
  { value: "height", label: "Height" },
  { value: "shoulder_distance", label: "Shoulder Distance" },
];

export default function ClientRanking({ person = "coach", clientId: propClientId = null }) {
  const { client_categories = [] } = useAppSelector((state) => state.coach.data);

  // State for filters
  const [clientId, setClientId] = useState(propClientId);
  const [comparisonGroup, setComparisonGroup] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState([]);

  // Fetch client details (for coach view or if clientId is provided)
  const { isLoading: clientLoading, error: clientError, data: clientData } = useSWR(
    clientId || person === "client" ? `client-ranking-details/${clientId || "current"}` : null,
    () => {
      if (person === "client") {
        // For client view, we don't need to fetch client details separately
        // The API will use the authenticated client
        return Promise.resolve({ status_code: 200, data: null });
      }
      return getAppClientPortfolioDetails(clientId);
    }
  );

  const client = clientData?.data;

  // Build API params
  const apiParams = useMemo(() => {
    const params = {
      person,
    };

    if (person === "coach" && clientId) {
      params.clientId = clientId;
    }

    if (comparisonGroup) {
      params.comparisonGroup = comparisonGroup;
    }

    if (comparisonGroup === "category" && selectedCategoryId) {
      params.categoryId = selectedCategoryId;
    }

    if (selectedMetrics.length > 0) {
      params.metrics = selectedMetrics;
    }

    return params;
  }, [person, clientId, comparisonGroup, selectedCategoryId, selectedMetrics]);

  // Build SWR key
  const swrKey = useMemo(() => {
    const keyParts = [
      "roundglass/client-ranking",
      person,
      clientId || "current",
      comparisonGroup,
    ];

    if (comparisonGroup === "category" && selectedCategoryId) {
      keyParts.push(`category:${selectedCategoryId}`);
    }

    if (selectedMetrics.length > 0) {
      keyParts.push(`metrics:${selectedMetrics.join(",")}`);
    }

    return keyParts.join("|");
  }, [person, clientId, comparisonGroup, selectedCategoryId, selectedMetrics]);

  // Fetch ranking data
  const { isLoading, error, data } = useSWR(
    (person === "client" || (person === "coach" && clientId)) ? swrKey : null,
    () => getClientRanking(apiParams)
  );

  const rankingData = data?.data;
  const graphData = data?.graphData;

  // Prepare category options
  const categoryOptions = useMemo(() => {
    return client_categories.map((cat) => ({
      value: cat._id,
      label: cat.name || cat.title || "Unknown",
    }));
  }, [client_categories]);

  // Prepare radar chart data
  const radarChartData = useMemo(() => {
    if (!graphData?.radarChart) return [];

    const { labels, datasets } = graphData.radarChart;
    if (!labels || !datasets || datasets.length === 0) return [];

    return labels.map((label, index) => ({
      metric: formatMetricName(label),
      percentile: datasets[0].data[index] || 0,
      fullLabel: label,
    }));
  }, [graphData]);

  // Prepare percentile bar data
  const percentileBarData = useMemo(() => {
    if (!rankingData?.rankings) return [];

    return Object.entries(rankingData.rankings).map(([metric, data]) => ({
      metric: formatMetricName(metric),
      percentile: data.percentile || 0,
      value: data.value,
      rank: data.rank,
      total: data.total,
      fullMetric: metric,
    }));
  }, [rankingData]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!rankingData?.rankings) return null;

    const rankings = Object.values(rankingData.rankings);
    const percentiles = rankings.map((r) => r.percentile).filter((p) => p !== null && p !== undefined);

    if (percentiles.length === 0) return null;

    const avgPercentile = percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length;

    // Find best and worst performing metrics
    const sortedRankings = [...rankings].sort((a, b) => (b.percentile || 0) - (a.percentile || 0));
    const bestMetric = sortedRankings[0];
    const worstMetric = sortedRankings[sortedRankings.length - 1];

    return {
      avgPercentile: Math.round(avgPercentile),
      bestMetric: bestMetric
        ? {
            metric: Object.keys(rankingData.rankings).find(
              (k) => rankingData.rankings[k].percentile === bestMetric.percentile
            ),
            percentile: bestMetric.percentile,
          }
        : null,
      worstMetric: worstMetric
        ? {
            metric: Object.keys(rankingData.rankings).find(
              (k) => rankingData.rankings[k].percentile === worstMetric.percentile
            ),
            percentile: worstMetric.percentile,
          }
        : null,
    };
  }, [rankingData]);

  // Handle refresh
  const handleRefresh = () => {
    mutate(swrKey);
    if (clientId) {
      mutate(`client-ranking-details/${clientId}`);
    }
    toast.success("Data refreshed");
  };

  if (clientLoading) return <ContentLoader />;

  if (clientError || clientData?.status_code !== 200) {
    if (person === "client") {
      // For client view, continue even if client details fetch fails
    } else {
      return (
        <ContentError
          title={clientError?.message || clientData?.message || "Failed to load client data"}
        />
      );
    }
  }

  if (isLoading) return <ContentLoader />;

  if (error || data?.status_code !== 200) {
    return (
      <ContentError
        title={error?.message || data?.message || "Failed to load ranking data"}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {client && (
                <>
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={client.profilePhoto} />
                    <AvatarFallback>{nameInitials(client.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{client.name}</CardTitle>
                    <CardDescription>
                      {client.email || client.mobileNumber || "Client details"}
                    </CardDescription>
                  </div>
                </>
              )}
              {person === "client" && (
                <div>
                  <CardTitle className="text-xl">My Rankings</CardTitle>
                  <CardDescription>Your percentile rankings compared to peers</CardDescription>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Client Selector (Coach only) */}
            {person === "coach" && !propClientId && (
              <div>
                <label className="text-sm font-medium mb-2 block">Client</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter client ID"
                  value={clientId || ""}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>
            )}

            {/* Comparison Group Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Comparison Group</label>
              <Select value={comparisonGroup} onValueChange={setComparisonGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Selector (if comparisonGroup="category") */}
            {comparisonGroup === "category" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Metrics Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Metrics</label>
              <SelectMultiple
                label="Select metrics (all if empty)"
                options={AVAILABLE_METRICS}
                value={selectedMetrics}
                onChange={setSelectedMetrics}
                searchable
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall Percentile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">{summary.avgPercentile}</div>
                <span className="text-sm text-muted-foreground">th percentile</span>
              </div>
            </CardContent>
          </Card>

          {summary.bestMetric && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Best Performing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-lg font-bold">
                      {formatMetricName(summary.bestMetric.metric)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercentile(summary.bestMetric.percentile)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {summary.worstMetric && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Needs Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-lg font-bold">
                      {formatMetricName(summary.worstMetric.metric)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercentile(summary.worstMetric.percentile)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        {radarChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Percentile Overview</CardTitle>
              <CardDescription>
                Visual representation of strengths and weaknesses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarChartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Percentile"
                      dataKey="percentile"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Percentile Bars */}
        {percentileBarData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Percentile Rankings</CardTitle>
              <CardDescription>
                Detailed percentile breakdown by metric
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {percentileBarData.map((item) => {
                  const color = getPercentileColor(item.percentile);
                  const colorClass =
                    color === "green"
                      ? "bg-green-500"
                      : color === "yellow"
                      ? "bg-yellow-500"
                      : "bg-red-500";

                  return (
                    <div key={item.fullMetric} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.metric}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              color === "green"
                                ? "default"
                                : color === "yellow"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {formatPercentile(item.percentile)}
                          </Badge>
                        </div>
                      </div>
                      <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            color === "green"
                              ? "bg-green-500"
                              : color === "yellow"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          )}
                          style={{ width: `${item.percentile}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Value: {normalizeMetricValue(item.value, item.fullMetric)}</span>
                        <span>{formatRank(item.rank, item.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Rankings Table */}
      {percentileBarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Rankings</CardTitle>
            <CardDescription>
              Complete breakdown of rankings and metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Percentile</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {percentileBarData.map((item) => {
                    const color = getPercentileColor(item.percentile);
                    return (
                      <TableRow key={item.fullMetric}>
                        <TableCell className="font-medium">{item.metric}</TableCell>
                        <TableCell>
                          {normalizeMetricValue(item.value, item.fullMetric)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              color === "green"
                                ? "default"
                                : color === "yellow"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {formatPercentile(item.percentile)}
                          </Badge>
                        </TableCell>
                        <TableCell>#{item.rank}</TableCell>
                        <TableCell>{item.total}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !rankingData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Ranking Data Available</h3>
              <p className="text-muted-foreground">
                {person === "coach"
                  ? "Please select a client to view ranking data"
                  : "No ranking data available for comparison"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

