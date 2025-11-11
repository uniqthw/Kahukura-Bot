// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../../@types";

export default class PrivacyCommand implements Command {
    name = "privacy";
    description = "View Kahukura Bot's privacy policy.";
    slashCommand = new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description);

    /*
        Execute is called when the interaction is used on Discord.
        Provides an emphemeral response with an embed of Kahukura Bot's privacy policy.
    */
    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        return interaction.reply({
            ephemeral: true,
            embeds: [
                {
                    title: "Kahukura Bot | Privacy Policy",
                    description:
                        '**"Association"** refers to The Queer Students\' Association of Te Herenga Waka Victoria University of Wellington Incorporated.',
                    color: 0xff5cb3,
                    fields: [
                        {
                            name: "🗃️ Information we collect",
                            value: "The personal information we collect from you is your contact information. You may opt-out of further information collection by leaving the Discord server.\n\nWe collect your personal information in order to:\n\n- verify that you are a student or staff member at Te Herenga Waka—Victoria University of Wellington; and\n- utilise the student or staff university email provided in verification to:\n  - internally cross-reference with our membership register for handling internal disputes and breaches of our Constitution, Bylaws, and Discord guidelines; and\n  - contact the university's Student Interest and Conflict Resolution team where harm occurs to another person; and\n  - where the student or staff member poses an immediate risk to the safety of themselves or others; and\n- any other reasonable purposes."
                        },
                        {
                            name: "👥 Sharing of information",
                            value: "Outside of the Association's officers and its Discord team, we may share this information with Te Herenga Waka—Victoria University of Wellington in order to:\n\n- take action when harm occurs that is required to be dealt with through the Student Interest and Conflict Resolution team; or \n- to take action where a person poses an imminent risk of harming themselves or others."
                        },
                        {
                            name: "ℹ️ Miscellaneous",
                            value: "We keep your information safe by storing it in a secured database and only allowing the Vice-President (Administration and Finance) direct access to the database.\n\nYou have the right to ask for a copy of any personal information we hold about you, and to ask for it to be corrected if you think it is wrong. If you'd like to ask for a copy of your information, or to have it corrected, please contact us at info@uniqthw.org.nz."
                        }
                    ]
                }
            ]
        });
    }
}
