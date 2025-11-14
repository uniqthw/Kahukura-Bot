// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../../@types";

export default class TermsCommand implements Command {
    name = "terms";
    description = "View Kahukura Bot's terms of use.";
    slashCommand = new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description);

    /*
        Execute is called when the interaction is used on Discord.
        Provides an emphemeral response with an embed of Kahukura Bot's terms of use.
    */
    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        return await interaction.reply({
            ephemeral: true,
            embeds: [
                {
                    title: "Kahukura Bot | Terms of Use",
                    description:
                        '### Last updated on 14 November 2025.\n**"Association"** refers to The Queer Students\' Association of Te Herenga Waka Victoria University of Wellington Incorporated.\n**"use"** includes both explicit use and implicit use of the bot.\n\n1. The Association operates the Kahukura Discord Bot ("bot"). For concerns regarding the bot, please contact the Association via email on [itadmin@uniqthw.org.nz](mailto:itadmin@uniqthw.org.nz).\n\n2. By being in the Association\'s Discord server, you agree that you understand and are bound by these terms of use. You may leave the Association\'s Discord server at any time if you no longer agree to the terms or the privacy policy of this bot.\n\n3. While using the bot, you agree to the terms and guidelines of the Discord platform owned by Discord, Inc.\n\n4. We reserve the right to revoke your access to the bot at any time, for any reason.\n\n5. We are not responsible for any malicious use of the bot by other users.\n\n6. Except where prohibited by law, by being in the Association\'s Discord server and your use of the bot, you indemnify and hold harmless us for from any actions, claims, losses, damages, liabilities and expenses including legal fees arising out of your use of the bot or your violation of these Terms of Use.\n\n7. We may amend these Terms of Use from time to time without any notice. Where an amendment occurs, we will update the "Effective date" listed at the top of these Terms of Use. It is the responsibility of you to regularly check these Terms of Use for any amendments, and you continue to be bound by any amendments if you continue to remain in the Association\'s Discord server or use the bot.\n\n8. If at any time any of the provisions set forth in these Terms of Use are found to be inconsistent or invalid under applicable laws, those provisions will be deemed void and removed from these Terms of Use. All other provisions will not be affected by the removal of the offending provision and the rest of these Terms of Use shall remain valid.',
                    color: 0xff5cb3
                }
            ]
        });
    }
}
