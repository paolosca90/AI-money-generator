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
    if (!authorization) {
      throw APIError.unauthenticated("missing authorization header");
    }

    // Extract token from Authorization header
    let token = authorization;
    if (token.startsWith("Bearer ")) {
      token = token.substring(7); // Remove "Bearer " prefix
    }
    
    if (!token || token.trim() === "") {
      throw APIError.unauthenticated("missing token");
    }

    try {
      // Validate token and get user
      const session = await userDB.queryRow`
        SELECT u.id, u.email, s.expires_at
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${token}
      `;

      if (!session) {
        throw APIError.unauthenticated("invalid token");
      }

      // Check if session has expired
      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      if (expiresAt <= now) {
        throw APIError.unauthenticated("token expired");
      }

      return {
        userID: session.id,
        email: session.email,
      };
    } catch (err: any) {
      if (err.code && err.code.startsWith('unauthenticated')) {
        throw err;
      }
      throw APIError.unauthenticated("token validation failed");
    }
  }
);

// Configure the API gateway to use the auth handler.
export const gw = new Gateway({ authHandler: auth });
