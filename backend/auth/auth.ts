import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { userDB } from "../user/db";

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: number;
  email: string;
}

const auth = authHandler<AuthParams, AuthData>(
  async ({ authorization }) => {
    console.log("Auth handler called with authorization header present:", !!authorization);
    
    if (!authorization) {
      console.log("Auth handler: No authorization header found");
      throw APIError.unauthenticated("missing authorization header");
    }

    console.log("Auth handler: Authorization header value:", authorization);

    // Extract token from Authorization header
    let token = authorization;
    if (token.startsWith("Bearer ")) {
      token = token.substring(7); // Remove "Bearer " prefix
      console.log("Auth handler: Extracted Bearer token, length:", token.length);
    } else {
      console.log("Auth handler: Token without Bearer prefix, length:", token.length);
    }
    
    if (!token || token.trim() === "") {
      console.log("Auth handler: Empty token after extraction");
      throw APIError.unauthenticated("missing token");
    }

    try {
      console.log("Auth handler: Validating token in database, token starts with:", token.substring(0, 10));
      
      // Validate token and get user
      const session = await userDB.queryRow`
        SELECT u.id, u.email, s.expires_at
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${token}
      `;

      if (!session) {
        console.log("Auth handler: No session found for token");
        throw APIError.unauthenticated("invalid token - session not found");
      }

      // Check if session has expired
      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      if (expiresAt <= now) {
        console.log("Auth handler: Session expired at:", expiresAt);
        throw APIError.unauthenticated("token expired");
      }

      console.log("Auth handler: Valid session found for user:", session.id, "email:", session.email);
      return {
        userID: session.id,
        email: session.email,
      };
    } catch (err: any) {
      console.error("Auth handler: Database error:", err);
      if (err.code && err.code.startsWith('unauthenticated')) {
        throw err; // Re-throw authentication errors
      }
      throw APIError.unauthenticated("token validation failed", { reason: err.message });
    }
  }
);

// Configure the API gateway to use the auth handler.
export const gw = new Gateway({ authHandler: auth });
