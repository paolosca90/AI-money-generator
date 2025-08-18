import { useAuth } from "./useAuth";
import backend from "~backend/client";
import { isAPIError } from "../client";

// Returns an authenticated backend client for making API calls with enhanced error handling.
export function useBackend() {
  const { token, isAuthenticated, validateSession, logout } = useAuth();
  
  if (isAuthenticated && token) {
    const authenticatedClient = backend.with({
      auth: `Bearer ${token}`,
    });

    // Create a wrapper that handles authentication errors
    const createAuthenticatedMethod = (originalMethod: any) => {
      return async (...args: any[]) => {
        try {
          return await originalMethod(...args);
        } catch (error) {
          // Check if this is an authentication error
          if (isAPIError(error) && 
              (error.status === 401 || error.code === 'unauthenticated')) {
            
            // Try to validate the session first
            const isValid = await validateSession();
            if (!isValid) {
              // Session is invalid, force logout
              await logout();
              throw new Error("Your session has expired. Please log in again.");
            }
            
            // If session is valid, retry the original request
            try {
              return await originalMethod(...args);
            } catch (retryError) {
              // If retry fails, it's a genuine auth error
              await logout();
              throw new Error("Authentication failed. Please log in again.");
            }
          }
          
          // Re-throw non-authentication errors
          throw error;
        }
      };
    };

    // Wrap the analysis service methods
    return {
      ...authenticatedClient,
      analysis: {
        ...authenticatedClient.analysis,
        predict: createAuthenticatedMethod(authenticatedClient.analysis.predict.bind(authenticatedClient.analysis)),
        execute: createAuthenticatedMethod(authenticatedClient.analysis.execute.bind(authenticatedClient.analysis)),
        recordFeedback: createAuthenticatedMethod(authenticatedClient.analysis.recordFeedback.bind(authenticatedClient.analysis)),
        listPositions: createAuthenticatedMethod(authenticatedClient.analysis.listPositions.bind(authenticatedClient.analysis)),
        getPerformance: createAuthenticatedMethod(authenticatedClient.analysis.getPerformance.bind(authenticatedClient.analysis)),
        listHistory: createAuthenticatedMethod(authenticatedClient.analysis.listHistory.bind(authenticatedClient.analysis)),
      },
      user: {
        ...authenticatedClient.user,
        me: createAuthenticatedMethod(authenticatedClient.user.me.bind(authenticatedClient.user)),
        logout: createAuthenticatedMethod(authenticatedClient.user.logout.bind(authenticatedClient.user)),
        getPreferences: createAuthenticatedMethod(authenticatedClient.user.getPreferences.bind(authenticatedClient.user)),
        updatePreferences: createAuthenticatedMethod(authenticatedClient.user.updatePreferences.bind(authenticatedClient.user)),
        getMt5Config: createAuthenticatedMethod(authenticatedClient.user.getMt5Config.bind(authenticatedClient.user)),
        updateMt5Config: createAuthenticatedMethod(authenticatedClient.user.updateMt5Config.bind(authenticatedClient.user)),
        getSubscription: createAuthenticatedMethod(authenticatedClient.user.getSubscription.bind(authenticatedClient.user)),
      }
    };
  }

  return backend;
}
