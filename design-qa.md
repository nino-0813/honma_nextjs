# Design QA — annotated renewal refinement

## Source and scope

- Source: 40 user-annotated desktop screenshots of the current renewal build.
- Routes checked: `/`, `/about`, `/start-set`, `/collections/rice`.
- Primary goals: cleaner hierarchy, more deliberate spacing, consistent navigation/category controls, stable product imagery, and removal of purchase UI that covers content.

## Pass 1 — layout, content, and behavior

- Header is slimmer, uses darker inactive navigation text, preserves the black underlined active state, and stays hidden at the top of the home hero until scroll.
- Home hero is full-bleed. The brand letter now precedes its supporting photo grid, duplicate closing copy was removed, and the About CTA is closer to the sign-off.
- Lineup now has balanced side gutters, a closer CTA, and shorter `商品一覧へ` copy.
- Subscription naming now explicitly includes `イケベジ定期便`; community imagery uses varied crops and the following News section has a clearer section break.
- Trial-set category pills, redundant rice cards, PDF modal CTA, gallery arrows, and sticky bottom purchase bars were removed. The value-story section now comes before dense product details.
- Product gallery swaps a single large image from thumbnails instead of exposing an awkward horizontal image strip.
- Collection category pills are smaller; rice subcategories have a visual hierarchy divider; product cards have no artificial image border and use wider gutters with more title lines.
- About now opens with a descriptive catchphrase and compact explanation. The “いいとき” section explains the double meaning of `しぜんと` and uses a warmer, subtler neutral background.

## Pass 2 — responsive and accessibility checks

- Verified rendered home, About, trial set, and rice collection in the in-app browser at a tablet-sized viewport.
- Desktop and mobile behavior is covered by existing responsive breakpoints; no fixed product column or bottom purchase bar remains to overlap following content or the footer.
- Category controls retain horizontal overflow on narrow screens, selected states remain visually and semantically distinct, thumbnails remain native buttons, and image alt text is retained.
- Focus-visible treatment remains global and reduced-motion behavior remains intact.

## Pass 3 — build and regression checks

- `npm run build`: passed.
- `git diff --check`: passed.
- Product data was verified with the existing local Supabase environment without copying secrets into the new worktree.
- Existing visual assets were reused; no placeholder image generation or CSS-drawn substitute art was introduced.

final result: passed
