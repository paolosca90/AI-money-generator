import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { userDB } from "./db";
import { createHash } from "crypto";

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

interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

// register creates a new user account.
export const register = api<RegisterRequest, AuthResponse>({
  method: "POST",
  path: "/user/register",
  expose: true,
}, async (params) => {
  const { email, password, firstName, lastName } = params;

  if (!email || !password) {
    throw APIError.invalidArgument("Email and password are required");
  }

  // Check if user already exists
  const existingUser = await userDB.queryRow`
    SELECT id FROM users WHERE email = ${email}
  `;

  if (existingUser) {
    throw APIError.alreadyExists("User with this email already exists");
  }

  // Hash password
  const passwordHash = createHash('sha256').update(password).digest('hex');

  // Create user
  const user = await userDB.queryRow<User>`
    INSERT INTO users (email, password_hash, first_name, last_name)
    VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName})
    RETURNING id, email, first_name, last_name, created_at
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

  // Generate simple token (in production, use JWT)
  const token = createHash('sha256').update(`${user.id}-${Date.now()}`).digest('hex');
  
  // Store session
  await userDB.exec`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (${user.id}, ${token}, NOW() + INTERVAL '30 days')
  `;

  return { user, token };
});

// login authenticates a user and returns a token.
export const login = api<LoginRequest, AuthResponse>({
  method: "POST",
  path: "/user/login",
  expose: true,
}, async (params) => {
  const { email, password } = params;

  if (!email || !password) {
    throw APIError.invalidArgument("Email and password are required");
  }

  // Hash password
  const passwordHash = createHash('sha256').update(password).digest('hex');

  // Find user
  const user = await userDB.queryRow<User & { password_hash: string }>`
    SELECT id, email, first_name, last_name, created_at, password_hash
    FROM users WHERE email = ${email}
  `;

  if (!user || user.password_hash !== passwordHash) {
    throw APIError.unauthenticated("Invalid email or password");
  }

  // Generate simple token
  const token = createHash('sha256').update(`${user.id}-${Date.now()}`).digest('hex');
  
  // Store session
  await userDB.exec`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (${user.id}, ${token}, NOW() + INTERVAL '30 days')
  `;

  return { 
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at
    }, 
    token 
  };
});

// logout invalidates the current session.
export const logout = api<void, { success: boolean }>({
  auth: true,
  method: "POST",
  path: "/user/logout",
  expose: true,
}, async () => {
  const auth = getAuthData()!;
  
  // Delete current session
  await userDB.exec`
    DELETE FROM user_sessions WHERE user_id = ${auth.userID}
  `;

  return { success: true };
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
    SELECT id, email, first_name, last_name, created_at
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
