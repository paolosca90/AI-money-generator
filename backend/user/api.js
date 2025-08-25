import { api } from "encore.dev/api";
// getPreferences returns the trading preferences for the demo user.
export const getPreferences = api({
    method: "GET",
    path: "/user/preferences",
    expose: true,
}, async () => {
    // Return demo preferences
    const preferences = {
        userId: 1,
        riskPercentage: 2.0,
        accountBalance: 9518.40, // Updated to match your actual MT5 balance
        updatedAt: new Date(),
    };
    return { preferences };
});
// updatePreferences updates the trading preferences for the demo user.
export const updatePreferences = api({
    method: "POST",
    path: "/user/preferences",
    expose: true,
}, async (params) => {
    // For demo purposes, just return success
    console.log("Demo: Updated preferences", params);
    return { success: true };
});
// getMt5Config returns the MT5 configuration for the demo user.
export const getMt5Config = api({
    method: "GET",
    path: "/user/mt5-config",
    expose: true,
}, async () => {
    // Return your actual VPS MT5 config
    const config = {
        userId: 1,
        host: "154.61.187.189", // Your actual VPS IP
        port: 8080,
        login: "6001637", // Your actual MT5 account
        server: "PureMGlobal-MT5", // Your actual server
    };
    return { config };
});
// updateMt5Config updates the MT5 configuration for the demo user.
export const updateMt5Config = api({
    method: "POST",
    path: "/user/mt5-config",
    expose: true,
}, async (params) => {
    // For demo purposes, just return success
    console.log("Demo: Updated MT5 config", params);
    return { success: true };
});
// getSubscription returns the subscription status for the demo user.
export const getSubscription = api({
    method: "GET",
    path: "/user/subscription",
    expose: true,
}, async () => {
    // Return demo subscription
    const subscription = {
        userId: 1,
        plan: "free",
        status: "active",
        expiresAt: null,
    };
    return { subscription };
});
// getMt5ConfigForUser returns the MT5 configuration for a specific user (used by scheduler).
export const getMt5ConfigForUser = api({
    method: "GET",
    path: "/user/mt5-config/:userId",
    expose: false, // Internal API for scheduler
}, async (params) => {
    // For demo purposes, return the same config for all users
    const config = {
        userId: params.userId,
        host: "154.61.187.189", // Your actual VPS IP
        port: 8080,
        login: "6001637", // Your actual MT5 account
        server: "PureMGlobal-MT5", // Your actual server
    };
    return { config };
});
//# sourceMappingURL=api.js.map