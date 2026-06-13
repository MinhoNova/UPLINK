<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## SVG to PNG Thumbnail Conversion

Class SVGs in `public/classes/` are extremely large (1–3.5 MB each, full 1024×1024 quality).
To avoid browser SVG rasterization lag in CreateOfferModal, **use 32×32 PNG thumbnails** in `public/classes-thumb/` (~0.5–1.9 KB each).

To regenerate thumbnails after updating SVGs:
```bash
node -e "
const sharp = require('sharp');
const fs = require('fs');
fs.readdirSync('public/classes').filter(f => f.endsWith('.svg')).forEach(f => {
  const name = f.replace('.svg', '.png');
  sharp('public/classes/'+f).resize(32,32).png().toFile('public/classes-thumb/'+name);
});
"
```

All class/role thumbnails are served without `loading="lazy"` or `decoding="async"` where possible — add these when creating new `<img>` tags pointing to `/classes-thumb/*.png`.
