/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// PUT /api/chats/:id · DELETE /api/chats/:id
import { putChat, deleteChat } from '../../../lib/portai-sync.mjs';

export const onRequestPut = ({ request, env, params }) => putChat(request, env, params.id);
export const onRequestDelete = ({ request, env, params }) => deleteChat(request, env, params.id);
