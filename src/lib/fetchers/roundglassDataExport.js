"use client";

/**
 * Client-side fetch function for data export via API routes
 * Uses Next.js API routes which handle authentication server-side
 * @param {string} endpoint - API route endpoint (e.g., '/api/roundglass/data-export/client')
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
async function fetchDataClient(endpoint, params = {}) {
  try {
    // Build query string from params
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 502) {
        window.location.href = "/maintenance";
        return;
      }

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/login";
        return;
      }

      // Try to get error message from response
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, get text
        const text = await response.text();
        errorMessage = text.substring(0, 200) || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Check if response is HTML (error page) instead of JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(
        `Server returned non-JSON response. Status: ${response.status}. Content-Type: ${contentType}. Response: ${text.substring(0, 100)}`
      );
    }

    const data = await response.json();

    if ([408].includes(data.status_code)) {
      window.location.href = "/login";
      return;
    }

    return data;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      // Add more context to network errors
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        throw new Error(
          `Network error: Unable to connect to the server. Please check your internet connection and try again. ${error.message}`
        );
      }
      throw error;
    }
    throw new Error("Failed to fetch data. Please try again.");
  }
}

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid format
 */
function isValidObjectId(id) {
  if (typeof id !== "string") return false;
  // MongoDB ObjectId is 24 hex characters
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Export comprehensive data for a specific client
 * Includes client information, preferences, training modules, supplements, injuries, and diet recall
 * 
 * @param {string} clientId - Client ID (MongoDB ObjectId) - required
 * @returns {Promise<Object>} API response with client data export
 * @throws {Error} If clientId is not provided or invalid
 * 
 * @example
 * const data = await exportClientData("64a1b2c3d4e5f6g7h8i9j0k1");
 */
export async function exportClientData(clientId) {
  // Validate clientId
  if (!clientId) {
    throw new Error("Client ID is required");
  }

  if (typeof clientId !== "string") {
    throw new Error("Client ID must be a string");
  }

  if (!isValidObjectId(clientId)) {
    throw new Error("Invalid client ID format. Client ID must be a valid MongoDB ObjectId.");
  }

  try {
    const response = await fetchDataClient("/api/roundglass/data-export/client", {
      clientId: clientId,
    });
    
    // Check if response is an error object
    if (response instanceof Error) {
      throw response;
    }
    
    return response;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch client data. Please try again.");
  }
}

/**
 * Export comprehensive team data for one or more client categories
 * Only available for coaches. Provides aggregated analytics, preferences, health statistics, and comparison data
 * 
 * @param {string|string[]} categoryIds - Single category ID or array of category IDs (MongoDB ObjectId) - required
 * @param {string|string[]} [metrics] - Optional: Comma-separated list or array of metrics to include in comparison
 *   Available metrics: bmi, muscle, fat, rm, bodyAge, visceral_fat, weight, sub_fat
 *   Default: all metrics
 * @returns {Promise<Object>} API response with team data export
 * @throws {Error} If categoryIds is not provided or is empty
 * 
 * @example
 * // Single category
 * const data = await exportTeamData("64a1b2c3d4e5f6g7h8i9j0k1");
 * 
 * @example
 * // Multiple categories
 * const data = await exportTeamData(["64a1b2c3d4e5f6g7h8i9j0k1", "64a1b2c3d4e5f6g7h8i9j0k2"]);
 * 
 * @example
 * // With specific metrics
 * const data = await exportTeamData(["64a1b2c3d4e5f6g7h8i9j0k1"], ["bmi", "weight", "muscle"]);
 */
// Valid metrics for team export
const VALID_METRICS = [
  "bmi",
  "muscle",
  "fat",
  "rm",
  "bodyAge",
  "visceral_fat",
  "weight",
  "sub_fat",
];

/**
 * Validate metrics array
 * @param {string|string[]} metrics - Metrics to validate
 * @returns {string[]} Validated metrics array
 */
function validateMetrics(metrics) {
  if (!metrics) return null;
  
  const metricsArray = Array.isArray(metrics) ? metrics : metrics.split(",").map(m => m.trim());
  const validMetrics = metricsArray.filter(m => VALID_METRICS.includes(m));
  
  if (validMetrics.length === 0 && metricsArray.length > 0) {
    throw new Error(`Invalid metrics. Valid metrics are: ${VALID_METRICS.join(", ")}`);
  }
  
  return validMetrics.length > 0 ? validMetrics : null;
}

export async function exportTeamData(categoryIds, metrics = null) {
  // Validate categoryIds
  if (!categoryIds) {
    throw new Error("At least one category ID is required");
  }

  if (Array.isArray(categoryIds) && categoryIds.length === 0) {
    throw new Error("At least one category ID is required");
  }

  // Validate category ID format
  const categoryIdsArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
  const invalidIds = categoryIdsArray.filter(id => !isValidObjectId(id));
  if (invalidIds.length > 0) {
    throw new Error(`Invalid category ID format. All category IDs must be valid MongoDB ObjectIds.`);
  }

  // Validate metrics if provided
  let validatedMetrics = null;
  if (metrics) {
    try {
      validatedMetrics = validateMetrics(metrics);
    } catch (error) {
      throw error;
    }
  }

  // Convert categoryIds to comma-separated string if array
  const categoryIdsParam = Array.isArray(categoryIds)
    ? categoryIds.join(",")
    : categoryIds;

  // Build query parameters
  const queryParams = {
    person: "coach",
    clientCategoryIds: categoryIdsParam,
  };

  // Add metrics if provided
  if (validatedMetrics) {
    queryParams.metrics = validatedMetrics.join(",");
  }

  try {
    const response = await fetchDataClient("/api/roundglass/data-export/team", queryParams);
    
    // Check if response is an error object
    if (response instanceof Error) {
      throw response;
    }
    
    return response;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch team data. Please try again.");
  }
}

