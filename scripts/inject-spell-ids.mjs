/**
 * Injects spell IDs from spell-ids.json into wowData.ts TalentNode entries.
 * Handles both single and double-quoted field keys.
 *
 * Usage: node scripts/inject-spell-ids.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const spellMap = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "spell-ids.json"), "utf-8")).spells;
const filePath = path.join(__dirname, "..", "src", "lib", "wowData.ts");
let content = fs.readFileSync(filePath, "utf-8");

let count = 0;

for (const [talentName, spellId] of Object.entries(spellMap)) {
  if (!spellId) continue;
  const escaped = talentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(\\{)\\s*(name:\\s*"${escaped}")([^}]*)(\\})`, "g");
  content = content.replace(regex, (match, open, namePart, rest, close) => {
    if (rest.includes("row:") && rest.includes("col:") && rest.includes("selected:")) {
      if (!rest.includes("id:")) {
        count++;
        // rest starts with ", " so we insert BEFORE it without extra comma
        return `${open} ${namePart}, id: ${spellId}${rest}${close}`;
      }
    }
    return match;
  });
}

fs.writeFileSync(filePath, content, "utf-8");
console.log(`Injected ${count} spell IDs into wowData.ts`);
