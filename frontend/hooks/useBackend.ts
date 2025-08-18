import { useAuth } from "./useAuth";
import backend from "~backend/client";

// Returns an authenticated backend client for making API calls.
export function useBackend() {
  const { token } = useAuth();
  
  if (!token) {
    // For public endpoints, no auth is needed.
    return backend;
  }

  // For authenticated endpoints, we pass the token.
  return backend.with({
    auth: `Bearer ${token}`,
  });
}
