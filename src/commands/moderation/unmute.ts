import { Command, ModLogActions } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits, userMention } from "discord.js";

import ModLoggingHandler from '../../handlers/modLoggingHandler';
const modLoggingHandler = new ModLoggingHandler;

export default class UnmuteCommand implements Command {
    name = "unmute";
    description = "Unmute a user (remove timeout).";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName("user").setDescription("Specify the user you are un-timing out.").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Please provide a justification for un-timing out this user.").setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        // Always defer reply for interaction timing
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild) return await interaction.editReply("This command needs to be executed within the server.");
        
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);
        
        try {
            // Un-timeout user
            const member = await interaction.guild.members.fetch(user.id);
            if (!member) return await interaction.editReply("The target user is not in the server.");

            member.timeout(0, reason)

            // Log moderation action
            await modLoggingHandler.logModAction({
                action: ModLogActions.UNTIMEOUT,
                target: user,
                moderator: interaction.user,
                reason,
                timestamp: Date.now()
            }, interaction.client);
            
            return await interaction.editReply({ 
                content: `${userMention(user.id)} has had their timeout removed.` 
            });
        } catch (err) {
            return await interaction.editReply({ content: `Failed to untimeout user: ${err}` });
        }
    }
}