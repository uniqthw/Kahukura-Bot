// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Db, InsertOneResult, MongoClient } from "mongodb";
import settings from "../../settings.json";
import { Snowflake } from "discord.js";
import { DBModLogEntry, DBVerificationUser, ModLogEntry, VerificationMessageCache } from "../../@types";

export default class MongoDb {
    private static instance: MongoDb;
    private db: Db;

    private constructor() {
        const client = new MongoClient(settings.mongo);
        client.connect();
        this.db = client.db();
    }

    static getInstance(): MongoDb {
        if (!MongoDb.instance) MongoDb.instance = new MongoDb();
        return MongoDb.instance;
    }

    async insertVerificationUser(id: Snowflake): Promise<void> {
        await this.db.collection<DBVerificationUser>("verification").insertOne({
            _id: id,
            email: undefined,
            verified: false,
            banned: false,
            verificationData: undefined
        });
    }

    async updateVerificationUser(user: DBVerificationUser): Promise<void> {
        await this.db.collection<DBVerificationUser>("verification").updateOne({ _id: user._id }, {
            $set: {
                email: user.email,
                verified: user.verified,
                banned: user.banned,
                verificationData: user.verificationData,
                manualVerificationData: user.manualVerificationData
            }
        }, { upsert: true });
    }

    async getVerificationUser(
        id: Snowflake
    ): Promise<DBVerificationUser | null> {
        const user = await this.db
            .collection<DBVerificationUser>("verification")
            .findOne({ _id: id });
        return user;
    }

    async getVerificationUserByEmail(email: string): Promise<DBVerificationUser | null> {
        const user = await this.db
            .collection<DBVerificationUser>("verification")
            .findOne({ email: email });
        return user;
    }

    async getManyVerificationUsersByEmail(email: string, currentUserId: string): Promise<DBVerificationUser[]> {
        const users = await this.db
            .collection<DBVerificationUser>("verification")
            .find({ email: email, _id: { $ne: currentUserId } })
            .toArray();
        return users;
    }

    async updateVerificationUserBanStatus(
        id: Snowflake,
        banned: DBVerificationUser["banned"]
    ): Promise<void> {
        await this.db
            .collection<DBVerificationUser>("verification")
            .updateOne({ _id: id }, { $set: { banned: banned } });
    }

    async updateVerificationUserVerificationStatus(
        id: Snowflake,
        verified: DBVerificationUser["verified"]
    ): Promise<void> {
        await this.db
            .collection<DBVerificationUser>("verification")
            .updateOne({ _id: id }, { $set: { verified: verified } });
    }

    async deleteVerificationUserData(id: Snowflake): Promise<void> {
        await this.db
            .collection<DBVerificationUser>("verification")
            .deleteOne({ _id: id });
    }

    async updateVerificationUserLatestDataRequest(
        id: Snowflake,
        lastDataRequest: DBVerificationUser["lastDataRequest"]
    ): Promise<void> {
        await this.db
            .collection<DBVerificationUser>("verification")
            .updateOne({ _id: id }, { $set: { lastDataRequest: lastDataRequest } });
    }

    // Verification message cache methods, should only be used for messages sent within the Discord server

    async setCacheVerificationMessage(memberId: Snowflake, messageId: Snowflake): Promise<void> {
        await this.db
            .collection<VerificationMessageCache>("verificationMessageCache")
            .updateOne({ _id: memberId }, {
                $set: {
                    messageId: messageId
                }
            }, { upsert: true });
    }

    async lookupCacheVerificationMessage(memberId: Snowflake): Promise<VerificationMessageCache | null> {
        const verificationMessageCache = await this.db
            .collection<VerificationMessageCache>("verificationMessageCache")
            .findOne({ _id: memberId });
        
        return verificationMessageCache;
    }

    async deleteCacheVerificationMessage(memberId: Snowflake): Promise<void> {
        await this.db
            .collection<VerificationMessageCache>("verificationMessageCache")
            .deleteOne({ _id: memberId });
    }

    // Moderation Log Methods
    async insertModLog(entry: ModLogEntry): Promise<InsertOneResult<DBModLogEntry>> {
        return await this.db.collection<DBModLogEntry>("modlogs").insertOne({
            action: entry.action,
            targetId: entry.target.id,
            moderatorId: entry.moderator.id,
            reason: entry.reason,
            duration: entry.duration,
            timestamp: entry.timestamp
        });
    }
}
