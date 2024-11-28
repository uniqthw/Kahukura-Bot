# Kahukura Bot
Kia ora! This is the Discord bot used on UniQ Te Herenga Waka's Discord server. The purpose of this bot is to provide verification and moderation tools within the Discord server.

* If you would like to contribute, please read our [CONTRIBUTING.md](https://github.com/uniqthw/Kahukura-Bot/blob/main/CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](https://github.com/uniqthw/Kahukura-Bot/blob/main/CODE_OF_CONDUCT.md).
* If there is a security vulnerability, read our security policy at [SECURITY.md](https://github.com/uniqthw/Kahukura-Bot/blob/main/.github/SECURITY.md).


## Setup
This will assume you know how to download and install Node.js, and setup MongoDB. To figure out how to do this, Google is your friend.

### Requirements
* Node.js (v22)
* MongoDB
* pnpm (installable through `corepack`)

### Configuration

1. Rename the `settings.example.json` file to `settings.json`.
2. Fill out the `token` property with the Discord token.
3. Fill out the `mongo` property with a MongoDB connection URI. This needs to include the database.
4. Fill out the `guildID` property with the ID of the server you are using the bot on.
5. Fill out the `rolesID.unverified` property with a Discord role ID for an unverified role. This will be assigned to users who are not verified, and can be used to prevent people from sending messages using channel overrides.

### Installation and running
1. Run the `pnpm i` command to install all of the bot dependencies.
2. Run the bot by using the `pnpm run start` command.