// POST /api/account/login
import { login } from '../../../lib/portai-sync.mjs';

export const onRequestPost = ({ request, env }) => login(request, env);
