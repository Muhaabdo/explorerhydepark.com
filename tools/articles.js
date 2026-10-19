/**
 * Articles / news (/articles/<slug> in Arabic, /en/articles/<slug> in English).
 * Rendered by tools/build-articles.js — run `node tools/build-pages.js`.
 *
 * Each article:
 *   slug, published / updated (YYYY-MM-DD)
 *   related: project slugs shown as cards under the article (and linked in the text)
 *   sources: [{ title, url }] — listed at the bottom; facts in the text must come from them
 *   ar / en: { title (H1), seoTitle (<title>, ≤ ~60 chars), description (≤ 160),
 *              lede (first paragraph, plain text), body(ctx) → HTML, faqs: [{ q, a }] }
 *
 * body(ctx) gets live data so prices never go stale:
 *   ctx.p(slug)      merged project (startingPrice, availableUnits, paymentPlan, units...)
 *   ctx.link(slug)   URL of that project's page in the article's language
 *   ctx.fmt(n)       "6,410,000"
 *   ctx.esc(s)       HTML-escape
 *   ctx.westTable()  comparison table of the West Cairo (6th of October) projects
 *   ctx.wa(message, label)  WhatsApp button (tracked as cta_location "article")
 */

var DREAM_LAND_SOURCES = [
  { title: 'Daily News Egypt — Madbouly witnesses Hyde Park deal to acquire 415 feddans in West Cairo (12 Oct 2026)', url: 'https://www.dailynewsegypt.com/2026/10/12/madbouly-witnesses-hyde-park-deal-to-acquire-415-feddans-in-west-cairo/' },
  { title: 'البنكية — تفاصيل مشروع هايد بارك الجديد في السادس من أكتوبر.. 415 فدانًا (12 أكتوبر 2026)', url: 'https://banker.news/155930' },
  { title: 'بوابة بلوم — بمساحة 415 فدانًا.. هايد بارك تشتري أرض دريم لاند (12 أكتوبر 2026)', url: 'https://bloom-gate.com/أسواق/بمساحة-415-فدانًا-هايد-بارك-تشتري-أرض-دري/' },
  { title: 'مصراوي — رحيل أحمد بهجت مؤسس دريم لاند (21 مايو 2021)', url: 'https://www.masrawy.com/news/news_economy/details/2021/5/21/2026418' },
  { title: 'Nawy — Dream Land compound', url: 'https://www.nawy.com/compound/587-dream-land' },
];

module.exports = [
  {
    slug: 'hyde-park-dream-land-october',
    published: '2026-10-19',
    updated: '2026-10-19',
    related: ['hyde-park-garden-lake', 'hyde-park-signature', 'hyde-park-tawny'],
    sources: DREAM_LAND_SOURCES,

    ar: {
      title: 'هايد بارك تستحوذ على 415 فدان من أرض دريم لاند في 6 أكتوبر: كل اللي نعرفه عن المشروع الجديد',
      seoTitle: 'هايد بارك دريم لاند 415 فدان في أكتوبر: تفاصيل المشروع الجديد',
      description: 'هايد بارك وقّعت على 415 فدان من أرض دريم لاند في التوسعات الشرقية لـ6 أكتوبر بحضور رئيس الوزراء. إيه المعروف عن المشروع، وإيه المتاح دلوقتي في غرب القاهرة.',
      lede: 'يوم 12 أكتوبر 2026 وقّعت شركة هايد بارك للتطوير العقاري اتفاقية للاستحواذ على قطعة أرض مساحتها 415 فدانًا في منطقة التوسعات الشرقية بمدينة 6 أكتوبر، وهي الأرض اللي كانت معروفة باسم "أرض دريم لاند"، بحضور رئيس مجلس الوزراء مصطفى مدبولي. ده هيبقى أكبر مشروع لهايد بارك في غرب القاهرة لحد دلوقتي.',
      body: function (c) {
        return (
          '<h2>الخبر في سطور</h2>\n' +
          '<ul>\n' +
          '<li><strong>التاريخ:</strong> 12 أكتوبر 2026، في مقر الحكومة بالعاصمة الإدارية الجديدة.</li>\n' +
          '<li><strong>المساحة والموقع:</strong> 415 فدانًا في منطقة التوسعات الشرقية بمدينة 6 أكتوبر، والمعروفة سابقًا بأرض دريم لاند.</li>\n' +
          '<li><strong>الطرفين:</strong> شركة هايد بارك للتطوير العقاري (وقّع عنها العضو المنتدب أمين سراج)، والشركة المصرية لإدارة الأصول العقارية والاستثمار المملوكة للبنك الأهلي المصري وبنك مصر (وقّع عنها رئيس مجلس إدارتها كرم صلاح).</li>\n' +
          '<li><strong>الحضور:</strong> رئيس مجلس الوزراء مصطفى مدبولي، ووزيرة الإسكان راندة المنشاوي، ورؤساء البنك الأهلي وبنك مصر.</li>\n' +
          '<li><strong>دور هايد بارك:</strong> إنشاء الوحدات السكنية وتمويلها وتسويقها.</li>\n' +
          '<li><strong>مكانه في محفظة الشركة:</strong> رابع مشروع لهايد بارك في غرب القاهرة، والعاشر في مصر، والأكبر لها في غرب القاهرة حتى الآن.</li>\n' +
          '</ul>\n' +
          '<p>وزارة الإسكان قالت إن الاتفاقية بتحل مشكلة ممتدة لعشرات السنين متعلقة بالأرض دي، وقيادات البنكين وصفوها بأنها نموذج للتعاون مع المطورين لتحسين استغلال الأصول العقارية.</p>\n' +

          '<h2>يعني إيه أرض دريم لاند؟</h2>\n' +
          '<p>دريم لاند من أقدم المشروعات العقارية الكبيرة في غرب القاهرة: بدأته مجموعة بهجت في أواخر الثمانينيات على مساحة تقارب 2,000 فدان على طريق الواحات في 6 أكتوبر، وكان من أوائل المشروعات اللي عمّرت المنطقة دي، وفيه دريم بارك، أول مدينة ملاهي من نوعها في الشرق الأوسط وقتها. الـ415 فدان اللي هايد بارك استحوذت عليها جزء من أرض دريم لاند في منطقة التوسعات الشرقية، وكانت مع شركة مملوكة للبنك الأهلي وبنك مصر.</p>\n' +
          '<p><strong>مهم:</strong> المشروع الجديد مش هو كمبوند دريم لاند القائم، ده مشروع جديد هتطوّره هايد بارك على قطعة الأرض دي.</p>\n' +

          '<h2>إيه اللي لسه ما اتعلنش؟</h2>\n' +
          '<p>لحد تاريخ النشر، لا هايد بارك ولا الجهات الرسمية أعلنوا عن:</p>\n' +
          '<ul>\n<li>اسم المشروع الجديد وموعد إطلاقه.</li>\n<li>الأسعار وخطط السداد.</li>\n<li>أنواع الوحدات وعددها.</li>\n<li>قيمة الصفقة.</li>\n</ul>\n' +
          '<p>هنحدّث الصفحة دي أول ما التفاصيل تتعلن. ولو عايز توصلك التفاصيل أول بأول على واتساب:</p>\n' +
          c.wa('عايز أعرف تفاصيل مشروع هايد بارك الجديد على أرض دريم لاند في أكتوبر أول ما تتعلن', 'بلّغني أول ما المشروع يتطرح') +

          '<h2>مشاريع هايد بارك في 6 أكتوبر المتاحة دلوقتي</h2>\n' +
          '<p>لو بتدوّر على هايد بارك في غرب القاهرة ومش عايز تستنى، الشركة عندها 3 مشاريع في 6 أكتوبر فيها وحدات متاحة حاليًا، كلها جنب بعض حوالين نادي الجزيرة. الأسعار من آخر تحديث لمخزون المطوّر:</p>\n' +
          c.westTable() +
          '<ul>\n' +
          '<li><a href="' + c.link('hyde-park-signature') + '">هايد بارك سيجنتشر</a>: تالت مشاريع الشركة في غرب القاهرة، حوالين حديقة مركزية 15 فدان، وأقل سعر فيه من ' + c.fmt(c.p('hyde-park-signature').startingPrice) + ' جنيه.</li>\n' +
          '<li><a href="' + c.link('hyde-park-garden-lake') + '">هايد بارك جاردن ليكس</a>: من أكبر مشاريعها في غرب القاهرة، حوالين بحيرات صناعية، وفيه شقق وفلل.</li>\n' +
          '<li><a href="' + c.link('hyde-park-tawny') + '">هايد بارك تاوني</a>: تاون هاوس وتوين هاوس وفلل بس، قدّام نادي الجزيرة.</li>\n' +
          '</ul>\n' +
          '<p>وتقدر تقارن الثلاثة بالتفصيل في <a href="/areas/october">صفحة مشاريع هايد بارك في 6 أكتوبر</a>.</p>\n'
        );
      },
      faqs: [
        { q: 'إمتى هيتطرح مشروع هايد بارك الجديد في دريم لاند؟', a: 'لسه ما اتعلنش موعد إطلاق. الاتفاقية اتوقّعت يوم 12 أكتوبر 2026، والشركة هي اللي هتعلن اسم المشروع وموعد طرحه.' },
        { q: 'أسعار مشروع هايد بارك دريم لاند كام؟', a: 'الأسعار وخطط السداد لسه ما اتعلنتش. مشاريع هايد بارك المتاحة حاليًا في 6 أكتوبر (سيجنتشر وجاردن ليكس وتاوني) أسعارها وخططها موجودة على صفحاتها.' },
        { q: 'هل المشروع الجديد هو كمبوند دريم لاند نفسه؟', a: 'لا. هايد بارك استحوذت على قطعة أرض مساحتها 415 فدانًا في التوسعات الشرقية لمدينة 6 أكتوبر كانت معروفة باسم أرض دريم لاند، وهتطوّر عليها مشروع جديد.' },
        { q: 'مين اللي باع الأرض لهايد بارك؟', a: 'الاتفاقية اتوقّعت مع الشركة المصرية لإدارة الأصول العقارية والاستثمار، المملوكة للبنك الأهلي المصري وبنك مصر.' },
        { q: 'كام مشروع لهايد بارك في غرب القاهرة؟', a: 'المشروع الجديد هيكون الرابع لهايد بارك في غرب القاهرة بعد تاوني وجاردن ليكس وسيجنتشر، والعاشر للشركة في مصر.' },
      ],
    },

    en: {
      title: 'Hyde Park acquires 415 feddans of the Dreamland land in 6th of October: what we know about the new project',
      seoTitle: 'Hyde Park Dreamland: 415 Feddans in 6th of October Explained',
      description: 'Hyde Park signed for 415 feddans of the former Dreamland land in 6th of October’s eastern expansions. What is known about the new project, and what’s available now in West Cairo.',
      lede: 'On 12 October 2026, Hyde Park Developments signed an agreement to acquire a 415-feddan plot in the eastern expansions of 6th of October City — the land formerly known as the Dreamland land — in the presence of Prime Minister Mostafa Madbouly. It will be the company’s largest project in West Cairo so far.',
      body: function (c) {
        return (
          '<h2>The news in brief</h2>\n' +
          '<ul>\n' +
          '<li><strong>Date:</strong> 12 October 2026, at the government headquarters in the New Administrative Capital.</li>\n' +
          '<li><strong>Land:</strong> 415 feddans in the eastern expansions of 6th of October City, formerly known as the Dreamland land.</li>\n' +
          '<li><strong>Parties:</strong> Hyde Park Developments (signed by managing director Amin Serag) and the Egyptian Company for Real Estate Asset Management and Investment, owned by the National Bank of Egypt and Banque Misr (signed by its chairman Karam Salah).</li>\n' +
          '<li><strong>Attended by:</strong> Prime Minister Mostafa Madbouly, Housing Minister Randa El-Menshawy and the heads of both banks.</li>\n' +
          '<li><strong>Hyde Park’s role:</strong> building, financing and marketing the residential units.</li>\n' +
          '<li><strong>In the portfolio:</strong> Hyde Park’s fourth project in West Cairo, its tenth in Egypt and its largest in West Cairo to date.</li>\n' +
          '</ul>\n' +
          '<p>The Housing Ministry said the agreement resolves a problem with the land that had lasted for decades, and the banks’ leaders described it as a model for working with developers to make better use of real estate assets.</p>\n' +

          '<h2>What is the Dreamland land?</h2>\n' +
          '<p>Dreamland is one of the oldest large real estate projects in West Cairo: Bahgat Group started it in the late 1980s on almost 2,000 feddans on the Wahat Road in 6th of October, it was among the first projects to develop that area, and it includes Dream Park, at the time the first amusement park of its kind in the Middle East. The 415 feddans Hyde Park acquired are part of the Dreamland land in the eastern expansions area and were held by a company owned by the National Bank of Egypt and Banque Misr.</p>\n' +
          '<p><strong>Note:</strong> the new project is not the existing Dreamland compound — it is a new development Hyde Park will build on this plot.</p>\n' +

          '<h2>What hasn’t been announced yet</h2>\n' +
          '<p>As of publication, neither Hyde Park nor the officials involved have announced:</p>\n' +
          '<ul>\n<li>The project’s name and launch date.</li>\n<li>Prices and payment plans.</li>\n<li>Unit types and numbers.</li>\n<li>The value of the deal.</li>\n</ul>\n' +
          '<p>We’ll update this page as soon as details are announced. To get them on WhatsApp first:</p>\n' +
          c.wa('Hi, please let me know as soon as Hyde Park’s new project on the Dreamland land in 6th of October is launched.', 'Notify me at launch') +

          '<h2>Hyde Park projects in 6th of October available now</h2>\n' +
          '<p>If you’re looking at Hyde Park in West Cairo and don’t want to wait, the company has three projects in 6th of October with units available today, all next to each other around Gezira Club. Prices are from the latest update of the developer’s inventory:</p>\n' +
          c.westTable() +
          '<ul>\n' +
          '<li><a href="' + c.link('hyde-park-signature') + '">Hyde Park Signature</a>: the company’s third West Cairo project, set around a 15-feddan central park, from EGP ' + c.fmt(c.p('hyde-park-signature').startingPrice) + '.</li>\n' +
          '<li><a href="' + c.link('hyde-park-garden-lake') + '">Hyde Park Garden Lakes</a>: one of its largest West Cairo projects, built around man-made lakes, with apartments and villas.</li>\n' +
          '<li><a href="' + c.link('hyde-park-tawny') + '">Hyde Park Tawny</a>: townhouses, twin houses and villas only, opposite Gezira Club.</li>\n' +
          '</ul>\n' +
          '<p>Compare all three in detail on the <a href="/en/areas/october">Hyde Park projects in 6th of October</a> page.</p>\n'
        );
      },
      faqs: [
        { q: 'When will Hyde Park’s new Dreamland project launch?', a: 'No launch date has been announced. The agreement was signed on 12 October 2026, and the company will announce the project’s name and launch.' },
        { q: 'What are the prices of the Hyde Park Dreamland project?', a: 'Prices and payment plans haven’t been announced yet. Hyde Park’s current projects in 6th of October (Signature, Garden Lakes and Tawny) have their prices and plans on their pages.' },
        { q: 'Is the new project the Dreamland compound itself?', a: 'No. Hyde Park acquired a 415-feddan plot in the eastern expansions of 6th of October City that was known as the Dreamland land, and will build a new project on it.' },
        { q: 'Who sold the land to Hyde Park?', a: 'The agreement was signed with the Egyptian Company for Real Estate Asset Management and Investment, owned by the National Bank of Egypt and Banque Misr.' },
        { q: 'How many Hyde Park projects are there in West Cairo?', a: 'The new project will be Hyde Park’s fourth in West Cairo after Tawny, Garden Lakes and Signature, and the company’s tenth in Egypt.' },
      ],
    },
  },
];
