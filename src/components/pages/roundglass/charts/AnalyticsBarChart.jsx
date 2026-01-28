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
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMetricName } from "@/lib/utils/roundglassAnalytics";

/**
 * Transform Chart.js format to Recharts format for bar charts
 * @param {Object} graphData - Graph data in Chart.js format { labels: [], datasets: [] }
 * @returns {Array} Transformed data for Recharts
 */
function transformBarChartData(graphData) {
  if (!graphData || !graphData.labels || !graphData.datasets) {
    return [];
  }

  const { labels, datasets } = graphData;

  // Transform to Recharts format: [{ name: "Label", dataset1: value1, dataset2: value2, ... }]
  return labels.map((label, index) => {
    const dataPoint = { name: label };
    datasets.forEach((dataset) => {
      dataPoint[dataset.label || "value"] = dataset.data[index];
    });
    return dataPoint;
  });
}

/**
 * Analytics Bar Chart Component
 * @param {Object} props
 * @param {Object} props.graphData - Graph data from API (Chart.js format)
 * @param {string} props.title - Chart title
 * @param {string} props.description - Chart description
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showExport - Show export button
 * @param {Function} props.onExport - Export callback function
 */
export default function AnalyticsBarChart({
  graphData,
  title = "Bar Chart",
  description = "",
  className = "",
  showExport = false,
  onExport,
}) {
  // Transform data from Chart.js format to Recharts format
  const chartData = useMemo(() => {
    if (!graphData) return [];
    return transformBarChartData(graphData);
  }, [graphData]);

  // Get dataset labels for chart config
  const datasetLabels = useMemo(() => {
    if (!graphData?.datasets) return {};
    const config = {};
    graphData.datasets.forEach((dataset, index) => {
      const label = dataset.label || `Dataset ${index + 1}`;
      config[label] = {
        label: formatMetricName(label),
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
  }, [graphData]);

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport(chartData, title);
    } else {
      // Default CSV export
      const headers = ["Name", ...Object.keys(datasetLabels)];
      const rows = chartData.map((row) => {
        const values = [row.name];
        Object.keys(datasetLabels).forEach((key) => {
          values.push(row[key] ?? "");
        });
        return values.join(",");
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
        <p>No data available for bar chart</p>
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
      <ChartContainer config={datasetLabels} className="h-80">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          {Object.keys(datasetLabels).map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`var(--chart-${(index % 5) + 1})`}
              name={formatMetricName(key)}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}

