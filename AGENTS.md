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
