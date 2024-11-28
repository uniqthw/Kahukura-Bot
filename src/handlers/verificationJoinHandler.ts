// Copyright (C) 2024 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { GuildMember, Snowflake } from "discord.js";
import settings from "../../settings.json";
import MongoDb from "../utils/mongo";

export default class VerificationJoinHandler {
    /*
        Checks if a user with the ID specified has already previously verified.
    */
    async verificationCheck(id: Snowflake): Promise<boolean> {
        // Runs .getVerificationUser() to fetch the specified ID's document from the collection.
        const userExists = await MongoDb.getInstance().getVerificationUser(id);

        // Checks to see if there is a document for that ID and if .verified property is true or false, and returns accordingly.
        return userExists?.verified ? true : false;
    }

    /* 
        Allows an already verified member access to the server, otherwise, quarantines unverified users until they verify.
    */
    async handleJoin(
        member: GuildMember,
        verifyCommandID: Snowflake | undefined
    ): Promise<void> {
        await member.roles.add(
            settings.discord.rolesID.unverified,
            "Initial user join, adding unverified role until verification check completes."
        );

        if (await this.verificationCheck(member.user.id)) {
            await member.roles.remove(
                settings.discord.rolesID.unverified,
                "User has already verified with their student or staff email."
            );
        }

        MongoDb.getInstance().insertVerificationUser(member.user.id);

        const verifyCommand = verifyCommandID
            ? `</verify:${verifyCommandID}>`
            : "/verify";
        member.user.send(
            `Kia ora ${member.user.displayName}, before you can interact within UniQ Te Herenga Waka, such as sending messages, you need to verify your account first.\n\nTo get verified e hoa, please run the ${verifyCommand} command!`
        );
    }
}
