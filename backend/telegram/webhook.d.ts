interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            username?: string;
        };
        chat: {
            id: number;
            type: string;
        };
        date: number;
        text?: string;
    };
    callback_query?: {
        id: string;
        from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            username?: string;
        };
        message?: {
            message_id: number;
            chat: {
                id: number;
                type: string;
            };
            date: number;
        };
        data?: string;
    };
}
interface WebhookResponse {
    ok: boolean;
}
export declare const webhook: (params: TelegramUpdate) => Promise<WebhookResponse>;
export {};
