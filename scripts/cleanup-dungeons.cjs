const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

/* Remove all Dungeons-category lobbies EXCEPT Transcendence / Expeditions
   (solo dungeon content is useless for LFG). Usage:
   node scripts/cleanup-dungeons.cjs --dry-run            # local, no writes
   node scripts/cleanup-dungeons.cjs --remote             # remote D1
*/

const DRY = process.argv.includes("--dry-run");
const remote = process.argv.includes("--remote");
const flag = remote ? "--remote" : "--local";
const dbName = "uplink-db";
const cwd = path.join(__dirname, "..");

const KEPT_DUNGEON_SERVICES = new Set(["Transcendence", "Expeditions"]);

function isRemovedDungeonOffer(l) {
  const cat = String(l?.category || "").toLowerCase();
  if (cat !== "dungeon" && cat !== "dungeons") return false;
  return !KEPT_DUNGEON_SERVICES.has(String(l?.serviceName || ""));
}

function results(command) {
  const raw = execSync(
    `npx wrangler d1 execute ${dbName} ${flag} --command="${command}" --json`,
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 256 * 1024 * 1024 }
  );
  const parsed = JSON.parse(raw);
  return (parsed[0]?.results ?? []).flatMap((r) => (Array.isArray(r) ? r : [r]));
}

function runSqlFile(file) {
  const raw = execSync(
    `npx wrangler d1 execute ${dbName} ${flag} --file="${file}" --json`,
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 256 * 1024 * 1024 }
  );
  return JSON.parse(raw);
}

try {
  const rows = results("SELECT value FROM kv_store WHERE key = 'lobbies'");
  if (rows.length === 0) {
    console.log("No 'lobbies' key found. Nothing to do.");
    process.exit(0);
  }
  const raw = rows[0].value;
  let lobbies;
  try {
    lobbies = JSON.parse(raw);
  } catch (e) {
    console.error("kv_store['lobbies'] is not valid JSON:", e.message);
    process.exit(1);
  }
  if (!Array.isArray(lobbies)) {
    console.error("kv_store['lobbies'] is not a JSON array.");
    process.exit(1);
  }

  const distrib = {};
  for (const l of lobbies) {
    const cat = String(l?.category || "(none)").toLowerCase();
    distrib[cat] = (distrib[cat] || 0) + 1;
  }
  const removed = lobbies.filter(isRemovedDungeonOffer);
  const kept = lobbies.filter((l) => !isRemovedDungeonOffer(l));
  const removedDistrib = {};
  for (const l of removed) {
    const svc = String(l?.serviceName || "(no serviceName)");
    removedDistrib[svc] = (removedDistrib[svc] || 0) + 1;
  }

  console.log(`Target: ${dbName} (${remote ? "remote" : "local"})`);
  console.log(`Total lobbies: ${lobbies.length}`);
  console.log("Category distribution:", JSON.stringify(distrib));
  console.log(`Dungeon offers to remove: ${removed.length}`);
  console.log("Removed by serviceName:", JSON.stringify(removedDistrib, null, 2));

  if (removed.length === 0) {
    console.log("Nothing to remove.");
    process.exit(0);
  }
  if (DRY) {
    console.log("Dry-run: no changes written.");
    process.exit(0);
  }

  const sql = `UPDATE kv_store SET value = '${JSON.stringify(kept).replace(/'/g, "''")}' WHERE key = 'lobbies';`;
  const tmp = path.join(os.tmpdir(), `uplink-cleanup-dungeons-${Date.now()}.sql`);
  fs.writeFileSync(tmp, sql, "utf8");
  try {
    console.log(`Writing ${kept.length} lobbies back...`);
    runSqlFile(tmp);
    console.log("Done. Remaining lobbies:", kept.length);
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
} catch (err) {
  console.error("Cleanup failed:", err.message);
  process.exit(1);
}