import { getUserType } from "../permissions";
import { fetchData } from "../api";

let freshClientIdsPromise = null;
let lastFetchTime = 0;

async function getFreshClientIds() {
  const now = Date.now();
  // Cache for 1 minute to avoid excessive API calls while staying reasonably fresh
  if (freshClientIdsPromise && (now - lastFetchTime < 60000)) {
    return freshClientIdsPromise;
  }

  freshClientIdsPromise = (async () => {
    try {
      if (typeof window === 'undefined') return [];

      const userDataStr = localStorage.getItem("userData");
      if (!userDataStr) return [];

      const userData = JSON.parse(userDataStr);
      const subUserId = userData._id;
      if (!subUserId) return [];

      // Fetch fresh assignments from the backend
      const response = await fetchData(`app/users/assignments/${subUserId}/clients?page=1&limit=1000`);

      if (response && response.status_code === 200 && response.data) {
        lastFetchTime = Date.now();
        return (response.data.clients || []).map(client => String(client._id || client.id));
      }
      return [];
    } catch (error) {
      console.error("Error fetching fresh client IDs:", error);
      freshClientIdsPromise = null;
      return [];
    }
  })();

  return freshClientIdsPromise;
}

export function withClientFilter(originalFetcher) {
  return async function filteredFetcher(...args) {
    try {
      const userType = getUserType();

      if (userType === "coach") {
        return await originalFetcher(...args);
      }

      if (userType === "user") {
        // Fetch fresh client IDs from the backend instead of using potentially stale cookies
        const assignedClientIds = await getFreshClientIds();

        // If no assigned clients, return empty data
        if (assignedClientIds.length === 0) {
          const response = await originalFetcher(...args);
          if (response && response.status_code === 200 && response.data) {
            if (Array.isArray(response.data)) {
              response.data = [];
            } else {
              if (response.data.clients) response.data.clients = [];
              if (response.data.assignedClients) response.data.assignedClients = [];
              if (response.data.notAssignedClients) response.data.notAssignedClients = [];
              if (response.data.unassignedClients) response.data.unassignedClients = [];
              if (response.data.assignedToOtherPlans) response.data.assignedToOtherPlans = [];
            }
          }
          return response;
        }

        const response = await originalFetcher(...args);

        if (response && response.status_code === 200 && response.data) {
          try {
            const filterClients = (clients) => {
              if (!Array.isArray(clients)) return [];
              return clients.filter(client => {
                const clientId = String(client._id || client.id);
                return assignedClientIds.includes(clientId);
              });
            };

            if (Array.isArray(response.data)) {
              response.data = filterClients(response.data);
            } else {
              // Filter different client arrays in the response
              if (response.data.clients) {
                response.data.clients = filterClients(response.data.clients);
              }

              if (response.data.assignedClients) {
                response.data.assignedClients = filterClients(response.data.assignedClients);
              }

              if (response.data.notAssignedClients) {
                response.data.notAssignedClients = filterClients(response.data.notAssignedClients);
              }

              if (response.data.unassignedClients) {
                response.data.unassignedClients = filterClients(response.data.unassignedClients);
              }

              if (response.data.assignedToOtherPlans) {
                response.data.assignedToOtherPlans = filterClients(response.data.assignedToOtherPlans);
              }
            }
          } catch (error) {
            if (Array.isArray(response.data)) {
              response.data = [];
            } else {
              if (response.data.clients) response.data.clients = [];
              if (response.data.assignedClients) response.data.assignedClients = [];
              if (response.data.notAssignedClients) response.data.notAssignedClients = [];
              if (response.data.unassignedClients) response.data.unassignedClients = [];
              if (response.data.assignedToOtherPlans) response.data.assignedToOtherPlans = [];
            }
          }
        }

        return response;
      }

      // Default case - no filtering
      return await originalFetcher(...args);
    } catch (error) {
      return {
        status_code: 500,
        message: "Error in client filtering",
        data: []
      };
    }
  };
}

export function createFilteredFetcher(originalFetcher) {
  return withClientFilter(originalFetcher);
}
