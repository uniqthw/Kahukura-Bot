// Copyright (C) 2024 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { GuildMember, Snowflake } from "discord.js";
import settings from "../../settings.json";
import MongoDb from "../utils/mongo";
import { VerificationUserCheck } from "../../@types";

export default class VerificationJoinHandler {
    /*
        Checks if a user with the ID specified has already previously verified or banned.
    */
    async verificationCheck(id: Snowflake): Promise<VerificationUserCheck> {
        // Runs .getVerificationUser() to fetch the specified ID's document from the collection.
        const userExists = await MongoDb.getInstance().getVerificationUser(id);

        // Returns boolean for .verified and .banned depending on the entry in the DB. Returns false if entry undefined or null.
        return { verified: userExists?.verified ? true : false, banned: userExists?.banned ? true : false };
    }

    /* 
        Allows an already verified member access to the server, and bans users marked as banned;
        otherwise, quarantines unverified users until they verify.
    */
    async handleJoin(
        member: GuildMember,
        verifyCommandID: Snowflake | undefined
    ): Promise<void> {
        // Automatically quarantines all users who join until all checks complete
        await member.roles.add(
            settings.discord.rolesID.unverified,
            "Initial user join, adding unverified role until verification check completes."
        );

        const verificationCheck = await this.verificationCheck(member.user.id);

        // Check if a user is marked as banned in the database, and bans if they are
        if (verificationCheck.banned) {
            member.user.send("E hoa, your account is flagged as banned in UniQ Te Herenga Waka's verification database. Please contact info@uniqthw.org.nz to appeal.")
            await member.ban({ reason: "User's account is flaggeed as banned in the verification database." });
            return;
        }

        // Check if a user is already verified in the database, and un-quarantines them if they are
        if (verificationCheck.verified) {
            await member.roles.remove(
                settings.discord.rolesID.unverified,
                "User has already verified with their student or staff email."
            );
            return;
        }

        // If a user is not verified, keep them quarantined and send them a DM asking them to verify
        const verifyCommand = verifyCommandID
            ? `</verify:${verifyCommandID}>`
            : "/verify";

        member.user.send(
            `Kia ora ${member.user.displayName}, before you can interact within UniQ Te Herenga Waka, such as sending messages, you need to verify your account first.\n\nTo get verified e hoa, please run the ${verifyCommand} command!`
        );
    }
}
