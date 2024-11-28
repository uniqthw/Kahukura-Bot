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
            lastest_attempt: {
                code: undefined,
                timestamp: undefined
            }
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

    async updateVerificationUser() {
        // uhhh think about this one
        /* 
        whether in this or not, verification will be required for initial /verify command when setting email, 
        and when doing /verify afterwards on same account to update the code and timestamp

        furthermore, if another account attempts to use same email, it will have to send an email, idk some form of unlinking process
        that does not harm the other account if a bad faith actor attempts to unlink despite not having authority to do so
    
        */
    }
}
