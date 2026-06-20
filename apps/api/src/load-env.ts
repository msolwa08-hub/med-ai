// Loads environment variables from a .env file for local runs, so you don't have
// to set them in the shell. Imported FIRST by beta-server.ts (before any config
// is read). Real env vars set by the host (e.g. Render) always take precedence —
// dotenv never overrides an already-set variable.
//
// Resolves apps/api/.env relative to this bundle's location, so it works no
// matter which folder you start the server from; also loads a .env in the
// current working directory if present.

import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../.env') }); // apps/api/.env
config(); // ./.env in the current working directory, if any
