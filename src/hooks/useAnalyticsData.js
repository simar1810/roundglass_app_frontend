"use client";

import useSWR, { mutate } from "swr";

/**
 * Custom hook for analytics data fetching with consistent configuration
 * 
 * @param {Object} params
 * @param {string|Function} params.key - SWR cache key (or function that returns key)
 * @param {Function} params.fetcher - Data fetcher function
 * @param {Object} params.options - SWR options
 * @param {number} params.options.revalidateInterval - Revalidation interval in ms (default: 60000 = 1 minute)
 * @param {boolean} params.options.revalidateOnFocus - Revalidate on window focus (default: false)
 * @param {boolean} params.options.revalidateIfStale - Revalidate if stale (default: true)
 * @param {boolean} params.options.keepPreviousData - Keep previous data while fetching (default: true)
 * @returns {Object} { data, error, isLoading, isValidating, mutate: refresh function }
 */
export function useAnalyticsData({ key, fetcher, options = {} }) {
  const swrOptions = {
    revalidateOnFocus: false, // Don't revalidate on focus (analytics data doesn't change that frequently)
    revalidateIfStale: true, // Revalidate if data is stale
    revalidateOnReconnect: true, // Revalidate when network reconnects
    dedupingInterval: 5000, // Dedupe requests within 5 seconds
    revalidateInterval: options.revalidateInterval || 60000, // Default: 1 minute
    keepPreviousData: options.keepPreviousData !== false, // Keep previous data while fetching
    ...options,
  };

  const { data, error, isLoading, isValidating, mutate: swrMutate } = useSWR(
    key,
    fetcher,
    swrOptions
  );

  // Custom refresh function with loading state
  const refresh = async (options = {}) => {
    return swrMutate(key, fetcher, {
      revalidate: true,
      ...options,
    });
  };

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh,
    mutate: swrMutate, // Also expose original mutate
  };
}

/**
 * Hook to invalidate analytics cache
 * @param {string|Array<string>} keys - Cache key(s) to invalidate
 * @param {Object} options - Invalidation options
 */
export function useAnalyticsCacheInvalidation() {
  const invalidate = (keys, options = {}) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    
    keysArray.forEach((key) => {
      mutate(key, undefined, {
        revalidate: false, // Don't revalidate, just clear cache
        ...options,
      });
    });
  };

  const invalidateAll = (pattern = null) => {
    if (pattern) {
      // Invalidate all keys matching pattern
      mutate(
        (key) => typeof key === "string" && key.includes(pattern),
        undefined,
        { revalidate: false }
      );
    } else {
      // Invalidate all analytics keys
      mutate(
        (key) => typeof key === "string" && key.startsWith("roundglass/"),
        undefined,
        { revalidate: false }
      );
    }
  };

  const refresh = (keys, options = {}) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    
    keysArray.forEach((key) => {
      mutate(key, undefined, {
        revalidate: true, // Revalidate
        ...options,
      });
    });
  };

  return {
    invalidate,
    invalidateAll,
    refresh,
  };
}

/**
 * Build consistent SWR cache key for analytics endpoints
 * @param {string} endpoint - Endpoint name (e.g., "category-comparison")
 * @param {Object} params - Query parameters
 * @returns {string} Cache key
 */
export function buildAnalyticsCacheKey(endpoint, params = {}) {
  const keyParts = [`roundglass/${endpoint}`];
  
  // Add person type
  if (params.person) {
    keyParts.push(`person:${params.person}`);
  }

  // Add other params in sorted order for consistency
  const sortedParams = Object.keys(params)
    .filter((key) => key !== "person" && params[key] !== undefined && params[key] !== null && params[key] !== "")
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

