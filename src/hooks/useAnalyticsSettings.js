"use client";

import { useState, useEffect, useCallback } from "react";
import useLocalStorage from "./useLocalStorage";

const ANALYTICS_SETTINGS_KEY = "roundglass_analytics_settings";

// Default settings
const DEFAULT_SETTINGS = {
  // Default metric selection
  defaultMetrics: ["bmi", "weight", "fat", "muscle"],
  
  // Chart type preferences
  chartTypes: {
    categoryComparison: "bar", // bar, line, radar
    trends: "line", // line, area, bar
    correlations: "scatter", // scatter, heatmap
    distribution: "boxplot", // boxplot, histogram
    preferences: "bar", // bar, pie
  },
  
  // Date range defaults
  dateRangeDefaults: {
    trends: "3months", // 1week, 1month, 3months, 6months, 1year, custom
    comparison: "all", // 1week, 1month, 3months, 6months, 1year, all
  },
  
  // Export format preferences
  exportFormat: "csv", // csv, excel, pdf
  
  // Display preferences
  display: {
    showPercentiles: true,
    showTrends: true,
    showCorrelations: true,
    compactMode: false,
    chartHeight: 400, // 300, 400, 500
  },
  
  // Theme preferences (if applicable)
  theme: {
    chartColors: "default", // default, vibrant, pastel, monochrome
    tableDensity: "comfortable", // compact, comfortable, spacious
  },
  
  // Auto-refresh settings
  autoRefresh: {
    enabled: false,
    interval: 60000, // milliseconds (1 minute)
  },
  
  // Notification preferences
  notifications: {
    dataUpdated: false,
    exportComplete: true,
    errorAlerts: true,
  },
};

/**
 * Hook to manage analytics settings
 * Persists settings to localStorage
 */
export function useAnalyticsSettings() {
  const [settings, setSettings] = useLocalStorage(
    ANALYTICS_SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

  // Update a specific setting
  const updateSetting = useCallback((path, value) => {
    setSettings((prev) => {
      const keys = path.split(".");
      const newSettings = { ...prev };
      let current = newSettings;

      // Navigate to the nested property
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      // Set the value
      current[keys[keys.length - 1]] = value;

      return newSettings;
    });
  }, [setSettings]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, [setSettings]);

  // Get a specific setting value
  const getSetting = useCallback((path) => {
    const keys = path.split(".");
    let value = settings;
    
    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }, [settings]);

  return {
    settings,
    updateSetting,
    resetToDefaults,
    getSetting,
  };
}

/**
 * Get default metrics from settings
 */
export function getDefaultMetrics(settings) {
  return settings?.defaultMetrics || DEFAULT_SETTINGS.defaultMetrics;
}

/**
 * Get chart type for a specific view
 */
export function getChartType(settings, view) {
  return settings?.chartTypes?.[view] || DEFAULT_SETTINGS.chartTypes[view] || "bar";
}

/**
 * Get date range default for a specific view
 */
export function getDateRangeDefault(settings, view) {
  return settings?.dateRangeDefaults?.[view] || DEFAULT_SETTINGS.dateRangeDefaults[view] || "all";
}

