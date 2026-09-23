# UNVRSL FIT v396

## Fixes

- Removed the stale `og-settings.js` screen that rendered a disabled light-theme button. Cloud account controls now extend the canonical Settings view instead of replacing it.
- Removed the gear-click capture handler from `cloud-patch.js`; it no longer swallows the canonical Settings click.
- Theme selection applies immediately, saves the preference, closes Settings, and skips a full rerender of the active page so navigation remains responsive.
- Bumped the PWA shell and dynamic asset version to v396 to evict the stale v395 interface from the service worker cache.
- Slowed each frame of the six custom exercise GIFs from 250 ms to 400 ms. Their square canvas and infinite loop are unchanged.

## Verification

- 141 contract tests pass.
- The jsdom end-to-end workout scenario confirms the theme control is enabled, selection persists, the overlay closes, and navigation opens another section.
- GIF tests verify square dimensions, frame dimensions, a 400 ms minimum frame duration, animation, and infinite looping.
- All root JavaScript files pass `node --check`; `git diff --check` passes.
