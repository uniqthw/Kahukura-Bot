// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Command, ModLogActions } from "../../../@types";
import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
    InteractionContextType,
    userMention
} from "discord.js";

import ModLoggingHandler from "../../handlers/modLoggingHandler";

const modLoggingHandler = new ModLoggingHandler();

export default class BanCommand implements Command {
    name = "ban";
    description = "Ban a user from the server.";
    slashCommand = new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setContexts(InteractionContextType.Guild)
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Specify the user you are banning.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription(
                    "Please provide a justification for banning this user."
                )
                .setRequired(true)
        ) as SlashCommandBuilder;

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild)
            return await interaction.editReply(
                "This command needs to be executed within the server."
            );

        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);

        try {
            // Ban user
            await interaction.guild.members.ban(user.id, { reason });

            // Log moderation action
            await modLoggingHandler.logModAction(
                {
                    action: ModLogActions.BAN,
                    target: user,
                    moderator: interaction.user,
                    reason,
                    timestamp: Date.now()
                },
                interaction.client
            );

            return await interaction.editReply({
                content: `${userMention(user.id)} has been banned.`
            });
        } catch (err) {
            await interaction.editReply("Failed to ban user or log.");
            return console.error("Failed to ban user or log:", err);
        }
    }
}
