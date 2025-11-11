// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { GuildMember, MessageCreateOptions, MessagePayload } from "discord.js";
import settings from "../../settings.json";
export default class DirectMessageHandler {
    async handleMessage(member: GuildMember, message: string | MessageCreateOptions, graceful: boolean): Promise<void> {
        try {
            if (!graceful) return;

            await member.send(message);
        } catch (error) {
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