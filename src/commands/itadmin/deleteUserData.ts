// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Command } from "../../../@types";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Interaction, InteractionContextType, SlashCommandBuilder, userMention } from "discord.js";
import MongoDb from "../../utils/mongo";
import { isITAdmin } from "../../utils/roleCheck";

export default class DeleteUserDataCommand implements Command {
    name = "deletedata";
    description = "Delete a user's data.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setContexts(InteractionContextType.Guild)
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription(
                    "Specify the user you are permanently deleting data from."
                )
                .setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });

        // Check if the user has admin permissions
        if (!isITAdmin(interaction.user)) {
            return await interaction.editReply({
                content: "You do not have permission to use this command."
            });
        }

        const user = interaction.options.getUser("user", true);

        const verificationUser = await MongoDb.getInstance().getVerificationUser(user.id);

        if (!verificationUser) return await interaction.editReply({
            content: "This user is not in the database."
        });

        // Builds the button components for the confirmation message
        const confirmButton = new ButtonBuilder().setCustomId("confirm").setLabel("Confirm Deletion").setStyle(ButtonStyle.Danger);
        const cancelButton = new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary);
        const componentsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton, confirmButton);

        const verifyDeletionRequestResponse = await interaction.editReply({
            content: `Are you sure you want to delete ${userMention(user.id)}'s data from the verification database? This decision is irreversible, and if they are currently within the server they will be kicked.`,
            components: [ componentsRow ]
        });

        const collectionFilter = (i: Interaction) => i.user.id === interaction.user.id;

        try {
            const confirmation = await verifyDeletionRequestResponse.awaitMessageComponent({ filter: collectionFilter, time: 60_000 })

            if (confirmation.customId === "confirm") {
                await confirmation.deferUpdate();

                try {
                    await MongoDb.getInstance().deleteVerificationUserData(user.id);
                } catch (error) {
                    await confirmation.editReply({ content: "An error occurred whilst deleting the user's data.", components: []  })
                    return console.error("An error occurred whilst deleting a user's data:", error);
                }

                try {
                    const member = await interaction.guild?.members.fetch(user);

                    if (member && member.kickable) await member.kick("User's data was deleted from the verification database");
                } catch (error) {
                    console.error("An error occurred whilst attempting to kick a user whose data has been deleted:", error);
                }

                await confirmation.editReply({ content: "Action confirmed. Data has been deleted.", components: []  })
            } else if (confirmation.customId === "cancel") {
                await confirmation.update({ content: "Action cancelled.", components: [] });
            }
        } catch (error) {
            await interaction.editReply({ content: "Confirmation was not received within 1 minute, cancelling deletion.", components: [] });
        }
    }
} 