# explorerhydepark.com

Static Arabic (RTL) marketing site for Hyde Park projects. Plain HTML/CSS/JS,
no framework and no build dependencies beyond Node.

## Layout

| Path | What it is |
|---|---|
| `index.html`, `contact.html`, `privacy.html`, `thank-you.html` | Hand-written pages (the project cards block in `index.html` is generated) |
| `projects/*.html` | **Generated** project pages — never edit by hand |
| `assets/css/style.css` | All styles. Project-page styles use the `pp-` prefix; desktop rules live in `@media (min-width: 1024px)` |
| `assets/js/main.js` | All behavior (tabs, calculator, lead forms, WhatsApp links, tracking events) |
| `assets/js/phone-field.js`, `country-codes.js` | Country-code phone input |
| `assets/img/projects/<slug>/` | Project photos, named `<slug>-<name>.jpg` (see the checklist in that folder's `README.md`) |
| `tools/projects-data.js` | Project content (names, copy, amenities, payment plan, optional fields) |
| `tools/pricing.json` | Prices / counts per unit type (developer export) |
| `tools/inventory.json` | Unit-level inventory (developer export) |
| `tools/build-pages.js` | Generator |
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

## Still to fill in

- `assets/js/main.js`: real `WHATSAPP_NUMBER` and `PHONE_NUMBER` (placeholders now).
- `tools/projects-data.js`: `deliveryYear`, `distances`, `mapsUrl`, `finishingCostNote` per project (optional — each shows up on the page once filled).
