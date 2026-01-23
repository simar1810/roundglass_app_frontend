"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Transform Chart.js format to Recharts format for scatter plots
 * @param {Object} graphData - Graph data in Chart.js format { datasets: [{ label, data: [[x,y]], correlation }] }
 * @returns {Array} Transformed data for Recharts
 */
function transformScatterChartData(graphData) {
  if (!graphData || !graphData.datasets) {
    return [];
  }

  // Transform to Recharts format: [{ x: value, y: value, label: "dataset label" }]
  const transformedData = [];
  graphData.datasets.forEach((dataset) => {
    const points = dataset.data.map((point) => {
      // Handle both [x, y] and {x, y} formats
      if (Array.isArray(point)) {
        return {
          x: point[0],
          y: point[1],
          label: dataset.label || "Data",
          correlation: dataset.correlation,
        };
      } else {
        return {
          x: point.x,
          y: point.y,
          label: dataset.label || "Data",
          correlation: dataset.correlation,
        };
      }
    });
    transformedData.push({
      name: dataset.label || "Dataset",
      data: points,
      correlation: dataset.correlation,
    });
  });

  return transformedData;
}

/**
 * Analytics Scatter Chart Component
 * @param {Object} props
 * @param {Object} props.graphData - Graph data from API (Chart.js format)
 * @param {string} props.title - Chart title
 * @param {string} props.description - Chart description
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showExport - Show export button
 * @param {Function} props.onExport - Export callback function
 * @param {string} props.xAxisLabel - X-axis label
 * @param {string} props.yAxisLabel - Y-axis label
 */
export default function AnalyticsScatterChart({
  graphData,
  title = "Scatter Plot",
  description = "",
  className = "",
  showExport = false,
  onExport,
  xAxisLabel = "X",
  yAxisLabel = "Y",
}) {
  // Transform data from Chart.js format to Recharts format
  const chartData = useMemo(() => {
    if (!graphData) return [];
    return transformScatterChartData(graphData);
  }, [graphData]);

  // Get dataset config
  const datasetConfig = useMemo(() => {
    if (!chartData || chartData.length === 0) return {};
    const config = {};
    chartData.forEach((dataset, index) => {
      config[dataset.name] = {
        label: dataset.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
  }, [chartData]);

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport(chartData, title);
    } else {
      // Default CSV export
      const headers = ["Dataset", "X", "Y", "Correlation"];
      const rows = [];
      chartData.forEach((dataset) => {
        dataset.data.forEach((point) => {
          rows.push([
            dataset.name,
            point.x,
            point.y,
            dataset.correlation || "",
          ].join(","));
        });
      });

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
        <p>No data available for scatter plot</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {chartData[0]?.correlation !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              Correlation: {chartData[0].correlation?.toFixed(2) || "N/A"}
            </p>
          )}
        </div>
        {showExport && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </div>
      <ChartContainer config={datasetConfig} className="h-80">
        <ScatterChart
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            dataKey="x"
            name={xAxisLabel}
            tick={{ fontSize: 12 }}
            label={{ value: xAxisLabel, position: "insideBottom", offset: -5 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yAxisLabel}
            tick={{ fontSize: 12 }}
            label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }}
          />
          <ChartTooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={<ChartTooltipContent />}
          />
          <Legend />
          {chartData.map((dataset, index) => (
            <Scatter
              key={dataset.name}
              name={dataset.name}
              data={dataset.data}
              fill={`var(--chart-${(index % 5) + 1})`}
            />
          ))}
        </ScatterChart>
      </ChartContainer>
    </div>
  );
}

