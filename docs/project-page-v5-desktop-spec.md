# Project Page V5 — Desktop Layout Spec (≥ 1024px)

> **بالعربي:** ده مقاسات الديسكتوب بالأرقام، قسم قسم، عشان Claude Code مايخمّنش من الموكاب.
> المرجع المرئي: `design-reference/project-page-v5-desktop.dc.html` (1440px).
> المحتوى والداتا من `docs/project-page-v5-spec.md`. الملف ده بيحدد **التقسيم والمقاسات بس**.

## 0. Rules

- Mobile stays exactly as it is. All desktop rules live inside `@media (min-width: 1024px)` in `assets/css/style.css`, under the `pp-` prefix. Do not change any mobile rule.
- One shared container for every section: `max-width: 1200px; margin-inline: auto; padding-inline: 24px` (at 1440px the content starts 120px from each edge). Section background colors are full-bleed, content is inside the container.
- Section vertical padding: `64px` (gallery `56px`). Alternate backgrounds exactly as in the table below.
- Section `<h2>`: 28px / 800 / `--blue`. Body text 16–17px. Small/muted text 13–14px, color `#4A5270`.
- Direction is RTL: in a two-column grid the **first column in the HTML is on the right**. The table lists columns right → left.
- No sticky bottom bar on desktop (`display: none` ≥ 1024px). `.float-whatsapp` stays visible.
- Use CSS grid with `gap`, never fixed widths on children (except the hero card).

## 1. Section-by-section

| # | Section | Background | Layout (right → left) | Key sizes |
|---|---|---|---|---|
| — | Site navbar | navy `#040E33` | logo · links · "اتصل بنا" outlined button | height 72px; links 15px/600, gap 32px |
| 1 | Hero | full-bleed image | text + price card on the **right**, image visible on the left | height 600px; gradient `linear-gradient(270deg, rgba(4,14,51,.88) 0%, rgba(4,14,51,.55) 38%, rgba(4,14,51,0) 70%)`; content column width 500px, vertically centered |
| 1a | Hero text (over image) | — | badge → h1 → subtitle, stacked | badge 13px green pill; h1 52px/800 Manrope; subtitle 17px/600 white |
| 1b | Price card | white, radius 20px, shadow `0 16px 40px rgba(4,14,51,.25)`, padding 22px | price row → 3 tiles → 2 buttons | price 36px/800; tiles grid 3 equal cols, gap 8px, radius 12px; buttons grid `3fr 2fr`, gap 10px, height 52px: green "شوف الوحدات…" + outlined WhatsApp (desktop only) |
| 2 | In-page nav | white, bottom border | chips in one row, right-aligned | chips 14px, padding 8px 18px; sticky top after hero |
| 3 | Overview | white | summary (5fr) · facts grid (6fr) | gap 56px, `align-items: start`; summary paragraph 17px, line-height 1.9; facts grid **3 cols × 2 rows**, gap 12px, tile padding 16px, radius 14px |
| 4 | Gallery | `#F5F7FA` | main image (4fr) · thumbnail column (1fr) | main image height 480px, radius 20px; thumbs stacked vertically, 6 × 72px, gap 9px, radius 10px |
| 5 | Units | white | header row: h2 on the right, tabs on the left (same row). Body: unit image (5fr) · rows card (7fr) | gap 28px; image min-height 380px, radius 20px, cover; rows card border 1px `#E6E8EE`, radius 20px, padding 8px 24px; each row is a grid `2fr 2fr auto`: title+meta · price+down payment · WhatsApp button (height 48px) |
| 6 | Calculator | `#F5F7FA` | inputs column (5fr) · results card (7fr) | gap 40px; budget chips grid 3 cols (5 chips → 3 + 2); custom input height 52px; results card white, radius 20px, padding 20px; each result row padding 16px, radius 14px; WhatsApp CTA full width 54px at the bottom of the results card |
| 7 | Location | white | map image (7fr) · h2 + distance list (5fr) | gap 40px, `align-items: center`; image height 320px, radius 20px; list rows 16px, padding 14px 0 |
| 8+9 | Amenities · Trust | `#F5F7FA` | amenities (1fr) · trust (1fr) | gap 48px; amenity chips white, 15px, padding 8px 16px; trust items grid 2 × 2, white tiles, padding 16px, radius 14px |
| 10+11 | FAQ · Lead form | white | FAQ (7fr) · form card (5fr) | gap 40px, `align-items: start`; FAQ items `#F5F7FA`, padding 18px, radius 14px, question 16px/700; form card navy, radius 22px, padding 28px, `position: sticky; top: 96px` |
| 12 | Comparison + other projects | `#F5F7FA` | table full width, then cards grid | table white, radius 18px, cells padding 14px 20px, 16px text, header row `#E6EEF9`; cards grid **3 columns**, gap 20px, image height 190px, radius 18px |
| — | Footer | navy | as today | padding 40px 0 |

## 2. Acceptance at 1440×900 and 1280×800

- [ ] Above the fold: navbar + the whole hero (price, 3 tiles, both buttons) visible without scrolling.
- [ ] Nothing wider than the 1200px container except full-bleed backgrounds and the hero image.
- [ ] Every two-column section matches the ratios above (measure in DevTools).
- [ ] Right/left order matches the table (RTL).
- [ ] At 1024px nothing overflows; at 1023px the page is exactly the mobile layout.
- [ ] Mobile screenshots at 390px are unchanged compared to before this task.
