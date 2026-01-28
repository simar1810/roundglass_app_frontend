import { format, parseISO, isValid } from "date-fns";

/**
 * Roundglass Analytics utility functions for calculations, formatting, and data transformation
 */

/**
 * Format percentile value to readable string
 * @param {number} percentile - Percentile value (0-100)
 * @returns {string} Formatted percentile string (e.g., "75th percentile")
 */
export function formatPercentile(percentile) {
  if (percentile === null || percentile === undefined || isNaN(percentile)) {
    return "—";
  }

  const rounded = Math.round(percentile);
  
  // Handle special cases for ordinal suffixes
  const lastDigit = rounded % 10;
  const lastTwoDigits = rounded % 100;
  
  let suffix = "th";
  if (lastTwoDigits < 10 || lastTwoDigits > 20) {
    if (lastDigit === 1) suffix = "st";
    else if (lastDigit === 2) suffix = "nd";
    else if (lastDigit === 3) suffix = "rd";
  }
  
  return `${rounded}${suffix} percentile`;
}

/**
 * Get color based on percentile value
 * @param {number} percentile - Percentile value (0-100)
 * @returns {string} Color name: "green" (high), "yellow" (medium), "red" (low)
 */
export function getPercentileColor(percentile) {
  if (percentile === null || percentile === undefined || isNaN(percentile)) {
    return "gray";
  }

  // High percentile (75-100) = green
  if (percentile >= 75) {
    return "green";
  }
  
  // Medium percentile (25-74) = yellow
  if (percentile >= 25) {
    return "yellow";
  }
  
  // Low percentile (0-24) = red
  return "red";
}

/**
 * Format correlation value with interpretation
 * @param {number} correlation - Correlation coefficient (-1 to 1)
 * @returns {string} Formatted correlation string with interpretation
 */
export function formatCorrelation(correlation) {
  if (correlation === null || correlation === undefined || isNaN(correlation)) {
    return "—";
  }

  const rounded = Math.round(correlation * 100) / 100;
  const strength = getCorrelationStrength(correlation);
  
  return `${rounded} (${strength})`;
}

/**
 * Determine correlation strength
 * @param {number} correlation - Correlation coefficient (-1 to 1)
 * @returns {string} Strength: "strong", "moderate", "weak", or "none"
 */
export function getCorrelationStrength(correlation) {
  if (correlation === null || correlation === undefined || isNaN(correlation)) {
    return "none";
  }

  const absCorrelation = Math.abs(correlation);
  
  // Strong correlation: |r| >= 0.7
  if (absCorrelation >= 0.7) {
    return "strong";
  }
  
  // Moderate correlation: 0.3 <= |r| < 0.7
  if (absCorrelation >= 0.3) {
    return "moderate";
  }
  
  // Weak correlation: 0.1 <= |r| < 0.3
  if (absCorrelation >= 0.1) {
    return "weak";
  }
  
  // No correlation: |r| < 0.1
  return "none";
}

/**
 * Format metric key to readable name
 * @param {string} metric - Metric key (e.g., "bmi", "muscle", "fat")
 * @returns {string} Formatted metric name (e.g., "BMI", "Muscle", "Fat")
 */
export function formatMetricName(metric) {
  if (!metric) return "";

  // Handle common abbreviations
  const metricMap = {
    bmi: "BMI",
    rm: "Resting Metabolic Rate",
    bodyAge: "Body Age",
    ideal_weight: "Ideal Weight",
    visceral_fat: "Visceral Fat",
    sub_fat: "Subcutaneous Fat",
    shoulder_distance: "Shoulder Distance",
  };

  // Check if metric exists in map
  if (metricMap[metric]) {
    return metricMap[metric];
  }

  // Capitalize first letter and replace underscores with spaces
  return metric
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Transform API graphData to chart library format
 * @param {Object} graphData - Graph data from API
 * @param {string} chartType - Chart type: "barChart", "lineChart", "radarChart", "scatterPlot", "heatmap", "boxPlot", "histogram"
 * @returns {Object} Transformed data for chart library
 */
export function transformGraphData(graphData, chartType) {
  if (!graphData || !chartType) {
    return null;
  }

  // Return the graphData as-is if it's already in the correct format
  // Different chart libraries may need different transformations
  // This is a base implementation that can be extended
  
  switch (chartType) {
    case "barChart":
      return graphData.barChart || graphData;
    
    case "lineChart":
    case "multiLineChart":
      return graphData.lineChart || graphData.multiLineChart || graphData;
    
    case "radarChart":
      return graphData.radarChart || graphData;
    
    case "scatterPlot":
      return graphData.scatterPlot || graphData;
    
    case "heatmap":
    case "correlationHeatmap":
      return graphData.heatmap || graphData.correlationHeatmap || graphData;
    
    case "boxPlot":
      return graphData.boxPlot || graphData;
    
    case "histogram":
      return graphData.histogram || graphData;
    
    default:
      return graphData;
  }
}

/**
 * Determine trend direction from trends data
 * @param {Object} trends - Trends object with direction, rate, correlation
 * @returns {Object} Trend information with direction, rate, and interpretation
 */
export function calculateTrendDirection(trends) {
  if (!trends) {
    return {
      direction: "unknown",
      rate: 0,
      interpretation: "No trend data available",
    };
  }

  const direction = trends.direction || "stable";
  const rate = trends.rate || 0;
  const correlation = trends.correlation || 0;

  let interpretation = "";
  
  if (direction === "increasing") {
    interpretation = `Increasing trend (rate: ${rate > 0 ? "+" : ""}${rate.toFixed(2)} per period)`;
  } else if (direction === "decreasing") {
    interpretation = `Decreasing trend (rate: ${rate.toFixed(2)} per period)`;
  } else {
    interpretation = "Stable trend (no significant change)";
  }

  // Add correlation strength
  if (Math.abs(correlation) >= 0.7) {
    interpretation += " - Strong correlation";
  } else if (Math.abs(correlation) >= 0.3) {
    interpretation += " - Moderate correlation";
  }

  return {
    direction,
    rate,
    correlation,
    interpretation,
  };
}

/**
 * Format date range for display
 * @param {string|Date} startDate - Start date (YYYY-MM-DD or Date object)
 * @param {string|Date} endDate - End date (YYYY-MM-DD or Date object)
 * @param {string} [formatString="MMM dd, yyyy"] - Date format string
 * @returns {string} Formatted date range string
 */
export function formatDateRange(startDate, endDate, formatString = "MMM dd, yyyy") {
  if (!startDate || !endDate) {
    return "—";
  }

  try {
    let start, end;

    // Parse dates
    if (typeof startDate === "string") {
      // Try ISO format first, then YYYY-MM-DD
      if (startDate.includes("T")) {
        start = parseISO(startDate);
      } else {
        start = parseISO(startDate + "T00:00:00");
      }
    } else {
      start = startDate;
    }

    if (typeof endDate === "string") {
      if (endDate.includes("T")) {
        end = parseISO(endDate);
      } else {
        end = parseISO(endDate + "T00:00:00");
      }
    } else {
      end = endDate;
    }

    // Validate dates
    if (!isValid(start) || !isValid(end)) {
      return "—";
    }

    // Format dates
    const formattedStart = format(start, formatString);
    const formattedEnd = format(end, formatString);

    // If same date, return single date
    if (formattedStart === formattedEnd) {
      return formattedStart;
    }

    return `${formattedStart} - ${formattedEnd}`;
  } catch (error) {
    console.error("Error formatting date range:", error);
    return "—";
  }
}

/**
 * Normalize metric values for display
 * @param {number} value - Metric value
 * @param {string} metric - Metric name/key
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted metric value with unit if applicable
 */
export function normalizeMetricValue(value, metric, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }

  // Round to specified decimal places
  const rounded = Number(value.toFixed(decimals));

  // Add units for specific metrics
  const unitMap = {
    weight: " kg",
    height: " cm",
    bmi: "",
    muscle: "%",
    fat: "%",
    visceral_fat: "",
    sub_fat: "%",
    rm: " kcal",
    bodyAge: " years",
    ideal_weight: " kg",
    chest: " cm",
    arm: " cm",
    abdomen: " cm",
    waist: " cm",
    hip: " cm",
    thighs: " cm",
    shoulder_distance: " cm",
  };

  const unit = unitMap[metric] || "";
  
  return `${rounded}${unit}`;
}

/**
 * Group clients by category for display
 * @param {Array} clients - Array of client objects
 * @param {Array} categories - Array of category objects
 * @returns {Object} Object with category names as keys and client arrays as values
 */
export function groupClientsByCategory(clients, categories) {
  if (!clients || !Array.isArray(clients)) {
    return {};
  }

  if (!categories || !Array.isArray(categories)) {
    return {};
  }

  // Create a map of category IDs to category names
  const categoryMap = {};
  categories.forEach((cat) => {
    if (cat._id) {
      categoryMap[cat._id] = cat.name || cat.title || "Unknown Category";
    }
  });

  // Group clients by category
  const grouped = {};

  clients.forEach((client) => {
    // Check if client has categories array
    if (client.categories && Array.isArray(client.categories)) {
      client.categories.forEach((categoryId) => {
        const categoryName = categoryMap[categoryId] || "Uncategorized";
        
        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }
        
        // Avoid duplicates
        if (!grouped[categoryName].find((c) => c._id === client._id)) {
          grouped[categoryName].push(client);
        }
      });
    } else {
      // If client has no categories, add to "Uncategorized"
      if (!grouped["Uncategorized"]) {
        grouped["Uncategorized"] = [];
      }
      
      if (!grouped["Uncategorized"].find((c) => c._id === client._id)) {
        grouped["Uncategorized"].push(client);
      }
    }
  });

  return grouped;
}

/**
 * Get color variant for correlation value (for heatmaps)
 * @param {number} correlation - Correlation coefficient (-1 to 1)
 * @returns {string} Color name: "red" (negative), "blue" (positive), "gray" (neutral)
 */
export function getCorrelationColor(correlation) {
  if (correlation === null || correlation === undefined || isNaN(correlation)) {
    return "gray";
  }

  if (correlation < 0) {
    return "red"; // Negative correlation
  } else if (correlation > 0) {
    return "blue"; // Positive correlation
  } else {
    return "gray"; // No correlation
  }
}

/**
 * Format rank display (e.g., "15 out of 60")
 * @param {number} rank - Rank position (1-based)
 * @param {number} total - Total number of items
 * @returns {string} Formatted rank string
 */
export function formatRank(rank, total) {
  if (rank === null || rank === undefined || isNaN(rank)) {
    return "—";
  }

  if (total === null || total === undefined || isNaN(total)) {
    return `#${rank}`;
  }

  return `#${rank} of ${total}`;
}

/**
 * Calculate percentage from count and total
 * @param {number} count - Count value
 * @param {number} total - Total value
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function calculatePercentage(count, total, decimals = 1) {
  if (!total || total === 0) {
    return "0%";
  }

  if (count === null || count === undefined || isNaN(count)) {
    return "0%";
  }

  const percentage = (count / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Get trend icon name based on direction
 * @param {string} direction - Trend direction: "increasing", "decreasing", "stable"
 * @returns {string} Icon name or emoji
 */
export function getTrendIcon(direction) {
  switch (direction) {
    case "increasing":
      return "↑"; // or "TrendingUp" for lucide-react
    case "decreasing":
      return "↓"; // or "TrendingDown" for lucide-react
    case "stable":
      return "→"; // or "Minus" for lucide-react
    default:
      return "—";
  }
}

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Filename for the CSV (without extension)
 * @param {Array} headers - Optional custom headers array
 * @returns {void}
 */
export function exportToCSV(data, filename = "export", headers = null) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  try {
    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);
    
    // Create CSV rows
    const rows = data.map((row) => {
      return csvHeaders.map((header) => {
        const value = row[header];
        // Handle null, undefined, and objects
        if (value === null || value === undefined) {
          return "";
        }
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
    });

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create blob with BOM for UTF-8 encoding
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });

    // Create download link
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    throw new Error("Failed to export CSV");
  }
}

/**
 * Export category comparison data to CSV
 * @param {Object} comparisonData - Category comparison data from API
 * @param {string} filename - Optional filename prefix
 * @returns {void}
 */
export function exportComparisonToCSV(comparisonData, filename = "category-comparison") {
  if (!comparisonData) {
    console.warn("No comparison data to export");
    return;
  }

  try {
    const data = [];
    const { comparison, statistics, clientTable } = comparisonData;

    // Add summary information
    if (comparison) {
      data.push({ Type: "Summary", Field: "Total Clients", Value: comparison.totalClients || 0 });
      data.push({ Type: "Summary", Field: "Comparison Type", Value: comparison.type || "N/A" });
    }

    // Add statistics
    if (statistics) {
      Object.entries(statistics).forEach(([metric, stats]) => {
        data.push({
          Type: "Statistics",
          Metric: formatMetricName(metric),
          Mean: stats.mean?.toFixed(2) || "—",
          Median: stats.median?.toFixed(2) || "—",
          Min: stats.min?.toFixed(2) || "—",
          Max: stats.max?.toFixed(2) || "—",
          StdDev: stats.stdDev?.toFixed(2) || "—",
        });
      });
    }

    // Add client comparison table
    if (clientTable && Array.isArray(clientTable)) {
      clientTable.forEach((client, index) => {
        const row = {
          Type: "Client Data",
          "Client Name": client.name || "—",
          Email: client.email || "—",
        };

        // Add all metric values
        Object.keys(client).forEach((key) => {
          if (key !== "_id" && key !== "name" && key !== "email" && typeof client[key] === "number") {
            row[formatMetricName(key)] = client[key]?.toFixed(2) || "—";
          }
        });

        data.push(row);
      });
    }

    exportToCSV(data, filename);
  } catch (error) {
    console.error("Error exporting comparison to CSV:", error);
    throw new Error("Failed to export comparison data");
  }
}

/**
 * Export trends analysis data to CSV
 * @param {Object} trendsData - Trends analysis data from API
 * @param {string} filename - Optional filename prefix
 * @returns {void}
 */
export function exportTrendsToCSV(trendsData, filename = "trends-analysis") {
  if (!trendsData) {
    console.warn("No trends data to export");
    return;
  }

  try {
    const data = [];
    const { graphData, trends } = trendsData;

    // Add trend information
    if (trends && Array.isArray(trends)) {
      trends.forEach((trend) => {
        data.push({
          Type: "Trend",
          Metric: formatMetricName(trend.metric || "N/A"),
          Direction: trend.direction || "—",
          Rate: trend.rate?.toFixed(2) || "—",
          Correlation: trend.correlation?.toFixed(2) || "—",
          Interpretation: trend.interpretation || "—",
        });
      });
    }

    // Add time series data
    if (graphData?.lineChart) {
      const { labels, datasets } = graphData.lineChart;
      labels.forEach((label, index) => {
        const row = { Date: label };
        datasets.forEach((dataset) => {
          row[dataset.label || "Value"] = dataset.data[index]?.toFixed(2) || "—";
        });
        data.push(row);
      });
    }

    exportToCSV(data, filename);
  } catch (error) {
    console.error("Error exporting trends to CSV:", error);
    throw new Error("Failed to export trends data");
  }
}

/**
 * Export client rankings data to CSV
 * @param {Object} rankingsData - Client rankings data from API
 * @param {string} filename - Optional filename prefix
 * @returns {void}
 */
export function exportRankingsToCSV(rankingsData, filename = "client-rankings") {
  if (!rankingsData) {
    console.warn("No rankings data to export");
    return;
  }

  try {
    const data = [];
    const { client, rankings, graphData } = rankingsData;

    // Add client information
    if (client) {
      data.push({
        Type: "Client Info",
        Field: "Name",
        Value: client.name || "—",
      });
      data.push({
        Type: "Client Info",
        Field: "Email",
        Value: client.email || "—",
      });
    }

    // Add rankings table
    if (rankings && Array.isArray(rankings)) {
      rankings.forEach((ranking) => {
        data.push({
          Type: "Ranking",
          Metric: formatMetricName(ranking.metric || "N/A"),
          Value: ranking.value?.toFixed(2) || "—",
          Percentile: ranking.percentile?.toFixed(1) || "—",
          Rank: formatRank(ranking.rank, ranking.total),
          Total: ranking.total || "—",
          Interpretation: ranking.interpretation || "—",
        });
      });
    }

    // Add radar chart data if available
    if (graphData?.radarChart) {
      const { labels, datasets } = graphData.radarChart;
      labels.forEach((label, index) => {
        datasets.forEach((dataset) => {
          data.push({
            Type: "Radar Data",
            Metric: label,
            Percentile: dataset.data[index]?.toFixed(1) || "—",
          });
        });
      });
    }

    exportToCSV(data, filename);
  } catch (error) {
    console.error("Error exporting rankings to CSV:", error);
    throw new Error("Failed to export rankings data");
  }
}

/**
 * Export correlations analysis data to CSV
 * @param {Object} correlationsData - Correlations analysis data from API
 * @param {string} filename - Optional filename prefix
 * @returns {void}
 */
export function exportCorrelationsToCSV(correlationsData, filename = "correlations-analysis") {
  if (!correlationsData) {
    console.warn("No correlations data to export");
    return;
  }

  try {
    const data = [];
    const { correlations, graphData } = correlationsData;

    // Add correlation pairs
    if (correlations && Array.isArray(correlations)) {
      correlations.forEach((correlation) => {
        data.push({
          Metric1: formatMetricName(correlation.metric1 || "N/A"),
          Metric2: formatMetricName(correlation.metric2 || "N/A"),
          Correlation: correlation.correlation?.toFixed(3) || "—",
          Strength: getCorrelationStrength(correlation.correlation),
          Interpretation: correlation.interpretation || "—",
        });
      });
    }

    // Add heatmap data if available
    if (graphData?.heatmap) {
      const { categories, metrics, values } = graphData.heatmap;
      categories.forEach((category, catIndex) => {
        metrics.forEach((metric, metricIndex) => {
          data.push({
            Type: "Heatmap",
            Category: category,
            Metric: formatMetricName(metric),
            Value: values[catIndex]?.[metricIndex]?.toFixed(2) || "—",
          });
        });
      });
    }

    // Add scatter plot data if available
    if (graphData?.scatterPlot) {
      graphData.scatterPlot.datasets?.forEach((dataset) => {
        dataset.data?.forEach((point) => {
          const [x, y] = Array.isArray(point) ? point : [point.x, point.y];
          data.push({
            Type: "Scatter Plot",
            Dataset: dataset.label || "Data",
            X: x?.toFixed(2) || "—",
            Y: y?.toFixed(2) || "—",
            Correlation: dataset.correlation?.toFixed(3) || "—",
          });
        });
      });
    }

    exportToCSV(data, filename);
  } catch (error) {
    console.error("Error exporting correlations to CSV:", error);
    throw new Error("Failed to export correlations data");
  }
}

/**
 * Export distribution analysis data to CSV
 * @param {Object} distributionData - Distribution analysis data from API
 * @param {string} filename - Optional filename prefix
 * @returns {void}
 */
export function exportDistributionToCSV(distributionData, filename = "distribution-analysis") {
  if (!distributionData) {
    console.warn("No distribution data to export");
    return;
  }

  try {
    const data = [];
    const { statistics, graphData } = distributionData;

    // Add statistics
    if (statistics) {
      data.push({
        Type: "Statistics",
        Field: "Mean",
        Value: statistics.mean?.toFixed(2) || "—",
      });
      data.push({
        Type: "Statistics",
        Field: "Median",
        Value: statistics.median?.toFixed(2) || "—",
      });
      data.push({
        Type: "Statistics",
        Field: "Min",
        Value: statistics.min?.toFixed(2) || "—",
      });
      data.push({
        Type: "Statistics",
        Field: "Max",
        Value: statistics.max?.toFixed(2) || "—",
      });
      data.push({
        Type: "Statistics",
        Field: "StdDev",
        Value: statistics.stdDev?.toFixed(2) || "—",
      });
      data.push({
        Type: "Statistics",
        Field: "Q1",
        Value: statistics.q1?.toFixed(2) || "—",
      });
      data.push({
        Type: "Statistics",
        Field: "Q3",
        Value: statistics.q3?.toFixed(2) || "—",
      });
    }

    // Add box plot data
    if (graphData?.boxPlot) {
      const boxPlot = graphData.boxPlot;
      data.push({
        Type: "Box Plot",
        Field: "Min",
        Value: boxPlot.min?.toFixed(2) || "—",
      });
      data.push({
        Type: "Box Plot",
        Field: "Q1",
        Value: boxPlot.q1?.toFixed(2) || "—",
      });
      data.push({
        Type: "Box Plot",
        Field: "Median",
        Value: boxPlot.median?.toFixed(2) || "—",
      });
      data.push({
        Type: "Box Plot",
        Field: "Q3",
        Value: boxPlot.q3?.toFixed(2) || "—",
      });
      data.push({
        Type: "Box Plot",
        Field: "Max",
        Value: boxPlot.max?.toFixed(2) || "—",
      });
      data.push({
        Type: "Box Plot",
        Field: "Mean",
        Value: boxPlot.mean?.toFixed(2) || "—",
      });
    }

    // Add histogram data if available
    if (graphData?.histogram) {
      const { bins, frequencies } = graphData.histogram;
      bins.forEach((bin, index) => {
        const binLabel = Array.isArray(bin) ? `${bin[0]}-${bin[1]}` : String(bin);
        data.push({
          Type: "Histogram",
          Bin: binLabel,
          Frequency: frequencies?.[index] || 0,
        });
      });
    }

    exportToCSV(data, filename);
  } catch (error) {
    console.error("Error exporting distribution to CSV:", error);
    throw new Error("Failed to export distribution data");
  }
}

/**
 * Export preferences analysis data to CSV
 * @param {Object} preferencesData - Preferences analysis data from API
 * @param {string} filename - Optional filename prefix
 * @returns {void}
 */
export function exportPreferencesToCSV(preferencesData, filename = "preferences-analysis") {
  if (!preferencesData) {
    console.warn("No preferences data to export");
    return;
  }

  try {
    const data = [];
    const { training, supplements, injuries } = preferencesData;

    // Export training preferences
    if (training && Array.isArray(training)) {
      training.forEach((item) => {
        data.push({
          Section: "Training",
          Type: item.type || "—",
          Count: item.count || 0,
          Percentage: item.percentage?.toFixed(1) + "%" || "—",
          Description: item.description || "—",
        });
      });
    }

    // Export supplements preferences
    if (supplements && Array.isArray(supplements)) {
      supplements.forEach((item) => {
        data.push({
          Section: "Supplements",
          Name: item.name || "—",
          Count: item.count || 0,
          Percentage: item.percentage?.toFixed(1) + "%" || "—",
          Description: item.description || "—",
        });
      });
    }

    // Export injuries data
    if (injuries && Array.isArray(injuries)) {
      injuries.forEach((item) => {
        data.push({
          Section: "Injuries",
          Type: item.type || "—",
          Location: item.location || "—",
          Count: item.count || 0,
          Percentage: item.percentage?.toFixed(1) + "%" || "—",
          Description: item.description || "—",
        });
      });
    }

    exportToCSV(data, filename);
  } catch (error) {
    console.error("Error exporting preferences to CSV:", error);
    throw new Error("Failed to export preferences data");
  }
}

