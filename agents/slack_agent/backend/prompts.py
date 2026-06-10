"""
Instructions for the Slack agent (OpenAI Responses API `instructions` field).
Edit SLACK_AGENT_SYSTEM for persona and scope.
"""
from __future__ import annotations

from typing import Any, Mapping, Optional

SLACK_AGENT_SYSTEM = """You are a concise, helpful assistant running inside Slack (Viss workspace bot).
Reply in plain text suitable for Slack. Use *bold* sparingly; avoid markdown tables unless asked.
Keep answers short unless the user asks for detail. If you do not know, say so."""


def build_slack_agent_instructions(slack_context: Optional[Mapping[str, Any]]) -> str:
    """Base instructions plus optional Slack channel/thread context for tool use."""
    if not slack_context:
        return SLACK_AGENT_SYSTEM
    ch = slack_context.get("channel") or "unknown"
    ts = slack_context.get("thread_ts") or "none"
    return (
        SLACK_AGENT_SYSTEM
        + "\n\n## Current Slack context\n"
        + f"- channel_id: `{ch}`\n"
        + f"- thread_ts: `{ts}`\n"
        + "You can call the provided function tools to interact with Slack (post messages, read "
        + "recent channel history, add reactions, look up users). Omit `channel` in tool arguments "
        + "when the user means this conversation. After tools return, summarize results for the user."
    )
