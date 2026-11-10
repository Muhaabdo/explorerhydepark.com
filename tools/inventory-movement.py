"""
What moved between two availability reports (for the "inventory movement" articles).

    git show <older-commit>:tools/inventory.json > old.json
    python tools/inventory-movement.py old.json tools/inventory.json --from 2026-10-19 --to 2026-11-10

Writes tools/movement/<to>.json. Units are matched by project + unit name:
  left     in the old report, not in the new one (sold, reserved or withdrawn —
           the report doesn't say which, so the articles say "left the available list")
  entered  in the new report only
  repriced same unit, different price
Per project and per segment (unit type + bedrooms) it also records the counts
before/after and the cheapest price before/after. Projects that aren't on the
site (no slug below) are left out.
"""
import json
import os
import sys
from collections import OrderedDict, defaultdict

TOOLS = os.path.dirname(os.path.abspath(__file__))

# Report project name -> site page slug.
SLUGS = OrderedDict([
    ('One Hyde Park', 'one-hyde-park'),
    ('Hyde Park Central', 'hyde-park-central'),
    ('Signature', 'hyde-park-signature'),
    ('Hyde Park North', 'hyde-park-sea-shore'),
    ('Hyde Park Residential', 'hyde-park-new-cairo'),
    ('Garden Lakes', 'hyde-park-garden-lake'),
    ('Business District', 'hyde-park-business-district'),
    ('Terraces', 'hyde-park-terraces'),
])
ROOM_TYPES = {'Apartment', 'Duplex', 'Sky Villa', 'Garden Villa', 'Standard Chalet', 'Beach Chalet'}


def load(path):
    with open(path, encoding='utf-8') as f:
        units = json.load(f)['units']
    return [u for u in units if u['project'] in SLUGS and not u['unit_name'].lower().startswith('test')]


def seg_key(u):
    return (u['project'], u['type'], u['rooms'] if u['type'] in ROOM_TYPES else None)


def main():
    args = sys.argv[1:]
    opts = {}
    for flag in ('--from', '--to'):
        if flag in args:
            i = args.index(flag)
            opts[flag] = args[i + 1]
            del args[i:i + 2]
    if len(args) != 2 or '--from' not in opts or '--to' not in opts:
        sys.exit(__doc__)
    old, new = load(args[0]), load(args[1])
    O = {(u['project'], u['unit_name']): u for u in old}
    N = {(u['project'], u['unit_name']): u for u in new}
    left = [O[k] for k in O if k not in N]
    entered = [N[k] for k in N if k not in O]
    repriced = [(O[k], N[k]) for k in O if k in N and O[k]['price'] != N[k]['price']]

    def count(lst, pred):
        return sum(1 for u in lst if pred(u))

    projects = []
    for name, slug in SLUGS.items():
        inp = lambda u, name=name: u['project'] == name
        projects.append(OrderedDict([
            ('slug', slug), ('before', count(old, inp)), ('left', count(left, inp)),
            ('entered', count(entered, inp)), ('after', count(new, inp)),
        ]))

    keys = sorted({seg_key(u) for u in old + new}, key=lambda k: (list(SLUGS).index(k[0]), k[1], k[2] or 0))
    segments = []
    for k in keys:
        ins = lambda u, k=k: seg_key(u) == k
        b, a = [u for u in old if ins(u)], [u for u in new if ins(u)]
        gone = [u for u in left if ins(u)]
        segments.append(OrderedDict([
            ('slug', SLUGS[k[0]]), ('type', k[1]), ('rooms', k[2]),
            ('before', len(b)), ('left', len(gone)), ('entered', count(entered, ins)), ('after', len(a)),
            ('minBefore', min(u['price'] for u in b) if b else None),
            ('minAfter', min(u['price'] for u in a) if a else None),
            ('leftMin', min(u['price'] for u in gone) if gone else None),
            ('leftMax', max(u['price'] for u in gone) if gone else None),
        ]))

    # Cheapest price per project + unit type (what the project pages show as "from").
    by_type = defaultdict(lambda: [[], []])
    for u in old:
        by_type[(u['project'], u['type'])][0].append(u['price'])
    for u in new:
        by_type[(u['project'], u['type'])][1].append(u['price'])
    start_moves = []
    for (proj, typ), (b, a) in sorted(by_type.items(), key=lambda kv: (list(SLUGS).index(kv[0][0]), kv[0][1])):
        if b and a and min(b) != min(a):
            start_moves.append(OrderedDict([('slug', SLUGS[proj]), ('type', typ), ('before', min(b)), ('after', min(a))]))

    out = OrderedDict([
        ('from', opts['--from']), ('to', opts['--to']),
        ('totals', OrderedDict([('before', len(old)), ('left', len(left)), ('entered', len(entered)),
                                ('after', len(new)), ('unchanged', len(old) - len(left)), ('repriced', len(repriced))])),
        ('projects', projects), ('segments', segments), ('startMoves', start_moves),
    ])
    out_dir = os.path.join(TOOLS, 'movement')
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, opts['--to'] + '.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write('\n')
    t = out['totals']
    print('wrote', os.path.relpath(path, os.path.join(TOOLS, '..')))
    print('  %(before)d before, %(left)d left, %(entered)d entered, %(after)d after, %(repriced)d repriced' % t)


if __name__ == '__main__':
    main()
