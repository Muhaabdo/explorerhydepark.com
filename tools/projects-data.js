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
 */

module.exports = [
  {
    slug: 'hyde-park-central',
    pricingKey: 'hyde-central',
    inventoryName: 'Hyde Park Central',
    nameEn: 'Hyde Park Central',
    nameAr: 'هايد بارك سنترال',
    finishingLabel: 'كور آند شل',
    areaAr: 'القاهرة الجديدة',
    areaSlug: 'new-cairo',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك سنترال مشروع سكني متكامل في القاهرة الجديدة، يضم شققًا وتاون هاوس وكواد وفيلات مستقلة بمساحات متنوعة، مع خطة سداد ميسّرة تصل حتى 8 سنوات.',
    paymentPlan: { downPct: 5, years: 8 },
    amenities: ['حمامات سباحة', 'مساحات خضراء', 'أمن وحراسة', 'مطاعم وكافيهات', 'جيم', 'نادي اجتماعي', 'مدارس قريبة'],
    locationText: 'يقع هايد بارك سنترال في القاهرة الجديدة. للاستفسار عن أقرب المعالم والخدمات المحيطة بالمشروع، تواصل معنا مباشرة.',
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  {
    slug: 'hyde-park-new-cairo',
    pricingKey: 'hyde-new-cairo',
    inventoryName: 'Hyde Park New Cairo',
    nameEn: 'Hyde Park New Cairo',
    nameAr: 'هايد بارك نيو كايرو',
    finishingLabel: 'كور آند شل',
    areaAr: 'القاهرة الجديدة',
    areaSlug: 'new-cairo',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك نيو كايرو هو المجتمع السكني الرئيسي للعلامة في القاهرة الجديدة، ويضم شققًا وفيلات مستقلة وسط مساحات خضراء ممتدة.',
    paymentPlan: { downPct: 5, years: 8 },
    amenities: ['حمامات سباحة', 'مساحات خضراء', 'أمن وحراسة', 'مطاعم وكافيهات', 'جيم', 'مدارس قريبة'],
    locationText: 'يقع هايد بارك نيو كايرو في قلب القاهرة الجديدة. للاستفسار عن أقرب المعالم والخدمات المحيطة بالمشروع، تواصل معنا مباشرة.',
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  {
    slug: 'hyde-park-terraces',
    pricingKey: 'hyde-terraces',
    inventoryName: null,
    nameEn: 'Hyde Park Terraces',
    nameAr: 'هايد بارك تراسيس',
    finishingLabel: 'كور آند شل',
    areaAr: 'القاهرة الجديدة',
    areaSlug: 'new-cairo',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك تراسيس مشروع سكني في القاهرة الجديدة يضم تاون هاوس وفيلات مستقلة بتصميم يعتمد على التراسات المفتوحة. * يُرجى التأكد من الاسم الرسمي بالإنجليزية للمشروع.',
    paymentPlan: { downPct: 10, years: 8 },
    amenities: ['حمامات سباحة', 'مساحات خضراء', 'أمن وحراسة', 'مطاعم وكافيهات', 'مدارس قريبة'],
    locationText: 'يقع هايد بارك تراسيس في القاهرة الجديدة. للاستفسار عن أقرب المعالم والخدمات المحيطة بالمشروع، تواصل معنا مباشرة.',
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  {
    slug: 'hyde-park-tawny',
    pricingKey: 'tawny',
    inventoryName: null,
    nameEn: 'Hyde Park Tawny',
    nameAr: 'هايد بارك تاوني',
    finishingLabel: 'كور آند شل',
    areaAr: 'أكتوبر',
    areaSlug: 'october',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك تاوني مشروع سكني في مدينة 6 أكتوبر يجمع بين التاون هاوس والتوين هاوس والفيلات المستقلة بتصميم عصري. * يُرجى أيضًا التأكد من الاسم الرسمي بالإنجليزية للمشروع.',
    paymentPlan: { downPct: 10, years: 7 },
    amenities: ['حمامات سباحة', 'مساحات خضراء', 'أمن وحراسة', 'نادي اجتماعي', 'مدارس قريبة'],
    locationText: 'يقع هايد بارك تاوني في مدينة 6 أكتوبر. للاستفسار عن أقرب المعالم والخدمات المحيطة بالمشروع، تواصل معنا مباشرة.',
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  {
    slug: 'hyde-park-garden-lake',
    pricingKey: 'garden-lakes',
    inventoryName: 'Garden Lakes',
    nameEn: 'Hyde Park Garden Lake',
    nameAr: 'هايد بارك جاردن ليك',
    finishingLabel: 'كور آند شل',
    areaAr: 'أكتوبر',
    areaSlug: 'october',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك جاردن ليك مشروع سكني في 6 أكتوبر يتميز بإطلالات على بحيرة صناعية ومساحات خضراء واسعة، ويضم شققًا وتاون هاوس وتوين هاوس وفيلات مستقلة.',
    paymentPlan: { downPct: 10, years: 8 },
    amenities: ['بحيرة صناعية', 'مساحات خضراء', 'أمن وحراسة', 'مطاعم وكافيهات', 'جيم', 'مدارس قريبة'],
    locationText: 'يقع هايد بارك جاردن ليك في مدينة 6 أكتوبر. للاستفسار عن أقرب المعالم والخدمات المحيطة بالمشروع، تواصل معنا مباشرة.',
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  {
    slug: 'hyde-park-signature',
    pricingKey: 'signature',
    inventoryName: 'HP Signature',
    nameEn: 'Hyde Park Signature',
    nameAr: 'هايد بارك سيجنتشر',
    finishingLabel: 'كور آند شل',
    areaAr: 'أكتوبر',
    areaSlug: 'october',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك سيجنتشر هو الطراز الفاخر من علامة هايد بارك في 6 أكتوبر، بشقق وتاون هاوس وتوين هاوس وفيلات مستقلة وتشطيبات راقية.',
    paymentPlan: { downPct: 10, years: 8 },
    amenities: ['حمامات سباحة', 'مساحات خضراء', 'أمن وحراسة 24 ساعة', 'مطاعم وكافيهات', 'جيم وسبا', 'نادي اجتماعي'],
    locationText: 'يقع هايد بارك سيجنتشر في مدينة 6 أكتوبر. للاستفسار عن أقرب المعالم والخدمات المحيطة بالمشروع، تواصل معنا مباشرة.',
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
  {
    slug: 'hyde-park-sea-shore',
    pricingKey: 'seashore',
    inventoryName: 'Seashore Ras El Hekma',
    nameEn: 'Hyde Park Sea Shore',
    nameAr: 'هايد بارك سي شور',
    finishingLabel: 'كور آند شل',
    areaAr: 'الساحل الشمالي',
    areaSlug: 'north-coast',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: 'هايد بارك سي شور مشروع ساحلي على الساحل الشمالي يضم شققًا وشاليهات وتاون هاوس وتوين هاوس وفيلات على البحر مباشرة.',
    paymentPlan: { downPct: 10, years: 6 },
    amenities: ['شاطئ خاص', 'حمامات سباحة', 'أمن وحراسة', 'مطاعم وكافيهات', 'نادي شاطئي'],
    locationText: 'يقع هايد بارك سي شور على الساحل الشمالي. للاستفسار عن أقرب المعالم والخدمات المحيطة بالمشروع، تواصل معنا مباشرة.',
    deliveryYear: null,
    distances: [],
    mapsUrl: '',
    finishingCostNote: '',
  },
];
