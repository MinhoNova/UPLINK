import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { getAppSession } from "@/lib/authEnv";
import { isAdminRole } from "@/lib/roles";
import AdminDashboard from "./AdminDashboard";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Admin Dashboard — WoWLFG",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getAppSession();
  if (!session?.user?.id) redirect("/");
  const isAdmin = await isAdminRole(session.user.id, session.user.username);
  if (!isAdmin) redirect("/");
  return <AdminDashboard />;
}
