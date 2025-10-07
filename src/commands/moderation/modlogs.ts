import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { hasModeratorRole } from "../../utils/modRoleCheck";
import { getModLogs } from "../../utils/modlog";
import settings from "../../../settings.json";

export default class ModlogsCommand implements Command {
    name = "modlogs";
    description = "Show recent moderation actions.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName("user").setDescription("User to view logs for (optional)").setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("limit").setDescription("Number of logs to show (default 10, max 25)").setRequired(false)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        // Always defer reply for interaction timing
        await interaction.deferReply({ ephemeral: true });
        const member = interaction.member as GuildMember;
        
        // Permission check: must have moderator role
        if (!hasModeratorRole(member)) {
            return interaction.editReply({ content: "You do not have permission to use this command." });
        }
        
        // Get command options
        const targetUser = interaction.options.getUser("user");
        const limit = Math.min(interaction.options.getInteger("limit") || 10, 25);
        
        try {
            // Get moderation logs
            const logs = await getModLogs(targetUser?.id, limit);
            
            if (logs.length === 0) {
                const message = targetUser 
                    ? `No moderation logs found for <@${targetUser.id}>.`
                    : "No moderation logs found.";
                return interaction.editReply({ content: message });
            }
            
            // Create embed with logs
            const embed = new EmbedBuilder()
                .setTitle(`Moderation Logs${targetUser ? ` for ${targetUser.tag}` : ''}`)
                .setColor(0x3498db)
                .setFooter({ text: `Showing ${logs.length} of recent logs` })
                .setTimestamp();
            
            // Add log entries as fields
            logs.forEach((log, index) => {
                const date = new Date(log.timestamp).toLocaleString();
                const durationText = log.duration ? ` (${log.duration}${log.action === 'slowmode' ? 's' : 'm'})` : '';
                
                embed.addFields({
                    name: `${index + 1}. ${log.action.toUpperCase()}${durationText}`,
                    value: `**Target:** ${log.targetTag}\n**Moderator:** ${log.moderatorTag}\n**Reason:** ${log.reason}\n**Date:** ${date}`,
                    inline: false
                });
            });
            
            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            // Error handling
            return interaction.editReply({ content: `Failed to retrieve moderation logs: ${err}` });
        }
    }
}