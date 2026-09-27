import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAppSession } from "@/lib/authEnv";
import { getKV } from "@/lib/db";
import { resolveHeroBg } from "@/lib/heroBg";
import MyCharactersClient from "./MyCharactersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "My Characters",
};

export default async function MyCharactersPage() {
  const session = await getAppSession();
  if (!session?.user?.id) redirect("/");
  let heroBg: string | undefined;
  try {
    heroBg = resolveHeroBg(await getKV("heroBg"));
  } catch {
    heroBg = "scenic";
  }
  return <MyCharactersClient heroBg={heroBg} />;
}