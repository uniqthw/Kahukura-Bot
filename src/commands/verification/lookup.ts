import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField } from "discord.js";
import MongoDb from "../../utils/mongo";

export default class LookupCommand implements Command {
    name = "lookup";
    description = "Lookup a user's email, Discord ID, and key statuses (ban and verification status).";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to lookup.")
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