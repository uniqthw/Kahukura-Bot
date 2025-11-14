// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Command, DBVerificationUser } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField, roleMention, InteractionContextType, User, Snowflake, FileUploadAssertions, userMention } from "discord.js";
import MongoDb from "../../utils/mongo";
import { isCheckuser } from '../../utils/roleCheck';
import { createTransport } from "nodemailer";
import settings from "../../../settings.json";

export default class LookupCommand implements Command {
    name = "lookup";
    description = "Lookup a user's email, Discord ID, and key statuses (ban and verification status).";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setContexts(InteractionContextType.Guild)
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to lookup.")
                .setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });

        // Check if the user has admin permissions
        if (!isCheckuser(interaction.user)) {
            return await interaction.editReply({
                content: "You do not have permission to use this command."
            });
        }

        const user = interaction.options.getUser("user", true);

        // Fetch the user's verification data from the database
        const verificationUser = await MongoDb.getInstance().getVerificationUser(user.id);
        if (!verificationUser) {
            return await interaction.editReply({
                content: "No data found for the specified user."
            });
        }

        try {
            const userLookupFile = await this.generateUserLookupFile(verificationUser, interaction.user);
            await this.sendLookupEmail(interaction.user, verificationUser, userLookupFile);

        } catch (error) {
            console.error("An error occurred whilst executing the user lookup command:", error);
            
            return await interaction.editReply({
                content: "An error occurred whilst executing the user lookup command."
            });
        }

        return await interaction.editReply({
            content: `User lookup report successfully requested against <@${user.id}>.`
        });
    }

    private async sendLookupEmail(checkuser: User, verificationUser: DBVerificationUser, fileUri: string) {
        // Create a transporter object using the default SMTP transport
        let transporter = createTransport(settings.email);

        // Send mail with defined transport object
        await transporter.sendMail({
            from: `"UniQ Te Herenga Waka [noreply]" <${settings.email.auth.user}>`,
            to: "itadmin@uniqthw.org.nz",
            subject: `[CONFIDENTIAL] Kahukura user lookup result`,
            text: `A user lookup was performed against ${verificationUser._id} requested by @${checkuser.username} [${checkuser.id}]. Please see the attached file for its results. The contents of this file are confidential.`, // Plain text body
            html: `<b>A user lookup was performed against ${verificationUser._id} requested by @${checkuser.username} [${checkuser.id}]. Please <i>see</i> the attached file for its results. <strong>The contents of this file are confidential</strong>.</b>`, // HTML body
            attachments: [
                {
                    filename: `${verificationUser._id}_lookup_result.txt`,
                    content: fileUri,
                    encoding: "base64"
                }
            ]
        });
    }

    private async generateUserLookupFile(verificationUser: DBVerificationUser, checkuser: User): Promise<string> {
        const lookupFileContent = `
        === USER LOOKUP FILE ===
        
        *** THIS FILE IS CONFIDENTIAL, IF YOU HAVE RECEIVED THIS FILE IN ERROR, 
        PLEASE IMMEDIATELY DELETE IT AND REPORT IT TO itadmin@uniqthw.org.nz ***
        
        --- RESULTS ---
        Discord ID: ${verificationUser._id}
        Email address: ${verificationUser.email}
        Old email address(es): ${verificationUser.oldEmail}
        Verified user: ${verificationUser.verified}
        Banned user: ${verificationUser.banned}

        --- CHECKUSER ---
        Discord ID: ${checkuser.id}
        Discord Username: @${checkuser.username}`

        const fileUri = Buffer.from(lookupFileContent).toString("base64");

        return fileUri;
    }
}