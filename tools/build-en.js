/**
 * English pages (/en/...) — called from the end of build-pages.js with the
 * shared helpers and the merged project data, so prices, units and photos are
 * exactly the ones on the Arabic pages. Only the wording lives here; English
 * project copy (location, about, amenities...) is in projects-data-en.js.
 *
 * Writes:
 *   en/index.html               English home (project cards by area)
 *   en/projects/<slug>.html     one page per project, same sections as Arabic
 *   en/thank-you.html           after the project lead form (noindex)
 *
 * Every link and asset here is root-absolute ("/assets/...") — the pages sit
 * two folders deep and the same markup must work locally and on Hostinger.
 * Each English page and its Arabic twin point at each other with hreflang.
 */
var EN = require('./projects-data-en');
// Finishing values in the developer's report → English page wording.
var FINISHING_EN = { 'Core & Shell': 'Core & Shell', 'Finished': 'fully finished', 'SEMI FINISHED': 'semi-finished' };

module.exports = function buildEnglish(h) {
  var fmt = h.fmt, esc = h.escapeHtml, uniq = h.uniq, findImage = h.findImage;
  var SITE = h.SITE_ORIGIN;
  var all = h.merged.map(withEnglish);
  var bySlug = {};
  all.forEach(function (p) { bySlug[p.slug] = p; });
  all.forEach(function (p) {
    p.sameArea = p.sameArea.map(function (o) { return bySlug[o.slug]; });
    p.sameAreaAll = p.sameAreaAll.map(function (o) { return bySlug[o.slug]; });
  });

  /* ---------------- Data ---------------- */

  function withEnglish(p) {
    var e = EN[p.slug];
    if (!e) throw new Error('No English content in projects-data-en.js for "' + p.slug + '"');
    if ((e.distances || []).length !== (p.distances || []).length) throw new Error('projects-data-en.js: distances for "' + p.slug + '" must match the Arabic list');
    if ((e.phases || []).length !== (p.phases || []).length) throw new Error('projects-data-en.js: phases for "' + p.slug + '" must match the Arabic list');
    return Object.assign({}, p, {
      areaEn: e.areaEn,
      areaDetailEn: e.areaDetailEn,
      seoTitleEn: e.seoTitle,
      metaDescriptionEn: e.metaDescription,
      // Same rule as the Arabic label: from the report's rows when there are any.
      finishingEn: p.finishings && p.finishings.length
        ? p.finishings.map(function (f) { return FINISHING_EN[f] || f; }).join(' or ')
        : (p.finishingLabel ? e.finishingLabelEn : ''),
      locationEn: e.locationTextEn,
      aboutEn: e.aboutEn,
      amenitiesEn: e.amenitiesEn || [],
      phasesEn: (p.phases || []).map(function (ph, i) { return { name: ph.name, note: e.phases[i].note, slug: ph.slug || '' }; }),
      distancesEn: (p.distances || []).map(function (d, i) {
        return { place: e.distances[i].place, minutes: d.minutes, note: e.distances[i].note || '' };
      }),
    });
  }

  // Unit types as they appear in pricing.json ("type"), in English.
  var TYPE_EN = {
    'Apartment': 'Apartments',
    'Duplex': 'Duplex',
    'Townhouse': 'Townhouse',
    'Quad': 'Quad villa',
    'Twin House': 'Twin house',
    'Twin House with Roof': 'Twin house with roof',
    'Standalone': 'Standalone villa',
    'Small Villa': 'Small villa',
    'Beach Medium Villa': 'Medium beach villa',
    'Standard Chalet': 'Standard chalet',
    'Beach Chalet': 'Beach chalet',
    'Sky Villa': 'Sky villa',
    'Garden Villa': 'Garden villa',
    'Office': 'Offices',
    'Clinic': 'Clinics',
  };
  // Family label (hero line, tabs, tables) — variants collapse into one.
  var TYPE_SHORT_EN = {
    'Apartment': 'Apartments',
    'Duplex': 'Duplexes',
    'Townhouse': 'Townhouses',
    'Quad': 'Quads',
    'Twin House': 'Twin houses',
    'Twin House with Roof': 'Twin houses',
    'Standalone': 'Villas',
    'Small Villa': 'Villas',
    'Beach Medium Villa': 'Villas',
    'Standard Chalet': 'Chalets',
    'Beach Chalet': 'Chalets',
    'Sky Villa': 'Sky villas',
    'Garden Villa': 'Garden villas',
    'Office': 'Offices',
    'Clinic': 'Clinics',
  };
  function typeEn(u) { return TYPE_EN[u.name] || u.name; }
  function shortEn(u) { return TYPE_SHORT_EN[u.name] || u.name; }

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function monthYear(isoDate) {
    var m = /^(\d{4})-(\d{2})/.exec(isoDate || '');
    return m ? MONTHS[Number(m[2]) - 1] + ' ' + m[1] : '';
  }
  var lastUpdated = monthYear(h.pricing.meta.lastUpdated);

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function unitsCount(n) { return plural(n, 'unit', 'units'); }
  function years(n) { return plural(n, 'year', 'years'); }
  function bedrooms(n) { return plural(n, 'bedroom', 'bedrooms'); }
  function egp(n) { return 'EGP ' + fmt(n); }

  /** "a, b and c" */
  function joinEn(items) {
    if (items.length <= 1) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  function areaLabel(p) {
    var d = p.areaDetailEn;
    if (!d) return p.areaEn;
    return d.indexOf(p.areaEn) !== -1 ? d : d + ', ' + p.areaEn;
  }

  var isCommercial = h.isCommercial;
  function parentOf(p) { return p.parentSlug ? bySlug[p.parentSlug] || null : null; }
  var COMMERCIAL_GROUP = 'Offices & commercial';

  function shortName(p) { return p.nameEn.replace(/^Hyde Park\s+/, ''); }

  function areaSqm(min, max) {
    var a = Math.round(min), b = Math.round(max != null ? max : min);
    return (a === b ? fmt(a) : fmt(a) + ' – ' + fmt(b)) + ' m²';
  }

  /** One row per apartment bedroom group, one per other unit type. */
  function unitRows(p) {
    var rows = [];
    p.units.forEach(function (u) {
      u.groups.forEach(function (g) {
        var isApt = u.name === 'Apartment' && g.rooms != null;
        rows.push({
          unit: u,
          group: g,
          title: isApt ? bedrooms(g.rooms) : typeEn(u),
          calcName: isApt ? g.rooms + '-bedroom apartment' : typeEn(u),
          interest: isApt ? 'a ' + g.rooms + '-bedroom apartment' : 'a ' + typeEn(u).toLowerCase(),
          rooms: isApt ? g.rooms : null,
          price: g.minPrice,
        });
      });
    });
    return rows;
  }

  function unitTabLabels(p) {
    var shorts = p.units.map(shortEn);
    return p.units.map(function (u, i) {
      return shorts.indexOf(shorts[i]) === shorts.lastIndexOf(shorts[i]) ? shorts[i] : typeEn(u);
    });
  }

  /* ---------------- Areas ---------------- */

  // Same areas as AREAS in build-pages.js (a hub exists only for 2+ projects).
  var AREAS_EN = {
    'new-cairo': {
      name: 'New Cairo',
      blurb: 'Hyde Park’s East Cairo projects are clustered around the 5th and 6th Settlements and the Old Sokhna Road. The oldest is Hyde Park New Cairo, the company’s first project.',
    },
    'october': {
      name: '6th of October',
      blurb: 'Hyde Park’s West Cairo projects sit next to each other in the heart of 6th of October City around Gezira Club, close to the 26th of July Corridor and the Cairo–Alexandria Desert Road.',
    },
  };
  function enAreaPath(slug) { return h.areaUrl(slug) && AREAS_EN[slug] ? '/en/areas/' + slug : ''; }

  /* ---------------- URLs ---------------- */

  function enProjectPath(slug) { return '/en/projects/' + slug; }
  function arProjectPath(slug) { return '/projects/' + slug; }

  function hreflang(arPath, enPath) {
    return (
      '<link rel="alternate" hreflang="ar" href="' + SITE + arPath + '">\n' +
      '<link rel="alternate" hreflang="en" href="' + SITE + enPath + '">\n' +
      '<link rel="alternate" hreflang="x-default" href="' + SITE + arPath + '">\n'
    );
  }

  /* ---------------- Shared chrome ---------------- */

  function gtmHead(ctx) {
    return h.pageContextScript(ctx) +
      '<!-- Google Tag Manager -->\n' +
      '<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':\n' +
      'new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],\n' +
      'j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=\n' +
      '\'https://www.googletagmanager.com/gtm.js?id=\'+i+dl;f.parentNode.insertBefore(j,f);\n' +
      '})(window,document,\'script\',\'dataLayer\',\'GTM-5FD83KJ7\');</script>\n' +
      '<!-- End Google Tag Manager -->\n';
  }

  var GTM_BODY =
    '<!-- Google Tag Manager (noscript) -->\n' +
    '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5FD83KJ7"\n' +
    'height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n' +
    '<!-- End Google Tag Manager (noscript) -->\n\n';

  function headAssets() {
    return (
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n' +
      '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">\n' +
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flag-icons@7/css/flag-icons.min.css">\n' +
      '<link rel="stylesheet" href="' + h.assetUrl('/', 'assets/css/style.css') + '">\n'
    );
  }

  function ogTags(opts) {
    return h.ogTagsMarkup(opts).replace('content="ar_AR">', 'content="en_US">\n<meta property="og:locale:alternate" content="ar_AR">');
  }

  /** overlay: transparent over the hero (project pages). arHref: the Arabic twin. */
  function nav(overlay, arHref) {
    var links = [
      { href: '/en/', label: 'Home' },
      { href: '/en/#projects', label: 'Projects' },
      { href: '/en/#about', label: 'About' },
      { href: '/en/contact', label: 'Contact' },
    ];
    var lang = '<a href="' + arHref + '" class="navbar__lang" lang="ar" hreflang="ar">العربية</a>';
    var row = function (indent) {
      return links.map(function (l) { return '<a href="' + l.href + '">' + l.label + '</a>'; }).join('\n' + indent);
    };
    return (
      '  <nav class="navbar' + (overlay ? ' navbar--overlay' : '') + '">\n' +
      '    <a href="/en/" class="navbar__brand">Explorer Hyde Park</a>\n' +
      '    <div class="navbar__links">\n' +
      '        ' + row('        ') + '\n' +
      '        ' + lang + '\n' +
      '    </div>\n' +
      // Phones: the language switch sits in the bar itself, next to the menu button.
      '    ' + lang.replace('class="navbar__lang"', 'class="navbar__lang navbar__lang--bar"') + '\n' +
      '    <button class="navbar__toggle" aria-label="Open menu" data-nav-toggle>\n' +
      '      <span></span><span></span><span></span>\n' +
      '    </button>\n' +
      (overlay ? '    <a href="#" class="navbar__call" data-phone-link>Call us</a>\n' : '') +
      '  </nav>\n' +
      '  <div class="mobile-menu">\n' +
      '      ' + row('      ') + '\n' +
      '  </div>'
    );
  }

  var GENERAL_WA = 'Hi, I’d like details on Hyde Park projects.';

  function footer() {
    return (
      '  <footer class="footer">\n' +
      '    <div class="footer__grid">\n' +
      '      <div class="footer__col">\n' +
      '        <span class="footer__brand">Explorer Hyde Park</span>\n' +
      '        <p class="footer__desc">A marketing platform dedicated to Hyde Park real estate projects in Egypt.</p>\n' +
      '      </div>\n' +
      '      <div class="footer__col">\n' +
      '        <span class="footer__heading">Quick links</span>\n' +
      '        <a href="/en/">Home</a>\n' +
      '        <a href="/en/#about">About</a>\n' +
      '        <a href="/en/contact">Contact</a>\n' +
      '        <a href="/en/privacy">Privacy policy</a>\n' +
      '      </div>\n' +
      '      <div class="footer__col">\n' +
      '        <span class="footer__heading">Projects</span>\n' +
      all.map(function (p) { return '        <a href="' + enProjectPath(p.slug) + '">' + esc(p.nameEn) + '</a>\n'; }).join('') +
      '      </div>\n' +
      '      <div class="footer__col">\n' +
      '        <span class="footer__heading">Get in touch</span>\n' +
      '        <a href="#" data-whatsapp-link data-whatsapp-message="' + esc(GENERAL_WA) + '">WhatsApp</a>\n' +
      '        <a href="#" data-phone-link>Call us</a>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '    <div class="footer__bottom">\n' +
      '      <p>Explorer Hyde Park &copy; <span data-year></span> — a marketing platform and authorized broker for Hyde Park projects. We are not the developer.</p>\n' +
      '    </div>\n' +
      '  </footer>\n\n' +
      '  <a href="#" class="float-whatsapp" data-whatsapp-link data-whatsapp-message="' + esc(GENERAL_WA) + '" aria-label="Chat on WhatsApp">\n' +
      '    <i class="fa-brands fa-whatsapp"></i>\n' +
      '  </a>'
    );
  }

  function doc(o) {
    return h.bakeContactLinks('<!DOCTYPE html>\n' +
      '<html lang="en" dir="ltr">\n' +
      '<head>\n' +
      gtmHead(o.ctx) +
      '<meta charset="UTF-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(o.title) + '</title>\n' +
      (o.description ? '<meta name="description" content="' + esc(o.description) + '">\n' : '') +
      (o.noindex ? '<meta name="robots" content="noindex, follow">\n' : '') +
      (o.canonical ? '<link rel="canonical" href="' + o.canonical + '">\n' : '') +
      (o.alternates || '') +
      (o.og ? ogTags(o.og) + '\n' : '') +
      headAssets() +
      (o.schema ? o.schema + '\n' : '') +
      '</head>\n' +
      '<body' + (o.bodyClass ? ' class="' + o.bodyClass + '"' : '') + '>\n\n' +
      GTM_BODY +
      o.body +
      footer() + '\n\n' +
      (o.after || '') +
      (o.phoneField ? '<script src="' + h.assetUrl('/', 'assets/js/country-codes.js') + '"></script>\n' +
        '<script src="' + h.assetUrl('/', 'assets/js/phone-field.js') + '"></script>\n' : '') +
      '<script src="' + h.assetUrl('/', 'assets/js/main.js') + '"></script>\n' +
      '</body>\n' +
      '</html>\n');
  }

  /* ---------------- Project page: SEO ---------------- */

  function pricingYear() { return h.pricingYear(); }

  function seoTitle(p) {
    if (p.seoTitleEn) return p.seoTitleEn;
    // ≤ ~60 chars so Google shows it whole: "Hyde Park Central 6th Settlement: 2026 Prices, 5% Down".
    return p.nameEn + ' ' + (p.areaDetailEn || p.areaEn) + ': ' + pricingYear() + ' Prices, ' + p.paymentPlan.downPct + '% Down';
  }

  function seoDescription(p) {
    if (p.metaDescriptionEn) return p.metaDescriptionEn;
    var head = p.nameEn + ' prices in ' + areaLabel(p) + ' start from ' + egp(p.startingPrice) + ' with ' +
      p.paymentPlan.downPct + '% down and installments over up to ' + years(p.paymentPlan.years) + '.';
    var types = uniq(p.units.map(shortEn));
    var tail = function (list) {
      return ' ' + joinEn(list) + (p.availableUnits ? ', ' + unitsCount(p.availableUnits) + ' available' : '') + ' from the developer’s inventory.';
    };
    while (types.length > 1 && (head + tail(types)).length > 160) types.pop();
    var out = head + tail(types);
    return out.length > 160 ? head : out;
  }

  function pageSchema(p, canonical, faqs) {
    var breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: (function () {
        var items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/en/' }];
        var hub = enAreaPath(p.areaSlug);
        if (hub) items.push({ '@type': 'ListItem', position: 2, name: 'Hyde Park projects in ' + AREAS_EN[p.areaSlug].name, item: SITE + hub });
        var parent = parentOf(p);
        if (parent) items.push({ '@type': 'ListItem', position: items.length + 1, name: parent.nameEn, item: SITE + enProjectPath(parent.slug) });
        items.push({ '@type': 'ListItem', position: items.length + 1, name: p.nameEn, item: canonical });
        return items;
      })(),
    };
    var webPage = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: seoTitle(p),
      url: canonical,
      inLanguage: 'en',
      dateModified: h.pricing.meta.lastUpdated,
      about: {
        '@type': 'Place',
        name: p.nameEn,
        alternateName: p.nameAr,
        address: { '@type': 'PostalAddress', addressLocality: p.areaDetailEn || p.areaEn, addressRegion: p.areaEn, addressCountry: 'EG' },
      },
      publisher: {
        '@type': 'RealEstateAgent',
        name: h.SITE_NAME,
        url: SITE + '/en/',
        telephone: h.PHONE_NUMBER,
        areaServed: 'EG',
      },
    };
    return h.faqJsonLd(faqs) + '\n' + h.jsonLd(breadcrumb) + '\n' + h.jsonLd(webPage);
  }

  /* ---------------- Project page: sections ---------------- */

  function heroSrcset(p, img, size) {
    var fs = require('fs'), path = require('path');
    var dir = path.join(h.IMG_ROOT, p.slug, 'responsive');
    if (!fs.existsSync(dir) || !size) return '';
    var re = new RegExp('^' + p.slug + '-hero-(\\d+)\\.webp$', 'i');
    var list = fs.readdirSync(dir).map(function (f) {
      var m = re.exec(f);
      return m ? { w: Number(m[1]), src: '/assets/img/projects/' + p.slug + '/responsive/' + f } : null;
    }).filter(Boolean).sort(function (a, b) { return a.w - b.w; });
    if (!list.length) return '';
    list.push({ w: size.width, src: '/' + img });
    return ' srcset="' + list.map(function (x) { return x.src + ' ' + x.w + 'w'; }).join(', ') + '" sizes="100vw"';
  }

  function heroMarkup(p) {
    var img = findImage(p.slug, 'hero');
    var media;
    if (img) {
      var size = h.imageSize(img);
      media = '<img class="pp-hero__img" src="/' + img + '"' + heroSrcset(p, img, size) + ' alt="' + esc(p.nameEn + ' — ' + areaLabel(p)) + '"' +
        (size ? ' width="' + size.width + '" height="' + size.height + '"' : '') + ' fetchpriority="high" decoding="async">';
    } else {
      media = '<div class="img-slot pp-hero__img"><i class="fa-solid fa-image"></i><span>' + esc(p.nameEn) + '</span></div>';
    }
    var subtitle = [areaLabel(p)].concat(uniq(p.units.map(shortEn))).join(' · ');
    var badge = p.availableUnits ? '        <span class="pp-badge">' + unitsCount(p.availableUnits) + ' available</span>\n' : '';
    var prelim = p.preliminary ? ' <span class="pp-price-card__note">Indicative price</span>' : '';
    return (
      '  <header class="pp-hero">\n' +
      '    <div class="pp-hero__media">\n' +
      '      ' + media + '\n' +
      '      <div class="pp-hero__shade"></div>\n' +
      '      <div class="pp-hero__text">\n' +
      badge +
      '        <h1 class="pp-hero__title">' + esc(p.nameEn) + '</h1>\n' +
      '        <p class="pp-hero__sub">' + esc(subtitle) + '</p>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '    <div class="pp-price-card">\n' +
      '      <p class="pp-price-card__price"><span class="pp-price-card__label">From</span> <span class="pp-price-card__label">EGP</span> <span class="pp-price-card__value">' + fmt(p.startingPrice) + '</span>' + prelim + '</p>\n' +
      '      <div class="pp-price-card__tiles">\n' +
      '        <div class="pp-tile"><span class="pp-tile__label">Down payment</span><span class="pp-tile__value">' + p.paymentPlan.downPct + '%</span></div>\n' +
      '        <div class="pp-tile"><span class="pp-tile__label">Installments</span><span class="pp-tile__value">' + years(p.paymentPlan.years) + '</span></div>\n' +
      '        <a class="pp-tile pp-tile--link" href="#calc"><span class="pp-tile__label">Your installment?</span><span class="pp-tile__value">Calculate →</span></a>\n' +
      '      </div>\n' +
      '      <div class="pp-price-card__ctas">\n' +
      '        <a class="pp-btn pp-btn--green pp-btn--block" href="#units">See units within your budget</a>\n' +
      '        <a href="#" class="pp-btn pp-btn--outline pp-desktop-only" data-whatsapp-link data-whatsapp-message="' + esc('Hi, I’d like details on ' + p.nameEn + '.') + '" data-cta-location="hero"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </header>\n'
    );
  }

  function sectionNav(p) {
    var chips = [['units', 'Units'], ['calc', 'Calculator']];
    if (p.galleryImages.length) chips.push(['gallery', 'Photos']);
    chips.push(['location', 'Location'], ['faq', 'FAQ']);
    return (
      '  <nav class="pp-chips" aria-label="Page sections" data-section-nav>\n' +
      chips.map(function (c) { return '    <a class="pp-chip" href="#' + c[0] + '">' + c[1] + '</a>\n'; }).join('') +
      '  </nav>\n'
    );
  }

  function preliminaryNotice(p) {
    if (!p.preliminary) return '';
    return '  <div class="pp-wrap pp-notice">\n    ⚠ Prices for this project are from the latest available update and still need final confirmation from the developer — message us on WhatsApp for the latest.\n  </div>\n';
  }

  function summaryHtml(p) {
    var parts = p.units.map(function (u) {
      if (u.name !== 'Apartment') return esc(typeEn(u).toLowerCase());
      var r = h.groupsAreaRange(u.groups);
      if (!r) return 'apartments';
      var a = Math.round(r.min), b = Math.round(r.max);
      return 'apartments ' + (a === b ? 'of ' + a + ' m²' : 'from ' + a + ' to ' + b + ' m²');
    });
    var kind = isCommercial(p) ? 'an office and commercial project' : p.areaSlug === 'north-coast' ? 'a coastal project' : 'a residential project';
    var available = p.availableUnits ? 'Currently available: <strong>' + unitsCount(p.availableUnits) + '</strong> — ' : 'Unit types: ';
    var finishing = p.finishingEn ? ', and units are delivered ' + esc(p.finishingEn) : '';
    return (
      esc(p.nameEn) + ' is ' + kind + ' by Hyde Park Developments in ' + esc(areaLabel(p)) + '. ' +
      available + joinEn(parts) + '. ' +
      'Prices start from <strong>' + egp(p.startingPrice) + '</strong> with ' + p.paymentPlan.downPct +
      '% down and installments over up to ' + years(p.paymentPlan.years) + finishing + '.'
    );
  }

  function overview(p) {
    var facts = [['Location', esc(areaLabel(p))]];
    facts.push(['Sizes', areaSqm(p.areaRange.min, p.areaRange.max)]);
    if (p.finishingEn) facts.push(['Finishing', esc(p.finishingEn.charAt(0).toUpperCase() + p.finishingEn.slice(1))]);
    if (p.pricePerSqm) facts.push(['Price per m² (apartments) from', egp(p.pricePerSqm)]);
    facts.push(['Developer', 'Hyde Park Developments']);
    var byline = (lastUpdated ? 'Updated: ' + lastUpdated + ' · ' : '') + 'From the developer’s inventory · By the Explorer Hyde Park team';
    var phases = p.phasesEn.length
      ? '        <h3 class="pp-h3">' + esc(p.nameEn) + ' phases</h3>\n' +
        '        <ul class="pp-phases">\n' +
        p.phasesEn.map(function (ph) {
          var name = ph.slug ? '<a href="' + enProjectPath(ph.slug) + '">' + esc(ph.name) + '</a>' : esc(ph.name);
          return '          <li><h4 class="pp-phases__name">' + name + '</h4>' + (ph.note ? '<p>' + esc(ph.note) + '</p>' : '') + '</li>\n';
        }).join('') +
        '        </ul>\n'
      : '';
    return (
      '  <section class="pp-section" id="overview">\n' +
      '    <div class="pp-wrap pp-overview">\n' +
      '      <div class="pp-overview__text">\n' +
      '        <nav class="pp-breadcrumb" aria-label="Breadcrumb"><ol><li><a href="/en/">Home</a></li>' + (enAreaPath(p.areaSlug) ? '<li><a href="' + enAreaPath(p.areaSlug) + '">Hyde Park projects in ' + esc(AREAS_EN[p.areaSlug].name) + '</a></li>' : '<li><a href="/en/#projects">Hyde Park projects</a></li>') +
        (parentOf(p) ? '<li><a href="' + enProjectPath(parentOf(p).slug) + '">' + esc(parentOf(p).nameEn) + '</a></li>' : '') + '<li aria-current="page">' + esc(p.nameEn) + '</li></ol></nav>\n' +
      '        <h2 class="pp-h2">' + esc(p.nameEn) + ' at a glance</h2>\n' +
      '        <p class="pp-summary">' + summaryHtml(p) + '</p>\n' +
      '        <p class="pp-byline">' + byline + '</p>\n' +
      (p.aboutEn ? '        <h3 class="pp-h3">About ' + esc(p.nameEn) + '</h3>\n        <p class="pp-about">' + esc(p.aboutEn) + '</p>\n' : '') +
      (parentOf(p) ? '        <p class="pp-parent">' + esc(p.nameEn) + ' is part of <a class="pp-link" href="' + enProjectPath(parentOf(p).slug) + '">' + esc(parentOf(p).nameEn) +
        '</a> — see ' + esc(parentOf(p).nameEn) + '’s own prices and units →</p>\n' : '') +
      phases +
      '      </div>\n' +
      '      <dl class="pp-facts">\n' +
      facts.map(function (f) { return '        <div class="pp-fact"><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>\n'; }).join('') +
      '      </dl>\n' +
      '    </div>\n' +
      '  </section>\n'
    );
  }

  function gallery(p) {
    var imgs = p.galleryImages;
    if (!imgs.length) return '';
    var alt = function (n) { return 'Photo ' + n + ' of ' + p.nameEn + ' in ' + areaLabel(p); };
    return (
      '  <section class="pp-section pp-section--gray" id="gallery" data-gallery>\n' +
      '    <div class="pp-wrap">\n' +
      '      <h2 class="pp-h2">Project photos</h2>\n' +
      '      <div class="pp-gallery__body">\n' +
      '        <div class="pp-gallery__main">\n' +
      '          <img src="/' + imgs[0] + '" alt="' + esc(alt(1)) + '" decoding="async" data-gallery-main>\n' +
      '          <span class="pp-gallery__count" data-gallery-count>1 / ' + imgs.length + '</span>\n' +
      '        </div>\n' +
      '        <div class="pp-gallery__thumbs">\n' +
      imgs.map(function (src, i) {
        return '        <button type="button" class="pp-gallery__thumb" data-gallery-thumb data-src="/' + src + '" data-alt="' + esc(alt(i + 1)) + '"' +
          ' aria-label="Photo ' + (i + 1) + '" aria-pressed="' + (i === 0) + '">' +
          '<img src="/' + src + '" alt="' + esc(alt(i + 1)) + '" loading="lazy" decoding="async"></button>\n';
      }).join('') +
      '        </div>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </section>\n'
    );
  }

  function units(p) {
    var labels = unitTabLabels(p);
    var tabs = p.units.map(function (u, i) {
      return '        <button type="button" role="tab" class="pp-tab" id="tab-' + u.key + '" aria-controls="panel-' + u.key + '"' +
        ' aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? '0' : '-1') + '" data-unit-type="' + u.key + '">' + esc(labels[i]) + '</button>\n';
    }).join('');
    var rowsByKey = {};
    unitRows(p).forEach(function (r) { (rowsByKey[r.unit.key] = rowsByKey[r.unit.key] || []).push(r); });
    var fallbackImg = findImage(p.slug, 'hero') || p.galleryImages[0];
    var panels = p.units.map(function (u, i) {
      var media = u.image
        ? '<img class="real-img" src="/' + u.image + '" alt="' + esc(typeEn(u) + ' at ' + p.nameEn) + '" loading="lazy" decoding="async">'
        : fallbackImg
          ? '<img class="real-img" src="/' + fallbackImg + '" alt="' + esc(p.nameEn + ' — ' + typeEn(u)) + '" loading="lazy" decoding="async">'
          : '<div class="img-slot"><i class="fa-solid fa-image"></i><span>' + esc(typeEn(u)) + '</span></div>';
      var chip = u.count === 1 ? '<span class="pp-unit__avail">Last unit</span>'
        : (u.count ? '<span class="pp-unit__avail">' + u.count + ' available</span>' : '');
      var rows = rowsByKey[u.key].map(function (r) {
        var g = r.group;
        var meta = areaSqm(g.areaMin, g.areaMax) + (g.count ? ' · ' + unitsCount(g.count) : '');
        var dp = r.price * p.paymentPlan.downPct / 100;
        var msg = 'Hi, I’m interested in ' + r.interest + ' at ' + p.nameEn + ' — from ' + egp(r.price) + ', ' + p.paymentPlan.downPct + '% down. Please send me the available units.';
        return (
          '            <div class="pp-unit-row">\n' +
          '              <div class="pp-unit-row__head"><h3 class="pp-unit-row__title">' + esc(r.title) + '</h3><span class="pp-unit-row__meta">' + meta + '</span></div>\n' +
          '              <div class="pp-unit-row__body">\n' +
          '                <div class="pp-unit-row__prices">\n' +
          '                  <span>From EGP <span class="pp-unit-row__price">' + fmt(r.price) + '</span></span>\n' +
          '                  <span>' + p.paymentPlan.downPct + '% down: ' + fmt(dp) + '</span>\n' +
          '                </div>\n' +
          '                <a href="#" class="pp-wa-btn" data-whatsapp-link data-whatsapp-message="' + esc(msg) + '"' +
          ' data-cta-location="units" data-unit-type="' + u.key + '" data-rooms="' + (r.rooms || '') + '">' +
          '<i class="fa-brands fa-whatsapp"></i> Send me what’s available</a>\n' +
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
      '        <h2 class="pp-h2">Available units</h2>\n' +
      '        <div class="pp-tabs" role="tablist" aria-label="Unit types" data-unit-tabs>\n' + tabs + '        </div>\n' +
      '      </div>\n' +
      panels +
      '    </div>\n' +
      '  </section>\n'
    );
  }

  // Same wording as the English strings in main.js (initReverseCalc).
  function calcResult(price, monthly, plan) {
    var months = plan.years * 12;
    var dp = Math.max(price * plan.downPct / 100, price - monthly * months);
    var pct = Math.round(dp / price * 100);
    return {
      fits: pct <= 50,
      text: pct <= 50 ? 'Down ' + fmt(dp) + ' (' + pct + '%) · Monthly ' + fmt((price - dp) / months) : 'Needs ' + pct + '% down',
    };
  }

  function calcWhatsapp(p, monthly) {
    return 'Hi, I’m looking for a unit at ' + p.nameEn + ' around EGP ' + fmt(monthly) + ' a month. Please send me suitable units.';
  }

  function calc(p) {
    var presets = h.budgetPresets(p);
    var def = presets[1] != null ? 1 : 0;
    var monthly = presets[def];
    var months = p.paymentPlan.years * 12;
    var chips = presets.map(function (v, i) {
      return '        <button type="button" class="pp-budget" data-budget="' + v + '" aria-pressed="' + (i === def) + '">' + fmt(v / 1000) + 'K</button>\n';
    }).join('') + '        <button type="button" class="pp-budget" data-budget="custom" aria-pressed="false">Other amount</button>\n';
    var rows = unitRows(p).map(function (r) {
      var area = r.group.cheapestArea != null ? r.group.cheapestArea : r.group.areaMin;
      var res = calcResult(r.price, monthly, p.paymentPlan);
      return (
        '        <div class="pp-calc-row" data-price="' + r.price + '">\n' +
        '          <div class="pp-calc-row__text"><span class="pp-calc-row__name">' + esc(r.calcName) + ' <span class="pp-calc-row__meta">· ' + areaSqm(area) + '</span></span>' +
        '<span class="pp-calc-row__detail" data-calc-detail>' + res.text + '</span></div>\n' +
        '          <span class="pp-fit pp-fit--yes" data-calc-fit' + (res.fits ? '' : ' hidden') + '>Fits</span>' +
        '<span class="pp-fit pp-fit--no" data-calc-nofit' + (res.fits ? ' hidden' : '') + '>High down payment</span>\n' +
        '        </div>\n'
      );
    }).join('');
    return (
      '  <section class="pp-section pp-calc-section" id="calc" data-reverse-calc data-down-pct="' + p.paymentPlan.downPct + '" data-months="' + months + '" data-project="' + esc(p.nameEn) + '">\n' +
      '    <div class="pp-wrap pp-calc">\n' +
      '      <div class="pp-calc__inputs">\n' +
      '        <h2 class="pp-h2">How much can you pay per month?</h2>\n' +
      '        <p class="pp-lede">Pick a comfortable monthly installment and we’ll show the down payment each unit needs.</p>\n' +
      '        <div class="pp-budgets">\n' + chips + '        </div>\n' +
      '        <label class="pp-custom" data-calc-custom hidden>Enter the monthly installment that suits you\n' +
      '          <span class="pp-custom__box"><input type="text" inputmode="numeric" autocomplete="off" placeholder="e.g. 85000" data-calc-input><span>EGP / month</span></span>\n' +
      '        </label>\n' +
      '        <p class="pp-note">Approximate, based on the lowest available price and ' + months + ' monthly installments. The final plan depends on the unit and the developer’s policy at booking.</p>\n' +
      '      </div>\n' +
      '      <div class="pp-calc__results">\n' +
      '        <div class="pp-calc-rows">\n' + rows + '        </div>\n' +
      '        <a href="#" class="pp-btn pp-btn--green pp-btn--block pp-calc-cta" data-whatsapp-link data-whatsapp-message="' + esc(calcWhatsapp(p, monthly)) + '" data-cta-location="calc" data-calc-cta>' +
      '<i class="fa-brands fa-whatsapp"></i> <span data-calc-cta-text>Send me units around EGP ' + fmt(monthly) + ' a month</span></a>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </section>\n'
    );
  }

  function location(p) {
    var img = findImage(p.slug, 'location');
    var list = p.distancesEn;
    var anyMinutes = list.some(function (d) { return d.minutes; });
    var body = '        <p class="pp-location__text">' + esc(p.locationEn) + '</p>\n' +
      (list.length
        ? '        <h3 class="pp-h3">Nearby landmarks</h3>\n' +
          '        <ul class="pp-distances">\n' + list.map(function (d) {
            var right = d.minutes ? d.minutes + ' min' : d.note;
            return '          <li><span>' + esc(d.place) + '</span>' + (right ? '<span class="pp-distances__min">' + esc(right) + '</span>' : '') + '</li>\n';
          }).join('') + '        </ul>\n' +
          (anyMinutes ? '        <p class="pp-distances__note">Driving times are approximate and depend on traffic.</p>\n' : '')
        : '');
    var maps = p.mapsUrl ? '        <a class="pp-link" href="' + esc(p.mapsUrl) + '" target="_blank" rel="noopener">Open in Google Maps →</a>\n' : '';
    return (
      '  <section class="pp-section pp-section--gray pp-location-section" id="location">\n' +
      '    <div class="pp-wrap pp-location' + (img ? '' : ' pp-location--no-img') + '">\n' +
      (img ? '      <img class="pp-location__img" src="/' + img + '" alt="' + esc('Location of ' + p.nameEn + ' in ' + areaLabel(p)) + '" loading="lazy" decoding="async">\n' : '') +
      '      <div class="pp-location__body">\n' +
      '        <h2 class="pp-h2">' + esc(p.nameEn) + ' location</h2>\n' +
      body + maps +
      '      </div>\n' +
      '    </div>\n' +
      '  </section>\n'
    );
  }

  function amenities(p) {
    if (!p.amenitiesEn.length) return '';
    return (
      '  <section class="pp-section">\n' +
      '    <div class="pp-wrap">\n' +
      '      <h2 class="pp-h2">Amenities & services</h2>\n' +
      '      <ul class="pp-chipset">\n' +
      p.amenitiesEn.map(function (a) { return '        <li>' + esc(a) + '</li>\n'; }).join('') +
      '      </ul>\n' +
      '    </div>\n' +
      '  </section>\n'
    );
  }

  function trust() {
    var items = [
      ['fa-shield-halved', 'Authorized broker for Hyde Park projects', 'All ' + all.length + ' projects in one place, so you can compare before you decide.'],
      ['fa-tags', 'Prices straight from the developer’s inventory', 'Every price on this page comes from the latest update of units that are actually available.'],
      ['fa-earth-africa', 'Buying from outside Egypt?', 'Full online support from reservation to contract, signed through a power of attorney.'],
      ['fa-circle-check', 'No commission charged to the buyer', ''],
    ];
    return (
      '  <section class="pp-section pp-section--gray">\n' +
      '    <div class="pp-wrap">\n' +
      '      <h2 class="pp-h2">Why buy through us?</h2>\n' +
      '      <ul class="pp-trust">\n' +
      items.map(function (t) {
        return '        <li><i class="fa-solid ' + t[0] + '"></i><div><strong>' + t[1] + '</strong>' + (t[2] ? '<span>' + t[2] + '</span>' : '') + '</div></li>\n';
      }).join('') +
      '      </ul>\n' +
      '    </div>\n' +
      '  </section>\n'
    );
  }

  function brief(o) {
    return o.nameEn + ' starts from ' + egp(o.startingPrice) + ' and offers ' + joinEn(o.units.map(function (u) { return typeEn(u).toLowerCase(); })) +
      (o.availableUnits ? ', with ' + unitsCount(o.availableUnits) + ' currently available' : '');
  }

  function nearestSameArea(p) {
    var list = p.sameAreaAll || [];
    if (!list.length) return null;
    return list.reduce(function (best, o) {
      return Math.abs(o.startingPrice - p.startingPrice) < Math.abs(best.startingPrice - p.startingPrice) ? o : best;
    }, list[0]);
  }

  function faqs(p) {
    var out = [];
    if (h.isCoreShell(p)) {
      out.push({
        q: 'What does “Core & Shell” mean?',
        a: 'Core & Shell means the unit is handed over as a concrete structure with finished facades and no interior finishing, so the buyer finishes it to their own taste.',
      });
    }
    out.push({
      q: 'If I pay a bigger down payment, will the installment go down?',
      a: 'Yes. The monthly installment is calculated on the balance after the down payment, so a bigger down payment means a smaller installment. At ' + p.nameEn +
        ' the down payment starts from ' + p.paymentPlan.downPct + '% with installments over up to ' + years(p.paymentPlan.years) +
        ' — try it in the “How much can you pay per month?” calculator on this page.',
    });
    var other = nearestSameArea(p);
    if (other) {
      out.push({ q: 'What’s the difference between ' + p.nameEn + ' and ' + other.nameEn + '?', a: brief(p) + '. ' + brief(other) + '.' });
    }
    out.push({
      q: 'Can I buy while living outside Egypt?',
      a: 'Yes. Our team follows up with you online from reservation to contract, and the contract can be signed through a power of attorney.',
    });
    var cheapest = p.units.reduce(function (min, u) { return u.price < min.price ? u : min; }, p.units[0]);
    out.push({
      q: 'How much do units at ' + p.nameEn + ' cost?',
      a: 'Prices start from ' + egp(p.startingPrice) + ' (' + typeEn(cheapest).toLowerCase() + ') and vary by unit type and size.' +
        (p.preliminary ? ' Prices are from the latest available update and may change — message us on WhatsApp to confirm.' : ''),
    });
    out.push({
      q: 'What payment plan is available?',
      a: 'A down payment from ' + p.paymentPlan.downPct + '% of the unit price, with the balance in installments over up to ' + years(p.paymentPlan.years) + '.',
    });
    out.push({ q: 'Where is ' + p.nameEn + ' located?', a: p.locationEn });
    out.push({
      q: 'What unit types are available?',
      a: p.units.map(function (u) {
        var r = h.groupsAreaRange(u.groups) || { min: u.groups[0].areaMin, max: u.groups[0].areaMax };
        var rooms = u.name === 'Apartment' ? u.groups.filter(function (g) { return g.rooms != null; }).map(function (g) { return g.rooms; }) : [];
        return typeEn(u) + ' (' + areaSqm(r.min, r.max) + (rooms.length ? ', ' + rooms.join(' / ') + ' bedrooms' : '') + ')';
      }).join(', ') + '.',
    });
    out.push({
      q: 'Is Explorer Hyde Park the developer?',
      a: 'No. We are a marketing platform and authorized broker for Hyde Park projects, not the real estate developer.',
    });
    return out;
  }

  function faqSection(list) {
    return (
      '  <section class="pp-section" id="faq">\n' +
      '    <div class="pp-wrap">\n' +
      '      <h2 class="pp-h2">Questions before you decide</h2>\n' +
      '      <div class="pp-faq">\n' +
      list.map(function (f, i) {
        return '        <details class="pp-faq__item"' + (i === 0 ? ' open' : '') + '>\n' +
          '          <summary>' + esc(f.q) + '</summary>\n' +
          '          <p>' + esc(f.a) + '</p>\n' +
          '        </details>\n';
      }).join('') +
      '      </div>\n' +
      '    </div>\n' +
      '  </section>\n'
    );
  }

  function optionGroup(name, options, legend) {
    return (
      '          <fieldset class="pp-q">\n' +
      '            <legend>' + legend + '</legend>\n' +
      '            <div class="pp-options">\n' +
      options.map(function (o) {
        return '              <label class="pp-option"><input type="radio" name="' + name + '" value="' + esc(o) + '"><span>' + esc(o) + '</span></label>\n';
      }).join('') +
      '            </div>\n' +
      '          </fieldset>\n'
    );
  }

  function budgetRanges(p) {
    var base = h.budgetPresets(p)[1];
    var a = base, b = h.roundBudget(base * 1.7), c = h.roundBudget(base * 3.5);
    var k = function (v) { return fmt(v / 1000) + 'K'; };
    return ['Under ' + k(a), k(a) + ' – ' + k(b), k(b) + ' – ' + k(c), 'Over ' + k(c)];
  }

  function phoneField() {
    return (
      '<div class="phone-field" data-phone-field data-default="EG">\n' +
      '            <button type="button" class="phone-field__toggle" aria-haspopup="listbox" aria-expanded="false">\n' +
      '              <span class="flag"></span><span class="dial"></span><i class="fa-solid fa-chevron-down"></i>\n' +
      '            </button>\n' +
      '            <input type="hidden" name="country_code" value="+20">\n' +
      '            <div class="phone-field__panel" hidden>\n' +
      '              <div class="phone-field__search-wrap"><input type="text" class="phone-field__search" placeholder="Search country or code"></div>\n' +
      '              <div class="phone-field__list" role="listbox"></div>\n' +
      '            </div>\n' +
      '          </div>'
    );
  }

  function lead(p) {
    var unitOptions = p.units.map(typeEn).concat(['Not sure yet']);
    var note = h.onlyCoreShell(p)
      ? '          <p class="pp-lead__note" data-immediate-note hidden>' + esc(p.nameEn) + ' units are delivered Core & Shell, so we’ll also suggest ready or near-delivery units in other Hyde Park projects.</p>\n'
      : '';
    return (
      '  <section class="pp-section pp-lead-section" id="lead">\n' +
      '    <div class="pp-wrap pp-lead-wrap">\n' +
      '      <h2 class="pp-h2 pp-h2--on-dark">Get matching unit recommendations</h2>\n' +
      '      <form class="pp-lead" data-lead-form data-multistep data-project-name="' + esc(p.nameEn) + '" data-success-url="/en/thank-you">\n' +
      '        <div class="pp-progress" aria-hidden="true"><span class="is-done"></span><span></span><span></span></div>\n' +
      '        <p class="pp-lead__step-label" data-step-label>Step 1 of 3</p>\n' +
      '        <div class="pp-step" data-step="1">\n' +
      optionGroup('purpose', isCommercial(p) ? ['Office for my company', 'Investment & rental', 'Living abroad'] : ['Move in now', 'Move in later', 'Investment', 'Living abroad'], 'What are you buying for?') +
      note +
      optionGroup('budget_range', budgetRanges(p), 'Comfortable monthly installment (EGP)') +
      '          <div class="pp-lead__nav"><button type="button" class="pp-btn pp-btn--green" data-step-next>Next</button></div>\n' +
      '        </div>\n' +
      '        <div class="pp-step" data-step="2">\n' +
      optionGroup('unit_type', unitOptions, 'Unit type') +
      optionGroup('timing', ['Within a month', 'Within 3 months', 'Just exploring'], 'When are you planning to buy?') +
      '          <div class="pp-lead__nav"><button type="button" class="pp-btn pp-btn--ghost" data-step-back>Back</button><button type="button" class="pp-btn pp-btn--green" data-step-next>Next</button></div>\n' +
      '        </div>\n' +
      '        <div class="pp-step" data-step="3">\n' +
      '          <div class="field">\n' +
      '            <label for="lead-name">Name</label>\n' +
      '            <input type="text" id="lead-name" name="name" placeholder="Your name" autocomplete="name" required>\n' +
      '          </div>\n' +
      '          <div class="field">\n' +
      '            <label for="lead-phone">Mobile number</label>\n' +
      '            <div class="form-row">\n' +
      '              ' + phoneField() + '\n' +
      '              <input type="tel" id="lead-phone" name="phone" class="field-tel" dir="ltr" placeholder="1XX XXX XXXX" autocomplete="tel-national" required>\n' +
      '            </div>\n' +
      '          </div>\n' +
      '          <input type="text" name="website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">\n' +
      '          <div class="pp-lead__nav"><button type="button" class="pp-btn pp-btn--ghost" data-step-back>Back</button><button type="submit" class="pp-btn pp-btn--green">Send request</button></div>\n' +
      '        </div>\n' +
      '        <p class="pp-lead__error" data-step-error hidden>Please answer every question to continue.</p>\n' +
      '      </form>\n' +
      '      <p class="form-consent">By submitting, you agree to our <a href="/en/privacy">privacy policy</a>.</p>\n' +
      '    </div>\n' +
      '  </section>\n'
    );
  }

  function shortMillions(n) { return (Math.round(n / 1e4) / 100).toString() + 'M'; }

  function projectCardSmall(o) {
    var img = findImage(o.slug, 'hero');
    var media = img
      ? '<img src="/' + img + '" alt="' + esc(o.nameEn) + '" loading="lazy" decoding="async">'
      : '<div class="img-slot"><i class="fa-solid fa-image"></i><span>' + esc(o.nameEn) + '</span></div>';
    return (
      '        <a class="pp-project-card" href="' + enProjectPath(o.slug) + '">\n' +
      '          <div class="pp-project-card__media">' + media + '</div>\n' +
      '          <div class="pp-project-card__body"><span class="pp-project-card__area">' + esc(o.areaEn) + '</span>' +
      '<span class="pp-project-card__name">' + esc(o.nameEn) + '</span>' +
      '<span>From EGP <span class="pp-project-card__price">' + fmt(o.startingPrice) + '</span></span></div>\n' +
      '        </a>\n'
    );
  }

  function compare(p) {
    var others = all.filter(function (o) { return o.slug !== p.slug; });
    var table = '';
    if (p.sameArea.length) {
      var cols = [p].concat(p.sameArea);
      var cell = function (o, html) { return '<td' + (o === p ? ' class="is-current"' : '') + '>' + html + '</td>'; };
      table =
        '      <h2 class="pp-h2">Compare with Hyde Park projects in ' + esc(p.areaEn) + '</h2>\n' +
        '      <div class="pp-compare">\n' +
        '        <table>\n' +
        '          <thead><tr><th scope="col"><span class="visually-hidden">Item</span></th>' + cols.map(function (o) {
          var label = '<span class="pp-mobile-only">' + esc(shortName(o)) + '</span><span class="pp-desktop-only">' + esc(o.nameEn) + '</span>';
          return '<th scope="col"' + (o === p ? ' class="is-current"' : '') + '>' + (o === p ? label : '<a href="' + enProjectPath(o.slug) + '">' + label + '</a>') + '</th>';
        }).join('') + '</tr></thead>\n' +
        '          <tbody>\n' +
        '            <tr><th scope="row">From (EGP)</th>' + cols.map(function (o) {
          return cell(o, '<span class="pp-mobile-only">' + shortMillions(o.startingPrice) + '</span><span class="pp-desktop-only">' + fmt(o.startingPrice) + '</span>');
        }).join('') + '</tr>\n' +
        '            <tr><th scope="row">Types</th>' + cols.map(function (o) { return cell(o, esc(uniq(o.units.map(shortEn)).join(' · '))); }).join('') + '</tr>\n' +
        '            <tr><th scope="row">Available</th>' + cols.map(function (o) { return cell(o, o.availableUnits ? String(o.availableUnits) : '—'); }).join('') + '</tr>\n' +
        '          </tbody>\n' +
        '        </table>\n' +
        '      </div>\n' +
        (enAreaPath(p.areaSlug) ? '      <p class="pp-area-link"><a class="pp-link" href="' + enAreaPath(p.areaSlug) + '">All Hyde Park projects in ' + esc(AREAS_EN[p.areaSlug].name) + ' and the full comparison →</a></p>\n' : '');
    }
    return (
      '  <section class="pp-section pp-compare-section" id="other-projects">\n' +
      '    <div class="pp-wrap">\n' +
      table +
      '      <h2 class="pp-h2' + (table ? ' pp-h2--spaced' : '') + '">Other projects you may like</h2>\n' +
      '      <div class="pp-projects" data-projects-slider aria-label="Other projects" tabindex="0">\n' + others.map(projectCardSmall).join('') + '      </div>\n' +
      '    </div>\n' +
      '  </section>\n'
    );
  }

  function stickyBar(p) {
    return (
      '  <div class="pp-sticky-bar">\n' +
      '    <a href="#" class="pp-sticky-bar__btn pp-sticky-bar__btn--wa" data-whatsapp-link data-whatsapp-message="' + esc('Hi, I’d like details on ' + p.nameEn + '.') + '" data-cta-location="sticky"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>\n' +
      '    <a href="#" class="pp-sticky-bar__btn pp-sticky-bar__btn--call" data-phone-link>Call</a>\n' +
      '    <a href="#units" class="pp-sticky-bar__btn pp-sticky-bar__btn--units">Units</a>\n' +
      '  </div>\n'
    );
  }

  function projectPage(p) {
    var canonical = SITE + enProjectPath(p.slug);
    var title = seoTitle(p), description = seoDescription(p);
    var list = faqs(p);
    return doc({
      ctx: { page_type: 'project', project_name: p.nameEn, area: p.areaSlug },
      title: title,
      description: description,
      canonical: canonical,
      alternates: hreflang(arProjectPath(p.slug), enProjectPath(p.slug)),
      og: { title: title, description: description, url: canonical, image: h.ogImageUrl(p.slug) },
      schema: pageSchema(p, canonical, list),
      bodyClass: 'pp-page',
      phoneField: true,
      body:
        nav(true, arProjectPath(p.slug)) + '\n\n' +
        heroMarkup(p) + '\n' +
        sectionNav(p) + '\n' +
        preliminaryNotice(p) +
        overview(p) + '\n' +
        gallery(p) + '\n' +
        units(p) + '\n' +
        calc(p) + '\n' +
        location(p) + '\n' +
        '  <div class="pp-pair pp-pair--amenities">\n' + amenities(p) + trust() + '  </div>\n\n' +
        '  <div class="pp-pair pp-pair--faq">\n' + faqSection(list) + lead(p) + '  </div>\n\n' +
        compare(p) + '\n',
      after: stickyBar(p) + '\n',
    });
  }

  /* ---------------- Home ---------------- */

  function homeCard(p) {
    return (
      '    <a href="' + enProjectPath(p.slug) + '" class="card project-card" style="text-decoration:none;color:inherit">\n' +
      '      <div class="card__media project-card__media">\n' +
      '        <span class="badge-area">' + esc(p.areaEn) + '</span>\n' +
      '        ' + h.mediaSlot(p.slug, 'hero', p.nameEn, p.nameEn, 'fa-image', '/', 'position:absolute;inset:0') + '\n' +
      '      </div>\n' +
      '      <div class="card__body project-card__body">\n' +
      '        <span class="project-card__name">' + esc(p.nameEn) + '</span>\n' +
      '        <div class="card__price">\n' +
      '          <span class="card__price-label">From</span>\n' +
      '          <span class="card__price-value">' + egp(p.startingPrice) + '</span>\n' +
      '        </div>\n' +
      '      </div>\n' +
      '    </a>\n'
    );
  }

  function homePage() {
    var areas = [];
    var byArea = {};
    all.forEach(function (p) {
      var key = isCommercial(p) ? COMMERCIAL_GROUP : p.areaEn;
      if (!byArea[key]) { byArea[key] = []; areas.push(key); }
      byArea[key].push(p);
    });
    var cheapest = all.reduce(function (m, o) { return o.startingPrice < m.startingPrice ? o : m; }, all[0]);
    var minDown = Math.min.apply(null, all.map(function (o) { return o.paymentPlan.downPct; }));
    var title = 'Hyde Park Projects in Egypt: ' + pricingYear() + ' Prices & Payment Plans';
    var description = 'Compare all ' + all.length + ' Hyde Park projects in New Cairo, 6th of October and the North Coast: prices from ' + egp(cheapest.startingPrice) +
      ', down payments from ' + minDown + '% and unit sizes.';
    var canonical = SITE + '/en/';
    var waMsg = GENERAL_WA;
    var schema = h.jsonLd({
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      name: h.SITE_NAME,
      url: canonical,
      telephone: h.PHONE_NUMBER,
      areaServed: 'EG',
      description: 'Marketing platform and authorized broker for Hyde Park Developments projects in Egypt. Not the developer.',
    });
    var projectsHtml = areas.map(function (area) {
      var hub = area === COMMERCIAL_GROUP ? '' : enAreaPath(byArea[area][0].areaSlug);
      return '  <h3 class="en-area-heading">' + (hub ? '<a href="' + hub + '">Hyde Park projects in ' + esc(area) + ' →</a>' : esc(area)) + '</h3>\n' +
        '  <div class="grid grid--projects" style="margin-bottom:44px">\n' + byArea[area].map(homeCard).join('') + '  </div>\n';
    }).join('');
    return doc({
      ctx: { page_type: 'home', project_name: '', area: '' },
      title: title,
      description: description,
      canonical: canonical,
      alternates: hreflang('/', '/en/'),
      og: { title: title, description: description, url: canonical, image: h.OG_DEFAULT_IMAGE },
      schema: schema,
      body:
        nav(false, '/') + '\n\n' +
        '  <section class="hero">\n' +
        '    <div class="hero__bg"><img class="real-img" style="position:absolute;inset:0" src="/assets/img/site/home-hero.jpg" alt="Hyde Park projects in Egypt" fetchpriority="high" decoding="async"></div>\n' +
        '    <div class="hero__overlay"></div>\n' +
        '    <div class="hero__content">\n' +
        '      <div class="hero__eyebrow">Explorer Hyde Park</div>\n' +
        '      <h1 class="hero__title">Every Hyde Park project in Egypt, in one place</h1>\n' +
        '      <div class="hero__location"><span class="dot"></span><span>New Cairo · 6th of October · North Coast</span></div>\n' +
        '      <p class="en-hero-lede">Live prices, unit sizes and payment plans for all ' + all.length + ' Hyde Park projects — and a team that answers on WhatsApp within minutes.</p>\n' +
        '      <div class="hero__ctas">\n' +
        '        <a href="#" class="btn btn-whatsapp" data-whatsapp-link data-whatsapp-message="' + esc(waMsg) + '"><i class="fa-brands fa-whatsapp"></i> Chat on WhatsApp</a>\n' +
        '        <a href="#projects" class="btn btn-outline"><i class="fa-solid fa-building"></i> Browse projects</a>\n' +
        '      </div>\n' +
        '    </div>\n' +
        '  </section>\n\n' +
        '  <section class="section section--tight">\n' +
        '    <div class="grid en-stats">\n' +
        '      <div class="center"><div class="amenity__icon"><i class="fa-solid fa-city"></i></div><strong>' + all.length + '</strong><span>Hyde Park projects</span></div>\n' +
        '      <div class="center"><div class="amenity__icon"><i class="fa-solid fa-map-location-dot"></i></div><strong>' + areas.filter(function (x) { return x !== COMMERCIAL_GROUP; }).length + '</strong><span>Areas: New Cairo, 6th of October, North Coast</span></div>\n' +
        '      <div class="center"><div class="amenity__icon"><i class="fa-solid fa-percent"></i></div><strong>' + minDown + '%</strong><span>Lowest down payment</span></div>\n' +
        '    </div>\n' +
        '  </section>\n\n' +
        '  <section class="section section--gray" id="projects">\n' +
        '    <h2 class="section-title">Hyde Park projects</h2>\n' +
        '    <p class="section-sub">Prices from the developer’s inventory, updated ' + esc(lastUpdated) + '.</p>\n' +
        projectsHtml +
        '  </section>\n\n' +
        '  <section class="section en-about" id="about">\n' +
        '    <h2 class="section-title">About us</h2>\n' +
        '    <p class="en-about__lede">Explorer Hyde Park is a marketing platform and authorized broker for Hyde Park Developments projects in New Cairo, 6th of October and the North Coast. We put every price, size and payment plan in one place, so you don’t have to go from office to office.</p>\n' +
        '    <p class="en-about__note">Explorer Hyde Park is not the developer of any of the projects listed and does not own or manage them. We present their information and connect you with the right sales team.</p>\n' +
        '  </section>\n\n' +
        '  <section class="section section--gray">\n' +
        '    <h2 class="section-title">Why buy through us?</h2>\n' +
        '    <div class="grid grid--amenities">\n' +
        [['fa-layer-group', 'All projects in one place'], ['fa-calculator', 'Instant installment calculator'], ['fa-earth-africa', 'Buy from abroad, fully online'], ['fa-circle-check', 'No commission for the buyer']].map(function (a) {
          return '      <div class="amenity"><div class="amenity__icon"><i class="fa-solid ' + a[0] + '"></i></div><span class="amenity__label">' + a[1] + '</span></div>\n';
        }).join('') +
        '    </div>\n' +
        '  </section>\n\n' +
        '  <section class="section section--navy" id="contact">\n' +
        '    <div class="en-cta">\n' +
        '      <h2 class="section-title on-dark">Need quick advice?</h2>\n' +
        '      <p>Tell us your budget and the monthly installment that suits you, and we’ll send the available units that match.</p>\n' +
        '      <div class="en-cta__btns">\n' +
        '        <a href="#" class="btn btn-whatsapp" data-whatsapp-link data-whatsapp-message="' + esc(waMsg) + '" data-cta-location="home"><i class="fa-brands fa-whatsapp"></i> WhatsApp us</a>\n' +
        '        <a href="/en/contact" class="btn btn-yellow"><i class="fa-solid fa-paper-plane"></i> Request a call</a>\n' +
        '      </div>\n' +
        '    </div>\n' +
        '  </section>\n\n',
    });
  }

  /* ---------------- Thank-you ---------------- */

  function thankYouPage() {
    return doc({
      ctx: { page_type: 'thank_you', project_name: '', area: '' },
      title: 'Request received | Explorer Hyde Park',
      noindex: true,
      body:
        nav(false, '/thank-you') + '\n\n' +
        '  <section class="section en-thanks">\n' +
        '    <div class="en-thanks__inner">\n' +
        '      <div class="en-thanks__icon"><i class="fa-solid fa-check"></i></div>\n' +
        '      <h1 class="section-title" style="margin:0">We’ve received your request</h1>\n' +
        '      <p>Thank you for contacting Explorer Hyde Park. Our team will review your details and get back to you shortly. For a faster reply, continue the conversation with us on WhatsApp.</p>\n' +
        '      <div class="en-cta__btns">\n' +
        '        <a href="#" class="btn btn-whatsapp" data-whatsapp-link data-whatsapp-message="Hi, I’d like to follow up on my request about Hyde Park projects."><i class="fa-brands fa-whatsapp"></i> Continue on WhatsApp</a>\n' +
        '        <a href="/en/" class="btn btn-blue" data-return-link><i class="fa-solid fa-house"></i> <span data-return-label>Back to home</span></a>\n' +
        '      </div>\n' +
        '      <a href="/en/#projects" class="en-thanks__link">Or browse all Hyde Park projects →</a>\n' +
        '    </div>\n' +
        '  </section>\n\n',
    });
  }

  /* ---------------- Area hub pages ---------------- */

  function areaPage(slug) {
    var a = AREAS_EN[slug];
    var list = all.filter(function (o) { return o.areaSlug === slug && !isCommercial(o); }).sort(function (x, y) { return x.startingPrice - y.startingPrice; });
    var minBy = function (l, fn) { return l.reduce(function (b, o) { return fn(o) < fn(b) ? o : b; }, l[0]); };
    var cheapest = minBy(list, function (o) { return o.startingPrice; });
    var minDown = Math.min.apply(null, list.map(function (o) { return o.paymentPlan.downPct; }));
    var maxYears = Math.max.apply(null, list.map(function (o) { return o.paymentPlan.years; }));
    var minDownList = list.filter(function (o) { return o.paymentPlan.downPct === minDown; });
    var maxYearsList = list.filter(function (o) { return o.paymentPlan.years === maxYears; });
    var withApts = list.filter(function (o) { return o.units.some(function (u) { return u.name === 'Apartment'; }); });
    var villasOnly = list.filter(function (o) { return !o.units.some(function (u) { return u.name === 'Apartment'; }); });
    var withCount = list.filter(function (o) { return o.availableUnits; });
    var most = withCount.length ? minBy(withCount, function (o) { return -o.availableUnits; }) : null;
    var names = function (l) { return joinEn(l.map(function (o) { return o.nameEn; })); };
    var cheapestType = typeEn(cheapest.units.filter(function (u) { return u.price === cheapest.startingPrice; })[0] || cheapest.units[0]).toLowerCase();

    var path = '/en/areas/' + slug, canonical = SITE + path;
    var title = 'Hyde Park Projects in ' + a.name + ': ' + pricingYear() + ' Prices Compared';
    var description = list.length + ' Hyde Park projects in ' + a.name + ': ' + names(list) + '. Prices from ' + egp(cheapest.startingPrice) +
      ', ' + minDown + '% down and installments up to ' + years(maxYears) + '.';
    if (description.length > 160) description = list.length + ' Hyde Park projects in ' + a.name + ', prices from ' + egp(cheapest.startingPrice) +
      ', ' + minDown + '% down and up to ' + years(maxYears) + '. Compare sizes, types and availability.';

    var faqList = [
      { q: 'How many Hyde Park projects are there in ' + a.name + '?', a: 'Hyde Park has ' + list.length + ' projects in ' + a.name + ': ' + names(list) + '.' },
      { q: 'What is the most affordable Hyde Park project in ' + a.name + '?', a: cheapest.nameEn + ', with prices from ' + egp(cheapest.startingPrice) + ' (' + cheapestType + ').' },
      { q: 'What are the lowest down payment and longest installment plan in ' + a.name + '?',
        a: 'The lowest down payment is ' + minDown + '% at ' + names(minDownList) + ', and the longest plan is ' + years(maxYears) + ' at ' + names(maxYearsList) + '.' },
    ];
    if (withApts.length && villasOnly.length) {
      faqList.push({ q: 'Which projects have apartments, and which are villas only?',
        a: 'Apartments are available at ' + names(withApts) + ', while ' + names(villasOnly) + (villasOnly.length > 1 ? ' offer' : ' offers') + ' townhouses and villas.' });
    }
    faqList.push({ q: 'Is Explorer Hyde Park the developer?', a: 'No. We are a marketing platform and authorized broker for Hyde Park projects, not the real estate developer.' });

    var picks = [
      ['Lowest starting price', cheapest.nameEn + ' — from ' + egp(cheapest.startingPrice)],
      ['Lowest down payment', names(minDownList) + ' — ' + minDown + '%'],
      ['Longest installment plan', names(maxYearsList) + ' — ' + years(maxYears)],
    ];
    if (most) picks.push(['Most units available', most.nameEn + ' — ' + unitsCount(most.availableUnits)]);
    if (withApts.length) picks.push(['Has apartments', names(withApts)]);
    if (villasOnly.length) picks.push(['Townhouses & villas only', names(villasOnly)]);

    var rows = list.map(function (o) {
      return '            <tr>' +
        '<th scope="row"><a href="' + enProjectPath(o.slug) + '">' + esc(o.nameEn) + '</a><span class="pp-area-table__sub">' + esc(areaLabel(o)) + '</span></th>' +
        '<td>' + fmt(o.startingPrice) + '</td>' +
        '<td>' + o.paymentPlan.downPct + '%</td>' +
        '<td>' + years(o.paymentPlan.years) + '</td>' +
        '<td>' + esc(uniq(o.units.map(shortEn)).join(' · ')) + '</td>' +
        '<td>' + (o.availableUnits ? o.availableUnits : '—') + '</td>' +
        '</tr>\n';
    }).join('');

    var schema = [
      h.jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/en/' },
        { '@type': 'ListItem', position: 2, name: 'Hyde Park projects in ' + a.name, item: canonical },
      ] }),
      h.jsonLd({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Hyde Park projects in ' + a.name,
        itemListElement: list.map(function (o, i) { return { '@type': 'ListItem', position: i + 1, name: o.nameEn, url: SITE + enProjectPath(o.slug) }; }) }),
      h.faqJsonLd(faqList),
    ].join('\n');

    return doc({
      ctx: { page_type: 'area', project_name: '', area: slug },
      title: title,
      description: description,
      canonical: canonical,
      alternates: hreflang('/areas/' + slug, path),
      og: { title: title, description: description, url: canonical, image: h.ogImageUrl(cheapest.slug) },
      schema: schema,
      bodyClass: 'pp-page pp-area-page',
      body:
        nav(false, '/areas/' + slug) + '\n\n' +
        '  <header class="pp-section pp-area-hero">\n' +
        '    <div class="pp-wrap">\n' +
        '      <nav class="pp-breadcrumb" aria-label="Breadcrumb"><ol><li><a href="/en/">Home</a></li><li aria-current="page">Hyde Park projects in ' + esc(a.name) + '</li></ol></nav>\n' +
        '      <h1 class="pp-area-title">Hyde Park projects in ' + esc(a.name) + '</h1>\n' +
        '      <p class="pp-summary">Hyde Park has <strong>' + list.length + ' projects</strong> in ' + esc(a.name) + ': ' + esc(names(list)) + '. ' +
        'Prices start from <strong>' + egp(cheapest.startingPrice) + '</strong> at ' + esc(cheapest.nameEn) + ', with down payments from ' + minDown +
        '% and installments up to ' + years(maxYears) + '. ' + esc(a.blurb) + '</p>\n' +
        '      <p class="pp-byline">' + (lastUpdated ? 'Prices updated: ' + lastUpdated + ' · ' : '') + 'From the developer’s inventory · By the Explorer Hyde Park team</p>\n' +
        '    </div>\n' +
        '  </header>\n\n' +
        '  <section class="pp-section pp-section--gray">\n' +
        '    <div class="pp-wrap">\n' +
        '      <h2 class="pp-h2">Quick comparison</h2>\n' +
        '      <div class="pp-compare pp-area-table">\n' +
        '        <table>\n' +
        '          <thead><tr><th scope="col">Project</th><th scope="col">From (EGP)</th><th scope="col">Down payment</th><th scope="col">Installments</th><th scope="col">Types</th><th scope="col">Available</th></tr></thead>\n' +
        '          <tbody>\n' + rows + '          </tbody>\n' +
        '        </table>\n' +
        '      </div>\n' +
        '    </div>\n' +
        '  </section>\n\n' +
        '  <section class="pp-section">\n' +
        '    <div class="pp-wrap">\n' +
        '      <h2 class="pp-h2">How to choose</h2>\n' +
        '      <dl class="pp-facts pp-area-picks">\n' +
        picks.map(function (k) { return '        <div class="pp-fact"><dt>' + k[0] + '</dt><dd>' + esc(k[1]) + '</dd></div>\n'; }).join('') +
        '      </dl>\n' +
        '    </div>\n' +
        '  </section>\n\n' +
        '  <section class="section section--gray">\n' +
        '    <h2 class="section-title">All Hyde Park projects in ' + esc(a.name) + '</h2>\n' +
        '    <div class="grid grid--projects">\n' + list.map(homeCard).join('') + '    </div>\n' +
        '  </section>\n\n' +
        faqSection(faqList) + '\n' +
        '  <section class="pp-section pp-section--gray">\n' +
        '    <div class="pp-wrap pp-area-cta">\n' +
        '      <h2 class="pp-h2">Can’t decide between projects?</h2>\n' +
        '      <p>Send us your budget and the monthly installment that suits you, and we’ll recommend the available units in ' + esc(a.name) + '.</p>\n' +
        '      <a href="#" class="pp-btn pp-btn--green" data-whatsapp-link data-whatsapp-message="' + esc('Hi, I’d like unit recommendations in Hyde Park projects in ' + a.name + '.') + '" data-cta-location="area"><i class="fa-brands fa-whatsapp"></i> Chat on WhatsApp</a>\n' +
        '    </div>\n' +
        '  </section>\n\n',
    });
  }

  /* ---------------- Contact ---------------- */

  function contactPage() {
    var title = 'Contact Us | Explorer Hyde Park';
    var description = 'Contact the Explorer Hyde Park team about prices, sizes and payment plans for Hyde Park projects in New Cairo, 6th of October and the North Coast.';
    var canonical = SITE + '/en/contact';
    var card = function (attrs, icon, iconStyle, head, sub) {
      return '        <' + (attrs ? 'a ' + attrs : 'div') + ' class="card en-contact__card">\n' +
        '          <div class="amenity__icon"' + (iconStyle ? ' style="' + iconStyle + '"' : '') + '><i class="' + icon + '"></i></div>\n' +
        '          <div><div class="en-contact__head">' + head + '</div><div class="en-contact__sub">' + sub + '</div></div>\n' +
        '        </' + (attrs ? 'a' : 'div') + '>\n';
    };
    return doc({
      ctx: { page_type: 'contact', project_name: '', area: '' },
      title: title,
      description: description,
      canonical: canonical,
      alternates: hreflang('/contact', '/en/contact'),
      og: { title: title, description: description, url: canonical, image: h.OG_DEFAULT_IMAGE },
      phoneField: true,
      body:
        nav(false, '/contact') + '\n\n' +
        '  <div class="breadcrumb container"><a href="/en/">Home</a> / Contact us</div>\n\n' +
        '  <section class="section en-contact">\n' +
        '    <h1 class="section-title" style="margin-bottom:8px">Contact us</h1>\n' +
        '    <p class="section-sub">Leave your details and our team will call you, or reach us directly on WhatsApp or by phone.</p>\n' +
        '    <div class="en-contact__grid">\n' +
        '      <div class="en-contact__form">\n' +
        '        <form class="form-card" data-lead-form data-project-name="" data-success-url="/en/thank-you">\n' +
        '          <div class="field field-icon">\n' +
        '            <label for="c-name">Name</label>\n' +
        '            <i class="fa-solid fa-user"></i>\n' +
        '            <input type="text" id="c-name" name="name" placeholder="Your name" autocomplete="name" required>\n' +
        '          </div>\n' +
        '          <div class="field">\n' +
        '            <label for="c-phone">Phone number</label>\n' +
        '            <div class="form-row">\n' +
        '              ' + phoneField() + '\n' +
        '              <input type="tel" id="c-phone" name="phone" class="field-tel" dir="ltr" placeholder="1XX XXX XXXX" autocomplete="tel-national" required>\n' +
        '            </div>\n' +
        '          </div>\n' +
        '          <div class="field field-icon">\n' +
        '            <label for="c-email">Email <span class="optional-tag">(optional)</span></label>\n' +
        '            <i class="fa-solid fa-envelope"></i>\n' +
        '            <input type="email" id="c-email" name="email" placeholder="example@email.com" autocomplete="email">\n' +
        '          </div>\n' +
        '          <div class="field">\n' +
        '            <label for="c-project">Project you’re interested in</label>\n' +
        '            <select id="c-project" name="project">\n' +
        '              <option value="">Not sure / all projects</option>\n' +
        all.map(function (p) { return '              <option value="' + esc(p.nameEn) + '">' + esc(p.nameEn) + '</option>\n'; }).join('') +
        '            </select>\n' +
        '          </div>\n' +
        '          <div class="field">\n' +
        '            <label for="c-message">Your message <span class="optional-tag">(optional)</span></label>\n' +
        '            <textarea id="c-message" name="message" placeholder="Write your question here" rows="3"></textarea>\n' +
        '          </div>\n' +
        '          <input type="text" name="website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">\n' +
        '          <button type="submit" class="btn btn-yellow">Send request</button>\n' +
        '        </form>\n' +
        '        <p class="form-consent" style="text-align:center">By submitting, you agree to our <a href="/en/privacy">privacy policy</a>.</p>\n' +
        '      </div>\n' +
        '      <div class="en-contact__cards">\n' +
        card('href="#" data-whatsapp-link data-whatsapp-message="' + esc(GENERAL_WA) + '" data-cta-location="contact"', 'fa-brands fa-whatsapp', 'background:rgba(0,215,160,.15);color:var(--green)', 'WhatsApp', 'Fast reply within minutes') +
        card('href="#" data-phone-link data-cta-location="contact"', 'fa-solid fa-phone', '', 'Call us', 'Available during business hours') +
        card('', 'fa-solid fa-location-dot', '', 'Cairo, Egypt', 'Covering New Cairo, 6th of October and the North Coast') +
        '      </div>\n' +
        '    </div>\n' +
        '  </section>\n\n',
    });
  }

  /* ---------------- Privacy ---------------- */

  function privacyPage() {
    var title = 'Privacy Policy | Explorer Hyde Park';
    var description = 'Explorer Hyde Park privacy policy: the data we collect, how we use it, cookies, Google and Meta ads, and your rights over your data.';
    var canonical = SITE + '/en/privacy';
    var sec = function (n, head, html) {
      return '      <div>\n        <h2 class="en-legal__h2">' + n + '. ' + head + '</h2>\n' + html + '      </div>\n';
    };
    var ul = function (items) { return '        <ul class="en-legal__list">\n' + items.map(function (i) { return '          <li>' + i + '</li>\n'; }).join('') + '        </ul>\n'; };
    var para = function (t, cls) { return '        <p' + (cls ? ' class="' + cls + '"' : '') + '>' + t + '</p>\n'; };
    return doc({
      ctx: { page_type: 'privacy', project_name: '', area: '' },
      title: title,
      description: description,
      canonical: canonical,
      alternates: hreflang('/privacy', '/en/privacy'),
      og: { title: title, description: description, url: canonical, image: h.OG_DEFAULT_IMAGE },
      body:
        nav(false, '/privacy') + '\n\n' +
        '  <div class="breadcrumb container"><a href="/en/">Home</a> / Privacy policy</div>\n\n' +
        '  <section class="section en-legal">\n' +
        '    <h1 class="section-title en-legal__title">Privacy policy</h1>\n' +
        '    <p class="en-legal__date">Last updated: 18 October 2026</p>\n' +
        '    <div class="en-legal__body">\n' +
        '      <div>\n' +
        para('Explorer Hyde Park (“the website”, “we”) is a marketing platform and authorized broker that presents Hyde Park real estate projects in New Cairo, 6th of October and the North Coast. We are not the developer of any of these projects, and we do not own them or run their sales directly — our role is to present the information available about them and help you reach the right sales team. This policy explains what data we collect when you use the website, how we use it, and your rights over it.') +
        '      </div>\n' +
        sec(1, 'The data we collect',
          para('When you fill in a contact form on the website (on a project page or the contact page), we may collect:', 'en-legal__lead') +
          ul(['Your <strong>name</strong> and <strong>phone number</strong> — required so we can answer your enquiry.',
            'Your <strong>email</strong> and <strong>message</strong> — optional; you can leave them empty.',
            'The project you’re interested in (if you choose one), and your answers to the form questions.']) +
          para('In addition, your browser automatically sends general technical data (such as device type, browser and the pages you visit) to every website you visit, and this may appear in the reports of the analytics or advertising tools used on the website (see the cookies section below).', 'en-legal__after')) +
        sec(2, 'How we use your data',
          ul(['To answer your enquiry and contact you about the project or projects you’re interested in.',
            'To improve the website’s content and understand which sections interest our visitors most.',
            'To run advertising campaigns (such as Google Ads and Meta Ads) and measure their performance.']) +
          para('We do not sell your data to any third party for their own marketing.', 'en-legal__after')) +
        sec(3, 'How forms are sent and data is stored',
          para('When you send a form on the website, two things happen. The form data (name, mobile number and your answers) is recorded in a spreadsheet on Google Sheets that only our sales team can access, so we can contact you and follow up on your request, together with simple information about where your visit came from (for example, a Google search or an ad) and the page you sent it from. At the same time, a ready-made WhatsApp message to the sales team opens (WhatsApp/Meta’s privacy policy governs sending and receiving that message). Only our team can access this data, we use it to contact you about your request, and you can ask us to delete it at any time (see “Your rights”).')) +
        sec(4, 'Cookies and advertising',
          para('The website uses or connects to external services that may set cookies or collect limited usage data, including:', 'en-legal__lead') +
          ul(['<strong>Google Analytics</strong> (through Google Tag Manager) — to measure visits, pages viewed and buttons clicked, without identifying you personally.',
            '<strong>Google Fonts</strong> and <strong>Font Awesome</strong> — to load fonts and icons.',
            '<strong>Google Ads</strong> and <strong>Meta Ads</strong> (Facebook/Instagram) — if you reached the website from an ad, or if we run remarketing later, pixels/cookies may be used to measure ad performance and show you relevant ads on other platforms.']) +
          para('You can control or block cookies from your browser settings at any time, although this may affect some features of the website.', 'en-legal__after')) +
        sec(5, 'Sharing data',
          para('We share your enquiry data only with the sales team of the project (or projects) you’re interested in, so they can answer you. We don’t share your data with anyone else for purposes unrelated to your enquiry, unless required by law.')) +
        sec(6, 'Your rights',
          para('At any time you can ask us what data we hold about you, or ask us to correct or delete it, or withdraw your consent to be contacted — just reach us on WhatsApp or by phone from the <a href="/en/contact">contact page</a>, and we’ll respond as soon as possible.')) +
        sec(7, 'Children’s privacy',
          para('This website is intended for adults interested in buying or renting property. It is not directed at children under 18, and we do not knowingly collect data from this age group.')) +
        sec(8, 'Links to external websites',
          para('The website contains links to external services such as WhatsApp. We are not responsible for the privacy policies or content of those external websites or apps, and we recommend reviewing their privacy policies separately.')) +
        sec(9, 'Updates to this policy',
          para('We may update this policy from time to time to reflect changes in how we work. The date of the last update is shown at the top of the page, and we recommend reviewing it periodically.')) +
        sec(10, 'Contact us',
          para('If you have any questions about this privacy policy or want to exercise any of your rights, contact us from the <a href="/en/contact">contact page</a> or directly on WhatsApp.')) +
        '    </div>\n' +
        '  </section>\n\n',
    });
  }

  /* ---------------- llms.txt ----------------
   * Plain-text summary of the site for AI assistants and answer engines
   * (llmstxt.org format: H1, short summary, then linked sections). Rebuilt
   * from the same data as the pages, so prices and counts never drift. */
  function llmsTxt() {
    var L = [];
    var line = function (t) { L.push(t == null ? '' : t); };
    var plan = function (p) { return p.paymentPlan.downPct + '% down, installments up to ' + years(p.paymentPlan.years); };
    var types = function (p) { return uniq(p.units.map(shortEn)).join(', ').toLowerCase(); };
    var residential = all.filter(function (p) { return !isCommercial(p); });
    var commercial = all.filter(isCommercial);

    line('# Explorer Hyde Park');
    line();
    line('> Explorer Hyde Park (explorerhydepark.com) is a marketing platform and authorized broker for Hyde Park Developments projects in Egypt — New Cairo, 6th of October and the North Coast. It is not the developer. Every price below is the lowest available price from the developer’s availability report' + (lastUpdated ? ' (' + lastUpdated + ')' : '') + ', in Egyptian pounds (EGP). The site is in Arabic (main) and English.');
    line();
    line('Key facts:');
    line('- Projects listed: ' + all.length + ' (' + residential.length + ' residential, ' + commercial.length + ' office/commercial).');
    line('- Developer of every project: Hyde Park Developments (هايد بارك للتطوير العقاري). Explorer Hyde Park only markets and brokers the units.');
    line('- No commission is charged to the buyer. Buyers living abroad can complete the purchase online, with the contract signed through a power of attorney.');
    line('- Contact: WhatsApp or phone, both linked on every page and on the contact page.');
    line();

    var groups = [];
    var byArea = {};
    residential.forEach(function (p) {
      if (!byArea[p.areaEn]) { byArea[p.areaEn] = []; groups.push(p.areaEn); }
      byArea[p.areaEn].push(p);
    });
    groups.forEach(function (area) {
      line('## Residential projects in ' + area);
      line();
      byArea[area].forEach(function (p) {
        var parent = parentOf(p);
        line('- [' + p.nameEn + ' (' + p.nameAr + ')](' + SITE + enProjectPath(p.slug) + '): ' + areaLabel(p) + '. From ' + egp(p.startingPrice) +
          (p.availableUnits ? ', ' + unitsCount(p.availableUnits) + ' available' : '') + '. ' + types(p).replace(/^./, function (c) { return c.toUpperCase(); }) + '. ' + plan(p) + '.' +
          (p.finishingEn ? ' Delivered ' + p.finishingEn + '.' : '') +
          (parent ? ' A gated compound inside ' + parent.nameEn + '.' : '') +
          ' Arabic page: ' + SITE + arProjectPath(p.slug));
      });
      var hub = Object.keys(AREAS_EN).filter(function (k) { return AREAS_EN[k].name === area && enAreaPath(k); })[0];
      if (hub) {
        line('- [Compare all Hyde Park projects in ' + area + '](' + SITE + enAreaPath(hub) + '): side-by-side prices, down payments, installment years, unit types and availability.');
      }
      line();
    });

    if (commercial.length) {
      line('## Offices and commercial units');
      line();
      commercial.forEach(function (p) {
        line('- [' + p.nameEn + ' (' + p.nameAr + ')](' + SITE + enProjectPath(p.slug) + '): ' + areaLabel(p) + '. ' + types(p).replace(/^./, function (c) { return c.toUpperCase(); }) +
          ' from ' + egp(p.startingPrice) + (p.availableUnits ? ', ' + unitsCount(p.availableUnits) + ' available' : '') + '. ' + plan(p) + '. Arabic page: ' + SITE + arProjectPath(p.slug));
      });
      line();
    }

    line('## What each project page contains');
    line();
    line('- Starting price, down payment and installment period; available units by type and bedrooms with area ranges and prices.');
    line('- A monthly-budget calculator (what down payment each unit needs for a given monthly installment).');
    line('- Location and nearby landmarks, amenities, project phases, and an FAQ (also as FAQPage structured data).');
    line();
    line('## Other pages');
    line();
    line('- [Home (English)](' + SITE + '/en/): all projects grouped by area.');
    line('- [الصفحة الرئيسية (Arabic home)](' + SITE + '/): the main version of the site.');
    line('- [Contact](' + SITE + '/en/contact): request a call or message on WhatsApp.');
    line('- [Privacy policy](' + SITE + '/en/privacy)');
    line('- [Sitemap](' + SITE + '/sitemap.xml)');
    line();
    return L.join('\n');
  }

  /* ---------------- Write ---------------- */

  var fs = require('fs'), path = require('path');
  ['en', 'en/projects', 'en/areas'].forEach(function (d) {
    var dir = path.join(h.ROOT, d);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  all.forEach(function (p) {
    var changed = h.writeIfChanged('en/projects/' + p.slug + '.html', projectPage(p));
    console.log((changed ? 'wrote ' : 'unchanged ') + 'en/projects/' + p.slug + '.html');
  });
  h.writeIfChanged('en/index.html', homePage());
  h.writeIfChanged('en/thank-you.html', thankYouPage());
  h.writeIfChanged('en/contact.html', contactPage());
  h.writeIfChanged('en/privacy.html', privacyPage());
  var hubs = Object.keys(AREAS_EN).filter(enAreaPath);
  hubs.forEach(function (slug) { h.writeIfChanged('en/areas/' + slug + '.html', areaPage(slug)); });
  console.log('wrote en/index.html, en/contact.html, en/privacy.html, en/thank-you.html, en/areas/' + hubs.join(', en/areas/'));
  h.writeIfChanged('llms.txt', llmsTxt());
  console.log('wrote llms.txt');

  // For the sitemap (thank-you is noindex, so it stays out).
  return [{ loc: SITE + '/en/', file: 'en/index.html', changefreq: 'weekly', priority: '0.9' }]
    .concat(all.map(function (p) {
      return { loc: SITE + enProjectPath(p.slug), file: 'en/projects/' + p.slug + '.html', changefreq: 'weekly', priority: '0.8' };
    }))
    .concat(hubs.map(function (slug) {
      return { loc: SITE + '/en/areas/' + slug, file: 'en/areas/' + slug + '.html', changefreq: 'weekly', priority: '0.7' };
    }))
    .concat([
      { loc: SITE + '/en/contact', file: 'en/contact.html', changefreq: 'monthly', priority: '0.5' },
      { loc: SITE + '/en/privacy', file: 'en/privacy.html', changefreq: 'yearly', priority: '0.3' },
    ]);
};
