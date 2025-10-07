import { GuildMember } from "discord.js";
import settings from "../../settings.json";

/**
 * Check if a guild member has the moderator role
 * @param member The guild member to check
 * @returns true if the member has the moderator role, false otherwise
 */
export function hasModeratorRole(member: GuildMember): boolean {
    const moderatorRoleId = settings.discord.rolesID.moderator;
    return member.roles.cache.has(moderatorRoleId);
}