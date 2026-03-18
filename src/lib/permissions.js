// Permission management utilities

// Define tab permissions mapping
export const TAB_PERMISSIONS = {
  "statistics": 1, // Permission 1 = Meal Plan (for client data tabs)
  "meal": 1, // Permission 1 = Meal Plan
  "feed": 2, // Permission 2 = Feed
  "wallet": 3, // Permission 3 = Wallet
  "retail": 4, // Permission 4 = Retail
  "chats": 5, // Permission 5 = Chats
  "workout": 6, // Permission 6 = Workout
  "marathon": 7, // Permission 7 = Marathon
  "club": 8, // Permission 8 = Club
  "ai-agent": 8,
  "client-reports": 8,
  "case-file": 8
};

// Get user permissions from cookies
export function getUserPermissions() {
  if (typeof window === 'undefined') return [];
  
  try {
    const permissionsCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('userPermissions='));
    
    if (permissionsCookie) {
      const permissionsValue = permissionsCookie.split('=')[1];
      // Decode URL encoding and parse JSON
      const decodedValue = decodeURIComponent(permissionsValue);
      return JSON.parse(decodedValue);
    }
  } catch (error) {
    // Silently handle error
  }
  
  return [];
}

// Get user type from cookies
export function getUserType() {
  if (typeof window === 'undefined') return 'coach';
  
  try {
    const userTypeCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('userType='));
    
    if (userTypeCookie) {
      return userTypeCookie.split('=')[1];
    }
  } catch (error) {
    // Silently handle error
  }
  
  return 'coach';
}

export function getAppUserRole() {
  if (typeof window === "undefined") return null;
  try {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("appUserRole="));
    if (!cookie) return null;
    return decodeURIComponent(cookie.split("=")[1] || "") || null;
  } catch {
    return null;
  }
}

export function getUserScopes() {
  if (typeof window === "undefined") return [];
  try {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userScopes="));
    if (!cookie) return [];
    const raw = decodeURIComponent(cookie.split("=")[1] || "");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasScope(requiredScope) {
  const userType = getUserType();
  if (userType !== "user") return true;
  if (!requiredScope) return true;

  const scopes = getUserScopes();
  if (scopes.includes("all")) return true;
  return scopes.includes(requiredScope);
}

// Check if user has permission for a specific tab
export function hasTabPermission(tabName) {
  const userType = getUserType();
  
  // Coaches have access to all tabs
  if (userType === 'coach') {
    return true;
  }
  
  // For users, check their permissions
  if (userType === 'user') {
    const userPermissions = getUserPermissions();
    const requiredPermission = TAB_PERMISSIONS[tabName];
    
    // Check if user has the required permission
    return userPermissions.includes(requiredPermission);
  }
  
  return false;
}

// Filter tabs based on user permissions
export function filterTabsByPermissions(tabs) {
  return tabs.filter(tab => {
    // If tab has a showIf function, check it first
    if (tab.showIf && typeof tab.showIf === 'function') {
      return tab.showIf() && hasTabPermission(tab.value);
    }
    
    return hasTabPermission(tab.value);
  });
}

// Check if user is a coach
export function isCoach() {
  return getUserType() === 'coach';
}

// Check if user is a regular user
export function isUser() {
  return getUserType() === 'user';
}
