// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Client } from "discord.js";

export default class DynamicCommandHandler {
    async getVerifyCodeCommand(client: Client) {
        const commands = await client.application?.commands.fetch();
        const verifyCodeCommandID = commands?.find(
            (command) => command.name === "code"
        )?.id;

        return verifyCodeCommandID ? `</code:${verifyCodeCommandID}>` : "/code";
    }

    async getVerifyCommand(client: Client) {
        const commands = await client.application?.commands.fetch();
        const verifyCodeCommandID = commands?.find(
            (command) => command.name === "verify"
        )?.id;

        return verifyCodeCommandID
            ? `</verify:${verifyCodeCommandID}>`
            : "/verify";
    }
}
