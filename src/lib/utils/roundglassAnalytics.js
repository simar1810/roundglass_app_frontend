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

