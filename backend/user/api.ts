import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { userDB } from "./db";

// User represents a user in our system.
export interface User {
  id: number;
  clerkId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  createdAt: Date;
}

// UserPreferences defines the user's trading settings.
export interface UserPreferences {
  userId: number;
  riskPercentage: number;
  accountBalance: number;
  updatedAt: Date;
}

// Mt5Config defines the user's MT5 connection details.
export interface Mt5Config {
  userId: number;
  host: string;
  port: number;
  login: string;
  server: string;
  // Password is not exposed in the API response for security
}

// Subscription defines the user's subscription plan.
export interface Subscription {
  userId: number;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "inactive" | "past_due";
  expiresAt: Date | null;
}

// findOrCreate finds a user by their Clerk ID or creates a new one.
// This is an internal endpoint called by the auth handler.
export const findOrCreate = api<{
  clerkId: string;
  email: string | null;
  imageUrl: string;
  firstName: string | null;
  lastName: string | null;
}, { user: User }>({
  method: "POST",
  path: "/user.findOrCreate",
  expose: false, // Internal use only
}, async (params) => {
  let user = await userDB.queryRow<User>`
    SELECT id, clerk_id, email, first_name, last_name, image_url, created_at
    FROM users WHERE clerk_id = ${params.clerkId}
  `;

  if (user) {
    return { user };
  }

  user = await userDB.queryRow<User>`
    INSERT INTO users (clerk_id, email, image_url, first_name, last_name)
    VALUES (${params.clerkId}, ${params.email}, ${params.imageUrl}, ${params.firstName}, ${params.lastName})
    RETURNING id, clerk_id, email, first_name, last_name, image_url, created_at
  `;

  if (!user) {
    throw APIError.internal("Failed to create user");
  }

  // Create default preferences and subscription for new user
  await userDB.exec`
    INSERT INTO user_preferences (user_id, risk_percentage, account_balance)
    VALUES (${user.id}, 2.0, 10000)
  `;
  await userDB.exec`
    INSERT INTO subscriptions (user_id, plan, status)
    VALUES (${user.id}, 'free', 'active')
  `;

  return { user };
});

// me returns the profile of the currently authenticated user.
export const me = api<void, { user: User | null }>({
  auth: true,
  method: "GET",
  path: "/user/me",
  expose: true,
}, async () => {
  const auth = getAuthData()!;
  const user = await userDB.queryRow<User>`
    SELECT id, clerk_id, email, first_name, last_name, image_url, created_at
    FROM users WHERE id = ${auth.userID}
  `;
  return { user };
});

// getPreferences returns the trading preferences for the authenticated user.
export const getPreferences = api<void, { preferences: UserPreferences | null }>({
  auth: true,
  method: "GET",
  path: "/user/preferences",
  expose: true,
}, async () => {
  const auth = getAuthData()!;
  const preferences = await userDB.queryRow<UserPreferences>`
    SELECT user_id, risk_percentage, account_balance, updated_at
    FROM user_preferences WHERE user_id = ${auth.userID}
  `;
  return { preferences };
});

// updatePreferences updates the trading preferences for the authenticated user.
export const updatePreferences = api<{ riskPercentage: number; accountBalance: number }, { success: boolean }>({
  auth: true,
  method: "POST",
  path: "/user/preferences",
  expose: true,
}, async (params) => {
  const auth = getAuthData()!;
  await userDB.exec`
    UPDATE user_preferences
    SET risk_percentage = ${params.riskPercentage}, account_balance = ${params.accountBalance}, updated_at = NOW()
    WHERE user_id = ${auth.userID}
  `;
  return { success: true };
});

// getMt5Config returns the MT5 configuration for the authenticated user.
export const getMt5Config = api<void, { config: Mt5Config | null }>({
  auth: true,
  method: "GET",
  path: "/user/mt5-config",
  expose: true,
}, async () => {
  const auth = getAuthData()!;
  const config = await userDB.queryRow<Mt5Config>`
    SELECT user_id, host, port, login, server
    FROM mt5_configurations WHERE user_id = ${auth.userID}
  `;
  return { config };
});

// getMt5ConfigForUser is an internal endpoint for services to get a user's MT5 config.
export const getMt5ConfigForUser = api<{ userId: number }, { config: (Mt5Config & { password?: string }) | null }>({
  auth: false, // Internal service call
  method: "POST",
  path: "/user.getMt5ConfigForUser",
  expose: false,
}, async ({ userId }) => {
  const config = await userDB.queryRow<Mt5Config & { password?: string }>`
    SELECT user_id, host, port, login, server, password
    FROM mt5_configurations WHERE user_id = ${userId}
  `;
  return { config };
});

// updateMt5Config updates the MT5 configuration for the authenticated user.
export const updateMt5Config = api<Omit<Mt5Config, "userId"> & { password?: string }, { success: boolean }>({
  auth: true,
  method: "POST",
  path: "/user/mt5-config",
  expose: true,
}, async (params) => {
  const auth = getAuthData()!;
  // In a real app, the password should be encrypted.
  // For simplicity, we're storing it as is, but this is NOT secure.
  await userDB.exec`
    INSERT INTO mt5_configurations (user_id, host, port, login, server, password)
    VALUES (${auth.userID}, ${params.host}, ${params.port}, ${params.login}, ${params.server}, ${params.password})
    ON CONFLICT (user_id) DO UPDATE SET
      host = EXCLUDED.host,
      port = EXCLUDED.port,
      login = EXCLUDED.login,
      server = EXCLUDED.server,
      password = EXCLUDED.password,
      updated_at = NOW()
  `;
  return { success: true };
});

// getSubscription returns the subscription status for the authenticated user.
export const getSubscription = api<void, { subscription: Subscription | null }>({
  auth: true,
  method: "GET",
  path: "/user/subscription",
  expose: true,
}, async () => {
  const auth = getAuthData()!;
  const subscription = await userDB.queryRow<Subscription>`
    SELECT user_id, plan, status, expires_at
    FROM subscriptions WHERE user_id = ${auth.userID}
  `;
  return { subscription };
});
