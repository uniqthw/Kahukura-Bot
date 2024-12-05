// Copyright (C) 2024 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Db, MongoClient, ObjectId } from "mongodb";
import settings from "../../settings.json";
import { Snowflake } from "discord.js";
import { DBVerificationUser } from "../../@types";

export default class MongoDb {
    private static instance: MongoDb;
    private db: Db;

    private constructor() {
        const client = new MongoClient(settings.mongo_uri);
        client.connect();
        this.db = client.db();
    }

    static getInstance(): MongoDb {
        if (!MongoDb.instance) MongoDb.instance = new MongoDb();
        return MongoDb.instance;
    }

    async insertVerificationUser(id: Snowflake): Promise<void> {
        await this.db.collection<DBVerificationUser>("verification").insertOne({
            _id: new ObjectId(id),
            email: undefined,
            verified: false,
            banned: false,
            verificationData: undefined
        });
    }

    async getVerificationUser(
        id: Snowflake
    ): Promise<DBVerificationUser | null> {
        const user = await this.db
            .collection<DBVerificationUser>("verification")
            .findOne({ _id: new ObjectId(id) });
        return user;
    }

    async updateVerificationUserBanStatus(
        id: Snowflake,
        banned: DBVerificationUser["banned"]
    ): Promise<void> {
        await this.db
            .collection<DBVerificationUser>("verification")
            .updateOne(new ObjectId(id), {
                banned: banned
            });
    }
}
