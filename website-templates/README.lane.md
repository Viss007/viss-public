# Lane contract (agent-readable copy)

When a matching file exists, Cursor may load **`.cursor/rules/web_*.mdc`** for globs. Paths below are relative to the workspace root.

---

## 5. Template Playground (`website_templates/4_templates/`)

**Hard scope:** Code and docs live under **`website_templates/4_templates/`** only. Do **not** conflate with **`vissai_platform/website_templates/news-crud-template/`** (CRUD app) or **`Desktop\Public (hire-me; /public) `** unless Viss wires a link.

### What it is

- **Laravel 11** + **Tailwind** + **Vite** + **Livewire** (Composer may resolve **Livewire v4.x**); Alpine ships with Livewire.
- **Single route** **`/`** — homepage with **four** large cards: Corporate Business Website, Product Landing Page, Blog / News Website, SaaS Dashboard.
- **Card click** swaps the **entire page** to that template’s mock layout (Blade partials under **`resources/views/livewire/templates/`**).
- **Reset to Default** returns to the card grid; **full browser refresh** always shows the default homepage (no URL/session persistence of the selected template).

### Canonical paths

| Role | Path |
|------|------|
| Livewire full-page component | **`app/Livewire/TemplatePlayground.php`** |
| Home + cards + reset | **`resources/views/livewire/template-playground.blade.php`** |
| Template bodies | **`resources/views/livewire/templates/{corporate,product,blog,saas}.blade.php`** |
| Layout shell | **`resources/views/layouts/playground.blade.php`** |
| Route | **`routes/web.php`** — **`/`** → **`TemplatePlayground::class`** |
| Setup, **`php artisan test`** | **`README.md`**, **`serve-local.bat`** |

### Split rule (playground vs neighbors)

| Topic | Use |
|--------|-----|
| This Template Playground app | **§ 5** template playground lane · **`website_templates/4_templates/`** |
| Laravel **News** CRUD (separate app) | **§ 4** news-crud lane · **`vissai_platform/website_templates/news-crud-template/`** |
| Public hire-me hub + iframed demos | **`/portfolio`** |

---
