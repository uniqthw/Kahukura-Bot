import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, TextChannel, PermissionFlagsBits } from "discord.js";
import { hasModeratorRole } from "../../utils/modRoleCheck";
import { logModAction } from "../../utils/modlog";
import settings from "../../../settings.json";

export default class LockCommand implements Command {
    name = "lock";
    description = "Lock the current channel (prevent sending messages).";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option =>
            option.setName("reason").setDescription("Reason for locking channel").setRequired(false)
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
        const reason = interaction.options.getString("reason") || "No reason provided";
        const channel = interaction.channel as TextChannel;
        
        try {
            // Lock channel by removing send messages permission for @everyone
            await channel.permissionOverwrites.edit(
                channel.guild.roles.everyone, 
                { 
                    SendMessages: false 
                },
                { reason: `Locked by ${member.user.tag}: ${reason}` }
            );
            
            // Log moderation action
            await logModAction({
                action: "lock",
                targetId: channel.id,
                targetTag: `#${channel.name}`,
                moderatorId: member.user.id,
                moderatorTag: member.user.tag,
                reason,
                timestamp: Date.now(),
                guildId: interaction.guild?.id || ""
            });
            
            // Send public message about lock
            await channel.send(`🔒 This channel has been locked by <@${member.user.id}>. Reason: ${reason}`);
            
            return interaction.editReply({ 
                content: `Channel <#${channel.id}> has been locked. Reason: ${reason}` 
            });
        } catch (err) {
            // Error handling
            return interaction.editReply({ content: `Failed to lock channel: ${err}` });
        }
    }
}