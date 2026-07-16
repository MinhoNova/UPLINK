<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## SVG to WebP Thumbnail Conversion

Class SVGs in `public/classes/` are extremely large (1–3.5 MB each, full 1024×1024 quality).
To avoid browser SVG rasterization lag in CreateOfferModal, **use pre-rasterized WebP thumbnails** in `public/classes-thumb/` (48×48 classes, 32×32 roles — ~0.5–1.2 KB each, smaller than legacy PNGs).

To regenerate thumbnails after updating SVGs:
```bash
npm run thumbs:regen
```

All class/role thumbnails are served without `loading="lazy"` or `decoding="async"` where possible — add these when creating new `<img>` tags pointing to `/classes-thumb/*.webp`.

## Blizzard Pipeline Fixes

### Talent Loadout (`character-profile.ts:178`)
- `talent_loadout_code` (TWW+ format with hero talents) must be prioritized over `loadout.text` (old Dragonflight format)
- Precedence: `loadout.talent_loadout_code || loadout.text || ""`

### M+ Rating Extraction (`character-profile.ts:368-382`)
- `current_mythic_rating` from the keystone profile API is the primary source (always current season, 0 if no runs)
- Fallback: latest season (highest `season.id`) from `seasons` array, not `seasons[0]` (oldest)
- Blizzard's per-dungeon CR leaderboard scores (~200-500) are NOT combined M+ scores; always override with profile `mythicPlusRating`

### RaiderIO Supplement (`custom-worker.ts`, `blizzard-meta/route.ts`)
- Always supplement ALL specs with RaiderIO estimated combined scores, not just specs with <50 Blizzard CR players
- Blizzard CR scores are per-dungeon (~200-500) — RaiderIO scores are estimated combined (1000-5000+)
- Merge dedup key: `${p.name}|${p.realm}|${p.region}|${p.specId}` — keeps highest score

### Player Profile Rank (`blizzard-meta/route.ts`)
- Rank is calculated from the sorted `players` list at lookup time (not stored in cache)
- Sort by `Math.round(b.score) - Math.round(a.score)`, then findIndex + 1

### Auto-News Category Matching (`route.ts:24-36`)
- `inferCategory()` now matches additional keywords: "keystone", "m+", "undermine", "midnight"
- RSS parser handles single-item feeds (XML may return object instead of array)

### Pipeline Order
1. Blizzard CR leaderboards → discover players (per-dungeon scores, ignore for ranking)
2. RaiderIO runs → supplement all specs with estimated combined scores
3. Merge dedup by name|realm|region|specId, keep highest score
4. `selectTopPlayersBySpec` → top 50 per spec by score
5. `aggregateBySpec` → fetch Blizzard profiles, override scores with `mythicPlusRating`
