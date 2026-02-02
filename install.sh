#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
utils_path="${script_dir}/utils.user.js"
token_path="${HOME}/.local/share/.chr-util-token.txt"

if [[ ! -f "${utils_path}" ]]; then
  printf 'Error: %s not found\n' "${utils_path}" >&2
  exit 1
fi

abs_utils_path=$(readlink -f "${utils_path}")

wrapper_path="${script_dir}/wrapper.js"

if [[ ! -f "${token_path}" ]]; then
  mkdir -p "$(dirname "${token_path}")"
  python - <<'PY' > "${token_path}"
import secrets
print(secrets.token_hex(32))
PY
  chmod 600 "${token_path}"
fi

token_value=$(tr -d '\n' < "${token_path}")

cat > "${wrapper_path}" <<EOF_WRAPPER
// ==UserScript==
// @name         Userscript Utils (loader)
// @namespace    https://example.local/
// @version      0.0.0
// @description  Loads Userscript Utils from disk
// @match        *://*/*
// @match        file:///*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      127.0.0.1
// @require      file://${abs_utils_path}
// ==/UserScript==

(function () {
  'use strict';
  const tokenValue = '${token_value}';
  if (typeof GM_setValue === 'function' && tokenValue) {
    GM_setValue('chr-utils-token', tokenValue);
  }
})();
EOF_WRAPPER

printf "Copy the loader below into Tampermonkey. Make sure in the extension settings you have 'Allow access to file URLs' enabled.\n-----\n"
cat "${wrapper_path}"
