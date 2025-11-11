// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Command } from "../../../@types";
import { ChatInputCommandInteraction, Guild, SlashCommandBuilder, Snowflake } from "discord.js";
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
        const guild = interaction.client.guilds.cache.get(settings.discord.guildID);

        if (!guild) return console.error("Guild not found.");

        // Check if the user has a pending verification code
        const verificationUser = await MongoDb.getInstance().getVerificationUser(userId);
        if (!verificationUser || !verificationUser.verificationData || !verificationUser.email) {
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

        // Remove verification from other users with the same email
        await this.removeVerificationFromOtherUsers(userId, verificationUser.email, guild);

        // Remove the unverified role
        if (guild) {
            const member = await guild.members.fetch(userId);
            if (member) {
                const unverifiedRoleId = settings.discord.rolesID.unverified;
                const unverifiedRole = guild.roles.cache.get(unverifiedRoleId);
                if (unverifiedRole && member.roles.cache.has(unverifiedRoleId)) {
                    await member.roles.remove(unverifiedRole, "User has successfully verified their account with email");
                    console.log(`Removed unverified role from ${member.user.tag} (${member.id})`);
                }
            }
        }

        return interaction.reply({
            content: "Your account has been successfully verified. Please remember to select your roles in <id:customize>!",
            ephemeral: true
        });
    }

    async removeVerificationFromOtherUsers(currentUserId: Snowflake, email: string, guild: Guild) {
        // Remove verification from any other users with the same email attached

        await MongoDb.getInstance().getManyVerificationUsersByEmail(email, currentUserId).then(async (users) => {
            for (const user of users) {
                await MongoDb.getInstance().updateVerificationUserVerificationStatus(user._id, false);
            
                try {
                    await guild?.members.kick(user._id, `User verification revoked due to another user (ID: ${currentUserId}) verifying with the same email.`);
                } catch(error) {
                    console.error(`Failed to kick user with ID ${user._id}: `, error);
                }
            }
        });
    }
}