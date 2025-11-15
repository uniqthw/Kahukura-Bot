// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField, InteractionContextType, User, userMention } from "discord.js";
import MongoDb from "../../utils/mongo";
import settings from "../../utils/settings";
import DirectMessageHandler from "../../handlers/directMessageHandler";
import SharedVerificationHandler from "../../handlers/sharedVerificationHandler";

const sharedVerificationHandler = new SharedVerificationHandler();
const directMessageHandler = new  DirectMessageHandler();

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
        )
        .addStringOption((option) => 
            option
                .setName("reason")
                .setDescription("Please input a justification for manually verifying this user.")
                .setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild) return console.error("Guild not found in interaction.");
        
        // Check if the user has admin permissions
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.editReply({
                content: "You do not have permission to use this command."
            });
        }

        const user = interaction.options.getUser("user", true);
        const email = interaction.options.getString("email", true).toLowerCase();
        const reason = interaction.options.getString("reason", true);

        // Fetch the user's verification data from the database
        let verificationUser = await MongoDb.getInstance().getVerificationUser(user.id);

        // Set the user as verified and update DB
        await MongoDb.getInstance().updateVerificationUser({
            _id: user.id,
            email: email,
            oldEmail: verificationUser?.email,
            verified: true,
            banned: false,
            verificationData: undefined,
            manualVerificationData: {
                verified: true,
                reason: reason,
                executorId: interaction.user.id,
                executedAt: Date.now()
            }
        });

        // Remove verification from other users with the same email
        await sharedVerificationHandler.removeVerificationFromOtherUsers(user.id, email, interaction.guild);

        // Try to fetch guild member and remove unverified role
        try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (member) {
                const unverifiedRoleId = settings.discord.rolesID.unverified;
                const unverifiedRole = interaction.guild.roles.cache.get(unverifiedRoleId);
                if (unverifiedRole && member.roles.cache.has(unverifiedRoleId)) {
                    await member.roles.remove(unverifiedRole, "Manually verified by admin command");
                }
            }
        } catch (error) {
            console.error(`Failed to fetch member or remove unverified role for user ID ${user.id}:`, error);
        }

        await directMessageHandler.deleteOldVerificationMessage(user, interaction.client);
            
        try {
            await this.sendManualVerificationLog(user, interaction.user, reason);
        } catch (error) {
            console.error("Failed to send manual verification log:", error);
        }

        return await interaction.editReply({ content: `User ${userMention(user.id)} has been manually verified.` });
    }

    private async sendManualVerificationLog(verificationUser: User, executor: User, reason: string): Promise<any> {
        const url = settings.googleChatsWebhooks.engagementSpace;

        const messageBody = {
            "text": "A manual verification has been issued on the UniQ Te Herenga Waka Discord server.",
            "cardsV2": [
                {
                    "card": {
                        "sections": [
                            {
                                "header": "Manual Verification",
                                "widgets": [
                                {
                                    "decoratedText": {
                                    "text": "User Verified",
                                    "bottomLabel": `Discord: @${verificationUser.username} [ID: ${verificationUser.id}]`,
                                    "icon": {
                                        "materialIcon": {
                                        "name": "person_check"
                                        }
                                    }
                                    }
                                },
                                {
                                    "decoratedText": {
                                    "text": "Verified By",
                                    "bottomLabel": `Discord: @${executor.username} [ID: ${executor.id}]`,
                                    "icon": {
                                        "materialIcon": {
                                        "name": "person_play"
                                        }
                                    }
                                    }
                                },
                                {
                                    "decoratedText": {
                                    "text": "Justification",
                                    "bottomLabel": reason,
                                    "icon": {
                                        "materialIcon": {
                                        "name": "comment_bank"
                                        }
                                    }
                                    }
                                }
                                ]
                            }
                        ]
                    }
                }
            ]
        }

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {"Content-Type": "application/json; charset=UTF-8"},
                body: JSON.stringify(messageBody)
            });
    
            if (!res.ok) {
                const errorText = await res.text();
                console.error("Google Chat API Error:", res.status, errorText);
                throw new Error(`Failed to send message: ${res.status} ${errorText}`);
            }
    
            return await res.json();
    
        } catch (error) {
            console.error("Error in sendManualVerificationLog:", error);
            throw error;
        }
    }
}