export interface VPSConfig {
    userId: number;
    vpsProvider: string;
    vpsHost: string;
    vpsUsername: string;
    vpsPassword: string;
    mt5Login: string;
    mt5Password: string;
    mt5Server: string;
    status: "pending" | "configuring" | "active" | "error";
    createdAt: Date;
    updatedAt: Date;
}
export interface MT5Config {
    login: string;
    password: string;
    server: string;
}
export interface VPSStatusResponse {
    config: VPSConfig | null;
}
export declare const storeVPSConfig: (params: {
    userId: number;
    vpsHost: string;
    vpsUsername: string;
    vpsPassword: string;
    mt5Config: MT5Config;
}) => Promise<{
    success: boolean;
    message: string;
}>;
export declare const getVPSStatus: (params: {
    userId: number;
}) => Promise<VPSStatusResponse>;
export declare function handleVPSCommand(chatId: number, userId: number, command: string): Promise<void>;
export interface VPSSetupState {
    userId: number;
    step: "provider" | "host" | "credentials" | "mt5_login" | "mt5_password" | "mt5_server" | "confirm";
    data: {
        provider?: string;
        host?: string;
        username?: string;
        password?: string;
        mt5Login?: string;
        mt5Password?: string;
        mt5Server?: string;
    };
}
export declare function handleVPSSetup(chatId: number, userId: number, message?: string): Promise<void>;
export declare function handleVPSSetupCallback(chatId: number, userId: number, callbackData: string): Promise<void>;
