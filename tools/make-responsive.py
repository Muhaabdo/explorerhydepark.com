"""
Make smaller WebP copies of each project's hero photo for mobile (srcset).

    python tools/make-responsive.py

Writes assets/img/projects/<slug>/responsive/<slug>-hero-<width>.webp for each
width in WIDTHS that is smaller than the original. Re-run after replacing a
hero photo, then run `node tools/build-pages.js` — the build picks the files
up automatically (no code change needed). Needs Pillow: pip install pillow
"""
import glob
import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
WIDTHS = [800, 1200, 1600]
QUALITY = 78

for src in sorted(glob.glob(os.path.join(ROOT, 'assets', 'img', 'projects', '*', '*'))):
    name = os.path.basename(src)
    base, ext = os.path.splitext(name)
    if ext.lower() not in ('.jpg', '.jpeg', '.png', '.webp') or not base.lower().endswith('-hero'):
        continue
    slug = os.path.basename(os.path.dirname(src))
    out_dir = os.path.join(os.path.dirname(src), 'responsive')
    os.makedirs(out_dir, exist_ok=True)
    with Image.open(src) as im:
        im = im.convert('RGB')
        for w in WIDTHS:
            if w >= im.width:
                continue
            h = round(im.height * w / im.width)
            out = os.path.join(out_dir, '%s-hero-%d.webp' % (slug, w))
            im.resize((w, h), Image.LANCZOS).save(out, 'WEBP', quality=QUALITY, method=6)
            print('wrote', os.path.relpath(out, ROOT), '%d KB' % (os.path.getsize(out) // 1024))

# Gallery thumbnails (the strip under the main photo is ~100 px wide — loading
# the full photo six times for it is the slowest thing on a project page):
# responsive/<slug>-gallery-<n>-thumb.webp, 320 px wide.
THUMB_W = 320
for src in sorted(glob.glob(os.path.join(ROOT, 'assets', 'img', 'projects', '*', '*'))):
    base, ext = os.path.splitext(os.path.basename(src))
    if ext.lower() not in ('.jpg', '.jpeg', '.png', '.webp') or '-gallery-' not in base.lower():
        continue
    slug = os.path.basename(os.path.dirname(src))
    out_dir = os.path.join(os.path.dirname(src), 'responsive')
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, base.lower() + '-thumb.webp')
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
        continue
    with Image.open(src) as im:
        im = im.convert('RGB')
        h = round(im.height * THUMB_W / im.width)
        im.resize((THUMB_W, h), Image.LANCZOS).save(out, 'WEBP', quality=72, method=6)
    print('wrote', os.path.relpath(out, ROOT), '%d KB' % (os.path.getsize(out) // 1024))
