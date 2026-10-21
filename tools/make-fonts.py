"""
Self-hosted fonts (assets/fonts/*.woff) — variable Cairo (Arabic + Latin
subsets) and Manrope (Latin), weights 400–800, made from the google/fonts
repo (SIL OFL 1.1, licences next to the files). Only needed again to change
weights or character ranges:
    git clone --depth 1 --filter=blob:none --sparse https://github.com/google/fonts /tmp/gf
    (cd /tmp/gf && git sparse-checkout set ofl/cairo ofl/manrope)
    python tools/make-fonts.py      # set G below to /tmp/gf/ofl/, writes into the current folder
WOFF (zlib) because WOFF2 needs the brotli module; the subsets are small anyway.
"""
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
import os
G='/tmp/claude-0/gf/ofl/'
def build(src, axes, ranges, out):
    f=TTFont(src)
    f=instancer.instantiateVariableFont(f, axes)
    f.save('tmp.ttf'); f=TTFont('tmp.ttf')
    opts=subset.Options(); opts.flavor='woff'; opts.layout_features=['*']; opts.name_IDs=['*']; opts.notdef_outline=True; opts.hinting=False; opts.desubroutinize=True
    s=subset.Subsetter(opts); s.populate(unicodes=ranges); s.subset(f)
    f.flavor='woff'; f.save(out); print(out, os.path.getsize(out)//1024,'KB')
def rng(*pairs):
    u=[]
    for a,b in pairs: u+=list(range(a,b+1))
    return u
LATIN=rng((0x20,0x7E),(0xA0,0xFF),(0x2013,0x2014),(0x2018,0x201E),(0x2022,0x2022),(0x2026,0x2026),(0x20AC,0x20AC),(0x2122,0x2122),(0x2190,0x2193),(0x2212,0x2212),(0xB2,0xB3))
ARABIC=rng((0x0600,0x06FF),(0x0750,0x077F),(0xFB50,0xFDFF),(0xFE70,0xFEFF),(0x200C,0x200F),(0x2066,0x2069),(0x060C,0x060C))
build(G+'cairo/Cairo[slnt,wght].ttf', {'slnt':0,'wght':(400,800)}, ARABIC, 'cairo-arabic.woff')
build(G+'cairo/Cairo[slnt,wght].ttf', {'slnt':0,'wght':(400,800)}, LATIN, 'cairo-latin.woff')
build(G+'manrope/Manrope[wght].ttf', {'wght':(400,800)}, LATIN, 'manrope-latin.woff')
