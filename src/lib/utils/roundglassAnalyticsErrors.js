/**
 * Roundglass Analytics Error Handling Utilities
 * Provides user-friendly error messages and error handling functions
 */

/**
 * Get user-friendly error message based on HTTP status code
 * @param {number} statusCode - HTTP status code
 * @param {string} defaultMessage - Default error message
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(statusCode, defaultMessage = "An error occurred") {
  switch (statusCode) {
    case 400:
      return "Invalid request. Please check your input and try again.";
    case 401:
      return "You are not authorized to access this resource. Please log in again.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 500:
      return "Server error. Please try again later or contact support.";
    case 502:
      return "Bad gateway. The server is temporarily unavailable.";
    case 503:
      return "Service unavailable. Please try again later.";
    case 504:
      return "Gateway timeout. The request took too long to complete.";
    default:
      return defaultMessage || "An unexpected error occurred. Please try again.";
  }
}

/**
 * Handle API error response
 * @param {Object} error - Error object from API
 * @param {Object} response - API response object
 * @returns {Object} Formatted error object with user-friendly message
 */
export function handleApiError(error, response = null) {
  // If response object is provided
  if (response) {
    const statusCode = response.status_code || response.status || 500;
    const message = response.message || getErrorMessage(statusCode);
    
    return {
      statusCode,
      message,
      userMessage: getErrorMessage(statusCode, message),
      originalError: error,
      response,
    };
  }

  // If error object is provided
  if (error) {
    // Check if it's a network error
    if (error.message?.includes("fetch") || error.message?.includes("network")) {
      return {
        statusCode: 0,
        message: "Network error. Please check your internet connection.",
        userMessage: "Unable to connect to the server. Please check your internet connection and try again.",
        originalError: error,
      };
    }

    // Check if it has status code
    if (error.status || error.statusCode) {
      const statusCode = error.status || error.statusCode;
      return {
        statusCode,
        message: error.message || getErrorMessage(statusCode),
        userMessage: getErrorMessage(statusCode, error.message),
        originalError: error,
      };
    }

    // Generic error
    return {
      statusCode: 500,
      message: error.message || "An unexpected error occurred",
      userMessage: error.message || "An unexpected error occurred. Please try again.",
      originalError: error,
    };
  }

  // Unknown error
  return {
    statusCode: 500,
    message: "An unknown error occurred",
    userMessage: "An unexpected error occurred. Please try again.",
    originalError: null,
  };
}

/**
 * Check if error is a retryable error
 * @param {Object} error - Error object
 * @returns {boolean} True if error is retryable
 */
export function isRetryableError(error) {
  if (!error) return false;
  
  const statusCode = error.statusCode || error.status_code || error.status;
  
  // Retryable status codes
  const retryableStatusCodes = [500, 502, 503, 504, 0]; // 0 for network errors
  
  return retryableStatusCodes.includes(statusCode);
}

/**
 * Get error severity level
 * @param {Object} error - Error object
 * @returns {string} Severity level: "low", "medium", "high", "critical"
 */
export function getErrorSeverity(error) {
  if (!error) return "medium";
  
  const statusCode = error.statusCode || error.status_code || error.status;
  
  switch (statusCode) {
    case 401:
    case 403:
      return "critical"; // Authentication/authorization issues
    case 404:
      return "low"; // Not found is usually not critical
    case 500:
    case 502:
    case 503:
    case 504:
      return "high"; // Server errors
    case 400:
      return "medium"; // Bad request
    default:
      return "medium";
  }
}

/**
 * Format error for display in UI
 * @param {Object} error - Error object
 * @param {string} context - Context where error occurred (e.g., "Category Comparison", "Trends Analysis")
 * @returns {Object} Formatted error object for UI display
 */
export function formatErrorForDisplay(error, context = "Analytics") {
  const handledError = handleApiError(error);
  
  return {
    ...handledError,
    context,
    title: `Error loading ${context}`,
    description: handledError.userMessage,
    severity: getErrorSeverity(handledError),
    retryable: isRetryableError(handledError),
  };
}

/**
 * Validate API response
 * @param {Object} response - API response object
 * @returns {Object} Validation result { valid: boolean, error: Object|null }
 */
export function validateApiResponse(response) {
  if (!response) {
    return {
      valid: false,
      error: {
        statusCode: 500,
        message: "No response received from server",
        userMessage: "No response received from server. Please try again.",
      },
    };
  }

  if (response.status_code === 200) {
    return { valid: true, error: null };
  }

  return {
    valid: false,
    error: handleApiError(null, response),
  };
}

