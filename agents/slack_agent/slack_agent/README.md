# slack_agent — Bolt backend (Socket Mode)

Loads **`agents/slack_agent/.env`** (fixed path; does not depend on terminal cwd). Launch from the integrated terminal with **`agents/slack_agent/start-slack-agent.bat`** (from repo root) or **`start-slack-agent.bat`** when cwd is **`agents/slack_agent`**.

## `agents/slack_agent/.env`

Create **`.env`** next to this README (gitignored). **Paste** your Slack tokens after the `=` on each line, save, then run the bat.

**Slack:** **Socket Mode ON**, app-level token scope **`connections:write`**, bot scopes **`app_mentions:read`**, **`chat:write`**, **`im:history`**, subscribe **`app_mention`** + **`message.im`**, reinstall app.

**Optional — LLM replies (OpenAI [Responses API](https://platform.openai.com/docs/api-reference/responses), `POST /v1/responses`):**

| Variable | Role |
|----------|------|
| `OPENAI_API_KEY` | If set, `app_mention` and DMs use the model instead of echo text. |
| `OPENAI_MODEL` | Defaults to **`gpt-4o-mini`**. |
| `OPENAI_BASE_URL` | Optional; API base (e.g. `https://api.openai.com/v1` or your proxy). |
| `OPENAI_TEMPERATURE` | Optional; default **`0.7`**. |
| `OPENAI_MAX_OUTPUT_TOKENS` | Optional; caps output length when set (integer). |
| `OPENAI_TOOL_MAX_ROUNDS` | Optional; max model↔tool iterations per user message (default **`8`**, max 32). |

Without **`OPENAI_API_KEY`**, the bot keeps the echo-style replies and reminds you to set the key.

**Model name surprises:** `load_dotenv` uses **`override=True`** so values in **`agents/slack_agent/.env`** win over Windows / Cursor environment variables. If you previously saw a different model than `.env`, a shell-level **`OPENAI_MODEL`** was probably overriding `.env`. Check startup logs: **`OpenAI LLM config (from env…): model=…`**.

**Slack tools in OpenAI Logs:** With **`OPENAI_API_KEY`** set, **`responses.create`** includes **`tools`** (function definitions in **`backend/slack_tools.py`**). The model can call **`slack_post_message`**, **`slack_conversations_history`**, **`slack_reactions_add`**, **`slack_users_info`**; the Bolt **`client`** executes them. Those calls appear in **OpenAI → Logs → Responses** for that request. **Cursor’s `user-Slack` MCP** is still separate (editor-side); it is not what **`slack_agent`** sends to OpenAI.

## One-time setup

```text
cd agents\slack_agent
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

Create **`.env`** as above, then:

## Run (backend)

From repo terminal:

```text
cd agents\slack_agent
start-slack-agent.bat
```

Or: `.\.venv\Scripts\python.exe -m backend.main`

## Layout

| Path | Role |
|------|------|
| `backend/main.py` | Bolt app, `load_dotenv(agents/slack_agent/.env)`, Socket Mode, LLM when `OPENAI_API_KEY` set |
| `backend/prompts.py` | Instructions string for Responses API |
| `backend/openai_config.py` | Reads **`OPENAI_*`** into one config; startup log line |
| `backend/openai_chat.py` | Responses API + tool loop (`chat_reply_with_tools`) |
| `backend/slack_tools.py` | Tool schemas + `execute_slack_tool` → Web API |
| `start-slack-agent.bat` | Runs `python -m backend.main` with `.venv` |
| `app.py` | Optional: `python app.py` delegates to `backend.main` |
