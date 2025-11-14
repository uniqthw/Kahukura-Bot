// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import MongoDb, { ModLogEntry } from "./mongo";

export { ModLogEntry };

/**
 * Persist a moderation log entry to the database.
 *
 * If storing fails, the error is logged to the console and not propagated.
 *
 * @param entry - The moderation log entry to persist.
 */
export async function logModAction(entry: ModLogEntry): Promise<void> {
    try {
        const db = MongoDb.getInstance();
        await db.insertModLog(entry);
    } catch (error) {
        console.error("Failed to log moderation action:", error);
    }
}

export async function getModLogs(targetId?: string, limit: number = 10): Promise<ModLogEntry[]> {
    try {
        const db = MongoDb.getInstance();
        return await db.getModLogs(targetId, limit);
    } catch (error) {
        console.error("Failed to retrieve moderation logs:", error);
        return [];
    }
}