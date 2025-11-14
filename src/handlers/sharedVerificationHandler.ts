// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Guild, Snowflake } from "discord.js";
import MongoDb from "../utils/mongo";

export default class SharedVerificationHandler {
    async removeVerificationFromOtherUsers(currentUserId: Snowflake, email: string, guild: Guild) {
        // Remove verification from any other users with the same email attached
    
        const users = await MongoDb.getInstance().getManyVerificationUsersByEmail(email, currentUserId);
    
        for (const user of users) {
            await MongoDb.getInstance().updateVerificationUserVerificationStatus(user._id, false);
        
            try {
                const member = await guild.members.fetch(user._id);
                if (member.kickable) await member.kick(`User verification revoked due to another user (ID: ${currentUserId}) verifying with the same email.`);
            } catch(error) {
                console.error(`Failed to kick user with ID ${user._id}: `, error);
            }
        }
    }
}