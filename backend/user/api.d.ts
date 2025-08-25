export interface User {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
}
export interface UserPreferences {
    userId: number;
    riskPercentage: number;
    accountBalance: number;
    updatedAt: Date;
}
export interface Mt5Config {
    userId: number;
    host: string;
    port: number;
    login: string;
    server: string;
}
export interface Subscription {
    userId: number;
    plan: "free" | "pro" | "enterprise";
    status: "active" | "inactive" | "past_due";
    expiresAt: Date | null;
}
export declare const getPreferences: () => Promise<{
    preferences: UserPreferences | null;
}>;
export declare const updatePreferences: (params: {
    riskPercentage: number;
    accountBalance: number;
}) => Promise<{
    success: boolean;
}>;
export declare const getMt5Config: () => Promise<{
    config: Mt5Config | null;
}>;
export declare const updateMt5Config: (params: Omit<Mt5Config, "userId"> & {
    password?: string;
}) => Promise<{
    success: boolean;
}>;
export declare const getSubscription: () => Promise<{
    subscription: Subscription | null;
}>;
export declare const getMt5ConfigForUser: (params: {
    userId: number;
}) => Promise<{
    config: Mt5Config | null;
}>;
