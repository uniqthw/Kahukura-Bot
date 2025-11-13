// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { SlashCommandBuilder, ChatInputCommandInteraction, WebhookClient } from "discord.js";
import { Command } from "../../../@types";
import settings from "../../../settings.json";
import { Command } from "../../../@types";

export default class SocialCommand implements Command {
    name = "socialpost";
    description = "Post the Association's social media posts to the Discord server.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
            option
                .setName("link")
                .setDescription("The link to the social media post (Instagram, Tiktok, etc). This will send the raw link to the webhook and Discord will take care of embedding it.")
                .setRequired(true)
        ));

    /*
        Execute is called when the interaction is used on Discord.
        Posts the specified link to the webhook defined in the settings and publishes it on the announcement channel.
    */
    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        const link = interaction.options.getString("link");

        if (!link) return;

        const webhook = new WebhookClient({ url: settings.webhook.socials });

        await webhook.send({
            content: link
        });

        return interaction.reply({
            ephemeral: true,
            content: "The social media post URL has been published on the Discord server successfully."
        });
    }
}