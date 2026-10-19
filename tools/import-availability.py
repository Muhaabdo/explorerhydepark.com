"""
Import the developer's "Sales Availability Report" (CSV) into the site data.

    python tools/import-availability.py path/to/Sales_Availability_Report.csv [--date 2026-10-19]
    node tools/build-pages.js

Rewrites tools/inventory.json (every available unit) and, for each project on
the site, its entry in tools/pricing.json (cheapest price, sizes, bedrooms and
count per unit type, total available). --date is the report date shown on the
pages as "updated" (default: today).

Projects in the report that aren't on the site are listed at the end (new
launches, commercial units...) — nothing is created for them automatically.
Site projects missing from the report keep their old prices, with a warning.
"""
import csv
import datetime
import json
import os
import sys
from collections import OrderedDict, defaultdict

TOOLS = os.path.dirname(os.path.abspath(__file__))

# Report "project Name" -> pricing.json key. When the developer renames a
# project in the export, update the name here AND `inventoryName` in
# projects-data.js (the build matches inventory rows by that name).
REPORT_TO_KEY = {
    'Hyde Park Central': 'hyde-central',
    'Hyde Park Residential': 'hyde-new-cairo',
    'Terraces': 'hyde-terraces',
    'Garden Lakes': 'garden-lakes',
    'Signature': 'signature',
    'Hyde Park North': 'seashore',
}

# Arabic label per unit type (shown on the pages). A type not listed here stops
# the import so it can be named properly first.
TYPE_LABEL_AR = {
    'Apartment': 'شقق',
    'Duplex': 'دوبلكس',
    'Townhouse': 'تاون هاوس',
    'Quad': 'كواد',
    'Twin House': 'توين هاوس',
    'Twin House with Roof': 'توين هاوس بروف',
    'Standalone': 'فيلا مستقلة',
    'Small Villa': 'فيلا صغيرة',
    'Beach Medium Villa': 'فيلا شاطئ متوسطة',
    'Standard Chalet': 'شاليه ستاندرد',
    'Beach Chalet': 'شاليه شاطئ',
}

# Unit types where "Number of rooms" is meaningful on the page.
ROOM_TYPES = {'Apartment', 'Duplex', 'Standard Chalet', 'Beach Chalet'}

FINISHINGS = {'core & shell': 'Core & Shell', 'finished': 'Finished', 'semi finished': 'SEMI FINISHED'}


def num(v):
    v = (v or '').strip().replace(',', '')
    return float(v) if v else None


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    date = datetime.date.today().isoformat()
    if '--date' in args:
        i = args.index('--date')
        date = args[i + 1]
        del args[i:i + 2]
    src = args[0]

    with open(src, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))

    units, skipped = [], 0
    for r in rows:
        price, bua = num(r.get('Price')), num(r.get('BUA (SQM)'))
        if not price or not bua:
            skipped += 1
            continue
        rooms = num(r.get('Number of rooms'))
        units.append(OrderedDict([
            ('project', r['project Name'].strip()),
            ('type', r['Unit Type'].strip()),
            ('unit_name', r['Inventory Item Name'].strip()),
            ('rooms', int(rooms) if rooms else None),
            ('bua_sqm', round(bua, 2)),
            # Junk values in the export (e.g. "'SENT'") become null.
            ('finishing', FINISHINGS.get((r.get('Finishing Type') or '').strip().strip("'").lower())),
            ('price', int(round(price))),
        ]))

    by_project = defaultdict(list)
    for u in units:
        by_project[u['project']].append(u)

    # inventory.json: all rows + a per-type summary (for reading, not used by the build).
    summary = OrderedDict()
    for proj, lst in sorted(by_project.items()):
        types = defaultdict(list)
        for u in lst:
            types[u['type']].append(u)
        summary[proj] = OrderedDict()
        for t, tl in sorted(types.items()):
            cheapest = min(tl, key=lambda u: u['price'])
            summary[proj][t] = OrderedDict([
                ('min_price', cheapest['price']),
                ('max_price', max(u['price'] for u in tl)),
                ('count', len(tl)),
                ('bua_min', min(u['bua_sqm'] for u in tl)),
                ('bua_max', max(u['bua_sqm'] for u in tl)),
                ('min_unit_bua', cheapest['bua_sqm']),
                ('finishings', sorted({u['finishing'] for u in tl if u['finishing']})),
            ])
    with open(os.path.join(TOOLS, 'inventory.json'), 'w', encoding='utf-8') as f:
        json.dump(OrderedDict([('generated_from', 'Sales Availability Report ' + date), ('projects', summary), ('units', units)]),
                  f, ensure_ascii=False, indent=2)
        f.write('\n')

    # pricing.json: one entry per site project, unit types in their old order, new types after.
    path = os.path.join(TOOLS, 'pricing.json')
    with open(path, encoding='utf-8') as f:
        pricing = json.load(f, object_pairs_hook=OrderedDict)
    pricing['meta']['lastUpdated'] = date
    pricing['meta']['source'] = 'Hyde Park Sales Availability Report — available units only.'

    unknown = sorted({u['type'] for u in units if u['project'] in REPORT_TO_KEY and u['type'] not in TYPE_LABEL_AR})
    if unknown:
        sys.exit('New unit type(s) with no Arabic label: ' + ', '.join(unknown) + ' — add them to TYPE_LABEL_AR first.')

    changes = []
    for proj, key in REPORT_TO_KEY.items():
        lst = by_project.get(proj)
        if not lst:
            print('WARNING: "%s" (%s) is not in the report — old prices kept, marked as not confirmed.' % (proj, key))
            if key in pricing['projects']:
                pricing['projects'][key]['refreshed'] = False  # page shows "indicative price" + a notice
            continue
        old = pricing['projects'].get(key, OrderedDict())
        old_order = [u['type'] for u in old.get('units', [])]
        types = defaultdict(list)
        for u in lst:
            types[u['type']].append(u)
        order = [t for t in old_order if t in types] + sorted(t for t in types if t not in old_order)
        new_units = []
        for t in order:
            tl = types[t]
            beds = sorted({u['rooms'] for u in tl if u['rooms']}) if t in ROOM_TYPES else []
            new_units.append(OrderedDict([
                ('type', t),
                ('label', TYPE_LABEL_AR[t]),
                ('minPrice', min(u['price'] for u in tl)),
                ('areaMin', min(u['bua_sqm'] for u in tl)),
                ('areaMax', max(u['bua_sqm'] for u in tl)),
                ('bedrooms', beds),
                ('count', len(tl)),
            ]))
        entry = OrderedDict([
            ('refreshed', True),
            ('availableUnits', len(lst)),
            ('minPrice', min(u['price'] for u in lst)),
            ('bedrooms', sorted({b for u in new_units for b in u['bedrooms']})),
            ('units', new_units),
        ])
        dropped = [t for t in old_order if t not in types]
        added = [t for t in order if t not in old_order]
        changes.append('%-16s %s → %s from, %s → %s units%s%s' % (
            key, '{:,}'.format(old.get('minPrice') or 0), '{:,}'.format(entry['minPrice']),
            old.get('availableUnits'), entry['availableUnits'],
            ('  +' + ', '.join(added)) if added else '', ('  -' + ', '.join(dropped)) if dropped else ''))
        pricing['projects'][key] = entry

    # Site projects the report doesn't cover at all (e.g. Tawny): same treatment.
    for key, entry in pricing['projects'].items():
        if key not in REPORT_TO_KEY.values():
            print('WARNING: "%s" has no rows in the report — old prices kept, marked as not confirmed.' % key)
            entry['refreshed'] = False

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(pricing, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print('Imported %d units (%d rows skipped: no price/area). Report date: %s' % (len(units), skipped, date))
    for c in changes:
        print('  ' + c)
    extra = sorted(p for p in by_project if p not in REPORT_TO_KEY)
    if extra:
        print('In the report but not on the site:')
        for p in extra:
            types = defaultdict(int)
            for u in by_project[p]:
                types[u['type']] += 1
            print('  %s — %d units (%s), from %s EGP' % (p, len(by_project[p]), ', '.join('%s %d' % kv for kv in sorted(types.items())),
                                                     '{:,}'.format(min(u['price'] for u in by_project[p]))))


if __name__ == '__main__':
    main()
