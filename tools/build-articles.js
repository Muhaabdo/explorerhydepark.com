/**
 * Article pages from tools/articles.js, in both languages:
 *   articles/<slug>.html, articles/index.html          (Arabic)
 *   en/articles/<slug>.html, en/articles/index.html    (English)
 * Called from the end of build-pages.js. `ar` carries the Arabic page pieces
 * (nav, footer, cards...), `en` the English ones returned by build-en.js.
 * Returns the sitemap entries.
 */
var ARTICLES = require('./articles');

var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
var EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dateText(iso, lang) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  return lang === 'ar'
    ? Number(m[3]) + ' ' + AR_MONTHS[Number(m[2]) - 1] + ' ' + m[1]
    : Number(m[3]) + ' ' + EN_MONTHS[Number(m[2]) - 1] + ' ' + m[1];
}

module.exports = function buildArticles(ar, en) {
  var fs = require('fs'), path = require('path');
  var esc = ar.escapeHtml, fmt = ar.fmt, SITE = ar.SITE_ORIGIN;
  var bySlug = {};
  ar.merged.forEach(function (p) { bySlug[p.slug] = p; });

  var T = {
    ar: {
      home: 'الرئيسية', hub: 'أخبار ومقالات', hubTitle: 'أخبار ومقالات هايد بارك', hubLede: 'آخر أخبار مشاريع هايد بارك وإطلاقاتها الجديدة، مع الأسعار المتاحة حاليًا من مخزون المطوّر.',
      published: 'نُشر', updated: 'آخر تحديث', by: 'إعداد فريق <bdi class="en">Explorer Hyde Park</bdi>',
      faq: 'أسئلة شائعة', related: 'مشاريع مرتبطة', sources: 'المصادر', readMore: 'اقرأ المقال ←',
      table: ['المشروع', 'يبدأ من (جنيه)', 'المقدم', 'التقسيط', 'المتاح'],
      years: function (n) { return n === 1 ? 'سنة' : n === 2 ? 'سنتين' : n <= 10 ? n + ' سنين' : n + ' سنة'; },
    },
    en: {
      home: 'Home', hub: 'News & articles', hubTitle: 'Hyde Park news & articles', hubLede: 'The latest on Hyde Park projects and launches, with the prices available today from the developer’s inventory.',
      published: 'Published', updated: 'Updated', by: 'By the Explorer Hyde Park team',
      faq: 'Frequently asked questions', related: 'Related projects', sources: 'Sources', readMore: 'Read the article →',
      table: ['Project', 'From (EGP)', 'Down payment', 'Installments', 'Available'],
      years: function (n) { return n + (n === 1 ? ' year' : ' years'); },
    },
  };

  function articlePath(lang, slug) { return (lang === 'en' ? '/en' : '') + '/articles/' + (slug || ''); }
  function projectPath(lang, slug) { return (lang === 'en' ? '/en' : '') + '/projects/' + slug; }
  function nameOf(p, lang) { return lang === 'en' ? p.nameEn : p.nameAr; }

  function ctxFor(lang) {
    var t = T[lang];
    return {
      p: function (slug) { if (!bySlug[slug]) throw new Error('articles.js: unknown project "' + slug + '"'); return bySlug[slug]; },
      link: function (slug) { return projectPath(lang, slug); },
      fmt: fmt,
      esc: esc,
      wa: function (msg, label) {
        return '<p class="article__cta"><a href="#" class="pp-btn pp-btn--green" data-whatsapp-link data-whatsapp-message="' + esc(msg) +
          '" data-cta-location="article"><i class="fa-brands fa-whatsapp"></i> ' + esc(label) + '</a></p>\n';
      },
      westTable: function () {
        var list = ar.merged.filter(function (o) { return o.areaSlug === 'october' && !ar.isCommercial(o); })
          .slice().sort(function (a, b) { return a.startingPrice - b.startingPrice; });
        return '<div class="pp-compare article__table"><table>\n' +
          '<thead><tr>' + t.table.map(function (h) { return '<th scope="col">' + h + '</th>'; }).join('') + '</tr></thead>\n<tbody>\n' +
          list.map(function (o) {
            return '<tr><th scope="row"><a href="' + projectPath(lang, o.slug) + '">' + esc(nameOf(o, lang)) + '</a></th>' +
              '<td>' + (lang === 'ar' ? '<bdi class="en">' + fmt(o.startingPrice) + '</bdi>' : fmt(o.startingPrice)) + '</td>' +
              '<td>' + (lang === 'ar' ? '<bdi class="en">' + o.paymentPlan.downPct + '%</bdi>' : o.paymentPlan.downPct + '%') + '</td>' +
              '<td>' + t.years(o.paymentPlan.years) + '</td>' +
              '<td>' + (o.availableUnits || '—') + '</td></tr>\n';
          }).join('') +
          '</tbody></table></div>\n';
      },
    };
  }

  function schema(a, lang, url) {
    var L = a[lang], t = T[lang];
    var article = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: L.title,
      description: L.description,
      inLanguage: lang,
      datePublished: a.published,
      dateModified: a.updated || a.published,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: ar.SITE_NAME, url: SITE + (lang === 'en' ? '/en/' : '/') },
      publisher: { '@type': 'Organization', name: ar.SITE_NAME, url: SITE + '/' },
      image: ar.ogImageUrl(a.related[0]),
      citation: a.sources.map(function (s) { return s.url; }),
    };
    var crumbs = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: t.home, item: SITE + (lang === 'en' ? '/en/' : '/') },
        { '@type': 'ListItem', position: 2, name: t.hub, item: SITE + articlePath(lang) },
        { '@type': 'ListItem', position: 3, name: L.title, item: url },
      ],
    };
    return ar.jsonLd(article) + '\n' + ar.jsonLd(crumbs) + '\n' + ar.faqJsonLd(L.faqs);
  }

  function cards(a, lang) {
    return a.related.map(function (slug) {
      var p = bySlug[slug];
      return lang === 'en' ? en.homeCard(p) : ar.projectCardMarkup(p, projectPath('ar', slug), '', '/');
    }).join('');
  }

  function body(a, lang) {
    var L = a[lang], t = T[lang];
    var dates = t.published + ': ' + dateText(a.published, lang) +
      (a.updated && a.updated !== a.published ? ' · ' + t.updated + ': ' + dateText(a.updated, lang) : '') + ' · ' + t.by;
    return (
      '  <article class="pp-section article">\n' +
      '    <div class="pp-wrap article__wrap">\n' +
      '      <nav class="pp-breadcrumb" aria-label="' + (lang === 'en' ? 'Breadcrumb' : 'مسار الصفحة') + '"><ol><li><a href="' + (lang === 'en' ? '/en/' : '/') + '">' + t.home + '</a></li>' +
      '<li><a href="' + articlePath(lang) + '">' + t.hub + '</a></li><li aria-current="page">' + esc(L.title) + '</li></ol></nav>\n' +
      '      <h1 class="article__title">' + esc(L.title) + '</h1>\n' +
      '      <p class="pp-byline">' + dates + '</p>\n' +
      '      <p class="article__lede">' + esc(L.lede) + '</p>\n' +
      '      <div class="article__body">\n' + L.body(ctxFor(lang)) + '      </div>\n' +
      '    </div>\n' +
      '  </article>\n\n' +
      '  <section class="section section--gray">\n' +
      '    <h2 class="section-title">' + t.related + '</h2>\n' +
      '    <div class="grid grid--projects">\n' + cards(a, lang) + '    </div>\n' +
      '  </section>\n\n' +
      '  <section class="pp-section" id="faq">\n' +
      '    <div class="pp-wrap article__wrap">\n' +
      '      <h2 class="pp-h2">' + t.faq + '</h2>\n' +
      '      <div class="pp-faq">\n' +
      L.faqs.map(function (f, i) {
        return '        <details class="pp-faq__item"' + (i === 0 ? ' open' : '') + '>\n          <summary>' + esc(f.q) + '</summary>\n          <p>' + esc(f.a) + '</p>\n        </details>\n';
      }).join('') +
      '      </div>\n' +
      '      <h2 class="pp-h2 article__sources-title">' + t.sources + '</h2>\n' +
      '      <ul class="article__sources">\n' +
      a.sources.map(function (s) { return '        <li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a></li>\n'; }).join('') +
      '      </ul>\n' +
      '    </div>\n' +
      '  </section>\n\n'
    );
  }

  /* ----- Arabic page shell (same head/nav/footer as the other Arabic pages) ----- */
  function arDoc(o) {
    return ar.bakeContactLinks('<!DOCTYPE html>\n' +
      '<html lang="ar" dir="rtl">\n' +
      '<head>\n' +
      ar.pageContextScript(o.ctx) +
      '<!-- Google Tag Manager -->\n' +
      '<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':\n' +
      'new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],\n' +
      'j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=\n' +
      '\'https://www.googletagmanager.com/gtm.js?id=\'+i+dl;f.parentNode.insertBefore(j,f);\n' +
      '})(window,document,\'script\',\'dataLayer\',\'GTM-5FD83KJ7\');</script>\n' +
      '<!-- End Google Tag Manager -->\n' +
      '<meta charset="UTF-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(o.title) + '</title>\n' +
      '<meta name="description" content="' + esc(o.description) + '">\n' +
      '<link rel="canonical" href="' + o.canonical + '">\n' +
      ar.hreflangLinks(o.arPath, o.enPath) +
      ar.ogTagsMarkup({ title: o.title, description: o.description, url: o.canonical, image: o.image }).replace('content="website"', 'content="' + (o.ogType || 'website') + '"') + '\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">\n' +
      '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">\n' +
      '<link rel="stylesheet" href="' + ar.assetUrl('/', 'assets/css/style.css') + '">\n' +
      (o.schema ? o.schema + '\n' : '') +
      '</head>\n' +
      '<body class="pp-page article-page">\n\n' +
      '<!-- Google Tag Manager (noscript) -->\n' +
      '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5FD83KJ7"\n' +
      'height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n' +
      '<!-- End Google Tag Manager (noscript) -->\n\n' +
      ar.nav(false, o.enPath) + '\n\n' +
      o.body +
      ar.footer() + '\n\n' +
      '<script src="' + ar.assetUrl('/', 'assets/js/main.js') + '"></script>\n' +
      '</body>\n' +
      '</html>\n');
  }

  function page(a, lang) {
    var L = a[lang];
    var arPath = articlePath('ar', a.slug), enPath = articlePath('en', a.slug);
    var canonical = SITE + (lang === 'en' ? enPath : arPath);
    var o = {
      ctx: { page_type: 'article', project_name: '', area: '' },
      title: L.seoTitle || L.title,
      description: L.description,
      canonical: canonical,
      image: ar.ogImageUrl(a.related[0]),
      schema: schema(a, lang, canonical),
      body: body(a, lang),
    };
    if (lang === 'ar') {
      return arDoc(Object.assign(o, { arPath: arPath, enPath: enPath, ogType: 'article' }));
    }
    return en.doc({
      ctx: o.ctx, title: o.title, description: o.description, canonical: canonical,
      alternates: en.hreflang(arPath, enPath),
      og: { title: o.title, description: o.description, url: canonical, image: o.image },
      schema: o.schema,
      bodyClass: 'pp-page article-page',
      body: en.nav(false, arPath) + '\n\n' + o.body,
    });
  }

  function hubPage(lang) {
    var t = T[lang];
    var list = ARTICLES.slice().sort(function (a, b) { return a.published < b.published ? 1 : -1; });
    var arPath = articlePath('ar'), enPath = articlePath('en');
    var canonical = SITE + (lang === 'en' ? enPath : arPath);
    var items = list.map(function (a) {
      var L = a[lang];
      return '      <li class="article-card"><a href="' + articlePath(lang, a.slug) + '">' +
        '<span class="article-card__date">' + dateText(a.published, lang) + '</span>' +
        '<span class="article-card__title">' + esc(L.title) + '</span>' +
        '<span class="article-card__desc">' + esc(L.description) + '</span>' +
        '<span class="article-card__more">' + t.readMore + '</span></a></li>\n';
    }).join('');
    var bodyHtml =
      '  <header class="pp-section pp-area-hero">\n' +
      '    <div class="pp-wrap article__wrap">\n' +
      '      <nav class="pp-breadcrumb" aria-label="' + (lang === 'en' ? 'Breadcrumb' : 'مسار الصفحة') + '"><ol><li><a href="' + (lang === 'en' ? '/en/' : '/') + '">' + t.home + '</a></li><li aria-current="page">' + t.hub + '</li></ol></nav>\n' +
      '      <h1 class="pp-area-title">' + t.hubTitle + '</h1>\n' +
      '      <p class="pp-summary">' + t.hubLede + '</p>\n' +
      '    </div>\n' +
      '  </header>\n\n' +
      '  <section class="pp-section">\n' +
      '    <ul class="pp-wrap article__wrap article-list">\n' + items + '    </ul>\n' +
      '  </section>\n\n';
    var o = {
      ctx: { page_type: 'articles', project_name: '', area: '' },
      title: t.hubTitle + ' | Explorer Hyde Park',
      description: t.hubLede,
      canonical: canonical,
      image: ar.OG_DEFAULT_IMAGE,
      body: bodyHtml,
    };
    if (lang === 'ar') return arDoc(Object.assign(o, { arPath: arPath, enPath: enPath }));
    return en.doc({
      ctx: o.ctx, title: o.title, description: o.description, canonical: canonical,
      alternates: en.hreflang(arPath, enPath),
      og: { title: o.title, description: o.description, url: canonical, image: o.image },
      bodyClass: 'pp-page',
      body: en.nav(false, arPath) + '\n\n' + bodyHtml,
    });
  }

  ['articles', 'en/articles'].forEach(function (d) {
    var dir = path.join(ar.ROOT, d);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  var urls = [];
  ['ar', 'en'].forEach(function (lang) {
    var prefix = lang === 'en' ? 'en/' : '';
    ar.writeIfChanged(prefix + 'articles/index.html', hubPage(lang));
    urls.push({ loc: SITE + articlePath(lang), file: prefix + 'articles/index.html', changefreq: 'weekly', priority: '0.6' });
    ARTICLES.forEach(function (a) {
      ar.writeIfChanged(prefix + 'articles/' + a.slug + '.html', page(a, lang));
      urls.push({ loc: SITE + articlePath(lang, a.slug), file: prefix + 'articles/' + a.slug + '.html', changefreq: 'weekly', priority: '0.7' });
    });
  });
  console.log('wrote ' + ARTICLES.length + ' article(s) in Arabic and English + the two article lists');
  return urls;
};

module.exports.list = ARTICLES;
module.exports.dateText = dateText;
