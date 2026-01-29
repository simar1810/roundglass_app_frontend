/**
 * Error handling utilities for Growth module
 */

/**
 * Get user-friendly error message based on API status code
 * @param {number} statusCode - HTTP status code
 * @param {string} defaultMessage - Default error message
 * @param {Object} errorData - Additional error data from API
 * @returns {string} User-friendly error message
 */
export function getGrowthErrorMessage(statusCode, defaultMessage = "An error occurred", errorData = {}) {
  const message = errorData.message || defaultMessage;

  switch (statusCode) {
    case 400:
      // Bad Request - Validation errors
      if (errorData.errors && Array.isArray(errorData.errors)) {
        return `Validation error: ${errorData.errors.join(", ")}`;
      }
      if (errorData.error) {
        return `Invalid request: ${errorData.error}`;
      }
      return `Invalid request: ${message}`;

    case 401:
      // Unauthorized
      return "Your session has expired. Please log in again.";

    case 403:
      // Forbidden - Access denied
      return "You don't have permission to perform this action. Please contact your administrator.";

    case 404:
      // Not Found
      if (message.includes("client") || message.includes("Client")) {
        return "Client not found. Please check the client ID and try again.";
      }
      if (message.includes("group") || message.includes("Group")) {
        return "Group not found. Please check the group ID and try again.";
      }
      return "Resource not found. Please check your input and try again.";

    case 409:
      // Conflict - Duplicate measurement
      if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("already")) {
        return "A measurement for this date already exists. Please choose a different date or update the existing measurement.";
      }
      return `Conflict: ${message}`;

    case 422:
      // Unprocessable Entity
      return `Invalid data: ${message}`;

    case 500:
    case 502:
    case 503:
      // Server errors
      return "Server error. Please try again later. If the problem persists, contact support.";

    default:
      return message || defaultMessage;
  }
}

/**
 * Handle API response and extract error information
 * @param {Object} response - API response object
 * @returns {Object} Error information { hasError, statusCode, message }
 */
export function handleGrowthApiResponse(response) {
  if (!response) {
    return {
      hasError: true,
      statusCode: 0,
      message: "No response from server. Please check your connection and try again.",
    };
  }

  // Check if response has status_code property (API format)
  const statusCode = response.status_code || response.statusCode || 0;

  // Success status codes
  if (statusCode >= 200 && statusCode < 300) {
    return {
      hasError: false,
      statusCode,
      message: null,
    };
  }

  // Error status codes
  return {
    hasError: true,
    statusCode,
    message: getGrowthErrorMessage(statusCode, response.message || "An error occurred", response),
  };
}

/**
 * Format validation errors from API response
 * @param {Object} errorData - Error data from API
 * @returns {string[]} Array of formatted error messages
 */
export function formatValidationErrors(errorData) {
  if (!errorData) return [];

  // Handle different error formats
  if (Array.isArray(errorData.errors)) {
    return errorData.errors;
  }

  if (errorData.error && typeof errorData.error === "string") {
    return [errorData.error];
  }

  if (errorData.message && typeof errorData.message === "string") {
    return [errorData.message];
  }

  // Handle field-specific errors
  if (typeof errorData === "object") {
    const errors = [];
    for (const [field, message] of Object.entries(errorData)) {
      if (field !== "status_code" && field !== "statusCode" && message) {
        errors.push(`${field}: ${message}`);
      }
    }
    return errors;
  }

  return [];
}

/**
 * Check if error is a network error
 * @param {Error|Object} error - Error object
 * @returns {boolean} True if network error
 */
export function isNetworkError(error) {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || "";
  const errorString = String(error).toLowerCase();

  return (
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("connection") ||
    errorString.includes("network") ||
    errorString.includes("fetch") ||
    errorString.includes("connection") ||
    errorMessage.includes("failed to fetch")
  );
}

/**
 * Get retry suggestion based on error
 * @param {number} statusCode - HTTP status code
 * @param {Error|Object} error - Error object
 * @returns {string|null} Retry suggestion or null
 */
export function getRetrySuggestion(statusCode, error) {
  if (isNetworkError(error)) {
    return "Please check your internet connection and try again.";
  }

  switch (statusCode) {
    case 500:
    case 502:
    case 503:
      return "The server is temporarily unavailable. Please try again in a few moments.";
    case 408:
      return "Request timed out. Please try again.";
    default:
      return null;
  }
}





