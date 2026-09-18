import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { getAppSession } from "@/lib/authEnv";
import { getUserRole } from "@/lib/roles";
import AdminDashboard from "./AdminDashboard";

const siteUrl = getSiteUrl();

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Dashboard — Aion 2 LFG",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getAppSession();
  if (!session?.user?.id) redirect("/");
  const role = await getUserRole(session.user.id, session.user.username);
  if (role !== "admin" && role !== "moderator" && role !== "support") redirect("/");
  return <AdminDashboard role={role} />;
}
