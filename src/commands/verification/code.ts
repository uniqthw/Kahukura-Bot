import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import MongoDb from "../../utils/mongo";
import settings from "../../../settings.json";

export default class CodeCommand implements Command {
    name = "code";
    description = "Confirm your account verification with the code sent to your email.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addIntegerOption((option) =>
            option
                .setName("code")
                .setDescription("Enter the verification code sent to your email.")
                .setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        const code = interaction.options.getInteger("code", true);
        const userId = interaction.user.id;

        // Check if the user has a pending verification code
        const verificationUser = await MongoDb.getInstance().getVerificationUser(userId);
        if (!verificationUser || !verificationUser.verificationData) {
            return interaction.reply({
                content: "You do not have a pending verification code.",
                ephemeral: true
            });
        }

        const { verificationData } = verificationUser;

        if (verificationData.code !== code) {
            return interaction.reply({
                content: "The verification code you entered is incorrect.",
                ephemeral: true
            });
        }

        if (Date.now() > verificationData.expiresAt) {
            return interaction.reply({
                content: "The verification code has expired. Please request a new one.",
                ephemeral: true
            });
        }

        // Verify the user in the database
        await MongoDb.getInstance().updateVerificationUser({
            _id: userId,
            email: verificationUser.email,
            verified: true,
            banned: false,
            verificationData: undefined
        });

        // Remove the unverified role
        const guild = interaction.guild;
        if (guild) {
            const member = await guild.members.fetch(userId);
            if (member) {
                const unverifiedRoleId = settings.discord.rolesID.unverified;
                const unverifiedRole = guild.roles.cache.get(unverifiedRoleId);
                if (unverifiedRole && member.roles.cache.has(unverifiedRoleId)) {
                    await member.roles.remove(unverifiedRole);
                    console.log(`Removed unverified role from ${member.user.tag} (${member.id})`);
                }
            }
        }

        return interaction.reply({
            content: "Your account has been successfully verified.",
            ephemeral: true
        });
    }
}