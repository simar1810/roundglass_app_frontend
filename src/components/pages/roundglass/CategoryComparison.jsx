"use client";

import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import AnalyticsPrintButton from "@/components/common/AnalyticsPrintButton";
import AnalyticsMobileFilters from "@/components/common/AnalyticsMobileFilters";
import AnalyticsResponsiveTable from "@/components/common/AnalyticsResponsiveTable";
import AnalyticsResponsiveChart from "@/components/common/AnalyticsResponsiveChart";
import SelectMultiple from "@/components/SelectMultiple";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { getCategoryComparison } from "@/lib/fetchers/roundglassAnalytics";
import {
  formatMetricName,
  formatPercentile,
  getPercentileColor,
  normalizeMetricValue,
} from "@/lib/utils/roundglassAnalytics";
import { useAppSelector } from "@/providers/global/hooks";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { Download, RefreshCw, Users, TrendingUp, TrendingDown } from "lucide-react";

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
  { value: "chest", label: "Chest" },
  { value: "arm", label: "Arm" },
  { value: "abdomen", label: "Abdomen" },
  { value: "waist", label: "Waist" },
  { value: "hip", label: "Hip" },
  { value: "thighs", label: "Thighs" },
  { value: "height", label: "Height" },
  { value: "shoulder_distance", label: "Shoulder Distance" },
];

export default function CategoryComparison() {
  const { client_categories = [] } = useAppSelector((state) => state.coach.data);

  // State for filters
  const [comparisonType, setComparisonType] = useState("intra"); // "intra" or "inter"
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Prepare category options
  const categoryOptions = useMemo(() => {
    return client_categories.map((cat) => ({
      value: cat._id,
      label: cat.name || cat.title || "Unknown",
    }));
  }, [client_categories]);

  // Build API params
  const apiParams = useMemo(() => {
    const params = { person: "coach" };
    
    if (comparisonType === "intra") {
      if (selectedCategoryId) {
        params.categoryId = selectedCategoryId;
      }
    } else {
      if (selectedCategoryIds.length > 0) {
        params.categoryIds = selectedCategoryIds;
      }
    }

    if (selectedMetrics.length > 0) {
      params.metrics = selectedMetrics;
    }

    return params;
  }, [comparisonType, selectedCategoryId, selectedCategoryIds, selectedMetrics]);

  // Build SWR key
  const swrKey = useMemo(() => {
    const keyParts = ["roundglass/category-comparison", "coach"];
    if (apiParams.categoryId) keyParts.push(`categoryId:${apiParams.categoryId}`);
    if (apiParams.categoryIds) keyParts.push(`categoryIds:${apiParams.categoryIds.join(",")}`);
    if (apiParams.metrics) keyParts.push(`metrics:${apiParams.metrics.join(",")}`);
    return keyParts.join("|");
  }, [apiParams]);

  // Fetch comparison data
  const { isLoading, error, data } = useSWR(
    (comparisonType === "intra" && selectedCategoryId) || 
    (comparisonType === "inter" && selectedCategoryIds.length > 0)
      ? swrKey
      : null,
    () => getCategoryComparison(apiParams)
  );

  const comparisonData = data?.data;
  const graphData = data?.graphData;

  // Handle refresh
  const handleRefresh = () => {
    mutate(swrKey);
    toast.success("Data refreshed");
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
      link.setAttribute("download", `category-comparison-${new Date().toISOString().split("T")[0]}.csv`);
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


  if (isLoading) return <ContentLoader />;

  if (error || data?.status_code !== 200) {
    return (
      <ContentError
        title={error?.message || data?.message || "Failed to load category comparison data"}
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
              <CardTitle>Category Comparison</CardTitle>
              <CardDescription>
                Compare clients within or between categories
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
                  setSelectedCategoryId("");
                  setSelectedCategoryIds([]);
                }}
              >
                <option value="intra">Intra-Category</option>
                <option value="inter">Inter-Category</option>
              </select>
            </div>

            {/* Category Selector(s) */}
            {comparisonType === "intra" ? (
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium mb-2 block">Categories</label>
                <SelectMultiple
                  label="Select categories"
                  options={categoryOptions}
                  value={selectedCategoryIds}
                  onChange={setSelectedCategoryIds}
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
                variant={comparisonData?.type === "inter" ? "default" : "secondary"}
                className="text-sm"
              >
                {comparisonData?.type === "inter" ? "Inter-Category" : "Intra-Category"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clients
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

      {/* Charts Section */}
      {graphData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          {barChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metric Comparison</CardTitle>
                <CardDescription>Comparison across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsResponsiveChart className="analytics-chart-mobile">
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
                  <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
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

          {/* Box Plot placeholder - would need custom implementation */}
          {graphData.boxPlot && (
            <Card>
              <CardHeader>
                <CardTitle>Distribution (Box Plot)</CardTitle>
                <CardDescription>Statistical distribution visualization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Box plot visualization (custom implementation needed)
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
            <CardTitle>Client Comparison</CardTitle>
            <CardDescription>
              Detailed comparison of all clients in the selected categories
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

