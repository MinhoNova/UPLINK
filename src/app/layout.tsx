import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/navbar/Navbar";
import DirectCommsPanel from "@/components/DirectCommsPanel";
import CommunityNotificationsPanel from "@/components/community/CommunityNotificationsPanel";
import PlayerProfileModal from "@/components/PlayerProfileModal";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "UPLINK | The Elite Raider Interface",
  description: "Experience the next generation of WoW Dungeon LFG. Secure, tactical, and built for performance.",
  keywords: ["UPLINK", "WoW", "World of Warcraft", "Raider.io", "LFG", "Dungeon Ops"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased dark">
      <body className="min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <Navbar />
          <DirectCommsPanel />
          <CommunityNotificationsPanel />
          <PlayerProfileModal />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
