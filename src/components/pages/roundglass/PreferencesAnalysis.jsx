"use client";

import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import AnalyticsPrintButton from "@/components/common/AnalyticsPrintButton";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getPreferencesAnalysis } from "@/lib/fetchers/roundglassAnalytics";
import { useAppSelector } from "@/providers/global/hooks";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, RefreshCw, Dumbbell, Pill, AlertTriangle, Users } from "lucide-react";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function PreferencesAnalysis() {
  const { client_categories = [] } = useAppSelector((state) => state.coach.data);

  // State for filters
  const [analysisType, setAnalysisType] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [activeTab, setActiveTab] = useState("training");

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
      person: "coach", // Preferences analysis only available for coach
    };

    if (selectedCategoryId && selectedCategoryId !== "all") {
      params.categoryId = selectedCategoryId;
    }

    if (analysisType !== "all") {
      params.analysisType = analysisType;
    }

    return params;
  }, [selectedCategoryId, analysisType]);

  // Build SWR key
  const swrKey = useMemo(() => {
    const keyParts = ["roundglass/preferences-analysis", "coach"];

    if (selectedCategoryId) {
      keyParts.push(`category:${selectedCategoryId}`);
    }

    if (analysisType !== "all") {
      keyParts.push(`type:${analysisType}`);
    }

    return keyParts.join("|");
  }, [selectedCategoryId, analysisType]);

  // Fetch preferences analysis data
  const { isLoading, error, data } = useSWR(swrKey, () => getPreferencesAnalysis(apiParams));

  const preferencesData = data?.data;
  const graphData = data?.graphData;

  // Prepare training data
  const trainingData = useMemo(() => {
    if (!preferencesData?.training) return null;
    return preferencesData.training;
  }, [preferencesData]);

  // Prepare supplements data
  const supplementsData = useMemo(() => {
    if (!preferencesData?.supplements) return null;
    return preferencesData.supplements;
  }, [preferencesData]);

  // Prepare injuries data
  const injuriesData = useMemo(() => {
    if (!preferencesData?.injuries) return null;
    return preferencesData.injuries;
  }, [preferencesData]);

  // Prepare training frequency chart data
  const trainingFrequencyChart = useMemo(() => {
    if (!graphData?.trainingFrequency) return [];
    const { labels, data: values } = graphData.trainingFrequency;
    if (!labels || !values) return [];
    return labels.map((label, index) => ({
      frequency: label,
      count: values[index] || 0,
    }));
  }, [graphData]);

  // Prepare intensity pie chart data
  const intensityChart = useMemo(() => {
    if (!graphData?.intensity) return [];
    const { labels, data: values } = graphData.intensity;
    if (!labels || !values) return [];
    return labels.map((label, index) => ({
      name: label,
      value: values[index] || 0,
    }));
  }, [graphData]);

  // Prepare brand distribution chart data
  const brandChart = useMemo(() => {
    if (!graphData?.brandDistribution) return [];
    const { labels, data: values } = graphData.brandDistribution;
    if (!labels || !values) return [];
    return labels.map((label, index) => ({
      brand: label,
      count: values[index] || 0,
    }));
  }, [graphData]);

  // Prepare purpose distribution chart data
  const purposeChart = useMemo(() => {
    if (!graphData?.purposeDistribution) return [];
    const { labels, data: values } = graphData.purposeDistribution;
    if (!labels || !values) return [];
    return labels.map((label, index) => ({
      purpose: label,
      count: values[index] || 0,
    }));
  }, [graphData]);

  // Prepare body part distribution chart data
  const bodyPartChart = useMemo(() => {
    if (!graphData?.bodyPartDistribution) return [];
    const { labels, data: values } = graphData.bodyPartDistribution;
    if (!labels || !values) return [];
    return labels.map((label, index) => ({
      bodyPart: label,
      count: values[index] || 0,
    }));
  }, [graphData]);

  // Prepare injury type distribution chart data
  const injuryTypeChart = useMemo(() => {
    if (!graphData?.injuryTypeDistribution) return [];
    const { labels, data: values } = graphData.injuryTypeDistribution;
    if (!labels || !values) return [];
    return labels.map((label, index) => ({
      type: label,
      count: values[index] || 0,
    }));
  }, [graphData]);

  // Handle refresh
  const handleRefresh = () => {
    mutate(swrKey);
    toast.success("Data refreshed");
  };

  // Export to CSV
  const handleExportCSV = (section, data) => {
    if (!data || Object.keys(data).length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const headers = ["Item", "Count", "Percentage"];
      const rows = [];

      // Handle different data structures
      if (section === "training") {
        if (data.frequencyDistribution) {
          Object.entries(data.frequencyDistribution).forEach(([key, value]) => {
            const total = data.totalClients || 1;
            rows.push([key, value, `${((value / total) * 100).toFixed(2)}%`]);
          });
        }
      } else if (section === "supplements") {
        if (data.brandDistribution) {
          Object.entries(data.brandDistribution).forEach(([key, value]) => {
            const total = data.totalClients || 1;
            rows.push([`Brand: ${key}`, value, `${((value / total) * 100).toFixed(2)}%`]);
          });
        }
        if (data.purposeDistribution) {
          Object.entries(data.purposeDistribution).forEach(([key, value]) => {
            const total = data.totalClients || 1;
            rows.push([`Purpose: ${key}`, value, `${((value / total) * 100).toFixed(2)}%`]);
          });
        }
      } else if (section === "injuries") {
        if (data.bodyPartDistribution) {
          Object.entries(data.bodyPartDistribution).forEach(([key, value]) => {
            const total = data.totalClients || 1;
            rows.push([`Body Part: ${key}`, value, `${((value / total) * 100).toFixed(2)}%`]);
          });
        }
        if (data.injuryTypeDistribution) {
          Object.entries(data.injuryTypeDistribution).forEach(([key, value]) => {
            const total = data.totalClients || 1;
            rows.push([`Type: ${key}`, value, `${((value / total) * 100).toFixed(2)}%`]);
          });
        }
      }

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `preferences-${section}-${new Date().toISOString().split("T")[0]}.csv`
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
        title={error?.message || data?.message || "Failed to load preferences analysis data"}
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
              <CardTitle>Preferences Analysis</CardTitle>
              <CardDescription>
                Analyze training, supplements, and injury patterns
              </CardDescription>
            </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <AnalyticsPrintButton
                variant="outline"
                size="sm"
                title="Preferences Analysis Report"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
            {/* Analysis Type Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Analysis Type</label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="supplements">Supplements</SelectItem>
                  <SelectItem value="injuries">Injuries</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different analysis types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="training">
            <Dumbbell className="h-4 w-4 mr-2" />
            Training
          </TabsTrigger>
          <TabsTrigger value="supplements">
            <Pill className="h-4 w-4 mr-2" />
            Supplements
          </TabsTrigger>
          <TabsTrigger value="injuries">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Injuries
          </TabsTrigger>
        </TabsList>

        {/* Training Analysis Tab */}
        <TabsContent value="training" className="space-y-6">
          {trainingData ? (
            <>
              {/* Training Overview Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Training Analysis</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV("training", trainingData)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">
                      Total Players with Training Data: {trainingData.totalClients || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Training Frequency Chart */}
              {trainingFrequencyChart.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Training Frequency Distribution</CardTitle>
                    <CardDescription>Number of players by training frequency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: {
                          label: "Players",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-80"
                    >
                      <BarChart
                        data={trainingFrequencyChart}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="frequency"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Intensity Distribution */}
              {intensityChart.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Training Intensity Distribution</CardTitle>
                    <CardDescription>Distribution of training intensity levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={intensityChart}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {intensityChart.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const data = payload[0];
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-2.5 w-2.5 rounded-full"
                                      style={{ backgroundColor: data.payload.fill }}
                                    />
                                    <span className="text-sm font-medium">
                                      {data.payload.name}: {data.value} players (
                                      {((data.value / (trainingData.totalClients || 1)) * 100).toFixed(1)}%)
                                    </span>
                                  </div>
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Duration Statistics */}
              {trainingData.durationStatistics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Average Duration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {trainingData.durationStatistics.mean?.toFixed(1) || "—"} minutes
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Median Duration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {trainingData.durationStatistics.median || "—"} minutes
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Conditioning Days Distribution */}
              {trainingData.conditioningDaysDistribution && (
                <Card>
                  <CardHeader>
                    <CardTitle>Conditioning Days Distribution</CardTitle>
                    <CardDescription>Most common training days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(trainingData.conditioningDaysDistribution)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([day, count]) => (
                          <div key={day} className="flex items-center justify-between">
                            <span className="text-sm">{day}</span>
                            <Badge variant="secondary">{count} players</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Training Data Available</h3>
                  <p className="text-muted-foreground">
                    No training preferences data found for the selected filters
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Supplements Analysis Tab */}
        <TabsContent value="supplements" className="space-y-6">
          {supplementsData ? (
            <>
              {/* Supplements Overview Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Supplements Analysis</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV("supplements", supplementsData)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">
                      Total Players with Supplements: {supplementsData.totalClients || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Brand Distribution */}
              {brandChart.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Brand Distribution</CardTitle>
                    <CardDescription>Most popular supplement brands</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: {
                          label: "Players",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-80"
                    >
                      <BarChart
                        data={brandChart}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="brand"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Purpose Distribution */}
              {purposeChart.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Purpose Distribution</CardTitle>
                    <CardDescription>Most common supplement purposes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: {
                          label: "Players",
                          color: "hsl(var(--chart-3))",
                        },
                      }}
                      className="h-80"
                    >
                      <BarChart
                        data={purposeChart}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="purpose"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Supplements Statistics */}
              {supplementsData.supplementsPerClientStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Average Supplements per Client
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {supplementsData.supplementsPerClientStats.mean?.toFixed(1) || "—"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Median Supplements per Client
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {supplementsData.supplementsPerClientStats.median || "—"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Max Supplements per Client
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {supplementsData.supplementsPerClientStats.max || "—"}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Supplements Data Available</h3>
                  <p className="text-muted-foreground">
                    No supplements preferences data found for the selected filters
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Injuries Analysis Tab */}
        <TabsContent value="injuries" className="space-y-6">
          {injuriesData ? (
            <>
              {/* Injuries Overview Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Injuries Analysis</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV("injuries", injuriesData)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">
                      Total Players with Injuries: {injuriesData.totalClients || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Body Part Distribution */}
              {bodyPartChart.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Body Part Distribution</CardTitle>
                    <CardDescription>Most commonly injured body parts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: {
                          label: "Injuries",
                          color: "hsl(var(--chart-4))",
                        },
                      }}
                      className="h-80"
                    >
                      <BarChart
                        data={bodyPartChart}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="bodyPart"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Injury Type Distribution */}
              {injuryTypeChart.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Injury Type Distribution</CardTitle>
                    <CardDescription>Most common types of injuries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: {
                          label: "Injuries",
                          color: "hsl(var(--chart-5))",
                        },
                      }}
                      className="h-80"
                    >
                      <BarChart
                        data={injuryTypeChart}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="type"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="count" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              {/* Injuries Statistics */}
              {injuriesData.injuriesPerClientStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Average Injuries per Client
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {injuriesData.injuriesPerClientStats.mean?.toFixed(1) || "—"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Median Injuries per Client
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {injuriesData.injuriesPerClientStats.median || "—"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Max Injuries per Client
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {injuriesData.injuriesPerClientStats.max || "—"}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Rehabilitation Progress Statistics */}
              {injuriesData.rehabProgressStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Rehabilitation Progress Statistics</CardTitle>
                    <CardDescription>Distribution of rehabilitation progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(injuriesData.rehabProgressStats)
                        .sort(([, a], [, b]) => b - a)
                        .map(([progress, count]) => (
                          <div key={progress} className="flex items-center justify-between">
                            <span className="text-sm">{progress}</span>
                            <Badge variant="secondary">{count} injuries</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Injuries Data Available</h3>
                  <p className="text-muted-foreground">
                    No injury preferences data found for the selected filters
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

