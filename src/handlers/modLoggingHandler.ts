// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Client, ContainerBuilder, MessageFlags, TextDisplayBuilder, userMention } from "discord.js";
import { ModLogEntry } from "../../@types";
import MongoDb from "../utils/mongo";
import { ModLogActions } from '../../@types/index';
import prettyMilliseconds from "pretty-ms";
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
        const modLogDB = await MongoDb.getInstance().insertModLog(rawEntry);
        const entry = rawEntry;
        entry._id = modLogDB.insertedId;

        // Build the base text display components
        const textDisplayComponents = [
            new TextDisplayBuilder().setContent(`# ${this.getLogEmoji(entry.action)} ${entry.action}`),
            new TextDisplayBuilder().setContent(`-# Executed at <t:${Math.floor(entry.timestamp / 1000)}:F>.`),
            new TextDisplayBuilder().setContent(`**Punishment ID:** \`${entry._id}\``),
            new TextDisplayBuilder().setContent(`**Punished:** ${userMention(entry.target.id)} [\`${entry.target.id}\`]`),
            new TextDisplayBuilder().setContent(`**Executor:** ${userMention(entry.moderator.id)} [\`${entry.moderator.id}\`]`),
            new TextDisplayBuilder().setContent(`**Reason:** ${entry.reason}`),
        ];

        // Add duration and expiry if they exist
        if (entry.duration?.length) {
            textDisplayComponents.push(
                new TextDisplayBuilder().setContent(`**Duration:** ${prettyMilliseconds(entry.duration.length, { verbose: true })}`)
            );
        }

        if (entry.duration?.expiry) {
            textDisplayComponents.push(
                new TextDisplayBuilder().setContent(`**Expires:** <t:${Math.floor(entry.duration.expiry / 1000)}:R>`)
            );
        }

        const components = [
            new ContainerBuilder()
                .setAccentColor(this.getLogAccentColour(entry.action))
                .addTextDisplayComponents(...textDisplayComponents)
        ]

        const modLogChannel = await client.channels.fetch(settings.discord.channelsID.modPunishmentLog);

        if (!modLogChannel || !modLogChannel.isTextBased() || !modLogChannel.isSendable()) throw new Error("Failed to log punishment to mod log channel. Likely misconfiguration, ensure settings.json is appropriately filled out and the bot has access to send messages in the channel.")
        
        await modLogChannel.sendTyping();
        try {
            await modLogChannel.send({ components: components, flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            console.error(error)
        }
    }

    private getLogAccentColour(logType: ModLogActions) {
        let colour: number;

        switch (logType) {
            case ModLogActions.BAN:
                colour = ModLogColours.BAN;
                break;
            case ModLogActions.KICK:
                colour = ModLogColours.KICK;
                break;
            case ModLogActions.TIMEOUT:
                colour = ModLogColours.TIMEOUT;
                break;
            case ModLogActions.UNBAN:
                colour = ModLogColours.UNBAN;
                break;
            case ModLogActions.UNTIMEOUT:
                colour = ModLogColours.UNTIMEOUT;
                break;
            default:
                colour = ModLogColours.GENERIC;
                break;
        }

        return colour;
    }

    private getLogEmoji(logType: ModLogActions) {
        let emoji: string;

        switch (logType) {
            case ModLogActions.BAN:
                emoji = "<:ban:1439025860308107264>";
                break;
            case ModLogActions.KICK:
                emoji = "<:kick:1439025863952830557>";
                break;
            case ModLogActions.TIMEOUT:
                emoji = "<:timeout:1439025866343452793>";
                break;
            case ModLogActions.UNBAN:
                emoji = "<:unban:1439025868885459055>";
                break;
            case ModLogActions.UNTIMEOUT:
                emoji = "<:untimeout:1439025870659391538>";
                break;
            default:
                emoji = "<:generic:1439025862375768275>";
                break;
        }

        return emoji;
    }
}