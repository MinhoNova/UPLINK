/**
 * Remove all KV-backed site data for a user (by Discord id + handle).
 * Usage: node scripts/purge-user.cjs <discordId> <handle> [--remote]
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const discordId = process.argv[2];
const handle = process.argv[3];
const remote = process.argv.includes("--remote");

if (!discordId || !handle) {
  console.error("Usage: node scripts/purge-user.cjs <discordId> <handle> [--remote]");
  process.exit(1);
}

const seedPath = path.join(__dirname, "..", "src", "data", "db.json");
const data = JSON.parse(fs.readFileSync(seedPath, "utf8"));

const id = String(discordId);
const h = String(handle).toLowerCase();

function matchesUser(obj) {
  if (!obj || typeof obj !== "object") return false;
  const fields = [
    obj.id,
    obj.userId,
    obj.applicantId,
    obj.ownerId,
    obj.requester,
    obj.target,
    obj.fromId,
    obj.reporterId,
    obj.username,
    obj.userHandle,
    obj.discordName,
    obj.toUser,
    obj.from,
    obj.to,
  ];
  return fields.some((v) => v != null && (String(v) === id || String(v).toLowerCase() === h));
}

function stripLobbyUser(lobby) {
  const filterList = (list) =>
    (list || []).filter((entry) => {
      if (!entry) return false;
      return !(
        String(entry.userId) === id ||
        String(entry.applicantId) === id ||
        String(entry.discordName || "").toLowerCase() === h
      );
    });
  return {
    ...lobby,
    applicants: filterList(lobby.applicants),
    accepted: filterList(lobby.accepted),
  };
}

const summary = {
  registeredUsers: 0,
  lobbiesTouched: 0,
  notifications: 0,
  characters: 0,
  friends: 0,
  directMessages: 0,
  tickets: 0,
  readMessageKeys: 0,
  auditLogs: 0,
  chatModeration: 0,
  rateLimits: 0,
  deliveredMessages: 0,
  userRoles: 0,
};

function cleanAuxiliaryKeys() {
  if (Array.isArray(data.auditLogs)) {
    const before = data.auditLogs.length;
    data.auditLogs = data.auditLogs.filter(
      (entry) => String(entry.userId) !== id && String(entry.handle || "").toLowerCase() !== h
    );
    summary.auditLogs = before - data.auditLogs.length;
  }

  if (data.chatModeration && typeof data.chatModeration === "object") {
    if (data.chatModeration[id]) {
      delete data.chatModeration[id];
      summary.chatModeration++;
    }
  }

  if (data.rateLimits && typeof data.rateLimits === "object") {
    for (const key of Object.keys(data.rateLimits)) {
      if (key.includes(id)) {
        delete data.rateLimits[key];
        summary.rateLimits++;
      }
    }
  }

  if (data.deliveredMessages && typeof data.deliveredMessages === "object") {
    if (data.deliveredMessages[h]) {
      delete data.deliveredMessages[h];
      summary.deliveredMessages++;
    }
    for (const [, peers] of Object.entries(data.deliveredMessages)) {
      if (peers && typeof peers === "object" && peers[h]) {
        delete peers[h];
        summary.deliveredMessages++;
      }
    }
  }

  if (data.userRoles && typeof data.userRoles === "object" && data.userRoles[id]) {
    delete data.userRoles[id];
    summary.userRoles++;
  }
}

cleanAuxiliaryKeys();

if (Array.isArray(data.registeredUsers)) {
  const before = data.registeredUsers.length;
  data.registeredUsers = data.registeredUsers.filter((u) => String(u.id) !== id);
  summary.registeredUsers = before - data.registeredUsers.length;
}

if (Array.isArray(data.lobbies)) {
  data.lobbies = data.lobbies.map((lobby) => {
    const next = stripLobbyUser(lobby);
    const changed =
      (lobby.applicants?.length || 0) !== (next.applicants?.length || 0) ||
      (lobby.accepted?.length || 0) !== (next.accepted?.length || 0) ||
      String(lobby.ownerId) === id;
    if (changed) summary.lobbiesTouched++;
    return next;
  });
  data.lobbies = data.lobbies.filter((lobby) => String(lobby.ownerId) !== id);
}

if (Array.isArray(data.notifications)) {
  const before = data.notifications.length;
  data.notifications = data.notifications.filter((n) => {
    if (String(n.toUser || "").toLowerCase() === h) return false;
    if (String(n.applicantId) === id) return false;
    if (n.applicantData && matchesUser(n.applicantData)) return false;
    return true;
  });
  summary.notifications = before - data.notifications.length;
}

if (Array.isArray(data.characters)) {
  const before = data.characters.length;
  data.characters = data.characters.filter((c) => String(c.userId) !== id);
  summary.characters = before - data.characters.length;
}

if (Array.isArray(data.friends)) {
  const before = data.friends.length;
  data.friends = data.friends.filter(
    (f) => String(f.requester) !== id && String(f.target) !== id
  );
  summary.friends = before - data.friends.length;
}

if (Array.isArray(data.directMessages)) {
  const before = data.directMessages.length;
  data.directMessages = data.directMessages.filter(
    (m) => String(m.from || "").toLowerCase() !== h && String(m.to || "").toLowerCase() !== h
  );
  summary.directMessages = before - data.directMessages.length;
}

if (Array.isArray(data.tickets)) {
  const before = data.tickets.length;
  data.tickets = data.tickets.filter((t) => String(t.userId) !== id);
  summary.tickets = before - data.tickets.length;
}

if (data.readMessages && typeof data.readMessages === "object") {
  if (data.readMessages[h]) {
    delete data.readMessages[h];
    summary.readMessageKeys++;
  }
  for (const [viewer, peers] of Object.entries(data.readMessages)) {
    if (peers && typeof peers === "object" && peers[h]) {
      delete peers[h];
      summary.readMessageKeys++;
    }
  }
}

fs.writeFileSync(seedPath, JSON.stringify(data, null, 2) + "\n");
console.log(`Purged ${handle} (${id}) from db.json:`, summary);

// Push updated KV keys to D1
const flag = remote ? "--remote" : "--local";
const dbName = "uplink-db";
const statements = Object.entries(data).map(([key, value]) => {
  const escaped = JSON.stringify(value).replace(/'/g, "''");
  return `INSERT INTO kv_store (key, value) VALUES ('${key.replace(/'/g, "''")}', '${escaped}') ON CONFLICT(key) DO UPDATE SET value = excluded.value;`;
});

const sqlPath = path.join(__dirname, "purge-kv-temp.sql");
fs.writeFileSync(sqlPath, statements.join("\n"));

try {
  execSync(`npx wrangler d1 execute ${dbName} ${flag} --file="${sqlPath}"`, {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log(remote ? "Remote D1 KV updated." : "Local D1 KV updated.");
} finally {
  fs.unlinkSync(sqlPath);
}

// Community tables (posts, comments, reactions, reports) live in D1 too
const communitySql = [
  `DELETE FROM reactions WHERE userId = '${id}';`,
  `DELETE FROM comments WHERE userId = '${id}';`,
  `DELETE FROM posts WHERE userId = '${id}';`,
  `DELETE FROM reports WHERE reporterId = '${id}';`,
].join("\n");

const communityPath = path.join(__dirname, "purge-community-temp.sql");
fs.writeFileSync(communityPath, communitySql);

try {
  execSync(`npx wrangler d1 execute ${dbName} ${flag} --file="${communityPath}"`, {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log(remote ? "Remote community rows deleted." : "Local community rows deleted.");
} finally {
  fs.unlinkSync(communityPath);
}

// Clean auxiliary KV keys that may exist only in production (not in db.json seed).
const auxKeys = ["auditLogs", "chatModeration", "rateLimits", "deliveredMessages", "userRoles"];
const fetchCmd = `npx wrangler d1 execute ${dbName} ${flag} --json --command "SELECT key, value FROM kv_store WHERE key IN ('${auxKeys.join("','")}') OR key LIKE 'uploadQuota_${id}%'"`;
let fetchOut = "";
try {
  fetchOut = execSync(fetchCmd, { cwd: path.join(__dirname, ".."), encoding: "utf8" });
} catch (e) {
  console.warn("Could not fetch auxiliary keys:", e.message);
}

const auxStatements = [`DELETE FROM kv_store WHERE key LIKE 'uploadQuota_${id}%';`];
try {
  const parsed = JSON.parse(fetchOut);
  const rows = parsed?.[0]?.results || [];
  for (const row of rows) {
    if (String(row.key).startsWith("uploadQuota_")) continue;
    let value = JSON.parse(row.value);
    if (row.key === "auditLogs" && Array.isArray(value)) {
      value = value.filter(
        (entry) => String(entry.userId) !== id && String(entry.handle || "").toLowerCase() !== h
      );
    } else if (row.key === "chatModeration" && value && typeof value === "object") {
      delete value[id];
    } else if (row.key === "rateLimits" && value && typeof value === "object") {
      for (const k of Object.keys(value)) {
        if (k.includes(id)) delete value[k];
      }
    } else if (row.key === "deliveredMessages" && value && typeof value === "object") {
      if (value[h]) delete value[h];
      for (const peers of Object.values(value)) {
        if (peers && typeof peers === "object" && peers[h]) delete peers[h];
      }
    } else if (row.key === "userRoles" && value && typeof value === "object") {
      delete value[id];
    }
    const escaped = JSON.stringify(value).replace(/'/g, "''");
    auxStatements.push(
      `INSERT INTO kv_store (key, value) VALUES ('${row.key.replace(/'/g, "''")}', '${escaped}') ON CONFLICT(key) DO UPDATE SET value = excluded.value;`
    );
  }
} catch (e) {
  console.warn("Auxiliary key cleanup skipped:", e.message);
}

if (auxStatements.length > 0) {
  const auxPath = path.join(__dirname, "purge-aux-temp.sql");
  fs.writeFileSync(auxPath, auxStatements.join("\n"));
  try {
    execSync(`npx wrangler d1 execute ${dbName} ${flag} --file="${auxPath}"`, {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    console.log(remote ? "Remote auxiliary keys cleaned." : "Local auxiliary keys cleaned.");
  } finally {
    fs.unlinkSync(auxPath);
  }
}
