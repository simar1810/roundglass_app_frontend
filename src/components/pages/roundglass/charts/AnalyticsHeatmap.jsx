"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMetricName } from "@/lib/utils/roundglassAnalytics";
import { cn } from "@/lib/utils";

/**
 * Transform Chart.js format to heatmap format
 * @param {Object} graphData - Graph data in Chart.js format { categories: [], metrics: [], values: [[]] }
 * @returns {Object} Transformed data for heatmap
 */
function transformHeatmapData(graphData) {
  if (!graphData || !graphData.categories || !graphData.metrics || !graphData.values) {
    return { categories: [], metrics: [], values: [] };
  }

  return {
    categories: graphData.categories,
    metrics: graphData.metrics,
    values: graphData.values,
  };
}

/**
 * Get color intensity based on value
 * @param {number} value - Value to colorize
 * @param {number} min - Minimum value in dataset
 * @param {number} max - Maximum value in dataset
 * @returns {string} CSS color class
 */
function getHeatmapColor(value, min, max) {
  if (value === null || value === undefined || isNaN(value)) {
    return "bg-gray-100";
  }

  const range = max - min;
  if (range === 0) return "bg-blue-300";

  const normalized = (value - min) / range;

  // Color scale: blue (low) -> green (medium) -> red (high)
  if (normalized < 0.33) {
    return "bg-blue-300";
  } else if (normalized < 0.66) {
    return "bg-green-300";
  } else {
    return "bg-red-300";
  }
}

/**
 * Analytics Heatmap Component
 * @param {Object} props
 * @param {Object} props.graphData - Graph data from API
 * @param {string} props.title - Chart title
 * @param {string} props.description - Chart description
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showExport - Show export button
 * @param {Function} props.onExport - Export callback function
 */
export default function AnalyticsHeatmap({
  graphData,
  title = "Heatmap",
  description = "",
  className = "",
  showExport = false,
  onExport,
}) {
  // Transform data
  const heatmapData = useMemo(() => {
    if (!graphData) return { categories: [], metrics: [], values: [] };
    return transformHeatmapData(graphData);
  }, [graphData]);

  // Calculate min/max for color scaling
  const { min, max } = useMemo(() => {
    if (!heatmapData.values || heatmapData.values.length === 0) {
      return { min: 0, max: 0 };
    }

    const allValues = heatmapData.values.flat();
    const numericValues = allValues.filter((v) => typeof v === "number" && !isNaN(v));
    
    if (numericValues.length === 0) {
      return { min: 0, max: 0 };
    }

    return {
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
    };
  }, [heatmapData]);

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport(heatmapData, title);
    } else {
      // Default CSV export
      const headers = ["Category", ...heatmapData.metrics.map(formatMetricName)];
      const rows = heatmapData.categories.map((category, catIndex) => {
        const values = [category];
        heatmapData.values[catIndex]?.forEach((value) => {
          values.push(value ?? "");
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

  if (!graphData || heatmapData.categories.length === 0 || heatmapData.metrics.length === 0) {
    return (
      <div className={`flex items-center justify-center h-80 text-muted-foreground ${className}`}>
        <p>No data available for heatmap</p>
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
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 text-left bg-gray-50 font-semibold">
                  Category / Metric
                </th>
                {heatmapData.metrics.map((metric) => (
                  <th
                    key={metric}
                    className="border border-gray-300 p-2 text-center bg-gray-50 font-semibold"
                  >
                    {formatMetricName(metric)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.categories.map((category, catIndex) => (
                <tr key={category}>
                  <td className="border border-gray-300 p-2 font-medium bg-gray-50">
                    {category}
                  </td>
                  {heatmapData.metrics.map((metric, metricIndex) => {
                    const value = heatmapData.values[catIndex]?.[metricIndex];
                    return (
                      <td
                        key={`${category}-${metric}`}
                        className={cn(
                          "border border-gray-300 p-3 text-center transition-colors",
                          getHeatmapColor(value, min, max)
                        )}
                        title={`${category} - ${formatMetricName(metric)}: ${value ?? "N/A"}`}
                      >
                        {value !== null && value !== undefined ? value.toFixed(2) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-300 border border-gray-300"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-300 border border-gray-300"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-300 border border-gray-300"></div>
          <span>High</span>
        </div>
        <span className="text-muted-foreground ml-4">
          Range: {min.toFixed(2)} - {max.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

