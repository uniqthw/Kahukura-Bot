// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import {
    Client,
    GatewayIntentBits,
    REST,
    Events,
    Snowflake,
    Routes,
    ChatInputCommandInteraction,
    AuditLogEvent,
    User
} from "discord.js";
import settings from "./utils/settings";

import InteractionHandler from "./handlers/interactionHandler";
import VerificationJoinHandler from "./handlers/verificationJoinHandler";
import VerificationBanHandler from "./handlers/verificationBanHandler";
import DynamicCommandHandler from "./handlers/dynamicCommandHandler";
import MessageLoggingHandler from "./handlers/messageLoggingHandler";
import ModLoggingHandler from "./handlers/modLoggingHandler";
import { ModLogActions } from "../@types";

class KahukuraApplication {
    private client: Client;
    private interactionHandler: InteractionHandler;
    private verificationJoinHandler: VerificationJoinHandler;
    private verificationBanHandler: VerificationBanHandler;
    private dynamicCommandHandler: DynamicCommandHandler;
    private messageLoggingHandler: MessageLoggingHandler;
    private modLoggingHandler: ModLoggingHandler;
    private discordRestClient: REST;

    constructor() {
        /*
            Creates a new discord.js client.
        */

        this.client = new Client({
            allowedMentions: {},
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.interactionHandler = new InteractionHandler();
        this.verificationJoinHandler = new VerificationJoinHandler();
        this.verificationBanHandler = new VerificationBanHandler();
        this.dynamicCommandHandler = new DynamicCommandHandler();
        this.messageLoggingHandler = new MessageLoggingHandler();
        this.modLoggingHandler = new ModLoggingHandler();
        this.discordRestClient = new REST().setToken(settings.discord.token);
    }

    start() {
        /* 
            Start discord.js client function.
        */

        this.client
            .login(settings.discord.token)
            .then(() => {
                this.addClientEventHandlers();
                if (this.client.application?.id)
                    this.registerSlashCommands(this.client.application.id);
            })
            .catch((err) => {
                console.error(err);
            });
    }

    async addClientEventHandlers() {
        /* 
            Discord client event handlers.
        */

        // Logs to console once the client connects and is ready
        this.client.on(Events.ClientReady, (bot) => {
            console.log(
                `Connected to the Discord client as ${bot.user.username}#${bot.user.discriminator} (${bot.user.id}).`
            );
        });

        // Error event handler, logs to console on error
        this.client.on(Events.Error, (err: Error) => {
            console.error(`Client error ${err}`);
        });

        // Receives any client interaction events and runs them through handleInteraction() in InteractionHandler
        this.client.on(Events.InteractionCreate, async (interaction) => {
            // Only handle chat input (slash) commands, ignore button interactions and other types
            if (interaction.isChatInputCommand()) {
                try {
                    await this.interactionHandler.handleInteraction(
                        interaction as ChatInputCommandInteraction
                    );
                } catch (error) {
                    console.error("Error handling interaction:", error);
                }
            }
        });

        // When a person joins a guild, this event will trigger which will add the unverified role
        this.client.on(Events.GuildMemberAdd, async (member) => {
            if (member.guild.id !== settings.discord.guildID) return;

            try {
                const verifyCommand =
                    await this.dynamicCommandHandler.getVerifyCommand(
                        this.client
                    );
                this.verificationJoinHandler.handleJoin(member, verifyCommand);
            } catch (error) {
                console.error(
                    "Error fetching commands for GuildMemberAdd:",
                    error
                );
                // Still call handleJoin but with undefined verifyCommandID
                this.verificationJoinHandler.handleJoin(member, undefined);
            }
        });

        this.client.on(Events.MessageCreate, async (message) => {
            // Delete messages sent in the unverified channel that are sent by a user. Interactions such as /verify and /code commands will not be affected.
            if (
                !message.author.bot &&
                settings.discord.channelsID.unverified == message.channel.id
            ) {
                try {
                    await message.delete();
                } catch (error) {
                    console.error(
                        "Failed to delete message in unverified channel: ",
                        error
                    );
                }

                // Crosspost messages sent in the socials channel that are sent by a webhook.
            } else if (
                message.webhookId &&
                settings.discord.channelsID.socials == message.channel.id
            ) {
                try {
                    await message.crosspost();
                } catch (error) {
                    console.error(
                        "Failed to crosspost message in socials channel: ",
                        error
                    );
                }
            }
        });

        this.client.on(Events.GuildBanAdd, async (ban) => {
            if (ban.guild.id !== settings.discord.guildID) return;

            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanAdd
            });

            const auditLog = fetchedLogs.entries.first();

            if (!auditLog || auditLog.executorId === this.client.user?.id)
                return;

            const modLogEntry = {
                action: ModLogActions.BAN,
                target: ban.user as User,
                moderator: auditLog.executor as User,
                reason:
                    ban.reason ||
                    "Not specified in non-bot execution of punishment.",
                timestamp: auditLog.createdTimestamp
            };

            this.modLoggingHandler.logModAction(modLogEntry, this.client);
            this.verificationBanHandler.handleBanAdd(ban.user);
        });

        this.client.on(Events.GuildBanRemove, async (ban) => {
            if (ban.guild.id !== settings.discord.guildID) return;

            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanRemove
            });

            const auditLog = fetchedLogs.entries.first();

            if (!auditLog || auditLog.executorId === this.client.user?.id)
                return;

            const modLogEntry = {
                action: ModLogActions.UNBAN,
                target: ban.user as User,
                moderator: auditLog.executor as User,
                reason:
                    ban.reason ||
                    "Not specified in non-bot execution of punishment.",
                timestamp: auditLog.createdTimestamp
            };

            this.modLoggingHandler.logModAction(modLogEntry, this.client);
            this.verificationBanHandler.handleBanRemove(ban.user);
        });

        this.client.on(Events.MessageDelete, async (message) => {
            await this.messageLoggingHandler.logMessageDelete(
                message,
                this.client
            );
        });

        this.client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
            this.messageLoggingHandler.logMessageUpdate(
                oldMessage,
                newMessage,
                this.client
            );
        });

        this.client.on(Events.GuildMemberRemove, async (member) => {
            const fetchedLogs = await member.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberKick
            });

            const auditLog = fetchedLogs.entries.first();

            if (
                !auditLog ||
                auditLog.executorId === this.client.user?.id ||
                (member.joinedAt && auditLog.createdAt < member.joinedAt)
            )
                return;

            const modLogEntry = {
                action: ModLogActions.KICK,
                target: member.user as User,
                moderator: auditLog.executor as User,
                reason:
                    auditLog.reason ||
                    "Not specified in non-bot execution of punishment.",
                timestamp: auditLog.createdTimestamp
            };

            this.modLoggingHandler.logModAction(modLogEntry, this.client);
        });

        this.client.on(
            Events.GuildMemberUpdate,
            async (oldMember, newMember) => {
                const fetchedLogs = await newMember.guild.fetchAuditLogs({
                    limit: 1,
                    type: AuditLogEvent.MemberUpdate
                });

                const auditLog = fetchedLogs.entries.first();

                if (!auditLog || auditLog.executorId === this.client.user?.id)
                    return;

                if (
                    oldMember.communicationDisabledUntil !==
                    newMember.communicationDisabledUntil
                ) {
                    if (newMember.communicationDisabledUntil === null) {
                        const modLogEntry = {
                            action: ModLogActions.UNTIMEOUT,
                            target: newMember.user as User,
                            moderator: auditLog.executor as User,
                            reason:
                                auditLog.reason ||
                                "Not specified in non-bot execution of punishment.",
                            timestamp: auditLog.createdTimestamp
                        };

                        this.modLoggingHandler.logModAction(
                            modLogEntry,
                            this.client
                        );
                    } else if (
                        newMember.communicationDisabledUntil !== null &&
                        newMember.communicationDisabledUntilTimestamp !== null
                    ) {
                        const duration =
                            newMember.communicationDisabledUntilTimestamp -
                            auditLog.createdTimestamp;

                        const modLogEntry = {
                            action: ModLogActions.TIMEOUT,
                            target: newMember.user as User,
                            moderator: auditLog.executor as User,
                            reason:
                                auditLog.reason ||
                                "Not specified in non-bot execution of punishment.",
                            timestamp: auditLog.createdTimestamp,
                            duration: {
                                expiry: auditLog.createdTimestamp + duration
                            }
                        };

                        this.modLoggingHandler.logModAction(
                            modLogEntry,
                            this.client
                        );
                    }
                }
            }
        );
    }

    registerSlashCommands(clientID: Snowflake) {
        /*
            Register the slash commands with the Discord API as global application commands.
        */

        const commands = this.interactionHandler.getSlashCommands();

        this.discordRestClient
            .put(Routes.applicationCommands(clientID), {
                body: commands
            })
            .then((data: any) => {
                console.log(data);
                console.log(
                    `Successfully registered ${data.length} global application (/) commands.`
                );
            })
            .catch((err) => {
                console.error(
                    `Error registering application (/) commands: ${err}`
                );
            });
    }
}

new KahukuraApplication().start();
