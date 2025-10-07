import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, TextChannel, PermissionFlagsBits } from "discord.js";
import { hasModeratorRole } from "../../utils/modRoleCheck";
import { logModAction } from "../../utils/modlog";
import settings from "../../../settings.json";

export default class SlowmodeCommand implements Command {
    name = "slowmode";
    description = "Set slowmode interval for the current channel.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addIntegerOption(option =>
            option.setName("seconds").setDescription("Slowmode interval in seconds (0 to disable)").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Reason for slowmode change").setRequired(false)
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
        const seconds = interaction.options.getInteger("seconds", true);
        const reason = interaction.options.getString("reason") || "No reason provided";
        const channel = interaction.channel as TextChannel;
        
        // Validate slowmode duration (Discord limit is 21600 seconds = 6 hours)
        if (seconds < 0 || seconds > 21600) {
            return interaction.editReply({ content: "Slowmode duration must be between 0 and 21600 seconds (6 hours)." });
        }
        
        try {
            // Set slowmode
            await channel.setRateLimitPerUser(seconds, `Slowmode set by ${member.user.tag}: ${reason}`);
            
            // Log moderation action
            await logModAction({
                action: "slowmode",
                targetId: channel.id,
                targetTag: `#${channel.name}`,
                moderatorId: member.user.id,
                moderatorTag: member.user.tag,
                reason: `${reason} (${seconds}s slowmode)`,
                duration: seconds,
                timestamp: Date.now(),
                guildId: interaction.guild?.id || ""
            });
            
            const message = seconds === 0 
                ? `Slowmode disabled in <#${channel.id}>. Reason: ${reason}`
                : `Slowmode set to ${seconds} seconds in <#${channel.id}>. Reason: ${reason}`;
            
            return interaction.editReply({ content: message });
        } catch (err) {
            // Error handling
            return interaction.editReply({ content: `Failed to set slowmode: ${err}` });
        }
    }
}