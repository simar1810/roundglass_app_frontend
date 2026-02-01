"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { exportClientData, exportTeamData } from "@/lib/fetchers/roundglassDataExport";
import {
  exportClientDataToCSV,
  exportClientDataToExcel,
  exportTeamDataToCSV,
  exportTeamDataToExcel,
} from "@/lib/utils/roundglassDataExport";
import { useExportHistory } from "@/components/pages/roundglass/ExportHistory";

/**
 * Check if error is a network error
 */
function isNetworkError(error) {
  if (!error) return false;
  const message = error.message?.toLowerCase() || "";
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    error.name === "TypeError"
  );
}

/**
 * Get user-friendly error message based on status code
 */
function getErrorMessage(statusCode, defaultMessage, apiResponse) {
  switch (statusCode) {
    case 400:
      return apiResponse?.error || "Invalid request. Please check your selections and try again.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You don't have permission to export this data.";
    case 404:
      return apiResponse?.error || "The requested data was not found. Please verify your selections.";
    case 408:
      return "Request timed out. The server took too long to respond. Please try again.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Server error. Please try again in a few moments.";
    default:
      return defaultMessage || "An unexpected error occurred. Please try again.";
  }
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Only retry on network errors or 5xx errors
      const statusCode = error?.statusCode || error?.status_code;
      if (
        !isNetworkError(error) &&
        !(statusCode >= 500 && statusCode < 600)
      ) {
        throw error;
      }
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
      );
    }
  }
}

/**
 * Custom hook for Roundglass data export functionality
 * Manages export state, handles errors, and provides export functions
 * 
 * @returns {Object} Export hook interface
 * @returns {boolean} isExporting - Whether an export is currently in progress
 * @returns {number} exportProgress - Export progress (0-100)
 * @returns {Error|null} exportError - Current export error, if any
 * @returns {Function} exportClient - Function to export client data
 * @returns {Function} exportTeam - Function to export team data
 * @returns {Function} clearError - Function to clear current error
 */
export function useRoundglassDataExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { addExport } = useExportHistory();

  /**
   * Clear export error
   */
  const clearError = useCallback(() => {
    setExportError(null);
  }, []);

  /**
   * Export client data
   * @param {string} clientId - Client ID (MongoDB ObjectId)
   * @param {string} format - Export format: 'csv' or 'excel' (default: 'excel')
   * @param {string} filename - Optional custom filename (without extension)
   * @returns {Promise<void>}
   */
  const exportClient = useCallback(
    async (clientId, format = "excel", filename = null) => {
      // Validate inputs
      if (!clientId) {
        const error = new Error("Client ID is required");
        setExportError(error);
        toast.error(error.message);
        return;
      }

      if (!["csv", "excel"].includes(format.toLowerCase())) {
        const error = new Error("Format must be 'csv' or 'excel'");
        setExportError(error);
        toast.error(error.message);
        return;
      }

      setIsExporting(true);
      setExportProgress(0);
      setExportError(null);
      setRetryCount(0);

      // Define filename early for error handling
      const defaultFilename = filename || `client-${clientId}-export`;

      try {
        // Show loading toast
        const loadingToast = toast.loading("Fetching client data...");
        setExportProgress(10);

        // Fetch data from API with retry
        let apiResponse;
        try {
          apiResponse = await retryWithBackoff(
            () => exportClientData(clientId),
            3,
            1000
          );
        } catch (retryError) {
          // If retry failed, try one more time without retry wrapper
          if (retryCount < 1) {
            setRetryCount(1);
            apiResponse = await exportClientData(clientId);
          } else {
            throw retryError;
          }
        }
        setExportProgress(50);

        // Check for API errors
        if (!apiResponse || apiResponse.status_code !== 200) {
          const statusCode = apiResponse?.status_code || 0;
          const errorMessage = getErrorMessage(
            statusCode,
            apiResponse?.error || apiResponse?.message || "Failed to fetch client data",
            apiResponse
          );
          
          // Handle specific error cases
          if (statusCode === 401) {
            toast.error(errorMessage);
            // Redirect handled by API layer
            return;
          }
          
          if (statusCode === 404) {
            throw new Error(errorMessage);
          }
          
          throw new Error(errorMessage);
        }

        // Check if data exists
        if (!apiResponse.data || !apiResponse.data.client) {
          throw new Error("No client data found for this client. The client may not have any data to export.");
        }

        // Check if data is empty
        const hasPreferences = apiResponse.data.preferences && apiResponse.data.preferences.length > 0;
        if (!hasPreferences) {
          toast.warning("Client has no preferences data. Export will only include basic client information.");
        }
        
        // Warn about large datasets
        const totalPreferences = apiResponse.data.preferences?.length || 0;
        if (totalPreferences > 50) {
          const estimatedTime = Math.ceil(totalPreferences / 10); // Rough estimate in seconds
          toast.info(
            `Processing ${totalPreferences} preferences. This may take approximately ${estimatedTime} seconds.`,
            { duration: 6000 }
          );
        }

        setExportProgress(70);
        toast.dismiss(loadingToast);
        toast.loading("Preparing export...", { id: loadingToast });

        // Export based on format with progress tracking
        setExportProgress(75);
        
        // Progress callback for data formatting
        const onFormatProgress = (current, total, stage) => {
          const formatProgress = Math.floor((current / total) * 15); // 15% of total progress
          setExportProgress(75 + formatProgress);
          if (stage) {
            toast.loading(stage, { id: loadingToast });
          }
        };
        
        if (format.toLowerCase() === "csv") {
          await exportClientDataToCSV(apiResponse, defaultFilename, onFormatProgress);
        } else {
          await exportClientDataToExcel(apiResponse, defaultFilename, onFormatProgress);
        }

        setExportProgress(95);
        // Small delay to show completion
        await new Promise((resolve) => setTimeout(resolve, 200));
        setExportProgress(100);
        toast.dismiss(loadingToast);
        toast.success(
          `Client data exported successfully as ${format.toUpperCase()}`
        );

        // Add successful export to history
        addExport({
          type: "client",
          status: "completed",
          format: format.toLowerCase(),
          clientId: clientId,
          filename: defaultFilename,
        });

        // Reset progress after a short delay
        setTimeout(() => {
          setExportProgress(0);
        }, 1000);
      } catch (error) {
        console.error("Error exporting client data:", error);
        
        // Determine error message
        let errorMessage = error.message || "Failed to export client data. Please try again.";
        
        // Check if it's a network error
        if (isNetworkError(error)) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        }
        
        // Extract status code if available
        const statusCode = error?.statusCode || error?.status_code || 0;
        if (statusCode > 0) {
          errorMessage = getErrorMessage(statusCode, errorMessage, error);
        }
        
        setExportError(error);
        
        // Show error with retry option for network/5xx errors
        if (isNetworkError(error) || (statusCode >= 500 && statusCode < 600)) {
          toast.error(errorMessage, {
            action: {
              label: "Retry",
              onClick: () => {
                exportClient(clientId, format, filename);
              },
            },
            duration: 10000,
          });
        } else {
          toast.error(errorMessage);
        }
        
        setExportProgress(0);

        // Add failed export to history
        addExport({
          type: "client",
          status: "failed",
          format: format.toLowerCase(),
          clientId: clientId,
          filename: defaultFilename,
          error: errorMessage,
        });
      } finally {
        setIsExporting(false);
        setRetryCount(0);
      }
    },
    [addExport]
  );

  /**
   * Export team data
   * @param {string|string[]} categoryIds - Single category ID or array of category IDs
   * @param {string|string[]} metrics - Optional: Metrics to include (comma-separated string or array)
   * @param {string} format - Export format: 'csv' or 'excel' (default: 'excel')
   * @param {string} filename - Optional custom filename (without extension)
   * @returns {Promise<void>}
   */
  const exportTeam = useCallback(
    async (
      categoryIds,
      metrics = null,
      format = "excel",
      filename = null
    ) => {
      // Validate inputs
      if (!categoryIds) {
        const error = new Error("At least one category ID is required");
        setExportError(error);
        toast.error(error.message);
        return;
      }

      if (Array.isArray(categoryIds) && categoryIds.length === 0) {
        const error = new Error("At least one category ID is required");
        setExportError(error);
        toast.error(error.message);
        return;
      }

      if (!["csv", "excel"].includes(format.toLowerCase())) {
        const error = new Error("Format must be 'csv' or 'excel'");
        setExportError(error);
        toast.error(error.message);
        return;
      }

      setIsExporting(true);
      setExportProgress(0);
      setExportError(null);
      setRetryCount(0);

      // Define filename early for error handling
      const defaultFilename = filename || "team-data-export";

      // Warn about large datasets
      const categoryIdsArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
      if (categoryIdsArray.length > 3) {
        toast.info("Exporting data for multiple categories. This may take a few moments...", {
          duration: 5000,
        });
      }

      try {
        // Show loading toast
        const loadingToast = toast.loading("Fetching team data...");
        setExportProgress(10);

        // Fetch data from API with retry
        let apiResponse;
        try {
          apiResponse = await retryWithBackoff(
            () => exportTeamData(categoryIds, metrics),
            3,
            1000
          );
        } catch (retryError) {
          // If retry failed, try one more time without retry wrapper
          if (retryCount < 1) {
            setRetryCount(1);
            apiResponse = await exportTeamData(categoryIds, metrics);
          } else {
            throw retryError;
          }
        }
        setExportProgress(50);

        // Check for API errors
        if (!apiResponse || apiResponse.status_code !== 200) {
          const statusCode = apiResponse?.status_code || 0;
          const errorMessage = getErrorMessage(
            statusCode,
            apiResponse?.error || apiResponse?.message || "Failed to fetch team data",
            apiResponse
          );
          
          // Handle specific error cases
          if (statusCode === 401) {
            toast.error(errorMessage);
            // Redirect handled by API layer
            return;
          }
          
          if (statusCode === 400) {
            // Check for specific 400 errors
            if (apiResponse?.error?.includes("coach")) {
              throw new Error("Team data export is only available for coaches.");
            }
            if (apiResponse?.error?.includes("category")) {
              throw new Error("Invalid category selection. Please select valid categories.");
            }
          }
          
          if (statusCode === 404) {
            throw new Error("Selected categories not found. Please verify your category selections.");
          }
          
          throw new Error(errorMessage);
        }

        // Check if data exists
        if (!apiResponse.data || !apiResponse.data.categories) {
          throw new Error("No team data found for the selected categories.");
        }

        // Check if categories array is empty
        if (
          !Array.isArray(apiResponse.data.categories) ||
          apiResponse.data.categories.length === 0
        ) {
          throw new Error("No data found for the selected categories. The categories may be empty.");
        }

        // Warn about large datasets with time estimates
        const totalClients = apiResponse.data.metadata?.totalClients || 0;
        const totalCategories = apiResponse.data.categories?.length || 0;
        
        if (totalClients > 100 || totalCategories > 3) {
          // Estimate processing time: ~0.1 seconds per client, ~5 seconds per category
          const estimatedTime = Math.ceil((totalClients * 0.1) + (totalCategories * 5));
          const minutes = Math.floor(estimatedTime / 60);
          const seconds = estimatedTime % 60;
          const timeString = minutes > 0 
            ? `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds > 0 ? `and ${seconds} second${seconds > 1 ? 's' : ''}` : ''}`
            : `${seconds} second${seconds > 1 ? 's' : ''}`;
          
          toast.warning(
            `Exporting data for ${totalClients} clients across ${totalCategories} categor${totalCategories === 1 ? 'y' : 'ies'}. Estimated time: ${timeString}.`,
            { duration: 8000 }
          );
        } else if (totalClients > 50) {
          toast.info(
            `Processing data for ${totalClients} clients. This may take a moment.`,
            { duration: 5000 }
          );
        }

        setExportProgress(70);
        toast.dismiss(loadingToast);
        toast.loading("Preparing export...", { id: loadingToast });

        // Export based on format with progress tracking
        setExportProgress(75);
        
        // Progress callback for data formatting and export
        const onFormatProgress = (current, total, stage) => {
          const formatProgress = Math.floor((current / total) * 20); // 20% of total progress
          setExportProgress(75 + formatProgress);
          if (stage) {
            toast.loading(stage, { id: loadingToast });
          }
        };
        
        if (format.toLowerCase() === "csv") {
          await exportTeamDataToCSV(apiResponse, defaultFilename, onFormatProgress);
        } else {
          await exportTeamDataToExcel(apiResponse, defaultFilename, onFormatProgress);
        }

        setExportProgress(95);
        // Small delay to show completion
        await new Promise((resolve) => setTimeout(resolve, 200));
        setExportProgress(100);
        toast.dismiss(loadingToast);
        toast.success(
          `Team data exported successfully as ${format.toUpperCase()}`
        );

        // Add successful export to history
        const categoryIdsArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
        const metricsArray = metrics ? (Array.isArray(metrics) ? metrics : [metrics]) : null;
        addExport({
          type: "team",
          status: "completed",
          format: format.toLowerCase(),
          categoryIds: categoryIdsArray,
          metrics: metricsArray,
          filename: defaultFilename,
        });

        // Reset progress after a short delay
        setTimeout(() => {
          setExportProgress(0);
        }, 1000);
      } catch (error) {
        console.error("Error exporting team data:", error);
        
        // Determine error message
        let errorMessage = error.message || "Failed to export team data. Please try again.";
        
        // Check if it's a network error
        if (isNetworkError(error)) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        }
        
        // Extract status code if available
        const statusCode = error?.statusCode || error?.status_code || 0;
        if (statusCode > 0) {
          errorMessage = getErrorMessage(statusCode, errorMessage, error);
        }
        
        setExportError(error);
        
        // Show error with retry option for network/5xx errors
        if (isNetworkError(error) || (statusCode >= 500 && statusCode < 600)) {
          toast.error(errorMessage, {
            action: {
              label: "Retry",
              onClick: () => {
                exportTeam(categoryIds, metrics, format, filename);
              },
            },
            duration: 10000,
          });
        } else {
          toast.error(errorMessage);
        }
        
        setExportProgress(0);

        // Add failed export to history
        const categoryIdsArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
        const metricsArray = metrics ? (Array.isArray(metrics) ? metrics : [metrics]) : null;
        addExport({
          type: "team",
          status: "failed",
          format: format.toLowerCase(),
          categoryIds: categoryIdsArray,
          metrics: metricsArray,
          filename: defaultFilename,
          error: errorMessage,
        });
      } finally {
        setIsExporting(false);
        setRetryCount(0);
      }
    },
    [addExport]
  );

  return {
    isExporting,
    exportProgress,
    exportError,
    exportClient,
    exportTeam,
    clearError,
  };
}

