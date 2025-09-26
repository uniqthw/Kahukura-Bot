import { GuildMember, MessageCreateOptions, MessagePayload } from "discord.js";
import settings from "../../settings.json";

export default class DirectMessageHandler {
    async handleMessage(member: GuildMember, message: string | MessageCreateOptions, graceful: boolean): Promise<void> {
        try {
            await member.send(message);
        } catch (e) {
            if (!graceful) return;

            const unverifiedChannel = member.guild.channels.cache.get(settings.discord.channelsID.unverified);
            
            if (!unverifiedChannel || !unverifiedChannel.isTextBased()) return;

            try {
                await unverifiedChannel.send(message);
            } catch (error) {
                console.error("Failed to send DM and fallback message for graceful message: ", error);
            }
        }
    }
}