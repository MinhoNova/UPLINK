import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const panel = readFileSync(join(process.cwd(), "src/components/OnlineNowPanel.tsx"), "utf8");
const dmPanel = readFileSync(join(process.cwd(), "src/components/DirectCommsPanel.tsx"), "utf8");
const sideRail = readFileSync(join(process.cwd(), "src/components/SideRail.tsx"), "utf8");
const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");

/**
 * The online roster used to be a tab inside the DM panel, so the same rows
 * shipped twice. These guard the split: one panel owns the roster, the DM panel
 * has no trace of it, and the rail button opens the new one.
 */
describe("Online Now is its own panel", () => {
  it("is mounted app-wide", () => {
    expect(layout).toContain('import OnlineNowPanel from "@/components/OnlineNowPanel"');
    expect(layout).toContain("<OnlineNowPanel />");
  });

  it("opens from the rail button that already existed", () => {
    expect(sideRail).toContain('new CustomEvent("open-online")');
  });

  it("is no longer a tab in the DM panel", () => {
    expect(dmPanel).not.toContain('setTab("online")');
    expect(dmPanel).not.toContain('tab === "online"');
    expect(dmPanel).not.toContain("@/lib/onlinePresence");
  });

  it("orders rows through the shared, tested helper", () => {
    expect(panel).toContain("sortOnlineRows");
    expect(panel).toContain("buildOnlineRow");
  });

  it("hides itself from blocked players and from its own account", () => {
    expect(panel).toContain("me.blocked");
    expect(panel).toContain("String(u.id) !== currentUserId");
  });

  it("hands a clicked row to the DM panel instead of opening its own chat", () => {
    expect(panel).toContain('new CustomEvent("open-dm-chat"');
    expect(panel).toContain('new CustomEvent("close-online")');
  });

  it("lets only one of the two right-edge panels show at a time", () => {
    // Open either one and the other stands down.
    expect(panel).toContain('new CustomEvent("close-dm")');
    expect(dmPanel).toContain('new CustomEvent("close-online")');
    expect(dmPanel).toContain('addEventListener("close-dm"');
  });
});
