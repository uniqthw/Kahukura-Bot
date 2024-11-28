import { ChatInputCommandInteraction, SlashCommandBuilder, Snowflake } from "discord.js";
import { ObjectId } from "mongodb";

// Defines an interface for the types for command classes
export interface Command {
    name: string;
    description?: string;
    slashCommand: SlashCommandBuilder;

    execute(interaction: ChatInputCommandInteraction): Promise<any>;
}

// Defined an interface for the types for the verification collection in the database (users attempting to verify)
export interface DBVerificationUser {
    _id: ObjectId;
    email: string | undefined;
    verified: boolean;
    lastest_attempt: {
        code: number | undefined;
        timestamp: number | undefined;
    }
}