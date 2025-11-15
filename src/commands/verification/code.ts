// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import MongoDb from "../../utils/mongo";
import settings from "../../utils/settings";
import DynamicCommandHandler from "../../handlers/dynamicCommandHandler";
import SharedVerificationHandler from "../../handlers/sharedVerificationHandler";

const dynamicCommandHandler = new DynamicCommandHandler();
const sharedVerificationHandler = new SharedVerificationHandler();

export default class CodeCommand implements Command {
    name = "code";
    description =
        "Confirm your account verification with the code sent to your email.";
    slashCommand = new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addIntegerOption((option) =>
            option
                .setName("code")
                .setDescription(
                    "Enter the verification code sent to your email."
                )
                .setRequired(true)
        ) as SlashCommandBuilder;

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });

        const code = interaction.options.getInteger("code", true);
        const userId = interaction.user.id;
        const guild = await interaction.client.guilds.fetch(
            settings.discord.guildID
        );

        if (!guild)
            throw new Error(
                "Guild not found. Check settings.discord.guildID and bot guild membership."
            );

        // Check if the user has a pending verification code
        const verificationUser =
            await MongoDb.getInstance().getVerificationUser(userId);
        if (
            !verificationUser ||
            !verificationUser.verificationData ||
            !verificationUser.email
        ) {
            return await interaction.editReply({
                content: "You do not have a pending verification code."
            });
        }

        const { verificationData } = verificationUser;

        if (verificationData.code !== code) {
            const verificationCommand =
                await dynamicCommandHandler.getVerifyCommand(
                    interaction.client
                );

            return await interaction.editReply({
                content: `The verification code you entered is incorrect. If required, please request a new one by re-running the ${verificationCommand} command.`
            });
        }

        if (Date.now() > verificationData.expiresAt) {
            const verificationCommand =
                await dynamicCommandHandler.getVerifyCommand(
                    interaction.client
                );

            return await interaction.editReply({
                content: `The verification code has expired. Please request a new one by re-running the ${verificationCommand} command.`
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
        await sharedVerificationHandler.removeVerificationFromOtherUsers(
            userId,
            verificationUser.email,
            guild
        );

        // Remove the unverified role
        try {
            const member = await guild.members.fetch(userId);

            if (member) {
                const unverifiedRoleId = settings.discord.rolesID.unverified;
                const unverifiedRole = guild.roles.cache.get(unverifiedRoleId);
                if (
                    unverifiedRole &&
                    member.roles.cache.has(unverifiedRoleId)
                ) {
                    await member.roles.remove(
                        unverifiedRole,
                        "User has successfully verified their account with email"
                    );
                }
            }
        } catch (error) {
            console.error(
                `Failed to fetch member or remove unverified role for user ID ${userId}:`,
                error
            );
        }

        return await interaction.editReply({
            content:
                "Your account has been successfully verified. Please remember to select your roles in <id:customize>!"
        });
    }
}
