"""
Slack Web API tools for OpenAI Responses `tools` + execution via Bolt `WebClient`.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Mapping

from slack_sdk.errors import SlackApiError
from slack_sdk.web.client import WebClient

LOG = logging.getLogger("slack_agent.tools")

# OpenAI Responses API: function-style tools (see platform docs).
SLACK_TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "type": "function",
        "name": "slack_post_message",
        "description": (
            "Post a message to a Slack channel. Use the current channel if the user does not specify another. "
            "Use thread_ts to reply inside the current thread when appropriate."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "channel": {
                    "type": "string",
                    "description": "Channel ID (e.g. C…). Omit to use the conversation channel from context.",
                },
                "text": {"type": "string", "description": "Message text (mrkdwn allowed by Slack)."},
                "thread_ts": {
                    "type": "string",
                    "description": "Parent message ts to reply in a thread. Omit for new top-level message.",
                },
            },
            "required": ["text"],
        },
    },
    {
        "type": "function",
        "name": "slack_conversations_history",
        "description": (
            "Fetch recent messages from a channel (newest last in the API; results are returned in chronological order)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "channel": {
                    "type": "string",
                    "description": "Channel ID. Omit to use the current channel from context.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Max messages (1–100). Default 25.",
                },
            },
            "required": [],
        },
    },
    {
        "type": "function",
        "name": "slack_reactions_add",
        "description": "Add an emoji reaction to a message.",
        "parameters": {
            "type": "object",
            "properties": {
                "channel": {
                    "type": "string",
                    "description": "Channel ID. Omit to use the current channel from context.",
                },
                "timestamp": {
                    "type": "string",
                    "description": "Message ts to react to (often the message being discussed).",
                },
                "name": {
                    "type": "string",
                    "description": "Emoji name without colons, e.g. thumbsup, eyes",
                },
            },
            "required": ["timestamp", "name"],
        },
    },
    {
        "type": "function",
        "name": "slack_users_info",
        "description": "Get profile information for a Slack user by user ID (U…).",
        "parameters": {
            "type": "object",
            "properties": {
                "user": {"type": "string", "description": "User ID (U…)."},
            },
            "required": ["user"],
        },
    },
]


def _truncate(s: str, max_len: int = 12000) -> str:
    if len(s) <= max_len:
        return s
    return s[: max_len - 40] + "\n... [truncated for tool output size]"


def execute_slack_tool(
    name: str,
    arguments_json: str,
    client: WebClient,
    ctx: Mapping[str, Any],
) -> str:
    """Run one tool; return JSON string for the model (always ok/error shape)."""
    try:
        args = json.loads(arguments_json) if arguments_json else {}
    except json.JSONDecodeError as e:
        return json.dumps({"ok": False, "error": f"invalid_arguments_json: {e}"})

    channel_default = (ctx.get("channel") or "").strip()
    thread_default = (ctx.get("thread_ts") or "").strip() or None

    try:
        if name == "slack_post_message":
            channel = (args.get("channel") or channel_default).strip()
            if not channel:
                return json.dumps({"ok": False, "error": "channel_required"})
            text = args.get("text") or ""
            thread_ts = (args.get("thread_ts") or "").strip() or thread_default
            r = client.chat_postMessage(channel=channel, text=text, thread_ts=thread_ts)
            return _truncate(
                json.dumps(
                    {
                        "ok": bool(r.get("ok")),
                        "channel": r.get("channel"),
                        "ts": r.get("ts"),
                        "message": r.get("message"),
                    },
                    default=str,
                )
            )

        if name == "slack_conversations_history":
            channel = (args.get("channel") or channel_default).strip()
            if not channel:
                return json.dumps({"ok": False, "error": "channel_required"})
            limit = int(args.get("limit") or 25)
            limit = max(1, min(limit, 100))
            r = client.conversations_history(channel=channel, limit=limit)
            msgs = []
            for m in r.get("messages") or []:
                msgs.append(
                    {
                        "user": m.get("user"),
                        "text": m.get("text"),
                        "ts": m.get("ts"),
                        "bot_id": m.get("bot_id"),
                    }
                )
            msgs.reverse()
            return _truncate(json.dumps({"ok": bool(r.get("ok")), "messages": msgs}, default=str))

        if name == "slack_reactions_add":
            channel = (args.get("channel") or channel_default).strip()
            if not channel:
                return json.dumps({"ok": False, "error": "channel_required"})
            ts = (args.get("timestamp") or "").strip()
            emoji = (args.get("name") or "").strip()
            if not ts or not emoji:
                return json.dumps({"ok": False, "error": "timestamp_and_name_required"})
            r = client.reactions_add(channel=channel, timestamp=ts, name=emoji)
            return json.dumps({"ok": bool(r.get("ok"))}, default=str)

        if name == "slack_users_info":
            uid = (args.get("user") or "").strip()
            if not uid:
                return json.dumps({"ok": False, "error": "user_required"})
            r = client.users_info(user=uid)
            u = r.get("user") or {}
            prof = u.get("profile") or {}
            return _truncate(
                json.dumps(
                    {
                        "ok": bool(r.get("ok")),
                        "id": u.get("id"),
                        "name": u.get("name"),
                        "real_name": prof.get("real_name"),
                        "display_name": prof.get("display_name"),
                        "title": prof.get("title"),
                    },
                    default=str,
                )
            )

        return json.dumps({"ok": False, "error": f"unknown_tool:{name}"})
    except SlackApiError as e:
        LOG.warning("slack tool api error: %s %s", name, e)
        return json.dumps({"ok": False, "error": "slack_api_error", "detail": str(e)})
    except Exception as e:
        LOG.exception("slack tool failed: %s", name)
        return json.dumps({"ok": False, "error": str(e)})
