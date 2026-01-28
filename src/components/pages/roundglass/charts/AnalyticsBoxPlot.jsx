"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMetricName } from "@/lib/utils/roundglassAnalytics";

/**
 * Transform box plot data
 * @param {Object} graphData - Graph data { label, min, q1, median, q3, max, mean }
 * @returns {Object} Transformed data
 */
function transformBoxPlotData(graphData) {
  if (!graphData) return null;

  return {
    label: graphData.label || "Metric",
    min: graphData.min,
    q1: graphData.q1,
    median: graphData.median,
    q3: graphData.q3,
    max: graphData.max,
    mean: graphData.mean,
  };
}

/**
 * Analytics Box Plot Component (Custom SVG implementation)
 * @param {Object} props
 * @param {Object} props.graphData - Graph data from API
 * @param {string} props.title - Chart title
 * @param {string} props.description - Chart description
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showExport - Show export button
 * @param {Function} props.onExport - Export callback function
 * @param {number} props.width - Chart width
 * @param {number} props.height - Chart height
 */
export default function AnalyticsBoxPlot({
  graphData,
  title = "Box Plot",
  description = "",
  className = "",
  showExport = false,
  onExport,
  width = 400,
  height = 300,
}) {
  // Transform data
  const boxData = useMemo(() => {
    if (!graphData) return null;
    return transformBoxPlotData(graphData);
  }, [graphData]);

  // Calculate plot dimensions
  const plotData = useMemo(() => {
    if (!boxData) return null;

    const padding = 60;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    const range = boxData.max - boxData.min;
    const scale = range > 0 ? plotHeight / range : 1;

    const yMin = boxData.min;
    const yMax = boxData.max;

    return {
      padding,
      plotWidth,
      plotHeight,
      scale,
      yMin,
      yMax,
      range,
    };
  }, [boxData, width, height]);

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport(boxData, title);
    } else {
      // Default CSV export
      const headers = ["Statistic", "Value"];
      const rows = [
        ["Label", boxData.label],
        ["Min", boxData.min],
        ["Q1", boxData.q1],
        ["Median", boxData.median],
        ["Q3", boxData.q3],
        ["Max", boxData.max],
        ["Mean", boxData.mean],
      ];

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");
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

  if (!graphData || !boxData || !plotData) {
    return (
      <div className={`flex items-center justify-center h-80 text-muted-foreground ${className}`}>
        <p>No data available for box plot</p>
      </div>
    );
  }

  // Calculate Y positions (inverted because SVG Y increases downward)
  const yPos = (value) => {
    return (
      plotData.padding +
      plotData.plotHeight -
      (value - plotData.yMin) * plotData.scale
    );
  };

  const xCenter = width / 2;
  const boxWidth = 60;
  const whiskerWidth = 80;

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
      <div className="bg-white border rounded-lg p-4">
        <svg width={width} height={height} className="overflow-visible">
          {/* Y-axis */}
          <line
            x1={plotData.padding}
            y1={plotData.padding}
            x2={plotData.padding}
            y2={height - plotData.padding}
            stroke="#000"
            strokeWidth="2"
          />

          {/* Y-axis labels */}
          <text
            x={plotData.padding - 10}
            y={plotData.padding}
            textAnchor="end"
            fontSize="12"
            fill="#666"
          >
            {boxData.max.toFixed(2)}
          </text>
          <text
            x={plotData.padding - 10}
            y={height - plotData.padding}
            textAnchor="end"
            fontSize="12"
            fill="#666"
          >
            {boxData.min.toFixed(2)}
          </text>
          <text
            x={plotData.padding - 10}
            y={yPos(boxData.median)}
            textAnchor="end"
            fontSize="12"
            fill="#666"
          >
            {boxData.median.toFixed(2)}
          </text>

          {/* Whiskers (min to max) */}
          <line
            x1={xCenter - whiskerWidth / 2}
            y1={yPos(boxData.min)}
            x2={xCenter + whiskerWidth / 2}
            y2={yPos(boxData.min)}
            stroke="#000"
            strokeWidth="2"
          />
          <line
            x1={xCenter}
            y1={yPos(boxData.min)}
            x2={xCenter}
            y2={yPos(boxData.q1)}
            stroke="#000"
            strokeWidth="2"
          />
          <line
            x1={xCenter - whiskerWidth / 2}
            y1={yPos(boxData.max)}
            x2={xCenter + whiskerWidth / 2}
            y2={yPos(boxData.max)}
            stroke="#000"
            strokeWidth="2"
          />
          <line
            x1={xCenter}
            y1={yPos(boxData.q3)}
            x2={xCenter}
            y2={yPos(boxData.max)}
            stroke="#000"
            strokeWidth="2"
          />

          {/* Box (Q1 to Q3) */}
          <rect
            x={xCenter - boxWidth / 2}
            y={yPos(boxData.q3)}
            width={boxWidth}
            height={yPos(boxData.q1) - yPos(boxData.q3)}
            fill="#4A90E2"
            fillOpacity="0.3"
            stroke="#4A90E2"
            strokeWidth="2"
          />

          {/* Median line */}
          <line
            x1={xCenter - boxWidth / 2}
            y1={yPos(boxData.median)}
            x2={xCenter + boxWidth / 2}
            y2={yPos(boxData.median)}
            stroke="#000"
            strokeWidth="2"
          />

          {/* Mean marker */}
          <circle
            cx={xCenter}
            cy={yPos(boxData.mean)}
            r="4"
            fill="#FF6B6B"
            stroke="#000"
            strokeWidth="1"
          />

          {/* Label */}
          <text
            x={xCenter}
            y={height - plotData.padding + 30}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="#333"
          >
            {formatMetricName(boxData.label)}
          </text>
        </svg>

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Min:</span>{" "}
            <span className="font-semibold">{boxData.min.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Q1:</span>{" "}
            <span className="font-semibold">{boxData.q1.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Median:</span>{" "}
            <span className="font-semibold">{boxData.median.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Q3:</span>{" "}
            <span className="font-semibold">{boxData.q3.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Max:</span>{" "}
            <span className="font-semibold">{boxData.max.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Mean:</span>{" "}
            <span className="font-semibold text-red-600">{boxData.mean.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

