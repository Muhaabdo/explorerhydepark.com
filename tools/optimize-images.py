"""
Shrink project photos so pages load fast on phones.

    python tools/optimize-images.py        (then: python tools/make-responsive.py && node tools/build-pages.js)

For every photo in assets/img/projects/<slug>/ (not the responsive/ folder):
  - hero: kept in its format (JPEG/WebP — it's also the social-share image),
    resized to at most 1600 px wide and recompressed.
  - everything else (gallery, unit types, location): converted to WebP, at
    most 1600 px wide; the original file is deleted.
Files that are already small enough are left alone, so it's safe to re-run
after adding new photos. The build finds photos by name, not extension.
"""
import glob
import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MAX_W = 1600
EXTS = ('.jpg', '.jpeg', '.png', '.webp')
# Below this size (and width) a file is considered already optimized.
SMALL_BYTES = 260 * 1024

saved = 0
for src in sorted(glob.glob(os.path.join(ROOT, 'assets', 'img', 'projects', '*', '*'))):
    base, ext = os.path.splitext(os.path.basename(src))
    if ext.lower() not in EXTS:
        continue
    before = os.path.getsize(src)
    with Image.open(src) as im:
        width = im.width
        if before <= SMALL_BYTES and width <= MAX_W and (base.lower().endswith('-hero') or ext.lower() == '.webp'):
            continue
        im = im.convert('RGB')
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        if base.lower().endswith('-hero'):
            out = src
            if ext.lower() == '.webp':
                im.save(out, 'WEBP', quality=80, method=6)
            else:
                im.save(out, 'JPEG', quality=82, optimize=True, progressive=True)
        else:
            out = os.path.join(os.path.dirname(src), base.lower() + '.webp')
            im.save(out, 'WEBP', quality=78, method=6)
    if out != src:
        os.remove(src)
    after = os.path.getsize(out)
    saved += before - after
    print('%-70s %5d KB -> %4d KB' % (os.path.relpath(out, ROOT), before // 1024, after // 1024))

print('saved %.1f MB' % (saved / 1024 / 1024))
