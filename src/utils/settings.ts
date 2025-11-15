// Copyright (C) 2024-2025 The Queer Students' Association of Te Herenga Waka Victoria University of Wellington Incorporated, AGPL-3.0 Licence.

import { readFileSync } from "fs";
import { join } from "path";
const settings = JSON.parse(
    readFileSync(join(__dirname, "../../settings.json"), "utf-8")
);

export default settings;
