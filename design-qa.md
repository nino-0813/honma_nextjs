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
