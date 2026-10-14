## Mobile homepage design QA

**Source visual truth**
- `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-13 23.52.34.png`
- Source pixels: `862 × 1424`.
- The user's latest written clarification overrides the source for the story split: the first mobile section contains the three-line statement and all four images within the former two-image height; the following section is full-width text only.

**Rendered implementation evidence**
- Story section: `/tmp/ikevege-mobile-qa/mobile-story-revised.png`
- Letter section: `/tmp/ikevege-mobile-qa/mobile-letter-revised.png`
- Combined visual comparison: `/tmp/ikevege-mobile-qa/mobile-story-comparison-final.png`
- Viewport: `390 × 844` CSS px, device scale factor `1`.
- Implementation pixels: `390 × 844` per screenshot.
- Normalization: source was proportionally reduced to `390px` wide and padded to `390 × 844` before the side-by-side comparison.
- State: homepage, mobile breakpoint, story section below the opening video; notice modal dismissed.

**Full-view comparison evidence**
- The implementation preserves the reference's clean two-column composition, left-aligned Japanese statement, white background, and narrow right-side image treatment.
- The four requested images now occupy one compact `520px`-high column—the same approximate area previously occupied by two portrait images—and are visible together.
- The letter starts in a separate white section after scrolling and uses the available content width without imagery.

**Focused-region comparison evidence**
- The combined comparison was reviewed for statement wrapping, column balance, image crops, and outer gutters.
- The letter screenshot was reviewed separately because it is intentionally split into a new section under the user's latest direction and therefore has no one-to-one region in the original reference.

**Required fidelity surfaces**
- Typography: Japanese serif styling, three intentional statement lines, left alignment, and readable mobile body leading are consistent. The final statement line does not wrap.
- Spacing/layout: `20px` mobile gutters, a compact four-image column, and a separate full-width letter section provide the requested hierarchy. Desktop remains a separate `md` layout.
- Colors/tokens: white canvas and existing primary text colors are retained without new decorative colors.
- Image quality: the four supplied production images are used directly with cover crops; no placeholder or CSS-drawn substitute is used.
- Copy/content: all supplied Japanese story copy is present; mobile line breaks were deliberately set for the `390px` reading width.

**Comparison history**
1. Initial pass — P2: the final statement line wrapped and the letter shared the image column, making the first section too long. Fixed the statement sizing/wrapping.
2. Clarified pass — P1: the user specified that all four images must fit into the previous two-image height and that the letter must become a separate text-only section. Rebuilt mobile into two sections and reduced the image stack to `520px`.
3. Post-fix pass — P2: per-image entrance animation temporarily left the lower two image slots blank. Changed the four images to enter as one group; all four now appear together.

**Primary interactions tested**
- Scrolled from the opening video into the compact visual section.
- Continued scrolling into the separate letter section.
- Confirmed the “詳しく知る” link is present and keyboard/assistive-tree discoverable.

**Console errors checked**
- A fresh verification tab reported no browser console errors.
- Production build completed successfully.

**Findings**
- No actionable P0/P1/P2 findings remain for the requested mobile story layout.

**Follow-up polish**
- P3: image focal positions can be tuned per photograph later if the user prefers different crops.

**final result: passed**

---

## Desktop typography normalization QA

**Source visual truth**
- `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-14 13.45.22.png`
- `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-14 13.45.35.png`
- Reference measurements: section heading `26px`, body copy `15px`, text color `#212529`.

**Rendered implementation evidence**
- Local desktop capture of `/about` in the Codex in-app browser after the shared typography update.
- Production build completed successfully, including linting, type checking, and generation of all 53 static pages.

**Required fidelity surfaces**
- Desktop public-page `h1`, `h2`, and section-level `h3` headings now share the `26px` reference size.
- Desktop reading copy, list copy, and descriptive copy now share `15px`, regular weight, `2.1` line height, and `#212529`.
- Former `text-gray-600` and `text-gray-700` reading copy is normalized to the same dark text color.
- Captions and dates remain a smaller supporting tier instead of being incorrectly enlarged.
- All changes are contained in the desktop breakpoint; mobile typography is unchanged.
- The shared `.public-site` wrapper applies this system across all customer-facing routes, including the top page, イケベジとは, 商品一覧・商品詳細, 定期便, FAQ, ブログ, and legal pages.

**Findings**
- No actionable P0/P1/P2 differences remain for the requested typography normalization.

**final result: passed**

---

## Desktop rhythm and split-layout QA

**Source visual truth**
- `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-14 7.46.17.png` through `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-14 7.47.57.png`

**Published implementation evidence**
- Stable Vercel preview inspected after deployment.
- Desktop accessibility snapshot confirms the letter and subscription sections each contain one text column, one CTA, and four ordered images.
- Production build completed successfully with type checking and all 53 static pages generated.

**Required fidelity surfaces**
- Homepage desktop: reduced the video-to-story gap, increased the text/image gutter, and changed only the homepage subscription panel to the same left-copy/right-four-image composition.
- Product desktop: removed decorative divider lines at large breakpoints and replaced them with a three-level spacing rhythm; the existing clean title wrapping and breadcrumb removal remain intact.
- Recommendation area: reduced the oversized leading gap and increased page-bottom breathing room before the footer.
- Buttons: all homepage pill CTAs continue to use the shared `1px` border token.
- Mobile: the original mobile blocks and base spacing classes are unchanged; all new layout behavior is gated at `md`/`lg` breakpoints.

**Findings**
- No actionable P0/P1/P2 implementation findings remain for the requested desktop-only changes.

**final result: passed**

---

## Desktop product pages QA

**Source visual truth**
- `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-14 7.44.40.png`
- `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-14 7.44.54.png`
- `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-14 7.45.04.png`
- `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-14 7.45.13.png`

**Rendered implementation evidence**
- Published collection and product-detail pages captured in the Codex in-app browser.
- Desktop viewport: `2048 × 1152px` CSS.
- Mobile regression viewport: `375 × 812px` CSS.

**Full-view comparison evidence**
- The desktop collection content now uses the same `1760px` maximum shell as the header, producing four wider product columns.
- Desktop category pills gained horizontal breathing room without changing their mobile dimensions.
- Desktop product-row spacing is reduced from `96px` to `48px`; the subscription CTA starts after a larger `176px` desktop gap.
- Product detail is a balanced two-column layout: `800px / 800px`, separated by a fixed `64px` gap at the reference viewport.
- Desktop product titles use a stable two-line rule: product/set/year on the first line, origin/cultivation on the second.

**Focused-region comparison evidence**
- Product-detail outer edges measured `192px` and `1856px`, giving equal outer margins.
- The rendered document has no horizontal overflow at either tested viewport.
- At `375px`, the purchase panel remains `327px` wide and the original mobile title renderer remains active.

**Required fidelity surfaces**
- Typography: existing fonts and weights are retained; only the desktop title line grouping and desktop size are normalized.
- Spacing/layout: desktop shell, card rhythm, CTA gap, and detail columns follow the red annotations; mobile base classes are unchanged.
- Colors/tokens: no color token changes.
- Image quality: original product images remain in use with no generated substitutes.
- Copy/content: all product and navigation copy is unchanged.

**Comparison history**
1. Initial desktop pass — P2: the product shell remained narrow and detail columns had an uneven ratio with a viewport-dependent gap.
2. First revision — P2: widening the detail panel exposed an orphaned final character in the first product-title line and the collection top gap was over-expanded.
3. Final revision — restored the approved collection top rhythm and added a desktop-only two-line title rule; post-fix captures show balanced columns and clean wrapping.

**Findings**
- No actionable P0/P1/P2 findings remain for the requested desktop-only changes.

**final result: passed**

---

## Mobile menu drawer width QA

**Source visual truth**
- `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-14 7.35.45.png`

**Rendered implementation evidence**
- Codex in-app browser capture of `http://localhost:3018/` at a `375 × 812px` CSS viewport.
- State: homepage with the mobile navigation drawer open.
- The drawer measured `187.5px` within a `375px` viewport (`50%`).

**Full-view comparison evidence**
- The white drawer now occupies exactly half of the mobile viewport instead of dominating most of the screen.
- The darkened, blurred page remains visible across the other half, matching the requested compact treatment.
- The close control, all navigation labels, separators, and social links remain contained without clipping.

**Focused-region comparison evidence**
- The drawer width and longest navigation label were checked at `375px`; no overflow or unwanted wrapping is visible.
- A separate crop was unnecessary because the complete drawer fits in the viewport capture at readable scale.

**Required fidelity surfaces**
- Typography: existing Japanese serif size, weight, tracking, and single-line labels are unchanged.
- Spacing/layout: drawer is `50vw`, with a `175px` minimum and `210px` maximum; the cart drawer retains its original width.
- Colors/tokens: existing white panel, gray separators, and translucent backdrop are unchanged.
- Image quality: no raster assets are introduced or modified.
- Copy/content: all existing Japanese navigation items remain unchanged.

**Primary interactions tested**
- Opened the menu from the mobile header.
- Confirmed the open transition reaches the right edge and the drawer remains fully usable.

**Console errors checked**
- No new runtime error was observed during the menu interaction.
- Production build completed successfully.

**Findings**
- No actionable P0/P1/P2 findings remain for the requested drawer-width change.

**Comparison history**
1. Initial state — the menu panel was up to `350px` wide and visually oversized on a `375px` viewport.
2. Post-fix state — the menu panel is `187.5px`, exactly half of the same viewport, with all labels fitting.

**final result: passed**

---

## Mobile letter typography QA

**Source visual truth**
- `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-14 7.27.02.png`
- Requested behavior follows the already approved subscription-introduction alignment.

**Rendered implementation evidence**
- Codex in-app browser at `375 × 1400px`, `http://localhost:3018/`.
- State: mobile homepage, “拝啓” letter section fully visible.

**Focused comparison evidence**
- All five prose paragraphs start at `30px`.
- Every complete line ends at `345px` (`315px` text width).
- Paragraph-ending lines remain left-aligned and are not stretched.
- “拝啓”, the addressee, “そして”, the closing phrase, and the signature remain naturally left-aligned.
- Existing `0.065em` letter spacing and `line-break: strict` are preserved.

**Findings**
- No actionable P0/P1/P2 differences remain for the requested alignment treatment.

**final result: passed**

---

## Subscription introduction typography QA

**Source visual truth**
- `/Users/yusukeninomiya/Desktop/スクリーンショット 2026-10-14 7.09.16.png`

**Rendered implementation evidence**
- Codex in-app browser at `375 × 1400px`, `http://localhost:3018/`.

**Measurements**
- Every line starts at `30px`.
- Every complete line ends at `345px` (`315px` text width).
- Each paragraph's final line remains naturally left-aligned without stretched spacing.
- Existing `0.065em` letter spacing and `line-break: strict` are preserved.
- Desktop and unrelated sections retain their existing left alignment.

**final result: passed**
