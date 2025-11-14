// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../@types";

// Legal commands
import TermsCommand from "../commands/legal/terms";
import PrivacyCommand from "../commands/legal/privacy";
import MyUserDataCommand from "../commands/legal/mydata";

// IT admin commands
import DeleteUserData from "../commands/itadmin/deleteUserData";

// Verification commands
import VerifyCommand from "../commands/verification/verify";
import CodeCommand from "../commands/verification/code";
import LookupCommand from "../commands/verification/lookup";
import ManualVerifyCommand from "../commands/verification/manualVerify";

// Miscellaneous commands
import SocialCommand from "../commands/misc/socials";

// Moderation Commands
import BanCommand from "../commands/moderation/ban";
import UnbanCommand from "../commands/moderation/unban";
import KickCommand from "../commands/moderation/kick";
import MuteCommand from "../commands/moderation/mute";
import UnmuteCommand from "../commands/moderation/unmute";
import WarnCommand from "../commands/moderation/warn";
import PurgeCommand from "../commands/moderation/purge";
import LockCommand from "../commands/moderation/lock";
import UnlockCommand from "../commands/moderation/unlock";
import SlowmodeCommand from "../commands/moderation/slowmode";
import ModlogsCommand from "../commands/moderation/modlogs";
import UserinfoCommand from "../commands/moderation/userinfo";

export default class InteractionHandler {
    private commands: Command[];

    constructor() {
        this.commands = [
            new TermsCommand(), 
            new PrivacyCommand(),
            new VerifyCommand(),
            new CodeCommand(),
            new LookupCommand(),
            new ManualVerifyCommand(),
            new SocialCommand(),
            new DeleteUserData(),
            new MyUserDataCommand()
            // Moderation Commands
            // new BanCommand(),
            // new UnbanCommand(),
            // new KickCommand(),
            // new MuteCommand(),
            // new UnmuteCommand(),
            // new WarnCommand(),
            // new PurgeCommand(),
            // new LockCommand(),
            // new UnlockCommand(),
            // new SlowmodeCommand(),
            // new ModlogsCommand(),
            // new UserinfoCommand()
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
