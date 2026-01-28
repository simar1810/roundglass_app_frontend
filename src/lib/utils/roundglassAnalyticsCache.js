/**
 * Roundglass Analytics Cache Management Utilities
 * Provides functions for managing SWR cache for analytics data
 */

import { mutate } from "swr";

/**
 * Cache key prefixes for different analytics endpoints
 */
export const CACHE_KEYS = {
  SUMMARY: "roundglass/summary",
  CATEGORY_COMPARISON: "roundglass/category-comparison",
  TRENDS: "roundglass/trends",
  CLIENT_RANKING: "roundglass/client-ranking",
  CORRELATIONS: "roundglass/correlations",
  DISTRIBUTION: "roundglass/distribution",
  PREFERENCES: "roundglass/preferences",
};

/**
 * Invalidate all analytics cache
 * @param {Object} options - Invalidation options
 */
export function invalidateAllAnalyticsCache(options = {}) {
  return mutate(
    (key) => typeof key === "string" && key.startsWith("roundglass/"),
    undefined,
    {
      revalidate: false,
      ...options,
    }
  );
}

/**
 * Invalidate specific analytics endpoint cache
 * @param {string} endpoint - Endpoint name (e.g., "category-comparison")
 * @param {Object} options - Invalidation options
 */
export function invalidateAnalyticsEndpoint(endpoint, options = {}) {
  return mutate(
    (key) => typeof key === "string" && key.includes(`roundglass/${endpoint}`),
    undefined,
    {
      revalidate: false,
      ...options,
    }
  );
}

/**
 * Refresh all analytics cache (revalidate)
 * @param {Object} options - Refresh options
 */
export function refreshAllAnalyticsCache(options = {}) {
  return mutate(
    (key) => typeof key === "string" && key.startsWith("roundglass/"),
    undefined,
    {
      revalidate: true,
      ...options,
    }
  );
}

/**
 * Refresh specific analytics endpoint cache
 * @param {string} endpoint - Endpoint name
 * @param {Object} options - Refresh options
 */
export function refreshAnalyticsEndpoint(endpoint, options = {}) {
  return mutate(
    (key) => typeof key === "string" && key.includes(`roundglass/${endpoint}`),
    undefined,
    {
      revalidate: true,
      ...options,
    }
  );
}

/**
 * Invalidate cache by pattern
 * @param {string|RegExp} pattern - Pattern to match cache keys
 * @param {Object} options - Invalidation options
 */
export function invalidateCacheByPattern(pattern, options = {}) {
  const matcher =
    typeof pattern === "string"
      ? (key) => typeof key === "string" && key.includes(pattern)
      : (key) => typeof key === "string" && pattern.test(key);

  return mutate(matcher, undefined, {
    revalidate: false,
    ...options,
  });
}

/**
 * Refresh cache by pattern
 * @param {string|RegExp} pattern - Pattern to match cache keys
 * @param {Object} options - Refresh options
 */
export function refreshCacheByPattern(pattern, options = {}) {
  const matcher =
    typeof pattern === "string"
      ? (key) => typeof key === "string" && key.includes(pattern)
      : (key) => typeof key === "string" && pattern.test(key);

  return mutate(matcher, undefined, {
    revalidate: true,
    ...options,
  });
}

/**
 * Get cache key for analytics endpoint with params
 * @param {string} endpoint - Endpoint name
 * @param {Object} params - Query parameters
 * @returns {string} Cache key
 */
export function getAnalyticsCacheKey(endpoint, params = {}) {
  const keyParts = [`roundglass/${endpoint}`];

  // Add person type
  if (params.person) {
    keyParts.push(`person:${params.person}`);
  }

  // Add other params in sorted order for consistency
  const sortedParams = Object.keys(params)
    .filter(
      (key) =>
        key !== "person" &&
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
    )
    .sort()
    .map((key) => {
      const value = params[key];
      if (Array.isArray(value)) {
        return `${key}:${value.sort().join(",")}`;
      }
      return `${key}:${value}`;
    });

  if (sortedParams.length > 0) {
    keyParts.push(...sortedParams);
  }

  return keyParts.join("|");
}

/**
 * Invalidate cache when client data is updated
 * This should be called after client data changes (e.g., new checkup, updated metrics)
 * @param {string} clientId - Client ID (optional, if provided only invalidates that client's data)
 */
export function invalidateOnClientDataUpdate(clientId = null) {
  if (clientId) {
    // Invalidate only this client's analytics
    return mutate(
      (key) =>
        typeof key === "string" &&
        key.startsWith("roundglass/") &&
        key.includes(`clientId:${clientId}`),
      undefined,
      { revalidate: true }
    );
  } else {
    // Invalidate all analytics (client data affects all analytics)
    return refreshAllAnalyticsCache();
  }
}

/**
 * Invalidate cache when category data is updated
 * This should be called after category changes
 */
export function invalidateOnCategoryUpdate() {
  return refreshAllAnalyticsCache();
}

