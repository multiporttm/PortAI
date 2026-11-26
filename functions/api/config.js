// Cloudflare Pages Function: GET /api/config
import { handleConfig } from '../../lib/portai-core.mjs';

export const onRequestGet = ({ env }) => handleConfig(env);
