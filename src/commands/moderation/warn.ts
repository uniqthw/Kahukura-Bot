import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits } from "discord.js";
import { hasModeratorRole } from "../../utils/modRoleCheck";
import { logModAction } from "../../utils/modlog";
import settings from "../../../settings.json";

export default class WarnCommand implements Command {
    name = "warn";
    description = "Warn a user.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName("user").setDescription("User to warn").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Reason for warning").setRequired(true)
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
        const reason = interaction.options.getString("reason", true);
        
        try {
            // Log moderation action (warns are just logged, no Discord action needed)
            await logModAction({
                action: "warn",
                targetId: user.id,
                targetTag: user.tag,
                moderatorId: member.user.id,
                moderatorTag: member.user.tag,
                reason,
                timestamp: Date.now(),
                guildId: interaction.guild?.id || ""
            });
            
            // Optionally, try to DM the user about the warning
            try {
                await user.send(`You have been warned in ${interaction.guild?.name} for: ${reason}`);
            } catch {
                // Ignore if we can't DM the user
            }
            
            return interaction.editReply({ 
                content: `User <@${user.id}> has been warned. Reason: ${reason}` 
            });
        } catch (err) {
            // Error handling
            return interaction.editReply({ content: `Failed to warn user: ${err}` });
        }
    }
}