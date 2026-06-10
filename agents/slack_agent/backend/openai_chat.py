"""
OpenAI Responses API for slack_agent (POST /v1/responses), with optional Slack tool loop.
Uses OPENAI_API_KEY, OPENAI_MODEL from env. Optional: OPENAI_BASE_URL.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any, Optional

from openai import OpenAI
from slack_sdk.web.client import WebClient

from backend.openai_config import get_openai_llm_config, openai_api_key_set
from backend.prompts import build_slack_agent_instructions
from backend.slack_tools import SLACK_TOOL_DEFINITIONS, execute_slack_tool

LOG = logging.getLogger("slack_agent.llm")


def openai_configured() -> bool:
    return openai_api_key_set()


def _tool_max_rounds() -> int:
    raw = os.environ.get("OPENAI_TOOL_MAX_ROUNDS", "8").strip()
    try:
        n = int(raw)
    except ValueError:
        n = 8
    return max(1, min(n, 32))


def _response_text(resp: Any) -> str:
    """Aggregate assistant text from a Responses API result."""
    text = (getattr(resp, "output_text", None) or "").strip()
    if text:
        return text
    out = getattr(resp, "output", None) or []
    parts: list[str] = []
    for item in out:
        if getattr(item, "type", None) != "message":
            continue
        for block in getattr(item, "content", None) or []:
            btype = getattr(block, "type", None)
            if btype in ("output_text", "text"):
                t = getattr(block, "text", None)
                if t:
                    parts.append(t)
    return "".join(parts).strip()


def _extract_function_calls(resp: Any) -> list[Any]:
    out = []
    for item in getattr(resp, "output", None) or []:
        if getattr(item, "type", None) == "function_call":
            out.append(item)
    return out


def chat_reply(user_text: str) -> str:
    """
    Returns assistant text via Responses API (no Slack tools). Raises on missing key or API error.
    """
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set in slack_agent/.env")

    cfg = get_openai_llm_config()
    client_kwargs: dict = {"api_key": key}
    if cfg.base_url:
        client_kwargs["base_url"] = cfg.base_url

    client = OpenAI(**client_kwargs)
    LOG.info(
        "openai responses (no tools): request model=%s user_len=%s",
        cfg.model,
        len(user_text),
    )

    params: dict = {
        "model": cfg.model,
        "instructions": build_slack_agent_instructions(None),
        "input": user_text,
        "temperature": cfg.temperature,
    }
    if cfg.max_output_tokens is not None:
        params["max_output_tokens"] = cfg.max_output_tokens

    resp = client.responses.create(**params)
    used = getattr(resp, "model", None) or "(unknown)"
    LOG.info("openai responses: api returned model=%s id=%s", used, getattr(resp, "id", None))
    content = _response_text(resp)
    if not content:
        raise RuntimeError("empty response output")
    return content


def chat_reply_with_tools(
    user_text: str,
    slack_client: WebClient,
    slack_context: dict[str, Any],
) -> str:
    """
    Responses API with Slack tools: loop until no function_call items or max rounds.
    """
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set in slack_agent/.env")

    cfg = get_openai_llm_config()
    client_kwargs: dict = {"api_key": key}
    if cfg.base_url:
        client_kwargs["base_url"] = cfg.base_url

    client = OpenAI(**client_kwargs)
    instructions = build_slack_agent_instructions(slack_context)
    max_rounds = _tool_max_rounds()

    def _base_params() -> dict[str, Any]:
        p: dict[str, Any] = {
            "model": cfg.model,
            "instructions": instructions,
            "tools": SLACK_TOOL_DEFINITIONS,
            "tool_choice": "auto",
            "parallel_tool_calls": True,
            "temperature": cfg.temperature,
        }
        if cfg.max_output_tokens is not None:
            p["max_output_tokens"] = cfg.max_output_tokens
        return p

    LOG.info(
        "openai responses+tools: request model=%s user_len=%s max_rounds=%s",
        cfg.model,
        len(user_text),
        max_rounds,
    )

    params = _base_params()
    params["input"] = user_text
    resp = client.responses.create(**params)
    used = getattr(resp, "model", None) or "(unknown)"
    LOG.info(
        "openai responses+tools: initial api model=%s id=%s",
        used,
        getattr(resp, "id", None),
    )

    rounds = 0
    while rounds < max_rounds:
        rounds += 1
        calls = _extract_function_calls(resp)
        if not calls:
            text = _response_text(resp)
            if text:
                LOG.info("openai responses+tools: final text_len=%s rounds=%s", len(text), rounds)
                return text
            raise RuntimeError("empty model output (no text and no tool calls)")

        LOG.info("openai responses+tools: round=%s function_calls=%s", rounds, len(calls))
        outputs: list[dict[str, Any]] = []
        for call in calls:
            call_id = getattr(call, "call_id", None) or getattr(call, "id", None)
            name = getattr(call, "name", None) or ""
            raw_args = getattr(call, "arguments", None) or ""
            if not call_id:
                LOG.warning("function_call missing call_id: %s", call)
                continue
            args_str = raw_args if isinstance(raw_args, str) else json.dumps(raw_args)
            LOG.info("slack tool invoke: %s call_id=%s", name, call_id)
            out = execute_slack_tool(name, args_str, slack_client, slack_context)
            outputs.append(
                {
                    "type": "function_call_output",
                    "call_id": call_id,
                    "output": out,
                }
            )

        if not outputs:
            raise RuntimeError("function_calls present but no outputs produced")

        params = _base_params()
        params["previous_response_id"] = resp.id
        params["input"] = outputs
        resp = client.responses.create(**params)
        LOG.info(
            "openai responses+tools: follow-up id=%s model=%s",
            getattr(resp, "id", None),
            getattr(resp, "model", None),
        )

    raise RuntimeError(f"tool loop exceeded OPENAI_TOOL_MAX_ROUNDS ({max_rounds})")


def chat_reply_safe(
    user_text: str,
    *,
    slack_client: Optional[WebClient] = None,
    slack_context: Optional[dict[str, Any]] = None,
) -> tuple[str, Optional[str]]:
    """
    Returns (reply_text, error_message). On success error_message is None.
    If slack_client is set, runs the tool loop so OpenAI logs show tools.
    """
    try:
        if slack_client is not None:
            ctx = slack_context or {}
            return chat_reply_with_tools(user_text, slack_client, ctx), None
        return chat_reply(user_text), None
    except Exception as e:
        LOG.exception("openai responses failed: %s", e)
        err = str(e)
        if len(err) > 280:
            err = err[:277] + "..."
        return "", err
