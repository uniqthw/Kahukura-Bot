// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    WebhookClient,
    PermissionFlagsBits,
    InteractionContextType,
    APIMessage,
    ChannelType,
    GuildChannel
} from "discord.js";
import { Command } from "../../../@types";
import settings from "../../utils/settings";

export default class SocialCommand implements Command {
    name = "socialpost";
    description =
        "Post the Association's social media posts to the Discord server.";
    slashCommand = new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addStringOption((option) =>
            option
                .setName("link")
                .setDescription(
                    "The link to the social media post, this will send the raw link to the webhook."
                )
                .setRequired(true)
        ) as SlashCommandBuilder;

    /*
        Execute is called when the interaction is used on Discord.
        Posts the specified link to the webhook defined in the settings and publishes it on the announcement channel.
    */
    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        const link = interaction.options.getString("link");

        if (!link)
            return interaction.reply({
                ephemeral: true,
                content: "Please provide a link to the social media post."
            });

        const webhook = new WebhookClient({
            url: settings.discord.webhook.socials
        });

        try {
            const webhookMessage = await webhook.send({
                content: link
            });

            await this.crosspost(webhookMessage.id, webhookMessage.channel_id, interaction);
        } catch (error) {
            console.error(
                "Failed to send social media post to webhook: ",
                error
            );
            webhook.destroy();

            return interaction.reply({
                ephemeral: true,
                content:
                    "Failed to send social media post to webhook. Please try again later."
            });
        }

        webhook.destroy();

        return interaction.reply({
            ephemeral: true,
            content:
                "The social media post URL has been published on the Discord server successfully."
        });
    }

    async crosspost(messageID: APIMessage["id"], channelID: GuildChannel["id"], interaction: ChatInputCommandInteraction): Promise<void> {
        const channel = await interaction.client.channels.fetch(channelID);

        if (!channel || channel.type !== ChannelType.GuildAnnouncement) {
            console.error("Invalid channel ID for crossposting.");
            return;
        }

        try {
            const message = await channel.messages.fetch(messageID);
            if (!message) {
                console.error("Message not found for crossposting.");
                return;
            }

            await message.crosspost();
            console.log("Message crossposted successfully.");
        } catch (error) {
            console.error("Failed to crosspost message: ", error);
        }
    }
}
