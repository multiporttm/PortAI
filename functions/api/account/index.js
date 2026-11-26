/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// POST /api/account (create) · DELETE /api/account (delete everything)
import { createAccount, deleteAccount } from '../../../lib/portai-sync.mjs';

export const onRequestPost = ({ request, env }) => createAccount(request, env);
export const onRequestDelete = ({ request, env }) => deleteAccount(request, env);
