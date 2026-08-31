# chr-utils

Small userscript that provides a global utility menu plus a lightweight Vimium-style navigation layer.

![Screenshot](https://sucralose.moe/static/chr-utils.jpg)

## Features

- Alt+Shift+Q menu with a right-click logger (disabled, copy+log, save-to-list) plus link/image priority toggle; its mode, priority, and saved list persist per origin
- Alt+Q opens a top-edge command hint for five seconds: `n` toggles an autosaved floating notepad on any page, `v` toggles Vimium Lite for the page, `l` copies every page link href, `i` makes right-click copy image addresses instead of enclosing link addresses, `p` force-pastes the clipboard into the focused text, password, or editable field without emitting a blocked `paste` event (requires the local server), and `m` immediately marks the current URL as `done` (using `m` again opens that note for editing); choosing a command dismisses the hint immediately
- Alt+P replaces the current tab with the clipboard URL (via local server)
- Alt+Shift+P opens the clipboard URL in a new tab (via local server)
- Alt+Y copies the top-level page URL with a brief overlay confirmation, even when focus is inside an iframe
- Utility-consumed shortcuts stop propagation and suppress their matching keyup so page bindings do not also act on them
- Alt+Shift+Q and its tool panels remember their open state and dragged positions per tab across refreshes, same-origin page loads, and SPA route changes; page-analysis panels rebuild against the new page
- Alt+Shift+A toggles a per-site dark mode; mode selection persists by host
- Right-click list stored in local storage with copy/clear helpers
- Instagram: periodically unblocks overlays above visible `<video>` elements so native controls remain clickable
- Optional Vimium-lite navigation:
  - j/k smooth scrolling with numeric speed prefixes (e.g., 3j, 10k)
  - gg to jump to top, Shift+G to jump to bottom
  - g then j/k for bottom/top
  - f to show clickable-element hints, including editable fields; text inputs/textareas are focused for typing
  - hint labels stay fixed-width per page; if any two-letter hints are needed, all hints become two letters
  - F to show clickable-element hints and open links in a new tab
- Site-specific Alt+Shift+Q sections appear only on their matching sites: X settings on X/Twitter, YouTube video analysis on YouTube, and muted users on Reddit
- X settings panel (persistent): hide selected left-nav entries, hide right sidebar, and hide Grok action buttons on posts
- Reddit muted-users mode: mute directly beside any feed-post author, maintain a persistent Reddit-wide username list, and replace muted posts with compact placeholders that can unmute them in place
- Dark mode presets: `Midnight` (direct recolor), `Invert` (full-page invert), and `Amber` (warm sepia-like recolor)
- Media Manager: group images, iframe sources, image link targets, and page links by host; persist Include/Neutral/Ignore policies per origin, preview groups on-page, inspect individual items, rescan dynamic pages, and copy deduplicated URLs or a JSON manifest
- Page Notes: save an exact-URL or literal URL-prefix note from the Alt+Shift+Q menu or press Alt+Q then `m`; note actions target the top-level page URL when invoked from an iframe; matching pages show a prominent, dismissible top-left notice and continuously moving, widely spaced diagonal line cues, including after refreshes and SPA navigation; note changes synchronize live between open tabs without polling
- Global Note Bindings: configure custom Alt+Q letters that save a chosen exact-URL note, append the page URL to one or more absolute file paths through the authenticated local server, or do both; custom letters override built-in quick actions
- YouTube video scan panel with filters (title, views, timestamp, URLs, normalized counts)
- Link monitor popup panel (50ms `<a href>` scan, multiple regex filters, deduped match list, copy/clear actions)
- Request monitor popup panel (logs page request URLs from `fetch`, `XMLHttpRequest`, media elements, and resource timing, persistent regex filters, copy/clear actions)
- Claude: the notepad appears automatically as a safe composer where Enter always inserts a newline; drafts autosave per chat and can be explicitly loaded into Claude's real composer without sending

## Files

- utils.user.js: main userscript
- install.sh: install helper
- wrapper.js: wrapper script
- server.py: local FastAPI helper (required for clipboard URL open, force paste, and note-binding file appends)

## Local server

- Run `./server.py` to start the JS-shell bridge.
