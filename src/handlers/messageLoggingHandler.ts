// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { AttachmentBuilder, Client, ContainerBuilder, FileBuilder, Message, MessageFlags, TextDisplayBuilder, User, userMention } from "discord.js";
import settings from "../../settings.json";

enum MessageLogColours {
    BAN = 0xdf7d7d,
    KICK = 0xf4b47f,
    TIMEOUT = 0xefc26b,
    UNBAN = 0x90ce76,
    UNTIMEOUT = 0x93b8cb,
    PURGE = 0xa381da
}

export enum MessageLogIcons {
    PURGE = "<:generic:1439025862375768275>"
}

export default class MessageLoggingHandler {
    async logPurgeAction(deletedMessages: Message[], deletedCount: number, moderator: User, targetUser: User | null, reason: string, client: Client) {
        // Build the base text display components
        const textDisplayComponents = [
            new TextDisplayBuilder().setContent(`# ${MessageLogIcons.PURGE} Purge ${deletedCount} Messages`),
            new TextDisplayBuilder().setContent(`-# Executed at <t:${Math.floor(Date.now() / 1000)}:F>.`),
            new TextDisplayBuilder().setContent(`**Reason:** ${reason}`),
            new TextDisplayBuilder().setContent(`**Executor:** ${userMention(moderator.id)} [${moderator.id}]`)
        ];

        // Add targetUser if it exists
        if (targetUser) {
            textDisplayComponents.push(
                new TextDisplayBuilder().setContent(`**Punished:** ${userMention(targetUser.id)} [${targetUser.id}]`)
            );
        }

        // Iterate over messages to create a file
        let attachment;
        let fileNote: string;
        const attachmentName = `purge-${targetUser ? targetUser.id : "channel"}-${Date.now()}.txt`;

        if (deletedMessages && deletedMessages.length > 0) {
            // Sort messages from oldest to newest
            const sortedMessages = deletedMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

            // Format the log content
            const logContent = sortedMessages
                .map(msg => {
                    const timestamp = msg.createdAt.toLocaleString();
                    const author = `${msg.author.tag} (${msg.author.id})`;
                    
                    // Get message content, excluding attachments.
                    // Handle empty content or content with newlines for readability.
                    const content = msg.content 
                        ? `\n    ${msg.content.replace(/\n/g, '\n    ')}` 
                        : "[No Message Content]";
                    
                    return `[${timestamp}] ${author}: ${content}`;
                })
                .join("\n\n"); // Add a blank line between each message entry

            const fileBuffer = Buffer.from(logContent, 'utf-8');

            if (fileBuffer.byteLength === 0) {
                fileNote = "No message content was found to log.";
            } else {
                // Create a unique file name
                const fileName = attachmentName;
                attachment = new AttachmentBuilder(fileBuffer, { name: fileName });
                fileNote = "A log of all deleted message content is attached.";
            }
        } else {
            fileNote = "No messages were provided to log.";
        }

        // Add the file note to the display
        textDisplayComponents.push(
            new TextDisplayBuilder().setContent(`**Log File:** ${fileNote}`)
        );

        const components = [
            new ContainerBuilder()
                .setAccentColor(MessageLogColours.PURGE)
                .addTextDisplayComponents(...textDisplayComponents)
        ]

        // const attachmentFile = new FileBuilder().setURL(`attachment://${attachmentName}.txt`)

        const messageLogChannel = await client.channels.fetch(settings.discord.channelsID.messageLog);

        if (!messageLogChannel || !messageLogChannel.isTextBased() || !messageLogChannel.isSendable()) throw new Error("Failed to message log to channel. Likely misconfiguration, ensure settings.json is appropiately filled out and the bot has access to send messages in the channel.")

        await messageLogChannel.sendTyping();
        try {
            await messageLogChannel.send({ components: components, flags: MessageFlags.IsComponentsV2, files: [attachment] });
        } catch (error) {
            console.error(error)
        }
    }
}