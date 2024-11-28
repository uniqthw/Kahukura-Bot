// Copyright (C) 2024 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { GuildMember, Snowflake } from "discord.js";

export default class VerificationJoinHandler {
    async verificationCheck(member: GuildMember): Promise<boolean> {
        // check db if the user is verified
        return false;
    }

    async handleJoin(member: GuildMember, verifyCommandID: Snowflake | undefined): Promise<void> {
        // add unverified role straight away
        

        if ((await this.verificationCheck(member)) === true) {
            // use this to remove it if they are verified and then return
        };
        

        // if not verified continue



        member.user.send(`Kia ora ${member.user.displayName}, before you can interact within UniQ Te Herenga Waka, such as sending messages, you need to verify your account first.\n\nTo get verified e hoa, please run the ${verifyCommandID ? `</verify:${verifyCommandID}>` : "/verify"} command!`)
    }
}
