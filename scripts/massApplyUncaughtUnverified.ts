// Copyright (C) 2024-2026 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { Client, GatewayIntentBits } from "discord.js";
import settings from "../src/utils/settings";
import MongoDb from "../src/utils/mongo";

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const nondryrun = false; // false = a dry run; true means it will add roles
const TOKEN = settings.discord.token;
const ROLE_ID = settings.discord.rolesID.unverified; // Role to give
const GUILD_ID = settings.discord.guildID; // Server where to add role

client.once("ready", async () => {
    console.log(`Logged in as ${client.user?.tag}`);

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.members.fetch(); // Fetch all members

        const role = guild.roles.cache.get(ROLE_ID);
        if (!role) {
            console.error("Role not found!");
            process.exit(1);
        }

        console.log(`Checking ${guild.members.cache.size} members...`);

        for (const [id, member] of guild.members.cache) {
            if (member.user.bot) continue;

            if (!member.roles.cache.has(ROLE_ID)) {
                const userExists =
                    await MongoDb.getInstance().getVerificationUser(id);

                if (userExists?.verified) {
                    console.log(
                        `Skipping user ${member.user.tag}, already verified!`
                    );

                    continue;
                }

                try {
                    if (nondryrun) await member.roles.add(role);
                    console.log(`Added role to: ${member.user.tag}, they are not verified!`);
                    if (nondryrun) await new Promise((res) => setTimeout(res, 500)); // 0.5s delay for safety
                } catch (err) {
                    console.log(`Failed for ${member.user.tag}:`, err);
                }
            }
        }

        console.log("Done!");
        client.destroy();
        process.exit(0);
    } catch (error) {
        console.error("Failed to fetch guild or members:", error);
        process.exit(1);
    }
});

client.login(TOKEN).catch((error) => {
    console.error("Failed to login:", error);
    process.exit(1);
});
