import { ChatInputCommandInteraction, SlashCommandBuilder, Snowflake, User } from "discord.js";

// Defines an interface for the types for command classes
export interface Command {
    name: string;
    description?: string;
    slashCommand: SlashCommandBuilder;

    execute(interaction: ChatInputCommandInteraction): Promise<any>;
}

// Defined an interface for the types for the verification collection in the database (users attempting to verify)
export interface DBVerificationUser {
    // Use Discord Snowflake string IDs for _id instead of MongoDB ObjectId.
    _id: string;
    email?: string;
    oldEmail?: string;
    verified: boolean;
    banned: boolean;
    verificationData?: {
        code: number;
        expiresAt: number; // Unix timestamp in milliseconds
        lastAttemptAt: number; // Unix timestamp in milliseconds
    }
    manualVerificationData?: {
        verified: boolean;
        reason: string;
        executorId: string;
        executedAt: number;
    }
    lastDataRequest?: number;
}

// Defined an interface for the verification cache message
export interface VerificationMessageCache {
    // Use Discord Snowflake string IDs for _id instead of MongoDb ObjectId.
    _id: string;
    messageId: string;
}

export interface VerificationUserCheck {
    verified: DBVerificationUser["verified"];
    banned: DBVerificationUser["banned"];
}

export interface DBModLogEntry {
    _id?: string;
    action: ModLogActions;
    targetId: string;
    moderatorId: string;
    reason: string;
    timestamp: number;
    duration?: {
        length?: number,
        expiry?: number
    }
}

export interface ModLogEntry {
    _id?: string;
    action: ModLogActions;
    target: User;
    moderator: User;
    reason: string;
    timestamp: number;
    duration?: {
        length?: number,
        expiry?: number
    }
}

export enum ModLogActions {
    BAN = "Ban",
    KICK = "Kick",
    TIMEOUT = "Timeout",
    UNBAN = "Unban",
    UNTIMEOUT = "Untimeout",
    WARN = "Warn"
}

// action: "ban",
// targetId: user.id,
// moderatorId: interaction.user.id,
// reason,
// timestamp: Date.now(),
// guildId: interaction.guild?.id || ""