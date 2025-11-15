// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../@types";

// IT admin commands
import DeleteUserData from "../commands/itadmin/deleteUserData";

// Legal commands
import TermsCommand from "../commands/legal/terms";
import PrivacyCommand from "../commands/legal/privacy";
import MyUserDataCommand from "../commands/legal/mydata";

// Miscellaneous commands
import SocialCommand from "../commands/misc/socials";

// Moderation Commands
import BanCommand from "../commands/moderation/ban";
import UnbanCommand from "../commands/moderation/unban";
import KickCommand from "../commands/moderation/kick";
import MuteCommand from "../commands/moderation/mute";
import UnmuteCommand from "../commands/moderation/unmute";
import PurgeCommand from "../commands/moderation/purge";

// Verification commands
import VerifyCommand from "../commands/verification/verify";
import CodeCommand from "../commands/verification/code";
import LookupCommand from "../commands/verification/lookup";
import ManualVerifyCommand from "../commands/verification/manualVerify";

export default class InteractionHandler {
    private commands: Command[];

    constructor() {
        this.commands = [
            // IT Admin Commands
            new DeleteUserData(),

            // Legal Commands
            new TermsCommand(), 
            new PrivacyCommand(),
            new MyUserDataCommand(),

            // Miscellaneous Commands
            new SocialCommand(),

            // Moderation Commands
            new BanCommand(),
            new UnbanCommand(),
            new KickCommand(),
            new MuteCommand(),
            new UnmuteCommand(),
            new PurgeCommand(),

            // Verification Commands
            
            new VerifyCommand(),
            new CodeCommand(),
            new LookupCommand(),
            new ManualVerifyCommand()
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
        */

        const command = this.commands.find(
            (command) => command.name === interaction.commandName
        );

        if (!command) {
            console.error(`Command not found: ${interaction.commandName}`);
            return; // Return early instead of rejecting
        }

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
