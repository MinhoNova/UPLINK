import type { Metadata } from "next";
import { getKV } from "@/lib/db";
import { resolveHeroBg } from "@/lib/heroBg";
import ManageThreadClient from "./ManageThreadClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mission Thread — Aion 2 LFG",
  robots: { index: false, follow: false },
};

/**
 * Server shell for the offer thread.
 *
 * The thread itself is a client component, so it cannot read the site settings
 * directly — but it needs `heroBg` to paint the same backdrop the lobby uses,
 * otherwise the loading and access screens flash the default scenic art on top
 * of whatever background the owner actually chose.
 */
export default async function ManageThreadPage() {
  let heroBg: string | undefined;
  try {
    heroBg = resolveHeroBg(await getKV("heroBg"));
  } catch {
    heroBg = "scenic";
  }
  return <ManageThreadClient heroBg={heroBg} />;
}
