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

## Ship every change

Any change made to this repo must be committed and pushed to `main` — pushing triggers the deploy. Do not leave verified work uncommitted. Only skip the push if the change is clearly experimental/unverified, or the user says otherwise.

Before pushing, run `npx tsc --noEmit`, `npx vitest run` and `npm run build`.

## CI deploy flakiness

The GitHub Actions `Run tests` step fails intermittently, then passes on a re-run of the
same commit — it is not a broken config or a platform difference. Verified: `e745f0cab`
and `3749ea8e8` failed at `Run tests` (skipping build + deploy) while `c00b471b1` passed
the whole pipeline on the identical workflow, and both failures reproduced clean locally
(fresh `npm ci`, `TZ=UTC`, `LANG=C`). So when a push fails at `Run tests`, check whether
a later run on the *same* commit is green before hunting for a code bug, and confirm the
deploy actually happened rather than assuming a push deployed.

Verify a deploy landed by fetching the live page chunk and matching a marker that only
exists in the new build, then matching the old pattern's absence. Build IDs are not
exposed in the HTML. `gh` is not installed; the unauthenticated logs endpoint 403s, but
the jobs endpoint is readable unauthenticated:
`/repos/MinhoNova/UPLINK/actions/runs/<id>/jobs`.
