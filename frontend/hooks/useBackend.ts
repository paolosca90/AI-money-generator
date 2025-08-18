import { useAuth } from "./useAuth";
import backend from "~backend/client";

// Returns an authenticated backend client for making API calls.
export function useBackend() {
  const { token, isAuthenticated } = useAuth();
  
  // Debug logging
  console.log("useBackend - isAuthenticated:", isAuthenticated, "token exists:", !!token);
  
  // For authenticated endpoints, we pass the token in the Authorization header format.
  // The backend auth handler expects the token in the Authorization header.
  if (isAuthenticated && token) {
    console.log("useBackend - Using authenticated client with token length:", token.length, "token preview:", token.substring(0, 10) + "...");
    return backend.with({
      auth: `Bearer ${token}`,
    });
  }

  console.log("useBackend - Using unauthenticated client");
  // For public endpoints or when not authenticated
  return backend;
}
