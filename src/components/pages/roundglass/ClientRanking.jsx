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
import { getAllGroups } from "@/lib/fetchers/growth";
import { nameInitials } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import {
  formatMetricName,
  formatPercentile,
  formatRank,
  getPercentileColor,
  normalizeMetricValue,
} from "@/lib/utils/roundglassAnalytics";
import { AlertCircle, Award, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  // State for filters
  const [clientId, setClientId] = useState(propClientId); // resolved Mongo _id used by APIs
  const [clientQuery, setClientQuery] = useState("");
  const [isResolvingClient, setIsResolvingClient] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchSeqRef = useRef(0);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const [comparisonGroup, setComparisonGroup] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState([]);

  const applySelectedClient = (c) => {
    const resolvedId = String(c?._id || "");
    if (!resolvedId) {
      toast.error("Could not resolve player.");
      return;
    }
    setClientId(resolvedId);
    setClientQuery(`${c?.name || "Player"}${c?.clientId ? ` (${c.clientId})` : ""}`);
    setSuggestionsOpen(false);
    setHighlightedIndex(-1);
  };

  const normalizeSearchText = (v) =>
    String(v || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

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
    const q = String(clientQuery || "").trim();
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

        // Some backends only support search by ID/email. If name search returns nothing,
        // fall back to a small local filter on the first page of clients.
        let candidates = normalized;
        if (candidates.length === 0 && /[a-z]/i.test(q)) {
          const fallback = await getAppClients({ page: 1, limit: 500 });
          if (seq !== searchSeqRef.current) return;
          const all = fallback?.data?.clients || fallback?.data || [];
          const allNormalized = Array.isArray(all) ? all : [];
          const nq = normalizeSearchText(q);
          candidates = allNormalized.filter((c) => {
            const name = normalizeSearchText(c?.name);
            const clientId = normalizeSearchText(c?.clientId);
            return (name && name.includes(nq)) || (clientId && clientId.includes(nq));
          });
        }

        setClientSuggestions(
          (Array.isArray(candidates) ? candidates : []).map((c) => ({
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
  }, [clientQuery]);

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
      const normalizedQuery = normalizeSearchText(query);

      const normalizedClients = Array.isArray(clients) ? clients : [];

      const exactMatches = normalizedClients.filter((c) => {
        const appClientId = normalizeSearchText(c?.clientId); // short app id
        const mongoId = normalizeSearchText(c?._id || c?.id);
        return appClientId === normalizedQuery || mongoId === normalizedQuery;
      });

      if (exactMatches.length === 1) {
        applySelectedClient({
          _id: exactMatches[0]?._id || exactMatches[0]?.id,
          name: exactMatches[0]?.name,
          clientId: exactMatches[0]?.clientId,
        });
        return;
      }

      if (exactMatches.length > 1) {
        toast.error("Multiple players matched. Please enter an exact Player ID.");
        return;
      }

      // Name search fallback:
      // If search didn't match by exact IDs, try to match by name.
      const nameMatches = normalizedClients.filter((c) => {
        const name = normalizeSearchText(c?.name);
        return name && name.includes(normalizedQuery);
      });

      const pickFrom = nameMatches.length > 0 ? nameMatches : normalizedClients;

      // If API returned one candidate, select it.
      if (pickFrom.length === 1) {
        applySelectedClient({
          _id: pickFrom[0]?._id || pickFrom[0]?.id,
          name: pickFrom[0]?.name,
          clientId: pickFrom[0]?.clientId,
        });
        return;
      }

      // If multiple candidates, open suggestions for user to choose.
      if (pickFrom.length > 1) {
        setClientSuggestions(
          pickFrom.map((c) => ({
            _id: c?._id || c?.id,
            name: c?.name || "Unknown",
            clientId: c?.clientId || "",
            email: c?.email || "",
          }))
        );
        setSuggestionsOpen(true);
        setHighlightedIndex(0);
        toast.message("Select a player from the suggestions.");
        return;
      }

      // If backend search returns nothing for name, do a bounded local search.
      if (normalizedClients.length === 0 && /[a-z]/i.test(query)) {
        const fallback = await getAppClients({ page: 1, limit: 500 });
        const all = fallback?.data?.clients || fallback?.data || [];
        const allNormalized = Array.isArray(all) ? all : [];
        const matches = allNormalized.filter((c) => {
          const name = normalizeSearchText(c?.name);
          const clientId = normalizeSearchText(c?.clientId);
          return (name && name.includes(normalizedQuery)) || (clientId && clientId.includes(normalizedQuery));
        });
        if (matches.length === 1) {
          applySelectedClient({
            _id: matches[0]?._id || matches[0]?.id,
            name: matches[0]?.name,
            clientId: matches[0]?.clientId,
          });
          return;
        }
        if (matches.length > 1) {
          setClientSuggestions(
            matches.slice(0, 50).map((c) => ({
              _id: c?._id || c?.id,
              name: c?.name || "Unknown",
              clientId: c?.clientId || "",
              email: c?.email || "",
            }))
          );
          setSuggestionsOpen(true);
          setHighlightedIndex(0);
          toast.message("Select a player from the suggestions.");
          return;
        }
      }

      toast.error(
        "No player found. Search by name, enter an exact Player ID (e.g., ggd65), or paste the full Mongo ID."
      );
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

    if (comparisonGroup === "group" && selectedGroupId) {
      params.groupId = selectedGroupId;
    }

    if (selectedMetrics.length > 0) {
      params.metrics = selectedMetrics;
    }

    return params;
  }, [clientId, comparisonGroup, selectedGroupId, selectedMetrics]);

  // Build SWR key
  const swrKey = useMemo(() => {
    const keyParts = [
      "roundglass/client-ranking",
      "coach",
      clientId || "none",
      comparisonGroup,
    ];

    if (comparisonGroup === "group" && selectedGroupId) {
      keyParts.push(`group:${selectedGroupId}`);
    }

    if (selectedMetrics.length > 0) {
      keyParts.push(`metrics:${selectedMetrics.join(",")}`);
    }

    return keyParts.join("|");
  }, [clientId, comparisonGroup, selectedGroupId, selectedMetrics]);

  // Fetch ranking data
  const { isLoading, error, data } = useSWR(
    clientId ? swrKey : null,
    () => getClientRanking(apiParams)
  );

  const rankingData = data?.data;
  const graphData = data?.graphData;

  const { data: groupsData } = useSWR("client-ranking-groups-list", () => getAllGroups());
  const groupOptions = useMemo(() => {
    const list = groupsData?.data?.groups || groupsData?.data || [];
    const arr = Array.isArray(list) ? list : [];
    return arr
      .map((g) => ({
        value: g?._id || g?.id,
        label: g?.name || g?.title || "Unnamed group",
      }))
      .filter((g) => Boolean(g.value));
  }, [groupsData]);

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

  const handleClearFilters = () => {
    if (!propClientId) {
      setClientId(null);
      setClientQuery("");
    } else {
      setClientId(propClientId);
      setClientQuery("");
    }
    setComparisonGroup("all");
    setSelectedGroupId("");
    setSelectedMetrics([]);
    setSuggestionsOpen(false);
    setHighlightedIndex(-1);
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
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear filters
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
              <div className="min-w-0" ref={containerRef}>
                <label className="text-sm font-medium mb-2 block">Player</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Search by name or Player ID (e.g., ggd65)"
                    value={clientQuery}
                    onChange={(e) => {
                      setClientQuery(e.target.value);
                      // Do not call APIs on every keystroke
                      setClientId(null);
                      setSuggestionsOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (suggestionsOpen && highlightedIndex >= 0 && clientSuggestions[highlightedIndex]) {
                          applySelectedClient(clientSuggestions[highlightedIndex]);
                        } else {
                          resolveAndSetClient(clientQuery);
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
                                className={cn(
                                  "w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors",
                                  active && "bg-muted"
                                )}
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
                                      {c.clientId ? `Player ID: ${c.clientId}` : "—"}
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
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group Selector (if comparisonGroup="group") */}
            {comparisonGroup === "group" && (
              <div className="min-w-0">
                <label className="text-sm font-medium mb-2 block">Group</label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupOptions.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
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
                <span className="text-sm text-muted-foreground">
                  {formatPercentile(summary.avgPercentile).replace(/ percentile$/, "")} percentile
                </span>
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

