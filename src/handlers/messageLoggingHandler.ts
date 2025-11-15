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
        console.log(`[PURGE DEBUG] Starting logPurgeAction`);
        console.log(`[PURGE DEBUG] deletedCount: ${deletedCount}`);
        console.log(`[PURGE DEBUG] deletedMessages.length: ${deletedMessages?.length || 0}`);
        console.log(`[PURGE DEBUG] targetUser: ${targetUser?.tag || 'none'}`);
        
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
            console.log(`[PURGE DEBUG] Processing ${deletedMessages.length} messages`);
            
            // Sort messages from oldest to newest
            const sortedMessages = deletedMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
            console.log(`[PURGE DEBUG] Sorted ${sortedMessages.length} messages`);
    
            // Format the log content
            const logContent = sortedMessages
                .map((msg, index) => {
                    const timestamp = msg.createdAt.toLocaleString();
                    const author = `${msg.author.tag} (${msg.author.id})`;
                    
                    // Debug each message
                    console.log(`[PURGE DEBUG] Message ${index + 1}: author=${msg.author.tag}, content length=${msg.content?.length || 0}`);
                    
                    // Get message content, excluding attachments.
                    const content = msg.content 
                        ? `\n    ${msg.content.replace(/\n/g, '\n    ')}` 
                        : "[No Message Content]";
                    
                    return `[${timestamp}] ${author}: ${content}`;
                })
                .join("\n\n");
    
            console.log(`[PURGE DEBUG] logContent length: ${logContent.length} characters`);
            console.log(`[PURGE DEBUG] First 200 chars of logContent: ${logContent.substring(0, 200)}`);
    
            const fileBuffer = Buffer.from(logContent, 'utf-8');
            console.log(`[PURGE DEBUG] fileBuffer size: ${fileBuffer.byteLength} bytes`);
    
            if (fileBuffer.byteLength === 0) {
                fileNote = "No message content was found to log.";
                console.log(`[PURGE DEBUG] Buffer is empty, no attachment created`);
            } else {
                const fileName = attachmentName;
                attachment = new AttachmentBuilder(fileBuffer, { name: fileName });
                fileNote = "A log of all deleted message content is attached.";
                console.log(`[PURGE DEBUG] Attachment created: ${fileName}`);
                console.log(`[PURGE DEBUG] attachment object exists: ${!!attachment}`);
            }
        } else {
            fileNote = "No messages were provided to log.";
            console.log(`[PURGE DEBUG] No messages provided to log`);
        }
    
        // Add the file note to the display
        textDisplayComponents.push(
            new TextDisplayBuilder().setContent(`**Log File:** ${fileNote}`)
        );
    
        const containerBuilder = new ContainerBuilder() 
                .setAccentColor(MessageLogColours.PURGE)
                .addTextDisplayComponents(...textDisplayComponents)

        // Add File component if attachment exists
        if (attachment) {
            containerBuilder.addFileComponents(
                new FileBuilder().setURL(`attachment://${attachmentName}`)
            );
            console.log(`[PURGE DEBUG] Added File component with reference: attachment://${attachmentName}`);
        }
    
        const messageLogChannel = await client.channels.fetch(settings.discord.channelsID.messageLog);
    
        if (!messageLogChannel || !messageLogChannel.isTextBased() || !messageLogChannel.isSendable()) {
            throw new Error("Failed to message log to channel. Likely misconfiguration, ensure settings.json is appropriately filled out and the bot has access to send messages in the channel.");
        }
    
        await messageLogChannel.sendTyping();
        try {
            console.log(`[PURGE DEBUG] Sending message. Attachment exists: ${!!attachment}`);
            
            const payload: any = { 
                components: [containerBuilder], 
                flags: MessageFlags.IsComponentsV2
            };
            
            if (attachment) {
                payload.files = [attachment];
                console.log(`[PURGE DEBUG] Added files to payload`);
            }
            
            console.log(`[PURGE DEBUG] Payload keys: ${Object.keys(payload).join(', ')}`);
            
            await messageLogChannel.send(payload);
            console.log(`[PURGE DEBUG] Message sent successfully`);
        } catch (error) {
            console.error('[PURGE ERROR] Failed to send message:', error);
        }
    }
}