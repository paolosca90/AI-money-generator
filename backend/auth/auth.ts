import { createClerkClient } from "@clerk/backend";
import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import { user } from "~encore/clients";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: number; // Our internal user ID
  clerkUserID: string;
  email: string | null;
  imageUrl: string;
}

// Configure the authorized parties.
// TODO: Configure this for your own domain when deploying to production.
const AUTHORIZED_PARTIES = [
  "https://*.lp.dev",
  "http://localhost:5173"
];

const auth = authHandler<AuthParams, AuthData>(
  async ({ authorization }) => {
    const token = authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const verifiedToken = await clerkClient.verifyToken(token, {
        authorizedParties: AUTHORIZED_PARTIES,
        secretKey: clerkSecretKey(),
      });

      const clerkUser = await clerkClient.users.getUser(verifiedToken.sub);
      
      // Find or create the user in our database
      const { user: appUser } = await user.findOrCreate({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
        imageUrl: clerkUser.imageUrl,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
      });

      return {
        userID: appUser.id,
        clerkUserID: clerkUser.id,
        email: appUser.email,
        imageUrl: appUser.imageUrl,
      };
    } catch (err: any) {
      throw APIError.unauthenticated("invalid token", { reason: err.message });
    }
  }
);

// Configure the API gateway to use the auth handler.
export const gw = new Gateway({ authHandler: auth });
