import { fetchData } from "../api";
import { buildUrlWithQueryParams } from "../formatter";

/**
 * Get category comparison data (intra-category or inter-category)
 * @param {Object} params - Comparison parameters
 * @param {string} params.person - "coach" or "client" (required)
 * @param {string} [params.categoryId] - Category ID for intra-category comparison
 * @param {string|string[]} [params.categoryIds] - Category IDs for inter-category comparison (comma-separated string or array)
 * @param {string|string[]} [params.metrics] - Specific metrics to compare (comma-separated string or array, default: all)
 * @param {string} [params.comparisonType] - "intra" or "inter" (auto-detected if not provided)
 * @returns {Promise<Object>} API response with comparison data and graphData
 */
export function getCategoryComparison(params) {
  const queryParams = {
    person: params.person, // "coach" or "client" (required)
  };

  // Handle categoryId (intra-category) or categoryIds (inter-category)
  if (params.categoryId) {
    queryParams.categoryId = params.categoryId;
  } else if (params.categoryIds) {
    queryParams.categoryIds = Array.isArray(params.categoryIds)
      ? params.categoryIds.join(",")
      : params.categoryIds;
  }

  // Handle metrics - can be array or comma-separated string
  if (params.metrics) {
    queryParams.metrics = Array.isArray(params.metrics)
      ? params.metrics.join(",")
      : params.metrics;
  }

  // Optional comparisonType
  if (params.comparisonType) {
    queryParams.comparisonType = params.comparisonType;
  }

  const endpoint = buildUrlWithQueryParams(
    "app/roundglass/analytics/category-comparison",
    queryParams
  );

  return fetchData(endpoint);
}

/**
 * Get time-series trends for health metrics
 * @param {Object} params - Trends analysis parameters
 * @param {string} params.person - "coach" or "client" (required)
 * @param {string|string[]} [params.clientIds] - Client IDs for coach view (comma-separated string or array, required for coach)
 * @param {string} [params.metric="bmi"] - Specific metric or "all" (default: "bmi")
 * @param {string} [params.startDate] - Start date filter (YYYY-MM-DD format)
 * @param {string} [params.endDate] - End date filter (YYYY-MM-DD format)
 * @param {boolean} [params.aggregate=false] - Aggregate across clients (default: false)
 * @returns {Promise<Object>} API response with trends data and graphData
 */
export function getTrendsAnalysis(params) {
  const queryParams = {
    person: params.person, // "coach" or "client" (required)
  };

  // Handle clientIds - required for coach, not used for client
  if (params.clientIds) {
    queryParams.clientIds = Array.isArray(params.clientIds)
      ? params.clientIds.join(",")
      : params.clientIds;
  }

  // Optional metric (default: "bmi")
  if (params.metric) {
    queryParams.metric = params.metric;
  }

  // Optional date range
  if (params.startDate) {
    queryParams.startDate = params.startDate;
  }
  if (params.endDate) {
    queryParams.endDate = params.endDate;
  }

  // Optional aggregate flag
  if (params.aggregate !== undefined) {
    queryParams.aggregate = params.aggregate.toString();
  }

  const endpoint = buildUrlWithQueryParams(
    "app/roundglass/analytics/trends",
    queryParams
  );

  return fetchData(endpoint);
}

/**
 * Get percentile ranking of a client relative to their comparison group
 * @param {Object} params - Ranking parameters
 * @param {string} params.person - "coach" or "client" (required)
 * @param {string} [params.clientId] - Client ID to rank (required for coach, auto-detected for client)
 * @param {string} [params.comparisonGroup="all"] - "category" or "all" (default: "all")
 * @param {string} [params.categoryId] - Category ID (required if comparisonGroup="category")
 * @param {string|string[]} [params.metrics] - Specific metrics or "all" (comma-separated string or array, default: all)
 * @returns {Promise<Object>} API response with ranking data and graphData
 */
export function getClientRanking(params) {
  const queryParams = {
    person: params.person, // "coach" or "client" (required)
  };

  // Client ID - required for coach, not needed for client (uses authenticated client)
  if (params.clientId) {
    queryParams.clientId = params.clientId;
  }

  // Comparison group (default: "all")
  if (params.comparisonGroup) {
    queryParams.comparisonGroup = params.comparisonGroup;
  }

  // Category ID (required if comparisonGroup="category")
  if (params.categoryId) {
    queryParams.categoryId = params.categoryId;
  }

  // Handle metrics - can be array or comma-separated string
  if (params.metrics) {
    queryParams.metrics = Array.isArray(params.metrics)
      ? params.metrics.join(",")
      : params.metrics;
  }

  const endpoint = buildUrlWithQueryParams(
    "app/roundglass/analytics/client-ranking",
    queryParams
  );

  return fetchData(endpoint);
}

/**
 * Calculate correlations between different health metrics
 * @param {Object} params - Correlation parameters
 * @param {string} params.person - Must be "coach" (required)
 * @param {string|string[]} [params.clientIds] - Specific clients (comma-separated string or array, default: all coach clients)
 * @param {string|string[]} [params.metrics] - Metrics to correlate or "all" (comma-separated string or array, default: all)
 * @param {string} [params.categoryId] - Filter by category
 * @returns {Promise<Object>} API response with correlations data and graphData
 */
export function getCorrelations(params) {
  const queryParams = {
    person: "coach", // Must be coach (required)
  };

  // Handle clientIds - can be array or comma-separated string
  if (params.clientIds) {
    queryParams.clientIds = Array.isArray(params.clientIds)
      ? params.clientIds.join(",")
      : params.clientIds;
  }

  // Handle metrics - can be array or comma-separated string
  if (params.metrics) {
    queryParams.metrics = Array.isArray(params.metrics)
      ? params.metrics.join(",")
      : params.metrics;
  }

  // Optional category filter
  if (params.categoryId) {
    queryParams.categoryId = params.categoryId;
  }

  const endpoint = buildUrlWithQueryParams(
    "app/roundglass/analytics/correlations",
    queryParams
  );

  return fetchData(endpoint);
}

/**
 * Get distribution statistics for a specific metric
 * @param {Object} params - Distribution parameters
 * @param {string} params.person - Must be "coach" (required)
 * @param {string} params.metric - Metric to analyze (required)
 * @param {string} [params.categoryId] - Filter by category
 * @param {string|string[]} [params.clientIds] - Specific clients (comma-separated string or array)
 * @returns {Promise<Object>} API response with distribution data and graphData
 */
export function getDistribution(params) {
  const queryParams = {
    person: "coach", // Must be coach (required)
    metric: params.metric, // Required
  };

  // Optional category filter
  if (params.categoryId) {
    queryParams.categoryId = params.categoryId;
  }

  // Handle clientIds - can be array or comma-separated string
  if (params.clientIds) {
    queryParams.clientIds = Array.isArray(params.clientIds)
      ? params.clientIds.join(",")
      : params.clientIds;
  }

  const endpoint = buildUrlWithQueryParams(
    "app/roundglass/analytics/distribution",
    queryParams
  );

  return fetchData(endpoint);
}

/**
 * Analyze Roundglass preferences (training, supplements, injuries)
 * @param {Object} params - Preferences analysis parameters
 * @param {string} params.person - Must be "coach" (required)
 * @param {string} [params.categoryId] - Filter by category
 * @param {string} [params.analysisType="all"] - "training", "supplements", "injuries", or "all" (default: "all")
 * @returns {Promise<Object>} API response with preferences analysis data and graphData
 */
export function getPreferencesAnalysis(params) {
  const queryParams = {
    person: "coach", // Must be coach (required)
  };

  // Optional category filter
  if (params.categoryId) {
    queryParams.categoryId = params.categoryId;
  }

  // Optional analysis type (default: "all")
  if (params.analysisType) {
    queryParams.analysisType = params.analysisType;
  }

  const endpoint = buildUrlWithQueryParams(
    "app/roundglass/analytics/preferences-analysis",
    queryParams
  );

  return fetchData(endpoint);
}

/**
 * Get comprehensive analytical summary (dashboard view)
 * @param {Object} params - Summary parameters
 * @param {string} params.person - "coach" or "client" (required)
 * @param {string} [params.categoryId] - Filter by category
 * @param {string} [params.clientId] - Focus on specific client (for coach)
 * @returns {Promise<Object>} API response with comprehensive summary data
 */
export function getAnalyticsSummary(params) {
  const queryParams = {
    person: params.person, // "coach" or "client" (required)
  };

  // Optional category filter
  if (params.categoryId) {
    queryParams.categoryId = params.categoryId;
  }

  // Optional client ID (for coach to focus on specific client)
  if (params.clientId) {
    queryParams.clientId = params.clientId;
  }

  const endpoint = buildUrlWithQueryParams(
    "app/roundglass/analytics/summary",
    queryParams
  );

  return fetchData(endpoint);
}

