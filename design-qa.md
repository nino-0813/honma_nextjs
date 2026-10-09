# Design QA — 2026-10-09 UI/UX review revisions

## Source and scope

- Source document: `/Users/yusukeninomiya/Downloads/トップページと商品ページのUI_UXデザイン修正指示 - 2026-10-09 20_29_55.pdf` (17 pages), reviewed as a rendered contact sheet and extracted text.
- Supporting source: the user-provided annotated desktop screenshots and the pasted meeting summary/transcript.
- Implementation routes: `/`, `/start-set`, `/collections/rice`, `/collections/rice/yearly?view=lp`, `/about`, and `/products/nikomaru_5kg_2026`.
- Scope rule: only confirmed decisions and action items were implemented. Items explicitly marked pending were left unchanged.

## Pass 1 — confirmed content and hierarchy

- Home hero uses the complete uncropped video frame; the header is slimmer and appears after the first meaningful scroll.
- The home story copy uses the shared dark text color, and its `詳しく知る` CTA aligns with the right edge of the 780px story/sign-off column.
- Home category cards use restrained gaps and collection-like proportions; `商品一覧へ` sits closer to the `Others` card.
- The trial-set page keeps its removed top category pills removed. Its purchase summary includes the three varieties on separate compact lines.
- Trial-set details align the `商品詳細` and `セット内容` headings, remove the redundant full-width rules, add visible product links for all three varieties, and restore `3品種の比較表を見る →` without the `(PDF)` suffix.
- Collection cards display a first line for variety/cultivation, a second line for specifications, and a third row for price/status, all constrained to the image width.
- Rice subcategory controls are now simple branch links with a divider and active underline, visually distinct from the main category pills.
- Subscription and About heroes center their copy in the first viewport and show the leading edge of the following image. The subscription delivery statement remains a single desktop line.
- The About long-form section uses a neutral newspaper-like gray instead of a generic pale yellow.

## Pass 2 — interaction and responsive verification

- Verified all implementation routes in the in-app browser against the source directions at the available 920px viewport.
- The trial-set accessibility tree exposes all three variety links and the restored comparison control.
- The bottom purchase bar is restored on product and trial-set flows and uses a footer intersection observer to slide below the viewport when `#site-footer` appears, preventing overlap.
- Product gallery behavior remains a single selected main image controlled by thumbnails; the right purchase panel is no longer fixed to the viewport.
- Pinterest save overlays are disabled globally with the supported `pinterest=nopin` meta directive.
- Existing focus-visible, reduced-motion, semantic headings, link names, image alt text, and native button behavior remain intact.

## Pass 3 — build and regression checks

- `npm run build`: passed (53 static pages generated; type and lint checks passed).
- `git diff --check`: passed.
- Product data was verified with the existing local environment without copying secrets into the worktree.
- Existing visual assets were reused; no replacement artwork or unapproved pending layout option was introduced.

final result: passed
