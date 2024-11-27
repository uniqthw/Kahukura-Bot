import { ChatInputCommandInteraction, SlashCommandBuilder, Snowflake } from "discord.js";

// Defines an interface for the types for command classes
export interface Command {
    name: string;
    description?: string;
    slashCommand: SlashCommandBuilder;

    execute(interaction: ChatInputCommandInteraction): Promise<any>;
}

// will need types for databases