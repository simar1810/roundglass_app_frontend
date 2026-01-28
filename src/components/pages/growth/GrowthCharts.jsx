"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  LineChart,
  Line,
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
import { useMemo } from "react";
import { formatAgeGroup } from "@/lib/utils/growth";
import { format } from "date-fns";

/**
 * Growth Charts Component
 * Provides visual representations of growth data including:
 * - Line chart for height/weight trends over time (per client)
 * - Bar chart comparing age groups
 * - Pie chart for above/below P50 distribution
 */

// Colors for charts
const CHART_COLORS = {
  height: "#3b82f6", // Blue
  weight: "#10b981", // Green
  above: "#10b981", // Green
  below: "#ef4444", // Red
  p50: "#8b5cf6", // Purple
};

const PIE_COLORS = [CHART_COLORS.above, CHART_COLORS.below];

/**
 * Line chart showing height/weight trends over time for a single client
 */
export function ClientGrowthTrendChart({ measurements = [] }) {
  const chartData = useMemo(() => {
    if (!Array.isArray(measurements) || measurements.length === 0) return [];

    return measurements
      .map((measurement) => ({
        date: measurement.measuredAt
          ? format(new Date(measurement.measuredAt), "MMM dd")
          : "—",
        fullDate: measurement.measuredAt,
        height: measurement.height ? parseFloat(measurement.height) : null,
        weight: measurement.weight ? parseFloat(measurement.weight) : null,
        heightUnit: measurement.heightUnit || "cm",
        weightUnit: measurement.weightUnit || "kg",
        p50Height: measurement.benchmark?.p50HeightCm || null,
        p50Weight: measurement.benchmark?.p50WeightKg || null,
      }))
      .sort((a, b) => {
        if (!a.fullDate || !b.fullDate) return 0;
        return new Date(a.fullDate) - new Date(b.fullDate);
      });
  }, [measurements]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Growth Trends</CardTitle>
          <CardDescription>Height and weight over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No measurement data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Trends</CardTitle>
        <CardDescription>Height and weight over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            height: {
              label: "Height",
              color: CHART_COLORS.height,
            },
            weight: {
              label: "Weight",
              color: CHART_COLORS.weight,
            },
            p50Height: {
              label: "P50 Height",
              color: CHART_COLORS.p50,
            },
            p50Weight: {
              label: "P50 Weight",
              color: CHART_COLORS.p50,
            },
          }}
          className="h-80"
        >
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;

                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      {payload.map((entry, index) => {
                        const data = entry.payload;
                        const unit =
                          entry.dataKey === "height" || entry.dataKey === "p50Height"
                            ? data.heightUnit || "cm"
                            : data.weightUnit || "kg";
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm font-medium">
                              {entry.name}: {entry.value?.toFixed(2) || "—"} {unit}
                            </span>
                          </div>
                        );
                      })}
                      {payload[0]?.payload?.fullDate && (
                        <div className="text-xs text-muted-foreground mt-1 pt-1 border-t">
                          {format(new Date(payload[0].payload.fullDate), "MMM dd, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="height"
              stroke={CHART_COLORS.height}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Height"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="p50Height"
              stroke={CHART_COLORS.p50}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="P50 Height"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="weight"
              stroke={CHART_COLORS.weight}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Weight"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="p50Weight"
              stroke={CHART_COLORS.p50}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="P50 Weight"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Bar chart comparing age groups
 */
export function AgeGroupComparisonChart({ groupReport = null }) {
  const chartData = useMemo(() => {
    if (!groupReport?.ageBuckets || !Array.isArray(groupReport.ageBuckets)) return [];

    return groupReport.ageBuckets.map((bucket) => ({
      ageGroup: formatAgeGroup(bucket.ageGroup || bucket.bucket || "Unknown"),
      totalPlayers: bucket.totalPlayers || 0,
      belowHeight: bucket.belowHeight || 0,
      belowWeight: bucket.belowWeight || 0,
      aboveHeight: (bucket.totalPlayers || 0) - (bucket.belowHeight || 0),
      aboveWeight: (bucket.totalPlayers || 0) - (bucket.belowWeight || 0),
      belowHeightPercent: bucket.totalPlayers
        ? Math.round(((bucket.belowHeight || 0) / bucket.totalPlayers) * 100)
        : 0,
      belowWeightPercent: bucket.totalPlayers
        ? Math.round(((bucket.belowWeight || 0) / bucket.totalPlayers) * 100)
        : 0,
    }));
  }, [groupReport]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Age Group Comparison</CardTitle>
          <CardDescription>Players below standard by age group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No age group data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Age Group Comparison</CardTitle>
        <CardDescription>Players below standard by age group</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            belowHeight: {
              label: "Below Height Standard",
              color: CHART_COLORS.below,
            },
            belowWeight: {
              label: "Below Weight Standard",
              color: "#f59e0b",
            },
          }}
          className="h-80"
        >
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="ageGroup"
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
                            {entry.name}: {entry.value} players
                          </span>
                        </div>
                      ))}
                      {payload[0]?.payload && (
                        <div className="text-xs text-muted-foreground mt-1 pt-1 border-t">
                          Total: {payload[0].payload.totalPlayers} players
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Legend />
            <Bar dataKey="belowHeight" fill={CHART_COLORS.below} name="Below Height Standard" />
            <Bar dataKey="belowWeight" fill="#f59e0b" name="Below Weight Standard" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Pie chart for above/below P50 distribution
 */
export function P50DistributionChart({ groupReport = null, type = "height" }) {
  const chartData = useMemo(() => {
    if (!groupReport) return [];

    const total = groupReport.totalPlayers || 0;
    const below = type === "height" ? groupReport.belowHeight || 0 : groupReport.belowWeight || 0;
    const above = total - below;

    return [
      { name: "Above P50", value: above, color: CHART_COLORS.above },
      { name: "Below P50", value: below, color: CHART_COLORS.below },
    ];
  }, [groupReport, type]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {type === "height" ? "Height" : "Weight"} P50 Distribution
          </CardTitle>
          <CardDescription>Percentage of players above/below P50 standard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const belowPercent = total > 0 ? Math.round((chartData[1].value / total) * 100) : 0;
  const abovePercent = total > 0 ? Math.round((chartData[0].value / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {type === "height" ? "Height" : "Weight"} P50 Distribution
        </CardTitle>
        <CardDescription>Percentage of players above/below P50 standard</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
                          style={{ backgroundColor: data.payload.color }}
                        />
                        <span className="text-sm font-medium">
                          {data.payload.name}: {data.value} players (
                          {((data.value / total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{abovePercent}%</div>
            <div className="text-sm text-muted-foreground">Above P50</div>
            <div className="text-xs text-muted-foreground mt-1">
              {chartData[0].value} players
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{belowPercent}%</div>
            <div className="text-sm text-muted-foreground">Below P50</div>
            <div className="text-xs text-muted-foreground mt-1">
              {chartData[1].value} players
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Combined charts component for dashboard
 */
export default function GrowthCharts({ groupReport = null, clientMeasurements = [] }) {
  return (
    <div className="space-y-6">
      {/* Client Growth Trend (if measurements provided) */}
      {clientMeasurements && clientMeasurements.length > 0 && (
        <ClientGrowthTrendChart measurements={clientMeasurements} />
      )}

      {/* Group-level charts (if groupReport provided) */}
      {groupReport && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <P50DistributionChart groupReport={groupReport} type="height" />
            <P50DistributionChart groupReport={groupReport} type="weight" />
          </div>
          <AgeGroupComparisonChart groupReport={groupReport} />
        </>
      )}
    </div>
  );
}





