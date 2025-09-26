import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

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
    email: string | undefined;
    verified: boolean;
    banned: boolean;
    verificationData: undefined | {
        code: number;
        expiresAt: number; // Unix timestamp in milliseconds
        lastAttemptAt: number; // Unix timestamp in milliseconds
    }
}

export interface VerificationUserCheck {
    verified: DBVerificationUser["verified"];
    banned: DBVerificationUser["banned"];
}