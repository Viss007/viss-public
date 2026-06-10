#!/usr/bin/env python3
"""
Toolkit env/orchestration CLI for two_platform_toolkit.

Usage examples:
  python scripts/toolkit.py profiles list
  python scripts/toolkit.py env use personal
  python scripts/toolkit.py backend verify --tenant tenant-e2e --user-ref operator
  python scripts/toolkit.py oauth connect --provider google --open
"""

from __future__ import annotations

import argparse
import getpass
import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from dataclasses import dataclass
from pathlib import Path
from typing import Any


EXIT_OK = 0
EXIT_VALIDATION = 1
EXIT_ENV_INVALID = 2
EXIT_BACKEND_UNREACHABLE = 3
EXIT_AUTH_FAILURE = 4
EXIT_PROVIDER_MISCONFIGURED = 5

PROJECT_ROOT = Path(__file__).resolve().parent.parent
STATE_DIR = PROJECT_ROOT / ".toolkit"
STATE_PATH = STATE_DIR / "state.json"
DEFAULT_PROFILES_DIR = PROJECT_ROOT / ".env.profiles"
PROJECT_ENV_PATH = PROJECT_ROOT / ".env"
ENV_BACKUP_PATH = PROJECT_ROOT / ".env.bak"
OAUTH_CREDENTIALS_PATH = PROJECT_ROOT / "data" / "oauth-client-credentials.json"


@dataclass
class ContextArgs:
    user_ref: str | None = None
    tenant: str | None = None
    client: str | None = None


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {"version": 1, "current_profile": None, "profiles": {}}
    try:
        loaded = json.loads(_read_text(STATE_PATH))
    except Exception:
        return {"version": 1, "current_profile": None, "profiles": {}}
    if not isinstance(loaded, dict):
        return {"version": 1, "current_profile": None, "profiles": {}}
    loaded.setdefault("version", 1)
    loaded.setdefault("current_profile", None)
    loaded.setdefault("profiles", {})
    return loaded


def save_state(state: dict[str, Any]) -> None:
    _write_text(STATE_PATH, json.dumps(state, indent=2) + "\n")


def parse_env_file(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for raw in _read_text(path).splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        out[key.strip()] = value.strip()
    return out


def merged_env(profile_env_path: Path | None = None) -> dict[str, str]:
    merged = parse_env_file(PROJECT_ENV_PATH)
    if profile_env_path:
        merged.update(parse_env_file(profile_env_path))
    # Runtime environment wins, so operator can override quickly.
    merged.update({k: v for k, v in os.environ.items() if isinstance(v, str)})
    return merged


def looks_placeholder(value: str | None) -> bool:
    if value is None:
        return True
    v = value.strip().lower()
    if not v:
        return True
    markers = ("example", "your-", "your_", "placeholder", "changeme", "replace-me", "demo", "test")
    return any(marker in v for marker in markers)


def print_json(data: Any) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=True))


def normalize_profile_env_path(path_str: str) -> Path:
    given = Path(path_str)
    if not given.is_absolute():
        given = (PROJECT_ROOT / given).resolve()
    return given


def load_json_file(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    try:
        return json.loads(_read_text(path))
    except Exception:
        return fallback


def save_json_file(path: Path, content: Any) -> None:
    _write_text(path, json.dumps(content, indent=2) + "\n")


def build_query(ctx: ContextArgs) -> str:
    params: dict[str, str] = {}
    if ctx.user_ref:
        params["user_ref"] = ctx.user_ref
    if ctx.tenant:
        params["tenant"] = ctx.tenant
    if ctx.client:
        params["client"] = ctx.client
    if not params:
        return ""
    return "?" + urllib.parse.urlencode(params)


def ensure_base_url(env: dict[str, str], explicit: str | None) -> str:
    base = (explicit or env.get("TOOLKIT_PUBLIC_URL", "")).strip()
    if not base:
        raise ValueError("Missing base URL. Pass --base-url or set TOOLKIT_PUBLIC_URL in .env.")
    return base.rstrip("/")


def http_get_json(url: str, api_key: str | None = None) -> tuple[int, Any]:
    headers = {}
    if api_key:
        headers["X-API-Key"] = api_key
    req = urllib.request.Request(url=url, method="GET", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            status = int(resp.getcode())
            payload_raw = resp.read().decode("utf-8", errors="replace")
            payload = json.loads(payload_raw) if payload_raw.strip() else {}
            return status, payload
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(body) if body.strip() else {}
        except Exception:
            parsed = {"error": body or str(err)}
        return int(err.code), parsed


def cmd_profiles_list(_: argparse.Namespace) -> int:
    state = load_state()
    profiles = state.get("profiles", {})
    current = state.get("current_profile")
    if not profiles:
        print("No profiles found. Add one with: toolkit profiles add <name> --from .env.profiles/<name>.env")
        return EXIT_OK
    for name, meta in sorted(profiles.items()):
        marker = "*" if name == current else " "
        env_file = meta.get("envFile", "")
        print(f"{marker} {name} -> {env_file}")
    return EXIT_OK


def cmd_profiles_show(args: argparse.Namespace) -> int:
    state = load_state()
    profile = state.get("profiles", {}).get(args.name)
    if not profile:
        print(f'Profile "{args.name}" not found.')
        return EXIT_VALIDATION
    print_json(profile)
    return EXIT_OK


def cmd_profiles_add(args: argparse.Namespace) -> int:
    env_file = normalize_profile_env_path(args.from_path)
    if not env_file.exists():
        print(f"Env file not found: {env_file}")
        return EXIT_VALIDATION

    state = load_state()
    profiles = state.setdefault("profiles", {})
    profiles[args.name] = {
        "name": args.name,
        "envFile": str(env_file),
        "defaults": {
            "tenant": args.tenant,
            "client": args.client,
            "user_ref": args.user_ref,
        },
    }
    save_state(state)
    print(f'Profile "{args.name}" saved.')
    return EXIT_OK


def cmd_profiles_remove(args: argparse.Namespace) -> int:
    state = load_state()
    profiles = state.get("profiles", {})
    if args.name not in profiles:
        print(f'Profile "{args.name}" not found.')
        return EXIT_VALIDATION
    profiles.pop(args.name, None)
    if state.get("current_profile") == args.name:
        state["current_profile"] = None
    save_state(state)
    print(f'Profile "{args.name}" removed.')
    return EXIT_OK


def get_profile_or_exit(name: str) -> dict[str, Any]:
    state = load_state()
    profile = state.get("profiles", {}).get(name)
    if not profile:
        raise ValueError(f'Profile "{name}" not found.')
    return profile


def required_env_keys() -> list[str]:
    return [
        "TOOLKIT_PUBLIC_URL",
        "TOKEN_ENCRYPTION_KEY",
        "INTERNAL_API_KEY",
    ]


def optional_provider_keys() -> list[str]:
    return [
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "META_APP_ID",
        "META_APP_SECRET",
    ]


def validate_env_values(values: dict[str, str]) -> list[str]:
    errors: list[str] = []
    for key in required_env_keys():
        if looks_placeholder(values.get(key, "")):
            errors.append(f"{key}: missing or placeholder")

    provider_present = any(values.get(key, "").strip() for key in optional_provider_keys())
    if provider_present:
        for key in optional_provider_keys():
            if looks_placeholder(values.get(key, "")):
                errors.append(f"{key}: missing or placeholder while provider keys are in use")
    return errors


def cmd_env_use(args: argparse.Namespace) -> int:
    state = load_state()
    profile = state.get("profiles", {}).get(args.profile)
    if not profile:
        print(f'Profile "{args.profile}" not found.')
        return EXIT_VALIDATION
    env_file = Path(profile["envFile"])
    if not env_file.exists():
        print(f"Profile env file missing: {env_file}")
        return EXIT_VALIDATION

    if PROJECT_ENV_PATH.exists():
        shutil.copy2(PROJECT_ENV_PATH, ENV_BACKUP_PATH)
    shutil.copy2(env_file, PROJECT_ENV_PATH)
    state["current_profile"] = args.profile
    save_state(state)
    print(f'Activated profile "{args.profile}" -> {PROJECT_ENV_PATH}')
    return EXIT_OK


def cmd_env_current(_: argparse.Namespace) -> int:
    state = load_state()
    current = state.get("current_profile")
    if not current:
        print("No current profile selected.")
        return EXIT_OK
    print(current)
    return EXIT_OK


def cmd_env_diff(args: argparse.Namespace) -> int:
    state = load_state()
    profile_name = args.profile or state.get("current_profile")
    if not profile_name:
        print("No profile provided and no current profile set.")
        return EXIT_VALIDATION
    profile = state.get("profiles", {}).get(profile_name)
    if not profile:
        print(f'Profile "{profile_name}" not found.')
        return EXIT_VALIDATION
    profile_env = parse_env_file(Path(profile["envFile"]))
    current_env = parse_env_file(PROJECT_ENV_PATH)
    keys = sorted(set(profile_env.keys()) | set(current_env.keys()))
    for key in keys:
        a = current_env.get(key, "")
        b = profile_env.get(key, "")
        if a != b:
            print(f"{key}: .env='{a}' profile='{b}'")
    return EXIT_OK


def cmd_env_validate(args: argparse.Namespace) -> int:
    state = load_state()
    profile_name = args.profile or state.get("current_profile")
    values: dict[str, str]
    if profile_name:
        profile = state.get("profiles", {}).get(profile_name)
        if not profile:
            print(f'Profile "{profile_name}" not found.')
            return EXIT_VALIDATION
        values = parse_env_file(Path(profile["envFile"]))
    else:
        values = parse_env_file(PROJECT_ENV_PATH)
    errors = validate_env_values(values)
    if errors:
        print("Invalid environment:")
        for err in errors:
            print(f"- {err}")
        return EXIT_ENV_INVALID
    print("Environment looks valid.")
    return EXIT_OK


def _resolve_context(args: argparse.Namespace) -> ContextArgs:
    return ContextArgs(user_ref=args.user_ref, tenant=args.tenant, client=args.client)


def cmd_backend_health(args: argparse.Namespace) -> int:
    env = merged_env()
    try:
        base = ensure_base_url(env, args.base_url)
    except ValueError as exc:
        print(str(exc))
        return EXIT_VALIDATION
    status, payload = http_get_json(f"{base}/v1/health")
    print_json({"status": status, "data": payload})
    return EXIT_OK if status == 200 else EXIT_BACKEND_UNREACHABLE


def cmd_backend_debug_config(args: argparse.Namespace) -> int:
    env = merged_env()
    api_key = env.get("INTERNAL_API_KEY", "").strip()
    if not api_key:
        print("Missing INTERNAL_API_KEY.")
        return EXIT_ENV_INVALID
    try:
        base = ensure_base_url(env, args.base_url)
    except ValueError as exc:
        print(str(exc))
        return EXIT_VALIDATION
    ctx = _resolve_context(args)
    status, payload = http_get_json(f"{base}/v1/debug/config{build_query(ctx)}", api_key=api_key)
    print_json({"status": status, "data": payload})
    if status in (401, 403):
        return EXIT_AUTH_FAILURE
    if status != 200:
        return EXIT_BACKEND_UNREACHABLE
    return EXIT_OK


def cmd_backend_verify(args: argparse.Namespace) -> int:
    env = merged_env()
    try:
        base = ensure_base_url(env, args.base_url)
    except ValueError as exc:
        print(str(exc))
        return EXIT_VALIDATION
    api_key = env.get("INTERNAL_API_KEY", "").strip()
    if looks_placeholder(api_key):
        print("INTERNAL_API_KEY missing/placeholder.")
        return EXIT_ENV_INVALID

    ctx = _resolve_context(args)
    summary: dict[str, Any] = {}

    health_status, health = http_get_json(f"{base}/v1/health")
    summary["health"] = {"status": health_status, "ok": health_status == 200, "data": health}

    debug_status, debug = http_get_json(f"{base}/v1/debug/config{build_query(ctx)}", api_key=api_key)
    summary["debug_config"] = {"status": debug_status, "ok": debug_status == 200, "data": debug}

    oauth_status, oauth = http_get_json(f"{base}/v1/oauth/connect_urls{build_query(ctx)}", api_key=api_key)
    summary["oauth_connect_urls"] = {"status": oauth_status, "ok": oauth_status == 200, "data": oauth}

    print_json(summary)

    if debug_status in (401, 403) or oauth_status in (401, 403):
        return EXIT_AUTH_FAILURE
    if health_status != 200 or debug_status != 200 or oauth_status != 200:
        return EXIT_BACKEND_UNREACHABLE

    google = oauth.get("google", {}) if isinstance(oauth, dict) else {}
    instagram = oauth.get("instagram", {}) if isinstance(oauth, dict) else {}
    if not bool(google.get("configured")) or not bool(instagram.get("configured")):
        return EXIT_PROVIDER_MISCONFIGURED
    return EXIT_OK


def cmd_oauth_urls(args: argparse.Namespace) -> int:
    env = merged_env()
    api_key = env.get("INTERNAL_API_KEY", "").strip()
    if not api_key:
        print("Missing INTERNAL_API_KEY.")
        return EXIT_ENV_INVALID
    try:
        base = ensure_base_url(env, args.base_url)
    except ValueError as exc:
        print(str(exc))
        return EXIT_VALIDATION

    ctx = _resolve_context(args)
    status, payload = http_get_json(f"{base}/v1/oauth/connect_urls{build_query(ctx)}", api_key=api_key)
    print_json({"status": status, "data": payload})
    if status in (401, 403):
        return EXIT_AUTH_FAILURE
    if status != 200:
        return EXIT_BACKEND_UNREACHABLE
    return EXIT_OK


def _extract_provider(payload: dict[str, Any], provider: str) -> dict[str, Any]:
    data = payload.get("data", payload) if isinstance(payload, dict) else {}
    if not isinstance(data, dict):
        return {}
    result = data.get(provider, {})
    return result if isinstance(result, dict) else {}


def cmd_oauth_connect(args: argparse.Namespace) -> int:
    if args.provider not in ("google", "instagram"):
        print("--provider must be google or instagram")
        return EXIT_VALIDATION
    env = merged_env()
    api_key = env.get("INTERNAL_API_KEY", "").strip()
    if not api_key:
        print("Missing INTERNAL_API_KEY.")
        return EXIT_ENV_INVALID
    try:
        base = ensure_base_url(env, args.base_url)
    except ValueError as exc:
        print(str(exc))
        return EXIT_VALIDATION

    ctx = _resolve_context(args)
    status, payload = http_get_json(f"{base}/v1/oauth/connect_urls{build_query(ctx)}", api_key=api_key)
    if status in (401, 403):
        print_json({"status": status, "data": payload})
        return EXIT_AUTH_FAILURE
    if status != 200:
        print_json({"status": status, "data": payload})
        return EXIT_BACKEND_UNREACHABLE

    provider_info = _extract_provider(payload, args.provider)
    configured = bool(provider_info.get("configured"))
    connect_url = provider_info.get("connectUrl")
    if not configured or not connect_url:
        print_json(
            {
                "error": f"{args.provider} is not configured; no connect URL available.",
                "provider": provider_info,
            }
        )
        return EXIT_PROVIDER_MISCONFIGURED

    print(connect_url)
    if args.open:
        webbrowser.open(connect_url)
    return EXIT_OK


def cmd_oauth_status(args: argparse.Namespace) -> int:
    env = merged_env()
    api_key = env.get("INTERNAL_API_KEY", "").strip()
    if not api_key:
        print("Missing INTERNAL_API_KEY.")
        return EXIT_ENV_INVALID
    try:
        base = ensure_base_url(env, args.base_url)
    except ValueError as exc:
        print(str(exc))
        return EXIT_VALIDATION

    ctx = _resolve_context(args)
    status, payload = http_get_json(f"{base}/v1/connections{build_query(ctx)}", api_key=api_key)
    print_json({"status": status, "data": payload})
    if status in (401, 403):
        return EXIT_AUTH_FAILURE
    if status != 200:
        return EXIT_BACKEND_UNREACHABLE
    return EXIT_OK


def cmd_run(args: argparse.Namespace) -> int:
    script_map = {
        "dev": ["npm", "run", "dev"],
        "tunnel": ["npm", "run", "tunnel"],
        "openapi-bundle": ["npm", "run", "openapi:bundle:paste"],
    }
    if args.target == "smoke":
        ns = argparse.Namespace(base_url=args.base_url, user_ref=args.user_ref, tenant=args.tenant, client=args.client)
        return cmd_backend_verify(ns)
    cmd = script_map.get(args.target)
    if not cmd:
        print(f"Unsupported run target: {args.target}")
        return EXIT_VALIDATION
    result = subprocess.run(cmd, cwd=PROJECT_ROOT)
    return int(result.returncode)


def _prompt_nonempty(label: str, default: str | None = None, secret: bool = False) -> str:
    prompt = f"{label}"
    if default:
        prompt += f" [{default}]"
    prompt += ": "
    while True:
        value = getpass.getpass(prompt) if secret else input(prompt)
        value = value.strip()
        if not value and default:
            return default
        if value:
            return value
        print("Value is required.")


def _upsert_tenant_credentials(
    tenant: str,
    google_client_id: str,
    google_client_secret: str,
    meta_app_id: str,
    meta_app_secret: str,
    meta_graph_version: str,
) -> None:
    data = load_json_file(OAUTH_CREDENTIALS_PATH, {"version": 1, "tenants": {}})
    if not isinstance(data, dict):
        data = {"version": 1, "tenants": {}}
    if data.get("version") != 1:
        data["version"] = 1
    tenants = data.get("tenants")
    if not isinstance(tenants, dict):
        tenants = {}
        data["tenants"] = tenants
    tenant_data = tenants.get(tenant)
    if not isinstance(tenant_data, dict):
        tenant_data = {}
        tenants[tenant] = tenant_data

    tenant_data["google"] = {
        "clientId": google_client_id,
        "clientSecret": google_client_secret,
    }
    tenant_data["instagram"] = {
        "appId": meta_app_id,
        "appSecret": meta_app_secret,
        "graphVersion": meta_graph_version,
    }
    save_json_file(OAUTH_CREDENTIALS_PATH, data)


def _load_tenant_credentials(tenant: str) -> dict[str, Any]:
    data = load_json_file(OAUTH_CREDENTIALS_PATH, {})
    if not isinstance(data, dict):
        return {}
    tenants = data.get("tenants")
    if not isinstance(tenants, dict):
        return {}
    tenant_data = tenants.get(tenant)
    return tenant_data if isinstance(tenant_data, dict) else {}


def cmd_setup_wizard(args: argparse.Namespace) -> int:
    print("Toolkit setup wizard")
    print("- This writes tenant OAuth app credentials to data/oauth-client-credentials.json")
    print("- It does not bypass provider setup. You still need valid app credentials.")
    print("")

    tenant = _prompt_nonempty("Tenant key", args.tenant or "tenant-e2e")
    user_ref = _prompt_nonempty("User ref for verification/login", args.user_ref or "operator")
    client = (args.client or "").strip() or None

    print("\nGoogle OAuth app credentials")
    google_client_id = _prompt_nonempty("GOOGLE client ID (ends with .apps.googleusercontent.com)", args.google_client_id)
    google_client_secret = _prompt_nonempty("GOOGLE client secret", args.google_client_secret, secret=True)

    print("\nMeta Instagram app credentials")
    meta_app_id = _prompt_nonempty("META app ID (numeric)", args.meta_app_id)
    meta_app_secret = _prompt_nonempty("META app secret (hex-like)", args.meta_app_secret, secret=True)
    meta_graph_version = _prompt_nonempty("Meta graph version", args.meta_graph_version or "v21.0")

    if any(
        looks_placeholder(v)
        for v in [google_client_id, google_client_secret, meta_app_id, meta_app_secret]
    ):
        print("Refusing to save placeholder-like values.")
        return EXIT_ENV_INVALID

    _upsert_tenant_credentials(
        tenant=tenant,
        google_client_id=google_client_id,
        google_client_secret=google_client_secret,
        meta_app_id=meta_app_id,
        meta_app_secret=meta_app_secret,
        meta_graph_version=meta_graph_version,
    )
    print(f"\nSaved credentials for tenant '{tenant}' at {OAUTH_CREDENTIALS_PATH}")

    verify_ns = argparse.Namespace(base_url=args.base_url, user_ref=user_ref, tenant=tenant, client=client)
    verify_rc = cmd_backend_verify(verify_ns)
    if verify_rc not in (EXIT_OK, EXIT_PROVIDER_MISCONFIGURED):
        return verify_rc

    if not args.connect:
        print("\nWizard complete. Run with --connect to open provider login URLs immediately.")
        return verify_rc

    for provider in ("google", "instagram"):
        connect_ns = argparse.Namespace(
            base_url=args.base_url,
            provider=provider,
            user_ref=user_ref,
            tenant=tenant,
            client=client,
            open=True,
        )
        rc = cmd_oauth_connect(connect_ns)
        if rc != EXIT_OK:
            print(f"Could not open {provider} connect URL.")
            return rc
    return EXIT_OK


def cmd_doctor(args: argparse.Namespace) -> int:
    tenant = (args.tenant or "tenant-e2e").strip()
    user_ref = (args.user_ref or "operator").strip()
    client = (args.client or "").strip() or None

    env = merged_env()
    report: dict[str, Any] = {
        "ok": True,
        "context": {"tenant": tenant, "user_ref": user_ref, "client": client},
        "checks": [],
        "fixes": [],
    }

    def add_check(name: str, ok: bool, detail: str) -> None:
        report["checks"].append({"name": name, "ok": ok, "detail": detail})
        if not ok:
            report["ok"] = False

    # Local env checks
    public_url = env.get("TOOLKIT_PUBLIC_URL", "").strip()
    api_key = env.get("INTERNAL_API_KEY", "").strip()
    add_check("env.toolkit_public_url", bool(public_url) and not looks_placeholder(public_url), "TOOLKIT_PUBLIC_URL present")
    add_check("env.internal_api_key", bool(api_key) and not looks_placeholder(api_key), "INTERNAL_API_KEY present")

    # Tenant credential file checks
    tenant_creds = _load_tenant_credentials(tenant)
    google = tenant_creds.get("google") if isinstance(tenant_creds.get("google"), dict) else {}
    instagram = tenant_creds.get("instagram") if isinstance(tenant_creds.get("instagram"), dict) else {}

    google_client_id = str(google.get("clientId", "")).strip()
    google_client_secret = str(google.get("clientSecret", "")).strip()
    meta_app_id = str(instagram.get("appId", "")).strip()
    meta_app_secret = str(instagram.get("appSecret", "")).strip()

    add_check(
        "credentials.google",
        bool(google_client_id and google_client_secret) and not looks_placeholder(google_client_id) and not looks_placeholder(google_client_secret),
        "Tenant Google credentials present and non-placeholder",
    )
    add_check(
        "credentials.instagram",
        bool(meta_app_id and meta_app_secret) and not looks_placeholder(meta_app_id) and not looks_placeholder(meta_app_secret),
        "Tenant Meta credentials present and non-placeholder",
    )

    # Backend checks (only if base URL + API key are present)
    if public_url and api_key and not looks_placeholder(public_url) and not looks_placeholder(api_key):
        ctx = ContextArgs(user_ref=user_ref, tenant=tenant, client=client)
        health_status, _health_payload = http_get_json(f"{public_url.rstrip('/')}/v1/health")
        add_check("backend.health", health_status == 200, f"GET /v1/health -> {health_status}")

        debug_status, debug_payload = http_get_json(
            f"{public_url.rstrip('/')}/v1/debug/config{build_query(ctx)}",
            api_key=api_key,
        )
        add_check("backend.debug_config", debug_status == 200, f"GET /v1/debug/config -> {debug_status}")

        oauth_status, oauth_payload = http_get_json(
            f"{public_url.rstrip('/')}/v1/oauth/connect_urls{build_query(ctx)}",
            api_key=api_key,
        )
        add_check("backend.oauth_connect_urls", oauth_status == 200, f"GET /v1/oauth/connect_urls -> {oauth_status}")

        if debug_status == 200 and isinstance(debug_payload, dict):
            checks = debug_payload.get("checks", {})
            if isinstance(checks, dict):
                add_check("runtime.google_configured", bool(checks.get("googleOAuthConfigured")), "Runtime Google OAuth configured")
                add_check("runtime.instagram_configured", bool(checks.get("instagramOAuthConfigured")), "Runtime Instagram OAuth configured")

        if oauth_status == 200 and isinstance(oauth_payload, dict):
            g = oauth_payload.get("google", {})
            i = oauth_payload.get("instagram", {})
            g_cfg = bool(g.get("configured")) if isinstance(g, dict) else False
            i_cfg = bool(i.get("configured")) if isinstance(i, dict) else False
            add_check("runtime.google_connect_url", g_cfg and bool(g.get("connectUrl")), "Google connect URL available")
            add_check("runtime.instagram_connect_url", i_cfg and bool(i.get("connectUrl")), "Instagram connect URL available")

    # Actionable fixes
    if not report["ok"]:
        report["fixes"] = [
            "Run setup wizard: .\\scripts\\toolkit.ps1 setup wizard --tenant <tenant> --user-ref <user_ref> --connect",
            "Then verify: .\\scripts\\toolkit.ps1 backend verify --tenant <tenant> --user-ref <user_ref>",
            "Never paste secrets in chat; enter them only in local wizard prompt.",
        ]

    print_json(report)
    return EXIT_OK if report["ok"] else EXIT_PROVIDER_MISCONFIGURED


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="toolkit", description="two_platform_toolkit operator CLI")
    sub = parser.add_subparsers(dest="group", required=True)

    profiles = sub.add_parser("profiles")
    profiles_sub = profiles.add_subparsers(dest="action", required=True)
    profiles_sub.add_parser("list").set_defaults(func=cmd_profiles_list)

    p_show = profiles_sub.add_parser("show")
    p_show.add_argument("name")
    p_show.set_defaults(func=cmd_profiles_show)

    p_add = profiles_sub.add_parser("add")
    p_add.add_argument("name")
    p_add.add_argument("--from", dest="from_path", required=True, help="Path to source .env file")
    p_add.add_argument("--tenant")
    p_add.add_argument("--client")
    p_add.add_argument("--user-ref", dest="user_ref")
    p_add.set_defaults(func=cmd_profiles_add)

    p_remove = profiles_sub.add_parser("remove")
    p_remove.add_argument("name")
    p_remove.set_defaults(func=cmd_profiles_remove)

    env = sub.add_parser("env")
    env_sub = env.add_subparsers(dest="action", required=True)

    e_use = env_sub.add_parser("use")
    e_use.add_argument("profile")
    e_use.set_defaults(func=cmd_env_use)

    env_sub.add_parser("current").set_defaults(func=cmd_env_current)

    e_diff = env_sub.add_parser("diff")
    e_diff.add_argument("profile", nargs="?")
    e_diff.set_defaults(func=cmd_env_diff)

    e_validate = env_sub.add_parser("validate")
    e_validate.add_argument("profile", nargs="?")
    e_validate.set_defaults(func=cmd_env_validate)

    backend = sub.add_parser("backend")
    backend_sub = backend.add_subparsers(dest="action", required=True)

    for cmd_name, func in [
        ("verify", cmd_backend_verify),
        ("health", cmd_backend_health),
        ("debug-config", cmd_backend_debug_config),
    ]:
        p = backend_sub.add_parser(cmd_name)
        p.add_argument("--base-url")
        p.add_argument("--user-ref")
        p.add_argument("--tenant")
        p.add_argument("--client")
        p.set_defaults(func=func)

    oauth = sub.add_parser("oauth")
    oauth_sub = oauth.add_subparsers(dest="action", required=True)

    p_urls = oauth_sub.add_parser("urls")
    p_urls.add_argument("--base-url")
    p_urls.add_argument("--provider", choices=["google", "instagram", "all"], default="all")
    p_urls.add_argument("--user-ref")
    p_urls.add_argument("--tenant")
    p_urls.add_argument("--client")
    p_urls.set_defaults(func=cmd_oauth_urls)

    p_connect = oauth_sub.add_parser("connect")
    p_connect.add_argument("--base-url")
    p_connect.add_argument("--provider", choices=["google", "instagram"], required=True)
    p_connect.add_argument("--user-ref")
    p_connect.add_argument("--tenant")
    p_connect.add_argument("--client")
    p_connect.add_argument("--open", action="store_true")
    p_connect.set_defaults(func=cmd_oauth_connect)

    p_status = oauth_sub.add_parser("status")
    p_status.add_argument("--base-url")
    p_status.add_argument("--user-ref")
    p_status.add_argument("--tenant")
    p_status.add_argument("--client")
    p_status.set_defaults(func=cmd_oauth_status)

    run = sub.add_parser("run")
    run.add_argument("target", choices=["dev", "tunnel", "openapi-bundle", "smoke"])
    run.add_argument("--base-url")
    run.add_argument("--user-ref")
    run.add_argument("--tenant")
    run.add_argument("--client")
    run.set_defaults(func=cmd_run)

    setup = sub.add_parser("setup")
    setup_sub = setup.add_subparsers(dest="action", required=True)

    setup_wizard = setup_sub.add_parser("wizard")
    setup_wizard.add_argument("--base-url")
    setup_wizard.add_argument("--tenant")
    setup_wizard.add_argument("--client")
    setup_wizard.add_argument("--user-ref")
    setup_wizard.add_argument("--google-client-id")
    setup_wizard.add_argument("--google-client-secret")
    setup_wizard.add_argument("--meta-app-id")
    setup_wizard.add_argument("--meta-app-secret")
    setup_wizard.add_argument("--meta-graph-version")
    setup_wizard.add_argument("--connect", action="store_true")
    setup_wizard.set_defaults(func=cmd_setup_wizard)

    doctor = sub.add_parser("doctor")
    doctor.add_argument("--tenant", default="tenant-e2e")
    doctor.add_argument("--user-ref", default="operator")
    doctor.add_argument("--client")
    doctor.set_defaults(func=cmd_doctor)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    func = getattr(args, "func", None)
    if func is None:
        parser.print_help()
        return EXIT_VALIDATION
    try:
        return int(func(args))
    except KeyboardInterrupt:
        return 130
    except Exception as exc:
        print(f"Unhandled error: {exc}")
        return EXIT_VALIDATION


if __name__ == "__main__":
    sys.exit(main())
