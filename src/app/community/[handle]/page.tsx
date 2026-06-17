import { getKV, initTables } from "@/lib/db";
import { resolveProfileImage, resolveProfileDisplayName } from "@/lib/profileImage";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CommunityPage from "../page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const normalized = handle.toLowerCase();

  await initTables();
  const users: any[] = (await getKV("registeredUsers")) || [];
  const user = users.find(
    (u) => String(u.username).toLowerCase() === normalized
  );

  if (!user) return { title: "User not found — UPLINK" };

  const name = resolveProfileDisplayName(user);
  const avatar = resolveProfileImage(user);

  return {
    title: `${name} — UPLINK Community`,
    description: `View ${name}'s profile, community posts, and activity on UPLINK.`,
    openGraph: {
      title: `${name} — UPLINK Community`,
      description: `View ${name}'s profile, community posts, and activity on UPLINK.`,
      ...(avatar ? { images: [{ url: avatar }] } : {}),
    },
  };
}

export default async function CommunityProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const normalized = handle.toLowerCase();

  await initTables();
  const users: any[] = (await getKV("registeredUsers")) || [];
  const user = users.find(
    (u) => String(u.username).toLowerCase() === normalized
  );

  if (!user) notFound();

  return <CommunityPage />;
}
