"""
OpenAI / LLM settings for slack_agent — read only from os.environ after load_dotenv(slack_agent/.env).

Use `get_openai_llm_config()` for requests; use `log_openai_settings_at_startup()` once in main().
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Optional

LOG = logging.getLogger("slack_agent.llm")


@dataclass(frozen=True)
class OpenAILlmConfig:
    """Resolved LLM settings (no secrets)."""

    model: str
    base_url: Optional[str]
    temperature: float
    max_output_tokens: Optional[int]


def get_openai_llm_config() -> OpenAILlmConfig:
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    base = os.environ.get("OPENAI_BASE_URL", "").strip() or None
    temp_raw = os.environ.get("OPENAI_TEMPERATURE", "0.7").strip()
    try:
        temperature = float(temp_raw)
    except ValueError:
        temperature = 0.7
    mot = os.environ.get("OPENAI_MAX_OUTPUT_TOKENS", "").strip()
    max_out = int(mot) if mot else None
    return OpenAILlmConfig(
        model=model,
        base_url=base,
        temperature=temperature,
        max_output_tokens=max_out,
    )


def openai_api_key_set() -> bool:
    return bool(os.environ.get("OPENAI_API_KEY", "").strip())


def log_openai_settings_at_startup(env_path: str) -> None:
    """Log resolved OpenAI-related settings (not API keys)."""
    if not openai_api_key_set():
        return
    cfg = get_openai_llm_config()
    base_log = cfg.base_url or "(default https://api.openai.com/v1)"
    LOG.info(
        "OpenAI LLM config (from env after load_dotenv; see %s): model=%s base_url=%s temperature=%s max_output_tokens=%s",
        env_path,
        cfg.model,
        base_log,
        cfg.temperature,
        cfg.max_output_tokens,
    )
