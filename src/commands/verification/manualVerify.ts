import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField } from "discord.js";
import MongoDb from "../../utils/mongo";
import { ObjectId } from "mongodb";

export default class LookupCommand implements Command {
    name = "manualverify";
    description = "Manually verify a Discord user, bypassing the student email verification process.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to manually verify.")
                .setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        // Check if the user has admin permissions
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: "You do not have permission to use this command.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser("user", true);

        // Fetch the user's verification data from the database
        const verificationUser = await MongoDb.getInstance().getVerificationUser(user.id);
        if (!verificationUser) {
            return interaction.reply({
                content: "No data found for the specified user.",
                ephemeral: true
            });
        }

        const { email, verified, banned } = verificationUser;

        return interaction.reply({
            content: `User Information:
            - Discord ID: ${user.id}
            - Email: ${email || "Not provided"}
            - Verified: ${verified ? "Yes" : "No"}
            - Banned: ${banned ? "Yes" : "No"}`,
            ephemeral: true
        });
    }
}