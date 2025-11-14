import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits } from "discord.js";
import { hasModeratorRole } from "../../utils/roleCheck";
import { logModAction } from "../../utils/modlog";
import settings from "../../../settings.json";

export default class KickCommand implements Command {
    name = "kick";
    description = "Kick a user from the server.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName("user").setDescription("User to kick").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Reason for kick").setRequired(false)
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
            // Kick user
            const guildMember = await interaction.guild?.members.fetch(user.id);
            if (!guildMember) throw new Error("User not found in guild.");
            
            await guildMember.kick(`Kicked by ${member.user.tag}: ${reason}`);
            
            // Log moderation action
            await logModAction({
                action: "kick",
                targetId: user.id,
                targetTag: user.tag,
                moderatorId: member.user.id,
                moderatorTag: member.user.tag,
                reason,
                timestamp: Date.now(),
                guildId: interaction.guild?.id || ""
            });
            
            return await interaction.editReply({ 
                content: `User <@${user.id}> has been kicked. Reason: ${reason}` 
            });
        } catch (err) {
            // Error handling
            return await interaction.editReply({ content: `Failed to kick user: ${err}` });
        }
    }
}