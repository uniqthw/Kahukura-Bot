import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits } from "discord.js";
import { hasModeratorRole } from "../../utils/roleCheck";
import { logModAction } from "../../utils/modlog";
import settings from "../../../settings.json";

export default class UnmuteCommand implements Command {
    name = "unmute";
    description = "Unmute a user (remove timeout).";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName("user").setDescription("User to unmute").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Reason for unmute").setRequired(false)
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
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") || "No reason provided";
        
        try {
            // Remove timeout
            const guildMember = await interaction.guild?.members.fetch(user.id);
            if (!guildMember) throw new Error("User not found in guild.");
            
            await guildMember.timeout(null, `Unmuted by ${member.user.tag}: ${reason}`);
            
            // Log moderation action
            await logModAction({
                action: "unmute",
                targetId: user.id,
                targetTag: user.tag,
                moderatorId: member.user.id,
                moderatorTag: member.user.tag,
                reason,
                timestamp: Date.now(),
                guildId: interaction.guild?.id || ""
            });
            
            return await interaction.editReply({ 
                content: `User <@${user.id}> has been unmuted. Reason: ${reason}` 
            });
        } catch (err) {
            // Error handling
            return await interaction.editReply({ content: `Failed to unmute user: ${err}` });
        }
    }
}