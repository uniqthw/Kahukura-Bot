import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits } from "discord.js";
import { hasModeratorRole } from "../../utils/roleCheck";
import { logModAction } from "../../utils/modlog";
import settings from "../../../settings.json";

export default class BanCommand implements Command {
    name = "ban";
    description = "Ban a user from the server.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName("user").setDescription("User to ban").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Reason for ban").setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName("delete_days").setDescription("Days of messages to delete (0-7)").setRequired(false)
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
        const deleteDays = interaction.options.getInteger("delete_days") || 0;
        
        try {
            // Ban user
            await interaction.guild?.members.ban(user.id, { 
                reason: `Banned by ${member.user.tag}: ${reason}`,
                deleteMessageDays: Math.min(Math.max(deleteDays, 0), 7) // Clamp between 0-7
            });
            
            // Log moderation action
            await logModAction({
                action: "ban",
                targetId: user.id,
                targetTag: user.tag,
                moderatorId: member.user.id,
                moderatorTag: member.user.tag,
                reason,
                timestamp: Date.now(),
                guildId: interaction.guild?.id || ""
            });
            
            return await interaction.editReply({ 
                content: `User <@${user.id}> has been banned. Reason: ${reason}` 
            });
        } catch (err) {
            // Error handling
            return await interaction.editReply({ content: `Failed to ban user: ${err}` });
        }
    }
}