import { Command } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, TextChannel, PermissionFlagsBits, InteractionContextType, Message } from "discord.js";
import MessageLoggingHandler from "../../handlers/messageLoggingHandler";
const messageLoggingHandler = new MessageLoggingHandler();

export default class PurgeCommand implements Command {
    name = "purge";
    description = "Bulk delete messages in a channel.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setContexts(InteractionContextType.Guild)
        .addIntegerOption(option =>
            option.setName("amount").setDescription("Specify the number of messages to bulk delete.").setMinValue(1).setMaxValue(100).setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Please provide a justification for purging these messages.").setRequired(true)
        )
        .addUserOption(option =>
            option.setName("user").setDescription("Specify if you would like to purge messages from a specific user.").setRequired(false)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });
        
        const amount = interaction.options.getInteger("amount", true);
        const targetUser = interaction.options.getUser("user", false);
        const reason = interaction.options.getString("reason", true);

        if (!interaction.channel || !interaction.channel.isTextBased()) return await interaction.editReply({ content: "You can only purge messages in a text channel." });
        
        if (amount < 1 || amount > 100) return await interaction.editReply({ content: "Amount must be between 1 and 100." });

        let deletedMessages: Message[];
        
        try {
            let deletedCount: number;
            const fetched = await interaction.channel.messages.fetch({ limit: amount });
            
            if (targetUser) {
                // Bulk delete messages from a specific user

                const userMessages = fetched.filter(msg => msg.author.id === targetUser.id);

                if (userMessages.size === 0) return interaction.editReply("Unable to purge as no messages from that user were found in the last 100 messages in the channel.");

                const deleted = await (interaction.channel as TextChannel).bulkDelete(userMessages, true);
                
                deletedCount = deleted.size;
                deletedMessages = Array.from(deleted.values()).filter((msg): msg is Message => msg instanceof Message);
            } else {
                // Bulk delete messages from the entire channel
                const deleted = await (interaction.channel as TextChannel).bulkDelete(fetched, true);
                deletedCount = deleted.size;
                deletedMessages = Array.from(deleted.values()).filter((msg): msg is Message => msg instanceof Message);
            }
            // Log purge action
            await messageLoggingHandler.logPurgeAction(
                deletedMessages,
                deletedCount,
                interaction.user,
                targetUser,
                reason,
                interaction.client
            );
            
            return await interaction.editReply({ 
                content: `Successfully purged ${deletedCount} messages.` 
            });
        } catch (err) {
            await interaction.editReply({ content: "Failed to purge messages or log" });
            return console.error("Failed to purge messages or log:", err)
        }
    }
}