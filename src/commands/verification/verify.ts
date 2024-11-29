// Copyright (C) 2024 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../@types";

/* 
note when user attempts to verify already existing email ensure check

make it so that when existing email done, the user who verified originally is kicked after verification done

link to bans etc

if user not verified but email attached ensure that new email sent if been longer than 2 minutes
*/

export default class VerifyCommand implements Command {
    name = "verify";
    description = "";
    slashCommand = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

    async execute(interaction: ChatInputCommandInteraction): Promise<any> {
        
    }
}