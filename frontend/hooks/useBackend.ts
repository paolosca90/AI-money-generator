import { useAuth } from "./useAuth";
import backend from "~backend/client";

// Returns an authenticated backend client for making API calls.
export function useBackend() {
  const { token, isAuthenticated } = useAuth();
  
  // Always return the backend client, but with auth if available
  if (!isAuthenticated || !token) {
    // For public endpoints or when not authenticated
    return backend;
  }

  // For authenticated endpoints, we pass the token in the Authorization header format.
  // The backend auth handler expects the token in the Authorization header.
  return backend.with({
    auth: `Bearer ${token}`,
  });
}
