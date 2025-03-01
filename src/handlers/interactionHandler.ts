// Copyright (C) 2024 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../@types";

import TermsCommand from "../commands/legal/terms";
import PrivacyCommand from "../commands/legal/privacy";
import VerifyCommand from "../commands/verification/verify";
import CodeCommand from "../commands/verification/code";
import LookupCommand from "../commands/verification/lookup";

export default class InteractionHandler {
    private commands: Command[];

    constructor() {
        this.commands = [
            new TermsCommand(), 
            new PrivacyCommand(),
            new VerifyCommand(),
            new CodeCommand(),
            new LookupCommand()
        ];
    }

    getSlashCommands() {
        /*
            Map of all the commands data in JSON format, allows format to be sent to Discord API for slash command options.
        */

        return this.commands.map((command: Command) =>
            command.slashCommand.toJSON()
        );
    }

    async handleInteraction(
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        /* 
            Handles any interactions sent from Discord API by seeing if the interaction executed is in the list of 
            commands defined by this.commands().

            If it is not, it returns a promise rejection. Otherwise, it executes the command and logs on success or error.
        */

        const command = this.commands.find(
            (command) => command.name === interaction.commandName
        );

        if (!command) return Promise.reject("Command not found.");

        command
            .execute(interaction)
            .then(() => {
                console.log(
                    `Sucesfully executed command [/${interaction.commandName}]`,
                    {
                        guild: {
                            id: interaction.guildId,
                            name: interaction.guild?.name
                        },
                        user: { name: interaction.user.globalName }
                    }
                );
            })
            .catch((err) => {
                console.log(
                    `Error executing command [/${interaction.commandName}]: ${err}`,
                    {
                        guild: {
                            id: interaction.guildId,
                            name: interaction.guild?.name
                        },
                        user: { name: interaction.user.globalName }
                    }
                );
            });
    }
}
