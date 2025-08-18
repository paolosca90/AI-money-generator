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
    console.log("Auth handler called with authorization:", !!authorization);
    
    if (!authorization) {
      console.log("Auth handler: No authorization header");
      throw APIError.unauthenticated("missing authorization header");
    }

    // Extract token from Authorization header
    let token = authorization;
    if (token.startsWith("Bearer ")) {
      token = token.replace("Bearer ", "");
      console.log("Auth handler: Extracted Bearer token, length:", token.length);
    } else {
      console.log("Auth handler: Token without Bearer prefix, length:", token.length);
    }
    
    if (!token) {
      console.log("Auth handler: Empty token after extraction");
      throw APIError.unauthenticated("missing token");
    }

    try {
      console.log("Auth handler: Validating token in database");
      // Validate token and get user
      const session = await userDB.queryRow`
        SELECT u.id, u.email
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${token} AND s.expires_at > NOW()
      `;

      if (!session) {
        console.log("Auth handler: No valid session found for token");
        throw APIError.unauthenticated("invalid or expired token");
      }

      console.log("Auth handler: Valid session found for user:", session.id);
      return {
        userID: session.id,
        email: session.email,
      };
    } catch (err: any) {
      console.error("Auth handler: Database error:", err);
      throw APIError.unauthenticated("invalid token", { reason: err.message });
    }
  }
);

// Configure the API gateway to use the auth handler.
export const gw = new Gateway({ authHandler: auth });
