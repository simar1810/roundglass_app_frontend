"use client";

import AnalyticsPrintButton from "@/components/common/AnalyticsPrintButton";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import SelectMultiple from "@/components/SelectMultiple";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getAppClientPortfolioDetails, getAppClients } from "@/lib/fetchers/app";
import { getClientRanking } from "@/lib/fetchers/roundglassAnalytics";
import { nameInitials } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import {
    formatMetricName,
    formatPercentile,
    formatRank,
    getPercentileColor,
    normalizeMetricValue,
} from "@/lib/utils/roundglassAnalytics";
import { useAppSelector } from "@/providers/global/hooks";
import { AlertCircle, Award, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

function isMongoObjectId(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || "").trim());
}

// Metrics that should be hidden from the UI (not required in analytics view)
const EXCLUDED_METRICS = new Set([
  "chest",
  "arm",
  "abdomen",
  "waist",
  "hip",
  "thighs",
]);

// Available metrics (only those we want to expose in the UI)
const AVAILABLE_METRICS = [
  { value: "bmi", name: "BMI" },
  { value: "muscle", name: "Muscle %" },
  { value: "fat", name: "Fat %" },
  { value: "rm", name: "Resting Metabolic Rate" },
  { value: "ideal_weight", name: "Ideal Weight" },
  { value: "bodyAge", name: "Body Age" },
  { value: "visceral_fat", name: "Visceral Fat" },
  { value: "weight", name: "Weight" },
  { value: "sub_fat", name: "Subcutaneous Fat" },
  { value: "height", name: "Height" },
];

export default function ClientRanking({ clientId: propClientId = null }) {
  const { client_categories = [] } = useAppSelector((state) => state.coach.data);

  // State for filters
  const [clientId, setClientId] = useState(propClientId); // resolved Mongo _id used by APIs
  const [clientQuery, setClientQuery] = useState("");
  const [isResolvingClient, setIsResolvingClient] = useState(false);
  const [comparisonGroup, setComparisonGroup] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState([]);

  const resolveAndSetClient = async (raw) => {
    const query = String(raw || "").trim();

    if (!query) {
      setClientId(null);
      return;
    }

    // If user pasted Mongo _id, accept directly
    if (isMongoObjectId(query)) {
      setClientId(query);
      return;
    }

    setIsResolvingClient(true);
    try {
      const res = await getAppClients({ page: 1, limit: 50, search: query });
      const clients = res?.data?.clients || res?.data || [];
      const normalizedQuery = query.toLowerCase();

      const exactMatches = (Array.isArray(clients) ? clients : []).filter((c) => {
        const appClientId = String(c?.clientId || "").toLowerCase(); // short app id
        const mongoId = String(c?._id || c?.id || "").toLowerCase();
        return appClientId === normalizedQuery || mongoId === normalizedQuery;
      });

      if (exactMatches.length === 1) {
        const resolvedId = String(exactMatches[0]?._id || exactMatches[0]?.id || "");
        if (!resolvedId) throw new Error("Could not resolve player.");
        setClientId(resolvedId);
        return;
      }

      if (exactMatches.length > 1) {
        toast.error("Multiple players matched. Please enter an exact Client ID.");
        return;
      }

      toast.error("No player found. Enter an exact Client ID (e.g., ggd65) or paste the full Mongo ID.");
    } catch (e) {
      toast.error(e?.message || "Could not search players. Please try again.");
    } finally {
      setIsResolvingClient(false);
    }
  };

  // Fetch client details
  const { isLoading: clientLoading, error: clientError, data: clientData } = useSWR(
    clientId ? `client-ranking-details/${clientId}` : null,
    () => getAppClientPortfolioDetails(clientId)
  );

  const client = clientData?.data;

  // Build API params
  const apiParams = useMemo(() => {
    const params = {
      person: "coach",
    };

    if (clientId) {
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
  }, [clientId, comparisonGroup, selectedCategoryId, selectedMetrics]);

  // Build SWR key
  const swrKey = useMemo(() => {
    const keyParts = [
      "roundglass/client-ranking",
      "coach",
      clientId || "none",
      comparisonGroup,
    ];

    if (comparisonGroup === "category" && selectedCategoryId) {
      keyParts.push(`category:${selectedCategoryId}`);
    }

    if (selectedMetrics.length > 0) {
      keyParts.push(`metrics:${selectedMetrics.join(",")}`);
    }

    return keyParts.join("|");
  }, [clientId, comparisonGroup, selectedCategoryId, selectedMetrics]);

  // Fetch ranking data
  const { isLoading, error, data } = useSWR(
    clientId ? swrKey : null,
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

  // Prepare radar chart data (exclude metrics we don't want to show)
  const radarChartData = useMemo(() => {
    if (!graphData?.radarChart) return [];

    const { labels, datasets } = graphData.radarChart;
    if (!labels || !datasets || datasets.length === 0) return [];

    // Filter out excluded metrics by label key
    const filtered = labels
      .map((label, index) => ({ label, index }))
      .filter(({ label }) => !EXCLUDED_METRICS.has(label));

    return filtered.map(({ label, index }) => ({
      metric: formatMetricName(label),
      percentile: datasets[0].data[index] || 0,
      fullLabel: label,
    }));
  }, [graphData]);

  // Prepare percentile bar data (exclude metrics we don't want to show)
  const percentileBarData = useMemo(() => {
    if (!rankingData?.rankings) return [];

    return Object.entries(rankingData.rankings)
      .filter(([metric]) => !EXCLUDED_METRICS.has(metric))
      .map(([metric, data]) => ({
        metric: formatMetricName(metric),
        percentile: data.percentile || 0,
        value: data.value,
        rank: data.rank,
        total: data.total,
        fullMetric: metric,
      }));
  }, [rankingData]);

  // Calculate summary statistics (based only on included metrics)
  const summary = useMemo(() => {
    if (!rankingData?.rankings) return null;

    const filteredEntries = Object.entries(rankingData.rankings).filter(
      ([metric]) => !EXCLUDED_METRICS.has(metric)
    );

    if (filteredEntries.length === 0) return null;

    const rankings = filteredEntries.map(([, value]) => value);
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
            metric: filteredEntries.find(
              ([, value]) => value.percentile === bestMetric.percentile
            )?.[0],
            percentile: bestMetric.percentile,
          }
        : null,
      worstMetric: worstMetric
        ? {
            metric: filteredEntries.find(
              ([, value]) => value.percentile === worstMetric.percentile
            )?.[0],
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

  const needsClientSelection = !propClientId && !clientId;

  return (
    <div className="space-y-6">
      {/* Header Section */}
          <Card className="min-w-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {client ? (
                <>
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={client.profilePhoto} />
                    <AvatarFallback>{nameInitials(client.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{client.name}</CardTitle>
                    <CardDescription>
                      {client.email || client.mobileNumber || "Player details"}
                    </CardDescription>
                  </div>
                </>
              ) : (
                <div>
                  <CardTitle className="text-xl">Player Rankings</CardTitle>
                  <CardDescription>Percentile rankings compared to peers</CardDescription>
                </div>
              )}
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <AnalyticsPrintButton
                variant="outline"
                size="sm"
                title={client ? `${client.name} - Rankings Report` : "Player Rankings Report"}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print items-start">
            {/* Client Selector */}
            {!propClientId && (
              <div className="min-w-0">
                <label className="text-sm font-medium mb-2 block">Player</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter Client ID (e.g., ggd65)"
                    value={clientQuery}
                    onChange={(e) => {
                      setClientQuery(e.target.value);
                      // Do not call APIs on every keystroke
                      setClientId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") resolveAndSetClient(clientQuery);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resolveAndSetClient(clientQuery)}
                    disabled={isResolvingClient}
                  >
                    {isResolvingClient ? "Searching..." : "Search"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setClientQuery("");
                      setClientId(null);
                    }}
                    disabled={isResolvingClient && !clientQuery}
                  >
                    Clear
                  </Button>
                </div>
                {/* <p className="text-[11px] text-muted-foreground mt-1">
                  We’ll look up the player and use the internal ID for analytics.
                </p> */}
              </div>
            )}

            {/* Comparison Group Selector */}
            <div className="min-w-0">
              <label className="text-sm font-medium mb-2 block">Comparison Group</label>
              <Select value={comparisonGroup} onValueChange={setComparisonGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Selector (if comparisonGroup="category") */}
            {comparisonGroup === "category" && (
              <div className="min-w-0">
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
            <div className="min-w-0 md:col-span-2 lg:col-span-2">
              <label className="text-sm font-medium mb-2 block">Metrics</label>
              <SelectMultiple
                label="Select metrics (all if empty)"
                options={AVAILABLE_METRICS}
                value={selectedMetrics}
                onChange={setSelectedMetrics}
                searchable
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {needsClientSelection ? (
        <Card className="min-w-0">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a player to continue</h3>
              <p className="text-muted-foreground">
                Enter a player ID above to load percentile rankings.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : clientLoading || isLoading ? (
        <ContentLoader />
      ) : clientError || (clientData && clientData?.status_code !== 200) ? (
        <ContentError
          title={clientError?.message || clientData?.message || "Failed to load player data"}
        />
      ) : error || (data && data?.status_code !== 200) ? (
        <ContentError
          title={error?.message || data?.message || "Failed to load ranking data"}
        />
      ) : null}

      {/* Summary Card */}
      {!needsClientSelection &&
        !clientLoading &&
        !isLoading &&
        !(clientError || (clientData && clientData?.status_code !== 200)) &&
        !(error || (data && data?.status_code !== 200)) &&
        summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="min-w-0">
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
          <Card className="min-w-0">
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
          <Card className="min-w-0">
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
      {!needsClientSelection &&
        !clientLoading &&
        !isLoading &&
        !(clientError || (clientData && clientData?.status_code !== 200)) &&
        !(error || (data && data?.status_code !== 200)) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        {radarChartData.length > 0 && (
          <Card className="min-w-0">
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
          <Card className="min-w-0">
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
      )}

      {/* Detailed Rankings Table */}
      {!needsClientSelection &&
        !clientLoading &&
        !isLoading &&
        !(clientError || (clientData && clientData?.status_code !== 200)) &&
        !(error || (data && data?.status_code !== 200)) &&
        percentileBarData.length > 0 && (
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
      {!needsClientSelection &&
        !clientLoading &&
        !isLoading &&
        !(clientError || (clientData && clientData?.status_code !== 200)) &&
        !(error || (data && data?.status_code !== 200)) &&
        !rankingData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Ranking Data Available</h3>
              <p className="text-muted-foreground">
                Please select a player to view ranking data
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

