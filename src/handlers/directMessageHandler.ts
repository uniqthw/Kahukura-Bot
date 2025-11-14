// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Client, GuildMember, Message, MessageCreateOptions, MessagePayload, User } from "discord.js";
import settings from "../../settings.json";
import MongoDb from "../utils/mongo";

export default class DirectMessageHandler {
    async handleMessage(member: GuildMember, message: string | MessageCreateOptions, graceful: boolean, verificationMessage?: boolean): Promise<void> {
        try {
            if (!graceful) return;

            await member.send(message);
        } catch (error) {
            const unverifiedChannel = await member.guild.channels.fetch(settings.discord.channelsID.unverified);
            
            if (!unverifiedChannel || !unverifiedChannel.isTextBased()) return;

            try {
                const sentMessage = await unverifiedChannel.send(message);
                if (verificationMessage) this.handleVerificationMessage(member, sentMessage);
            } catch (error) {
                console.error("Failed to send DM and fallback message for graceful message: ", error);
            }
        }
    }

    private async handleVerificationMessage(member: GuildMember, message: Message) {
        await MongoDb.getInstance().setCacheVerificationMessage(member.id, message.id);
    }

    async deleteOldVerificationMessage(user: User, client: Client) {
        const cachedVerificationMessage = await MongoDb.getInstance().lookupCacheVerificationMessage(user.id);

        if (cachedVerificationMessage) {
            try {
                const verificationChannel = await client.channels.fetch(settings.discord.channelsID.unverified);
                if (verificationChannel && verificationChannel.isTextBased()) {
                    const verificationMessage = await verificationChannel.messages.fetch(cachedVerificationMessage.messageId);
                    await verificationMessage.delete();
                    await MongoDb.getInstance().deleteCacheVerificationMessage(user.id);
                }
            } catch (error) {
                console.error("Failed to delete cached verification message: ", error)
            }
        }

        return;
    }
}