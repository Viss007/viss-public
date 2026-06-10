"""
Slack Bolt backend — loads `slack_agent/.env` (next to this package root), then Socket Mode.
Aggressive logging: set SLACK_AGENT_LOG_LEVEL=DEBUG (default) or INFO; urllib3 stays WARNING.
"""
from __future__ import annotations

import json
import logging
import os
import re
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

from backend.openai_chat import chat_reply_safe, openai_configured
from backend.openai_config import log_openai_settings_at_startup

_ROOT = Path(__file__).resolve().parent.parent
_ENV_FILE = _ROOT / ".env"
# override=True: slack_agent/.env wins over pre-set shell/Cursor OPENAI_* (otherwise wrong model in logs)
load_dotenv(_ENV_FILE, override=True)

LOG = logging.getLogger("slack_agent")


def _setup_logging() -> None:
    level_name = os.environ.get("SLACK_AGENT_LOG_LEVEL", "DEBUG").strip().upper()
    level = getattr(logging, level_name, logging.DEBUG)

    fmt = "%(asctime)s %(levelname)-8s [%(name)s] %(threadName)s %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"
    # Force stderr so batch files still show everything; replace if already configured (tests / reload)
    root = logging.getLogger()
    if not root.handlers:
        logging.basicConfig(level=level, format=fmt, datefmt=datefmt, stream=sys.stderr, force=True)
    else:
        root.setLevel(level)
        for h in root.handlers:
            h.setFormatter(logging.Formatter(fmt, datefmt=datefmt))
            h.setLevel(level)

    # This package + Bolt framework
    logging.getLogger("slack_agent").setLevel(level)
    logging.getLogger("slack_bolt").setLevel(logging.DEBUG)
    logging.getLogger("slack_sdk").setLevel(logging.DEBUG)
    logging.getLogger("slack_sdk.web").setLevel(logging.DEBUG)
    logging.getLogger("slack_sdk.web.base_client").setLevel(logging.DEBUG)
    logging.getLogger("slack_sdk.socket_mode").setLevel(logging.DEBUG)
    # Third-party noise control
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)
    logging.getLogger("websocket").setLevel(logging.DEBUG)

    LOG.info(
        "logging: SLACK_AGENT_LOG_LEVEL=%s effective root=%s",
        level_name,
        logging.getLevelName(root.level),
    )


def _redact_token(raw: str) -> str:
    s = (raw or "").strip()
    if len(s) < 12:
        return "(empty or too short)"
    return f"{s[:8]}...{s[-4:]}"


def _truncate_json(data: Any, max_chars: int = 12000) -> str:
    try:
        out = json.dumps(data, default=str, ensure_ascii=False, indent=2)
    except (TypeError, ValueError):
        out = repr(data)
    if len(out) > max_chars:
        return out[:max_chars] + f"\n... [truncated, total would be {len(out)} chars]"
    return out


def _require_env() -> tuple[str, str]:
    bot = os.environ.get("SLACK_BOT_TOKEN", "").strip()
    app_tok = os.environ.get("SLACK_APP_TOKEN", "").strip()
    LOG.debug("env file path=%s exists=%s", _ENV_FILE, _ENV_FILE.is_file())
    if not _ENV_FILE.is_file():
        raise SystemExit(
            f"Missing {_ENV_FILE} - create it with SLACK_BOT_TOKEN and SLACK_APP_TOKEN (see README).",
        )
    if not bot or not bot.startswith("xoxb-"):
        raise SystemExit(
            "SLACK_BOT_TOKEN in .env must be a bot token (xoxb-...) from OAuth & Permissions.",
        )
    if not app_tok or not app_tok.startswith("xapp-"):
        raise SystemExit(
            "SLACK_APP_TOKEN in .env must be an app-level token (xapp-...) with connections:write; Socket Mode ON.",
        )
    LOG.info("tokens: SLACK_BOT_TOKEN=%s SLACK_APP_TOKEN=%s", _redact_token(bot), _redact_token(app_tok))
    return bot, app_tok


def create_app(bot_token: str) -> App:
    application = App(token=bot_token, logger=logging.getLogger("slack_agent.bolt"))

    @application.middleware
    def log_every_request(logger, body, next):
        LOG.debug("middleware: incoming body keys=%s", list(body.keys()) if isinstance(body, dict) else type(body))
        if isinstance(body, dict):
            LOG.debug("middleware: type=%s team_id=%s api_app_id=%s", body.get("type"), body.get("team_id"), body.get("api_app_id"))
            ev = body.get("event")
            if isinstance(ev, dict):
                LOG.debug(
                    "middleware: event type=%s channel=%s user=%s channel_type=%s",
                    ev.get("type"),
                    ev.get("channel"),
                    ev.get("user"),
                    ev.get("channel_type"),
                )
            LOG.debug("middleware: full body:\n%s", _truncate_json(body))
        return next()

    @application.event("app_mention")
    def on_mention(body, event, say, client, logger):
        logger.debug("app_mention: raw event keys=%s", list(event.keys()) if isinstance(event, dict) else None)
        text = event.get("text") or ""
        cleaned = re.sub(r"<@[A-Z0-9]+>\s*", "", text).strip()
        user = event.get("user", "")
        LOG.info("app_mention: user=%s text_len=%s cleaned=%r", user, len(text), cleaned[:500])
        thread_ts = event.get("thread_ts") or event.get("ts")
        if not cleaned:
            say(text=f"Hi <@{user}> — mention me with text.", thread_ts=thread_ts)
            return
        if openai_configured():
            team_id = body.get("team_id") if isinstance(body, dict) else None
            reply, err = chat_reply_safe(
                cleaned,
                slack_client=client,
                slack_context={
                    "channel": event.get("channel"),
                    "thread_ts": thread_ts,
                    "team_id": team_id,
                },
            )
            if err:
                say(
                    text=f"Sorry — I could not reach the model: {err}",
                    thread_ts=thread_ts,
                )
            else:
                say(text=reply, thread_ts=thread_ts)
        else:
            say(
                text=f"Got it, <@{user}> — you said: _{cleaned}_\n_(set OPENAI_API_KEY in slack_agent/.env for LLM replies)_",
                thread_ts=thread_ts,
            )

    @application.event("message")
    def on_dm_message(body, event, say, client, logger):
        logger.debug("message event: keys=%s channel_type=%s subtype=%s bot_id=%s", list(event.keys()) if isinstance(event, dict) else None, event.get("channel_type"), event.get("subtype"), event.get("bot_id"))
        if event.get("channel_type") != "im":
            LOG.debug("message: skip (not DM) channel_type=%s", event.get("channel_type"))
            return
        if event.get("bot_id") or event.get("subtype"):
            LOG.debug("message: skip (bot or subtype) subtype=%s", event.get("subtype"))
            return
        text = (event.get("text") or "").strip()
        user = event.get("user", "")
        LOG.info("message DM: user=%s text_len=%s preview=%r", user, len(text), text[:500])
        if not text:
            say(text=f"Hi <@{user}> — send a message.")
            return
        if openai_configured():
            team_id = body.get("team_id") if isinstance(body, dict) else None
            reply, err = chat_reply_safe(
                text,
                slack_client=client,
                slack_context={
                    "channel": event.get("channel"),
                    "thread_ts": event.get("thread_ts") or event.get("ts"),
                    "team_id": team_id,
                },
            )
            if err:
                say(text=f"Sorry — I could not reach the model: {err}")
            else:
                say(text=reply)
        else:
            say(
                text=f"You wrote: {text}\n_(set OPENAI_API_KEY in slack_agent/.env for LLM replies)_"
            )

    return application


def main() -> None:
    _setup_logging()
    LOG.info("startup: cwd=%s package_root=%s", os.getcwd(), _ROOT)
    bot, app_tok = _require_env()
    if openai_configured():
        LOG.info("OpenAI: enabled (OPENAI_API_KEY set)")
        log_openai_settings_at_startup(str(_ENV_FILE))
    else:
        LOG.warning(
            "OpenAI: disabled — set OPENAI_API_KEY in slack_agent/.env for LLM replies",
        )

    app = create_app(bot)
    LOG.info("loaded %s", _ENV_FILE)
    LOG.info("Socket Mode handler starting (Ctrl+C to stop); watch DEBUG lines above for websocket + API traffic")
    SocketModeHandler(app, app_tok).start()


if __name__ == "__main__":
    main()
