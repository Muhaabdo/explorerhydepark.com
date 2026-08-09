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

const SITE_NAME = 'Explorer Hyde Park';
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'projects');

function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
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

/** Merge a content entry with its pricing.json record into one render-ready project object. */
function mergeProject(p) {
  var pr = pricing.projects[p.pricingKey];
  if (!pr) throw new Error('No pricing.json entry for pricingKey "' + p.pricingKey + '" (' + p.slug + ')');

  var units = pr.units.map(function (u) {
    return {
      key: slugifyType(u.type),
      name: u.type,
      nameAr: u.label,
      area: formatArea(u.areaMin, u.areaMax),
      rooms: formatRooms(u.bedrooms),
      price: u.minPrice,
      count: u.count,
      placeholder: 'صورة ' + u.label,
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
  });
}

function nav() {
  var links = [
    { href: '../index.html', label: 'الرئيسية' },
    { href: '../index.html#projects', label: 'المشاريع' },
    { href: '../index.html#about', label: 'من نحن' },
    { href: '../contact.html', label: 'تواصل معنا' },
  ];
  var desktop = links.map(function (l) {
    return '<a href="' + l.href + '">' + l.label + '</a>';
  }).join('\n        ');
  var mobile = links.map(function (l) {
    return '<a href="' + l.href + '">' + l.label + '</a>';
  }).join('\n      ');

  return (
    '  <nav class="navbar">\n' +
    '    <a href="../index.html" class="navbar__brand">Explorer Hyde Park</a>\n' +
    '    <div class="navbar__links">\n' +
    '        ' + desktop + '\n' +
    '    </div>\n' +
    '    <button class="navbar__toggle" aria-label="فتح القائمة" data-nav-toggle>\n' +
    '      <span></span><span></span><span></span>\n' +
    '    </button>\n' +
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
    '        <a href="../index.html">الرئيسية</a>\n' +
    '        <a href="../index.html#about">من نحن</a>\n' +
    '        <a href="../contact.html">تواصل معنا</a>\n' +
    '        <a href="../privacy.html">سياسة الخصوصية</a>\n' +
    '      </div>\n' +
    '      <div class="footer__col">\n' +
    '        <span class="footer__heading">المشاريع</span>\n' +
    projects.map(function (p) {
      return '        <a href="./' + p.slug + '.html">' + p.nameEn + '</a>\n';
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

function unitsMarkup(p) {
  return p.units.map(function (u) {
    var roomsTag = u.rooms ? '<span class="tag">' + escapeHtml(u.rooms) + '</span>' : '';
    var countTag = (u.count != null) ? '<span class="tag">متاح ' + u.count + '</span>' : '';
    return (
      '        <div class="card">\n' +
      '          <div class="card__media">' + mediaSlot(p.slug, u.key, u.name + ' — ' + p.nameEn, u.placeholder, 'fa-image', '../') + '</div>\n' +
      '          <div class="card__body">\n' +
      '            <h3 class="card__title"><bdi class="en">' + escapeHtml(u.name) + '</bdi></h3>\n' +
      '            <div class="card__tags"><span class="tag">' + escapeHtml(u.area) + '</span>' + roomsTag + countTag + '</div>\n' +
      '            <div class="card__price">\n' +
      '              <span class="card__price-label">يبدأ من</span>\n' +
      '              <span class="card__price-value">' + fmt(u.price) + ' جنيه</span>\n' +
      '            </div>\n' +
      '            <div class="card__ctas">\n' +
      '              <a href="#" class="btn btn-whatsapp btn-sm" data-whatsapp-link data-whatsapp-message="أرغب بمعرفة تفاصيل ' + iso(u.name) + ' في ' + iso(p.nameEn) + '"><i class="fa-brands fa-whatsapp"></i> تفاصيل أكثر</a>\n' +
      '              <a href="#" class="btn btn-blue icon-only" data-phone-link><i class="fa-solid fa-phone"></i></a>\n' +
      '            </div>\n' +
      '          </div>\n' +
      '        </div>'
    );
  }).join('\n');
}

function priceOptionsMarkup(p) {
  return p.units.map(function (u, i) {
    return '            <option value="' + u.key + '" data-price="' + u.price + '"' + (i === 0 ? ' selected' : '') + '>' + iso(escapeHtml(u.name)) + ' — يبدأ من ' + fmt(u.price) + ' جنيه</option>';
  }).join('\n');
}

function amenitiesMarkup(p) {
  return p.amenities.map(function (a) {
    return (
      '        <div class="amenity">\n' +
      '          <div class="amenity__icon"><i class="fa-solid fa-check"></i></div>\n' +
      '          <span class="amenity__label">' + escapeHtml(a) + '</span>\n' +
      '        </div>'
    );
  }).join('\n');
}

function faqsMarkup(p) {
  return p.faqs.map(function (f) {
    return (
      '      <div class="faq-item">\n' +
      '        <button class="faq-item__q">\n' +
      '          <span>' + escapeHtml(f.q) + '</span>\n' +
      '          <span class="faq-item__sign">+</span>\n' +
      '        </button>\n' +
      '        <div class="faq-item__a">' + escapeHtml(f.a) + '</div>\n' +
      '      </div>'
    );
  }).join('\n');
}

function galleryMarkup(p) {
  var items = [1, 2, 3, 4, 5, 6];
  return items.map(function (i) {
    return (
      '        <div class="gallery__item">' +
      mediaSlot(p.slug, 'gallery-' + i, p.nameEn + ' — ' + i, 'صورة ' + i + ' من ' + iso(p.nameEn), 'fa-image', '../') +
      '</div>'
    );
  }).join('\n');
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

function leadFormMarkup(p, successUrl, privacyHref) {
  return (
    '      <form class="form-card" data-lead-form data-project-name="' + escapeHtml(p.nameEn) + '" data-success-url="' + successUrl + '">\n' +
    '        <div class="field field-icon">\n' +
    '          <label>الاسم</label>\n' +
    '          <i class="fa-solid fa-user"></i>\n' +
    '          <input type="text" name="name" placeholder="اكتب اسمك" required>\n' +
    '        </div>\n' +
    '        <div class="field">\n' +
    '          <label>رقم الهاتف</label>\n' +
    '          <div class="form-row">\n' +
    '            ' + phoneFieldMarkup() + '\n' +
    '            <input type="tel" name="phone" class="field-tel" dir="ltr" placeholder="1XX XXX XXXX" required>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="field field-icon">\n' +
    '          <label>البريد الإلكتروني <span class="optional-tag">(اختياري)</span></label>\n' +
    '          <i class="fa-solid fa-envelope"></i>\n' +
    '          <input type="email" name="email" placeholder="example@email.com">\n' +
    '        </div>\n' +
    '        <div class="field">\n' +
    '          <label>رسالتك <span class="optional-tag">(اختياري)</span></label>\n' +
    '          <textarea name="message" placeholder="اكتب استفسارك هنا" rows="3"></textarea>\n' +
    '        </div>\n' +
    '        <button type="submit" class="btn btn-yellow">إرسال الطلب</button>\n' +
    '      </form>\n' +
    '      <p class="form-consent">بإرسال النموذج، إنك موافق على <a href="' + privacyHref + '">سياسة الخصوصية</a>.</p>'
  );
}

function preliminaryNotice(p) {
  if (!p.preliminary) return '';
  return (
    '  <div class="container" style="margin-top:100px">\n' +
    '    <div style="background:#FFF7DE;border:1px solid ' +
    '#F7DB32;color:#5c4a00;border-radius:12px;padding:14px 18px;font-size:14.5px;text-align:center;">\n' +
    '      ⚠ أسعار هذا المشروع من آخر تحديث متاح ولسه محتاجة تأكيد نهائي من المطوّر — تواصل معنا واتساب لأحدث المعلومات.\n' +
    '    </div>\n' +
    '  </div>'
  );
}

function page(p, allMerged) {
  var title = p.nameEn + ' | ' + SITE_NAME + ' — أسعار ومساحات وخطط السداد';
  var description = p.intro.replace(/\s*\*.*$/, '').slice(0, 155);
  var canonical = 'https://www.explorerhydepark.com/projects/' + p.slug + '.html';
  var availableBadge = (p.availableUnits != null)
    ? '\n        <span class="hero__price-label" style="margin-inline-start:8px">· ' + p.availableUnits + ' وحدة متاحة</span>'
    : '';

  return '<!DOCTYPE html>\n' +
'<html lang="ar" dir="rtl">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + escapeHtml(title) + '</title>\n' +
'<meta name="description" content="' + escapeHtml(description) + '">\n' +
'<link rel="canonical" href="' + canonical + '">\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">\n' +
'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">\n' +
'<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons@7/css/flag-icons.min.css">\n' +
'<link rel="stylesheet" href="../assets/css/style.css">\n' +
'</head>\n' +
'<body>\n\n' +
nav() + '\n\n' +
'  <section class="hero">\n' +
'    <div class="hero__bg">' + mediaSlot(p.slug, 'hero', p.nameEn, p.heroPlaceholder, 'fa-image', '../', 'position:absolute;inset:0') + '</div>\n' +
'    <div class="hero__overlay"></div>\n' +
'    <div class="hero__content">\n' +
'      <div class="hero__eyebrow">Explorer Hyde Park</div>\n' +
'      <h1 class="hero__title"><bdi class="en">' + escapeHtml(p.nameEn) + '</bdi></h1>\n' +
'      <div class="hero__location"><span class="dot"></span><span>' + escapeHtml(p.areaAr) + '</span></div>\n' +
'      <div class="hero__price">\n' +
'        <span class="hero__price-label">يبدأ من</span>\n' +
'        <span class="hero__price-value">' + fmt(p.startingPrice) + ' <small>جنيه</small></span>' + availableBadge + '\n' +
'      </div>\n' +
'      <div class="hero__ctas">\n' +
'        <a href="#" class="btn btn-whatsapp" data-whatsapp-link data-whatsapp-message="أرغب بمعرفة تفاصيل ' + iso(p.nameEn) + '"><i class="fa-brands fa-whatsapp"></i> تواصل واتساب لمعرفة كل التفاصيل</a>\n' +
'        <a href="#" class="btn btn-outline" data-phone-link><i class="fa-solid fa-phone"></i> اتصل بنا</a>\n' +
'      </div>\n' +
'    </div>\n' +
'  </section>\n\n' +
preliminaryNotice(p) + '\n\n' +
'  <section class="section" style="max-width:900px;margin:0 auto;text-align:center;">\n' +
'    <h2 class="section-title" style="margin-bottom:18px">نبذة عن المشروع</h2>\n' +
'    <p style="font-size:clamp(17px,2vw,20px);line-height:1.7;margin:0">' + escapeHtml(p.intro) + '</p>\n' +
'  </section>\n\n' +
'  <section class="section">\n' +
'    <h2 class="section-title">الوحدات المتاحة</h2>\n' +
'    <div class="grid grid--units">\n' +
unitsMarkup(p) + '\n' +
'    </div>\n' +
'  </section>\n\n' +
'  <section class="section section--gray" data-calculator>\n' +
'    <h2 class="section-title" style="margin-bottom:8px">احسب قسطك الشهري</h2>\n' +
'    <p class="section-sub">قدّر القسط الشهري بناءً على المقدم ومدة السداد</p>\n' +
'    <div class="calc-card">\n' +
'      <div class="field">\n' +
'        <label>نوع الوحدة</label>\n' +
'        <select data-calc-price>\n' +
priceOptionsMarkup(p) + '\n' +
'        </select>\n' +
'      </div>\n' +
'      <div class="field">\n' +
'        <div class="field-row"><span>المقدم</span><span class="value" data-calc-down-label>' + p.paymentPlan.downPct + '%</span></div>\n' +
'        <input type="range" min="5" max="50" step="5" value="' + p.paymentPlan.downPct + '" data-calc-down>\n' +
'      </div>\n' +
'      <div class="field">\n' +
'        <div class="field-row"><span>مدة التقسيط</span><span class="value" data-calc-years-label>' + p.paymentPlan.years + ' سنوات</span></div>\n' +
'        <input type="range" min="1" max="10" step="1" value="' + p.paymentPlan.years + '" data-calc-years>\n' +
'      </div>\n' +
'      <div class="calc-result">\n' +
'        <span class="calc-result__label">القسط الشهري التقريبي</span>\n' +
'        <span class="calc-result__value"><span data-calc-monthly>0</span> جنيه</span>\n' +
'        <span class="calc-result__note">مقدم <span data-calc-down-amount>0</span> جنيه</span>\n' +
'      </div>\n' +
'      <a href="#" class="btn btn-sky btn-block" data-whatsapp-link data-whatsapp-message="اطلب خطة الأسعار كاملة لمشروع ' + iso(p.nameEn) + '"><i class="fa-brands fa-whatsapp"></i> اطلب خطة الأسعار كاملة</a>\n' +
'    </div>\n' +
'  </section>\n\n' +
'  <section class="section">\n' +
'    <h2 class="section-title" style="margin-bottom:40px">خطة السداد</h2>\n' +
'    <div class="stat-row">\n' +
'      <div class="stat-card"><span class="stat-card__label">المقدم</span><span class="stat-card__value">' + p.paymentPlan.downPct + '%</span></div>\n' +
'      <div class="stat-card"><span class="stat-card__label">مدة التقسيط</span><span class="stat-card__value">' + p.paymentPlan.years + ' <small>سنوات</small></span></div>\n' +
'    </div>\n' +
'  </section>\n\n' +
'  <section class="section section--gray" style="padding-inline:0">\n' +
'    <h2 class="section-title">معرض الصور</h2>\n' +
'    <div class="gallery">\n' +
'      <div class="gallery__track">\n' +
galleryMarkup(p) + '\n' +
'      </div>\n' +
'      <div class="gallery__nav">\n' +
'        <button data-gallery-prev aria-label="السابق">‹</button>\n' +
'        <button data-gallery-next aria-label="التالي">›</button>\n' +
'      </div>\n' +
'    </div>\n' +
'  </section>\n\n' +
'  <section class="section section--gray">\n' +
'    <h2 class="section-title">المميزات والخدمات</h2>\n' +
'    <div class="grid grid--amenities">\n' +
amenitiesMarkup(p) + '\n' +
'    </div>\n' +
'  </section>\n\n' +
'  <section class="section">\n' +
'    <h2 class="section-title">الموقع</h2>\n' +
'    <div class="location-grid">\n' +
'      <div class="location-map">' + mediaSlot(p.slug, 'location', p.areaAr + ' — ' + p.nameEn, 'خريطة / صورة الموقع', 'fa-map-location-dot', '../') + '</div>\n' +
'      <div style="display:flex;flex-direction:column;gap:14px">\n' +
'        <h3 style="font-size:22px">' + escapeHtml(p.areaAr) + '</h3>\n' +
'        <p style="margin:0;font-size:17px;line-height:1.7;opacity:.85">' + escapeHtml(p.locationText) + '</p>\n' +
'        <a href="#" class="btn btn-blue" style="width:fit-content" data-whatsapp-link data-whatsapp-message="اسأل عن موقع ' + iso(p.nameEn) + '">اسأل عن الموقع</a>\n' +
'      </div>\n' +
'    </div>\n' +
'  </section>\n\n' +
'  <section class="section section--gray">\n' +
'    <h2 class="section-title">الأسئلة الشائعة</h2>\n' +
'    <div class="faq-list">\n' +
faqsMarkup(p) + '\n' +
'    </div>\n' +
'  </section>\n\n' +
'  <section class="section section--navy">\n' +
'    <div style="max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:20px">\n' +
'      <h2 class="section-title on-dark">اطلب اتصال بخصوص <bdi class="en">' + escapeHtml(p.nameEn) + '</bdi></h2>\n' +
'      <p style="margin:0;text-align:center;color:#D8D8D8;font-size:16px">اترك بياناتك وسيتواصل معك فريقنا في أقرب وقت</p>\n' +
leadFormMarkup(p, '../thank-you.html', '../privacy.html') + '\n' +
'      <p class="form-note">Explorer Hyde Park منصّة تسويقية ووسيط معتمد لعرض مشاريع هايد بارك، ولسنا المطوّر العقاري.</p>\n' +
'    </div>\n' +
'  </section>\n\n' +
relatedProjectsMarkup(p, allMerged) +
footer() + '\n\n' +
'<script src="../assets/js/country-codes.js"></script>\n' +
'<script src="../assets/js/phone-field.js"></script>\n' +
'<script src="../assets/js/main.js"></script>\n' +
'</body>\n' +
'</html>\n';
}

/** The one project-card partial — used on the homepage grid AND the related-projects
 * carousel on each project page, so both places always show the identical card. */
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
      out += projectCardMarkup(p, 'projects/' + p.slug + '.html');
    });
    out += '  </div>\n';
  });
  return out;
}

/** Auto-advancing "other projects" carousel at the bottom of each project page —
 * same card partial as the homepage, links relative to /projects/ (sibling pages). */
function relatedProjectsMarkup(p, allMerged) {
  var others = allMerged.filter(function (o) { return o.slug !== p.slug; });
  if (!others.length) return '';
  var cards = others.map(function (o) {
    return projectCardMarkup(o, './' + o.slug + '.html', 'related-carousel__card', '../');
  }).join('');
  return (
    '  <section class="section section--gray" style="padding-inline:0">\n' +
    '    <h2 class="section-title">مشاريع تانية ممكن تعجبك</h2>\n' +
    '    <div class="related-carousel" data-auto-carousel>\n' +
    '      <div class="related-carousel__track">\n' +
    cards +
    '      </div>\n' +
    '    </div>\n' +
    '  </section>\n\n'
  );
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

var SITE_ORIGIN = 'https://www.explorerhydepark.com';

// thank-you.html is deliberately excluded — it carries <meta name="robots"
// content="noindex, follow"> so it shouldn't be advertised for indexing.
function sitemapUrls(merged) {
  var today = new Date().toISOString().slice(0, 10);
  var urls = [
    { loc: SITE_ORIGIN + '/', changefreq: 'weekly', priority: '1.0' },
    { loc: SITE_ORIGIN + '/contact.html', changefreq: 'monthly', priority: '0.6' },
    { loc: SITE_ORIGIN + '/privacy.html', changefreq: 'yearly', priority: '0.3' },
  ];
  merged.forEach(function (p) {
    urls.push({ loc: SITE_ORIGIN + '/projects/' + p.slug + '.html', changefreq: 'weekly', priority: '0.9' });
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
    '<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n' +
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

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
var merged = projects.map(mergeProject);
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
