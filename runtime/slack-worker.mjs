/**
 * Slack Socket Mode — same Node process as :3333 gateway (no Python subprocess).
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, "agents", "slack_agent", ".env");

const SYSTEM = `You are a concise, helpful assistant running inside Slack (Viss workspace bot).
Reply in plain text suitable for Slack. Use *bold* sparingly; avoid markdown tables unless asked.
Keep answers short unless the user asks for detail. If you do not know, say so.`;

function log(msg) {
  console.log(`[slack_agent] ${msg}`);
}

export async function startSlackWorker() {
  if (!fs.existsSync(ENV_PATH)) {
    log("skipped — no agents/slack_agent/.env");
    return;
  }
  dotenv.config({ path: ENV_PATH, override: true });

  const botToken = process.env.SLACK_BOT_TOKEN?.trim();
  const appToken = process.env.SLACK_APP_TOKEN?.trim();
  if (!botToken?.startsWith("xoxb-") || !appToken?.startsWith("xapp-")) {
    log("skipped — SLACK_BOT_TOKEN / SLACK_APP_TOKEN missing or invalid");
    return;
  }

  const { App } = await import("@slack/bolt");
  const OpenAI = (await import("openai")).default;

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  async function replyWithLlm(text, say) {
    if (!openai) {
      await say(`You wrote: ${text}\n_(set OPENAI_API_KEY in slack_agent/.env for LLM replies)_`);
      return;
    }
    try {
      const resp = await openai.responses.create({
        model,
        instructions: SYSTEM,
        input: text,
      });
      const out = (resp.output_text || "").trim();
      await say(out || "_(empty model response)_");
    } catch (e) {
      await say(`Sorry — I could not reach the model: ${e.message}`);
    }
  }

  const app = new App({
    token: botToken,
    socketMode: true,
    appToken,
  });

  app.event("app_mention", async ({ event, say }) => {
    const text = (event.text || "").replace(/<@[A-Z0-9]+>\s*/g, "").trim();
    const thread_ts = event.thread_ts || event.ts;
    if (!text) {
      await say({ text: `Hi <@${event.user}> — mention me with text.`, thread_ts });
      return;
    }
    if (openai) {
      try {
        const resp = await openai.responses.create({
          model,
          instructions: SYSTEM,
          input: text,
        });
        await say({ text: (resp.output_text || "").trim() || "_(empty)_", thread_ts });
      } catch (e) {
        await say({ text: `Sorry — I could not reach the model: ${e.message}`, thread_ts });
      }
    } else {
      await say({
        text: `Got it, <@${event.user}> — you said: _${text}_\n_(set OPENAI_API_KEY in slack_agent/.env for LLM replies)_`,
        thread_ts,
      });
    }
  });

  app.event("message", async ({ event, say }) => {
    if (event.channel_type !== "im" || event.bot_id || event.subtype) return;
    const text = (event.text || "").trim();
    if (!text) {
      await say(`Hi <@${event.user}> — send a message.`);
      return;
    }
    await replyWithLlm(text, (payload) => say(typeof payload === "string" ? payload : payload.text));
  });

  await app.start();
  log("Socket Mode connected (in-process)");
}
