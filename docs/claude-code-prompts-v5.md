# برومبتات Claude Code — تنفيذ صفحة المشروع V5

## الفكرة قبل ما نبدأ

- **الـ spec هو المرجع، مش الشات.** Claude Code مش شايف كلامنا ولا الكانفاس. عشان كده بنحط حاجتين جوه الريبو:
  - `docs/project-page-v5-spec.md`: بيقول **إيه** اللي يتبني، ومن أنهي داتا، وإيه الحالات الناقصة.
  - `design-reference/project-page-v5.dc.html`: بيوري **شكله**. الفولدر ده فيه أصلاً `support.js`، فالملف هيفتح في المتصفح.
- **ننفّذ على مراحل، مش مرة واحدة.** كل مرحلة صغيرة كفاية إنك تراجعها وتجرّبها وتعمل لها commit لوحدها. لو حاجة باظت، بترجع لمرحلة واحدة بس.
- **كل مرحلة في session جديدة** (أو `/clear` بينهم)، وكل برومبت بيقول لـ Claude Code يقرا الـ spec الأول. كده مايعتمدش على ذاكرة مليانة من المرحلة اللي قبلها.
- **مرحلة 0 تخطيط بس** (Plan mode): يقرا الكود ويقولك هيعمل إيه، وإنت توافق قبل ما يكتب سطر.
- التنفيذ على الـ generator الحالي (`tools/build-pages.js`). الـ spec مكتوب بشكل ينفع يتنقل للـ Astro بعدين.

## قبل مرحلة 0 (إنت بإيدك)

1. حط الملفين في الريبو:
   - `project-page-v5-spec.md` ← فولدر `docs/` (جديد)
   - `project-page-v5.dc.html` ← فولدر `design-reference/`
2. اعمل commit: `docs: add project page V5 spec and design reference`
3. افتح Claude Code في فولدر الريبو، واعمل branch جديد: `git checkout -b project-page-v5`

---

## مرحلة 0 — قراءة وخطة (Plan mode)

```
Read docs/project-page-v5-spec.md fully, then open design-reference/project-page-v5.dc.html to see the target layout (it is a mockup; its /_blob/ image URLs map to repo images per spec §9).

Then read tools/build-pages.js, tools/projects-data.js, tools/pricing.json, tools/inventory.json (structure only), assets/js/main.js and assets/css/style.css.

Do NOT write code yet. Give me:
1. A short map of how the current generator builds a project page (which functions produce which sections).
2. Your implementation plan split into these phases: (1) data helpers, (2) hero + sticky nav + sticky bar + overview + gallery, (3) units tabs + reverse calculator, (4) location, amenities, trust, FAQ + FAQPage JSON-LD, multi-step form, comparison + other projects, (5) tracking + ?unit= message match + QA.
3. Any conflict between the spec and the current code (especially the data-lead-form flow, whatsapp_click / generate_lead events, and the old calculator and slider code that will be removed).
4. Questions you need answered before starting.

Write your explanations to me in Egyptian Arabic; keep code, file names and identifiers in English.
```

---

## مرحلة 1 — الداتا (من غير أي تغيير في الشكل)

```
Implement phase 1 of docs/project-page-v5-spec.md: data helpers only, no visible UI changes yet.

In tools/build-pages.js (mergeProject or new helpers), derive at build time from inventory.json and pricing.json:
- finishing type(s) per project
- apartment groups by bedroom count: count, min area, min price
- min price per m² for apartments
- per unit-type image path (existing findImage helper) and gallery image list
- same-area projects for the comparison table (spec §3.12)
- Arabic month + year from pricing.json meta.lastUpdated

Add the OPTIONAL fields from spec §4 to the schema (nameAr, deliveryYear, distances, mapsUrl, finishingCostNote). Fill nameAr for all 7 projects. Leave the others empty; I will fill them later.

Rules: no hardcoded numbers; every helper must handle projects with no apartments, no inventory rows, or availableUnits: null.

Verify: run `node tools/build-pages.js` and confirm the generated pages are unchanged (git diff on /projects should be empty or whitespace only). Print the derived data for hyde-park-central and hyde-park-terraces so I can check it against the spec (Central apartments from 78,650 EGP/m²; 1BR from 6,430,000, 25 units).

Then commit, and give me a short summary in Egyptian Arabic: what you did, why, and how I can verify it myself.
```

---

## مرحلة 2 — أول الصفحة: الهيرو، التنقّل، الشريط الثابت، الملخص، الجاليري

```
Implement phase 2 of docs/project-page-v5-spec.md, matching design-reference/project-page-v5.dc.html:
- §3.1 Hero with image + overlapping price card (svh-based image height, no monthly number, no WhatsApp button in the hero)
- §3.2 In-page nav chips, sticky after the hero, highlighting the current section
- §3.13 Sticky bottom bar (replaces the floating WhatsApp button on mobile; add body padding)
- §3.3 Summary paragraph + byline + facts grid (optional facts only when data exists)
- §3.4 Gallery with thumbnails (omit section and nav chip when a project has no gallery images); remove the old slider

Use only brand tokens from assets/css/style.css; add new CSS there (no inline styles in generated HTML). Keep all text in the static HTML.

Verify:
1. `node tools/build-pages.js` for all 7 pages.
2. grep the generated pages for `undefined`, `null`, `NaN`, `[` placeholders.
3. Run tools/dev-server.js and check hyde-park-central at 360×560, 390×664 and 412×780 viewports: price, down payment and the hero CTA must be above the sticky bar without scrolling. Tell me the measured bottom of the CTA for each size.
4. Check one project without apartments (hyde-park-terraces) and one without gallery images.

Commit, then summarize in Egyptian Arabic (what, why, how to verify).
```

---

## مرحلة 3 — الوحدات والحاسبة (أهم مرحلة للّيدز)

```
Implement phase 3 of docs/project-page-v5-spec.md:
- §3.5 Units as tabs by type; one row per bedroom group for apartments; per-row WhatsApp button with data-whatsapp-message prefilled exactly as specified, plus data-unit-type, data-rooms, data-cta-location="units". All panels in the static HTML; only the active one visible. Accessible tabs (role=tablist/tab/tabpanel, arrow keys).
- §3.6 Reverse calculator: preset chips derived per project + "مبلغ تاني" custom numeric input, results computed with the project's own paymentPlan (downPct, years), the >50% "مقدم كبير" case, the empty state, and the WhatsApp CTA carrying the monthly amount. Remove the old slider calculator and the separate payment-plan section.

JS goes in assets/js/main.js as small isolated init functions (like the existing ones), no libraries.

Verify with numbers for hyde-park-central (downPct 5, 96 months):
- monthly 70,000 → 1BR (6,430,000): down payment 5% (321,500), installment ≈ 63,630; 2BR (9,500,000): down payment ≈ 2,780,000 (29%); townhouse: "مقدم كبير".
- custom input "85,000" (with comma) parses correctly; empty input shows the empty state.
Then check hyde-park-terraces (10%, 8y) works with no apartments.
Open 3 WhatsApp links and paste the decoded prefilled messages in your reply.

Commit, then summarize in Egyptian Arabic.
```

---

## مرحلة 4 — باقي الصفحة

```
Implement phase 4 of docs/project-page-v5-spec.md:
- §3.7 Location (distances list only when data exists, otherwise the existing locationText; Maps link only when mapsUrl exists)
- §3.8 Amenities chips
- §3.9 Trust section: only the two confirmed default items for now; leave the other two behind a flag that is off
- §3.10 FAQ with <details>/<summary>, first item open, the new questions with their conditions, and matching FAQPage JSON-LD in <head> (answers identical to visible text)
- §3.11 Multi-step form: 3 steps, "سكن فوري" + Core & Shell note, no-JS fallback. Keep the existing data-lead-form submit flow, thank-you redirect, phone-field.js and field names; append step answers and project name to the message.
- §3.12 Comparison table (same areaSlug) + horizontal other-projects cards linking to each page

Verify: build all 7 pages; validate the FAQPage JSON-LD (tell me the command or tool you used); submit the form end-to-end locally and confirm the thank-you redirect and the final WhatsApp message text; confirm the comparison table is omitted for projects that have no same-area neighbor.

Commit, then summarize in Egyptian Arabic.
```

---

## مرحلة 5 — التراكينج والـ message match والمراجعة النهائية

```
Implement phase 5 of docs/project-page-v5-spec.md:
- §5 dataLayer events: extend whatsapp_click with cta_location / unit_type / rooms; add calculator_used (once per page view), unit_tab_click, lead_form_step; extend generate_lead with purpose and budget_range. Do not rename existing events.
- §3.1 optional ?unit=<type-slug> message match: swap hero label/price/CTA text and preselect the tab; static HTML stays general; invalid values are ignored.

Then run the full acceptance checklist in spec §8 on all 7 pages and report each item as pass/fail with evidence.

Finally, write a short docs/project-page-v5-notes.md listing: the new dataLayer events and their params (so I can create the GTM variables and tags), the ?unit= values per project (for Google Ads final URLs), and the optional data fields still empty per project.

Commit, then summarize in Egyptian Arabic.
```

---

## بعد التنفيذ (إنت بإيدك)

- **GTM:** اعمل Data Layer Variables للـ params الجديدة (`cta_location`، `unit_type`، `monthly_budget`، `purpose`، `budget_range`)، وTags للـ events الجديدة، واختبر في Preview من Incognito.
- **GA4:** سجّل الـ params كـ custom dimensions. بعدها ابني الـ Audiences: `calculator_used` من غير lead، و`whatsapp_click` على مستوى الوحدة.
- **Google Ads:** اربط كل ad group بالـ final URL اللي فيه `?unit=` المناسب.
- **الداتا الناقصة:** املا `deliveryYear` و`distances` و`mapsUrl` في `projects-data.js` لكل مشروع، واعمل build.
