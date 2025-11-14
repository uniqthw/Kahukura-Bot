// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import {
    Client,
    GatewayIntentBits,
    REST,
    Events,
    Snowflake,
    Routes,
    ChatInputCommandInteraction
} from "discord.js";
import settings from "../settings.json";

import InteractionHandler from "./handlers/interactionHandler";
import VerificationJoinHandler from "./handlers/verificationJoinHandler";
import VerificationBanHandler from "./handlers/verificationBanHandler";
import DynamicCommandHandler from "./handlers/dynamicCommandHandler";

class KahukuraApplication {
    private client: Client;
    private interactionHandler: InteractionHandler;
    private verificationJoinHandler: VerificationJoinHandler;
    private verificationBanHandler: VerificationBanHandler;
    private dynamicCommandHandler: DynamicCommandHandler;
    private discordRestClient: REST;

    constructor() {
        /*
            Creates a new discord.js client.
        */

        this.client = new Client({
            allowedMentions: {},
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildMessages]
        });

        this.interactionHandler = new InteractionHandler();
        this.verificationJoinHandler = new VerificationJoinHandler();
        this.verificationBanHandler = new VerificationBanHandler();
        this.dynamicCommandHandler = new DynamicCommandHandler();
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

    addClientEventHandlers() {
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
        this.client.on(Events.InteractionCreate, (interaction) => {
            this.interactionHandler.handleInteraction(
                interaction as ChatInputCommandInteraction
            );
        });

        // When a person joins a guild, this event will trigger which will add the unverified role
        this.client.on(Events.GuildMemberAdd, async (member) => {
            if (member.guild.id !== settings.discord.guildID) return;

            try {
                const verifyCommandID = await this.dynamicCommandHandler.getVerifyCommand(this.client);
                this.verificationJoinHandler.handleJoin(member, verifyCommandID);
            } catch (error) {
                console.error("Error fetching commands for GuildMemberAdd:", error);
                // Still call handleJoin but with undefined verifyCommandID
                this.verificationJoinHandler.handleJoin(member, undefined);
            }
        });

        this.client.on(Events.MessageCreate, async (message) => {
            // Delete messages sent in the unverified channel that are sent by a user. Interactions such as /verify and /code commands will not be affected.
            if (!message.author.bot && settings.discord.channelsID.unverified == message.channel.id) {
                try {
                    await message.delete();
                } catch (error) {
                    console.error("Failed to delete message in unverified channel: ", error);
                }

            // Crosspost messages sent in the socials channel that are sent by a webhook.
            } else if (message.webhookId && settings.discord.channelsID.socials == message.channel.id) {
                try {
                    await message.crosspost();
                } catch (error) {
                    console.error("Failed to crosspost message in socials channel: ", error);
                }
            }
        });

        this.client.on(Events.GuildBanAdd, (ban) => {
            if (ban.guild.id !== settings.discord.guildID) return;

            this.verificationBanHandler.handleBanAdd(ban.user);
        });

        this.client.on(Events.GuildBanRemove, (ban) => {
            if (ban.guild.id !== settings.discord.guildID) return;

            this.verificationBanHandler.handleBanRemove(ban.user);
        });
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
