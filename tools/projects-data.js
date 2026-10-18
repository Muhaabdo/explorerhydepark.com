/**
 * Source of truth for Hyde Park project CONTENT (copy, amenities, location,
 * generic FAQs). Pricing/units/available-count come from `pricing.json`
 * (developer inventory export) and are merged in at build time by
 * `pricingKey` — edit prices there, not here.
 *
 * After editing either file, run `node tools/build-pages.js` to regenerate
 * the static pages in /projects and the project cards on the homepage.
 *
 * inventoryName: the project's name inside inventory.json (null when the
 *   export doesn't include it) — unit-level detail is derived from there.
 * nameAr: Arabic name used in headings and the summary paragraph.
 * finishingLabel: text of the "التشطيب" fact (and the finishing clause in the
 *   summary) — set by hand per project; empty string hides both.
 *   'كور آند شل' also turns on the Core & Shell FAQ and lead-form note.
 *
 * Optional (V5 spec §4) — leave empty and the page simply omits the element:
 *   deliveryYear: 2028                          → "الاستلام" fact
 *   distances: [{ place: '...', minutes: 10 }]  → location list
 *   mapsUrl: 'https://maps.google.com/...'      → "افتح على Google Maps" link
 *   finishingCostNote: '...'                    → sentence in the Core & Shell FAQ
 *
 * SEO (Oct 2026):
 *   areaDetailAr: the exact district people search with ('التجمع السادس',
 *     'رأس الحكمة'); used in the <title>, meta description and H1 area line.
 *     Empty string → falls back to areaAr.
 *   seoTitle: hand-written <title> override; empty → built automatically as
 *     "<nameAr> <district> — أسعار <year> ومقدم <down>%".
 *   metaDescription: hand-written override; empty → built from pricing.json.
 *   aboutAr: project-specific paragraph (facts only — keep sources below).
 *   phases: [{ name: 'Water Residences', nameAr: 'ووتر ريزيدنسز', note: '...' }]
 *     → "مراحل المشروع" block in the overview. Empty array hides it.
 */

module.exports = [
  // Sources (Oct 2026): nawy.com compound page (220 فدان, phases), aqarmap listing copy (Middle Ring Road, 85% open space), followict.news 12 May 2026 (Water Residences 37 acres, 5%/10y, 1 min from HP New Cairo).
  {
    slug: 'hyde-park-central',
    pricingKey: 'hyde-central',
    inventoryName: 'Hyde Park Central',
    nameEn: 'Hyde Park Central',
    nameAr: 'هايد بارك سنترال',
    finishingLabel: 'كور آند شل',
    areaAr: 'القاهرة الجديدة',
    areaSlug: 'new-cairo',
    areaDetailAr: 'التجمع السادس',
    seoTitle: '',
    metaDescription: '',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك سنترال مشروع سكني متكامل في القاهرة الجديدة، يضم شققًا وتاون هاوس وكواد وفيلات مستقلة بمساحات متنوعة، مع خطة سداد ميسّرة تصل حتى 8 سنوات.',
    paymentPlan: { downPct: 5, years: 8 },
    amenities: ['حمامات سباحة', 'مساحات خضراء', 'أمن وحراسة', 'مطاعم وكافيهات', 'جيم', 'نادي اجتماعي', 'مدارس قريبة'],
    locationText: 'يقع هايد بارك سنترال في التجمع السادس بالقاهرة الجديدة، مباشرة على الطريق الدائري الأوسطي، وعلى بُعد دقيقة من هايد بارك نيو كايرو. المسافات بالدقائق لأقرب المعالم متاحة مع فريقنا على واتساب.',
    aboutAr: 'هايد بارك سنترال رابع مشاريع هايد بارك في شرق القاهرة، ويقع في التجمع السادس مباشرة على الطريق الدائري الأوسطي، على بُعد دقيقة واحدة من هايد بارك نيو كايرو. يمتد المشروع على مساحة تقارب 220 فدانًا، والمخطط العام يخصص حوالي 85% من الأرض للمساحات المفتوحة والخضراء. في مايو 2026 أطلق المطوّر مرحلة ووتر ريزيدنسز على مساحة 37 فدانًا داخل المشروع.',
    phases: [
      { name: 'Central Residence', nameAr: 'سنترال ريزيدنس', note: 'من المراحل السكنية في المشروع.' },
      { name: 'Water Residences', nameAr: 'ووتر ريزيدنسز', note: 'مرحلة على 37 فدانًا أُطلقت في مايو 2026، بمقدم يبدأ من 5% وتقسيط حتى 10 سنوات وفق إعلان المطوّر.' },
    ],
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): followict.news (HP New Cairo = company's first project), zawya.com One Hyde Park release (Ryze Club inside HP New Cairo), Amin Serag LinkedIn post (Safa Hospitals medical plex).
  {
    slug: 'hyde-park-new-cairo',
    pricingKey: 'hyde-new-cairo',
    inventoryName: 'Hyde Park New Cairo',
    nameEn: 'Hyde Park New Cairo',
    nameAr: 'هايد بارك نيو كايرو',
    finishingLabel: 'كور آند شل',
    areaAr: 'القاهرة الجديدة',
    areaSlug: 'new-cairo',
    areaDetailAr: 'التجمع الخامس',
    seoTitle: '',
    metaDescription: '',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك نيو كايرو هو المجتمع السكني الرئيسي للعلامة في القاهرة الجديدة، ويضم شققًا وفيلات مستقلة وسط مساحات خضراء ممتدة.',
    paymentPlan: { downPct: 5, years: 8 },
    amenities: ['حمامات سباحة', 'مساحات خضراء', 'أمن وحراسة', 'مطاعم وكافيهات', 'جيم', 'مدارس قريبة'],
    locationText: 'يقع هايد بارك نيو كايرو في التجمع الخامس بالقاهرة الجديدة، وعلى بُعد دقيقة من هايد بارك سنترال. المسافات بالدقائق لأقرب المعالم متاحة مع فريقنا على واتساب.',
    aboutAr: 'هايد بارك نيو كايرو أول مشروع لشركة هايد بارك للتطوير العقاري والمجتمع السكني الرئيسي للعلامة في القاهرة الجديدة. داخل المشروع نادي Ryze Club اللي بيخدم كمان سكان المشاريع الجديدة القريبة، والمطوّر وقّع مع مستشفيات صفا لإنشاء مجمع طبي يخدم سكان المجتمع.',
    phases: [],
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): invest-gate.me Hyde Park tag page (Terraces launch, construction started pre-launch, delivery within two years); zawya.com (East Cairo portfolio).
  {
    slug: 'hyde-park-terraces',
    pricingKey: 'hyde-terraces',
    inventoryName: null,
    nameEn: 'Hyde Park Terraces',
    nameAr: 'هايد بارك تراسيس',
    finishingLabel: 'كور آند شل',
    areaAr: 'القاهرة الجديدة',
    areaSlug: 'new-cairo',
    areaDetailAr: '',
    seoTitle: '',
    metaDescription: '',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك تراسيس مشروع سكني في القاهرة الجديدة يضم تاون هاوس وفيلات مستقلة بتصميم يعتمد على التراسات المفتوحة.',
    paymentPlan: { downPct: 10, years: 8 },
    amenities: ['حمامات سباحة', 'مساحات خضراء', 'أمن وحراسة', 'مطاعم وكافيهات', 'مدارس قريبة'],
    locationText: 'يقع هايد بارك تراسيس في القاهرة الجديدة ضمن مشاريع هايد بارك في شرق القاهرة. المسافات بالدقائق لأقرب المعالم متاحة مع فريقنا على واتساب.',
    aboutAr: 'هايد بارك تراسيس من أحدث إطلاقات هايد بارك في شرق القاهرة لسنة 2026، ويركّز على التاون هاوس والفيلات المستقلة بتصميم معتمد على التراسات المفتوحة. المطوّر أعلن إنه بدأ أعمال الإنشاء قبل الإطلاق الرسمي، ومستهدف التسليم خلال سنتين.',
    phases: [],
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): invest-gate.me Signature launch article (Tawny + Garden Lakes earlier in West Cairo; Tawny handovers scheduled before end of 2025).
  {
    slug: 'hyde-park-tawny',
    pricingKey: 'tawny',
    inventoryName: null,
    nameEn: 'Hyde Park Tawny',
    nameAr: 'هايد بارك تاوني',
    finishingLabel: 'كور آند شل',
    areaAr: 'أكتوبر',
    areaSlug: 'october',
    areaDetailAr: '6 أكتوبر',
    seoTitle: '',
    metaDescription: '',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك تاوني مشروع سكني في مدينة 6 أكتوبر يجمع بين التاون هاوس والتوين هاوس والفيلات المستقلة بتصميم عصري.',
    paymentPlan: { downPct: 10, years: 7 },
    amenities: ['حمامات سباحة', 'مساحات خضراء', 'أمن وحراسة', 'نادي اجتماعي', 'مدارس قريبة'],
    locationText: 'يقع هايد بارك تاوني في مدينة 6 أكتوبر غرب القاهرة. المسافات بالدقائق لأقرب المعالم متاحة مع فريقنا على واتساب.',
    aboutAr: 'تاوني واحد من أول مشروعين لهايد بارك في غرب القاهرة مع جاردن ليكس، وبعدهم جه سيجنتشر. المشروع مخصص للتاون هاوس والتوين هاوس والفيلات المستقلة، والمطوّر كان معلن إن تسليمات تاوني مجدولة قبل نهاية 2025.',
    phases: [],
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): invest-gate.me 'Final Phase of Garden Lakes' (Park Residences, 85/15, near Gezira Club & Mall of Arabia); nawy.com blog (10 min from Juhayna Square).
  {
    slug: 'hyde-park-garden-lake',
    pricingKey: 'garden-lakes',
    inventoryName: 'Garden Lakes',
    nameEn: 'Hyde Park Garden Lakes',
    nameAr: 'هايد بارك جاردن ليكس',
    finishingLabel: 'كور آند شل',
    areaAr: 'أكتوبر',
    areaSlug: 'october',
    areaDetailAr: '6 أكتوبر',
    seoTitle: '',
    metaDescription: '',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك جاردن ليكس مشروع سكني في 6 أكتوبر يتميز بإطلالات على بحيرة صناعية ومساحات خضراء واسعة، ويضم شققًا وتاون هاوس وتوين هاوس وفيلات مستقلة.',
    paymentPlan: { downPct: 10, years: 8 },
    amenities: ['بحيرة صناعية', 'مساحات خضراء', 'أمن وحراسة', 'مطاعم وكافيهات', 'جيم', 'مدارس قريبة'],
    locationText: 'يقع جاردن ليكس في مدينة 6 أكتوبر غرب القاهرة، على بُعد حوالي 10 دقائق من ميدان جهينة، وقريب من نادي الجزيرة ومول العرب. المسافات بالتفصيل متاحة مع فريقنا على واتساب.',
    aboutAr: 'جاردن ليكس (Garden Lakes) من أكبر مشاريع هايد بارك في غرب القاهرة، ومصمم حوالين بحيرات صناعية ومساحات خضراء: حوالي 85% من أرض المشروع لاندسكيب ومساحات مفتوحة و15% بس مباني. آخر مراحله بارك ريزيدنسز (Park Residences)، ومتمحورة حوالين حديقة مركزية وبحيرة.',
    phases: [
      { name: 'Park Residences', nameAr: 'بارك ريزيدنسز', note: 'المرحلة الأخيرة في المشروع، حوالين حديقة مركزية وبحيرة.' },
    ],
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): invest-gate.me 'Hyde Park Signature' launch (≈910 units, 15-feddan park, next to Gezira Club, minutes from GEM).
  {
    slug: 'hyde-park-signature',
    pricingKey: 'signature',
    inventoryName: 'HP Signature',
    nameEn: 'Hyde Park Signature',
    nameAr: 'هايد بارك سيجنتشر',
    finishingLabel: 'كور آند شل',
    areaAr: 'أكتوبر',
    areaSlug: 'october',
    areaDetailAr: '6 أكتوبر',
    seoTitle: '',
    metaDescription: '',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك سيجنتشر هو الطراز الفاخر من علامة هايد بارك في 6 أكتوبر، بشقق وتاون هاوس وتوين هاوس وفيلات مستقلة وتشطيبات راقية.',
    paymentPlan: { downPct: 10, years: 8 },
    amenities: ['حمامات سباحة', 'مساحات خضراء', 'أمن وحراسة 24 ساعة', 'مطاعم وكافيهات', 'جيم وسبا', 'نادي اجتماعي'],
    locationText: 'يقع هايد بارك سيجنتشر في مدينة 6 أكتوبر غرب القاهرة، جنب نادي الجزيرة وعلى بُعد دقائق من المتحف المصري الكبير. المسافات بالتفصيل متاحة مع فريقنا على واتساب.',
    aboutAr: 'هايد بارك سيجنتشر تالت مشاريع هايد بارك في غرب القاهرة بعد تاوني وجاردن ليكس، ويضم حوالي 910 وحدة سكنية حوالين حديقة مركزية مساحتها 15 فدانًا فيها مساحات عمل مفتوحة ومكاتب وخدمات. المشروع جنب نادي الجزيرة وعلى بُعد دقائق من المتحف المصري الكبير.',
    phases: [],
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): hapijournal.com 4 Aug 2025 (Waterside launch, 240 feddan, EGP 32.2bn), nawy.com compound page (25+ pools, Shore Ville), bayut.eg listing copy (km 214), invest-gate.me (Lagoon Town, Shore Residences 2026).
  {
    slug: 'hyde-park-sea-shore',
    pricingKey: 'seashore',
    inventoryName: 'Seashore Ras El Hekma',
    nameEn: 'Hyde Park Sea Shore',
    nameAr: 'هايد بارك سي شور',
    finishingLabel: 'كور آند شل',
    areaAr: 'الساحل الشمالي',
    areaSlug: 'north-coast',
    areaDetailAr: 'رأس الحكمة',
    seoTitle: '',
    metaDescription: '',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك سي شور مشروع ساحلي على الساحل الشمالي يضم شققًا وشاليهات وتاون هاوس وتوين هاوس وفيلات على البحر مباشرة.',
    paymentPlan: { downPct: 10, years: 6 },
    amenities: ['شاطئ خاص', 'حمامات سباحة', 'أمن وحراسة', 'مطاعم وكافيهات', 'نادي شاطئي'],
    locationText: 'يقع هايد بارك سي شور في رأس الحكمة بالساحل الشمالي عند الكيلو 214 تقريبًا، أكتر منطقة عليها طلب واستثمار في الساحل حاليًا. المسافات بالتفصيل متاحة مع فريقنا على واتساب.',
    aboutAr: 'سي شور (Seashore) أول مشاريع هايد بارك في الساحل الشمالي، في منطقة رأس الحكمة على مساحة 240 فدانًا وباستثمارات حوالي 32.2 مليار جنيه وفق المطوّر. القرية فيها أكتر من 25 حمام سباحة، واتطرحت على مراحل منها شور فيل ولاجون تاون وووترسايد، وآخرها شور ريزيدنسز في 2026.',
    phases: [
      { name: 'Shore Ville', nameAr: 'شور فيل', note: 'من مراحل القرية السكنية.' },
      { name: 'Lagoon Town', nameAr: 'لاجون تاون', note: 'مرحلة داخل سي شور أعلن عنها المطوّر في رأس الحكمة.' },
      { name: 'Waterside', nameAr: 'ووترسايد', note: 'أُطلقت في أغسطس 2025، ووحداتها بتطل على البحيرات الشاطئية.' },
      { name: 'Shore Residences', nameAr: 'شور ريزيدنسز', note: 'أحدث مرحلة، أُطلقت في 2026.' },
    ],
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
];
