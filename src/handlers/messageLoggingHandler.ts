import { Attachment, messageLink } from 'discord.js';
// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { AttachmentBuilder, Client, ContainerBuilder, FileBuilder, Message, MessageFlags, OmitPartialGroupDMChannel, PartialMessage, TextDisplayBuilder, User, userMention } from "discord.js";
import settings from "../../settings.json";

enum MessageLogColours {
    DELETE = 0xdf7d7d,
    EDIT = 0xefc26b,
    PURGE = 0xa381da
}

export enum MessageLogIcons {
    DELETE = "<:deletemessage:1439065635723153438>",
    EDIT = "<:editmessage:1439065637938004059>",
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
                new TextDisplayBuilder().setContent(`**Victim:** ${userMention(targetUser.id)} [${targetUser.id}]`)
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
                .map((msg) => {
                    const timestamp = msg.createdAt.toLocaleString();
                    const author = `${msg.author.tag} (${msg.author.id})`;
                    
                    // Get message content, excluding attachments.
                    const content = msg.content 
                        ? `\n    ${msg.content.replace(/\n/g, '\n    ')}` 
                        : "[No Message Content]";
                    
                    return `[${timestamp}] ${author}: ${content}`;
                })
                .join("\n\n");
    
            const fileBuffer = Buffer.from(logContent, 'utf-8');
    
            if (fileBuffer.byteLength === 0) {
                fileNote = "No message content was found to log.";
            } else {
                attachment = new AttachmentBuilder(fileBuffer, { name: attachmentName });
                fileNote = "A log of all deleted message content is attached.";
            }
        } else {
            fileNote = "No messages were provided to log.";
        }
    
        // Add the file note to the display
        textDisplayComponents.push(
            new TextDisplayBuilder().setContent(`**Log File:** ${fileNote}`)
        );
    
        // Build the container
        const containerBuilder = new ContainerBuilder()
            .setAccentColor(MessageLogColours.PURGE)
            .addTextDisplayComponents(...textDisplayComponents);
    
        // Add File component if attachment exists
        if (attachment) {
            containerBuilder.addFileComponents(
                new FileBuilder().setURL(`attachment://${attachmentName}`)
            );
        }
    
        const components = [containerBuilder];
    
        const messageLogChannel = await client.channels.fetch(settings.discord.channelsID.messageLog);
    
        if (!messageLogChannel || !messageLogChannel.isTextBased() || !messageLogChannel.isSendable()) {
            throw new Error("Failed to message log to channel. Likely misconfiguration, ensure settings.json is appropriately filled out and the bot has access to send messages in the channel.");
        }
    
        await messageLogChannel.sendTyping();
        try {
            await messageLogChannel.send({ 
                components: components, 
                flags: MessageFlags.IsComponentsV2,
                ...(attachment && { files: [attachment] })
            });
        } catch (error) {
            console.error(error);
        }
    }

    async logMessageDelete(message: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage<boolean>>, client: Client) {
        if (!message.guild || !message.channel.isTextBased() || message.partial) return;

        // Build the base text display components
        const textDisplayComponents = [
            new TextDisplayBuilder().setContent(`# ${MessageLogIcons.DELETE} Delete Message`),
            new TextDisplayBuilder().setContent(`-# Deleted at ~<t:${Math.floor(Date.now() / 1000)}:F>.`),
            new TextDisplayBuilder().setContent(`**Sender:** ${userMention(message.author.id)} [${message.author.id}]`),
            new TextDisplayBuilder().setContent(`**Created at:** <t:${Math.floor(message.createdTimestamp / 1000)}:F>`),
            new TextDisplayBuilder().setContent(`**Last edited at:** <t:${Math.floor(message.editedTimestamp || message.createdTimestamp / 1000)}:F>`),
            new TextDisplayBuilder().setContent(`${message.url}`),
            new TextDisplayBuilder().setContent("## Content"),
            new TextDisplayBuilder().setContent(message.content || "None")
        ];
    
        if (message.attachments.size > 0) textDisplayComponents.push(
            new TextDisplayBuilder().setContent("## Attachments")
        )

        // Build the container
        const containerBuilder = new ContainerBuilder()
            .setAccentColor(MessageLogColours.DELETE)
            .addTextDisplayComponents(...textDisplayComponents);

        // Prepare attachment lists
        const filesToUpload: Attachment[] = [];

        // Process all attachments
        if (message.attachments.size > 0) {
            for (const attachment of message.attachments.values()) {
                // Add the Attachment object to our array for uploading
                filesToUpload.push(attachment);

                // Create the FileBuilder component that *refers* to this file
                containerBuilder.addFileComponents(
                    new FileBuilder().setURL(`attachment://${attachment.name}`)
                );
            }
        }
    
        const components = [containerBuilder];
    
        const messageLogChannel = await client.channels.fetch(settings.discord.channelsID.messageLog);
    
        if (!messageLogChannel || !messageLogChannel.isTextBased() || !messageLogChannel.isSendable()) {
            throw new Error("Failed to message log to channel. Likely misconfiguration, ensure settings.json is appropriately filled out and the bot has access to send messages in the channel.");
        }
    
        await messageLogChannel.sendTyping();
        try {
            await messageLogChannel.send({ 
                components: components, 
                flags: MessageFlags.IsComponentsV2,
                files: filesToUpload
            });
            
        } catch (error) {
            console.error(error);
        }
    } 
}