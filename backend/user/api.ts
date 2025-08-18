import { api, APIError } from "encore.dev/api";

// User represents a user in our system.
export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
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

// getPreferences returns the trading preferences for the demo user.
export const getPreferences = api<void, { preferences: UserPreferences | null }>({
  method: "GET",
  path: "/user/preferences",
  expose: true,
}, async () => {
  // Return demo preferences
  const preferences: UserPreferences = {
    userId: 1,
    riskPercentage: 2.0,
    accountBalance: 10000,
    updatedAt: new Date(),
  };
  return { preferences };
});

// updatePreferences updates the trading preferences for the demo user.
export const updatePreferences = api<{ riskPercentage: number; accountBalance: number }, { success: boolean }>({
  method: "POST",
  path: "/user/preferences",
  expose: true,
}, async (params) => {
  // For demo purposes, just return success
  console.log("Demo: Updated preferences", params);
  return { success: true };
});

// getMt5Config returns the MT5 configuration for the demo user.
export const getMt5Config = api<void, { config: Mt5Config | null }>({
  method: "GET",
  path: "/user/mt5-config",
  expose: true,
}, async () => {
  // Return demo MT5 config
  const config: Mt5Config = {
    userId: 1,
    host: "localhost",
    port: 8080,
    login: "demo",
    server: "demo",
  };
  return { config };
});

// updateMt5Config updates the MT5 configuration for the demo user.
export const updateMt5Config = api<Omit<Mt5Config, "userId"> & { password?: string }, { success: boolean }>({
  method: "POST",
  path: "/user/mt5-config",
  expose: true,
}, async (params) => {
  // For demo purposes, just return success
  console.log("Demo: Updated MT5 config", params);
  return { success: true };
});

// getSubscription returns the subscription status for the demo user.
export const getSubscription = api<void, { subscription: Subscription | null }>({
  method: "GET",
  path: "/user/subscription",
  expose: true,
}, async () => {
  // Return demo subscription
  const subscription: Subscription = {
    userId: 1,
    plan: "free",
    status: "active",
    expiresAt: null,
  };
  return { subscription };
});
