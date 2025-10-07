import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import MongoDb from "../../utils/mongo";
import { createTransport } from "nodemailer";
import settings from "../../../settings.json";

export default class VerifyCommand implements Command {
    name = "verify";
    description = "Verify your account with your university email.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
            option
                .setName("email")
                .setDescription(
                    "Please input your @myvuw.ac.nz (Student) or @vuw.ac.nz (Staff) email."
                )
                .setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });

        const email = interaction.options.getString("email", true);
        const userId = interaction.user.id;

        // Check if the email is from @myvuw.ac.nz domain
        if (!email.endsWith("@myvuw.ac.nz")) {
            return interaction.editReply({
                content: "Please use a valid @myvuw.ac.nz email address. If you are not a student at Te Herenga Waka—Victoria University of Wellington, you can request manual verification."
            });
        }

        // Generate a new verification code
        const verificationCode = this.generateVerificationCode();

    // Check if the email is already associated with another user
    const existingUser = await MongoDb.getInstance().getVerificationUserByEmail(email);
        if (existingUser) {
            if (existingUser.banned) {
                // If the existing user is banned, ban the current user and set the email as unverified
                await MongoDb.getInstance().updateVerificationUser({
                    _id: userId,
                    email: email,
                    verified: false,
                    banned: true,
                    verificationData: undefined
                });
                return interaction.editReply({
                    content: "This email is associated with a banned account. You have been banned. Please contact us at info@uniqthw.org.nz for more information, and to appeal."
                });
            } else {
                // If the existing user is not banned, set the email as unverified and send a verification code
                await this.sendVerificationEmail(email, verificationCode);
                await MongoDb.getInstance().updateVerificationUser({
                    _id: userId,
                    email: email,
                    verified: false,
                    banned: false,
                    verificationData: {
                        code: verificationCode,
                        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiration
                        lastAttemptAt: Date.now()
                    }
                });
                return interaction.editReply({
                    content: "A verification email has been sent to your university email address. Please check your email and use `/code <your-code>` to complete verification."
                });
            }
        }

        // If the email does not exist on any account, send a verification email and update the database
        await this.sendVerificationEmail(email, verificationCode);
        await MongoDb.getInstance().updateVerificationUser({
            _id: userId,
            email: email,
            verified: false,
            banned: false,
            verificationData: {
                code: verificationCode,
                expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiration
                lastAttemptAt: Date.now()
            }
        });

        return interaction.editReply({
            content: "A verification email has been sent to your university email address. Please check your email and use `/code <your-code>` to complete verification."
        });
    }

    private async sendVerificationEmail(email: string, verificationCode: number) {
        // Create a transporter object using the default SMTP transport
        let transporter = createTransport(settings.email);

        // Send mail with defined transport object
        let info = await transporter.sendMail({
            from: `"UniQ Te Herenga Waka [noreply]" <${settings.email.auth.user}>`,
            to: email,
            subject: "Discord Verification Code",
            text: `Your verification code is: ${verificationCode}`, // Plain text body
            html: `<b>Your verification code is: ${verificationCode}</b>` // HTML body
        });

        console.log("Message sent: %s", info.messageId);
    }

    private generateVerificationCode(): number {
        return Math.floor(100000 + Math.random() * 900000); // 6-digit code
    }
}