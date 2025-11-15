import { Client, GatewayIntentBits } from "discord.js";
import settings from "../src/utils/settings";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = settings.discord.token;
const ROLE_ID = settings.discord.rolesID.unverified;   // Role to give
const GUILD_ID = settings.discord.guildID; // Server where to add role

client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.members.fetch(); // Fetch all members

    const role = guild.roles.cache.get(ROLE_ID);
    if (!role) return console.log("Role not found!");

    console.log(`Assigning role to ${guild.members.cache.size} members...`);

    for (const [id, member] of guild.members.cache) {
        if (!member.roles.cache.has(ROLE_ID)) {
            try {
                await member.roles.add(role);
                console.log(`Added role to: ${member.user.tag}`);
                await new Promise(res => setTimeout(res, 500)); // 0.5s delay for safety
            } catch (err) {
                console.log(`Failed for ${member.user.tag}:`, err);
            }
        }
    }

    console.log("Done!");
});

client.login(TOKEN);
