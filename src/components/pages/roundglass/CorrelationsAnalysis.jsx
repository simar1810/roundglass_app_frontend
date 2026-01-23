"use client";

import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import AnalyticsPrintButton from "@/components/common/AnalyticsPrintButton";
import SelectMultiple from "@/components/SelectMultiple";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { getCorrelations } from "@/lib/fetchers/roundglassAnalytics";
import { getAppClients } from "@/lib/fetchers/app";
import {
  formatMetricName,
  formatCorrelation,
  getCorrelationStrength,
  getCorrelationColor,
} from "@/lib/utils/roundglassAnalytics";
import { useAppSelector } from "@/providers/global/hooks";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Download, RefreshCw, TrendingUp, TrendingDown, Activity } from "lucide-react";

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

export default function CorrelationsAnalysis() {
  const { client_categories = [] } = useAppSelector((state) => state.coach.data);

  // State for filters
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "correlation", direction: "desc" });
  const [selectedCorrelation, setSelectedCorrelation] = useState(null);

  // Fetch clients
  const { data: clientsData } = useSWR("correlations-clients-list", () =>
    getAppClients({ limit: 10000 })
  );

  const clients = useMemo(() => {
    if (!clientsData?.data || !Array.isArray(clientsData.data)) return [];
    return clientsData.data.map((client) => ({
      value: client._id,
      label: client.name || "Unknown",
    }));
  }, [clientsData]);

  // Prepare category options
  const categoryOptions = useMemo(() => {
    return client_categories.map((cat) => ({
      value: cat._id,
      label: cat.name || cat.title || "Unknown",
    }));
  }, [client_categories]);

  // Build API params
  const apiParams = useMemo(() => {
    const params = {
      person: "coach", // Correlations only available for coach
    };

    if (selectedClientIds.length > 0) {
      params.clientIds = selectedClientIds;
    }

    if (selectedMetrics.length > 0) {
      params.metrics = selectedMetrics;
    }

    if (selectedCategoryId && selectedCategoryId !== "all") {
      params.categoryId = selectedCategoryId;
    }

    return params;
  }, [selectedClientIds, selectedMetrics, selectedCategoryId]);

  // Build SWR key
  const swrKey = useMemo(() => {
    const keyParts = ["roundglass/correlations", "coach"];

    if (selectedClientIds.length > 0) {
      keyParts.push(`clients:${selectedClientIds.join(",")}`);
    }

    if (selectedMetrics.length > 0) {
      keyParts.push(`metrics:${selectedMetrics.join(",")}`);
    }

    if (selectedCategoryId) {
      keyParts.push(`category:${selectedCategoryId}`);
    }

    return keyParts.join("|");
  }, [selectedClientIds, selectedMetrics, selectedCategoryId]);

  // Fetch correlations data
  const { isLoading, error, data } = useSWR(swrKey, () => getCorrelations(apiParams));

  const correlationsData = data?.data;
  const graphData = data?.graphData;

  // Prepare correlation list
  const correlationList = useMemo(() => {
    if (!correlationsData?.correlations) return [];

    let correlations = [...correlationsData.correlations];

    // Sort correlations
    if (sortConfig.key) {
      correlations.sort((a, b) => {
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

    return correlations;
  }, [correlationsData, sortConfig]);

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    if (!correlationsData?.correlations) return { labels: [], matrix: [] };

    // Get unique metrics
    const metrics = new Set();
    correlationsData.correlations.forEach((corr) => {
      metrics.add(corr.metric1);
      metrics.add(corr.metric2);
    });

    const metricArray = Array.from(metrics);
    const matrix = metricArray.map((metric1) =>
      metricArray.map((metric2) => {
        if (metric1 === metric2) return 1.0; // Perfect correlation with itself

        const correlation = correlationsData.correlations.find(
          (corr) =>
            (corr.metric1 === metric1 && corr.metric2 === metric2) ||
            (corr.metric1 === metric2 && corr.metric2 === metric1)
        );

        return correlation ? correlation.correlation : null;
      })
    );

    return {
      labels: metricArray,
      matrix,
    };
  }, [correlationsData]);

  // Prepare scatter plot data
  const scatterPlotData = useMemo(() => {
    if (!graphData?.scatterPlot?.datasets) return [];

    return graphData.scatterPlot.datasets.map((dataset) => {
      // Transform data from [[x, y]] to [{x, y}]
      const transformedData = (dataset.data || []).map((point) => {
        if (Array.isArray(point)) {
          return { x: point[0], y: point[1] };
        }
        return point;
      });

      return {
        label: dataset.label,
        data: transformedData,
        correlation: dataset.correlation,
        metric1: dataset.label.split(" vs ")[0] || "",
        metric2: dataset.label.split(" vs ")[1] || "",
      };
    });
  }, [graphData]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle refresh
  const handleRefresh = () => {
    mutate(swrKey);
    toast.success("Data refreshed");
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!correlationList.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const headers = ["Metric 1", "Metric 2", "Correlation", "Strength", "Data Points"];
      const rows = correlationList.map((corr) => [
        formatMetricName(corr.metric1),
        formatMetricName(corr.metric2),
        corr.correlation?.toFixed(3) || "—",
        getCorrelationStrength(corr.correlation),
        corr.dataPoints || "—",
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `correlations-${new Date().toISOString().split("T")[0]}.csv`
      );
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

  // Get correlation color for heatmap
  const getHeatmapColor = (correlation) => {
    if (correlation === null || correlation === undefined) return "bg-gray-200";
    if (correlation >= 0.7) return "bg-blue-600";
    if (correlation >= 0.3) return "bg-blue-400";
    if (correlation >= 0) return "bg-blue-200";
    if (correlation >= -0.3) return "bg-red-200";
    if (correlation >= -0.7) return "bg-red-400";
    return "bg-red-600";
  };

  if (isLoading) return <ContentLoader />;

  if (error || data?.status_code !== 200) {
    return (
      <ContentError
        title={error?.message || data?.message || "Failed to load correlations data"}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Correlations Analysis</CardTitle>
              <CardDescription>
                Analyze relationships between different health metrics
              </CardDescription>
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {correlationList.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <AnalyticsPrintButton
                    variant="outline"
                    size="sm"
                    title="Correlations Analysis Report"
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
            {/* Client Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Clients (Optional)</label>
              <SelectMultiple
                label="Select clients"
                options={clients}
                value={selectedClientIds}
                onChange={setSelectedClientIds}
                searchable
              />
            </div>

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

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category (Optional)</label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
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
          </div>
        </CardContent>
      </Card>

      {/* Correlation Heatmap */}
      {heatmapData.labels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Correlation Heatmap</CardTitle>
            <CardDescription>
              Color-coded correlation matrix (Blue: positive, Red: negative)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <table className="border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left font-medium bg-muted sticky left-0 z-10">
                        Metric
                      </th>
                      {heatmapData.labels.map((label) => (
                        <th
                          key={label}
                          className="border p-2 text-center font-medium bg-muted min-w-[100px]"
                        >
                          <div className="transform -rotate-45 origin-center whitespace-nowrap">
                            {formatMetricName(label)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.labels.map((metric1, rowIndex) => (
                      <tr key={metric1}>
                        <td className="border p-2 font-medium bg-muted sticky left-0 z-10">
                          {formatMetricName(metric1)}
                        </td>
                        {heatmapData.matrix[rowIndex].map((correlation, colIndex) => {
                          const metric2 = heatmapData.labels[colIndex];
                          const isDiagonal = metric1 === metric2;
                          return (
                            <td
                              key={`${metric1}-${metric2}`}
                              className={cn(
                                "border p-2 text-center cursor-pointer hover:opacity-80 transition-opacity",
                                isDiagonal
                                  ? "bg-gray-100"
                                  : getHeatmapColor(correlation),
                                correlation !== null && correlation !== undefined && !isDiagonal
                                  ? "text-white font-semibold"
                                  : "text-gray-700"
                              )}
                              title={
                                isDiagonal
                                  ? "Perfect correlation (1.0)"
                                  : correlation !== null && correlation !== undefined
                                  ? `${formatMetricName(metric1)} vs ${formatMetricName(metric2)}: ${correlation.toFixed(3)}`
                                  : "No data"
                              }
                              onClick={() => {
                                if (!isDiagonal && correlation !== null) {
                                  const corr = correlationList.find(
                                    (c) =>
                                      (c.metric1 === metric1 && c.metric2 === metric2) ||
                                      (c.metric1 === metric2 && c.metric2 === metric1)
                                  );
                                  setSelectedCorrelation(corr || null);
                                }
                              }}
                            >
                              {isDiagonal
                                ? "1.0"
                                : correlation !== null && correlation !== undefined
                                ? correlation.toFixed(2)
                                : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600"></div>
                <span>Strong Positive (≥0.7)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400"></div>
                <span>Moderate Positive (0.3-0.7)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400"></div>
                <span>Moderate Negative (-0.3 to -0.7)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600"></div>
                <span>Strong Negative (≤-0.7)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scatter Plots */}
      {scatterPlotData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {scatterPlotData
            .filter((dataset) => Math.abs(dataset.correlation) >= 0.3) // Only show significant correlations
            .slice(0, 4) // Limit to 4 scatter plots
            .map((dataset, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm">{dataset.label}</CardTitle>
                  <CardDescription>
                    Correlation: {dataset.correlation.toFixed(3)} (
                    {getCorrelationStrength(dataset.correlation)})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        data={dataset.data}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="x"
                          name={formatMetricName(dataset.metric1)}
                          type="number"
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          dataKey="y"
                          name={formatMetricName(dataset.metric2)}
                          type="number"
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="text-sm">
                                  <div>
                                    <strong>{formatMetricName(dataset.metric1)}:</strong>{" "}
                                    {data.x?.toFixed(2)}
                                  </div>
                                  <div>
                                    <strong>{formatMetricName(dataset.metric2)}:</strong>{" "}
                                    {data.y?.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Scatter
                          name={dataset.label}
                          data={dataset.data}
                          fill={
                            dataset.correlation > 0
                              ? "hsl(var(--chart-1))"
                              : "hsl(var(--chart-2))"
                          }
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Correlation Table */}
      {correlationList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Correlation Details</CardTitle>
            <CardDescription>
              Complete list of metric correlations (click column headers to sort)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("metric1")}
                    >
                      Metric 1
                      {sortConfig.key === "metric1" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("metric2")}
                    >
                      Metric 2
                      {sortConfig.key === "metric2" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("correlation")}
                    >
                      Correlation
                      {sortConfig.key === "correlation" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("dataPoints")}
                    >
                      Data Points
                      {sortConfig.key === "dataPoints" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {correlationList.map((corr, index) => {
                    const strength = getCorrelationStrength(corr.correlation);
                    const color = getCorrelationColor(corr.correlation);
                    return (
                      <TableRow
                        key={index}
                        className={cn(
                          selectedCorrelation === corr && "bg-muted",
                          "cursor-pointer hover:bg-muted/50"
                        )}
                        onClick={() => setSelectedCorrelation(corr)}
                      >
                        <TableCell className="font-medium">
                          {formatMetricName(corr.metric1)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatMetricName(corr.metric2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                color === "blue"
                                  ? "default"
                                  : color === "red"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {corr.correlation?.toFixed(3) || "—"}
                            </Badge>
                            {corr.correlation > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : corr.correlation < 0 ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              strength === "strong"
                                ? "default"
                                : strength === "moderate"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {strength.charAt(0).toUpperCase() + strength.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{corr.dataPoints || "—"}</TableCell>
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
      {!isLoading && !correlationsData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Correlation Data Available</h3>
              <p className="text-muted-foreground">
                Correlation analysis requires data from multiple clients. Please ensure you have
                sufficient data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

