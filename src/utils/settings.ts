import { readFileSync } from "fs";
import { join } from "path";
const settings = JSON.parse(readFileSync(join(__dirname, "../../settings.json"), "utf-8"));

export default settings;