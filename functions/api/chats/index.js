// GET /api/chats
import { listChats } from '../../../lib/portai-sync.mjs';

export const onRequestGet = ({ request, env }) => listChats(request, env);
