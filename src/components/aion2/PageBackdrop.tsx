import { heroBgStyle, resolveHeroBg } from "@/lib/heroBg";

/**
 * The site's signature background: the AION2 key art fading out under a long
 * vertical gradient, plus the dot-grid texture and an edge vignette.
 *
 * This was previously hand-copied into every page that wanted it, and each copy
 * drifted — the profile page ended up with `bg-cover` on mobile (which crops the
 * sides) and a different gradient, and the characters/admin pages had no
 * background at all. Keeping one definition means a page can never quietly end
 * up with a cropped or differently-faded version again.
 *
 * The `heroBg` key is a site-wide setting, so every page has to honour it —
 * otherwise someone who picked "aurora" would still see the scenic art here.
 */
const SCENIC_ART_MASK =
  "linear-gradient(to bottom, black 0%, black 46%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.18) 76%, transparent 90%)";

export default function PageBackdrop({ heroBg }: { heroBg?: string }) {
  const key = resolveHeroBg(heroBg);

  return (
    <div
      aria-hidden
      className="absolute inset-0 z-0 pointer-events-none -ml-[var(--rail-gutter)]"
    >
      {key === "scenic" ? (
        <>
          <div
            className="absolute inset-0 bg-contain bg-top bg-no-repeat"
            style={{
              backgroundImage: `url('/AION2.png')`,
              WebkitMaskImage: SCENIC_ART_MASK,
              maskImage: SCENIC_ART_MASK,
            }}
          />
          <div className="absolute inset-0 bg-[#050814]/40 mix-blend-multiply" />
        </>
      ) : (
        <div className="absolute inset-0" style={heroBgStyle(key)} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/12 via-[#050814]/35 to-[#050814]/95" />
      <div className="absolute inset-x-0 top-0 h-[230vh] bg-[linear-gradient(to_bottom,transparent_0%,rgba(5,8,20,0.3)_70vh,rgba(5,8,20,0.75)_120vh,rgba(5,8,20,0.97)_175vh,#050814_215vh)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,8,20,0.8)_100%)]" />
      <div className="aion-dotnet absolute inset-0 opacity-[0.10]" />
    </div>
  );
}
