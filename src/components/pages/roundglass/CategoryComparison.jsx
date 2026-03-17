"use client";

import AnalyticsPrintButton from "@/components/common/AnalyticsPrintButton";
import AnalyticsResponsiveChart from "@/components/common/AnalyticsResponsiveChart";
import AnalyticsResponsiveTable from "@/components/common/AnalyticsResponsiveTable";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import SelectMultiple from "@/components/SelectMultiple";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getCategoryComparison } from "@/lib/fetchers/roundglassAnalytics";
import { getAllGroups } from "@/lib/fetchers/growth";
import {
    formatMetricName,
    normalizeMetricValue
} from "@/lib/utils/roundglassAnalytics";
import { Download, RefreshCw, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    XAxis,
    YAxis
} from "recharts";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

function BoxPlot({ item }) {
  if (!item) return null;
  const min = Number(item.min);
  const q1 = Number(item.q1);
  const median = Number(item.median);
  const q3 = Number(item.q3);
  const max = Number(item.max);
  if (![min, q1, median, q3, max].every(Number.isFinite)) return null;

  const width = 520;
  const height = 140;
  const paddingX = 34;
  const paddingTop = 26;
  const paddingBottom = 36;
  const range = max - min || 1;
  const scaleX = (v) =>
    paddingX + ((v - min) / range) * (width - paddingX * 2);

  const xMin = scaleX(min);
  const xQ1 = scaleX(q1);
  const xMed = scaleX(median);
  const xQ3 = scaleX(q3);
  const xMax = scaleX(max);

  const yMid = 70;
  const boxH = 30;
  const boxY = yMid - boxH / 2;
  const tickY = height - 18;

  const fmt = (v) => {
    const abs = Math.abs(v);
    if (abs >= 1000) return String(Math.round(v));
    if (abs >= 100) return v.toFixed(0);
    return v.toFixed(1);
  };

  return (
    <div className="rounded-xl border bg-background/40 p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
        <div>
          <div className="text-sm font-semibold leading-tight">
            {formatMetricName(item.label)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            IQR: {fmt(q1)}–{fmt(q3)} · Median: {fmt(median)}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums">
          Min {fmt(min)} · Q1 {fmt(q1)} · Med {fmt(median)} · Q3 {fmt(q3)} · Max{" "}
          {fmt(max)}
        </div>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${item.label} box plot`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* guide rail */}
        <line
          x1={paddingX}
          y1={yMid}
          x2={width - paddingX}
          y2={yMid}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          opacity="0.22"
        />

        {/* whiskers */}
        <line x1={xMin} y1={yMid} x2={xQ1} y2={yMid} stroke="hsl(var(--foreground))" strokeWidth="2" opacity="0.75" />
        <line x1={xQ3} y1={yMid} x2={xMax} y2={yMid} stroke="hsl(var(--foreground))" strokeWidth="2" opacity="0.75" />

        {/* caps */}
        <line x1={xMin} y1={yMid - 12} x2={xMin} y2={yMid + 12} stroke="hsl(var(--foreground))" strokeWidth="2" opacity="0.75" />
        <line x1={xMax} y1={yMid - 12} x2={xMax} y2={yMid + 12} stroke="hsl(var(--foreground))" strokeWidth="2" opacity="0.75" />

        {/* IQR box */}
        <rect
          x={xQ1}
          y={boxY}
          width={Math.max(2, xQ3 - xQ1)}
          height={boxH}
          rx="10"
          fill="hsl(var(--primary))"
          opacity="0.14"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />

        {/* median */}
        <line x1={xMed} y1={boxY - 2} x2={xMed} y2={boxY + boxH + 2} stroke="hsl(var(--primary))" strokeWidth="3" />

        {/* axis ticks + labels */}
        {[{ x: xMin, t: "Min", v: min }, { x: xMed, t: "Median", v: median }, { x: xMax, t: "Max", v: max }].map((d) => (
          <g key={d.t}>
            <line x1={d.x} y1={yMid + 18} x2={d.x} y2={yMid + 26} stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.35" />
            <text x={d.x} y={tickY} textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
              {d.t}: {fmt(d.v)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// Available metrics for selection
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
  { value: "height", label: "Height" },
];

export default function CategoryComparison() {
  const { data: groupsRes } = useSWR("growth/groups", () => getAllGroups());
  const groups = useMemo(() => {
    if (!groupsRes?.data) return [];
    return Array.isArray(groupsRes.data) ? groupsRes.data : [];
  }, [groupsRes]);

  // Keep old name for minimal routing changes, but this view is group-based.

  // State for filters
  const [comparisonType, setComparisonType] = useState("single"); // "single" or "multi"
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Prepare group options
  const groupOptions = useMemo(() => {
    return groups.map((g) => ({
      value: g._id,
      label: g.name || "Unnamed group",
    }));
  }, [groups]);

  // Build API params
  const apiParams = useMemo(() => {
    const params = { person: "coach" };
    
    if (comparisonType === "single") {
      if (selectedGroupId) {
        params.groupId = selectedGroupId;
      }
    } else {
      if (selectedGroupIds.length > 0) {
        params.groupIds = selectedGroupIds;
      }
    }

    if (selectedMetrics.length > 0) {
      params.metrics = selectedMetrics;
    }

    return params;
  }, [comparisonType, selectedGroupId, selectedGroupIds, selectedMetrics]);

  // Build SWR key
  const swrKey = useMemo(() => {
    const keyParts = ["roundglass/category-comparison", "coach"];
    if (apiParams.groupId) keyParts.push(`groupId:${apiParams.groupId}`);
    if (apiParams.groupIds) keyParts.push(`groupIds:${apiParams.groupIds.join(",")}`);
    if (apiParams.metrics) keyParts.push(`metrics:${apiParams.metrics.join(",")}`);
    return keyParts.join("|");
  }, [apiParams]);

  // Fetch comparison data
  const { isLoading, error, data } = useSWR(
    (comparisonType === "single" && selectedGroupId) || 
    (comparisonType === "multi" && selectedGroupIds.length > 0)
      ? swrKey
      : null,
    () => getCategoryComparison(apiParams)
  );

  const comparisonData = data?.data;
  const graphData = data?.graphData;

  // Handle refresh
  const handleRefresh = () => {
    if ((comparisonType === "single" && selectedGroupId) || 
        (comparisonType === "multi" && selectedGroupIds.length > 0)) {
      mutate(swrKey);
      toast.success("Data refreshed");
    }
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Prepare chart data for bar chart
  const barChartData = useMemo(() => {
    if (!graphData?.barChart) return [];

    const { labels, datasets } = graphData.barChart;
    if (!labels || !datasets) return [];

    // Transform to recharts format
    return labels.map((label, index) => {
      const dataPoint = { name: label };
      datasets.forEach((dataset) => {
        dataPoint[dataset.label] = dataset.data[index];
      });
      return dataPoint;
    });
  }, [graphData]);

  // Prepare client table data
  const clientTableData = useMemo(() => {
    if (!comparisonData?.comparison?.clients) return [];

    let clients = [...comparisonData.comparison.clients];

    // Sort if sortConfig is set
    if (sortConfig.key) {
      clients.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }

        return sortConfig.direction === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return clients;
  }, [comparisonData, sortConfig]);

  // Get statistics
  const statistics = useMemo(() => {
    if (!comparisonData?.comparison?.statistics) return null;
    return comparisonData.comparison.statistics;
  }, [comparisonData]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!clientTableData.length) {
      toast.error("No data to export");
      return;
    }

    try {
      // Get all unique metric keys from clients
      const metricKeys = new Set();
      clientTableData.forEach((client) => {
        Object.keys(client).forEach((key) => {
          if (key !== "_id" && key !== "name" && key !== "email" && typeof client[key] === "number") {
            metricKeys.add(key);
          }
        });
      });

      // Create CSV header
      const headers = ["Name", "Email", ...Array.from(metricKeys).map(formatMetricName)];
      const rows = clientTableData.map((client) => {
        const row = [
          client.name || "—",
          client.email || "—",
          ...Array.from(metricKeys).map((key) => client[key] ?? "—"),
        ];
        return row.join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `group-comparison-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  };


  // Show message if no category selected (but still render filters)
  const hasValidSelection =
    (comparisonType === "single" && selectedGroupId) ||
    (comparisonType === "multi" && selectedGroupIds.length > 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Group Comparison</CardTitle>
              <CardDescription>
                Compare health metrics within a group (or between groups)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {clientTableData.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <AnalyticsPrintButton
                    variant="outline"
                    size="sm"
                    title="Category Comparison Report"
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-4">
          {/* Desktop Filters */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
            {/* Comparison Type Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Comparison Type</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={comparisonType}
                onChange={(e) => {
                  setComparisonType(e.target.value);
                  setSelectedGroupId("");
                  setSelectedGroupIds([]);
                }}
              >
                <option value="single">Single Group</option>
                <option value="multi">Multiple Groups</option>
              </select>
            </div>

            {/* Group Selector(s) */}
            {comparisonType === "single" ? (
              <div>
                <label className="text-sm font-medium mb-2 block">Group</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">Select group</option>
                  {groupOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Manage groups in <a className="underline" href="/coach/growth/groups">Growth Groups</a>.
                </p>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium mb-2 block">Groups</label>
                <SelectMultiple
                  label="Select groups"
                  options={groupOptions}
                  value={selectedGroupIds}
                  onChange={setSelectedGroupIds}
                  searchable
                />
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

            {/* Comparison Type Badge */}
            <div className="flex items-end">
              <Badge
                variant={comparisonType === "multi" ? "default" : "secondary"}
                className="text-sm"
              >
                {comparisonType === "multi" ? "Multiple Groups" : "Single Group"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasValidSelection ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select group(s) to continue</h3>
              <p className="text-muted-foreground">
                Choose Single Group and pick 1 group, or choose Multiple Groups and pick 2+ groups.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <ContentLoader />
      ) : error || (data && data?.status_code !== 200) ? (
        <ContentError
          title={error?.message || data?.message || "Failed to load category comparison data"}
        />
      ) : null}

      {hasValidSelection && !isLoading && !(error || (data && data?.status_code !== 200)) && (
      <>
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {comparisonData?.comparison?.totalClients || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedMetrics.length > 0 && (
            selectedMetrics.map((metric) => {
              const stat = statistics[metric];
              if (!stat) return null;

              return (
                <Card key={metric}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {formatMetricName(metric)} - Mean
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {normalizeMetricValue(stat.mean, metric)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Median: {normalizeMetricValue(stat.median, metric)}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
      </>
      )}

      {/* Charts Section */}
      {graphData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start min-w-0">
          {/* Bar Chart */}
          {barChartData.length > 0 && (
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Metric Comparison</CardTitle>
                <CardDescription>Comparison across categories</CardDescription>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <AnalyticsResponsiveChart className="analytics-chart-mobile overflow-hidden">
                  <ChartContainer
                    config={Object.fromEntries(
                      Object.keys(barChartData[0] || {})
                        .filter((key) => key !== "name")
                        .map((key) => [
                          key,
                          {
                            label: formatMetricName(key),
                            color: `hsl(var(--chart-${Math.floor(Math.random() * 5) + 1}))`,
                          },
                        ])
                    )}
                    className="h-full"
                  >
                  <BarChart data={barChartData} margin={{ top: 5, right: 20, left: 0, bottom: 28 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-20}
                      textAnchor="end"
                      height={70}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    {Object.keys(barChartData[0] || {})
                      .filter((key) => key !== "name")
                      .map((key, index) => (
                        <Bar
                          key={key}
                          dataKey={key}
                          fill={`var(--chart-${(index % 5) + 1})`}
                          name={formatMetricName(key)}
                        />
                      ))}
                  </BarChart>
                  </ChartContainer>
                </AnalyticsResponsiveChart>
              </CardContent>
            </Card>
          )}

          {/* Box Plot (single-group/intra only; backend returns array per metric) */}
          {Array.isArray(graphData?.boxPlot) && graphData.boxPlot.length > 0 && (
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Distribution (Box Plot)</CardTitle>
                <CardDescription>Per-metric distribution for the selected group</CardDescription>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <div className="grid grid-cols-1 gap-3">
                  {graphData.boxPlot.map((item) => (
                    <BoxPlot key={item.label} item={item} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Client Comparison Table */}
      {clientTableData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Player Comparison</CardTitle>
            <CardDescription>
              Detailed comparison of players in the selected group(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsResponsiveTable className="analytics-table-mobile">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("name")}
                    >
                      Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    {selectedMetrics.length > 0
                      ? selectedMetrics.map((metric) => (
                          <TableHead
                            key={metric}
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => handleSort(metric)}
                          >
                            {formatMetricName(metric)}
                            {sortConfig.key === metric &&
                              (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                          </TableHead>
                        ))
                      : AVAILABLE_METRICS.slice(0, 5).map((metric) => (
                          <TableHead
                            key={metric.value}
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => handleSort(metric.value)}
                          >
                            {metric.label}
                            {sortConfig.key === metric.value &&
                              (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                          </TableHead>
                        ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientTableData.map((client) => (
                    <TableRow key={client._id || client.id}>
                      <TableCell className="font-medium">{client.name || "—"}</TableCell>
                      {selectedMetrics.length > 0
                        ? selectedMetrics.map((metric) => (
                            <TableCell key={metric}>
                              {normalizeMetricValue(client[metric], metric)}
                            </TableCell>
                          ))
                        : AVAILABLE_METRICS.slice(0, 5).map((metric) => (
                            <TableCell key={metric.value}>
                              {normalizeMetricValue(client[metric.value], metric.value)}
                            </TableCell>
                          ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AnalyticsResponsiveTable>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !comparisonData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground">
                Please select a category to view comparison data
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

