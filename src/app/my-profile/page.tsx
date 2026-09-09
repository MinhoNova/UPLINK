import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAppSession } from "@/lib/authEnv";
import MyProfileClient from "./MyProfileClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "My Profile",
};

export default async function MyProfilePage() {
  const session = await getAppSession();
  if (!session?.user?.id) redirect("/");
  return <MyProfileClient />;
}