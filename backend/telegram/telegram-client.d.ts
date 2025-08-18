interface TelegramFile {
    file_id: string;
    file_unique_id: string;
    file_size?: number;
    file_path?: string;
}
export declare function sendMessage(chatId: number, text: string, options?: {
    parseMode?: "Markdown" | "HTML";
    disableWebPagePreview?: boolean;
    replyMarkup?: any;
}): Promise<void>;
export declare function sendPhoto(chatId: number, photoUrl: string, caption?: string, options?: {
    parseMode?: "Markdown" | "HTML";
    replyMarkup?: any;
}): Promise<void>;
export declare function sendDocument(chatId: number, documentUrl: string, caption?: string): Promise<void>;
export declare function editMessage(chatId: number, messageId: number, text: string, options?: {
    parseMode?: "Markdown" | "HTML";
    replyMarkup?: any;
}): Promise<void>;
export declare function setWebhook(webhookUrl: string, options?: {
    maxConnections?: number;
    allowedUpdates?: string[];
    secretToken?: string;
}): Promise<void>;
export declare function deleteWebhook(): Promise<void>;
export declare function getWebhookInfo(): Promise<any>;
export declare function getFile(fileId: string): Promise<TelegramFile | null>;
export declare function downloadFile(filePath: string): Promise<Buffer | null>;
export declare function createInlineKeyboard(buttons: Array<Array<{
    text: string;
    callback_data?: string;
    url?: string;
}>>): any;
export declare function createReplyKeyboard(buttons: Array<Array<string>>, options?: {
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
    selective?: boolean;
}): any;
export declare function removeKeyboard(): any;
export {};
