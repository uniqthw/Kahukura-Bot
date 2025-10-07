import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember } from "discord.js";
import { hasModeratorRole } from "../../utils/modRoleCheck";
import { logModAction } from "../../utils/modlog";
import settings from "../../../settings.json";

export default class MuteCommand implements Command {
    name = "mute";
    description = "Mute a user with Discord timeout.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption(option =>
            option.setName("user").setDescription("User to mute").setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("duration").setDescription("Mute duration in minutes").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Reason for mute").setRequired(false)
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
        const user = interaction.options.getUser("user", true);
        const duration = interaction.options.getInteger("duration", true);
        const reason = interaction.options.getString("reason") || "No reason provided";
        
        try {
            // Mute user with Discord timeout
            const guildMember = await interaction.guild?.members.fetch(user.id);
            if (!guildMember) throw new Error("User not found in guild.");
            
            await guildMember.timeout(duration * 60 * 1000, `Muted by ${member.user.tag}: ${reason}`);
            
            // Log moderation action
            await logModAction({
                action: "mute",
                targetId: user.id,
                targetTag: user.tag,
                moderatorId: member.user.id,
                moderatorTag: member.user.tag,
                reason,
                duration,
                timestamp: Date.now(),
                guildId: interaction.guild?.id || ""
            });
            
            return interaction.editReply({ 
                content: `User <@${user.id}> has been muted for ${duration} minutes. Reason: ${reason}` 
            });
        } catch (err) {
            // Error handling
            return interaction.editReply({ content: `Failed to mute user: ${err}` });
        }
    }
}