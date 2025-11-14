import { Command } from "../../../@types";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Interaction, SlashCommandBuilder, userMention } from "discord.js";
import MongoDb from "../../utils/mongo";

export default class DeleteUserDataCommand implements Command {
    name = "deletedata";
    description = "Delete a user's data.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription(
                    "Specify the user you are permanently deleting data from."
                )
                .setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        const user = interaction.options.getUser("user", true);

        await interaction.deferReply({ ephemeral: true });

        const verificationUser = await MongoDb.getInstance().getVerificationUser(user.id);

        if (!verificationUser) return await interaction.editReply({
            content: "This user is not in the database."
        });

        const confirmButton = new ButtonBuilder().setCustomId("confirm").setLabel("Confirm Deletion").setStyle(ButtonStyle.Danger);
        const cancelButton = new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary);
        const componentsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton, confirmButton);

        const verifyDeletionRequestResponse = await interaction.editReply({
            content: `Are you sure you want to delete <@${user.id}>'s data from the verification database? This decision is irreversible, and if they are currently within the server they will be kicked.`,
            components: [ componentsRow ]
        });

        const collectionFilter = (i: Interaction) => i.user.id === interaction.user.id;

        try {
            const confirmation = await verifyDeletionRequestResponse.awaitMessageComponent({ filter: collectionFilter, time: 60_000 })

            if (confirmation.customId === "confirm") {
                try {
                    await MongoDb.getInstance().deleteVerificationUserData(user.id);
                } catch (error) {
                    await confirmation.update({ content: "An error occurred whilst deleting the user's data.", components: []  })
                    console.error("An error occurred whilst deleting a user's data:", error);
                }

                try {
                    const member = await interaction.guild?.members.fetch(user);

                    if (member && member.kickable) member.kick("User's data was deleted from the verification database");
                } catch (error) {
                    console.error("An error occurred whilst attempting to kick a user whose data has been deleted:", error);
                }

                await confirmation.update({ content: "Action confirmed. Data has has been deleted.", components: []  })
            } else if (confirmation.customId === "cancel") {
                await confirmation.update({ content: "Action cancelled.", components: [] });
            }
        } catch (error) {
            await interaction.editReply({ content: "Confirmation was not received within 1 minute, cancelling deletion.", components: [] });
        }
    }
} 