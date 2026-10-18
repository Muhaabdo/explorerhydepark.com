# explorerhydepark.com

Static Arabic (RTL) marketing site for Hyde Park projects. Plain HTML/CSS/JS,
no framework and no build dependencies beyond Node.

## Layout

| Path | What it is |
|---|---|
| `index.html`, `contact.html`, `privacy.html`, `thank-you.html` | Hand-written pages (the project cards block in `index.html` is generated) |
| `projects/*.html` | **Generated** project pages — never edit by hand |
| `en/` | **Generated** English pages: `en/index.html`, `en/projects/*.html`, `en/thank-you.html` — never edit by hand |
| `assets/css/style.css` | All styles. Project-page styles use the `pp-` prefix; desktop rules live in `@media (min-width: 1024px)` |
| `assets/js/main.js` | All behavior (tabs, calculator, lead forms, WhatsApp links, tracking events) |
| `assets/js/phone-field.js`, `country-codes.js` | Country-code phone input |
| `assets/img/projects/<slug>/` | Project photos, named `<slug>-<name>.jpg` (see the checklist in that folder's `README.md`) |
| `tools/projects-data.js` | Project content (names, copy, amenities, payment plan, optional fields) |
| `tools/projects-data-en.js` | English project content (same facts, translated; keyed by slug) |
| `tools/pricing.json` | Prices / counts per unit type (developer export) |
| `tools/inventory.json` | Unit-level inventory (developer export) |
| `tools/build-pages.js` | Generator (Arabic pages; runs `build-en.js` at the end) |
| `tools/build-en.js` | English page templates |
| `tools/dev-server.js` | Local static server for testing |
| `docs/` | Specs for the project page (mobile + desktop) and the implementation prompts |
| `design-reference/` | Visual mockups for the specs (open in a browser) |
| `.htaccess` | Canonical URLs + blocks `tools/`, `docs/`, `design-reference/`, dotfiles and `.md` on the live server |

## Everyday tasks

```sh
# after editing projects-data.js, pricing.json, inventory.json or adding photos
node tools/build-pages.js

# check the derived numbers for one project without writing anything
node tools/build-pages.js --dump hyde-park-central

# preview locally at http://localhost:8843
node tools/dev-server.js
```

The build only rewrites files whose content changed, and `sitemap.xml`
`<lastmod>` moves only for those pages.

**Always run the build after editing `style.css` or any JS file**, even if no
data changed: the host caches CSS/JS for 7 days, and the build stamps every
page's CSS/JS links with `?v=<content hash>` so visitors get the new files.

## SEO fields (per project, `tools/projects-data.js`)

- `areaDetailAr` — district people search with (التجمع السادس، رأس الحكمة). Feeds the `<title>`, meta description, hero line and schema.
- `seoTitle` / `metaDescription` — optional hand-written overrides. Empty = built from the data (`أسعار <year> ومقدم X%`, starting price, plan, availability).
- `aboutAr` + `phases` — project-specific copy (sources noted above each entry). Facts only.
- WhatsApp / phone links are baked into the HTML at build time (`WHATSAPP_NUMBER` / `PHONE_NUMBER` in `build-pages.js` — keep in sync with `assets/js/main.js`).

## English version (`/en/`)

- Same prices, units and photos as the Arabic pages; only the wording differs. Change a project fact → edit it in **both** `projects-data.js` and `projects-data-en.js`, then rebuild.
- Every Arabic project page and its English twin link to each other (`hreflang` + the English / العربية button). `x-default` is Arabic.
- `assets/js/main.js` switches its texts and WhatsApp messages on `<html lang="en">`.
- Not translated yet: area pages, contact, privacy (English pages link to the Arabic privacy policy).

## Still to fill in

- `tools/projects-data.js`: `mapsUrl`, `finishingCostNote` per project, and minutes for any `distances` entry that has none (optional — each shows up on the page once filled). There is deliberately no delivery-year field: delivery differs by phase inside a project.
