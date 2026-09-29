# Project Page V5 — Implementation Spec

> **ملخص بالعربي:** ده المرجع اللي Claude Code بيشتغل منه عشان ينفّذ تصميم V5 اللي اتفقنا عليه لصفحات المشاريع.
> الملف ده بيحدد **إيه** اللي يتبني، والتصميم المرئي في `design-reference/project-page-v5.dc.html`.
> الـ template واحد وبيطلّع الـ 7 صفحات، فكل قسم لازم يشتغل صح حتى لو المشروع ناقصه داتا.

- **Status:** agreed design, ready to implement
- **Visual reference:** `design-reference/project-page-v5.dc.html` (mobile, 390px wide). Open it for layout, spacing, copy tone and colors. Images in it are `/_blob/...` URLs from the mockup tool; map them to the repo images listed in §9.
- **Target:** the existing static generator `tools/build-pages.js` (+ `tools/projects-data.js`, `tools/pricing.json`, `tools/inventory.json`, `assets/css/style.css`, `assets/js/main.js`). This spec is framework-agnostic so it can be reused for the planned Astro rebuild.
- **Applies to:** all 7 pages generated from the template. Hyde Park Central is the example used below.

---

## 1. Non-negotiable rules

1. **No hardcoded prices, counts, areas, down payments or years anywhere.** Prices/units/counts come from `pricing.json`; unit-level detail from `inventory.json`; payment plan from `projects-data.js` → `paymentPlan { downPct, years }` (it differs per project: Central 5%/8y, Terraces 10%/8y, Tawny 10%/7y, Sea Shore 10%/6y).
2. **Static HTML first.** Every piece of text a buyer or crawler should read (all unit tabs, all FAQ answers, gallery alt text, comparison table) must be in the generated HTML. JavaScript only adds behavior (tabs, gallery switching, calculator, multi-step form). Hidden tab panels stay in the DOM (use `hidden` / CSS), never injected by JS.
3. **Never ship placeholders.** Anything the mockup shows in `[brackets]` (delivery year, distances, trust claims, finishing cost, construction photos) is **optional data**: render the element only when the field exists in `projects-data.js`; otherwise omit the element entirely.
4. **Keep existing contracts working:** `data-whatsapp-link` + `data-whatsapp-message` (handled in `main.js`), `data-phone-link`, `data-lead-form` submission flow → thank-you page, `phone-field.js` / `country-codes.js`, GA4 events `whatsapp_click` and `generate_lead` (already configured in GTM — do not rename or break them).
5. **RTL Arabic, brand tokens only** from `style.css` (`--navy #040E33`, `--blue #0D4088`, `--sky #1E91CD`, `--green #00D7A0`, `--yellow #F7DB32`, fonts Cairo + Manrope for Latin/numbers).
6. **Mobile first.** Touch targets ≥ 44px. Test at 360×560, 390×664, 412×780 visible viewport (see §3.1).
7. The Explorer Hyde Park broker disclaimer stays in the footer.

---

## 2. Section order (final)

| # | Section | Anchor id |
|---|---|---|
| 1 | Hero (image + overlapping price card) | — |
| 2 | In-page nav (sticky after hero) | — |
| 3 | Summary paragraph + quick facts | `#overview` |
| 4 | Gallery | `#gallery` |
| 5 | Available units (tabs by type) | `#units` |
| 6 | Reverse installment calculator | `#calc` |
| 7 | Location | `#location` |
| 8 | Amenities | — |
| 9 | Trust ("ليه تشتري من خلالنا؟") | — |
| 10 | FAQ | `#faq` |
| 11 | Multi-step lead form | `#lead` |
| 12 | Comparison + other projects | `#other-projects` |
| — | Footer with disclaimer | — |
| — | Sticky bottom bar (always visible on mobile) | — |

Removed vs. the current live page: standalone "نبذة عن المشروع" paragraph (replaced by §3 summary), standalone "خطة السداد" section (folded into §6), the old slider calculator, the old image slider. Removed from earlier drafts: the "بتدوّر على إيه؟" persona section and the core & shell warning box under the facts.

---

## 3. Sections

### 3.1 Hero — price, down payment and CTA must be fully visible without scrolling

- **Top part:** project hero image (`assets/img/projects/<slug>/<slug>-hero.jpg`, fallback to existing placeholder logic), with a dark gradient only at top and bottom so the image stays visible. On it: logo/menu row, green badge `{availableUnits} وحدة متاحة`, `<h1>` = `nameEn`, subtitle `{areaAr} · {unit types in Arabic joined by " · "}`.
- **Image height scales with the visible viewport:** use `svh` units, e.g. `height: clamp(240px, 46svh, 400px)`. Target: on a 360×560 visible viewport the whole price card, including the CTA, sits above the sticky bar.
- **Price card** (white, rounded 18px, shadow, overlaps the image bottom by ~22px):
  - `يبدأ من` + `{fmt(startingPrice)}` (Manrope, 26px, 800) + `جنيه`
  - 3 tiles in one row: `مقدم من {downPct}%` · `تقسيط حتى {years} سنين` · link tile `قسطك كام؟ / احسبه ←` → `#calc`
  - Primary CTA (green, full width, 48px): `شوف الوحدات اللي في ميزانيتك` → `#units`
- **No monthly installment number in the hero** (it depends on down payment and could scare buyers off).
- **No WhatsApp button in the hero**; WhatsApp lives in the sticky bar.
- **Optional (phase 5):** ad-group message match via `?unit=<type-slug>` (e.g. `apartment-1br`, `townhouse`). JS swaps the price label/value and CTA text for that type, and preselects the matching tab in §5. The static HTML stays the general version.

### 3.2 In-page nav

Horizontal chip row directly under the hero: `الوحدات` `احسب قسطك` `الصور` `الموقع` `الأسئلة` → anchors. Becomes `position: sticky; top: 0` once the hero scrolls away. Highlights the current section (IntersectionObserver). Horizontal scroll if chips overflow; no wrapping.

### 3.3 Summary + quick facts (`#overview`)

- `<h2>`: `{nameAr} في سطور` (fall back to `nameEn` if `nameAr` is missing)
- **Answer-first summary paragraph** (this is for Google, ChatGPT and Gemini; it must be a complete answer on its own). Build it from data, e.g. for Central:
  > هايد بارك سنترال (Hyde Park Central) مشروع سكني من هايد بارك للتطوير العقاري في القاهرة الجديدة. المتاح حالياً **110 وحدة**: شقق من 63 لـ 156 م²، وتاون هاوس وكواد وفيلا مستقلة. الأسعار بتبدأ من **6,430,000 جنيه** بمقدم من 5% وتقسيط لحد 8 سنين، وكل الوحدات بتتسلّم كور آند شل.
  - The finishing clause is included only when inventory shows one finishing type for all units (Central: all 110 are "Core & Shell"). Otherwise list the finishing types found.
- Byline line (small, muted): `محدّث: {month year from pricing.json meta.lastUpdated, Arabic} · من مخزون المطوّر · إعداد فريق Explorer Hyde Park`
- **Facts grid** (2 columns): `الموقع`, `المساحات` ({min}–{max} م² across all types), `التشطيب` (from inventory), `الاستلام` (**only if** `deliveryYear` exists), `سعر المتر (شقق) من` ({fmt(min price/bua_sqm) for apartments} ج/م², **only if** the project has apartments in inventory; Central = 78,650), `المطوّر` (`هايد بارك للتطوير`).

### 3.4 Gallery (`#gallery`)

- Large main image (≈230px tall, rounded) + a row of 6 thumbnails below. Tapping a thumbnail swaps the main image; selected thumb has a 2.5px `--blue` border. Counter chip `n / total` on the main image.
- Source: `assets/img/projects/<slug>/<slug>-gallery-{1..N}.jpg` (use existing `listImgDir` / `findImage` helpers). If a project has no gallery images, **omit the section and its nav chip**.
- Every `<img>` gets a descriptive Arabic alt, e.g. `صورة {n} من مشروع Hyde Park Central في القاهرة الجديدة`. Lazy-load all except the first.
- Optional line `صور تقدّم الإنشاءات` only if such images exist.

### 3.5 Available units (`#units`) — tabs by unit type

- Tabs (segmented control, one per unit type present in `pricing.json`): Arabic short labels (`شقق`, `تاون`, `كواد`, `فيلا`, `توين`, `شاليه`…).
- Each panel: unit-type image (`<slug>-<type>.jpg` via existing helper), availability chip (`متاح {count}`, or `آخر وحدة` when count = 1), then **one row per bedroom count** for apartments (from `inventory.json`: 1 / 2 / 3 rooms), or a single row for non-apartment types.
- Row content: title (`غرفة`, `غرفتين`, `3 غرف`, or type name), meta (`من {min area} م² · {n} وحدة`), `يبدأ من {fmt(min price)}`, `مقدم {downPct}%: {fmt(min price × downPct)}`, and a green WhatsApp button `ابعتلي المتاح`.
- **WhatsApp button is the key lead-quality lever:** `data-whatsapp-link` + `data-whatsapp-message`, e.g.
  `مهتم بشقة غرفتين في Hyde Park Central — تبدأ من 9,500,000 ج، مقدم 5%. ابعتلي الوحدات المتاحة.`
  Also add `data-unit-type`, `data-rooms`, `data-cta-location="units"` for tracking (§5).
- All panels are rendered in HTML; only the active one is visible.

### 3.6 Reverse installment calculator (`#calc`)

- `<h2>`: `تقدر تدفع كام في الشهر؟` · helper: `اختار القسط المريح ليك، وهنقولك محتاج مقدم قد إيه لكل وحدة.`
- Budget chips (3-column grid): 4 preset monthly amounts + `مبلغ تاني`. Presets are **derived per project** (e.g. rounded values around the cheapest unit's monthly installment at minimum down payment); Central example: 50 / 70 / 100 / 150 ألف.
- `مبلغ تاني` reveals a numeric input (`inputmode="numeric"`, suffix `جنيه / شهر`, placeholder `مثلاً 85000`). Results update as the user types.
- Results: one row per unit type/bedroom group (cheapest price in each):
  - months = `years × 12`; covered = `monthly × months`; downPayment = `max(price × downPct/100, price − covered)`; pct = downPayment/price.
  - pct ≤ 50% → green chip `مناسبة` + text `مقدم {fmt(dp)} ({pct}%) · قسط {fmt((price−dp)/months)}`
  - pct > 50% → grey chip `مقدم كبير` + text `محتاج مقدم {pct}% من السعر`
  - empty custom input → `اكتب القسط وهنحسبلك المقدم`
- CTA (green, full width): `ابعتلي الوحدات اللي على قد {fmt(monthly)} جنيه في الشهر` → WhatsApp with message including project and monthly amount.
- Disclaimer: `حساب تقريبي على أقل سعر متاح و{months} قسط شهري. الخطة النهائية حسب الوحدة وسياسة المطوّر وقت الحجز.`
- **Assumption to confirm with Abdo:** larger down payment keeps the same term. If the developer provides multiple plans later, add `paymentPlans: []` in `projects-data.js` and use it here.

### 3.7 Location (`#location`)

- `<h2>`: `الموقع بالدقايق`, location image (`<slug>-location.jpg`), then a list `{landmark} · {minutes} دقيقة` from optional `distances: [{ place, minutes }]` in `projects-data.js`. If `distances` is missing, fall back to the existing `locationText`. Link `افتح على Google Maps` only if `mapsUrl` exists.

### 3.8 Amenities

Chips from `amenities` (existing data). No section-level CTA.

### 3.9 Trust

`<h2>`: `ليه تشتري من خلالنا؟`. Items (icon + title + one line) come from optional `trustPoints` (site-level constant in the generator, not per project). Default items:
- `وسيط معتمد لمشاريع هايد بارك` / `بنعرض {projects.length} مشاريع في مكان واحد، فتقارن قبل ما تقرر.`
- `أسعار من مخزون المطوّر مباشرة` / `كل سعر على الصفحة من آخر تحديث لمخزون الوحدات المتاحة فعلاً.`
- `بتشتري من برا مصر؟` / **only if Abdo confirms the service.**
- `بدون عمولة على المشتري` / **only if Abdo confirms it is true.**

### 3.10 FAQ (`#faq`)

- Accordion using `<details>/<summary>` (accessible and visible to crawlers). The first item is open by default.
- Keep the existing generated FAQs and add, in this order:
  1. `يعني إيه كور آند شل؟ والتشطيب بيتكلف كام؟` (only when finishing is Core & Shell; answer defines it; finishing cost sentence only if data is provided)
  2. `لو دفعت مقدم أكبر، القسط هيقل؟` (answer points to the calculator)
  3. `إيه الفرق بين {this} و{nearest other project in same area}؟` (answer generated from both projects' data: starting price, unit types, available count)
  4. `ينفع أشتري وأنا مقيم برا مصر؟` (only if confirmed)
- Output the same Q&A as `FAQPage` JSON-LD in the `<head>` (answers must match the visible text exactly).

### 3.11 Multi-step lead form (`#lead`)

- Navy section, `<h2>`: `نرشّحلك الوحدات المناسبة`, progress bar (3 segments), `خطوة {n} من 3`.
- **Step 1:** `بتشتري ليه؟` → `سكن فوري` / `سكن مستقبلي` / `استثمار` / `مقيم خارج مصر`, plus `القسط الشهري المريح ليك` → 4 ranges (derived per project; Central: `أقل من 70 ألف`, `70 – 120 ألف`, `120 – 250 ألف`, `أكتر من 250`). Button `التالي`.
  - If `سكن فوري` is chosen **and** the project's units are Core & Shell, show inline note: `وحدات {nameEn} بتتسلّم كور آند شل، فهنرشحلك كمان وحدات جاهزة أو قريبة من التسليم في مشاريع هايد بارك التانية.`
- **Step 2:** unit type (types present in this project + `لسه مش متأكد`) and timing (`خلال شهر` / `خلال 3 شهور` / `لسه بستكشف`).
- **Step 3:** name + phone (existing `phone-field.js` with country code) → submit.
- Must keep the existing `data-lead-form` submit flow (WhatsApp + redirect to thank-you, `generate_lead`). Append the step 1–2 answers and the project name to the message. Step 1–2 choices are buttons (`aria-pressed`), and a no-JS fallback shows all fields at once.

### 3.12 Comparison + other projects (`#other-projects`)

- `<h2>`: `مقارنة بمشاريع هايد بارك في {areaAr}`: table of this project + up to 2 other projects with the same `areaSlug`. Rows: `يبدأ من` (short millions, e.g. `6.43M`), `الأنواع`, `المتاح`. Current project column bold. Omit if no other project shares the area.
- `<h2>`: `مشاريع تانية ممكن تعجبك`: horizontal scroll cards for **all other projects** (image or existing placeholder, area, `nameEn`, `يبدأ من {price} ج`), each linking to its page. This keeps the internal linking the live page already has.

### 3.13 Sticky bottom bar (mobile)

Fixed bottom, 64px tall, white, top shadow. Grid `2fr 1fr 1fr`: green `واتساب` (icon + text, `data-whatsapp-link`, message = generic project inquiry, `data-cta-location="sticky"`), outlined `اتصال` (`data-phone-link`), navy `الوحدات` → `#units`. Add `padding-bottom` to the body so the footer isn't covered. Replaces the old floating WhatsApp button on mobile.

---

## 4. Data additions (`tools/projects-data.js`)

All **optional**; the page must build and look complete without them.

```js
nameAr: 'هايد بارك سنترال',          // Arabic name for headings and the summary
deliveryYear: 2028,                    // shows الاستلام fact
distances: [{ place: 'التسعين الشمالي', minutes: 10 }, …],
mapsUrl: 'https://maps.google.com/…',
finishingCostNote: '…',                // FAQ sentence
paymentPlans: [{ downPct: 10, years: 8 }, …]   // future: real developer plans
```

Derived at build time from `inventory.json` (no manual entry): finishing type(s), per-bedroom apartment groups (count, min area, min price), min price per m² for apartments.

## 5. Tracking (push to `dataLayer`; GTM tags are configured by Abdo)

| Event | When | Params |
|---|---|---|
| `whatsapp_click` (existing) | any WhatsApp CTA | add `cta_location` (`units` / `calc` / `sticky` / `lead`), `unit_type`, `rooms` |
| `calculator_used` | first budget selection or custom input per page view | `monthly_budget` |
| `unit_tab_click` | tab change | `unit_type` |
| `lead_form_step` | each step completed | `step`, `purpose`, `budget_range` |
| `generate_lead` (existing) | unchanged | add `purpose`, `budget_range` if available |

## 6. Edge cases to handle

- Project with no apartments (Terraces, Tawny): no bedroom rows, no price-per-m² fact, calculator uses unit types.
- Project missing from `inventory.json` (Tawny has `availableUnits: null`): hide counts and badges that would show "null" or "0".
- `pricing.json` `refreshed: false`: keep the existing "preliminary price" wording next to prices.
- 1 unit left → `آخر وحدة`.
- Projects without gallery or type images: omit gallery; use existing placeholder blocks for cards.

## 7. Performance and SEO

- Hero image `fetchpriority="high"`, explicit width/height, WebP if available. Everything else lazy.
- No layout shift from the sticky nav/bar.
- Keep existing canonical, OG, Twitter tags. Add `FAQPage` JSON-LD (§3.10). `BreadcrumbList` and `Organization` are a separate task.

## 8. Acceptance checklist (per page, all 7)

- [ ] `node tools/build-pages.js` runs without errors; all 7 pages regenerate.
- [ ] No `[`/`]` placeholder text, no `undefined`, `null`, `NaN` in any generated page (grep).
- [ ] No price or count typed by hand in templates (grep for digits in template strings).
- [ ] At 360×560, 390×664 and 412×780: price, down payment and hero CTA visible above the sticky bar without scrolling.
- [ ] All tab panels and FAQ answers present in page source.
- [ ] Every WhatsApp link opens with the right prefilled message.
- [ ] Lead form still reaches thank-you and fires `generate_lead` (check in GTM Preview, in Incognito).
- [ ] Calculator: custom input, empty state, and >50% case behave as specified.

## 9. Image mapping from the mockup

| Mockup | Repo |
|---|---|
| Hero | `assets/img/projects/hyde-park-central/hyde-park-central-hero.jpg` |
| Gallery 1–6 | `…/hyde-park-central-gallery-{1..6}.jpg` |
| Unit tabs | `…-Apartment.jpg`, `…-Townhouse.jpg`, `…-quad.jpg`, `…-Standalone.jpg` |
| Location | `…/hyde-park-central-location.jpg` |
| Other project cards | each project's `*-hero.jpg` (Garden Lake and Tawny have none → placeholder) |
