import { Command, ModLogActions } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, userMention } from "discord.js";
import ModLoggingHandler from "../../handlers/modLoggingHandler";

const modLoggingHandler = new ModLoggingHandler();

export default class KickCommand implements Command {
    name = "kick";
    description = "Kick a user from the server.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName("user").setDescription("Specify the user you are kicking.").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Please provide a justification for kicking this user.").setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild) return await interaction.editReply("This command needs to be executed within the server.");
        
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);
        
        
        try {
            // Kick user
            await interaction.guild.members.kick(user.id, reason);
            
            // Log moderation action
            await modLoggingHandler.logModAction({
                action: ModLogActions.KICK,
                target: user,
                moderator: interaction.user,
                reason,
                timestamp: Date.now()
            }, interaction.client);
            
            return await interaction.editReply({ 
                content: `${userMention(user.id)} has been kicked.` 
            });
        } catch (err) {
            return await interaction.editReply({ content: `Failed to kick user: ${err}` });
        }
    }
}