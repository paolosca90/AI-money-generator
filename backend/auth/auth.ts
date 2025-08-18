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
      token = token.replace("Bearer ", "");
    }
    
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      // Validate token and get user
      const session = await userDB.queryRow`
        SELECT u.id, u.email
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${token} AND s.expires_at > NOW()
      `;

      if (!session) {
        throw APIError.unauthenticated("invalid or expired token");
      }

      return {
        userID: session.id,
        email: session.email,
      };
    } catch (err: any) {
      throw APIError.unauthenticated("invalid token", { reason: err.message });
    }
  }
);

// Configure the API gateway to use the auth handler.
export const gw = new Gateway({ authHandler: auth });
