/**
 * Growth utility functions for calculations and formatting
 */

/**
 * Calculate percentage of clients below P50 standard
 * @param {number} above - Number of clients above P50
 * @param {number} below - Number of clients below P50
 * @returns {number} Percentage below P50 (0-100)
 */
export function calculatePercentageBelow(above, below) {
  const total = above + below;
  if (total === 0) return 0;
  return Math.round((below / total) * 100);
}

/**
 * Format age group bucket to readable format
 * @param {string} bucket - Age group bucket (e.g., "U14", "U16")
 * @returns {string} Formatted age group (e.g., "Under 14", "Under 16")
 */
export function formatAgeGroup(bucket) {
  if (!bucket) return "";
  
  // Handle "U14", "U16" format
  if (bucket.startsWith("U")) {
    const age = bucket.substring(1);
    return `Under ${age}`;
  }
  
  // Handle other formats if needed
  return bucket;
}

/**
 * Get color class for score badge
 * @param {number} score - Score value (0 or 1)
 * @returns {string} Color variant or class
 */
export function getScoreColor(score) {
  // Score 1 = healthy (green), Score 0 = below standard (red)
  return score === 1 ? "green" : "red";
}

/**
 * Determine if intervention is needed based on height and weight scores
 * @param {number} heightScore - Height score (0 or 1)
 * @param {number} weightScore - Weight score (0 or 1)
 * @returns {boolean} True if intervention is needed (either score is 0)
 */
export function getInterventionStatus(heightScore, weightScore) {
  // Intervention needed if either height or weight is below standard (score = 0)
  return heightScore === 0 || weightScore === 0;
}

/**
 * Format gap value with appropriate sign and unit
 * @param {number} gap - Gap value (can be positive or negative)
 * @param {string} unit - Unit of measurement (e.g., "cm", "kg")
 * @returns {string} Formatted gap string (e.g., "+2.5 cm", "-1.2 kg")
 */
export function formatGap(gap, unit = "") {
  if (gap === null || gap === undefined || isNaN(gap)) return "—";
  
  const sign = gap > 0 ? "+" : "";
  const formattedValue = Math.abs(gap).toFixed(2);
  return `${sign}${formattedValue} ${unit}`.trim();
}

/**
 * Calculate age in months from date of birth to measurement date
 * @param {string|Date} dob - Date of birth
 * @param {string|Date} measurementDate - Measurement date (defaults to today)
 * @returns {number} Age in months
 */
export function calculateAgeInMonths(dob, measurementDate = new Date()) {
  if (!dob) return 0;
  
  try {
    const birthDate = typeof dob === "string" ? new Date(dob) : dob;
    const measureDate = typeof measurementDate === "string" 
      ? new Date(measurementDate) 
      : measurementDate;
    
    if (isNaN(birthDate.getTime()) || isNaN(measureDate.getTime())) {
      return 0;
    }
    
    // Calculate difference in months
    const yearsDiff = measureDate.getFullYear() - birthDate.getFullYear();
    const monthsDiff = measureDate.getMonth() - birthDate.getMonth();
    const daysDiff = measureDate.getDate() - birthDate.getDate();
    
    // Total months
    let totalMonths = yearsDiff * 12 + monthsDiff;
    
    // Adjust if day hasn't passed yet this month
    if (daysDiff < 0) {
      totalMonths -= 1;
    }
    
    return Math.max(0, totalMonths);
  } catch (error) {
    console.error("Error calculating age in months:", error);
    return 0;
  }
}

/**
 * Calculate age in years from date of birth to measurement date
 * @param {string|Date} dob - Date of birth
 * @param {string|Date} measurementDate - Measurement date (defaults to today)
 * @returns {number} Age in years (with decimal precision)
 */
export function calculateAgeInYears(dob, measurementDate = new Date()) {
  if (!dob) return 0;
  
  try {
    const birthDate = typeof dob === "string" ? new Date(dob) : dob;
    const measureDate = typeof measurementDate === "string" 
      ? new Date(measurementDate) 
      : measurementDate;
    
    if (isNaN(birthDate.getTime()) || isNaN(measureDate.getTime())) {
      return 0;
    }
    
    // Calculate difference in years with decimal precision
    const diffTime = measureDate.getTime() - birthDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const ageInYears = diffDays / 365.25;
    
    return Math.max(0, ageInYears);
  } catch (error) {
    console.error("Error calculating age in years:", error);
    return 0;
  }
}

/**
 * Format age for display (e.g., "5 years 3 months" or "63 months")
 * @param {string|Date} dob - Date of birth
 * @param {string|Date} measurementDate - Measurement date (defaults to today)
 * @param {boolean} showMonthsOnly - If true, show only months
 * @returns {string} Formatted age string
 */
export function formatAge(dob, measurementDate = new Date(), showMonthsOnly = false) {
  if (!dob) return "—";
  
  const months = calculateAgeInMonths(dob, measurementDate);
  
  if (showMonthsOnly) {
    return `${months} months`;
  }
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) {
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
  
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? "year" : "years"}`;
  }
  
  return `${years} ${years === 1 ? "year" : "years"} ${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`;
}

/**
 * Get intervention priority level based on scores
 * @param {number} heightScore - Height score (0 or 1)
 * @param {number} weightScore - Weight score (0 or 1)
 * @returns {string} Priority level: "high", "medium", "low", or "none"
 */
export function getInterventionPriority(heightScore, weightScore) {
  // Both below standard = high priority
  if (heightScore === 0 && weightScore === 0) {
    return "high";
  }
  
  // One below standard = medium priority
  if (heightScore === 0 || weightScore === 0) {
    return "medium";
  }
  
  // Both healthy = no intervention needed
  return "none";
}

/**
 * Format score badge text
 * @param {number} score - Score value (0 or 1)
 * @returns {string} Badge text
 */
export function getScoreText(score) {
  return score === 1 ? "Healthy" : "Below Standard";
}

/**
 * Download PDF report for group analytics
 * This is a client-side function that triggers a browser download of the PDF file
 * Note: This function must be called from a client component (use "use client" directive)
 * 
 * @param {string} groupId - Group MongoDB ObjectId
 * @param {Object} [filters] - Filter options
 * @param {string} [filters.from] - Start date filter (YYYY-MM-DD)
 * @param {string} [filters.to] - End date filter (YYYY-MM-DD)
 * @param {string|string[]} [filters.ageGroup] - Age groups: "U14", "U16", "U18" (comma-separated string or array)
 * @param {string} [filters.standard="IPA"] - Standard: "IPA" or "IAP" (default: "IPA")
 * @param {string} [filename] - Optional filename for the downloaded PDF (default: "growth-report.pdf")
 * @returns {Promise<void>}
 * @throws {Error} If called from server-side or if download fails
 */
export async function downloadGroupReportPDF(groupId, filters = {}, filename = "growth-report.pdf") {
  // This function should only be called from client components
  if (typeof window === "undefined") {
    throw new Error("downloadGroupReportPDF can only be called from client components");
  }

  if (!groupId) {
    throw new Error("Group ID is required");
  }

  try {
    // Dynamically import to avoid server-side issues
    const { buildUrlWithQueryParams } = await import("../formatter");
    const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;
    const Cookies = (await import("js-cookie")).default;
    const TOKEN = Cookies.get("token");

    if (!TOKEN) {
      throw new Error("Authentication token not found. Please log in again.");
    }

    // Build query parameters
    const queryParams = {};

    if (filters.from) queryParams.from = filters.from;
    if (filters.to) queryParams.to = filters.to;
    if (filters.standard) queryParams.standard = filters.standard;

    // Handle ageGroup - can be array or comma-separated string
    if (filters.ageGroup) {
      if (Array.isArray(filters.ageGroup)) {
        queryParams.ageGroup = filters.ageGroup.join(",");
      } else {
        queryParams.ageGroup = filters.ageGroup;
      }
    }

    const endpoint = buildUrlWithQueryParams(
      `growth/groups/${groupId}/report.pdf`,
      queryParams
    );

    // Fetch PDF blob
    const response = await fetch(`${API_ENDPOINT}/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/pdf",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Failed to download PDF: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
      }
      throw new Error(errorMessage);
    }

    // Check if response is actually a PDF
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("application/pdf")) {
      throw new Error("Server response is not a PDF file");
    }

    // Create blob and download
    const blob = await response.blob();
    
    // Validate blob size (should be > 0)
    if (blob.size === 0) {
      throw new Error("Downloaded PDF file is empty");
    }

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    
    // Re-throw with more context if needed
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Failed to download PDF: ${error.message || "Unknown error"}`);
  }
}

