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
import { getDistribution } from "@/lib/fetchers/roundglassAnalytics";
import { getAppClients } from "@/lib/fetchers/app";
import {
  formatMetricName,
  normalizeMetricValue,
  formatPercentile,
} from "@/lib/utils/roundglassAnalytics";
import { useAppSelector } from "@/providers/global/hooks";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Download, RefreshCw, BarChart3, TrendingUp } from "lucide-react";

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

// Custom Box Plot Component
function BoxPlot({ data, metric }) {
  if (!data) return null;

  const { min, q1, median, q3, max, mean } = data;
  const iqr = q3 - q1;
  const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
  const upperWhisker = Math.min(max, q3 + 1.5 * iqr);

  const width = 300;
  const height = 240;
  const padding = { top: 20, right: 80, bottom: 20, left: 40 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const centerX = padding.left + plotWidth / 2;
  const boxWidth = 60;
  const boxLeft = centerX - boxWidth / 2;
  const boxRight = centerX + boxWidth / 2;

  // Scale values to fit in plot height (inverted Y-axis)
  const scale = (value) => {
    const range = max - min;
    if (range === 0) return padding.top + plotHeight / 2;
    const normalized = (value - min) / range;
    return padding.top + plotHeight - normalized * plotHeight;
  };

  const scaledMin = scale(min);
  const scaledMax = scale(max);
  const scaledQ1 = scale(q1);
  const scaledMedian = scale(median);
  const scaledQ3 = scale(q3);
  const scaledMean = scale(mean);
  const scaledLowerWhisker = scale(lowerWhisker);
  const scaledUpperWhisker = scale(upperWhisker);

  return (
    <div className="w-full flex items-center justify-center">
      <svg width={width} height={height} className="overflow-visible">
        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + plotHeight}
          stroke="#ccc"
          strokeWidth="2"
        />
        
        {/* Whiskers */}
        <line
          x1={centerX}
          y1={scaledMax}
          x2={centerX}
          y2={scaledUpperWhisker}
          stroke="#333"
          strokeWidth="2"
        />
        <line
          x1={centerX}
          y1={scaledMin}
          x2={centerX}
          y2={scaledLowerWhisker}
          stroke="#333"
          strokeWidth="2"
        />
        
        {/* Whisker caps */}
        <line
          x1={boxLeft}
          y1={scaledMax}
          x2={boxRight}
          y2={scaledMax}
          stroke="#333"
          strokeWidth="2"
        />
        <line
          x1={boxLeft}
          y1={scaledMin}
          x2={boxRight}
          y2={scaledMin}
          stroke="#333"
          strokeWidth="2"
        />
        
        {/* Box */}
        <rect
          x={boxLeft}
          y={scaledQ3}
          width={boxWidth}
          height={scaledQ1 - scaledQ3}
          fill="#3b82f6"
          fillOpacity={0.3}
          stroke="#3b82f6"
          strokeWidth="2"
        />
        
        {/* Median line */}
        <line
          x1={boxLeft}
          y1={scaledMedian}
          x2={boxRight}
          y2={scaledMedian}
          stroke="#1e40af"
          strokeWidth="3"
        />
        
        {/* Mean indicator */}
        <circle
          cx={centerX}
          cy={scaledMean}
          r={5}
          fill="#ef4444"
          stroke="#fff"
          strokeWidth="2"
        />
        
        {/* Y-axis labels */}
        <text
          x={padding.left - 10}
          y={scaledMin + 4}
          fontSize="11"
          fill="#666"
          textAnchor="end"
        >
          {min.toFixed(1)}
        </text>
        <text
          x={padding.left - 10}
          y={scaledQ1 + 4}
          fontSize="11"
          fill="#666"
          textAnchor="end"
        >
          {q1.toFixed(1)}
        </text>
        <text
          x={padding.left - 10}
          y={scaledMedian + 4}
          fontSize="11"
          fill="#1e40af"
          fontWeight="bold"
          textAnchor="end"
        >
          {median.toFixed(1)}
        </text>
        <text
          x={padding.left - 10}
          y={scaledQ3 + 4}
          fontSize="11"
          fill="#666"
          textAnchor="end"
        >
          {q3.toFixed(1)}
        </text>
        <text
          x={padding.left - 10}
          y={scaledMax + 4}
          fontSize="11"
          fill="#666"
          textAnchor="end"
        >
          {max.toFixed(1)}
        </text>
        
        {/* Mean label */}
        <text
          x={centerX}
          y={scaledMean - 10}
          fontSize="10"
          fill="#ef4444"
          textAnchor="middle"
          fontWeight="bold"
        >
          Mean
        </text>
        <text
          x={centerX}
          y={scaledMean + 15}
          fontSize="10"
          fill="#ef4444"
          textAnchor="middle"
        >
          {mean.toFixed(1)}
        </text>
      </svg>
    </div>
  );
}

export default function DistributionAnalysis() {
  const { client_categories = [] } = useAppSelector((state) => state.coach.data);

  // State for filters
  const [selectedMetric, setSelectedMetric] = useState("bmi");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedClientIds, setSelectedClientIds] = useState([]);

  // Fetch clients
  const { data: clientsData } = useSWR("distribution-clients-list", () =>
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
      person: "coach", // Distribution only available for coach
      metric: selectedMetric,
    };

    if (selectedCategoryId && selectedCategoryId !== "all") {
      params.categoryId = selectedCategoryId;
    }

    if (selectedClientIds.length > 0) {
      params.clientIds = selectedClientIds;
    }

    return params;
  }, [selectedMetric, selectedCategoryId, selectedClientIds]);

  // Build SWR key
  const swrKey = useMemo(() => {
    const keyParts = ["roundglass/distribution", "coach", selectedMetric];

    if (selectedCategoryId) {
      keyParts.push(`category:${selectedCategoryId}`);
    }

    if (selectedClientIds.length > 0) {
      keyParts.push(`clients:${selectedClientIds.join(",")}`);
    }

    return keyParts.join("|");
  }, [selectedMetric, selectedCategoryId, selectedClientIds]);

  // Fetch distribution data
  const { isLoading, error, data } = useSWR(
    selectedMetric ? swrKey : null,
    () => getDistribution(apiParams)
  );

  const distributionData = data?.data;
  const graphData = data?.graphData;
  const statistics = distributionData?.statistics;
  const distribution = distributionData?.distribution;

  // Prepare histogram data
  const histogramData = useMemo(() => {
    if (!graphData?.histogram) return [];

    const { labels, data: histogramValues } = graphData.histogram;
    if (!labels || !histogramValues) return [];

    return labels.map((label, index) => ({
      bin: label,
      count: histogramValues[index] || 0,
    }));
  }, [graphData]);

  // Prepare box plot data
  const boxPlotData = useMemo(() => {
    if (!graphData?.boxPlot) return null;

    return graphData.boxPlot;
  }, [graphData]);

  // Handle refresh
  const handleRefresh = () => {
    mutate(swrKey);
    toast.success("Data refreshed");
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!distribution || distribution.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const headers = ["Bin Range", "Count", "Percentage"];
      const rows = distribution.map((item) => [
        item.bin || "—",
        item.count || 0,
        `${item.percentage?.toFixed(2) || 0}%`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `distribution-${selectedMetric}-${new Date().toISOString().split("T")[0]}.csv`
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

  if (isLoading) return <ContentLoader />;

  if (error || data?.status_code !== 200) {
    return (
      <ContentError
        title={error?.message || data?.message || "Failed to load distribution data"}
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
              <CardTitle>Distribution Analysis</CardTitle>
              <CardDescription>
                Analyze statistical distribution for a specific metric
              </CardDescription>
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {distribution && distribution.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <AnalyticsPrintButton
                    variant="outline"
                    size="sm"
                    title="Distribution Analysis Report"
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
            {/* Metric Selector (Required) */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Metric <span className="text-red-500">*</span>
              </label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_METRICS.map((metric) => (
                    <SelectItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Client Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Players (Optional)</label>
              <SelectMultiple
                label="Select players"
                options={clients}
                value={selectedClientIds}
                onChange={setSelectedClientIds}
                searchable
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mean</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {normalizeMetricValue(statistics.mean, selectedMetric)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Median</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {normalizeMetricValue(statistics.median, selectedMetric)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Min</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {normalizeMetricValue(statistics.min, selectedMetric)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Max</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {normalizeMetricValue(statistics.max, selectedMetric)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Std Dev</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {normalizeMetricValue(statistics.stdDev, selectedMetric)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Percentiles Cards */}
      {statistics?.percentiles && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(statistics.percentiles).map(([key, value]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {formatPercentile(parseInt(key.replace("p", "")))}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {normalizeMetricValue(value, selectedMetric)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Count Card */}
      {statistics && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{statistics.count || 0}</div>
              <span className="text-sm text-muted-foreground">data points</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box Plot */}
        {boxPlotData && (
          <Card>
            <CardHeader>
              <CardTitle>Box Plot</CardTitle>
              <CardDescription>
                Visual representation of distribution (Min, Q1, Median, Q3, Max, Mean)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BoxPlot data={boxPlotData} metric={selectedMetric} />
            </CardContent>
          </Card>
        )}

        {/* Histogram */}
        {histogramData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histogram</CardTitle>
              <CardDescription>
                Frequency distribution of {formatMetricName(selectedMetric)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Frequency",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-64"
              >
                <BarChart
                  data={histogramData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="bin"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="text-sm">
                            <div>
                              <strong>Range:</strong> {data.bin}
                            </div>
                            <div>
                              <strong>Count:</strong> {data.count}
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Distribution Table */}
      {distribution && distribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution Details</CardTitle>
            <CardDescription>
              Complete breakdown of distribution bins for {formatMetricName(selectedMetric)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bin Range</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distribution.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.bin || "—"}</TableCell>
                      <TableCell>{item.count || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{item.percentage?.toFixed(2) || 0}%</span>
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${item.percentage || 0}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !distributionData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Distribution Data Available</h3>
              <p className="text-muted-foreground">
                Please select a metric to view distribution analysis
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

