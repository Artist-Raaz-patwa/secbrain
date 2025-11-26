import { db } from '../firebase';
import { LogCategory, LogLevel } from '../types';

export class LoggerService {
    static async log(
        userId: string,
        category: LogCategory,
        level: LogLevel,
        message: string,
        details?: string
    ) {
        if (!userId) return;

        try {
            await db.collection('system_logs').add({
                userId,
                timestamp: Date.now(),
                category,
                level,
                message,
                details: details || ''
            });
        } catch (error) {
            console.error("Critical: Failed to write system log", error);
        }
    }

    static info(userId: string, category: LogCategory, message: string, details?: string) {
        return this.log(userId, category, 'INFO', message, details);
    }

    static success(userId: string, category: LogCategory, message: string, details?: string) {
        return this.log(userId, category, 'SUCCESS', message, details);
    }

    static warn(userId: string, category: LogCategory, message: string, details?: string) {
        return this.log(userId, category, 'WARN', message, details);
    }

    static error(userId: string, category: LogCategory, message: string, details?: string) {
        return this.log(userId, category, 'ERROR', message, details);
    }
}