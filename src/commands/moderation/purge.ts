import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, TextChannel, PermissionFlagsBits } from "discord.js";
import { hasModeratorRole } from "../../utils/modRoleCheck";
import { logModAction } from "../../utils/modlog";
import settings from "../../../settings.json";

export default class PurgeCommand implements Command {
    name = "purge";
    description = "Bulk delete messages in a channel.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option.setName("amount").setDescription("Number of messages to delete (1-100)").setRequired(true)
        )
        .addUserOption(option =>
            option.setName("user").setDescription("Only delete messages from this user").setRequired(false)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Reason for purge").setRequired(false)
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
        const amount = interaction.options.getInteger("amount", true);
        const targetUser = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason") || "No reason provided";
        const channel = interaction.channel as TextChannel;
        
        // Validate amount
        if (amount < 1 || amount > 100) {
            return interaction.editReply({ content: "Amount must be between 1 and 100." });
        }
        
        try {
            let deletedCount = 0;
            
            if (targetUser) {
                // Delete messages from specific user
                const messages = await channel.messages.fetch({ limit: 100 });
                const userMessages = messages.filter(msg => msg.author.id === targetUser.id).first(amount);
                
                for (const message of userMessages.values()) {
                    await message.delete();
                    deletedCount++;
                }
            } else {
                // Bulk delete messages
                const deleted = await channel.bulkDelete(amount, true);
                deletedCount = deleted.size;
            }
            
            // Log moderation action
            await logModAction({
                action: "purge",
                targetId: targetUser?.id || channel.id,
                targetTag: targetUser?.tag || `#${channel.name}`,
                moderatorId: member.user.id,
                moderatorTag: member.user.tag,
                reason: `${reason} (${deletedCount} messages deleted)`,
                timestamp: Date.now(),
                guildId: interaction.guild?.id || ""
            });
            
            return interaction.editReply({ 
                content: `Deleted ${deletedCount} messages${targetUser ? ` from <@${targetUser.id}>` : ''}. Reason: ${reason}` 
            });
        } catch (err) {
            // Error handling
            return interaction.editReply({ content: `Failed to purge messages: ${err}` });
        }
    }
}