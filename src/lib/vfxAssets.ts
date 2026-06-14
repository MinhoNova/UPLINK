import { isAnimatedImageUrl } from "@/lib/profileImage";

export type VfxEntry = string | { src: string; poster?: string };

export function resolveVfxSrc(entry: VfxEntry): string {
  if (!entry) return "";
  return typeof entry === "string" ? entry : entry.src || "";
}

export function resolveVfxPoster(entry: VfxEntry): string | undefined {
  if (!entry || typeof entry === "string") return undefined;
  return entry.poster?.trim() || undefined;
}

/** Static/light URL for offer banners & ongoing missions (no GIF decode). */
export function resolveVfxBannerUrl(entry: VfxEntry): string {
  const src = resolveVfxSrc(entry);
  const poster = resolveVfxPoster(entry);
  if (poster) return poster;
  if (src && !isAnimatedImageUrl(src)) return src;
  return src;
}

export function findVfxEntry(userVfx: VfxEntry[] | undefined, srcUrl: string): VfxEntry | undefined {
  if (!userVfx?.length || !srcUrl) return undefined;
  return userVfx.find((e) => resolveVfxSrc(e) === srcUrl);
}

export function resolveUserVfxBannerUrl(user: any, srcUrl: string | null | undefined): string | null {
  if (!srcUrl) return null;
  const entry = findVfxEntry(user?.userVfx, srcUrl);
  if (entry) return resolveVfxBannerUrl(entry);
  if (!isAnimatedImageUrl(srcUrl)) return srcUrl;
  return srcUrl;
}

export function resolveLobbyBannerBg(
  lobby: { customBg?: string; customBgPoster?: string },
  ownerUser: any,
  activeVfx: string | null | undefined
): string | null {
  if (lobby.customBgPoster) return lobby.customBgPoster;
  if (lobby.customBg) {
    const entry = findVfxEntry(ownerUser?.userVfx, lobby.customBg);
    return entry ? resolveVfxBannerUrl(entry) : resolveUserVfxBannerUrl(ownerUser, lobby.customBg);
  }
  if (activeVfx) return resolveUserVfxBannerUrl(ownerUser, activeVfx);
  return null;
}
