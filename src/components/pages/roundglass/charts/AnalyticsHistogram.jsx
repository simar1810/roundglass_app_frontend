"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMetricName } from "@/lib/utils/roundglassAnalytics";

/**
 * Transform histogram data
 * @param {Object} graphData - Graph data { bins: [], frequencies: [] } or { labels: [], data: [] }
 * @returns {Array} Transformed data for Recharts
 */
function transformHistogramData(graphData) {
  if (!graphData) return [];

  // Handle different formats
  if (graphData.bins && graphData.frequencies) {
    return graphData.bins.map((bin, index) => ({
      bin: Array.isArray(bin) ? `${bin[0]}-${bin[1]}` : String(bin),
      frequency: graphData.frequencies[index] || 0,
    }));
  }

  if (graphData.labels && graphData.data) {
    return graphData.labels.map((label, index) => ({
      bin: String(label),
      frequency: graphData.data[index] || 0,
    }));
  }

  return [];
}

/**
 * Analytics Histogram Component
 * @param {Object} props
 * @param {Object} props.graphData - Graph data from API
 * @param {string} props.title - Chart title
 * @param {string} props.description - Chart description
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showExport - Show export button
 * @param {Function} props.onExport - Export callback function
 */
export default function AnalyticsHistogram({
  graphData,
  title = "Histogram",
  description = "",
  className = "",
  showExport = false,
  onExport,
}) {
  // Transform data
  const chartData = useMemo(() => {
    if (!graphData) return [];
    return transformHistogramData(graphData);
  }, [graphData]);

  // Chart config
  const chartConfig = useMemo(() => {
    return {
      frequency: {
        label: "Frequency",
        color: "hsl(var(--chart-1))",
      },
    };
  }, []);

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport(chartData, title);
    } else {
      // Default CSV export
      const headers = ["Bin", "Frequency"];
      const rows = chartData.map((row) => [row.bin, row.frequency].join(","));

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!graphData || chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-80 text-muted-foreground ${className}`}>
        <p>No data available for histogram</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {showExport && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </div>
      <ChartContainer config={chartConfig} className="h-80">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="bin"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} label={{ value: "Frequency", angle: -90, position: "insideLeft" }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar
            dataKey="frequency"
            fill="var(--chart-1)"
            name="Frequency"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

