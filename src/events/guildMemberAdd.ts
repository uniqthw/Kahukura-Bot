import { GuildMember } from "discord.js";
import settings from "../../settings.json";

export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
    try {
        const unverifiedRoleId = settings.discord.rolesID.unverified;
        
        if (!unverifiedRoleId) {
            console.error("Unverified role ID not found in settings");
            return;
        }

        // Get the unverified role
        const unverifiedRole = member.guild.roles.cache.get(unverifiedRoleId);
        
        if (!unverifiedRole) {
            console.error(`Unverified role with ID ${unverifiedRoleId} not found in guild`);
            return;
        }

        // Add the unverified role to the new member
        await member.roles.add(unverifiedRole);
        
        console.log(`Added unverified role to ${member.user.tag} (${member.id})`);
        
        // Optional: Send a welcome message in the unverified channel
        const unverifiedChannelId = settings.discord.channelsID.unverified;
        if (unverifiedChannelId) {
            const unverifiedChannel = member.guild.channels.cache.get(unverifiedChannelId);
            if (unverifiedChannel?.isTextBased()) {
                await unverifiedChannel.send(
                    `Welcome ${member}! \n\nBefore you can interact within UniQ Te Herenga Waka, such as sending messages, you need to verify your account first.\n\nPlease verify your account using \`/verify your-email@myvuw.ac.nz\` to access the server.`
                );
            }
        }
        
    } catch (error) {
        console.error(`Failed to add unverified role to ${member.user.tag}:`, error);
    }
}