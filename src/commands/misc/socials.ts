// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { SlashCommandBuilder, ChatInputCommandInteraction, WebhookClient, PermissionFlagsBits } from "discord.js";
import { Command } from "../../../@types";
import settings from "../../../settings.json";

export default class SocialCommand implements Command {
    name = "socialpost";
    description = "Post the Association's social media posts to the Discord server.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addStringOption((option) =>
            option
                .setName("link")
                .setDescription(
                    "The link to the social media post, this will send the raw link to the webhook."
                )
                .setRequired(true)
        ) as SlashCommandBuilder);

    /*
        Execute is called when the interaction is used on Discord.
        Posts the specified link to the webhook defined in the settings and publishes it on the announcement channel.
    */
    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        const link = interaction.options.getString("link");

        if (!link) return interaction.reply({
            ephemeral: true,
            content: "Please provide a link to the social media post."
        });

        const webhook = new WebhookClient({ url: settings.discord.webhook.socials });

        try {
            await webhook.send({
                content: link
            });
        } catch (error) {
            console.error("Failed to send social media post to webhook: ", error);
            webhook.destroy();

            return interaction.reply({
                ephemeral: true,
                content: "Failed to send social media post to webhook. Please try again later."
            });
        }

        webhook.destroy();

        return interaction.reply({
            ephemeral: true,
            content: "The social media post URL has been published on the Discord server successfully."
        });
    }
}