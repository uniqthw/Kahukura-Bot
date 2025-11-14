import { Command, ModLogActions } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits, userMention } from "discord.js";

import ModLoggingHandler from "../../handlers/modLoggingHandler";

const modLoggingHandler = new ModLoggingHandler();

export default class UnbanCommand implements Command {
    name = "unban";
    description = "Unban a user from the server.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName("user").setDescription("Specify the user you are unbanning.").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Please provide a justification for unbanning this user.").setRequired(false)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });
        
        if (!interaction.guild) return await interaction.editReply("This command needs to be executed within the server.");
        
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);

        try {
            // Unban user
            await interaction.guild.members.unban(user.id, reason);
            
            // Log moderation action
            await modLoggingHandler.logModAction({
                action: ModLogActions.UNBAN,
                target: user,
                moderator: interaction.user,
                reason,
                timestamp: Date.now()
            }, interaction.client);
            
            return await interaction.editReply({ 
                content: `${userMention(user.id)} has been unbanned.` 
            });
        } catch (err) {
            await interaction.editReply("Failed to unban user.");
            return console.error("Failed to unban user:", err)
        }
    }
}