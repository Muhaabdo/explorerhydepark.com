/**
 * Static page generator (dev-time only — not shipped/loaded by the live site).
 * Renders /projects/{slug}.html for every entry in projects-data.js, plus a
 * homepage-cards.html snippet (the project cards block pasted into index.html).
 *
 * Content (copy, amenities, location) comes from projects-data.js.
 * Prices/units/available-count come from pricing.json (developer inventory
 * export) and are merged in here by `pricingKey` — edit prices there.
 *
 * Why generate instead of hand-writing pages: every page needs the SAME
 * markup/behavior with different content baked in as plain text (not
 * client-side templating) so each URL is independently readable by search
 * engines. Run again after editing projects-data.js or pricing.json:
 *   node tools/build-pages.js
 */
const fs = require('fs');
const path = require('path');
const projects = require('./projects-data');
const pricing = require('./pricing.json');
const inventory = require('./inventory.json');

const SITE_NAME = 'Explorer Hyde Park';
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'projects');
const SITE_ORIGIN = 'https://www.explorerhydepark.com';
const OG_DEFAULT_IMAGE = SITE_ORIGIN + '/assets/img/og-default.jpg';

function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

// Inverse of escapeHtml — used to pull already-escaped text back out of
// hand-written static HTML (title/description) so it can be safely
// re-escaped into a new attribute without double-escaping.
function unescapeHtml(s) {
  return String(s).replace(/&amp;|&lt;|&gt;|&quot;/g, function (m) {
    return { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"' }[m];
  });
}

// Wraps known-LTR text (English names, brand) in Unicode isolate marks for
// contexts where an HTML tag like <bdi> isn't available or gets stripped —
// WhatsApp's plain-text messages, and text pushed through escapeHtml into a
// plain DOM text node (FAQ answers). Keeps it from disrupting the direction
// of the surrounding Arabic sentence. Safe inside HTML attributes too (plain
// Unicode characters, nothing to escape).
function iso(s) {
  return '⁦' + s + '⁩';
}

// Real-photo lookup: drop a file at
// assets/img/projects/<slug>/<slug>-<name>.(jpg|jpeg|png|webp) and the next
// build picks it up automatically — no HTML editing per image. Naming is the
// project slug + the "type" (hero / gallery-1..6 / a unit's English type key
// e.g. "apartment" / location), so every file is self-describing on disk.
const IMG_ROOT = path.join(ROOT, 'assets', 'img', 'projects');
const IMG_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

// Case-insensitive by design: Windows dev machines don't care whether a file
// is named "-Standalone.jpg" or "-standalone.jpg", but most live servers run
// Linux, where those are two different files — a case mismatch here builds
// fine and 404s only after deploy. Scanning the real directory listing and
// matching on lowercase means whatever case the file actually has on disk is
// what gets baked into the <img src>, so it works everywhere either way.
var imgDirCache = {};
function listImgDir(slug) {
  if (!(slug in imgDirCache)) {
    var dir = path.join(IMG_ROOT, slug);
    imgDirCache[slug] = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  }
  return imgDirCache[slug];
}

function findImage(slug, name) {
  var wantBase = (slug + '-' + name).toLowerCase();
  var entries = listImgDir(slug);
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var ext = path.extname(entry).toLowerCase();
    if (IMG_EXTS.indexOf(ext) === -1) continue;
    var base = entry.slice(0, entry.length - path.extname(entry).length).toLowerCase();
    if (base === wantBase) {
      return 'assets/img/projects/' + slug + '/' + entry; // preserve the real on-disk name/case
    }
  }
  return null;
}

/** Intrinsic { width, height } of a JPEG / PNG / WebP file (sniffed from the
 * bytes, not the extension — some ".jpg" files here are really WebP), or
 * null. Used for explicit width/height on the hero image. */
function imageSize(relPath) {
  var buf;
  try { buf = fs.readFileSync(path.join(ROOT, relPath)); } catch (e) { return null; }
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504E47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    var chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') {
      var b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8X') return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    return null;
  }
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    var i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xFF) { i++; continue; }
      var marker = buf[i + 1];
      // SOF0..SOF15 except DHT (C4), JPG (C8), DAC (CC) carry the frame size.
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** Renders a real <img> when a matching file exists on disk, else the same
 * placeholder box used everywhere else — callers don't need to branch. */
function mediaSlot(slug, name, altText, placeholderText, icon, prefix, wrapperStyle) {
  var found = findImage(slug, name);
  var styleAttr = wrapperStyle ? ' style="' + wrapperStyle + '"' : '';
  if (found) {
    return '<img class="real-img"' + styleAttr + ' src="' + (prefix || '') + found + '" alt="' + escapeHtml(altText) + '" loading="lazy">';
  }
  return '<div class="img-slot"' + styleAttr + '><i class="fa-solid ' + (icon || 'fa-image') + '"></i><span>' + escapeHtml(placeholderText) + '</span></div>';
}

function slugifyType(type) {
  return String(type).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatArea(min, max) {
  var a = Math.round(min);
  if (max == null) return a + '+ م²';
  var b = Math.round(max);
  return a === b ? a + ' م²' : a + ' – ' + b + ' م²';
}

function formatRooms(bedrooms) {
  if (!bedrooms || !bedrooms.length) return '';
  if (bedrooms.length === 1) return bedrooms[0] + (bedrooms[0] === 1 ? ' غرفة' : ' غرف');
  return bedrooms.join(' / ') + ' غرف';
}

/* ---------------- Derived data (V5) ----------------
 * Everything below is computed from inventory.json / pricing.json at build
 * time so no price, count or area is ever typed by hand. Every helper must
 * cope with a project that has no inventory rows (Terraces, Tawny), no
 * apartments, or availableUnits: null. */

// Short Arabic family label per unit type (hero subtitle; unit tabs later).
// Variants collapse into one family (both chalets → شاليه, all villas → فيلا).
var TYPE_SHORT_AR = {
  'Apartment': 'شقق',
  'Townhouse': 'تاون',
  'Quad': 'كواد',
  'Twin House': 'توين',
  'Twin House with Roof': 'توين',
  'Standalone': 'فيلا',
  'Small Villa': 'فيلا',
  'Beach Medium Villa': 'فيلا',
  'Standard Chalet': 'شاليه',
  'Beach Chalet': 'شاليه',
};

function shortTypeAr(u) {
  return TYPE_SHORT_AR[u.name] || u.nameAr;
}

/** Distinct values, first occurrence order. */
function uniq(list) {
  return list.filter(function (v, i) { return list.indexOf(v) === i; });
}

var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/** "2026-08-04" → "أغسطس 2026"; empty string if the date is missing/invalid. */
function arMonthYear(isoDate) {
  var m = /^(\d{4})-(\d{2})/.exec(isoDate || '');
  if (!m) return '';
  return AR_MONTHS[Number(m[2]) - 1] + ' ' + m[1];
}

/** Unit-level inventory rows for a project ([] when it isn't in the export). */
function inventoryFor(p) {
  if (!p.inventoryName) return [];
  return inventory.units.filter(function (r) { return r.project === p.inventoryName; });
}

/** Distinct finishing types, most common first. */
function finishingTypes(rows) {
  var counts = {};
  rows.forEach(function (r) { if (r.finishing) counts[r.finishing] = (counts[r.finishing] || 0) + 1; });
  return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
}

/** Summary of a set of rows: count, area range, cheapest price and the area of that cheapest unit. */
function summarizeRows(rows) {
  var cheapest = rows.reduce(function (min, r) { return r.price < min.price ? r : min; }, rows[0]);
  return {
    count: rows.length,
    areaMin: Math.min.apply(null, rows.map(function (r) { return r.bua_sqm; })),
    areaMax: Math.max.apply(null, rows.map(function (r) { return r.bua_sqm; })),
    minPrice: cheapest.price,
    cheapestArea: cheapest.bua_sqm,
  };
}

/** Rows for one unit type. Apartments → one group per bedroom count (sorted);
 * any other type → a single group. Falls back to the pricing.json summary
 * (count may be null, no cheapestArea) when there are no inventory rows. */
function unitGroups(u, rows) {
  var typeRows = rows.filter(function (r) { return r.type === u.type; });
  if (!typeRows.length) {
    return [{ rooms: null, count: u.count, areaMin: u.areaMin, areaMax: u.areaMax, minPrice: u.minPrice, cheapestArea: null }];
  }
  if (u.type !== 'Apartment') return [Object.assign({ rooms: null }, summarizeRows(typeRows))];
  var byRooms = {};
  typeRows.forEach(function (r) { (byRooms[r.rooms] = byRooms[r.rooms] || []).push(r); });
  return Object.keys(byRooms).map(Number).sort(function (a, b) { return a - b; }).map(function (n) {
    return Object.assign({ rooms: n }, summarizeRows(byRooms[n]));
  });
}

/** Lowest apartment price per m², floored to the nearest 50 EGP; null without apartment rows. */
function minPricePerSqm(rows) {
  var apts = rows.filter(function (r) { return r.type === 'Apartment' && r.bua_sqm > 0; });
  if (!apts.length) return null;
  var min = Math.min.apply(null, apts.map(function (r) { return r.price / r.bua_sqm; }));
  return Math.floor(min / 50) * 50;
}

/** Overall area range across every available unit (inventory first, pricing.json fallback). */
function overallAreaRange(rows, pricingUnits) {
  if (rows.length) {
    var s = summarizeRows(rows);
    return { min: s.areaMin, max: s.areaMax };
  }
  return {
    min: Math.min.apply(null, pricingUnits.map(function (u) { return u.areaMin; })),
    // areaMax can be null in pricing.json (single known size) — use areaMin then.
    max: Math.max.apply(null, pricingUnits.map(function (u) { return u.areaMax != null ? u.areaMax : u.areaMin; })),
  };
}

/** Consecutive gallery-1..N images that exist on disk (stops at the first gap). */
function galleryImages(slug) {
  var out = [];
  for (var i = 1; i <= 20; i++) {
    var found = findImage(slug, 'gallery-' + i);
    if (!found) break;
    out.push(found);
  }
  return out;
}

/** Up to `limit` other projects sharing this project's areaSlug, in projects-data.js order. */
function sameAreaProjects(p, allMerged, limit) {
  return allMerged.filter(function (o) { return o.slug !== p.slug && o.areaSlug === p.areaSlug; }).slice(0, limit || 2);
}

/** Merge a content entry with its pricing.json record into one render-ready project object. */
function mergeProject(p) {
  var pr = pricing.projects[p.pricingKey];
  if (!pr) throw new Error('No pricing.json entry for pricingKey "' + p.pricingKey + '" (' + p.slug + ')');

  var invRows = inventoryFor(p);

  var units = pr.units.map(function (u) {
    var key = slugifyType(u.type);
    return {
      key: key,
      name: u.type,
      nameAr: u.label,
      area: formatArea(u.areaMin, u.areaMax),
      rooms: formatRooms(u.bedrooms),
      price: u.minPrice,
      count: u.count,
      placeholder: 'صورة ' + u.label,
      image: findImage(p.slug, key),
      groups: unitGroups(u, invRows),
    };
  });

  var cheapest = units.reduce(function (min, u) { return u.price < min.price ? u : min; }, units[0]);

  var faqs = [
    {
      q: 'ما هو سعر الوحدات في ' + iso(p.nameEn) + '؟',
      a: 'تبدأ الأسعار من ' + fmt(pr.minPrice) + ' جنيه لـ' + iso(cheapest.name) + '، وتختلف الأسعار حسب نوع الوحدة والمساحة.' +
        (pr.refreshed ? '' : ' الأسعار حسب آخر تحديث متاح من المطوّر وقد تتغير — تواصل معنا واتساب للتأكيد.'),
    },
    {
      q: 'ما هي خطة السداد المتاحة؟',
      a: 'مقدم يبدأ من ' + p.paymentPlan.downPct + '% من قيمة الوحدة، والباقي بالتقسيط على فترة تصل إلى ' + p.paymentPlan.years + ' سنوات.',
    },
    { q: 'أين يقع مشروع ' + iso(p.nameEn) + '؟', a: 'يقع المشروع في ' + p.areaAr + '.' },
    {
      q: 'ما هي أنواع الوحدات المتاحة؟',
      a: units.map(function (u) { return iso(u.name) + ' (' + u.area + (u.rooms ? '، ' + u.rooms : '') + ')'; }).join('، ') + '.',
    },
    { q: 'هل ' + iso('Explorer Hyde Park') + ' هي الشركة المطورة؟', a: 'لا، نحن منصّة تسويقية ووسيط معتمد لعرض مشاريع هايد بارك، ولسنا المطوّر العقاري.' },
  ];

  return Object.assign({}, p, {
    units: units,
    startingPrice: pr.minPrice,
    availableUnits: pr.availableUnits,
    preliminary: !pr.refreshed,
    faqs: faqs,
    nameAr: p.nameAr || p.nameEn,
    finishings: finishingTypes(invRows),
    pricePerSqm: minPricePerSqm(invRows),
    areaRange: overallAreaRange(invRows, pr.units),
    galleryImages: galleryImages(p.slug),
    lastUpdatedAr: arMonthYear(pricing.meta.lastUpdated),
  });
}

/** overlay: transparent over a hero image until the page scrolls (project pages). */
function nav(overlay) {
  var links = [
    { href: '/', label: 'الرئيسية' },
    { href: '/#projects', label: 'المشاريع' },
    { href: '/#about', label: 'من نحن' },
    { href: '/contact', label: 'تواصل معنا' },
  ];
  var desktop = links.map(function (l) {
    return '<a href="' + l.href + '">' + l.label + '</a>';
  }).join('\n        ');
  var mobile = links.map(function (l) {
    return '<a href="' + l.href + '">' + l.label + '</a>';
  }).join('\n      ');

  return (
    '  <nav class="navbar' + (overlay ? ' navbar--overlay' : '') + '">\n' +
    '    <a href="/" class="navbar__brand">Explorer Hyde Park</a>\n' +
    '    <div class="navbar__links">\n' +
    '        ' + desktop + '\n' +
    '    </div>\n' +
    '    <button class="navbar__toggle" aria-label="فتح القائمة" data-nav-toggle>\n' +
    '      <span></span><span></span><span></span>\n' +
    '    </button>\n' +
    // Desktop-only call button on project pages (hidden by CSS below 1024px).
    (overlay ? '    <a href="#" class="navbar__call" data-phone-link>اتصل بنا</a>\n' : '') +
    '  </nav>\n' +
    '  <div class="mobile-menu">\n' +
    '      ' + mobile + '\n' +
    '  </div>'
  );
}

function footer() {
  return (
    '  <footer class="footer">\n' +
    '    <div class="footer__grid">\n' +
    '      <div class="footer__col">\n' +
    '        <span class="footer__brand">Explorer Hyde Park</span>\n' +
    '        <p class="footer__desc">منصّة تسويقية متخصصة في عرض مشاريع هايد بارك العقارية.</p>\n' +
    '      </div>\n' +
    '      <div class="footer__col">\n' +
    '        <span class="footer__heading">روابط سريعة</span>\n' +
    '        <a href="/">الرئيسية</a>\n' +
    '        <a href="/#about">من نحن</a>\n' +
    '        <a href="/contact">تواصل معنا</a>\n' +
    '        <a href="/privacy">سياسة الخصوصية</a>\n' +
    '      </div>\n' +
    '      <div class="footer__col">\n' +
    '        <span class="footer__heading">المشاريع</span>\n' +
    projects.map(function (p) {
      return '        <a href="/projects/' + p.slug + '">' + p.nameEn + '</a>\n';
    }).join('') +
    '      </div>\n' +
    '      <div class="footer__col">\n' +
    '        <span class="footer__heading">تواصل</span>\n' +
    '        <a href="#" data-whatsapp-link data-whatsapp-message="أرغب بمعرفة تفاصيل مشاريع هايد بارك">واتساب</a>\n' +
    '        <a href="#" data-phone-link>اتصال مباشر</a>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '    <div class="footer__bottom">\n' +
    '      <p>Explorer Hyde Park &copy; <span data-year></span> — منصّة تسويقية ووسيط معتمد لعرض مشاريع هايد بارك، ولسنا المطوّر العقاري.</p>\n' +
    '    </div>\n' +
    '  </footer>\n\n' +
    '  <a href="#" class="float-whatsapp" data-whatsapp-link data-whatsapp-message="أرغب بمعرفة تفاصيل مشاريع هايد بارك" aria-label="تواصل عبر واتساب">\n' +
    '    <i class="fa-brands fa-whatsapp"></i>\n' +
    '  </a>'
  );
}

/* ---------------- V5 sections below the gallery ---------------- */

var CORE_SHELL = 'كور آند شل';

function isCoreShell(p) {
  return p.finishingLabel === CORE_SHELL;
}

/** "وحدة واحدة" / "وحدتين" / "9 وحدات" / "25 وحدة". */
function unitsCountAr(n) {
  if (n === 1) return 'وحدة واحدة';
  if (n === 2) return 'وحدتين';
  if (n >= 3 && n <= 10) return n + ' وحدات';
  return n + ' وحدة';
}

/** Apartment bedroom label: "غرفة" / "غرفتين" / "3 غرف". */
function roomsAr(n) {
  if (n === 1) return 'غرفة';
  if (n === 2) return 'غرفتين';
  return n + ' غرف';
}

/** "63 – 93 م²" (LTR-isolated digits) from a min/max pair. */
function areaHtml(min, max) {
  var a = Math.round(min), b = Math.round(max != null ? max : min);
  return '<bdi class="en">' + (a === b ? a : a + ' – ' + b) + '</bdi> م²';
}

/** Tab label per unit type: the short family label, unless two types in this
 * project would share it (Sea Shore's two chalets) — then the full label. */
function unitTabLabels(p) {
  var shorts = p.units.map(shortTypeAr);
  return p.units.map(function (u, i) {
    return shorts.indexOf(shorts[i]) === shorts.lastIndexOf(shorts[i]) ? shorts[i] : u.nameAr;
  });
}

/** Every priced row on the page: one per apartment bedroom group, one per other type. */
function unitRows(p) {
  var rows = [];
  p.units.forEach(function (u) {
    u.groups.forEach(function (g) {
      var isApt = u.name === 'Apartment' && g.rooms != null;
      rows.push({
        unit: u,
        group: g,
        title: isApt ? roomsAr(g.rooms) : u.nameAr,
        calcName: isApt ? 'شقة ' + roomsAr(g.rooms) : u.nameAr,
        interest: isApt ? 'بشقة ' + roomsAr(g.rooms) : 'ب' + u.nameAr,
        rooms: isApt ? g.rooms : null,
        price: g.minPrice,
      });
    });
  });
  return rows;
}

function unitsSectionMarkup(p) {
  var labels = unitTabLabels(p);
  var tabs = p.units.map(function (u, i) {
    return (
      '        <button type="button" role="tab" class="pp-tab" id="tab-' + u.key + '" aria-controls="panel-' + u.key + '"' +
      ' aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? '0' : '-1') + '" data-unit-type="' + u.key + '">' +
      escapeHtml(labels[i]) + '</button>\n'
    );
  }).join('');

  var rowsByKey = {};
  unitRows(p).forEach(function (r) { (rowsByKey[r.unit.key] = rowsByKey[r.unit.key] || []).push(r); });

  var panels = p.units.map(function (u, i) {
    var media = u.image
      ? '<img class="real-img" src="../' + u.image + '" alt="' + escapeHtml(u.nameAr + ' في ' + p.nameEn) + '" loading="lazy" decoding="async">'
      : '<div class="img-slot"><i class="fa-solid fa-image"></i><span>' + escapeHtml(u.placeholder) + '</span></div>';
    var chip = u.count === 1 ? '<span class="pp-unit__avail">آخر وحدة</span>'
      : (u.count ? '<span class="pp-unit__avail">متاح <bdi class="en">' + u.count + '</bdi></span>' : '');
    var rows = rowsByKey[u.key].map(function (r) {
      var g = r.group;
      var meta = areaHtml(g.areaMin, g.areaMax) + (g.count ? ' · ' + unitsCountAr(g.count) : '');
      var dp = r.price * p.paymentPlan.downPct / 100;
      var msg = 'مهتم ' + r.interest + ' في ' + iso(p.nameEn) + ' — تبدأ من ' + fmt(r.price) + ' ج، مقدم ' + p.paymentPlan.downPct + '%. ابعتلي الوحدات المتاحة.';
      return (
        '            <div class="pp-unit-row">\n' +
        '              <div class="pp-unit-row__head"><h3 class="pp-unit-row__title">' + escapeHtml(r.title) + '</h3><span class="pp-unit-row__meta">' + meta + '</span></div>\n' +
        '              <div class="pp-unit-row__body">\n' +
        '                <div class="pp-unit-row__prices">\n' +
        '                  <span>يبدأ من <bdi class="en pp-unit-row__price">' + fmt(r.price) + '</bdi></span>\n' +
        '                  <span>مقدم <bdi class="en">' + p.paymentPlan.downPct + '%</bdi>: <bdi class="en">' + fmt(dp) + '</bdi></span>\n' +
        '                </div>\n' +
        '                <a href="#" class="pp-wa-btn" data-whatsapp-link data-whatsapp-message="' + escapeHtml(msg) + '"' +
        ' data-cta-location="units" data-unit-type="' + u.key + '" data-rooms="' + (r.rooms || '') + '">' +
        '<i class="fa-brands fa-whatsapp"></i> ابعتلي المتاح</a>\n' +
        '              </div>\n' +
        '            </div>\n'
      );
    }).join('');
    return (
      '      <div class="pp-unit" role="tabpanel" id="panel-' + u.key + '" aria-labelledby="tab-' + u.key + '" tabindex="0"' + (i === 0 ? '' : ' hidden') + '>\n' +
      '        <div class="pp-unit__media">' + media + chip + '</div>\n' +
      '        <div class="pp-unit__rows">\n' + rows + '        </div>\n' +
      '      </div>\n'
    );
  }).join('');

  return (
    '  <section class="pp-section pp-section--gray pp-units-section" id="units">\n' +
    '    <div class="pp-wrap">\n' +
    '      <div class="pp-units__head">\n' +
    '        <h2 class="pp-h2">الوحدات المتاحة</h2>\n' +
    '        <div class="pp-tabs" role="tablist" aria-label="أنواع الوحدات" data-unit-tabs>\n' + tabs + '        </div>\n' +
    '      </div>\n' +
    panels +
    '    </div>\n' +
    '  </section>\n'
  );
}

/** Round a monthly amount to a "nice" preset: nearest 10,000 (nearest 1,000 under 10k). */
function roundBudget(v) {
  var step = v < 10000 ? 1000 : 10000;
  return Math.max(step, Math.round(v / step) * step);
}

/** Four monthly-budget presets around the cheapest unit's installment at the
 * minimum down payment (Central → 50 / 70 / 100 / 150 ألف). */
function budgetPresets(p) {
  var months = p.paymentPlan.years * 12;
  var minMonthly = p.startingPrice * (1 - p.paymentPlan.downPct / 100) / months;
  return uniq([0.8, 1.1, 1.6, 2.4].map(function (m) { return roundBudget(minMonthly * m); }));
}

/** Lead-form monthly ranges derived from the presets (Central → <70 / 70–120 / 120–250 / >250 ألف). */
function budgetRanges(p) {
  var base = budgetPresets(p)[1];
  var a = base, b = roundBudget(base * 1.7), c = roundBudget(base * 3.5);
  var k = function (v) { return fmt(v / 1000); };
  return ['أقل من ' + k(a) + ' ألف', k(a) + ' – ' + k(b) + ' ألف', k(b) + ' – ' + k(c) + ' ألف', 'أكتر من ' + k(c) + ' ألف'];
}

/** Spec §3.6 formula — kept identical to the one in main.js (initReverseCalc). */
function calcResult(price, monthly, plan) {
  var months = plan.years * 12;
  var dp = Math.max(price * plan.downPct / 100, price - monthly * months);
  var pct = Math.round(dp / price * 100);
  return {
    fits: pct <= 50,
    text: pct <= 50
      ? 'مقدم ' + fmt(dp) + ' (' + pct + '%) · قسط ' + fmt((price - dp) / months)
      : 'محتاج مقدم ' + pct + '% من السعر',
  };
}

function calcWhatsappMessage(p, monthly) {
  return 'عايز وحدة في ' + iso(p.nameEn) + ' على قد ' + fmt(monthly) + ' جنيه في الشهر. ابعتلي الوحدات المناسبة.';
}

function calcSectionMarkup(p) {
  var presets = budgetPresets(p);
  var def = presets[1] != null ? 1 : 0;
  var monthly = presets[def];
  var months = p.paymentPlan.years * 12;

  var chips = presets.map(function (v, i) {
    return '        <button type="button" class="pp-budget" data-budget="' + v + '" aria-pressed="' + (i === def) + '">' + fmt(v / 1000) + ' ألف</button>\n';
  }).join('') +
    '        <button type="button" class="pp-budget" data-budget="custom" aria-pressed="false">مبلغ تاني</button>\n';

  var rows = unitRows(p).map(function (r) {
    var area = r.group.cheapestArea != null ? r.group.cheapestArea : r.group.areaMin;
    var res = calcResult(r.price, monthly, p.paymentPlan);
    return (
      '        <div class="pp-calc-row" data-price="' + r.price + '">\n' +
      '          <div class="pp-calc-row__text"><span class="pp-calc-row__name">' + escapeHtml(r.calcName) + ' <span class="pp-calc-row__meta">· ' + areaHtml(area) + '</span></span>' +
      '<span class="pp-calc-row__detail" data-calc-detail>' + res.text + '</span></div>\n' +
      '          <span class="pp-fit pp-fit--yes" data-calc-fit' + (res.fits ? '' : ' hidden') + '>مناسبة</span>' +
      '<span class="pp-fit pp-fit--no" data-calc-nofit' + (res.fits ? ' hidden' : '') + '>مقدم كبير</span>\n' +
      '        </div>\n'
    );
  }).join('');

  return (
    '  <section class="pp-section pp-calc-section" id="calc" data-reverse-calc data-down-pct="' + p.paymentPlan.downPct + '" data-months="' + months + '" data-project="' + escapeHtml(p.nameEn) + '">\n' +
    // Two wrappers so desktop can split inputs | results; on mobile they are
    // display: contents and the note is ordered last (same as before).
    '    <div class="pp-wrap pp-calc">\n' +
    '      <div class="pp-calc__inputs">\n' +
    '        <h2 class="pp-h2">تقدر تدفع كام في الشهر؟</h2>\n' +
    '        <p class="pp-lede">اختار القسط المريح ليك، وهنقولك محتاج مقدم قد إيه لكل وحدة.</p>\n' +
    '        <div class="pp-budgets">\n' + chips + '        </div>\n' +
    '        <label class="pp-custom" data-calc-custom hidden>اكتب القسط الشهري اللي يناسبك\n' +
    '          <span class="pp-custom__box"><input type="text" inputmode="numeric" autocomplete="off" placeholder="مثلاً 85000" data-calc-input><span>جنيه / شهر</span></span>\n' +
    '        </label>\n' +
    '        <p class="pp-note">حساب تقريبي على أقل سعر متاح و' + months + ' قسط شهري. الخطة النهائية حسب الوحدة وسياسة المطوّر وقت الحجز.</p>\n' +
    '      </div>\n' +
    '      <div class="pp-calc__results">\n' +
    '        <div class="pp-calc-rows">\n' + rows + '        </div>\n' +
    '        <a href="#" class="pp-btn pp-btn--green pp-btn--block pp-calc-cta" data-whatsapp-link data-whatsapp-message="' + escapeHtml(calcWhatsappMessage(p, monthly)) + '" data-cta-location="calc" data-calc-cta>' +
    '<i class="fa-brands fa-whatsapp"></i> <span data-calc-cta-text>ابعتلي الوحدات اللي على قد ' + fmt(monthly) + ' جنيه في الشهر</span></a>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </section>\n'
  );
}

function locationSectionMarkup(p) {
  var img = findImage(p.slug, 'location');
  var hasDistances = p.distances && p.distances.length;
  var body = hasDistances
    ? '        <ul class="pp-distances">\n' + p.distances.map(function (d) {
        return '          <li><span>' + escapeHtml(d.place) + '</span><span class="pp-distances__min"><bdi class="en">' + d.minutes + '</bdi> دقيقة</span></li>\n';
      }).join('') + '        </ul>\n'
    : '        <p class="pp-location__text">' + escapeHtml(p.locationText) + '</p>\n';
  var maps = p.mapsUrl
    ? '        <a class="pp-link" href="' + escapeHtml(p.mapsUrl) + '" target="_blank" rel="noopener">افتح على Google Maps ←</a>\n'
    : '';
  return (
    '  <section class="pp-section pp-section--gray pp-location-section" id="location">\n' +
    // h2 sits in the text column (desktop); on mobile the body is
    // display: contents and the h2 is ordered first, above the image.
    '    <div class="pp-wrap pp-location' + (img ? '' : ' pp-location--no-img') + '">\n' +
    (img ? '      <img class="pp-location__img" src="../' + img + '" alt="' + escapeHtml('موقع ' + p.nameEn + ' في ' + p.areaAr) + '" loading="lazy" decoding="async">\n' : '') +
    '      <div class="pp-location__body">\n' +
    '        <h2 class="pp-h2">' + (hasDistances ? 'الموقع بالدقايق' : 'الموقع') + '</h2>\n' +
    body + maps +
    '      </div>\n' +
    '    </div>\n' +
    '  </section>\n'
  );
}

function amenitiesSectionMarkup(p) {
  if (!p.amenities || !p.amenities.length) return '';
  return (
    '  <section class="pp-section">\n' +
    '    <div class="pp-wrap">\n' +
    '      <h2 class="pp-h2">المميزات والخدمات</h2>\n' +
    '      <ul class="pp-chipset">\n' +
    p.amenities.map(function (a) { return '        <li>' + escapeHtml(a) + '</li>\n'; }).join('') +
    '      </ul>\n' +
    '    </div>\n' +
    '  </section>\n'
  );
}

/** Site-level trust points (not per project). Items 3–4 confirmed by Abdo;
 * item 4's wording is fixed — don't add claims about other fees. */
function trustSectionMarkup() {
  var items = [
    ['fa-shield-halved', 'وسيط معتمد لمشاريع هايد بارك', 'بنعرض ' + projects.length + ' مشاريع في مكان واحد، فتقارن قبل ما تقرر.'],
    ['fa-tags', 'أسعار من مخزون المطوّر مباشرة', 'كل سعر على الصفحة من آخر تحديث لمخزون الوحدات المتاحة فعلاً.'],
    ['fa-earth-africa', 'بتشتري من برا مصر؟', 'متابعة كاملة أونلاين من الحجز لحد التعاقد بتوكيل.'],
    ['fa-circle-check', 'بدون أي عمولة على المشتري', ''],
  ];
  return (
    '  <section class="pp-section pp-section--gray">\n' +
    '    <div class="pp-wrap">\n' +
    '      <h2 class="pp-h2">ليه تشتري من خلالنا؟</h2>\n' +
    '      <ul class="pp-trust">\n' +
    items.map(function (t) {
      return '        <li><i class="fa-solid ' + t[0] + '"></i><div><strong>' + t[1] + '</strong>' + (t[2] ? '<span>' + t[2] + '</span>' : '') + '</div></li>\n';
    }).join('') +
    '      </ul>\n' +
    '    </div>\n' +
    '  </section>\n'
  );
}

/** Same-area project closest in starting price (for the "what's the difference" FAQ). */
function nearestSameArea(p) {
  var list = p.sameAreaAll || [];
  if (!list.length) return null;
  return list.reduce(function (best, o) {
    return Math.abs(o.startingPrice - p.startingPrice) < Math.abs(best.startingPrice - p.startingPrice) ? o : best;
  }, list[0]);
}

function projectBriefAr(o) {
  return iso(o.nameEn) + ' بيبدأ من ' + fmt(o.startingPrice) + ' جنيه وفيه ' + joinAr(o.units.map(function (u) { return u.nameAr; })) +
    (o.availableUnits ? '، والمتاح حالياً ' + unitsCountAr(o.availableUnits) : '');
}

/** New V5 questions first (spec order), then the existing generated ones. */
function projectFaqs(p) {
  var faqs = [];
  if (isCoreShell(p)) {
    faqs.push({
      q: p.finishingCostNote ? 'يعني إيه كور آند شل؟ والتشطيب بيتكلف كام؟' : 'يعني إيه كور آند شل؟',
      a: 'كور آند شل يعني الوحدة بتتسلّم هيكل خرساني وواجهات من غير أي تشطيب داخلي، والمشتري بيشطّب على ذوقه.' +
        (p.finishingCostNote ? ' ' + p.finishingCostNote : ''),
    });
  }
  faqs.push({
    q: 'لو دفعت مقدم أكبر، القسط هيقل؟',
    a: 'أيوه. القسط الشهري بيتحسب على الباقي بعد المقدم، فكل ما المقدم يزيد القسط بيقل. في ' + iso(p.nameEn) +
      ' المقدم بيبدأ من ' + p.paymentPlan.downPct + '% والتقسيط لحد ' + yearsAr(p.paymentPlan.years) +
      '، وتقدر تجرّب بنفسك في حاسبة "تقدر تدفع كام في الشهر؟" على الصفحة.',
  });
  var other = nearestSameArea(p);
  if (other) {
    faqs.push({
      q: 'إيه الفرق بين ' + p.nameAr + ' و' + other.nameAr + '؟',
      a: projectBriefAr(p) + '. أما ' + projectBriefAr(other) + '.',
    });
  }
  faqs.push({
    q: 'ينفع أشتري وأنا مقيم برا مصر؟',
    a: 'أيوه. فريقنا بيتابع معاك أونلاين من الحجز لحد التعاقد، والتعاقد ممكن يتم بتوكيل.',
  });
  return faqs.concat(p.faqs);
}

function faqSectionMarkup(faqs) {
  return (
    '  <section class="pp-section" id="faq">\n' +
    '    <div class="pp-wrap">\n' +
    '      <h2 class="pp-h2">أسئلة قبل ما تقرر</h2>\n' +
    '      <div class="pp-faq">\n' +
    faqs.map(function (f, i) {
      return (
        '        <details class="pp-faq__item"' + (i === 0 ? ' open' : '') + '>\n' +
        '          <summary>' + escapeHtml(f.q) + '</summary>\n' +
        '          <p>' + escapeHtml(f.a) + '</p>\n' +
        '        </details>\n'
      );
    }).join('') +
    '      </div>\n' +
    '    </div>\n' +
    '  </section>\n'
  );
}

/** FAQPage JSON-LD — same strings as the visible <details> (spec §3.10). */
function faqJsonLd(faqs) {
  var data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(function (f) {
      return { '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } };
    }),
  };
  return '<script type="application/ld+json">' + JSON.stringify(data).replace(/</g, '\\u003c') + '</script>';
}

function optionGroup(name, options, legend) {
  return (
    '          <fieldset class="pp-q">\n' +
    '            <legend>' + legend + '</legend>\n' +
    '            <div class="pp-options">\n' +
    options.map(function (o) {
      return '              <label class="pp-option"><input type="radio" name="' + name + '" value="' + escapeHtml(o) + '"><span>' + escapeHtml(o) + '</span></label>\n';
    }).join('') +
    '            </div>\n' +
    '          </fieldset>\n'
  );
}

/** 3-step lead form. Radios (not JS buttons) so the no-JS fallback — every
 * step visible at once — still carries the answers. Submission goes through
 * the existing data-lead-form flow in main.js. */
function leadSectionMarkup(p) {
  var unitOptions = p.units.map(function (u) { return u.nameAr; }).concat(['لسه مش متأكد']);
  var note = isCoreShell(p)
    ? '          <p class="pp-lead__note" data-immediate-note hidden>وحدات ' + iso(p.nameEn) + ' بتتسلّم كور آند شل، فهنرشحلك كمان وحدات جاهزة أو قريبة من التسليم في مشاريع هايد بارك التانية.</p>\n'
    : '';
  return (
    '  <section class="pp-section pp-lead-section" id="lead">\n' +
    '    <div class="pp-wrap pp-lead-wrap">\n' +
    '      <h2 class="pp-h2 pp-h2--on-dark">نرشّحلك الوحدات المناسبة</h2>\n' +
    '      <form class="pp-lead" data-lead-form data-multistep data-project-name="' + escapeHtml(p.nameEn) + '" data-success-url="/thank-you">\n' +
    '        <div class="pp-progress" aria-hidden="true"><span class="is-done"></span><span></span><span></span></div>\n' +
    '        <p class="pp-lead__step-label" data-step-label>خطوة 1 من 3</p>\n' +
    '        <div class="pp-step" data-step="1">\n' +
    optionGroup('purpose', ['سكن فوري', 'سكن مستقبلي', 'استثمار', 'مقيم خارج مصر'], 'بتشتري ليه؟') +
    note +
    optionGroup('budget_range', budgetRanges(p), 'القسط الشهري المريح ليك') +
    '          <div class="pp-lead__nav"><button type="button" class="pp-btn pp-btn--green" data-step-next>التالي</button></div>\n' +
    '        </div>\n' +
    '        <div class="pp-step" data-step="2">\n' +
    optionGroup('unit_type', unitOptions, 'نوع الوحدة') +
    optionGroup('timing', ['خلال شهر', 'خلال 3 شهور', 'لسه بستكشف'], 'ناوي تشتري إمتى؟') +
    '          <div class="pp-lead__nav"><button type="button" class="pp-btn pp-btn--ghost" data-step-back>رجوع</button><button type="button" class="pp-btn pp-btn--green" data-step-next>التالي</button></div>\n' +
    '        </div>\n' +
    '        <div class="pp-step" data-step="3">\n' +
    '          <div class="field">\n' +
    '            <label for="lead-name">الاسم</label>\n' +
    '            <input type="text" id="lead-name" name="name" placeholder="اكتب اسمك" autocomplete="name" required>\n' +
    '          </div>\n' +
    '          <div class="field">\n' +
    '            <label for="lead-phone">رقم الموبايل</label>\n' +
    '            <div class="form-row">\n' +
    '              ' + phoneFieldMarkup() + '\n' +
    '              <input type="tel" id="lead-phone" name="phone" class="field-tel" dir="ltr" placeholder="1XX XXX XXXX" autocomplete="tel-national" required>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="pp-lead__nav"><button type="button" class="pp-btn pp-btn--ghost" data-step-back>رجوع</button><button type="submit" class="pp-btn pp-btn--green">ابعت الطلب</button></div>\n' +
    '        </div>\n' +
    '        <p class="pp-lead__error" data-step-error hidden>اختار إجابة لكل سؤال عشان نكمل.</p>\n' +
    '      </form>\n' +
    '      <p class="form-consent">بإرسال النموذج، إنك موافق على <a href="/privacy">سياسة الخصوصية</a>.</p>\n' +
    '    </div>\n' +
    '  </section>\n'
  );
}

/** "6.43M" / "23.4M" for the comparison table. */
function shortMillions(n) {
  return (Math.round(n / 1e4) / 100).toString() + 'M';
}

function shortProjectNameAr(o) {
  return o.nameAr.replace(/^هايد بارك\s+/, '');
}

function compareSectionMarkup(p, allMerged) {
  var others = allMerged.filter(function (o) { return o.slug !== p.slug; });
  var table = '';
  if (p.sameArea.length) {
    var cols = [p].concat(p.sameArea);
    var cell = function (o, html) { return '<td' + (o === p ? ' class="is-current"' : '') + '>' + html + '</td>'; };
    table =
      '      <h2 class="pp-h2">مقارنة بمشاريع هايد بارك في ' + escapeHtml(p.areaAr) + '</h2>\n' +
      '      <div class="pp-compare">\n' +
      '        <table>\n' +
      // Mobile shows the short Arabic name and "6.43M"; desktop (≥1024px) the
      // English name and the full price — both variants live in the HTML.
      '          <thead><tr><th scope="col"><span class="visually-hidden">البند</span></th>' + cols.map(function (o) {
        var label = '<span class="pp-mobile-only">' + escapeHtml(shortProjectNameAr(o)) + '</span><bdi class="en pp-desktop-only">' + escapeHtml(o.nameEn) + '</bdi>';
        return '<th scope="col"' + (o === p ? ' class="is-current"' : '') + '>' + (o === p ? label : '<a href="/projects/' + o.slug + '">' + label + '</a>') + '</th>';
      }).join('') + '</tr></thead>\n' +
      '          <tbody>\n' +
      '            <tr><th scope="row">يبدأ من</th>' + cols.map(function (o) {
        return cell(o, '<bdi class="en pp-mobile-only">' + shortMillions(o.startingPrice) + '</bdi><bdi class="en pp-desktop-only">' + fmt(o.startingPrice) + '</bdi>');
      }).join('') + '</tr>\n' +
      '            <tr><th scope="row">الأنواع</th>' + cols.map(function (o) { return cell(o, escapeHtml(uniq(o.units.map(shortTypeAr)).join(' · '))); }).join('') + '</tr>\n' +
      '            <tr><th scope="row">المتاح</th>' + cols.map(function (o) { return cell(o, o.availableUnits ? '<bdi class="en">' + o.availableUnits + '</bdi>' : '—'); }).join('') + '</tr>\n' +
      '          </tbody>\n' +
      '        </table>\n' +
      '      </div>\n';
  }
  var cards = others.map(function (o) {
    var img = findImage(o.slug, 'hero');
    var media = img
      ? '<img src="../' + img + '" alt="' + escapeHtml(o.nameEn) + '" loading="lazy" decoding="async">'
      : '<div class="img-slot"><i class="fa-solid fa-image"></i><span>' + escapeHtml(o.nameEn) + '</span></div>';
    return (
      '        <a class="pp-project-card" href="/projects/' + o.slug + '">\n' +
      '          <div class="pp-project-card__media">' + media + '</div>\n' +
      '          <div class="pp-project-card__body"><span class="pp-project-card__area">' + escapeHtml(o.areaAr) + '</span>' +
      '<bdi class="en pp-project-card__name">' + escapeHtml(o.nameEn) + '</bdi>' +
      '<span>يبدأ من <bdi class="en pp-project-card__price">' + fmt(o.startingPrice) + '</bdi> ج</span></div>\n' +
      '        </a>\n'
    );
  }).join('');
  return (
    '  <section class="pp-section pp-compare-section" id="other-projects">\n' +
    '    <div class="pp-wrap">\n' +
    table +
    '      <h2 class="pp-h2' + (table ? ' pp-h2--spaced' : '') + '">مشاريع تانية ممكن تعجبك</h2>\n' +
    '      <div class="pp-projects" data-projects-slider aria-label="مشاريع تانية" tabindex="0">\n' + cards + '      </div>\n' +
    '    </div>\n' +
    '  </section>\n'
  );
}

/** "8 سنين" / "سنة" / "سنتين" / "12 سنة" — Arabic counted-noun agreement. */
function yearsAr(n) {
  if (n === 1) return 'سنة';
  if (n === 2) return 'سنتين';
  if (n >= 3 && n <= 10) return n + ' سنين';
  return n + ' سنة';
}

/** Arabic list join: "أ وب وج" (first item, then "، و" before the rest when asked). */
function joinAr(items) {
  if (items.length <= 1) return items.join('');
  return items[0] + '، و' + items.slice(1).join(' و');
}

/** Area range covered by a unit's groups ({ min, max }), null-safe. */
function groupsAreaRange(groups) {
  var mins = groups.map(function (g) { return g.areaMin; }).filter(function (v) { return v != null; });
  var maxs = groups.map(function (g) { return g.areaMax != null ? g.areaMax : g.areaMin; }).filter(function (v) { return v != null; });
  if (!mins.length) return null;
  return { min: Math.min.apply(null, mins), max: Math.max.apply(null, maxs) };
}

function heroMarkup(p) {
  var img = findImage(p.slug, 'hero');
  var media;
  if (img) {
    var size = imageSize(img);
    media = '<img class="pp-hero__img" src="../' + img + '" alt="' + escapeHtml(p.nameEn + ' — ' + p.areaAr) + '"' +
      (size ? ' width="' + size.width + '" height="' + size.height + '"' : '') + ' fetchpriority="high" decoding="async">';
  } else {
    media = '<div class="img-slot pp-hero__img"><i class="fa-solid fa-image"></i><span>' + escapeHtml(p.heroPlaceholder) + '</span></div>';
  }
  var subtitle = [p.areaAr].concat(uniq(p.units.map(shortTypeAr))).join(' · ');
  var badge = p.availableUnits ? '        <span class="pp-badge">' + p.availableUnits + ' وحدة متاحة</span>\n' : '';
  var prelim = p.preliminary ? ' <span class="pp-price-card__note">سعر مبدئي</span>' : '';

  return (
    '  <header class="pp-hero">\n' +
    '    <div class="pp-hero__media">\n' +
    '      ' + media + '\n' +
    '      <div class="pp-hero__shade"></div>\n' +
    '      <div class="pp-hero__text">\n' +
    badge +
    '        <h1 class="pp-hero__title"><bdi class="en">' + escapeHtml(p.nameEn) + '</bdi></h1>\n' +
    '        <p class="pp-hero__sub">' + escapeHtml(subtitle) + '</p>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '    <div class="pp-price-card">\n' +
    '      <p class="pp-price-card__price"><span class="pp-price-card__label">يبدأ من</span> <bdi class="en pp-price-card__value">' + fmt(p.startingPrice) + '</bdi> <span class="pp-price-card__label">جنيه</span>' + prelim + '</p>\n' +
    '      <div class="pp-price-card__tiles">\n' +
    '        <div class="pp-tile"><span class="pp-tile__label">مقدم من</span><bdi class="en pp-tile__value">' + p.paymentPlan.downPct + '%</bdi></div>\n' +
    '        <div class="pp-tile"><span class="pp-tile__label">تقسيط حتى</span><span class="pp-tile__value">' + yearsAr(p.paymentPlan.years) + '</span></div>\n' +
    '        <a class="pp-tile pp-tile--link" href="#calc"><span class="pp-tile__label">قسطك كام؟</span><span class="pp-tile__value">احسبه ←</span></a>\n' +
    '      </div>\n' +
    '      <div class="pp-price-card__ctas">\n' +
    '        <a class="pp-btn pp-btn--green pp-btn--block" href="#units">شوف الوحدات اللي في ميزانيتك</a>\n' +
    // Desktop only — on mobile WhatsApp lives in the sticky bottom bar.
    '        <a href="#" class="pp-btn pp-btn--outline pp-desktop-only" data-whatsapp-link data-whatsapp-message="أرغب بمعرفة تفاصيل ' + iso(p.nameEn) + '" data-cta-location="hero"><i class="fa-brands fa-whatsapp"></i> واتساب</a>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </header>\n'
  );
}

function sectionNavMarkup(p) {
  var chips = [['units', 'الوحدات'], ['calc', 'احسب قسطك']];
  if (p.galleryImages.length) chips.push(['gallery', 'الصور']);
  chips.push(['location', 'الموقع'], ['faq', 'الأسئلة']);
  return (
    '  <nav class="pp-chips" aria-label="أقسام الصفحة" data-section-nav>\n' +
    chips.map(function (c) {
      return '    <a class="pp-chip" href="#' + c[0] + '">' + c[1] + '</a>\n';
    }).join('') +
    '  </nav>\n'
  );
}

/** Answer-first summary paragraph, built only from data. Returns HTML. */
function summaryHtml(p) {
  var parts = p.units.map(function (u) {
    if (u.name !== 'Apartment') return escapeHtml(u.nameAr);
    var r = groupsAreaRange(u.groups);
    if (!r) return escapeHtml(u.nameAr);
    var a = Math.round(r.min), b = Math.round(r.max);
    return 'شقق ' + (a === b ? 'بمساحة ' + a + ' م²' : 'من ' + a + ' لـ ' + b + ' م²');
  });
  var kind = p.areaSlug === 'north-coast' ? 'مشروع ساحلي' : 'مشروع سكني';
  var available = p.availableUnits
    ? 'المتاح حالياً <strong>' + p.availableUnits + ' وحدة</strong>: '
    : 'الوحدات المتاحة: ';
  var finishing = p.finishingLabel ? '، والوحدات بتتسلّم ' + escapeHtml(p.finishingLabel) : '';
  return (
    escapeHtml(p.nameAr) + ' (<bdi class="en">' + escapeHtml(p.nameEn) + '</bdi>) ' + kind +
    ' من هايد بارك للتطوير العقاري في ' + escapeHtml(p.areaAr) + '. ' +
    available + joinAr(parts) + '. ' +
    'الأسعار بتبدأ من <strong><bdi class="en">' + fmt(p.startingPrice) + '</bdi> جنيه</strong>' +
    ' بمقدم من ' + p.paymentPlan.downPct + '% وتقسيط لحد ' + yearsAr(p.paymentPlan.years) + finishing + '.'
  );
}

function overviewMarkup(p) {
  var facts = [['الموقع', escapeHtml(p.areaAr)]];
  var a = Math.round(p.areaRange.min), b = Math.round(p.areaRange.max);
  facts.push(['المساحات', '<bdi class="en">' + (a === b ? fmt(a) : fmt(a) + ' – ' + fmt(b)) + '</bdi> م²']);
  if (p.finishingLabel) facts.push(['التشطيب', escapeHtml(p.finishingLabel)]);
  if (p.deliveryYear) facts.push(['الاستلام', '<bdi class="en">' + escapeHtml(p.deliveryYear) + '</bdi>']);
  if (p.pricePerSqm) facts.push(['سعر المتر (شقق) من', '<bdi class="en">' + fmt(p.pricePerSqm) + '</bdi> ج/م²']);
  facts.push(['المطوّر', 'هايد بارك للتطوير']);

  var byline = (p.lastUpdatedAr ? 'محدّث: ' + p.lastUpdatedAr + ' · ' : '') +
    'من مخزون المطوّر · إعداد فريق <bdi class="en">Explorer Hyde Park</bdi>';

  return (
    '  <section class="pp-section" id="overview">\n' +
    '    <div class="pp-wrap pp-overview">\n' +
    '      <div class="pp-overview__text">\n' +
    '        <h2 class="pp-h2">' + escapeHtml(p.nameAr) + ' في سطور</h2>\n' +
    '        <p class="pp-summary">' + summaryHtml(p) + '</p>\n' +
    '        <p class="pp-byline">' + byline + '</p>\n' +
    '      </div>\n' +
    '      <dl class="pp-facts">\n' +
    facts.map(function (f) {
      return '        <div class="pp-fact"><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>\n';
    }).join('') +
    '      </dl>\n' +
    '    </div>\n' +
    '  </section>\n'
  );
}

/** Main image + thumbnail strip. Omitted entirely when a project has no gallery photos. */
function galleryMarkup(p) {
  var imgs = p.galleryImages;
  if (!imgs.length) return '';
  var alt = function (n) { return 'صورة ' + n + ' من مشروع ' + p.nameEn + ' في ' + p.areaAr; };
  var thumbs = imgs.map(function (src, i) {
    return (
      '        <button type="button" class="pp-gallery__thumb" data-gallery-thumb data-src="../' + src + '" data-alt="' + escapeHtml(alt(i + 1)) + '"' +
      ' aria-label="صورة ' + (i + 1) + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' +
      '<img src="../' + src + '" alt="" loading="lazy" decoding="async"></button>\n'
    );
  }).join('');
  return (
    '  <section class="pp-section pp-section--gray" id="gallery" data-gallery>\n' +
    '    <div class="pp-wrap">\n' +
    '      <h2 class="pp-h2">صور المشروع</h2>\n' +
    '      <div class="pp-gallery__body">\n' +
    '        <div class="pp-gallery__main">\n' +
    '          <img src="../' + imgs[0] + '" alt="' + escapeHtml(alt(1)) + '" decoding="async" data-gallery-main>\n' +
    '          <span class="pp-gallery__count" data-gallery-count><bdi class="en">1 / ' + imgs.length + '</bdi></span>\n' +
    '        </div>\n' +
    '        <div class="pp-gallery__thumbs">\n' +
    thumbs +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </section>\n'
  );
}

/** Mobile-only bottom bar (hidden ≥768px, where the floating WhatsApp button stays). */
function stickyBarMarkup(p) {
  return (
    '  <div class="pp-sticky-bar">\n' +
    '    <a href="#" class="pp-sticky-bar__btn pp-sticky-bar__btn--wa" data-whatsapp-link data-whatsapp-message="أرغب بمعرفة تفاصيل ' + iso(p.nameEn) + '" data-cta-location="sticky"><i class="fa-brands fa-whatsapp"></i> واتساب</a>\n' +
    '    <a href="#" class="pp-sticky-bar__btn pp-sticky-bar__btn--call" data-phone-link>اتصال</a>\n' +
    '    <a href="#units" class="pp-sticky-bar__btn pp-sticky-bar__btn--units">الوحدات</a>\n' +
    '  </div>\n'
  );
}

function phoneFieldMarkup() {
  return (
    '<div class="phone-field" data-phone-field data-default="EG">\n' +
    '            <button type="button" class="phone-field__toggle" aria-haspopup="listbox" aria-expanded="false">\n' +
    '              <span class="flag"></span><span class="dial"></span><i class="fa-solid fa-chevron-down"></i>\n' +
    '            </button>\n' +
    '            <input type="hidden" name="country_code" value="+20">\n' +
    '            <div class="phone-field__panel" hidden>\n' +
    '              <div class="phone-field__search-wrap"><input type="text" class="phone-field__search" placeholder="ابحث عن الدولة أو الكود"></div>\n' +
    '              <div class="phone-field__list" role="listbox"></div>\n' +
    '            </div>\n' +
    '          </div>'
  );
}

function preliminaryNotice(p) {
  if (!p.preliminary) return '';
  return (
    '  <div class="pp-wrap pp-notice">\n' +
    '    ⚠ أسعار هذا المشروع من آخر تحديث متاح ولسه محتاجة تأكيد نهائي من المطوّر — تواصل معنا واتساب لأحدث المعلومات.\n' +
    '  </div>\n'
  );
}

/** Absolute URL to a project's real hero photo if one exists on disk,
 * else the shared fallback image — same findImage lookup mediaSlot uses. */
function ogImageUrl(slug) {
  var found = findImage(slug, 'hero');
  return found ? SITE_ORIGIN + '/' + found : OG_DEFAULT_IMAGE;
}

/** Open Graph + Twitter Card <meta> block. title/description are raw
 * (unescaped) text — this function handles escaping; url/image must
 * already be absolute URLs. */
function ogTagsMarkup(opts) {
  var title = escapeHtml(opts.title);
  var description = escapeHtml(opts.description);
  return (
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:title" content="' + title + '">\n' +
    '<meta property="og:description" content="' + description + '">\n' +
    '<meta property="og:url" content="' + opts.url + '">\n' +
    '<meta property="og:image" content="' + opts.image + '">\n' +
    '<meta property="og:image:width" content="1200">\n' +
    '<meta property="og:image:height" content="630">\n' +
    '<meta property="og:site_name" content="Explorer Hyde Park">\n' +
    '<meta property="og:locale" content="ar_AR">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:title" content="' + title + '">\n' +
    '<meta name="twitter:description" content="' + description + '">\n' +
    '<meta name="twitter:image" content="' + opts.image + '">'
  );
}

var OG_BLOCK_START = '<!-- AUTO:OG:START -->';
var OG_BLOCK_END = '<!-- AUTO:OG:END -->';

/** Splices an OG/Twitter block right after <link rel="canonical"> in a
 * hand-written static page (index/contact/privacy) — title, description
 * and the canonical URL are read back from the page's own tags so the
 * OG data always matches what's already there, no duplication. Wrapped
 * in AUTO:OG markers so re-running the build updates in place instead of
 * stacking duplicate blocks. thank-you.html is never passed in here — it
 * carries noindex and shouldn't be promoted for social sharing. */
function injectStaticOgTags(relPath, imageUrl) {
  var filePath = path.join(ROOT, relPath);
  var html = fs.readFileSync(filePath, 'utf8');
  var titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
  var descMatch = html.match(/<meta name="description" content="([^"]*)">/);
  var canonicalMatch = html.match(/<link rel="canonical" href="([^"]*)">/);
  if (!titleMatch || !descMatch || !canonicalMatch) {
    console.log('  (skipped ' + relPath + ' — could not find title/description/canonical tags)');
    return;
  }

  var block = OG_BLOCK_START + '\n' + ogTagsMarkup({
    title: unescapeHtml(titleMatch[1]),
    description: unescapeHtml(descMatch[1]),
    url: canonicalMatch[1],
    image: imageUrl,
  }) + '\n' + OG_BLOCK_END;

  var blockRegex = new RegExp(OG_BLOCK_START + '[\\s\\S]*?' + OG_BLOCK_END);
  var updated = blockRegex.test(html)
    ? html.replace(blockRegex, block)
    : html.replace(canonicalMatch[0], canonicalMatch[0] + '\n' + block);

  fs.writeFileSync(filePath, updated, 'utf8');
  console.log('updated OG/Twitter tags in ' + relPath);
}

function page(p, allMerged) {
  var title = p.nameEn + ' | ' + SITE_NAME + ' — أسعار ومساحات وخطط السداد';
  var description = p.intro.replace(/\s*\*.*$/, '').slice(0, 155);
  var canonical = 'https://www.explorerhydepark.com/projects/' + p.slug;
  var faqs = projectFaqs(p);

  return '<!DOCTYPE html>\n' +
'<html lang="ar" dir="rtl">\n' +
'<head>\n' +
'<!-- Google Tag Manager -->\n' +
'<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':\n' +
'new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],\n' +
'j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=\n' +
'\'https://www.googletagmanager.com/gtm.js?id=\'+i+dl;f.parentNode.insertBefore(j,f);\n' +
'})(window,document,\'script\',\'dataLayer\',\'GTM-5FD83KJ7\');</script>\n' +
'<!-- End Google Tag Manager -->\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + escapeHtml(title) + '</title>\n' +
'<meta name="description" content="' + escapeHtml(description) + '">\n' +
'<link rel="canonical" href="' + canonical + '">\n' +
ogTagsMarkup({ title: title, description: description, url: canonical, image: ogImageUrl(p.slug) }) + '\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">\n' +
'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">\n' +
'<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons@7/css/flag-icons.min.css">\n' +
'<link rel="stylesheet" href="../assets/css/style.css">\n' +
faqJsonLd(faqs) + '\n' +
'</head>\n' +
'<body class="pp-page">\n\n' +
'<!-- Google Tag Manager (noscript) -->\n' +
'<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5FD83KJ7"\n' +
'height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n' +
'<!-- End Google Tag Manager (noscript) -->\n\n' +
nav(true) + '\n\n' +
heroMarkup(p) + '\n' +
sectionNavMarkup(p) + '\n' +
preliminaryNotice(p) +
overviewMarkup(p) + '\n' +
galleryMarkup(p) + '\n' +
unitsSectionMarkup(p) + '\n' +
calcSectionMarkup(p) + '\n' +
locationSectionMarkup(p) + '\n' +
// .pp-pair: on mobile a plain wrapper (each section keeps its own full-bleed
// background); on desktop the two sections become side-by-side columns.
'  <div class="pp-pair pp-pair--amenities">\n' +
amenitiesSectionMarkup(p) +
trustSectionMarkup() +
'  </div>\n\n' +
'  <div class="pp-pair pp-pair--faq">\n' +
faqSectionMarkup(faqs) +
leadSectionMarkup(p) +
'  </div>\n\n' +
compareSectionMarkup(p, allMerged) + '\n' +
footer() + '\n\n' +
stickyBarMarkup(p) + '\n' +
'<script src="../assets/js/country-codes.js"></script>\n' +
'<script src="../assets/js/phone-field.js"></script>\n' +
'<script src="../assets/js/main.js"></script>\n' +
'</body>\n' +
'</html>\n';
}

/** Homepage project card (project pages use the lighter .pp-project-card in compareSectionMarkup). */
function projectCardMarkup(p, href, extraClass, imgPrefix) {
  return (
    '    <a href="' + href + '" class="card project-card' + (extraClass ? ' ' + extraClass : '') + '" style="text-decoration:none;color:inherit">\n' +
    '      <div class="card__media project-card__media">\n' +
    '        <span class="badge-area">' + escapeHtml(p.areaAr) + '</span>\n' +
    '        ' + mediaSlot(p.slug, 'hero', p.nameEn, p.heroPlaceholder, 'fa-image', imgPrefix, 'position:absolute;inset:0') + '\n' +
    '      </div>\n' +
    '      <div class="card__body project-card__body">\n' +
    '        <span class="project-card__name"><bdi class="en">' + escapeHtml(p.nameEn) + '</bdi></span>\n' +
    '        <div class="card__price">\n' +
    '          <span class="card__price-label">يبدأ من</span>\n' +
    '          <span class="card__price-value">' + fmt(p.startingPrice) + ' جنيه</span>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </a>\n'
  );
}

function homepageCards(merged) {
  var byArea = {};
  merged.forEach(function (p) {
    byArea[p.areaAr] = byArea[p.areaAr] || [];
    byArea[p.areaAr].push(p);
  });
  var out = '';
  Object.keys(byArea).forEach(function (area) {
    out += '  <h3 style="text-align:center;color:var(--navy);opacity:.7;font-weight:700;font-size:16px;margin:0 0 16px;">' + escapeHtml(area) + '</h3>\n';
    out += '  <div class="grid grid--projects" style="margin-bottom:44px">\n';
    byArea[area].forEach(function (p) {
      out += projectCardMarkup(p, '/projects/' + p.slug);
    });
    out += '  </div>\n';
  });
  return out;
}

/** Live checklist of exactly which image files each project still needs —
 * regenerated every build so it always matches the current unit types. */
function imageChecklist(merged) {
  var lines = [
    '# Project photos — drop-in checklist',
    '',
    'Auto-generated by `node tools/build-pages.js` — do not hand-edit, it will',
    'be overwritten. Add files, rerun the build, and the ✅/⬜ marks update and',
    'the real photo replaces the placeholder box on the site automatically.',
    '',
    'Accepted extensions: `.jpg`, `.jpeg`, `.png`, `.webp` (first match wins).',
    '',
  ];
  merged.forEach(function (p) {
    var dir = 'assets/img/projects/' + p.slug + '/';
    lines.push('## ' + p.nameEn + '  (`' + dir + '`)', '');
    var wants = [['hero', 'main exterior / render — used on this page and on the project card everywhere else']];
    for (var i = 1; i <= 6; i++) wants.push(['gallery-' + i, 'gallery photo ' + i]);
    wants.push(['location', 'map or location photo']);
    p.units.forEach(function (u) { wants.push([u.key, u.name + ' unit photo']); });
    wants.forEach(function (w) {
      var name = w[0], desc = w[1];
      var have = !!findImage(p.slug, name);
      lines.push((have ? '- [x] ' : '- [ ] ') + '`' + p.slug + '-' + name + '.jpg`' + (have ? ' ✅' : '') + ' — ' + desc);
    });
    lines.push('');
  });
  return lines.join('\n');
}

// thank-you.html is deliberately excluded — it carries <meta name="robots"
// content="noindex, follow"> so it shouldn't be advertised for indexing.
function sitemapUrls(merged) {
  var today = new Date().toISOString().slice(0, 10);
  var urls = [
    { loc: SITE_ORIGIN + '/', changefreq: 'weekly', priority: '1.0' },
    { loc: SITE_ORIGIN + '/contact', changefreq: 'monthly', priority: '0.6' },
    { loc: SITE_ORIGIN + '/privacy', changefreq: 'yearly', priority: '0.3' },
  ];
  merged.forEach(function (p) {
    urls.push({ loc: SITE_ORIGIN + '/projects/' + p.slug, changefreq: 'weekly', priority: '0.9' });
  });
  urls.forEach(function (u) { u.lastmod = today; });
  return urls;
}

function writeSitemap(merged) {
  var urls = sitemapUrls(merged);
  var body = urls.map(function (u) {
    return (
      '  <url>\n' +
      '    <loc>' + u.loc + '</loc>\n' +
      '    <lastmod>' + u.lastmod + '</lastmod>\n' +
      '    <changefreq>' + u.changefreq + '</changefreq>\n' +
      '    <priority>' + u.priority + '</priority>\n' +
      '  </url>'
    );
  }).join('\n');
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body + '\n' +
    '</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log('wrote sitemap.xml (' + urls.length + ' urls)');
}

function writeRobotsTxt() {
  var txt =
    'User-agent: *\n' +
    'Allow: /\n\n' +
    'Sitemap: ' + SITE_ORIGIN + '/sitemap.xml\n';
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), txt, 'utf8');
  console.log('wrote robots.txt');
}

/** Splices the homepage project cards straight into index.html between two
 * marker comments — no manual copy/paste step once images (or prices) change. */
function updateIndexHtml(merged) {
  var indexPath = path.join(ROOT, 'index.html');
  var html = fs.readFileSync(indexPath, 'utf8');
  var start = '<!-- AUTO:PROJECTS:START -->';
  var end = '<!-- AUTO:PROJECTS:END -->';
  var startIdx = html.indexOf(start);
  var endIdx = html.indexOf(end);
  if (startIdx === -1 || endIdx === -1) {
    console.log('  (skipped index.html — markers ' + start + ' / ' + end + ' not found; paste tools/homepage-cards.snippet.html manually)');
    return;
  }
  var updated = html.slice(0, startIdx + start.length) + '\n' + homepageCards(merged) + '  ' + html.slice(endIdx);
  fs.writeFileSync(indexPath, updated, 'utf8');
  console.log('updated index.html #projects section in place');
}

var merged = projects.map(mergeProject);
// Second pass: needs every project merged first.
merged.forEach(function (p) {
  p.sameArea = sameAreaProjects(p, merged, 2);
  p.sameAreaAll = sameAreaProjects(p, merged, Infinity);
});

// `node tools/build-pages.js --dump [slug ...]` prints the derived data and
// exits without writing anything — for checking numbers against the spec.
var dumpIdx = process.argv.indexOf('--dump');
if (dumpIdx !== -1) {
  var wanted = process.argv.slice(dumpIdx + 1);
  merged.filter(function (p) { return !wanted.length || wanted.indexOf(p.slug) !== -1; }).forEach(function (p) {
    console.log(JSON.stringify({
      slug: p.slug,
      nameAr: p.nameAr,
      availableUnits: p.availableUnits,
      startingPrice: p.startingPrice,
      paymentPlan: p.paymentPlan,
      finishings: p.finishings,
      pricePerSqm: p.pricePerSqm,
      areaRange: p.areaRange,
      lastUpdatedAr: p.lastUpdatedAr,
      galleryImages: p.galleryImages.length,
      sameArea: p.sameArea.map(function (o) { return o.slug; }),
      units: p.units.map(function (u) { return { type: u.name, image: u.image, groups: u.groups }; }),
    }, null, 2));
  });
  process.exit(0);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
merged.forEach(function (p) {
  fs.writeFileSync(path.join(OUT_DIR, p.slug + '.html'), page(p, merged), 'utf8');
  console.log('wrote projects/' + p.slug + '.html' +
    ' — starting ' + fmt(p.startingPrice) + ' EGP' +
    (p.preliminary ? '  (⚠ pricing not yet confirmed by developer)' : ''));
});
fs.writeFileSync(path.join(__dirname, 'homepage-cards.snippet.html'), homepageCards(merged), 'utf8');
console.log('wrote tools/homepage-cards.snippet.html');
updateIndexHtml(merged);
fs.writeFileSync(path.join(IMG_ROOT, 'README.md'), imageChecklist(merged), 'utf8');
console.log('wrote assets/img/projects/README.md (image checklist)');
writeSitemap(merged);
writeRobotsTxt();
injectStaticOgTags('index.html', OG_DEFAULT_IMAGE);
injectStaticOgTags('contact.html', OG_DEFAULT_IMAGE);
injectStaticOgTags('privacy.html', OG_DEFAULT_IMAGE);
