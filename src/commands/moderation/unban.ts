import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits } from "discord.js";
import { hasModeratorRole } from "../../utils/roleCheck";
import { logModAction } from "../../utils/modlog";
import settings from "../../../settings.json";

export default class UnbanCommand implements Command {
    name = "unban";
    description = "Unban a user from the server.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName("user_id").setDescription("User ID to unban").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Reason for unban").setRequired(false)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        // Always defer reply for interaction timing
        await interaction.deferReply({ ephemeral: true });
        const member = interaction.member as GuildMember;
        
        // Permission check: must have moderator role
        if (!hasModeratorRole(member)) {
            return await interaction.editReply({ content: "You do not have permission to use this command." });
        }
        
        // Get command options
        const userId = interaction.options.getString("user_id", true);
        const reason = interaction.options.getString("reason") || "No reason provided";
        
        try {
            // Unban user
            await interaction.guild?.members.unban(userId, `Unbanned by ${member.user.tag}: ${reason}`);
            
            // Try to get user info for logging
            let userTag = userId;
            try {
                const user = await interaction.client.users.fetch(userId);
                userTag = user.tag;
            } catch {
                // If we can't fetch the user, just use the ID
                userTag = `Unknown User (${userId})`;
            }
            
            // Log moderation action
            await logModAction({
                action: "unban",
                targetId: userId,
                targetTag: userTag,
                moderatorId: member.user.id,
                moderatorTag: member.user.tag,
                reason,
                timestamp: Date.now(),
                guildId: interaction.guild?.id || ""
            });
            
            return await interaction.editReply({ 
                content: `User <@${userId}> has been unbanned. Reason: ${reason}` 
            });
        } catch (err) {
            // Error handling
            return await interaction.editReply({ content: `Failed to unban user: ${err}` });
        }
    }
}