// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField, Guild, Snowflake, InteractionContextType } from "discord.js";
import MongoDb from "../../utils/mongo";
import settings from "../../../settings.json";

export default class LookupCommand implements Command {
    name = "manualverify";
    description = "Manually verify a Discord user, bypassing the university email verification process.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setContexts(InteractionContextType.Guild)
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to manually verify.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("email")
                .setDescription(
                    "Please input the user's primary email address."
                )
                .setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        if (!interaction.guild) return console.error("Guild not found in interaction.");
        
        // Check if the user has admin permissions
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: "You do not have permission to use this command.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser("user", true);
        const email = interaction.options.getString("email", true);

        // Fetch the user's verification data from the database
        let verificationUser = await MongoDb.getInstance().getVerificationUser(user.id);

        // Set the user as verified and update DB
        await MongoDb.getInstance().updateVerificationUser({
            _id: user.id,
            email: email,
            oldEmail: verificationUser?.email,
            verified: true,
            banned: false,
            verificationData: undefined
        });

        // Remove verification from other users with the same email
        await this.removeVerificationFromOtherUsers(user.id, email, interaction.guild);

        // Try to fetch guild member and remove unverified role
        const guild = interaction.guild;
        if (guild) {
            try {
                const member = await guild.members.fetch(interaction.user.id);
                if (member) {
                    const unverifiedRoleId = settings.discord.rolesID.unverified;
                    const unverifiedRole = guild.roles.cache.get(unverifiedRoleId);
                    if (unverifiedRole && member.roles.cache.has(unverifiedRoleId)) {
                        await member.roles.remove(unverifiedRole, "Manually verified by admin command");
                        console.log(`Manually verified by admin command, removing unverified role from ${member.user.tag} (${member.id})`);
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch member or remove unverified role for user ID ${user.id}:`, error);
            }
        } else console.error("Guild not found in interaction.");

        return interaction.reply({ content: `User <@${user.id}> has been manually verified.`, ephemeral: true });
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