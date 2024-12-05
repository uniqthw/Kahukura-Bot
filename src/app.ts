// Copyright (C) 2024 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

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

class KahukuraApplication {
    private client: Client;
    private interactionHandler: InteractionHandler;
    private verificationJoinHandler: VerificationJoinHandler;
    private verificationBanHandler: VerificationBanHandler;
    private discordRestClient: REST;

    constructor() {
        /*
            Creates a new discord.js client.
        */

        this.client = new Client({
            allowedMentions: { parse: ["users"] },
            intents: [GatewayIntentBits.Guilds]
        });

        this.interactionHandler = new InteractionHandler();
        this.verificationJoinHandler = new VerificationJoinHandler();
        this.verificationBanHandler = new VerificationBanHandler();
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

        // When a person joins a guild, this event will trigger which will fetch the verify command's ID and run that and the member information through handleJoin()
        this.client.on(Events.GuildMemberAdd, (member) => {
            if (member.guild.id !== settings.discord.guildID) return;

            let verifyCommandID;

            this.client.application?.commands
                .fetch()
                .then(
                    (commands) =>
                        (verifyCommandID = commands.find(
                            (command) => command.name === "verify"
                        )?.id)
                )
                .catch(console.error);

            this.verificationJoinHandler.handleJoin(member, verifyCommandID);
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
