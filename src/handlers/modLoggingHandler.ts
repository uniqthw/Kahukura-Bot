// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Client, ContainerBuilder, TextDisplayBuilder, userMention } from "discord.js";
import { ModLogEntry } from "../../@types";
import MongoDb from "../utils/mongo";
import { SnowflakeId } from "@akashrajpurohit/snowflake-id";
import { ModLogActions } from '../../@types/index';
import humanizeDuration from "humanize-duration";
import settings from "../../settings.json";

enum ModLogColours {
    BAN = 0xdf7d7d,
    KICK = 0xf4b47f,
    TIMEOUT = 0xefc26b,
    UNBAN = 0x90ce76,
    UNTIMEOUT = 0x93b8cb,
    GENERIC = 0xa381da
}

export default class ModLoggingHandler {
    async logModAction(rawEntry: ModLogEntry, client: Client): Promise<void> {
        const entry = rawEntry;
        entry._id = SnowflakeId({ epoch: Date.now() }).generate();

        await MongoDb.getInstance().insertModLog(entry);

        // Build the base text display components
        const textDisplayComponents = [
            new TextDisplayBuilder().setContent(`# ${entry.action}`),
            new TextDisplayBuilder().setContent(`-# Executed at <t:${Math.floor(entry.timestamp / 1000)}:F>.`),
            new TextDisplayBuilder().setContent(`* **Punishment ID:** ${entry._id}`),
            new TextDisplayBuilder().setContent(`* **Punished:** ${userMention(entry.target.id)} [${entry.target.id}]`),
            new TextDisplayBuilder().setContent(`* **Executor:** ${userMention(entry.moderator.id)} [${entry.moderator.id}]`),
            new TextDisplayBuilder().setContent(`* **Reason:** ${entry.reason}`),
        ];

        // Add duration and expiry if they exist
        if (entry.duration) {
            textDisplayComponents.push(
                new TextDisplayBuilder().setContent(`* **Duration:** ${humanizeDuration(entry.duration.length)}`),
                new TextDisplayBuilder().setContent(`* **Expires:** ${entry.duration.expiry}`)
            );
        }

        const components = [
            new ContainerBuilder()
                .setAccentColor(this.getLogAccentColour(entry.action))
                .addTextDisplayComponents(...textDisplayComponents)
        ]

        const modLogChannel = await client.channels.fetch(settings.discord.channelsID.modPunishmentLog);

        if (!modLogChannel || !modLogChannel.isTextBased() || !modLogChannel.isSendable()) throw new Error("Failed to log punishment to mod log channel. Likely misconfiguration, ensure settings.json is appropiately filled out and the bot has access to send messages in the channel.")
        
        await modLogChannel.sendTyping();
        await modLogChannel.send({ components: components });
    }

    private getLogAccentColour(logType: ModLogActions) {
        switch (logType) {
            case ModLogActions.BAN:
                return ModLogColours.BAN;
            case ModLogActions.KICK:
                return ModLogColours.BAN; 
            case ModLogActions.TIMEOUT:
                return ModLogColours.BAN;
            case ModLogActions.UNBAN:
                return ModLogColours.BAN; 
            case ModLogActions.UNTIMEOUT:
                return ModLogColours.BAN;
            default:
                return ModLogColours.GENERIC;
        }
    }

    // async function getModLogs(targetId?: string, limit: number = 10): Promise<ModLogEntry[]> {
    //     try {
    //         const db = MongoDb.getInstance();
    //         return await db.getModLogs(targetId, limit);
    //     } catch (error) {
    //         console.error("Failed to retrieve moderation logs:", error);
    //         return [];
    //     }
    // }
}