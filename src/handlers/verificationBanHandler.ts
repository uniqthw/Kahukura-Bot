// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { GuildMember, Snowflake, User } from "discord.js";
import settings from "../utils/settings";
import MongoDb from "../utils/mongo";
import { VerificationUserCheck } from "../../@types";

export default class VerificationBanHandler {
    /* 
        Runs when a user is banned. If a user has a database entry in the database, it will update their banned flag to true.
    */
    async handleBanAdd(user: User): Promise<void> {
        const verificationUser =
            await MongoDb.getInstance().getVerificationUser(user.id);

        if (!verificationUser || verificationUser.banned === true) return;

        await MongoDb.getInstance().updateVerificationUserBanStatus(
            user.id,
            true
        );
    }

    /*
        Runs when a user is unbanned. If a user has a database entry in the database, it will update their banned flag to false.
    */
    async handleBanRemove(user: User): Promise<void> {
        const verificationUser =
            await MongoDb.getInstance().getVerificationUser(user.id);

        if (!verificationUser || verificationUser.banned === false) return;

        await MongoDb.getInstance().updateVerificationUserBanStatus(
            user.id,
            false
        );
    }
}
