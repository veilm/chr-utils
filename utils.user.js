// ==UserScript==
// @name         Chromium Utils
// @author       https://x.com/sucralose__ | codex | claude
// @namespace    https://github.com/veilm/chr-utils
// @version      0.1.0
// @description  Global utilities launcher (Alt+Q)
// @match        *://*/*
// @match        file:///*
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const MENU_ID = 'userscript-utils-menu';
  const STYLE_ID = 'userscript-utils-style';
  const TOGGLE_HINT = 'Alt+Q or Alt+Shift+[';
  const RIGHT_CLICK_LIST_KEY = 'userscript-utils:right-click-list';
  const VIMIUM_LITE_KEY = 'userscript-utils:vimium-lite-enabled';
  const RIGHT_CLICK_MODE_DISABLED = 'disabled';
  const RIGHT_CLICK_MODE_COPY = 'copy';
  const RIGHT_CLICK_MODE_LIST = 'list';
  const SCROLL_SPEED = 900;
  const SCROLL_JUMP_PADDING = 12;

  let menuEl = null;
  let rightClickModeButtons = null;
  let rightClickListEl = null;
  let rightClickListCountEl = null;
  let rightClickCopyBtn = null;
  let rightClickClearBtn = null;
  let rightClickMode = RIGHT_CLICK_MODE_COPY;
  let rightClickListenerAttached = false;
  let rightClickList = [];
  let menuOpenedOnce = false;
  let vimiumLiteEnabled = true;
  let vimiumLiteButton = null;
  let scrollDirection = 0;
  let scrollMultiplier = 1;
  let scrollRafId = null;
  let scrollLastTs = 0;
  let numericPrefix = '';
  let numericPrefixTimer = null;
  let gPending = false;
  let gPendingTimer = null;

  const shouldIgnoreKeyEvent = (event) => {
    if (!event) return false;
    const target = event.target;
    if (!target) return false;
    const tag = target.tagName;
    if (!tag) return false;
    const tagName = tag.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      return true;
    }
    if (target.isContentEditable) {
      return true;
    }
    return false;
  };

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${MENU_ID} {
        position: fixed;
        top: 18px;
        right: 18px;
        width: min(360px, calc(100vw - 36px));
        background: rgba(16, 16, 16, 0.97);
        color: #f1f1f1;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        line-height: 1.4;
        border-radius: 0;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5);
        z-index: 2147483647;
        padding: 14px 16px 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      #${MENU_ID} .utils-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      #${MENU_ID} .utils-title {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      #${MENU_ID} .utils-close {
        border: none;
        background: transparent;
        color: #f87171;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      #${MENU_ID} .utils-section {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 0;
        padding: 10px 12px;
        margin-bottom: 10px;
        background: rgba(24, 24, 24, 0.92);
      }
      #${MENU_ID} .utils-section:last-of-type {
        margin-bottom: 8px;
      }
      #${MENU_ID} .utils-section h3 {
        margin: 0 0 6px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #cfcfcf;
      }
      #${MENU_ID} .utils-section p {
        margin: 6px 0 0;
        color: #b8b8b8;
      }
      #${MENU_ID} .utils-btn {
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 0;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 600;
        background: #2d2d2d;
        color: #f5f5f5;
      }
      #${MENU_ID} .utils-btn.secondary {
        background: #1f1f1f;
      }
      #${MENU_ID} .utils-btn.active {
        background: #3a3a3a;
        border-color: rgba(255, 255, 255, 0.3);
      }
      #${MENU_ID} .utils-btn-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      #${MENU_ID} .utils-list {
        margin-top: 8px;
        padding: 8px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(10, 10, 10, 0.7);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        max-height: 140px;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-word;
      }
      #${MENU_ID} .utils-footer {
        font-size: 12px;
        color: #9a9a9a;
      }
      .utils-rc-flash {
        outline: 3px solid rgba(255, 255, 255, 0.98) !important;
        outline-offset: 2px;
        box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.85);
        animation: utils-rc-flash 520ms ease-out;
      }
      .utils-rc-pulse {
        position: fixed;
        width: 28px;
        height: 28px;
        border: 2px solid rgba(255, 255, 255, 0.95);
        background: rgba(0, 0, 0, 0.15);
        box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.85), 0 0 10px rgba(255, 255, 255, 0.35);
        transform: translate(-50%, -50%) scale(0.3);
        animation: utils-rc-pulse 520ms ease-out;
        pointer-events: none;
        z-index: 2147483647;
      }
      @keyframes utils-rc-pulse {
        0% { opacity: 0.95; transform: translate(-50%, -50%) scale(0.3); }
        55% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.8); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(2.4); }
      }
      @keyframes utils-rc-flash {
        0% {
          outline-color: rgba(255, 255, 255, 0.98);
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.85);
        }
        100% {
          outline-color: rgba(255, 255, 255, 0);
          box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
        }
      }
    `;
    document.head.appendChild(style);
  };

  const loadRightClickList = () => {
    try {
      const raw = window.localStorage.getItem(RIGHT_CLICK_LIST_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch (err) {
      console.warn('[userscript-utils] Failed to load right-click list:', err);
      return [];
    }
  };

  const loadVimiumLiteEnabled = () => {
    try {
      const raw = window.localStorage.getItem(VIMIUM_LITE_KEY);
      if (raw === null) return true;
      return raw === 'true';
    } catch (err) {
      console.warn('[userscript-utils] Failed to load vimium-lite setting:', err);
      return true;
    }
  };

  const saveVimiumLiteEnabled = () => {
    try {
      window.localStorage.setItem(VIMIUM_LITE_KEY, vimiumLiteEnabled ? 'true' : 'false');
    } catch (err) {
      console.warn('[userscript-utils] Failed to save vimium-lite setting:', err);
    }
  };

  const saveRightClickList = () => {
    try {
      window.localStorage.setItem(RIGHT_CLICK_LIST_KEY, JSON.stringify(rightClickList));
    } catch (err) {
      console.warn('[userscript-utils] Failed to save right-click list:', err);
    }
  };

  rightClickList = loadRightClickList();
  vimiumLiteEnabled = loadVimiumLiteEnabled();

  const updateRightClickListUI = () => {
    if (!rightClickListEl || !rightClickListCountEl) return;
    rightClickListCountEl.textContent = `${rightClickList.length} saved`;
    rightClickListEl.textContent = rightClickList.join('\n');
    if (rightClickCopyBtn) {
      rightClickCopyBtn.disabled = rightClickList.length === 0;
    }
    if (rightClickClearBtn) {
      rightClickClearBtn.disabled = rightClickList.length === 0;
    }
  };

  const updateVimiumLiteButton = () => {
    if (!vimiumLiteButton) return;
    vimiumLiteButton.textContent = vimiumLiteEnabled ? 'Vimium Lite: On' : 'Vimium Lite: Off';
    vimiumLiteButton.classList.toggle('active', vimiumLiteEnabled);
    vimiumLiteButton.classList.toggle('secondary', !vimiumLiteEnabled);
  };

  const buildMenu = () => {
    if (menuEl) return menuEl;
    ensureStyle();

    const panel = document.createElement('div');
    panel.id = MENU_ID;

    const header = document.createElement('div');
    header.className = 'utils-header';

    const title = document.createElement('div');
    title.className = 'utils-title';
    title.textContent = 'Userscript Utils';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'utils-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '\u2715';
    closeBtn.addEventListener('click', () => setMenuOpen(false));

    header.append(title, closeBtn);

    const auditSection = document.createElement('div');
    auditSection.className = 'utils-section';
    const auditTitle = document.createElement('h3');
    auditTitle.textContent = 'Image Host Audit';
    const auditBtn = document.createElement('button');
    auditBtn.type = 'button';
    auditBtn.className = 'utils-btn';
    auditBtn.textContent = 'Run audit overlay';
    auditBtn.addEventListener('click', () => runImageHostAudit());
    const auditDesc = document.createElement('p');
    auditDesc.textContent = 'Highlights images, iframes, and page links with a draggable report panel.';
    auditSection.append(auditTitle, auditBtn, auditDesc);

    const rightClickSection = document.createElement('div');
    rightClickSection.className = 'utils-section';
    const rightClickTitle = document.createElement('h3');
    rightClickTitle.textContent = 'Right-click Logger';
    const rightClickControls = document.createElement('div');
    rightClickControls.className = 'utils-btn-row';
    rightClickModeButtons = new Map();

    const makeModeButton = (label, mode) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'utils-btn';
      btn.textContent = label;
      btn.addEventListener('click', () => setRightClickMode(mode));
      rightClickModeButtons.set(mode, btn);
      return btn;
    };

    rightClickControls.append(
      makeModeButton('Disabled', RIGHT_CLICK_MODE_DISABLED),
      makeModeButton('Copy + Log', RIGHT_CLICK_MODE_COPY),
      makeModeButton('Save to List', RIGHT_CLICK_MODE_LIST)
    );

    const rightClickListHeader = document.createElement('div');
    rightClickListHeader.className = 'utils-btn-row';
    rightClickListCountEl = document.createElement('div');
    rightClickListCountEl.textContent = '0 saved';
    rightClickListCountEl.style.flex = '1';
    rightClickCopyBtn = document.createElement('button');
    rightClickCopyBtn.type = 'button';
    rightClickCopyBtn.className = 'utils-btn secondary';
    rightClickCopyBtn.textContent = 'Copy list';
    rightClickCopyBtn.addEventListener('click', () => {
      copyTextToClipboard(rightClickList.join('\n'));
    });
    rightClickClearBtn = document.createElement('button');
    rightClickClearBtn.type = 'button';
    rightClickClearBtn.className = 'utils-btn secondary';
    rightClickClearBtn.textContent = 'Clear list';
    rightClickClearBtn.addEventListener('click', () => {
      rightClickList = [];
      saveRightClickList();
      updateRightClickListUI();
    });
    rightClickListHeader.append(rightClickListCountEl, rightClickCopyBtn, rightClickClearBtn);

    rightClickListEl = document.createElement('div');
    rightClickListEl.className = 'utils-list';
    const rightClickDesc = document.createElement('p');
    rightClickDesc.textContent = 'Prevents the context menu and targets images/links based on the selected mode. Saved list persists via local storage.';
    rightClickSection.append(rightClickTitle, rightClickControls, rightClickDesc, rightClickListHeader, rightClickListEl);

    const navSection = document.createElement('div');
    navSection.className = 'utils-section';
    const navTitle = document.createElement('h3');
    navTitle.textContent = 'Navigation';
    vimiumLiteButton = document.createElement('button');
    vimiumLiteButton.type = 'button';
    vimiumLiteButton.className = 'utils-btn';
    vimiumLiteButton.addEventListener('click', () => {
      vimiumLiteEnabled = !vimiumLiteEnabled;
      if (!vimiumLiteEnabled) {
        stopScroll();
      }
      saveVimiumLiteEnabled();
      updateVimiumLiteButton();
    });
    updateVimiumLiteButton();
    const navDesc = document.createElement('p');
    navDesc.textContent = 'J/K scroll, G/big G jump, and numeric prefixes for speed.';
    navSection.append(navTitle, vimiumLiteButton, navDesc);

    const footer = document.createElement('div');
    footer.className = 'utils-footer';
    footer.textContent = `Toggle with ${TOGGLE_HINT}.`;

    panel.append(header, auditSection, rightClickSection, navSection, footer);
    menuEl = panel;
    updateRightClickModeButtons();
    updateRightClickListUI();
    return panel;
  };

  const setMenuOpen = (open) => {
    if (open) {
      if (!menuEl) {
        menuEl = buildMenu();
      }
      if (!menuEl.isConnected) {
        document.body.appendChild(menuEl);
      }
      if (!menuOpenedOnce) {
        menuOpenedOnce = true;
        setRightClickMode(RIGHT_CLICK_MODE_DISABLED);
      }
    } else if (menuEl && menuEl.isConnected) {
      menuEl.remove();
    }
  };

  const updateRightClickModeButtons = () => {
    if (!rightClickModeButtons) return;
    rightClickModeButtons.forEach((btn, mode) => {
      btn.classList.toggle('active', mode === rightClickMode);
      btn.classList.toggle('secondary', mode !== rightClickMode);
    });
  };

  const copyTextToClipboard = async (text) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.style.position = 'fixed';
        temp.style.top = '-1000px';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const flashElement = (el) => {
    if (!el || !el.classList) return;
    el.classList.remove('utils-rc-flash');
    requestAnimationFrame(() => {
      el.classList.add('utils-rc-flash');
      setTimeout(() => el.classList.remove('utils-rc-flash'), 450);
    });
  };

  const pulseAt = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const pulse = document.createElement('div');
    pulse.className = 'utils-rc-pulse';
    pulse.style.left = `${x}px`;
    pulse.style.top = `${y}px`;
    document.body.appendChild(pulse);
    setTimeout(() => pulse.remove(), 500);
  };

  const rightClickHandler = async (event) => {
    if (rightClickMode === RIGHT_CLICK_MODE_DISABLED) {
      return;
    }
    event.preventDefault();
    const target = event.target;
    if (!target || !target.tagName) {
      return;
    }

    if (target.tagName === 'IMG') {
      const src = target.src;
      if (!src) {
        return;
      }
      pulseAt(event.clientX, event.clientY);
      flashElement(target);
      if (rightClickMode === RIGHT_CLICK_MODE_COPY) {
        console.log('%c[Image Found]', 'color: #9ae6b4; font-weight: bold;', src);
        await copyTextToClipboard(src);
        console.log('%cCopied to clipboard!', 'color: #a3e635;');
      } else if (rightClickMode === RIGHT_CLICK_MODE_LIST) {
        rightClickList.push(src);
        saveRightClickList();
        updateRightClickListUI();
      }
      return;
    }

    const link = target.closest && target.closest('a');
    if (link) {
      const href = link.href;
      if (!href) {
        return;
      }
      pulseAt(event.clientX, event.clientY);
      flashElement(link);
      if (rightClickMode === RIGHT_CLICK_MODE_COPY) {
        console.log('%c[Link Found]', 'color: #facc15; font-weight: bold;', href);
        await copyTextToClipboard(href);
        console.log('%cCopied to clipboard!', 'color: #a3e635;');
      } else if (rightClickMode === RIGHT_CLICK_MODE_LIST) {
        rightClickList.push(href);
        saveRightClickList();
        updateRightClickListUI();
      }
    }
  };

  const setRightClickMode = (mode) => {
    rightClickMode = mode;
    if (rightClickMode !== RIGHT_CLICK_MODE_DISABLED && !rightClickListenerAttached) {
      ensureStyle();
      document.addEventListener('contextmenu', rightClickHandler);
      rightClickListenerAttached = true;
      console.log('%cRight-click logger active. Right-click an image or link to test.', 'background: #111; color: #f5f5f5; padding: 5px;');
    } else if (rightClickMode === RIGHT_CLICK_MODE_DISABLED && rightClickListenerAttached) {
      document.removeEventListener('contextmenu', rightClickHandler);
      rightClickListenerAttached = false;
      console.log('%cRight-click logger disabled.', 'background: #111; color: #f87171; padding: 5px;');
    }
    updateRightClickModeButtons();
  };

  const clearNumericPrefix = () => {
    if (numericPrefixTimer) {
      clearTimeout(numericPrefixTimer);
      numericPrefixTimer = null;
    }
    numericPrefix = '';
  };

  const queueNumericPrefixClear = () => {
    if (numericPrefixTimer) {
      clearTimeout(numericPrefixTimer);
    }
    numericPrefixTimer = setTimeout(() => {
      numericPrefix = '';
      numericPrefixTimer = null;
    }, 1000);
  };

  const getNumericMultiplier = () => {
    if (!numericPrefix) return 1;
    const parsed = Number.parseInt(numericPrefix, 10);
    clearNumericPrefix();
    if (!Number.isFinite(parsed)) return 1;
    if (parsed === 0) return 10;
    return parsed > 0 ? parsed : 1;
  };

  const clearGPending = () => {
    if (gPendingTimer) {
      clearTimeout(gPendingTimer);
      gPendingTimer = null;
    }
    gPending = false;
  };

  const setGPending = () => {
    clearGPending();
    gPending = true;
    gPendingTimer = setTimeout(() => {
      gPending = false;
      gPendingTimer = null;
    }, 700);
  };

  const stopScroll = () => {
    scrollDirection = 0;
    scrollMultiplier = 1;
    if (scrollRafId !== null) {
      cancelAnimationFrame(scrollRafId);
      scrollRafId = null;
    }
  };

  const stepScroll = (ts) => {
    if (scrollDirection === 0) {
      scrollRafId = null;
      return;
    }
    const dt = Math.min(64, ts - scrollLastTs);
    scrollLastTs = ts;
    const delta = scrollDirection * SCROLL_SPEED * (dt / 1000) * scrollMultiplier;
    window.scrollBy(0, delta);
    scrollRafId = requestAnimationFrame(stepScroll);
  };

  const startScroll = (direction, multiplier) => {
    scrollDirection = direction;
    scrollMultiplier = multiplier;
    if (scrollRafId === null) {
      scrollLastTs = performance.now();
      window.scrollBy(0, direction * 18 * multiplier);
      scrollRafId = requestAnimationFrame(stepScroll);
    }
  };

  const jumpToEdge = (direction) => {
    const doc = document.documentElement;
    const maxY = Math.max(0, doc.scrollHeight - window.innerHeight);
    const target = direction < 0 ? 0 : maxY;
    const offset = direction < 0 ? SCROLL_JUMP_PADDING : -SCROLL_JUMP_PADDING;
    window.scrollTo({ top: Math.max(0, Math.min(maxY, target + offset)) });
  };

  const onKeyDown = (event) => {
    if (event.repeat) return;
    if (menuEl && menuEl.isConnected) {
      if (event.key === '1') {
        event.preventDefault();
        setRightClickMode(RIGHT_CLICK_MODE_DISABLED);
        return;
      }
      if (event.key === '2') {
        event.preventDefault();
        setRightClickMode(RIGHT_CLICK_MODE_COPY);
        return;
      }
      if (event.key === '3') {
        event.preventDefault();
        setRightClickMode(RIGHT_CLICK_MODE_LIST);
        return;
      }
    }
    if (shouldIgnoreKeyEvent(event)) return;
    if (!event.altKey) return;
    const key = event.key;
    const isPrimary = key && key.toLowerCase && key.toLowerCase() === 'q';
    const isSecondary = event.shiftKey && (key === '{' || key === '[');
    if (!isPrimary && !isSecondary) return;
    if (shouldIgnoreKeyEvent(event)) return;
    event.preventDefault();
    setMenuOpen(!menuEl || !menuEl.isConnected);
  };

  const onKeyDownNav = (event) => {
    if (shouldIgnoreKeyEvent(event)) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (menuEl && menuEl.isConnected) return;
    if (!vimiumLiteEnabled) return;

    const key = event.key;
    if (event.repeat) {
      const lowerRepeatKey = key && key.toLowerCase ? key.toLowerCase() : key;
      if (lowerRepeatKey === 'j' || lowerRepeatKey === 'k') {
        event.preventDefault();
      }
      return;
    }
    if (key >= '0' && key <= '9') {
      numericPrefix = key;
      queueNumericPrefixClear();
      event.preventDefault();
      return;
    }

    const lowerKey = key && key.toLowerCase ? key.toLowerCase() : key;
    if (event.shiftKey && lowerKey === 'g') {
      event.preventDefault();
      jumpToEdge(1);
      clearNumericPrefix();
      clearGPending();
      return;
    }
    if (gPending) {
      clearGPending();
      if (lowerKey === 'g') {
        event.preventDefault();
        jumpToEdge(-1);
        clearNumericPrefix();
        return;
      }
      if (lowerKey === 'k') {
        event.preventDefault();
        jumpToEdge(-1);
        clearNumericPrefix();
        return;
      }
      if (lowerKey === 'j') {
        event.preventDefault();
        jumpToEdge(1);
        clearNumericPrefix();
        return;
      }
    }

    if (lowerKey === 'g') {
      event.preventDefault();
      setGPending();
      clearNumericPrefix();
      return;
    }

    if (lowerKey === 'j' || lowerKey === 'k') {
      event.preventDefault();
      const multiplier = getNumericMultiplier();
      startScroll(lowerKey === 'j' ? 1 : -1, multiplier);
      return;
    }

    clearNumericPrefix();
  };

  const onKeyUpNav = (event) => {
    const lowerKey = event.key && event.key.toLowerCase ? event.key.toLowerCase() : event.key;
    if (lowerKey === 'j' || lowerKey === 'k') {
      stopScroll();
    }
  };

  setRightClickMode(RIGHT_CLICK_MODE_COPY);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('keydown', onKeyDownNav, true);
  document.addEventListener('keyup', onKeyUpNav, true);
  window.addEventListener('blur', stopScroll);

  const runImageHostAudit = () => {
    const previousAudit = window.__imageHostAudit;
    if (previousAudit && previousAudit.cleanup) {
      try {
        previousAudit.cleanup();
      } catch (err) {
        console.warn('[img-host-audit] Previous cleanup failed:', err);
      }
    }

    const OVERLAY_ID = 'img-host-audit-overlay';
    const STYLE_ID = 'img-host-audit-style';
    const HIGHLIGHT_CLASS = 'img-host-audit-highlight';
    const SELECTED_CLASS = 'img-host-audit-selected';
    const FRAME_OVERLAY_CLASS = 'img-host-audit-frame-overlay';

    const existingOverlay = document.getElementById(OVERLAY_ID);
    if (existingOverlay) {
      existingOverlay.remove();
    }
    const existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle) {
      existingStyle.remove();
    }
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((node) => {
      node.classList.remove(HIGHLIGHT_CLASS, SELECTED_CLASS);
      delete node.dataset.imgHostAuditIndex;
      delete node.dataset.imgHostAuditFrameIndex;
      delete node.dataset.imgHostAuditAnchorIndex;
    });
    document.querySelectorAll(`.${FRAME_OVERLAY_CLASS}`).forEach((node) => node.remove());

    const images = Array.from(document.images || []);
    const frames = Array.from(document.querySelectorAll('iframe') || []);
    const anchors = Array.from(document.querySelectorAll('a[href]') || []);
    if (!images.length && !frames.length && !anchors.length) {
      console.info('[img-host-audit] No <img>, <iframe>, or <a> elements with hrefs found on this page.');
      return;
    }

    const toAbsoluteUrl = (value) => {
      if (!value) return null;
      try {
        return new URL(value, document.baseURI);
      } catch (err) {
        return null;
      }
    };

    const describeSrcHost = (rawSrc, { missingLabel = '(missing src)', invalidLabel = '(invalid URL)' } = {}) => {
      if (!rawSrc) {
        return {
          key: missingLabel,
          url: '',
          label: missingLabel
        };
      }
      if (rawSrc.startsWith('data:')) {
        return {
          key: '(inline data URI)',
          url: rawSrc,
          label: '(inline data URI)'
        };
      }
      const parsed = toAbsoluteUrl(rawSrc);
      if (!parsed) {
        return {
          key: invalidLabel,
          url: rawSrc,
          label: invalidLabel
        };
      }
      return {
        key: parsed.host || '(no host)',
        url: parsed.href,
        label: parsed.host || '(no host)'
      };
    };

    const normalizeImageHost = (img) => {
      return describeSrcHost(img.currentSrc || img.src || '', { invalidLabel: '(invalid image URL)' });
    };

    const normalizeFrameHost = (frame) => {
      return describeSrcHost(frame.getAttribute('src') || frame.src || '', { invalidLabel: '(invalid iframe URL)' });
    };

    const normalizeAnchorHost = (anchor) => {
      const hrefValue = anchor.getAttribute('href') || anchor.href || '';
      if (!hrefValue) {
        return {
          key: '(empty link href)',
          url: '',
          label: '(empty link href)'
        };
      }
      if (hrefValue.startsWith('javascript:')) {
        return {
          key: '(javascript link)',
          url: hrefValue,
          label: '(javascript link)'
        };
      }
      return describeSrcHost(hrefValue, { missingLabel: '(missing href)', invalidLabel: '(invalid link URL)' });
    };

    const normalizeLinkHost = (img) => {
      const link = img.closest('a[href]');
      if (!link) {
        return {
          key: '(no link)',
          href: '',
          label: '(no link)'
        };
      }
      const hrefValue = link.getAttribute('href') || '';
      if (!hrefValue) {
        return {
          key: '(empty link href)',
          href: '',
          label: '(empty link href)'
        };
      }
      if (hrefValue.startsWith('javascript:')) {
        return {
          key: '(javascript link)',
          href: hrefValue,
          label: '(javascript link)'
        };
      }
      const parsed = toAbsoluteUrl(hrefValue);
      if (!parsed) {
        return {
          key: '(invalid link URL)',
          href: hrefValue,
          label: '(invalid link URL)'
        };
      }
      return {
        key: parsed.host || '(no link host)',
        href: parsed.href,
        label: parsed.host || '(no link host)'
      };
    };

    const imageEntries = images.map((img, index) => {
      const imageHost = normalizeImageHost(img);
      const linkHost = normalizeLinkHost(img);
      img.classList.add(HIGHLIGHT_CLASS);
      img.dataset.imgHostAuditIndex = String(index);
      return {
        el: img,
        type: 'image',
        index,
        src: imageHost.url || img.src || '',
        imageHostKey: imageHost.key,
        linkHostKey: linkHost.key,
        linkHref: linkHost.href,
        hostLabel: imageHost.label,
        linkHostLabel: linkHost.label,
        copyValue: imageHost.url || img.src || ''
      };
    });

    const frameEntries = frames.map((frame, index) => {
      const frameHost = normalizeFrameHost(frame);
      frame.classList.add(HIGHLIGHT_CLASS);
      frame.dataset.imgHostAuditFrameIndex = String(index);
      return {
        el: frame,
        type: 'iframe',
        index,
        src: frameHost.url || frame.src || '',
        frameHostKey: frameHost.key,
        hostLabel: frameHost.label,
        overlay: null,
        updateOverlay: null,
        copyValue: frameHost.url || frame.src || ''
      };
    });

    const anchorEntries = anchors.map((anchor, index) => {
      const anchorHost = normalizeAnchorHost(anchor);
      anchor.classList.add(HIGHLIGHT_CLASS);
      anchor.dataset.imgHostAuditAnchorIndex = String(index);
      const href = anchorHost.url || anchor.href || anchor.getAttribute('href') || '';
      return {
        el: anchor,
        type: 'anchor',
        index,
        href,
        anchorHostKey: anchorHost.key,
        hostLabel: anchorHost.label,
        copyValue: href
      };
    });

    const createFrameOverlay = (entry) => {
      const overlay = document.createElement('div');
      overlay.className = FRAME_OVERLAY_CLASS;
      overlay.dataset.imgHostAuditFrameIndex = String(entry.index);
      const updateOverlay = () => {
        const rect = entry.el.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (width === 0 || height === 0) {
          overlay.style.display = 'none';
          return;
        }
        overlay.style.display = 'block';
        overlay.style.left = `${window.scrollX + rect.left}px`;
        overlay.style.top = `${window.scrollY + rect.top}px`;
        overlay.style.width = `${width}px`;
        overlay.style.height = `${height}px`;
      };
      entry.overlay = overlay;
      entry.updateOverlay = updateOverlay;
      document.body.appendChild(overlay);
      updateOverlay();
    };

    frameEntries.forEach(createFrameOverlay);

    const buildHostMap = (entries, keyProp, urlProp) => {
      const map = new Map();
      entries.forEach((entry) => {
        const key = entry[keyProp] || '(unknown)';
        if (!map.has(key)) {
          map.set(key, { count: 0, entries: [], urls: [] });
        }
        const info = map.get(key);
        info.count += 1;
        info.entries.push(entry);
        const value = entry[urlProp];
        if (value) {
          info.urls.push(value);
        }
      });
      return map;
    };

    const imageHostMap = buildHostMap(imageEntries, 'imageHostKey', 'src');
    const linkHostMap = buildHostMap(imageEntries, 'linkHostKey', 'linkHref');
    const frameHostMap = buildHostMap(frameEntries, 'frameHostKey', 'src');
    const anchorHostMap = buildHostMap(anchorEntries, 'anchorHostKey', 'href');
    const allEntries = [...imageEntries, ...frameEntries, ...anchorEntries];

    const makeOverlayDraggable = (node, handle) => {
      const minMargin = 8;
      let isDragging = false;
      let pointerId = null;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;

      const stopDragging = () => {
        if (!isDragging) {
          return;
        }
        isDragging = false;
        if (pointerId !== null) {
          handle.releasePointerCapture && handle.releasePointerCapture(pointerId);
          pointerId = null;
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', stopDragging);
        window.removeEventListener('pointercancel', stopDragging);
      };

      const onPointerMove = (event) => {
        if (!isDragging || (pointerId !== null && event.pointerId !== pointerId)) {
          return;
        }
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        const maxLeft = Math.max(minMargin, window.innerWidth - node.offsetWidth - minMargin);
        const maxTop = Math.max(minMargin, window.innerHeight - node.offsetHeight - minMargin);
        const nextLeft = Math.min(maxLeft, Math.max(minMargin, startLeft + dx));
        const nextTop = Math.min(maxTop, Math.max(minMargin, startTop + dy));
        node.style.left = `${nextLeft}px`;
        node.style.top = `${nextTop}px`;
        node.style.right = 'auto';
        event.preventDefault();
      };

      const onPointerDown = (event) => {
        if (event.button !== undefined && event.button !== 0) {
          return;
        }
        isDragging = true;
        pointerId = typeof event.pointerId === 'number' ? event.pointerId : null;
        const rect = node.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        startX = event.clientX;
        startY = event.clientY;
        node.style.left = `${startLeft}px`;
        node.style.top = `${startTop}px`;
        node.style.right = 'auto';
        if (pointerId !== null) {
          handle.setPointerCapture && handle.setPointerCapture(pointerId);
        }
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', stopDragging);
        window.addEventListener('pointercancel', stopDragging);
        event.preventDefault();
      };

      handle.addEventListener('pointerdown', onPointerDown);

      return () => {
        handle.removeEventListener('pointerdown', onPointerDown);
        stopDragging();
      };
    };

    let frameOverlayRaf = null;
    const queueFrameOverlayUpdate = () => {
      if (frameOverlayRaf) {
        return;
      }
      frameOverlayRaf = window.requestAnimationFrame(() => {
        frameOverlayRaf = null;
        frameEntries.forEach((entry) => entry.updateOverlay && entry.updateOverlay());
      });
    };
    const scrollHandler = () => queueFrameOverlayUpdate();
    const resizeHandler = () => queueFrameOverlayUpdate();
    let frameResizeObserver = null;
    let frameTrackingActive = false;
    if (frameEntries.length) {
      frameTrackingActive = true;
      window.addEventListener('scroll', scrollHandler, true);
      window.addEventListener('resize', resizeHandler);
      if (typeof ResizeObserver === 'function') {
        frameResizeObserver = new ResizeObserver(() => queueFrameOverlayUpdate());
        frameEntries.forEach((entry) => frameResizeObserver.observe(entry.el));
      }
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${OVERLAY_ID} {
        position: fixed;
        top: 16px;
        right: 16px;
        width: 360px;
        max-height: calc(50vh);
        overflow: auto;
        background: rgba(12, 12, 12, 0.96);
        color: #f3f3f3;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        line-height: 1.4;
        border-radius: 0;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        z-index: 2147483647;
        padding: 12px 14px 16px;
        box-sizing: border-box;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      #${OVERLAY_ID} h2 {
        margin: 0;
        font-size: 16px;
      }
      #${OVERLAY_ID} .img-host-audit-drag {
        cursor: grab;
        user-select: none;
        padding-right: 32px;
        margin-bottom: 10px;
      }
      #${OVERLAY_ID} .img-host-audit-drag:active {
        cursor: grabbing;
      }
      #${OVERLAY_ID} h3 {
        margin: 12px 0 6px;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #c4c4c4;
      }
      #${OVERLAY_ID} button {
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 0;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: 600;
        background: #2b2b2b;
        color: #f1f1f1;
      }
      #${OVERLAY_ID} button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      #${OVERLAY_ID} .img-host-audit-button-active {
        background: #3b3b3b;
        color: #f1f1f1;
      }
      #${OVERLAY_ID} .img-host-audit-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 0;
        padding: 6px 8px;
        margin-bottom: 6px;
        gap: 6px;
        background: rgba(24, 24, 24, 0.9);
      }
      #${OVERLAY_ID} .img-host-audit-row strong {
        font-size: 13px;
      }
      #${OVERLAY_ID} .img-host-audit-row .img-host-audit-buttons {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }
      #${OVERLAY_ID} .img-host-audit-summary {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 8px;
      }
      #${OVERLAY_ID} .img-host-audit-summary span {
        display: block;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 0;
        padding: 8px;
      }
      #${OVERLAY_ID} .img-host-audit-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 8px;
      }
      #${OVERLAY_ID} .img-host-audit-footer {
        font-size: 12px;
        color: #a3a3a3;
        margin-top: 4px;
      }
      #${OVERLAY_ID} .img-host-audit-close {
        position: absolute;
        top: 6px;
        right: 8px;
        background: transparent;
        color: #f87171;
        border: none;
        font-size: 18px;
        padding: 0;
        line-height: 1;
      }
      .${HIGHLIGHT_CLASS} {
        outline: 2px solid rgba(200, 200, 200, 0.9) !important;
        outline-offset: 2px;
        box-shadow: 0 0 0 2px rgba(200, 200, 200, 0.35);
        transition: outline-color 120ms ease, box-shadow 120ms ease;
      }
      .${SELECTED_CLASS} {
        outline: 3px solid rgba(255, 255, 255, 0.95) !important;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.4);
      }
      .${FRAME_OVERLAY_CLASS} {
        position: absolute;
        border: 2px solid rgba(200, 200, 200, 0.9);
        border-radius: 0;
        pointer-events: none;
        z-index: 2147483646;
        box-shadow: 0 0 0 2px rgba(200, 200, 200, 0.35);
        transition: border-color 120ms ease, box-shadow 120ms ease;
      }
      .${FRAME_OVERLAY_CLASS}.selected {
        border-color: rgba(255, 255, 255, 0.95);
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.4);
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;

    const closeButton = document.createElement('button');
    closeButton.className = 'img-host-audit-close';
    closeButton.type = 'button';
    closeButton.textContent = '\u2715';

    const title = document.createElement('h2');
    title.textContent = 'Image Host Audit';

    const dragHandle = document.createElement('div');
    dragHandle.className = 'img-host-audit-drag';
    dragHandle.title = 'Drag to move this panel';
    dragHandle.appendChild(title);

    const summaryGrid = document.createElement('div');
    summaryGrid.className = 'img-host-audit-summary';

    const totalImages = document.createElement('span');
    totalImages.textContent = `${images.length} image${images.length === 1 ? '' : 's'} total`;

    const uniqueHostCount = imageHostMap.size;
    const imageHosts = document.createElement('span');
    imageHosts.textContent = `${uniqueHostCount} image host${uniqueHostCount === 1 ? '' : 's'}`;

    const linkedCount = [...imageEntries].filter((entry) => entry.linkHostKey !== '(no link)').length;
    const linkHostsUnique = linkHostMap.size;
    const linkedSummary = document.createElement('span');
    linkedSummary.textContent = `${linkedCount} linked image${linkedCount === 1 ? '' : 's'}`;

    const linkHostSummary = document.createElement('span');
    linkHostSummary.textContent = `${linkHostsUnique} link host${linkHostsUnique === 1 ? '' : 's'}`;

    summaryGrid.append(totalImages, imageHosts, linkedSummary, linkHostSummary);

    if (frameEntries.length) {
      const iframeCount = document.createElement('span');
      iframeCount.textContent = `${frameEntries.length} iframe${frameEntries.length === 1 ? '' : 's'}`;

      const iframeHostCount = document.createElement('span');
      const iframeHostsUnique = frameHostMap.size;
      iframeHostCount.textContent = `${iframeHostsUnique} iframe host${iframeHostsUnique === 1 ? '' : 's'}`;

      summaryGrid.append(iframeCount, iframeHostCount);
    }

    if (anchorEntries.length) {
      const pageLinkCount = document.createElement('span');
      pageLinkCount.textContent = `${anchorEntries.length} page link${anchorEntries.length === 1 ? '' : 's'}`;

      const pageLinkHostCount = document.createElement('span');
      const pageLinkHostsUnique = anchorHostMap.size;
      pageLinkHostCount.textContent = `${pageLinkHostsUnique} page link host${pageLinkHostsUnique === 1 ? '' : 's'}`;

      summaryGrid.append(pageLinkCount, pageLinkHostCount);
    }

    const actions = document.createElement('div');
    actions.className = 'img-host-audit-actions';

    const highlightAllBtn = document.createElement('button');
    highlightAllBtn.type = 'button';
    highlightAllBtn.textContent = 'Highlight all';

    const clearSelectionBtn = document.createElement('button');
    clearSelectionBtn.type = 'button';
    clearSelectionBtn.textContent = 'Clear selection';

    const copyAllImagesBtn = document.createElement('button');
    copyAllImagesBtn.type = 'button';
    copyAllImagesBtn.textContent = 'Copy all image URLs';

    const copyAllLinksBtn = document.createElement('button');
    copyAllLinksBtn.type = 'button';
    copyAllLinksBtn.textContent = 'Copy all link targets';

    const copyAllPageLinksBtn = document.createElement('button');
    copyAllPageLinksBtn.type = 'button';
    copyAllPageLinksBtn.textContent = 'Copy all page links';
    copyAllPageLinksBtn.disabled = anchorEntries.length === 0;

    const copyAllIframesBtn = document.createElement('button');
    copyAllIframesBtn.type = 'button';
    copyAllIframesBtn.textContent = 'Copy all iframe URLs';
    copyAllIframesBtn.disabled = frameEntries.length === 0;

    const copyHighlightedBtn = document.createElement('button');
    copyHighlightedBtn.type = 'button';
    copyHighlightedBtn.textContent = 'Copy highlighted';
    copyHighlightedBtn.disabled = true;

    actions.append(
      highlightAllBtn,
      clearSelectionBtn,
      copyAllImagesBtn,
      copyAllLinksBtn,
      copyAllPageLinksBtn,
      copyAllIframesBtn,
      copyHighlightedBtn
    );

    const highlightStatus = document.createElement('div');
    highlightStatus.className = 'img-host-audit-footer';
    highlightStatus.textContent = 'Click a host to highlight its images, iframes, or links. Drag the title bar to move.';

    const imageHostSectionTitle = document.createElement('h3');
    imageHostSectionTitle.textContent = 'Image Hosts';
    const imageHostList = document.createElement('div');

    const iframeHostSectionTitle = document.createElement('h3');
    iframeHostSectionTitle.textContent = 'Iframe Hosts';
    const iframeHostList = document.createElement('div');

    const linkHostSectionTitle = document.createElement('h3');
    linkHostSectionTitle.textContent = 'Linked Hosts';
    const linkHostList = document.createElement('div');

    const pageLinkSectionTitle = document.createElement('h3');
    pageLinkSectionTitle.textContent = 'Page Links';
    const pageLinkList = document.createElement('div');

    overlay.append(closeButton, dragHandle, summaryGrid, actions, highlightStatus, imageHostSectionTitle, imageHostList);
    if (frameEntries.length) {
      overlay.append(iframeHostSectionTitle, iframeHostList);
    }
    overlay.append(linkHostSectionTitle, linkHostList);
    if (anchorEntries.length) {
      overlay.append(pageLinkSectionTitle, pageLinkList);
    }
    document.body.appendChild(overlay);
    const detachDrag = makeOverlayDraggable(overlay, dragHandle);

    let lastHighlightedEntries = [];
    const hostHighlightControls = [];

    const updateStatus = (message) => {
      highlightStatus.textContent = message;
    };

    const setHighlightedEntries = (entries, activeGroupId = null) => {
      const selectedSet = new Set(entries);
      allEntries.forEach((entry) => {
        const isSelected = selectedSet.has(entry);
        entry.el.classList.toggle(SELECTED_CLASS, isSelected);
        if (entry.type === 'iframe' && entry.overlay) {
          entry.overlay.classList.toggle('selected', isSelected);
        }
      });
      lastHighlightedEntries = entries;
      copyHighlightedBtn.disabled = entries.length === 0;
      hostHighlightControls.forEach((control) => {
        const isActive = Boolean(entries.length) && control.groupId === activeGroupId;
        control.button.classList.toggle('img-host-audit-button-active', isActive);
      });
    };

    const highlightAll = () => {
      setHighlightedEntries(allEntries, null);
      updateStatus(`Highlighted all ${allEntries.length} element${allEntries.length === 1 ? '' : 's'}.`);
    };

    const clearSelection = () => {
      setHighlightedEntries([], null);
      updateStatus('Selection cleared.');
    };

    const copyText = async (text, successMessage) => {
      if (!text) {
        updateStatus('Nothing to copy.');
        return;
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const temp = document.createElement('textarea');
          temp.value = text;
          temp.style.position = 'fixed';
          temp.style.top = '-1000px';
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          temp.remove();
        }
        updateStatus(successMessage || 'Copied to clipboard.');
      } catch (err) {
        console.error('[img-host-audit] Clipboard copy failed:', err);
        updateStatus('Clipboard copy failed. Check console for details.');
      }
    };

    const createHostRows = (map, listEl, { typeLabel = 'item', noun = 'item', nounPlural = null } = {}) => {
      const rows = Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
      rows.forEach(([host, info]) => {
        const row = document.createElement('div');
        row.className = 'img-host-audit-row';

        const label = document.createElement('div');
        label.style.flex = '1';
        const strong = document.createElement('strong');
        strong.textContent = host;
        const pluralForm = nounPlural || `${noun}s`;
        const nounLabel = info.count === 1 ? noun : pluralForm;
        const count = document.createElement('div');
        count.style.fontSize = '12px';
        count.style.color = '#cbd5f5';
        count.textContent = `${info.count} ${nounLabel}`;
        label.append(strong, count);

        const buttons = document.createElement('div');
        buttons.className = 'img-host-audit-buttons';
        const highlightBtn = document.createElement('button');
        highlightBtn.type = 'button';
        highlightBtn.textContent = 'Highlight';
        const groupId = `${typeLabel}:${host}`;
        highlightBtn.addEventListener('click', () => {
          setHighlightedEntries(info.entries, groupId);
          updateStatus(`Highlighted ${info.count} ${nounLabel} for ${typeLabel} host "${host}".`);
        });
        hostHighlightControls.push({ button: highlightBtn, groupId });

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.textContent = 'Copy URLs';
        copyBtn.disabled = info.urls.length === 0;
        copyBtn.addEventListener('click', () => {
          copyText(info.urls.join('\n'), `Copied ${info.urls.length} URL${info.urls.length === 1 ? '' : 's'} for ${typeLabel} host "${host}".`);
        });

        buttons.append(highlightBtn, copyBtn);
        row.append(label, buttons);
        listEl.appendChild(row);
      });
    };

    createHostRows(imageHostMap, imageHostList, { typeLabel: 'image', noun: 'image' });
    if (frameEntries.length) {
      createHostRows(frameHostMap, iframeHostList, { typeLabel: 'iframe', noun: 'iframe' });
    }
    createHostRows(linkHostMap, linkHostList, { typeLabel: 'linked image', noun: 'linked image', nounPlural: 'linked images' });
    if (anchorEntries.length) {
      createHostRows(anchorHostMap, pageLinkList, { typeLabel: 'page link', noun: 'link' });
    }

    highlightAllBtn.addEventListener('click', highlightAll);
    clearSelectionBtn.addEventListener('click', clearSelection);
    copyAllImagesBtn.addEventListener('click', () => {
      const urls = imageEntries.map((entry) => entry.src).filter(Boolean);
      copyText(urls.join('\n'), `Copied ${urls.length} image URL${urls.length === 1 ? '' : 's'}.`);
    });
    copyAllLinksBtn.addEventListener('click', () => {
      const urls = imageEntries.map((entry) => entry.linkHref).filter(Boolean);
      copyText(urls.join('\n'), `Copied ${urls.length} link target${urls.length === 1 ? '' : 's'}.`);
    });
    copyAllPageLinksBtn.addEventListener('click', () => {
      const urls = anchorEntries.map((entry) => entry.href).filter(Boolean);
      copyText(urls.join('\n'), `Copied ${urls.length} page link${urls.length === 1 ? '' : 's'}.`);
    });
    copyAllIframesBtn.addEventListener('click', () => {
      const urls = frameEntries.map((entry) => entry.src).filter(Boolean);
      copyText(urls.join('\n'), `Copied ${urls.length} iframe URL${urls.length === 1 ? '' : 's'}.`);
    });
    copyHighlightedBtn.addEventListener('click', () => {
      const urls = lastHighlightedEntries.map((entry) => entry.copyValue).filter(Boolean);
      copyText(urls.join('\n'), `Copied ${urls.length} highlighted URL${urls.length === 1 ? '' : 's'}.`);
    });

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) {
        return;
      }
      cleanedUp = true;
      if (frameTrackingActive) {
        window.removeEventListener('scroll', scrollHandler, true);
        window.removeEventListener('resize', resizeHandler);
      }
      if (frameResizeObserver) {
        frameResizeObserver.disconnect();
        frameResizeObserver = null;
      }
      if (frameOverlayRaf) {
        cancelAnimationFrame(frameOverlayRaf);
        frameOverlayRaf = null;
      }
      allEntries.forEach((entry) => {
        entry.el.classList.remove(HIGHLIGHT_CLASS, SELECTED_CLASS);
        if (entry.type === 'image') {
          delete entry.el.dataset.imgHostAuditIndex;
        } else if (entry.type === 'iframe') {
          delete entry.el.dataset.imgHostAuditFrameIndex;
          if (entry.overlay) {
            entry.overlay.remove();
            entry.overlay = null;
            entry.updateOverlay = null;
          }
        } else if (entry.type === 'anchor') {
          delete entry.el.dataset.imgHostAuditAnchorIndex;
        }
      });
      if (overlay.parentNode) {
        overlay.remove();
      }
      if (style.parentNode) {
        style.remove();
      }
      if (typeof detachDrag === 'function') {
        detachDrag();
      }
    };

    closeButton.addEventListener('click', () => {
      updateStatus('Overlay closed.');
      cleanup();
    });

    const consoleImageData = imageEntries.map((entry) => ({
      type: 'image',
      index: entry.index,
      src: entry.src,
      imageHost: entry.imageHostKey,
      linkHost: entry.linkHostKey,
      linkHref: entry.linkHref || '(none)'
    }));
    if (consoleImageData.length) {
      console.info('[img-host-audit] Images');
      console.table(consoleImageData);
    }
    const consoleFrameData = frameEntries.map((entry) => ({
      type: 'iframe',
      index: entry.index,
      src: entry.src,
      frameHost: entry.frameHostKey
    }));
    if (consoleFrameData.length) {
      console.info('[img-host-audit] Iframes');
      console.table(consoleFrameData);
    }

    const consoleLinkData = anchorEntries.map((entry) => ({
      type: 'link',
      index: entry.index,
      href: entry.href,
      linkHost: entry.anchorHostKey
    }));
    if (consoleLinkData.length) {
      console.info('[img-host-audit] Page Links');
      console.table(consoleLinkData);
    }

    window.__imageHostAudit = {
      images: imageEntries,
      iframes: frameEntries,
      links: anchorEntries,
      imageHosts: imageHostMap,
      iframeHosts: frameHostMap,
      linkHosts: linkHostMap,
      pageLinkHosts: anchorHostMap,
      cleanup
    };
  };
})();
