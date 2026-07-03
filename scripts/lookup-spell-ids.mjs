/**
 * Extracts all unique talent names from wowData.ts, looks up their spell IDs
 * via the Blizzard API, and outputs a JSON mapping.
 *
 * Usage: node scripts/lookup-spell-ids.mjs
 * Requires: BATTLENET_CLIENT_ID and BATTLENET_CLIENT_SECRET in environment
 *
 * Reads .dev.vars for credentials automatically.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "..", "spell-ids.json");

// Load .dev.vars
const devVarsPath = path.join(__dirname, "..", ".dev.vars");
let CLIENT_ID = "";
let CLIENT_SECRET = "";
if (fs.existsSync(devVarsPath)) {
  const vars = fs.readFileSync(devVarsPath, "utf-8");
  for (const line of vars.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k.trim() === "BATTLENET_CLIENT_ID") CLIENT_ID = v.join("=").trim();
    if (k.trim() === "BATTLENET_CLIENT_SECRET") CLIENT_SECRET = v.join("=").trim();
  }
}

CLIENT_ID ||= process.env.BATTLENET_CLIENT_ID || "";
CLIENT_SECRET ||= process.env.BATTLENET_CLIENT_SECRET || "";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing Blizzard API credentials.");
  process.exit(1);
}

async function getToken() {
  const res = await fetch("https://oauth.battle.net/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
  });
  if (!res.ok) throw new Error(`Token failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function searchSpellId(token, name) {
  const url = `https://us.api.blizzard.com/data/wow/search/spell?namespace=static-us&locale=en_US&name.en_US=${encodeURIComponent(name)}&orderby=id&_page=1`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    return data.results[0].data.id;
  } catch {
    return null;
  }
}

function extractTalentNames() {
  const filePath = path.join(__dirname, "..", "src", "lib", "wowData.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  const talentNames = new Set();
  const regex = /name:\s*"([^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    talentNames.add(match[1]);
  }
  return [...talentNames].sort();
}

async function main() {
  const names = extractTalentNames();
  console.log(`Found ${names.length} unique talent names.`);

  const token = await getToken();
  console.log("Got Blizzard OAuth token.");

  const results = {};
  let found = 0;

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const id = await searchSpellId(token, name);
    if (id) {
      results[name] = id;
      found++;
    } else {
      results[name] = null;
    }

    // Incremental save every 50 names
    if ((i + 1) % 50 === 0 || i === names.length - 1) {
      const output = { _generated: new Date().toISOString(), _total: names.length, _found: found, spells: results };
      fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
      console.log(`  Progress: ${i + 1}/${names.length} (${found} found) -- saved`);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 75));
  }

  console.log(`\nDone. ${found}/${names.length} spells found. Output: ${OUT_PATH}`);
}

main().catch(console.error);
