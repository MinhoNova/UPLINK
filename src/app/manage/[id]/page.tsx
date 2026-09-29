import type { Metadata } from "next";
import { headers } from "next/headers";
import { getKV } from "@/lib/db";
import { resolveHeroBg } from "@/lib/heroBg";
import { requireOptionalSession, isAdminUser } from "@/lib/authz";
import { loadOfferThread } from "@/lib/offerThread";
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
 * Two jobs, both of which used to happen in the browser:
 *
 *  - `heroBg` is a site setting the client component cannot read, so the page
 *    resolves it here; otherwise the loading and access screens flash the
 *    default scenic art on top of whatever the owner actually chose.
 *  - The thread itself is loaded here, through the same `loadOfferThread` the
 *    API route uses, and handed to the client as initial data. The thread
 *    therefore paints on the very first response instead of waiting on a
 *    client fetch, which is what the loading screen used to cover.
 *
 * Authorisation is unchanged and still server-side: an anonymous or unprivileged
 * visitor simply gets no `initialThread`, and the client falls back to the API,
 * which answers 401/403 on its own. The loading screen was never the security
 * boundary.
 */
export default async function ManageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let heroBg: string | undefined;
  let initialThread: any = null;
  try {
    heroBg = resolveHeroBg(await getKV("heroBg"));
  } catch {
    heroBg = "scenic";
  }

  try {
    const h = await headers();
    const auth = await requireOptionalSession(
      new Request("https://placeholder.local", { headers: h as any })
    );
    if (auth.ok) {
      const admin = await isAdminUser(auth.user.id, auth.user.username);
      // Media-free seed: inlining pasted chat images as base64 blew past the
      // worker's resource limit. The client re-fetches the full thread right
      // after mount, so the images still land without a loading screen.
      const result = await loadOfferThread(id, auth.user, admin, { omitMedia: true });
      if (result.ok) initialThread = result.data;
    }
  } catch {
    initialThread = null;
  }

  // Keyed on the thread id. Moving between two threads is a client-side
  // navigation, and Next.js reuses the component instance when only the dynamic
  // param changes — so every `useState` above this line kept the *previous*
  // thread's identity, admin verdict, loaded flag and lobby list. The second
  // thread therefore rendered off state seeded for the first, and the page sat on
  // its loading screen until a full refresh threw the stale state away. A remount
  // per id is the only thing that makes each thread start clean.
  return <ManageThreadClient key={id} heroBg={heroBg} initialThread={initialThread} />;
}
