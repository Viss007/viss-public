/**
 * Load before any other local imports in server.ts so process.env is populated
 * from chatgpt_mcp_server/composio_engine/.env (works when cwd is not that folder).
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });
