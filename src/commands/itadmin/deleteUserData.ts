import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import MongoDb from "../../utils/mongo";

export default class DeleteUserData implements Command {
    name = "delete";
    description = "Delete a user's data.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription(
                    "Select user to permanently delete all data."
                )
                .setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });

        if (interaction.user.id === "690866892448989225") {
            MongoDb.getInstance().deleteVerificationUserData(interaction.options.getUser("user", true).id);
            return interaction.editReply({
                content: "User data deleted."
            });
        }
    }
} 