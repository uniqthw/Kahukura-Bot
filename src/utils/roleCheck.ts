// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { APIInteractionGuildMember, GuildMember, User } from "discord.js";
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

export function isCheckuser(user: User): boolean {
    const checkuserArray = settings.discord.usersID.checkuser;

    if (Array.isArray(checkuserArray) && checkuserArray.includes(user.id)) return true;

    return false;
}
