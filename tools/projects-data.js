/**
 * Source of truth for Hyde Park project CONTENT (copy, amenities, location,
 * generic FAQs). Pricing/units/available-count come from `pricing.json`
 * (developer inventory export) and are merged in at build time by
 * `pricingKey` — edit prices there, not here.
 *
 * After editing either file, run `node tools/build-pages.js` to regenerate
 * the static pages in /projects and the project cards on the homepage.
 *
 * inventoryName: the project's name in the developer's availability report
 *   ("project Name" column — see tools/import-availability.py; null when the
 *   report doesn't include it) — unit-level detail is derived from there.
 * nameAr: Arabic name used in headings and the summary paragraph.
 * finishingLabel: text of the "التشطيب" fact (and the finishing clause in the
 *   summary) — set by hand per project; empty string hides both.
 *   'كور آند شل' also turns on the Core & Shell FAQ and lead-form note.
 *
 * Optional (V5 spec §4) — leave empty and the page simply omits the element:
 *   distances: [{ place: '...', minutes: 10 }]  → "أهم المعالم القريبة" list
 *     (minutes optional — omit when no source gives them; `note` shows instead)
 *   No delivery year on purpose: delivery differs by phase/unit inside a project.
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
 *     → "مراحل المشروع" block in the overview. Empty array hides it. A phase
 *     with `slug` (a project of its own on the site) links to that page.
 *   parentSlug: this project sits inside another one (One Hyde Park → Hyde Park
 *     New Cairo) — adds it to the breadcrumb and a linked line in the overview.
 *   kind: 'commercial' for offices / clinics — own group on the homepage, kept
 *     out of the residential comparisons and area hubs, business-oriented form.
 */

module.exports = [
  // Sources (Oct 2026): nawy.com compound page (220 فدان, phases), aqarmap listing copy (Middle Ring Road, 85% open space), followict.news 12 May 2026 (Water Residences 37 acres, 5%/10y, 1 min from HP New Cairo); nawy.com compound page (nearby landmarks, no minutes given).
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
    locationText: 'يقع هايد بارك سنترال في التجمع السادس بالقاهرة الجديدة، مباشرة على الطريق الدائري الأوسطي، وعلى بُعد دقيقة من هايد بارك نيو كايرو.',
    aboutAr: 'هايد بارك سنترال رابع مشاريع هايد بارك في شرق القاهرة، ويقع في التجمع السادس مباشرة على الطريق الدائري الأوسطي، على بُعد دقيقة واحدة من هايد بارك نيو كايرو. يمتد المشروع على مساحة تقارب 220 فدانًا، والمخطط العام يخصص حوالي 85% من الأرض للمساحات المفتوحة والخضراء. في مايو 2026 أطلق المطوّر مرحلة ووتر ريزيدنسز على مساحة 37 فدانًا داخل المشروع.',
    phases: [
      { name: 'Central Residence', nameAr: 'سنترال ريزيدنس', note: 'من المراحل السكنية في المشروع.' },
      { name: 'Water Residences', nameAr: 'ووتر ريزيدنسز', note: 'مرحلة على 37 فدانًا أُطلقت في مايو 2026، بمقدم يبدأ من 5% وتقسيط حتى 10 سنوات وفق إعلان المطوّر.' },
    ],
    distances: [
      { place: 'الجامعة الأمريكية بالقاهرة' },
      { place: 'الجامعة الألمانية' },
      { place: 'بوينت 90 مول' },
      { place: 'المستشفى الجوي' },
      { place: 'هايد بارك نيو كايرو', minutes: 1 },
    ],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): followict.news (HP New Cairo = company's first project), zawya.com One Hyde Park release (Ryze Club inside HP New Cairo), Amin Serag LinkedIn post (Safa Hospitals medical plex); nawy.com/compound/38-hyde-park (Road 90, airport 20 min).
  {
    slug: 'hyde-park-new-cairo',
    pricingKey: 'hyde-new-cairo',
    inventoryName: 'Hyde Park Residential',
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
    locationText: 'يقع هايد بارك نيو كايرو في التجمع الخامس بالقاهرة الجديدة على شارع التسعين، وعلى بُعد دقيقة من هايد بارك سنترال.',
    aboutAr: 'هايد بارك نيو كايرو أول مشروع لشركة هايد بارك للتطوير العقاري والمجتمع السكني الرئيسي للعلامة في القاهرة الجديدة. داخل المشروع نادي Ryze Club اللي بيخدم كمان سكان المشاريع الجديدة القريبة، والمطوّر وقّع مع مستشفيات صفا لإنشاء مجمع طبي يخدم سكان المجتمع.',
    phases: [
      { name: 'One Hyde Park', nameAr: 'وان هايد بارك', slug: 'one-hyde-park', note: 'كمبوند مقفول جوه هايد بارك نيو كايرو، أُطلق في سبتمبر 2026 بشقق ودوبلكس وسكاي فيلا وفيلات.' },
    ],
    distances: [
      { place: 'الجامعة الأمريكية بالقاهرة' },
      { place: 'شارع التسعين' },
      { place: 'هايد بارك سنترال', minutes: 1 },
      { place: 'مطار القاهرة الدولي', minutes: 20 },
    ],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): Abdo (gated compound inside Hyde Park Residential / HP New Cairo); invest-gate.me 8 Sep 2026 launch article (240 feddans, ~8,500 units, 6 towers, 75–377 m², two international schools, rowing lake, internal shuttle, Ryze Club access, travel times); nawy.com/compound/2644 (5% down / 8 years, Core & Shell, Road 90).
  {
    slug: 'one-hyde-park',
    pricingKey: 'one-hyde-park',
    inventoryName: 'One Hyde Park',
    nameEn: 'One Hyde Park',
    nameAr: 'وان هايد بارك',
    parentSlug: 'hyde-park-new-cairo',
    finishingLabel: 'كور آند شل',
    areaAr: 'القاهرة الجديدة',
    areaSlug: 'new-cairo',
    areaDetailAr: 'التجمع الخامس',
    seoTitle: '',
    metaDescription: '',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: '',
    paymentPlan: { downPct: 5, years: 8 },
    amenities: ['بحيرة للتجديف', 'مدرستين دوليتين', 'مساحات خضراء', 'شاتل داخلي', 'محلات وخدمات', 'نادي Ryze Club', 'أمن وحراسة'],
    locationText: 'يقع وان هايد بارك في التجمع الخامس بالقاهرة الجديدة جوه مجتمع هايد بارك نيو كايرو، ومتصل مباشرة بالطريق الدائري الأوسطي.',
    aboutAr: 'وان هايد بارك كمبوند مقفول جوه هايد بارك نيو كايرو، أطلقته هايد بارك للتطوير العقاري في سبتمبر 2026 على مساحة حوالي 240 فدانًا وبحوالي 8,500 وحدة. المشروع فيه 6 أبراج وُصفت بأنها الأعلى في التجمع الخامس، مع شقق ودوبلكس وسكاي فيلا وجاردن فيلا وتاون هاوس وتوين هاوس وفيلات مستقلة بمساحات من 75 لـ 377 م². من خدماته مدرستين دوليتين وبحيرة رئيسية للتجديف وشاتل داخلي، وسكانه بيستخدموا نادي Ryze Club في هايد بارك نيو كايرو.',
    phases: [],
    distances: [
      { place: 'محور محمد نجيب', minutes: 7 },
      { place: 'شارع جمال عبد الناصر', minutes: 9 },
      { place: 'الجامعة الأمريكية بالقاهرة', minutes: 10 },
      { place: 'العاصمة الإدارية الجديدة', minutes: 12 },
      { place: 'طريق العين السخنة', minutes: 15 },
      { place: 'مطار القاهرة الدولي', minutes: 25 },
    ],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): nawy.com/compound/2583-hyde-park-terraces (102 acres, Old Sokhna × Talaat Harb, in front of GUC, next to HP Views, 85% open); zawya.com (East Cairo portfolio).
  {
    slug: 'hyde-park-terraces',
    pricingKey: 'hyde-terraces',
    inventoryName: 'Terraces',
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
    locationText: 'يقع هايد بارك تراسيس في القاهرة الجديدة عند تقاطع طريق السخنة القديم مع طريق طلعت حرب، قدّام الجامعة الألمانية مباشرة وجنب هايد بارك فيوز.',
    aboutAr: 'هايد بارك تراسيس من أحدث إطلاقات هايد بارك في شرق القاهرة لسنة 2026، ويركّز على التاون هاوس والفيلات المستقلة بتصميم معتمد على التراسات المفتوحة. المشروع على مساحة حوالي 102 فدان عند تقاطع طريق السخنة القديم مع طريق طلعت حرب، قدّام الجامعة الألمانية وجنب هايد بارك فيوز، وحوالي 85% من مساحته لاندسكيب ومساحات مفتوحة.',
    phases: [],
    distances: [
      { place: 'الجامعة الألمانية بالقاهرة', note: 'قدّام المشروع' },
      { place: 'هايد بارك فيوز', note: 'جنب المشروع' },
      { place: 'الجامعة الأمريكية بالقاهرة' },
      { place: 'شارع التسعين' },
    ],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): invest-gate.me Signature launch article (Tawny + Garden Lakes earlier in West Cairo); nawy.com/ar/compound/384 (31 feddans, in front of Gezira Club, minutes to landmarks).
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
    locationText: 'يقع هايد بارك تاوني في قلب مدينة 6 أكتوبر، قدّام نادي الجزيرة مباشرة، وقريب من محور 26 يوليو وطريق الواحات.',
    aboutAr: 'تاوني واحد من أول مشروعين لهايد بارك في غرب القاهرة مع جاردن ليكس، وبعدهم جه سيجنتشر. المشروع مخصص للتاون هاوس والتوين هاوس والفيلات المستقلة، على مساحة حوالي 31 فدانًا قدّام نادي الجزيرة مباشرة.',
    phases: [],
    distances: [
      { place: 'نادي الجزيرة', note: 'قدّام المشروع' },
      { place: 'مول مصر', minutes: 3 },
      { place: 'مدرسة الألسن', minutes: 3 },
      { place: 'طريق الواحات', minutes: 12 },
      { place: 'محور 26 يوليو', minutes: 14 },
      { place: 'أهرامات الجيزة', minutes: 25 },
    ],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): invest-gate.me 'Final Phase of Garden Lakes' (Park Residences, 85/15, near Gezira Club & Mall of Arabia); nawy.com blog (10 min from Juhayna Square); nawy.com/compound/798-garden-lakes (minutes to landmarks).
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
    locationText: 'يقع جاردن ليكس في مدينة 6 أكتوبر غرب القاهرة، قريب من نادي الجزيرة ومول العرب، ودقائق من محور 26 يوليو وطريق القاهرة الإسكندرية الصحراوي.',
    aboutAr: 'جاردن ليكس (Garden Lakes) من أكبر مشاريع هايد بارك في غرب القاهرة، ومصمم حوالين بحيرات صناعية ومساحات خضراء: حوالي 85% من أرض المشروع لاندسكيب ومساحات مفتوحة و15% بس مباني. آخر مراحله بارك ريزيدنسز (Park Residences)، ومتمحورة حوالين حديقة مركزية وبحيرة.',
    phases: [
      { name: 'Park Residences', nameAr: 'بارك ريزيدنسز', note: 'المرحلة الأخيرة في المشروع، حوالين حديقة مركزية وبحيرة.' },
    ],
    distances: [
      { place: 'مدرسة الألسن', minutes: 3 },
      { place: 'مول مصر', minutes: 5 },
      { place: 'محور 26 يوليو', minutes: 5 },
      { place: 'طريق القاهرة الإسكندرية الصحراوي', minutes: 5 },
      { place: 'ميدان جهينة', minutes: 10 },
      { place: 'أهرامات الجيزة', minutes: 25 },
    ],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): invest-gate.me 'Hyde Park Signature' launch (≈910 units, 15-feddan park, next to Gezira Club, minutes from GEM); nawy.com/compound/1793 (next to Garden Lakes, near Tawny, Mall of Arabia).
  {
    slug: 'hyde-park-signature',
    pricingKey: 'signature',
    inventoryName: 'Signature',
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
    locationText: 'يقع هايد بارك سيجنتشر في مدينة 6 أكتوبر غرب القاهرة، جنب جاردن ليكس وقدّام نادي الجزيرة، وعلى بُعد دقائق من المتحف المصري الكبير.',
    aboutAr: 'هايد بارك سيجنتشر تالت مشاريع هايد بارك في غرب القاهرة بعد تاوني وجاردن ليكس، ويضم حوالي 910 وحدة سكنية حوالين حديقة مركزية مساحتها 15 فدانًا فيها مساحات عمل مفتوحة ومكاتب وخدمات. المشروع جنب نادي الجزيرة وعلى بُعد دقائق من المتحف المصري الكبير.',
    phases: [],
    distances: [
      { place: 'نادي الجزيرة', note: 'قدّام المشروع' },
      { place: 'جاردن ليكس', note: 'جنب المشروع' },
      { place: 'تاوني هايد بارك', note: 'قريب' },
      { place: 'مول العرب' },
      { place: 'المتحف المصري الكبير' },
    ],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): hapijournal.com 4 Aug 2025 (Waterside launch, 240 feddan, EGP 32.2bn), nawy.com compound page (25+ pools, Shore Ville), nawy.com compound page (landmarks; km marker conflicts 207 vs 214 elsewhere, so none shown), invest-gate.me (Lagoon Town, Shore Residences 2026).
  {
    slug: 'hyde-park-sea-shore',
    pricingKey: 'seashore',
    inventoryName: 'Hyde Park North',
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
    locationText: 'يقع هايد بارك سي شور في رأس الحكمة بالساحل الشمالي على طريق الإسكندرية – مطروح الصحراوي، أكتر منطقة عليها طلب واستثمار في الساحل حاليًا.',
    aboutAr: 'سي شور (Seashore) أول مشاريع هايد بارك في الساحل الشمالي، في منطقة رأس الحكمة على مساحة 240 فدانًا وباستثمارات حوالي 32.2 مليار جنيه وفق المطوّر. القرية فيها أكتر من 25 حمام سباحة، واتطرحت على مراحل منها شور فيل ولاجون تاون وووترسايد، وآخرها شور ريزيدنسز في 2026.',
    phases: [
      { name: 'Shore Ville', nameAr: 'شور فيل', note: 'من مراحل القرية السكنية.' },
      { name: 'Lagoon Town', nameAr: 'لاجون تاون', note: 'مرحلة داخل سي شور أعلن عنها المطوّر في رأس الحكمة.' },
      { name: 'Waterside', nameAr: 'ووترسايد', note: 'أُطلقت في أغسطس 2025، ووحداتها بتطل على البحيرات الشاطئية.' },
      { name: 'Shore Residences', nameAr: 'شور ريزيدنسز', note: 'أحدث مرحلة، أُطلقت في 2026.' },
    ],
    distances: [
      { place: 'مطار العلمين الدولي' },
      { place: 'أبراج العلمين' },
      { place: 'مطار مرسى مطروح' },
    ],
    mapsUrl: '',
    finishingCostNote: '',
  },
  // Sources (Oct 2026): corporate.nawy.com/compound/198-hyde-park-business-district (Road 90 entrance, link to New Ring Road, ~70% greenery, executive triplex offices, conference centre, piazza, underground parking, 5% / 8 years, ~20 min to the New Capital, next to HydeOut).
  {
    slug: 'hyde-park-business-district',
    pricingKey: 'business-district',
    inventoryName: 'Business District',
    nameEn: 'Hyde Park Business District',
    nameAr: 'هايد بارك بيزنس ديستريكت',
    kind: 'commercial',
    parentSlug: 'hyde-park-new-cairo',
    finishingLabel: 'كور آند شل',
    areaAr: 'القاهرة الجديدة',
    areaSlug: 'new-cairo',
    areaDetailAr: 'التجمع الخامس',
    seoTitle: '',
    metaDescription: '',
    heroPlaceholder: 'صورة المشروع (خارجية / رندر)',
    intro: '',
    paymentPlan: { downPct: 5, years: 8 },
    amenities: ['مركز مؤتمرات', 'بيازا بنافورات', 'جراج تحت الأرض', 'أمن 24 ساعة', 'مولد كهرباء احتياطي', 'تكييف مركزي', 'ألياف ضوئية'],
    locationText: 'يقع هايد بارك بيزنس ديستريكت في التجمع الخامس بالقاهرة الجديدة، ومدخله الرئيسي على شارع التسعين المتصل بالطريق الدائري الجديد، وجنب مول هايد أوت.',
    aboutAr: 'هايد بارك بيزنس ديستريكت المنطقة الإدارية والتجارية في هايد بارك نيو كايرو، وفيه مكاتب إدارية بمساحات مختلفة، منها مكاتب تنفيذية تريبلكس على تلات أدوار. حوالي 70% من مساحة المشروع مساحات خضراء ولاندسكيب، والمباني فوق جراج تحت الأرض، ومن خدماته مركز مؤتمرات وبيازا بنافورات وأماكن للجلوس، ومحلات وكافيهات ومطاعم على مسافة مشي.',
    phases: [],
    distances: [
      { place: 'شارع التسعين', note: 'المدخل الرئيسي' },
      { place: 'مول هايد أوت', note: 'جنب المشروع' },
      { place: 'الطريق الدائري الجديد' },
      { place: 'العاصمة الإدارية الجديدة', minutes: 20 },
    ],
    mapsUrl: '',
    finishingCostNote: '',
  },
];
