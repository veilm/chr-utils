# chr-utils

Small userscript that provides a global utility menu plus a lightweight Vimium-style navigation layer.

![Screenshot](https://sucralose.moe/static/chr-utils.jpg)

## Features

- Alt+Q menu with a right-click logger (disabled, copy+log, save-to-list)
- Right-click list stored in local storage with copy/clear helpers
- Optional Vimium-lite navigation:
  - j/k smooth scrolling with numeric speed prefixes (e.g., 3j, 10k)
  - gg to jump to top, Shift+G to jump to bottom
  - g then j/k for bottom/top
- Image host audit overlay (highlights images, iframes, and links)
- YouTube visible videos scan (title, views, timestamp for visible cards)

## Files

- utils.user.js: main userscript
- install.sh: install helper
- wrapper.js: wrapper script
