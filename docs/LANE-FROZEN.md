# `/public` lane state — hire-me site

**Thawed:** 2026-06-09 · **Viss:** unfreeze public · **Prior freeze:** 2026-06-05 → 2026-06-09.

**Scope:** **`C:\Users\Vismantas\Desktop\Public`** — entire hire-me site tree. Slash **`/public`** = **active lane** — edits and dev server allowed for agent work.

**Does not** affect **`viss-workspace`** platform, **`/transcend`**, or **`vissai_platform/`** boundaries.

---

## One sentence

**Public hire-me site is thawed; agents may edit `Desktop\Public` and start the dev server when `/public` work is scoped. Re-lock with `freeze public`.**

---

## Current state

| Item | Value |
|------|--------|
| Site SSOT | **`Desktop\Public`** |
| Lane status | **Thawed** (active) |
| Dev server | **`dev-server.mjs`** via **`start-public.bat`** — start when preview/proof needed |
| Port | **3333** |
| Platform | **`viss-workspace/vissai_platform/`** — separate; no bridge by default |

---

## Allowed (agents — thawed)

| OK | Examples |
|----|----------|
| **Edits** | HTML/CSS/JS, **`website-templates/`**, **`dev-server.mjs`**, pages |
| **Dev server** | **`start-public.bat`** or **`node dev-server.mjs`** for preview/proof |
| **8811** | Recall/persist lane policy (tags **`public`**) |
| **Orient + build** | Job hunt Phase 2 portfolio work under **`/public`** |

---

## Still banned

| Banned | Notes |
|--------|--------|
| **Platform bridge** | No proxy, iframe, or launcher coupling to **`vissai_platform`** unless Viss scopes |
| **Satellite ports** | No **:8000** template servers — **3333** only |
| **Transcend junctions** | No mirrors between **`Desktop\Public`** and stick stack |

---

## Freeze / thaw phrases

| Phrase | Effect |
|--------|--------|
| **`freeze public`** | Re-lock — read/orient only, no agent edits, no dev server |
| **`unfreeze public`** | Thaw — active lane (current default) |

**Default (2026-06-09):** thawed.

---

## History

- **2026-06-05:** Viss **`freeze public`** — hire-me phase parked; server stopped.
- **2026-06-09:** Viss **`unfreeze public`** — Phase 2 portfolio work allowed.

---

## Related

- **`viss-workspace/.cursor/commands/public.md`** — agent enforcement
- **`viss-workspace/.cursor/skills/public/SKILL.md`**
- **`docs/BOUNDARIES.md`**
