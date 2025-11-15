import { Command, ModLogActions } from "../../../@types";
import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, userMention, GuildMember } from "discord.js";
import parseDuration from "parse-duration-ms";

import ModLoggingHandler from '../../handlers/modLoggingHandler';
const modLoggingHandler = new ModLoggingHandler;

export default class MuteCommand implements Command {
    name = "mute";
    description = "Mute a user with Discord timeout.";
    slashCommand = (new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName("user").setDescription("Specify the user you are timing out.").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("duration").setDescription("Specify the duration for which you are timing the user out (i.e., \"1 hr 20 mins\")").setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason").setDescription("Please provide a justification for timing out this user.").setRequired(true)
        ) as SlashCommandBuilder);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        // Always defer reply for interaction timing
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.guild) return await interaction.editReply("This command needs to be executed within the server.");
        
        const user = interaction.options.getUser("user", true);
        const rawDuration = interaction.options.getString("duration", true);
        const reason = interaction.options.getString("reason", true);

        const duration = parseDuration(rawDuration);
        if (!duration || duration < 60000 || duration >= 2419200000) return await interaction.editReply("The specified duration is invalid (must be at least 60 seconds, and shorter than 28 days).");
        
        try {
            // Timeout user
            let member: GuildMember;
            try {
                member = await interaction.guild.members.fetch(user.id);
            } catch {
                return await interaction.editReply("The target user is not in the server.");
            }

            await member.timeout(duration, reason)

            // Log moderation action
            await modLoggingHandler.logModAction({
                action: ModLogActions.TIMEOUT,
                target: user,
                moderator: interaction.user,
                reason,
                timestamp: Date.now(),
                duration: {
                    length: duration,
                    expiry: Date.now() + duration
                }
            }, interaction.client);
            
            return await interaction.editReply({ 
                content: `${userMention(user.id)} has been timed out.` 
            });
        } catch (err) {
            return await interaction.editReply({ content: `Failed to timeout user or log: ${err}` });
        }
    }
}