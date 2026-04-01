"use client";

import AnalyticsPrintButton from "@/components/common/AnalyticsPrintButton";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { getAppClients } from "@/lib/fetchers/app";
import { getAllGroups } from "@/lib/fetchers/growth";
import { getAnalyticsSummary } from "@/lib/fetchers/roundglassAnalytics";
import {
    calculateTrendDirection,
    formatMetricName,
    formatPercentile,
    getPercentileColor,
    normalizeMetricValue,
} from "@/lib/utils/roundglassAnalytics";
import { useAppSelector } from "@/providers/global/hooks";
import {
    Activity,
    AlertTriangle,
    Award,
    BarChart3,
    Dumbbell,
    Minus,
    Pill,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Users
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

function isMongoObjectId(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || "").trim());
}

function toCountEntries(mapLike) {
  if (!mapLike || typeof mapLike !== "object") return [];
  return Object.entries(mapLike)
    .map(([k, v]) => [String(k), Number(v)])
    .filter(([k, v]) => k && Number.isFinite(v))
    .sort((a, b) => b[1] - a[1]);
}

function pickFirstDistribution(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v && typeof v === "object" && Object.keys(v).length > 0) return v;
  }
  return null;
}

export default function AnalyticsSummary() {
  // State for filters
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [focusQuery, setFocusQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(""); // resolved Mongo _id used by analytics APIs
  const [isResolvingClient, setIsResolvingClient] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchSeqRef = useRef(0);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailKind, setDetailKind] = useState(null); // "training" | "supplements" | "injuries"

  const { data: groupsData } = useSWR("analytics-summary-groups", () => getAllGroups());
  const groupOptions = useMemo(() => {
    const list = groupsData?.data?.groups || groupsData?.data || [];
    const arr = Array.isArray(list) ? list : [];
    return arr.map((g) => ({
      value: g?._id || g?.id,
      label: g?.name || g?.title || "Unnamed group",
    })).filter((g) => Boolean(g.value));
  }, [groupsData]);
  const { client_categories = [] } = useAppSelector((state) => state.coach.data || {});
  const categoryOptions = useMemo(
    () =>
      client_categories
        .map((category) => ({
          value: category?._id,
          label: category?.name || "Unnamed category",
        }))
        .filter((category) => Boolean(category.value)),
    [client_categories]
  );

  const applySelectedClient = (c) => {
    const resolvedId = String(c?._id || "");
    if (!resolvedId) {
      toast.error("Could not resolve athlete.");
      return;
    }
    setSelectedClientId(resolvedId);
    setFocusQuery(`${c?.name || "Athlete"}${c?.clientId ? ` (${c.clientId})` : ""}`);
    setSuggestionsOpen(false);
    setHighlightedIndex(-1);
  };

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    const q = String(focusQuery || "").trim();
    if (!q) {
      setClientSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const seq = ++searchSeqRef.current;
      setSuggestionsLoading(true);
      try {
        const res = await getAppClients({ page: 1, limit: 20, search: q });
        if (seq !== searchSeqRef.current) return;
        const list = res?.data?.clients || res?.data || [];
        const normalized = Array.isArray(list) ? list : [];
        setClientSuggestions(
          normalized.map((c) => ({
            _id: c?._id || c?.id,
            name: c?.name || "Unknown",
            clientId: c?.clientId || "",
            email: c?.email || "",
          }))
        );
        setSuggestionsOpen(true);
        setHighlightedIndex(-1);
      } catch {
        if (seq !== searchSeqRef.current) return;
        setClientSuggestions([]);
      } finally {
        if (seq === searchSeqRef.current) setSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [focusQuery]);

  // Build API params
  const apiParams = useMemo(() => {
    const params = {
      person: "coach",
    };

    if (selectedGroupId && selectedGroupId !== "all") {
      params.groupId = selectedGroupId;
    }
    if (selectedCategoryId && selectedCategoryId !== "all") {
      params.categoryId = selectedCategoryId;
    }

    if (selectedClientId) {
      params.clientId = selectedClientId;
    }

    return params;
  }, [selectedGroupId, selectedCategoryId, selectedClientId]);

  // Build SWR key
  const swrKey = useMemo(() => {
    const keyParts = ["roundglass/analytics-summary", "coach"];

    if (selectedGroupId && selectedGroupId !== "all") {
      keyParts.push(`group:${selectedGroupId}`);
    }
    if (selectedCategoryId && selectedCategoryId !== "all") {
      keyParts.push(`category:${selectedCategoryId}`);
    }

    if (selectedClientId) {
      keyParts.push(`client:${selectedClientId}`);
    }

    return keyParts.join("|");
  }, [selectedGroupId, selectedCategoryId, selectedClientId]);

  // Fetch summary data
  const { isLoading, error, data } = useSWR(swrKey, () => getAnalyticsSummary(apiParams));

  const summaryData = data?.data;
  const overview = summaryData?.overview;
  const healthMetrics = summaryData?.healthMetrics;
  // Backend payloads for this endpoint have varied over time; support a few common shapes.
  const preferences =
    summaryData?.preferences ||
    summaryData?.preferencesSummary ||
    summaryData?.preferenceSummary ||
    summaryData?.preferences_analysis ||
    null;
  const trainingSummary =
    preferences?.training || summaryData?.training || summaryData?.trainingSummary || null;
  const supplementsSummary =
    preferences?.supplements || summaryData?.supplements || summaryData?.supplementsSummary || null;
  const injuriesSummary =
    preferences?.injuries || summaryData?.injuries || summaryData?.injuriesSummary || null;
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

  const handleClearFilters = () => {
    setSelectedGroupId("all");
    setSelectedCategoryId("all");
    setFocusQuery("");
    setSelectedClientId("");
    setSuggestionsOpen(false);
    setClientSuggestions([]);
    setHighlightedIndex(-1);
  };

  const openDetails = (kind) => {
    setDetailKind(kind);
    setDetailOpen(true);
  };

  const detailConfig = useMemo(() => {
    if (detailKind === "training") {
      const sections = [
        { key: "frequencyDistribution", title: "Frequency distribution" },
        { key: "trainingFrequencyDistribution", title: "Training frequency distribution" },
        { key: "intensityDistribution", title: "Intensity distribution" },
        { key: "durationDistribution", title: "Duration distribution" },
        { key: "conditioningDaysDistribution", title: "Conditioning days distribution" },
      ];
      const map = trainingSummary || null;
      return { title: "Training Summary", description: "Full breakdown of training aggregates.", sections, map };
    }
    if (detailKind === "supplements") {
      const sections = [
        { key: "supplementDistribution", title: "Supplements distribution" },
        { key: "supplementsDistribution", title: "Supplements distribution (alt)" },
        { key: "brandDistribution", title: "Brand distribution" },
        { key: "purposeDistribution", title: "Purpose distribution" },
        { key: "sourceDistribution", title: "Source distribution" },
        { key: "frequencyDistribution", title: "Frequency distribution" },
      ];
      const map = supplementsSummary || null;
      return { title: "Supplements Summary", description: "Full breakdown of supplement aggregates.", sections, map };
    }
    if (detailKind === "injuries") {
      const sections = [
        { key: "injuryTypeDistribution", title: "Injury type distribution" },
        { key: "bodyPartDistribution", title: "Body part distribution" },
        { key: "typeDistribution", title: "Type distribution (alt)" },
      ];
      const map = injuriesSummary || null;
      return { title: "Injuries Summary", description: "Full breakdown of injury aggregates.", sections, map };
    }
    return null;
  }, [detailKind, trainingSummary, supplementsSummary, injuriesSummary]);

  const renderDistributionSection = (title, dist, badgeVariant = "secondary") => {
    const entries = toCountEntries(dist);
    if (entries.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="text-sm font-semibold">{title}</div>
        <div className="max-h-[260px] overflow-auto rounded-md border">
          <div className="divide-y">
            {entries.map(([label, count]) => (
              <div key={label} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="text-sm min-w-0 truncate">{label}</div>
                <Badge variant={badgeVariant} className="shrink-0">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
        applySelectedClient({
          _id: exactMatches[0]?._id || exactMatches[0]?.id,
          name: exactMatches[0]?.name,
          clientId: exactMatches[0]?.clientId,
          email: exactMatches[0]?.email,
        });
        return;
      }

      if (exactMatches.length > 1) {
        toast.error("Multiple athletes matched. Please enter an exact Athlete ID.");
        return;
      }

      toast.error("No athlete found. Search by Athlete ID (exact), or paste the full ID.");
    } catch (e) {
      toast.error(e?.message || "Could not search athletes. Please try again.");
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
                Comprehensive overview of all athlete analytics and metrics
              </CardDescription>
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear filters
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
            {/* Group Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Group (Optional)</label>
              <Select
                value={selectedGroupId}
                onValueChange={(v) => {
                  setSelectedGroupId(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {groupOptions.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Filters athletes to those inside the selected group.
              </p>
            </div>

            {/* Client Filter (Optional) */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Focus on Athlete (Optional)</label>
              <div className="flex gap-2" ref={containerRef}>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Search by name or Athlete ID (e.g., ggd65)"
                  value={focusQuery}
                  onChange={(e) => {
                    setFocusQuery(e.target.value);
                    // Don’t invalidate data on every keystroke; only apply after user action.
                    setSelectedClientId("");
                    setSuggestionsOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (suggestionsOpen && highlightedIndex >= 0 && clientSuggestions[highlightedIndex]) {
                        applySelectedClient(clientSuggestions[highlightedIndex]);
                      } else {
                        resolveAndSetClient(focusQuery);
                      }
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      if (!suggestionsOpen) setSuggestionsOpen(true);
                      setHighlightedIndex((i) => Math.min(i + 1, clientSuggestions.length - 1));
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlightedIndex((i) => Math.max(i - 1, 0));
                    }
                    if (e.key === "Escape") {
                      setSuggestionsOpen(false);
                      setHighlightedIndex(-1);
                    }
                  }}
                  onFocus={() => {
                    if (clientSuggestions.length > 0) setSuggestionsOpen(true);
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
              {suggestionsOpen && (suggestionsLoading || clientSuggestions.length > 0) && (
                <div className="relative">
                  <div className="absolute z-20 mt-2 w-full rounded-md border bg-background shadow-lg overflow-hidden">
                    {suggestionsLoading ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
                    ) : (
                      <div className="max-h-64 overflow-auto">
                        {clientSuggestions.map((c, idx) => {
                          const active = idx === highlightedIndex;
                          return (
                            <button
                              type="button"
                              key={String(c._id) + String(c.clientId) + idx}
                              className={[
                                "w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors",
                                active ? "bg-muted" : "",
                              ].join(" ")}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applySelectedClient(c);
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{c.name}</div>
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    {c.clientId ? `Athlete ID: ${c.clientId}` : "—"}
                                    {c.email ? ` · ${c.email}` : ""}
                                  </div>
                                </div>
                                <div className="text-[11px] text-muted-foreground tabular-nums">
                                  {String(c._id || "").slice(-6)}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedClientId ? (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Showing analytics for selected athlete.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1">
                    
                </p>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category (Optional)</label>
              <Select
                value={selectedCategoryId}
                onValueChange={(v) => {
                  setSelectedCategoryId(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                Total Athlete
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
      {(trainingSummary || supplementsSummary || injuriesSummary) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Training Summary */}
          {trainingSummary && (
            <Card
              className="cursor-pointer hover:shadow-sm transition-shadow"
              role="button"
              tabIndex={0}
              onClick={() => openDetails("training")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openDetails("training");
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Training Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const dist =
                      trainingSummary.topFrequencies ||
                      pickFirstDistribution(trainingSummary, [
                        "frequencyDistribution",
                        "trainingFrequencyDistribution",
                        "intensityDistribution",
                        "durationDistribution",
                        "conditioningDaysDistribution",
                      ]);
                    const entries = toCountEntries(dist).slice(0, 5);
                    if (entries.length === 0) return null;
                    return entries.map(([label, count]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <Badge variant="secondary">{count} athletes</Badge>
                      </div>
                    ));
                  })()}
                  {!toCountEntries(
                    trainingSummary.topFrequencies ||
                      pickFirstDistribution(trainingSummary, [
                        "frequencyDistribution",
                        "trainingFrequencyDistribution",
                        "intensityDistribution",
                        "durationDistribution",
                        "conditioningDaysDistribution",
                      ])
                  ).length && (
                    <div className="text-sm text-muted-foreground">
                      No training summary available for the selected filters.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supplements Summary */}
          {supplementsSummary && (
            <Card
              className="cursor-pointer hover:shadow-sm transition-shadow"
              role="button"
              tabIndex={0}
              onClick={() => openDetails("supplements")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openDetails("supplements");
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Supplements Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const dist =
                      supplementsSummary.mostCommon ||
                      pickFirstDistribution(supplementsSummary, [
                        "supplementDistribution",
                        "supplementsDistribution",
                        "brandDistribution",
                        "purposeDistribution",
                        "sourceDistribution",
                        "frequencyDistribution",
                      ]);
                    const entries = toCountEntries(dist).slice(0, 5);
                    if (entries.length === 0) return null;
                    return entries.map(([label, count]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <Badge variant="secondary">{count} athletes</Badge>
                      </div>
                    ));
                  })()}
                  {!toCountEntries(
                    supplementsSummary.mostCommon ||
                      pickFirstDistribution(supplementsSummary, [
                        "supplementDistribution",
                        "supplementsDistribution",
                        "brandDistribution",
                        "purposeDistribution",
                        "sourceDistribution",
                        "frequencyDistribution",
                      ])
                  ).length && (
                    <div className="text-sm text-muted-foreground">
                      No supplements summary available for the selected filters.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Injuries Summary */}
          {injuriesSummary && (
            <Card
              className="cursor-pointer hover:shadow-sm transition-shadow"
              role="button"
              tabIndex={0}
              onClick={() => openDetails("injuries")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openDetails("injuries");
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Injuries Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const dist =
                      injuriesSummary.commonTypes ||
                      pickFirstDistribution(injuriesSummary, [
                        "injuryTypeDistribution",
                        "bodyPartDistribution",
                        "typeDistribution",
                      ]);
                    const entries = toCountEntries(dist).slice(0, 5);
                    if (entries.length === 0) return null;
                    return entries.map(([label, count]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <Badge variant="destructive">{count} cases</Badge>
                      </div>
                    ));
                  })()}
                  {!toCountEntries(
                    injuriesSummary.commonTypes ||
                      pickFirstDistribution(injuriesSummary, [
                        "injuryTypeDistribution",
                        "bodyPartDistribution",
                        "typeDistribution",
                      ])
                  ).length && (
                    <div className="text-sm text-muted-foreground">
                      No injuries summary available for the selected filters.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{detailConfig?.title || "Summary details"}</DialogTitle>
            {detailConfig?.description && (
              <DialogDescription>{detailConfig.description}</DialogDescription>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            {detailConfig?.map ? (
              <>
                {detailConfig.sections.map((s) => {
                  const dist = detailConfig.map?.[s.key];
                  const badgeVariant =
                    detailKind === "injuries" ? "destructive" : "secondary";
                  return (
                    <div key={s.key}>
                      {renderDistributionSection(s.title, dist, badgeVariant)}
                    </div>
                  );
                })}

                {/* Fallback: show any other distribution-like objects */}
                {(() => {
                  const known = new Set(detailConfig.sections.map((s) => s.key));
                  const extras = Object.entries(detailConfig.map || {})
                    .filter(([k, v]) => !known.has(k) && v && typeof v === "object")
                    .map(([k, v]) => ({ key: k, value: v }))
                    .filter((x) => toCountEntries(x.value).length > 0)
                    .slice(0, 6);
                  if (extras.length === 0) return null;
                  return (
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-muted-foreground">
                        More breakdowns
                      </div>
                      {extras.map((x) => (
                        <div key={x.key}>
                          {renderDistributionSection(
                            formatMetricName(x.key),
                            x.value,
                            detailKind === "injuries" ? "destructive" : "secondary"
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No details available.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
              <CardDescription>Athlete with highest average percentile rankings</CardDescription>
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
                        <span className="text-sm font-medium">Athlete {performer.clientId.slice(-6)}</span>
                      </div>
                      <Badge variant="default">
                        {formatPercentile(performer.avgPercentile)}
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

      {/* Empty State */}
      {!isLoading && !summaryData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Summary Data Available</h3>
              <p className="text-muted-foreground">
                Analytics summary data will appear here once athletes have health data
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

