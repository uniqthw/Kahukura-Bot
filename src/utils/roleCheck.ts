// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { APIInteractionGuildMember, GuildMember, User } from "discord.js";
import settings from "./settings";

export function isCheckuser(user: User): boolean {
    const checkuserArray = settings.discord.usersID.checkuser;

    if (Array.isArray(checkuserArray) && checkuserArray.includes(user.id)) return true;

    return false;
}

export function isITAdmin(user: User): boolean {
    const itAdminArray = settings.discord.usersID.itadmins;

    if (Array.isArray(itAdminArray) && itAdminArray.includes(user.id)) return true;

    return false;
}
