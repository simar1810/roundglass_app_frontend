import { fetchData, sendData } from "../api";
import { buildUrlWithQueryParams } from "../formatter";

/**
 * Create or update a client measurement
 * @param {string} clientId - Client MongoDB ObjectId
 * @param {Object} measurementData - Measurement data
 * @param {string} measurementData.measuredAt - Measurement date (YYYY-MM-DD or dd-MM-yyyy)
 * @param {number|string} measurementData.height - Height value
 * @param {string} measurementData.heightUnit - Height unit (Cms, Inches, etc.)
 * @param {number|string} measurementData.weight - Weight value
 * @param {string} measurementData.weightUnit - Weight unit (KG, Pounds, etc.)
 * @param {string} [measurementData.standard="IPA"] - Standard: "IPA" or "IAP" (default: "IPA")
 * @returns {Promise<Object>} API response with measurement and benchmark data
 */
export function createMeasurement(clientId, measurementData) {
  const payload = {
    clientId,
    measuredAt: measurementData.measuredAt,
    height: measurementData.height,
    heightUnit: measurementData.heightUnit,
    weight: measurementData.weight,
    weightUnit: measurementData.weightUnit,
    ...(measurementData.standard && { standard: measurementData.standard }),
  };

  const endpoint = buildUrlWithQueryParams("growth/measurements", { person: "coach" });
  return sendData(endpoint, payload, "POST");
}

/**
 * Get latest growth status for a client
 * @param {string} clientId - Client MongoDB ObjectId
 * @param {string} [date] - Get status closest on/before this date (YYYY-MM-DD). If not provided, returns latest
 * @param {string} [standard="IPA"] - Standard: "IPA" or "IAP" (default: "IPA")
 * @returns {Promise<Object>} API response with client status and benchmark data
 */
export function getClientStatus(clientId, date = null, standard = null) {
  const queryParams = {
    person: "coach", // Required by backend auth middleware
  };
  if (date) queryParams.date = date;
  if (standard) queryParams.standard = standard;

  const endpoint = buildUrlWithQueryParams(
    `growth/clients/${clientId}/status`,
    queryParams
  );

  return fetchData(endpoint);
}

/**
 * Create a new group for organizing clients
 * @param {Object} groupData - Group data
 * @param {string} groupData.name - Group name (required)
 * @param {string} [groupData.description] - Group description (optional)
 * @param {string[]} [groupData.clientIds] - Array of client ObjectIds to add initially (optional)
 * @returns {Promise<Object>} API response with created group data
 */
export function createGroup(groupData) {
  const payload = {
    name: groupData.name,
    ...(groupData.description && { description: groupData.description }),
    ...(groupData.clientIds && { clientIds: groupData.clientIds }),
  };

  const endpoint = buildUrlWithQueryParams("growth/groups", { person: "coach" });
  return sendData(endpoint, payload, "POST");
}

/**
 * Add clients to an existing group
 * @param {string} groupId - Group MongoDB ObjectId
 * @param {string[]} clientIds - Array of client ObjectIds to add
 * @returns {Promise<Object>} API response with updated group data
 */
export function addClientsToGroup(groupId, clientIds) {
  const payload = {
    clientIds,
  };

  const endpoint = buildUrlWithQueryParams(`growth/groups/${groupId}/clients`, { person: "coach" });
  return sendData(endpoint, payload, "PUT");
}

/**
 * Get aggregated growth statistics for a group of clients
 * @param {string} groupId - Group MongoDB ObjectId
 * @param {Object} [filters] - Filter options
 * @param {string} [filters.from] - Start date filter (YYYY-MM-DD)
 * @param {string} [filters.to] - End date filter (YYYY-MM-DD)
 * @param {string|string[]} [filters.ageGroup] - Age groups: "U14", "U16", "U18" (comma-separated string or array)
 * @param {string} [filters.standard="IPA"] - Standard: "IPA" or "IAP" (default: "IPA")
 * @returns {Promise<Object>} API response with group report data
 */
export function getGroupReport(groupId, filters = {}) {
  const queryParams = {
    person: "coach", // Required by backend auth middleware
  };

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
    `growth/groups/${groupId}/report`,
    queryParams
  );

  return fetchData(endpoint);
}

/**
 * Download PDF report for group analytics
 * Re-exported from utils for backward compatibility
 * @param {string} groupId - Group MongoDB ObjectId
 * @param {Object} [filters] - Filter options (same as getGroupReport)
 * @param {string} [filename] - Optional filename for the downloaded PDF (default: "growth-report.pdf")
 * @returns {Promise<void>}
 */
export { downloadGroupReportPDF } from "../utils/growth";

/**
 * Get all groups for the current coach
 * @returns {Promise<Object>} API response with list of groups
 */
export function getAllGroups() {
  // Backend endpoint: GET /api/growth/groups?person=coach
  const endpoint = buildUrlWithQueryParams("growth/groups", { person: "coach" });
  return fetchData(endpoint);
}

