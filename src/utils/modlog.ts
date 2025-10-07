import MongoDb, { ModLogEntry } from "./mongo";

export { ModLogEntry };

export async function logModAction(entry: ModLogEntry): Promise<void> {
    try {
        const db = MongoDb.getInstance();
        await db.insertModLog(entry);
        console.log(`Logged ${entry.action} action by ${entry.moderatorTag} on ${entry.targetTag}`);
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