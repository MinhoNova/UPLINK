/**
 * Routes single-key writes to dedicated APIs when possible.
 * Multi-key payloads still fall back to /api/data.
 */

type Updates = Record<string, unknown>;

export async function saveDataSmart(updates: Updates): Promise<boolean> {
  const keys = Object.keys(updates);
  if (keys.length === 1) {
    const key = keys[0];
    if (key === "registeredUsers") {
      const users = updates.registeredUsers as { id?: string }[];
      if (Array.isArray(users) && users.length === 1) {
        const res = await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: users[0] }),
        });
        if (res.ok) {
          window.dispatchEvent(new CustomEvent("data-refresh"));
          return true;
        }
      }
    }
    if (key === "lobbyCustomBg") {
      const payload = updates.lobbyCustomBg as { lobbyId: string; customBg: string };
      const res = await fetch("/api/lobbies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("data-refresh"));
        return true;
      }
    }
    if (key === "lobbies") {
      const lobbies = updates.lobbies;
      const res = await fetch("/api/lobbies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbies }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("data-refresh"));
        return true;
      }
    }
    if (key === "notifications") {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: updates.notifications }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("data-refresh"));
        return true;
      }
    }
  }

  const res = await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  window.dispatchEvent(new CustomEvent("data-refresh"));
  return res.ok;
}
