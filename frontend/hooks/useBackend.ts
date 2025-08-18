import { useAuth } from "./useAuth";
import backend from "~backend/client";

// Returns an authenticated backend client for making API calls.
export function useBackend() {
  const { token, isAuthenticated } = useAuth();
  
  if (isAuthenticated && token) {
    return backend.with({
      auth: `Bearer ${token}`,
    });
  }

  return backend;
}
