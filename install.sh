#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
utils_path="${script_dir}/utils.user.js"

if [[ ! -f "${utils_path}" ]]; then
  printf 'Error: %s not found\n' "${utils_path}" >&2
  exit 1
fi

abs_utils_path=$(readlink -f "${utils_path}")

wrapper_path="${script_dir}/wrapper.js"

cat > "${wrapper_path}" <<EOF_WRAPPER
// ==UserScript==
// @name         Userscript Utils (loader)
// @namespace    https://example.local/
// @version      0.0.0
// @description  Loads Userscript Utils from disk
// @match        *://*/*
// @match        file:///*
// @grant        none
// @require      file://${abs_utils_path}
// ==/UserScript==

(function () {
  'use strict';
  // Intentionally empty: the required file contains all logic.
})();
EOF_WRAPPER

printf "Copy the loader below into Tampermonkey. Make sure in the extension settings you have 'Allow access to file URLs' enabled.\n-----\n"
cat "${wrapper_path}"
