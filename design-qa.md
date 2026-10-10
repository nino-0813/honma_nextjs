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

## Pass 4 — full-viewport home video

- Source screenshot: `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-09 21.44.39.png`.
- The home video now occupies exactly `100svh`, eliminating the white area beneath the first view.
- The video uses `object-cover` so differing viewport ratios no longer produce black side bars. A small amount of edge cropping is accepted to keep the first view fully covered.
- Verified in the in-app browser at the same initial page state: the video fills the complete available viewport with no black bars and no following content visible before scrolling.

## Pass 5 — home story photo grid

- Source layout: `/Users/yusukeninomiya/Downloads/トップページ上の方の４つの写真.png`.
- Source photos: `_P3A9154.jpg`, `IMG_9147.jpg`, `IMG_0096.jpg`, and `2C9A9680.jpg`, in that reading order.
- The four supplied photos are optimized to WebP and arranged as an equal 2 × 2 grid with matching 16:9 cells and no inter-card gaps.
- The complete image block remains centered inside the existing home story content width, matching the reference composition.

## Pass 6 — home subscription photo grid

- Source layout: `/Users/yusukeninomiya/Downloads/トップページ下の方の４つの写真.png`.
- Source photos: `IMG_5617.jpg`, `IMG_9118.jpg`, `IMG_7643-2.jpg`, and `IMG_0772.jpg`, in that reading order.
- The four supplied 3:2 photos are optimized to WebP and placed in an equal 2 × 2 grid without gaps.
- Browser verification confirms the bamboo grove and rice planting photos on the first row, with bamboo rice and orchard photos on the second row, matching the supplied reference.

## Pass 7 — mobile hero story sequence

- Source layout: `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-10 17.28.41.png`.
- The full-screen video remains an independent first section; the following story begins on white with deliberate top spacing.
- Below the mobile breakpoint, the story title and letter occupy the left column while the four supplied story photos form one continuous vertical strip on the right.
- Each photo receives an increasing entrance delay and uses the existing upward reveal motion. The image strip stretches to the same endpoint as the letter and CTA, so the section closes as one composition.
- The established desktop story and 2 × 2 photo layout remain unchanged.

## Pass 8 — unified vertical story sequence

- Corrected the breakpoint interpretation: the vertical four-photo strip now applies to desktop as well as mobile.
- Desktop browser verification shows the title and letter in the left column with all four photos stacked continuously in the right column.
- The gallery is stretched by the same grid row as the complete letter and CTA, keeping both endpoints aligned.
- The opening video remains a separate full-screen section with a generous white transition before the story composition.

final result: passed
