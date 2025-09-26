import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField } from "discord.js";
import MongoDb from "../../utils/mongo";
import settings from "../../../settings.json";

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
        // Ensure the user has a DB entry; create one if not
        let verificationUser = await MongoDb.getInstance().getVerificationUser(user.id);
        if (!verificationUser) {
            await MongoDb.getInstance().insertVerificationUser(user.id);
            verificationUser = await MongoDb.getInstance().getVerificationUser(user.id);
        }

        // Set the user as verified and update DB
        await MongoDb.getInstance().updateVerificationUser({
            _id: user.id,
            email: verificationUser?.email,
            verified: true,
            banned: false,
            verificationData: undefined
        });

        // Try to fetch guild member and remove unverified role
        const guild = interaction.guild;
        if (guild) {
            try {
                const member = await guild.members.fetch(user.id);
                if (member) {
                    await member.roles.remove(
                        settings.discord.rolesID.unverified,
                        "Manually verified by admin command"
                    );
                }
            } catch (err) {
                // ignore fetch errors
            }
        }

        return interaction.reply({ content: `User <@${user.id}> has been manually verified.`, ephemeral: true });
    }
}