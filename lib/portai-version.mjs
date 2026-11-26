/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/** Add ?v=<version> to relative ES module imports, e.g. `from './vault.js'`. */
export function versionImports(code, v) {
  return code.replace(/(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.{1,2}\/[^'"?]+\.m?js)\2/g, (m, pre, q, path) => `${pre}${q}${path}?v=${v}${q}`);
}
