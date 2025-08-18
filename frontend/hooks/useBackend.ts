import { useAuth } from "@clerk/clerk-react";
import backend from "~backend/client";

// Returns an authenticated backend client for making API calls.
export function useBackend() {
  const { getToken, isSignedIn } = useAuth();
  
  if (!isSignedIn) {
    // For public endpoints, no auth is needed.
    return backend;
  }

  // For authenticated endpoints, we pass the token.
  return backend.with({
    auth: async () => {
      const token = await getToken();
      if (!token) {
        // Handle case where token is not available, though this is unlikely for a signed-in user.
        return null;
      }
      return { Authorization: `Bearer ${token}` };
    },
  });
}
