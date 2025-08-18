import { useAuth } from "@clerk/clerk-react";
import backend from "~backend/client";

// Returns an authenticated backend client for making API calls.
export function useBackend() {
  const { getToken, isSignedIn } = useAuth();
  
  if (!isSignedIn) {
    // For public endpoints, no auth is needed.
    return backend;
  }

  // For authenticated endpoints, we pass the token as an object
  // to explicitly set the Authorization header. This is the most robust way.
  return backend.with({
    auth: async () => {
      const token = await getToken();
      if (!token) {
        // This can happen if the session expires. Returning null will cause
        // the request to be sent without auth, which will fail on the backend
        // with an unauthenticated error, which is the correct behavior.
        return null;
      }
      // Explicitly set the header. This avoids ambiguity about whether
      // Encore adds the "Bearer" prefix automatically.
      return { Authorization: `Bearer ${token}` };
    },
  });
}
