export interface ClientConfig {
    id: number;
    userId: number;
    subscriptionType: "basic" | "premium" | "enterprise";
    features: string[];
    expiryDate: Date;
    maxVpsConfigurations: number;
    maxMt5Accounts: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ClientSubscription {
    userId: number;
    subscriptionType: "basic" | "premium" | "enterprise";
    features: string[];
    durationDays: number;
}
export declare const createClientSubscription: (params: ClientSubscription) => Promise<{
    success: boolean;
    message: string;
}>;
export declare const getClientConfig: (params: {
    userId: number;
}) => Promise<{
    config: ClientConfig | null;
}>;
export declare function checkClientFeature(userId: number, feature: string): Promise<boolean>;
export declare function handleClientCommands(chatId: number, userId: number, command: string): Promise<void>;
