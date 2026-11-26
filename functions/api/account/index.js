// POST /api/account (create) · DELETE /api/account (delete everything)
import { createAccount, deleteAccount } from '../../../lib/portai-sync.mjs';

export const onRequestPost = ({ request, env }) => createAccount(request, env);
export const onRequestDelete = ({ request, env }) => deleteAccount(request, env);
