# chr-utils

Small userscript that provides a global utility menu plus a lightweight Vimium-style navigation layer.

![Screenshot](https://sucralose.moe/static/chr-utils.jpg)

## Features

- Alt+Q menu with a right-click logger (disabled, copy+log, save-to-list)
- Alt+P replaces the current tab with the clipboard URL (via local server)
- Alt+Shift+P opens the clipboard URL in a new tab (via local server)
- Alt+Y copies the current page URL with a brief overlay confirmation
- Right-click list stored in local storage with copy/clear helpers
- Optional Vimium-lite navigation:
  - j/k smooth scrolling with numeric speed prefixes (e.g., 3j, 10k)
  - gg to jump to top, Shift+G to jump to bottom
  - g then j/k for bottom/top
- Image host audit overlay (highlights images, iframes, and links)
- YouTube video scan panel with filters (title, views, timestamp, URLs, normalized counts)

## Files

- utils.user.js: main userscript
- install.sh: install helper
- wrapper.js: wrapper script
- server.py: local FastAPI helper (required for clipboard URL open)

## Local server

- Run `./server.py` to start the JS-shell bridge.
