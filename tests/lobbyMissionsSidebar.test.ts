import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The Ongoing Missions sidebar, on the main lobby page.
 *
 * Two things about it were wrong in the same way — it was built as a *card with
 * a header*, while the offers column it sits beside is a *label above content*.
 *
 * 1. `bg-white/[0.05] backdrop-blur-3xl` on an empty board. A 5% white wash is
 *    only legible when there is something behind it to blur. With no missions
 *    there is nothing, so it flattened into a solid grey panel that read as a
 *    dead, broken box. The empty offers list has always solved this the other
 *    way round: 40%-alpha navy, which lets the premium art and site background
 *    show through. An empty board now uses that same panel.
 *
 * 2. "ONGOING MISSIONS" sat inside the card behind a bottom border. At `text-xs`
 *    with `tracking-[0.2em]` in a 340px column it wrapped to two lines and
 *    pushed the content down, so the sidebar header read as a heading for the
 *    panel instead of a section label — unlike the offers banners it is meant to
 *    match. It now sits above the panel, which starts straight into content.
 *
 * These are asserted on the markup because the failure is visual: there is no
 * unit to call and no assertion that would fail if the wash or the border came
 * back.
 */
const lobby = readFileSync(join(process.cwd(), "src/components/aion2/LobbyPage.tsx"), "utf8");

/** The missions sidebar, from its aside to the end of the panel it wraps. */
function missionsSidebar(): string {
  const start = lobby.indexOf("{/* Sidebar - Ongoing Missions */}");
  expect(start).toBeGreaterThan(-1);
  const aside = lobby.indexOf("<aside", start);
  // The panel is the last `</div>` before the aside closes.
  const end = lobby.indexOf("</aside>", aside);
  return lobby.slice(aside, end);
}

describe("lobby missions sidebar", () => {
  it("keeps the empty board transparent instead of washing it white", () => {
    const sidebar = missionsSidebar();
    // The empty branch must not carry the white wash...
    expect(sidebar).toMatch(/missions\.length === 0 \? "bg-\[#0a0f26\]\/40 border-blue-900\/30"/);
    // ...and the populated branch keeps the glass it always had, so this cannot
    // be satisfied by simply deleting the distinction.
    expect(sidebar).toMatch(
      /: "bg-white\/\[0\.05\] backdrop-blur-3xl border-cyan-500\/20"/
    );
  });

  it("matches the panel the empty offers list already uses", () => {
    // `bg-[#0a0f26]/40` is copied verbatim from the offers empty state, so if
    // that one is restyled the two should be restyled together.
    const offersEmpty = lobby.match(/bg-\[#0a0f26\]\/40 border border-blue-900\/30 rounded-\[2rem\]/);
    expect(offersEmpty).not.toBeNull();
    expect(missionsSidebar()).toMatch(/bg-\[#0a0f26\]\/40/);
  });

  it("puts the heading outside the panel, above it", () => {
    const sidebar = missionsSidebar();
    const heading = sidebar.indexOf('t("missions_header")');
    const panel = sidebar.indexOf("tn-light relative flex w-full");
    expect(heading).toBeGreaterThan(-1);
    expect(panel).toBeGreaterThan(-1);
    // Heading first, then the panel — not the other way round.
    expect(heading).toBeLessThan(panel);
  });

  it("has no header bar inside the panel any more", () => {
    const sidebar = missionsSidebar();
    const panel = sidebar.indexOf("tn-light relative flex w-full");
    // Everything after the panel opens is content. The old header was a flex row
    // with a bottom border above the first conditional branch.
    const after = sidebar.slice(panel);
    expect(after).not.toMatch(/border-b border-blue-900\/30/);
  });

  it("keeps the heading on one line", () => {
    // text-xs + tracking-[0.2em] is what wrapped it. The offers filter tabs use
    // text-[10px] with 0.18em and sit in narrower containers without wrapping.
    expect(missionsSidebar()).toMatch(
      /text-\[10px\] font-black tracking-\[0\.18em\] uppercase text-blue-100/
    );
  });

  it("sticks the heading and the panel together", () => {
    const sidebar = missionsSidebar();
    // Sticky moved from the panel to the aside, otherwise scrolling would pin the
    // panel and scroll the heading away above it.
    expect(sidebar).toMatch(/<aside className="[^"]*lg:sticky lg:top-\[6\.5rem\]/);
    expect(sidebar).not.toMatch(/tn-light relative[^"]*lg:sticky/);
  });

  it("shortens the panel so the heading does not push it off screen", () => {
    // The panel keeps a max-height to bound its scroll area. The heading now
    // takes its own space above, so the old 7.5rem allowance is not enough.
    expect(missionsSidebar()).toMatch(/max-h-\[calc\(100vh-8\.5rem\)\]/);
  });

  it("still shows the empty message and the live/scanning indicator", () => {
    const sidebar = missionsSidebar();
    expect(sidebar).toMatch(/missions_empty/);
    expect(sidebar).toMatch(/missions_live/);
    expect(sidebar).toMatch(/missions_scan/);
  });
});