import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { hasModeratorRole } from "../../utils/modRoleCheck";
import { getModLogs } from "../../utils/modlog";
import MongoDb from "../../utils/mongo";
import settings from "../../../settings.json";

export default class UserinfoCommand implements Command {
    name = "userinfo";
    description = "Show user info and moderation history.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName("user").setDescription("User to view info for").setRequired(true)
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
        const targetUser = interaction.options.getUser("user", true);
        
        try {
            // Get user information
            let guildMember: GuildMember | null = null;
            try {
                guildMember = await interaction.guild?.members.fetch(targetUser.id) || null;
            } catch {
                // User not in guild
            }
            
            // Get verification data
            const verificationData = await MongoDb.getInstance().getVerificationUser(targetUser.id);
            
            // Get moderation logs
            const modLogs = await getModLogs(targetUser.id, 5);
            
            // Create embed with user info
            const embed = new EmbedBuilder()
                .setTitle(`User Information: ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setColor(guildMember ? 0x00ff00 : 0xff0000)
                .setTimestamp();
            
            // Basic user info
            embed.addFields([
                {
                    name: "User ID",
                    value: targetUser.id,
                    inline: true
                },
                {
                    name: "Account Created",
                    value: targetUser.createdAt.toLocaleDateString(),
                    inline: true
                },
                {
                    name: "In Server",
                    value: guildMember ? "Yes" : "No",
                    inline: true
                }
            ]);
            
            // Guild member info
            if (guildMember) {
                embed.addFields([
                    {
                        name: "Joined Server",
                        value: guildMember.joinedAt?.toLocaleDateString() || "Unknown",
                        inline: true
                    },
                    {
                        name: "Roles",
                        value: guildMember.roles.cache.size > 1 
                            ? guildMember.roles.cache.filter(r => r.id !== interaction.guild?.id).map(r => r.name).join(", ") 
                            : "None",
                        inline: true
                    },
                    {
                        name: "Nickname",
                        value: guildMember.nickname || "None",
                        inline: true
                    }
                ]);
            }
            
            // Verification info
            if (verificationData) {
                embed.addFields({
                    name: "Verification Status",
                    value: `Verified: ${verificationData.verified ? "✅ Yes" : "❌ No"}\nEmail: ${verificationData.email || "None"}\nBanned: ${verificationData.banned ? "⚠️ Yes" : "✅ No"}`,
                    inline: false
                });
            }
            
            // Recent moderation actions
            if (modLogs.length > 0) {
                const logText = modLogs.map(log => {
                    const date = new Date(log.timestamp).toLocaleDateString();
                    return `• **${log.action.toUpperCase()}** by ${log.moderatorTag} (${date})\n  Reason: ${log.reason}`;
                }).join("\n");
                
                embed.addFields({
                    name: `Recent Moderation History (${modLogs.length}/5)`,
                    value: logText.slice(0, 1024), // Discord field limit
                    inline: false
                });
            } else {
                embed.addFields({
                    name: "Moderation History",
                    value: "No moderation actions on record",
                    inline: false
                });
            }
            
            return interaction.editReply({ embeds: [embed] });
        } catch (err) {
            // Error handling
            return interaction.editReply({ content: `Failed to retrieve user information: ${err}` });
        }
    }
}