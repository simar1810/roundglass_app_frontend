import { getUserType } from "../permissions";

export function withClientFilter(originalFetcher) {
  return async function filteredFetcher(...args) {
    try {
      const userType = getUserType();
      
      if (userType === "coach") {
        return await originalFetcher(...args);
      }
      
      if (userType === "user") {
        const clientIdsCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('userClientIds='))
          ?.split('=')[1];
        
        let assignedClientIds = [];
        
        if (clientIdsCookie) {
          try {
            assignedClientIds = JSON.parse(decodeURIComponent(clientIdsCookie));
          } catch (error) {
            assignedClientIds = [];
          }
        }
        
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
            if (Array.isArray(response.data)) {
              response.data = response.data.filter(client => 
                assignedClientIds.includes(client._id)
              );
            } else {
              if (response.data.clients) {
                response.data.clients = response.data.clients.filter(client => 
                  assignedClientIds.includes(client._id)
                );
              }
              
              if (response.data.assignedClients) {
                response.data.assignedClients = response.data.assignedClients.filter(client => 
                  assignedClientIds.includes(client._id)
                );
              }
              
              if (response.data.notAssignedClients) {
                response.data.notAssignedClients = response.data.notAssignedClients.filter(client => 
                  assignedClientIds.includes(client._id)
                );
              }
              
              if (response.data.unassignedClients) {
                response.data.unassignedClients = response.data.unassignedClients.filter(client => 
                  assignedClientIds.includes(client._id)
                );
              }
              
              if (response.data.assignedToOtherPlans) {
                response.data.assignedToOtherPlans = response.data.assignedToOtherPlans.filter(client => 
                  assignedClientIds.includes(client._id)
                );
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
