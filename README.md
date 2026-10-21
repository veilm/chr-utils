# chr-utils

A Chromium userscript with a utility menu, quick commands, and optional Vimium-style navigation.

![Screenshot](https://sucralose.moe/static/chr-utils.jpg)

## Keyboard controls

**Alt+Shift+Q** opens the utility menu. **Alt+Q** opens a case-sensitive command hint for five seconds; press one of these letters:

| Key | Action |
| --- | --- |
| `n` | Toggle the autosaved floating notepad |
| `v` | Toggle Vimium Lite for the current URL |
| `V` (Shift+V) | Edit persistent Vimium Lite disabled URL prefixes |
| `l` | Copy every page link URL |
| `i` | Make right-click copy image addresses |
| `p` | Paste into the focused editable field through the local helper |
| `m` | Mark the current page `done`; press again to edit its note |
| `M` (Shift+M) | Create a URL-prefix note |

Other shortcuts:

- **Alt+P** opens the clipboard URL in the current tab; **Alt+Shift+P** opens a new tab.
- **Alt+Y** copies the top-level page URL with brief confirmation.
- **Alt+Shift+A** toggles dark mode for the current host.
- **Ctrl+Alt+I** also toggles Vimium Lite for the current URL.

Commands invoked inside an iframe are forwarded to the top page. Consumed shortcuts suppress both keydown and the matching keyup so page bindings do not also run. The menu and tool panels remember their open state and dragged positions per tab across refreshes, same-origin navigation, and SPA route changes; analysis panels rebuild against the new page.

## Utility menu

- **Right-click Logger:** disable it, copy and log a target URL, or save URLs to a list. Choose link or image priority. Settings and the list persist per origin; list controls appear once there are saved entries.
- **Dark Mode:** Midnight recolors directly, Invert applies full-page inversion, and Amber applies a warm tint. Preferences persist per host.
- **Media Manager:** group images, iframe sources, image link targets, and page links by host. Save Include/Neutral/Ignore policies per origin, preview groups, inspect items, rescan, and copy deduplicated URLs or a JSON manifest.
- **Link Monitor:** scan links every 50 ms with multiple regex filters, deduplicate matches, and copy or clear results. Filters and matches persist per site across navigation and panel reopen.
- **Request Monitor:** capture URLs from fetch, XMLHttpRequest, media elements, and resource timing, with persistent regex filters and copy/clear controls.

## Notes and custom commands

Page Notes support exact URLs and literal URL prefixes, treating a trailing path slash as optional. Matching pages show a dismissible notice and widely spaced moving diagonal cues, including after refresh and SPA navigation. Notes synchronize between open tabs without polling. Editors accept **Ctrl+Enter** to save; commands from iframes use the top-level URL.

**Global Note Bindings** assigns case-sensitive Alt+Q letters to save an exact-page note, append the URL to one or more absolute file paths through the local helper, or do both. A custom letter overrides only the same-case built-in command.

The settings panel can export all notes to JSON, restore a backup with labeled conflict merges, or import plain-text URL lines under one shared note. Plain-text conflicts preserve existing text and append a labeled Manual plain text note section. Large imports yield every 1,000 lines to keep the page responsive.

## Vimium Lite

Navigation remains active while utility panels are open; editable fields and utility-reserved keys take precedence.

| Key | Action |
| --- | --- |
| `j` / `k` | Smooth scrolling; numeric prefixes adjust speed, such as `3j` or `10k` |
| `gg` / Shift+G | Jump to the top / bottom |
| `gk` / `gj` | Jump to the top / bottom |
| `f` | Show clickable-element hints; editable targets receive typing focus |
| `F` | Show hints and open links in a new tab |

Hint labels have a fixed width per page: if any require two letters, all use two letters.

Use **Alt+Q, Shift+V** to edit the disabled-prefix list. Enter one full URL prefix per line, then **Save prefixes**, or use **Ctrl+Enter**. **Add current page** saves its URL without the query or fragment. For example, `https://example.com/review/` covers every page below that path. Remove a line and save to restore navigation there. Escape closes the editor.

Prefixes match from the start of the URL and persist in userscript storage. Changes synchronize between open tabs, with a refresh on tab focus for older loaders; per-origin local storage is used when userscript storage is unavailable. **Alt+Q, v** temporarily overrides the saved rule until navigation or reload. Disabling clears hints, scrolling, and pending numeric/g commands.

## Site-specific tools

These menu sections appear only on their matching sites:

- **X/Twitter:** hide selected left-navigation entries, the right sidebar, and Grok actions on posts.
- **Reddit:** mute beside any feed-post author, maintain a shared username list, import usernames by paste or TXT file, and export as TXT. Muted posts become compact placeholders with an unmute action; changes synchronize across open tabs.
- **YouTube:** scan videos with title, view-count, timestamp, URL, and normalized-count filters. Comments and recommendations are covered by default; Show reveals a section for the current page only. Only the YouTube UI Settings checkboxes save preferences.
- **Claude:** the floating notepad opens automatically as a safe composer where Enter inserts a newline. Drafts autosave per chat and can be loaded into the real composer without sending. Conversation export copies the selected branch as Markdown with Human and Claude headings, scans virtualized messages, restores scroll position, and reports missing messages.
- **ChatGPT:** export the selected branch as Markdown with Human and ChatGPT headings, preserving headings, lists, tables, quotes, links, and code blocks. Export supports conversation-turn and timeline layouts, collapsed prompts, and virtualized turns; it restores scroll position and reports missing turns. It uses the rendered DOM and the normal permission-free clipboard path, with the authenticated helper as a fallback.

An optional Instagram fix periodically unblocks overlays above visible videos so native controls remain clickable; it is disabled by default in the source.

## Installation and local helper

- `utils.user.js` is the main userscript.
- `install.sh` prepares the disk-loading `wrapper.js` and installation instructions. Enable file URL access in the userscript extension.
- Run `./server.py` for the local FastAPI helper. It supplies clipboard URL opening, force paste, note-binding file appends, and a fallback for copying when the browser clipboard path is unavailable.
