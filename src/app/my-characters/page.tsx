import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAppSession } from "@/lib/authEnv";
import MyCharactersClient from "./MyCharactersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "My Characters",
};

export default async function MyCharactersPage() {
  const session = await getAppSession();
  if (!session?.user?.id) redirect("/");
  return <MyCharactersClient />;
}