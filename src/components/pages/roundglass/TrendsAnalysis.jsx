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
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { getTrendsAnalysis } from "@/lib/fetchers/roundglassAnalytics";
import { getAppClients } from "@/lib/fetchers/app";
import {
  formatDateRange,
  formatMetricName,
  normalizeMetricValue,
  calculateTrendDirection,
  getTrendIcon,
} from "@/lib/utils/roundglassAnalytics";
import { cn } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import {
  Activity,
  CalendarIcon,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

export default function TrendsAnalysis() {
  // State for filters
  const [selectedMetric, setSelectedMetric] = useState("bmi");
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState(() => new Date());
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [aggregate, setAggregate] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Fetch clients for coach view
  const { data: clientsData } = useSWR("trends-clients-list", () =>
    getAppClients({ limit: 10000 })
  );

  const clients = useMemo(() => {
    if (!clientsData?.data || !Array.isArray(clientsData.data)) return [];
    return clientsData.data.map((client) => ({
      value: client._id,
      label: client.name || "Unknown",
    }));
  }, [clientsData]);

  // Build API params
  const apiParams = useMemo(() => {
    const params = {
      person: "coach",
      metric: selectedMetric,
    };

    if (selectedClientIds.length > 0) {
      params.clientIds = selectedClientIds;
    }

    if (startDate) {
      params.startDate = format(startDate, "yyyy-MM-dd");
    }

    if (endDate) {
      params.endDate = format(endDate, "yyyy-MM-dd");
    }

    params.aggregate = aggregate;

    return params;
  }, [selectedMetric, selectedClientIds, startDate, endDate, aggregate]);

  // Build SWR key
  const swrKey = useMemo(() => {
    const keyParts = [
      "roundglass/trends",
      "coach",
      selectedMetric,
      startDate ? format(startDate, "yyyy-MM-dd") : "",
      endDate ? format(endDate, "yyyy-MM-dd") : "",
    ];

    if (selectedClientIds.length > 0) {
      keyParts.push(`clients:${selectedClientIds.join(",")}`);
    }
    keyParts.push(`aggregate:${aggregate}`);

    return keyParts.join("|");
  }, [selectedMetric, selectedClientIds, startDate, endDate, aggregate]);

  // Fetch trends data
  const { isLoading, error, data } = useSWR(
    selectedClientIds.length > 0 ? swrKey : null,
    () => getTrendsAnalysis(apiParams)
  );

  const trendsData = data?.data;
  const graphData = data?.graphData;
  const trends = trendsData?.trends;

  // Calculate trend direction
  const trendInfo = useMemo(() => {
    if (!trends) return null;
    return calculateTrendDirection(trends);
  }, [trends]);

  // Prepare line chart data
  const lineChartData = useMemo(() => {
    if (!graphData?.lineChart && !graphData?.multiLineChart) return [];

    const chartData = aggregate ? graphData.lineChart : graphData.multiLineChart || graphData.lineChart;

    if (!chartData) return [];

    const { labels, datasets } = chartData;

    if (!labels || !datasets) return [];

    // Transform to recharts format
    return labels.map((label, index) => {
      const dataPoint = { date: label };
      datasets.forEach((dataset) => {
        dataPoint[dataset.label] = dataset.data[index];
      });
      return dataPoint;
    });
  }, [graphData, aggregate]);

  // Prepare table data
  const tableData = useMemo(() => {
    if (!trendsData?.timeSeries) return [];

    return trendsData.timeSeries.map((point) => ({
      date: point.date,
      value: point.value,
      clientId: point.clientId || null,
    }));
  }, [trendsData]);

  // Get client name by ID
  const getClientName = (clientId) => {
    if (!clientId || !clientsData?.data) return "—";
    const client = clientsData.data.find((c) => c._id === clientId);
    return client?.name || "—";
  };

  // Handle refresh
  const handleRefresh = () => {
    mutate(swrKey);
    toast.success("Data refreshed");
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!tableData.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const headers = ["Date", "Player", "Value"];
      const rows = tableData.map((row) => {
        const csvRow = [row.date, getClientName(row.clientId), row.value ?? "—"];
        return csvRow.join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `trends-${selectedMetric}-${format(new Date(), "yyyy-MM-dd")}.csv`
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

  // Show message if no players selected
  if (selectedClientIds.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Players Selected</h3>
            <p className="text-muted-foreground">
              Please select players and date range to view trends
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <ContentLoader />;

  if (error || (data && data?.status_code !== 200)) {
    return (
      <ContentError
        title={error?.message || data?.message || "Failed to load trends data"}
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
              <CardTitle>Trends Analysis</CardTitle>
              <CardDescription>
                Analyze time-series trends for health metrics
              </CardDescription>
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {tableData.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <AnalyticsPrintButton
                    variant="outline"
                    size="sm"
                    title="Trends Analysis Report"
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
            {/* Metric Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Metric</label>
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

            {/* Start Date Picker */}
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd-MM-yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setStartDateOpen(false);
                    }}
                    initialFocus
                    maxDate={endDate || new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date Picker */}
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd-MM-yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setEndDateOpen(false);
                    }}
                    initialFocus
                    minDate={startDate}
                    maxDate={new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Player Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Players</label>
              <SelectMultiple
                label="Select players"
                options={clients}
                value={selectedClientIds}
                onChange={setSelectedClientIds}
                searchable
              />
            </div>
          </div>

          {/* Aggregate Toggle */}
          {selectedClientIds.length > 0 && (
            <div className="mt-4 flex items-center space-x-2">
              <Checkbox
                id="aggregate"
                checked={aggregate}
                onCheckedChange={(checked) => setAggregate(checked)}
              />
              <Label
                htmlFor="aggregate"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Aggregate across selected players
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend Indicators */}
      {trendInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trend Direction
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
                  className="text-sm"
                >
                  {trendInfo.direction.charAt(0).toUpperCase() + trendInfo.direction.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rate of Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {trendInfo.rate > 0 ? "+" : ""}
                  {trendInfo.rate.toFixed(2)}
                </div>
                <span className="text-sm text-muted-foreground">per period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Correlation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trendInfo.correlation.toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.abs(trendInfo.correlation) >= 0.7
                  ? "Strong"
                  : Math.abs(trendInfo.correlation) >= 0.3
                  ? "Moderate"
                  : "Weak"}{" "}
                correlation
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Line Chart */}
      {lineChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {formatMetricName(selectedMetric)} Trends
              {aggregate && " (Aggregated)"}
            </CardTitle>
            <CardDescription>
              {formatDateRange(startDate, endDate)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsResponsiveChart mobileHeight={300} desktopHeight={400}>
              <ChartContainer
                config={Object.fromEntries(
                  Object.keys(lineChartData[0] || {})
                    .filter((key) => key !== "date")
                    .map((key, index) => [
                      key,
                      {
                        label: key,
                        color: `hsl(var(--chart-${(index % 5) + 1}))`,
                      },
                    ])
                )}
                className="h-full"
              >
              <LineChart
                data={lineChartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;

                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          {payload.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm font-medium">
                                {entry.name}: {entry.value?.toFixed(2) || "—"}
                              </span>
                            </div>
                          ))}
                          {payload[0]?.payload?.date && (
                            <div className="text-xs text-muted-foreground mt-1 pt-1 border-t">
                              Date: {payload[0].payload.date}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend />
                {Object.keys(lineChartData[0] || {})
                  .filter((key) => key !== "date")
                  .map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={`var(--chart-${(index % 5) + 1})`}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name={key}
                    />
                  ))}
              </LineChart>
              </ChartContainer>
            </AnalyticsResponsiveChart>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      {tableData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Time-Series Data</CardTitle>
            <CardDescription>
              Detailed data points for {formatMetricName(selectedMetric)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsResponsiveTable className="analytics-table-mobile">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.date || "—"}</TableCell>
                      <TableCell>{getClientName(row.clientId)}</TableCell>
                      <TableCell>
                        {normalizeMetricValue(row.value, selectedMetric)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AnalyticsResponsiveTable>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !trendsData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground">
                Please select players and date range to view trends
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

