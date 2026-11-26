// PUT /api/chats/:id · DELETE /api/chats/:id
import { putChat, deleteChat } from '../../../lib/portai-sync.mjs';

export const onRequestPut = ({ request, env, params }) => putChat(request, env, params.id);
export const onRequestDelete = ({ request, env, params }) => deleteChat(request, env, params.id);
