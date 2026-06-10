# website_templates — lane hub

> Dentists-templates rule, all `website_templates/dentists_templates/...` sections, and `website_templates/4_templates/README.md` (paths relative to **`website_templates/`** in this workspace).

---

<!-- SOURCE: .cursor/rules/web_dentists_templates.mdc -->

## .cursor/rules/web_dentists_templates.mdc

---
description: Dentist site Laravel templates — dentists_templates/ (first_pitch); LT UI, EN chat
globs: "**/dentists_templates/**"
alwaysApply: false
---

# Dentist templates (`web_development/website_templates/dentists_templates/`)

## Language

- **Site / product copy** (Blade, headings, forms, meta): **Lithuanian** — natural, professional dental-clinic tone unless the task says otherwise.
- **This chat** (explanations, commit/PR notes, steps, code discussion): **English always**, even though the site is Lithuanian. Switch only if the user explicitly asks for another language.

**Scope:** Laravel + Blade + Tailwind starters for dental practice marketing sites.

| Project | Stack | Local URL |
|--------|--------|-----------|
| **`first_pitch/`** | Laravel 12, Vite, Tailwind v4 | **`http://127.0.0.1:8125`** (`composer run serve` or `serve-local.bat`; pair with `npm run dev` or `npm run build`) |

**Product notes:** See **`web_development/docs/dental_web.md`** for page structure and reference links.

**Umbrella:** **`.cursor/AGENTS.md`** + **`web_dimensional_retrieval/web_dimensional_retrieval.md`** as needed + **`commands/8811.md`** / **`rules/main_agent_identity.mdc`** as applicable.

---

<!-- SOURCE: website_templates/4_templates/README.md -->

## website_templates/4_templates/README.md

# Template Playground

Laravel 11 app derived from `web_development/news-crud`, rebuilt as a **UI template previewer**: one homepage with four cards; each card swaps the full page into a distinct mock layout. **Refresh resets** to the homepage (no URL or session persistence).

## Stack

- Laravel 11, Tailwind CSS, Vite
- **Livewire** (resolved to **v4.x** via Composer; v3.5.x was blocked by security audit in this environment — same component patterns)
- **Alpine.js** is bundled with Livewire for `x-data` / transitions where used

## Run locally (PowerShell)

```powershell
cd c:\Users\Vismantas\Desktop\web_development\website_templates\4_templates

Copy-Item .env.example .env -Force
New-Item -ItemType File -Path .\database\database.sqlite -Force

composer install
php artisan key:generate
php artisan migrate --no-interaction

npm install
npm run build

php artisan serve
```

Open **http://127.0.0.1:8000** — or use **`serve-local.bat`** from this folder.

## Tests

```powershell
php artisan test
```

## Structure

| Path | Role |
|------|------|
| `app/Livewire/TemplatePlayground.php` | State: `activeTemplate`, `select()`, `resetToDefault()` |
| `resources/views/livewire/template-playground.blade.php` | Homepage grid + reset control |
| `resources/views/livewire/templates/*.blade.php` | Full-page mock templates |
| `resources/views/layouts/playground.blade.php` | HTML shell + `@livewireStyles` / `@livewireScripts` |

## Behavior

- **Cards** — `wire:click="select('corporate|product|blog|saas')"` replaces the main view with the matching template.
- **Reset to Default** — `wire:click="resetToDefault"` clears `activeTemplate`.
- **Full page reload** — always shows the default homepage (Livewire state is not persisted).

---

<!-- SOURCE: website_templates/dentists_templates/draugystes-booking/AGENTS.md -->

## website_templates/dentists_templates/draugystes-booking/AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

<!-- SOURCE: website_templates/dentists_templates/draugystes-booking/CLAUDE.md -->

## website_templates/dentists_templates/draugystes-booking/CLAUDE.md

@AGENTS.md

---

<!-- SOURCE: website_templates/dentists_templates/draugystes-booking/README.md -->

## website_templates/dentists_templates/draugystes-booking/README.md

# Draugystės klinika — online booking

This product is a **patient-facing booking website** built with Next.js: visitors choose a day, time, and dental service, enter name, phone, and email, and submit; bookings are stored on the server and listed on a simple **admin page** for clinic staff. The clinic **does not replace** their main marketing site (for example WordPress on draugystes.lt); they **add** a small floating button that links to wherever this app is hosted, so patients jump from the familiar site into registration in one click. Your job as implementer is to deploy this app to a stable HTTPS URL, wire that URL into the paste-in snippet, then give the clinic both the snippet and the live booking link so they can publish the button and share the address with patients.

## Next steps

- **Deploy the app** — Host this project (for example Vercel, your VPS, or the clinic’s server) so it has a public **HTTPS** URL; the public booking page is `/` and the booking list is `/admin` (protect `/admin` before go-live).
- **Set the correct `BOOKING_ORIGIN` in `floating-button.html`** — Open `floating-button.html`, find `var BOOKING_ORIGIN = ''` in the script at the bottom, and set it to the booking app’s origin only: `https://your-subdomain.example.com` with **no path and no trailing slash**. Use `''` only if WordPress and the booking app share the **same** hostname.
- **Give the client the button code and the deployed link** — Send them the full contents of `floating-button.html` (after `BOOKING_ORIGIN` is set) for their web person to paste into WordPress (Custom HTML block or footer), and send the public booking URL (same origin you put in `BOOKING_ORIGIN`, ending with `/` for the home page).

## Run locally

```bash
npm run dev
```

Open `http://127.0.0.1:3000`. Admin: `http://127.0.0.1:3000/admin`. On Windows you can use `dev.bat` from this folder.

## What’s in the project

- **`/`** — Calendar (next 30 working days), time slots, service list, patient form; submit writes to disk and refreshes availability.
- **`/admin`** — All bookings, newest first (add authentication or network restriction before production).
- **`/api/bookings`** — `GET` lists bookings; `GET ?mode=slots` returns slot availability; `POST` creates a booking with validation and conflict checks.
- **`data/bookings.json`** — Created on first booking; no database in this demo.
- **`src/lib/services.ts`** — Editable list of services and durations (Higiena, Dantų balinimas, Implantacija, and so on).
- **`floating-button.html`** — Styling matches the clinic’s Bridge **`.qbutton`** gold buttons on [draugystes.lt](https://www.draugystes.lt/); see file comments for `BOOKING_ORIGIN` behavior.

Visual design follows the live site: gold buttons `#BFA77A` / hover `#BF8B28`, Nunito Sans and Playfair Display, tokens in `src/app/globals.css` and `src/app/layout.tsx`.

## Slot logic (short)

- Weekdays 09:00–17:00, 30-minute steps; multi-slot services use `durationMinutes` from `services.ts`.
- Some future slots are pre-blocked for a realistic grid; past slots are hidden.

## Production honesty

- File-based storage is fine for demo or low volume; production should use a real database, safe concurrent writes, and email or SMS if you promise confirmations.
- Lock down `/admin` (auth or allowlist) before exposing it publicly.

---

<!-- SOURCE: website_templates/dentists_templates/draugystes-booking/what_we_are_building.md -->

## website_templates/dentists_templates/draugystes-booking/what_we_are_building.md

Product We're Building:
A smart online booking system for Draugystės klinika
Core Idea:
We're not rebuilding their website.
We're adding one floating blue button ("Registruotis vizitui") on their current website. When patients click it, they are redirected to a clean, professional booking page that perfectly matches Draugystės branding.
What We're Actually Building:

One dedicated booking page (hosted on your server)
Clean calendar with real available time slots
Service selection (higiena, dantų balinimas, implantacija, etc.)
Patient information form
Simple admin panel for the clinic to see all bookings
Floating button code they can easily add to their WordPress site

The Pitch:
"I saw that patients can only book by phone on your website. I built a professional online booking system that perfectly matches your clinic's style. You just need to add one button — everything else is ready."
This is the full product.
We're not selling design.
We're selling convenience — patients can book 24/7 without calling.

---

<!-- SOURCE: website_templates/dentists_templates/first_pitch/docs/dental_template_status.md -->

## website_templates/dentists_templates/first_pitch/docs/dental_template_status.md

# Dental template (`first_pitch`) — status snapshot

**⚠️ Internal documentation only.** This file (and everything under `dentists_templates/first_pitch/docs/`) is for **operators and developers**. It is **not** something you attach, print, or “pitch” to clients — the **live site** and **`/pitch`** are the client-facing surface. This is exactly the class of material you **do not** pass off as client-ready collateral.

**Single source of truth** for the `dentists_templates/first_pitch` codebase state. Last aligned with the **Šypsenos Klinika** demo and **Vilnius 2026** pitch positioning.

---

## Current Status

- [x] **Multi-page site:** Home (`/`), Services (`/paslaugos`), Contact (`/kontaktai`) with shared layout, nav, footer.
- [x] **Lithuanian copy** end-to-end (headings, forms, meta titles, pitch copy).
- [x] **Clinic config** via `.env` (`config/clinic.php`): name, phone, email, address, WhatsApp, map query.
- [x] **Services & prices** on home strip + full services page (EUR, „Trukmė“ lines, Vilnius-aligned demo numbers).
- [x] **Appointment-style contact form** (`<x-appointment-form />` on contact): date, time, service dropdown, validation + demo alert; **rebrand guide** documents backend wiring.
- [x] **Home contact block** funnels to **„Registruotis vizitui internetu“** → `route('contact')#contact-form` (no duplicate mini-form).
- [x] **Pitch page** (`/pitch`): hero, trust bar, before/after, pricing, benefits, target clinics, CTA; sticky blue CTA on mobile; footer link **Demo pitch**.
- [x] **Rebrand guide:** `docs/first_pitch_rebrand_guide.md` (quick start, `/pitch`, handoff checklist).
- [x] **Project README:** `dentists_templates/first_pitch/README.md` (serve port, links).
- [x] **WhatsApp float** + **SEO** basics (meta `@section`, semantic structure).

---

## What Makes This Better Than Competitors

*Target references: [draugystes.lt](https://www.draugystes.lt), [laklinika.lt](https://www.laklinika.lt), [rgklinika.lt](https://www.rgklinika.lt) — typical older clinic sites; not a line-by-line audit.*

- **One focused sales URL** (`/pitch`) with clear pricing and urgency — faster to *decide* than digging through a full legacy site.
- **Mobile-first layout and spacing** — fewer pinch-zooms and “wall of text” than many incumbent clinic homepages.
- **Transparent paslaugos + kainos** on the home page and a dedicated `/paslaugos` — reduces “call to find out” friction.
- **Vizito užklausa** with date/time/service — stronger conversion path than a generic “contact us” only.
- **You own the stack** (Laravel + Blade + Tailwind) and a **written rebrand path** — no proprietary page-builder lock-in; documentable handover.

---

## Next Actions

- [ ] **Screenshots** for *your* deck (build from the live site — not from exporting these `.md` files): `/`, `/paslaugos`, `/kontaktai`, `/pitch` (desktop + mobile).
- [ ] **Outreach (live URL only):** Draugystės klinika, LA Klinika, RG Klinika — message + link to **`/pitch`** on **hosted** demo; **do not** send this `docs/` folder as the deliverable.
- [ ] **Pricing:** Keep one public number on `/pitch` + optional internal sheet for 590 € promo / negotiation bands.
- [ ] **Deploy** demo on a stable URL; set `APP_URL` and test `mailto:` / `mailto:` / `wa.me` / map embed.
- [ ] **Optional:** Wire `POST` appointment route + mail when a client buys; remove demo `alert()`.

---

## File Locations

| Area | Path (from repo `web_development/`) |
|------|-------------------------------------|
| Run & entry | `dentists_templates/first_pitch/README.md`, `composer.json` (`composer run serve` → **8125**) |
| Routes | `dentists_templates/first_pitch/routes/web.php` (`/`, `/paslaugos`, `/kontaktai`, `/pitch`) |
| Clinic config | `dentists_templates/first_pitch/config/clinic.php`, `.env.example` |
| Layout & chrome | `.../resources/views/layouts/app.blade.php`, `partials/site-header.blade.php`, `site-footer.blade.php`, `whatsapp-float.blade.php` |
| Pages | `.../resources/views/welcome.blade.php`, `services.blade.php`, `contact.blade.php`, `pitch.blade.php` |
| Appointment form | `.../resources/views/components/appointment-form.blade.php` |
| Theme / colors | `.../resources/css/app.css` |
| Rebrand handoff | `docs/first_pitch_rebrand_guide.md` |
| Page structure notes | `web_development/docs/dental_web.md` (umbrella repo) |
| **This status doc** | `docs/dental_template_status.md` |

---

<!-- SOURCE: website_templates/dentists_templates/first_pitch/docs/first_pitch_complete.md -->

## website_templates/dentists_templates/first_pitch/docs/first_pitch_complete.md

# `first_pitch` — internal developer snapshot

**Audience:** You and tooling. **`docs/` is not client collateral** — do not email these Markdown files to prospects or present them as the “product package.” Use the running site and **`/pitch`** for any external demo.

We shipped a Laravel + Blade + Tailwind **Šypsenos Klinika** demo with Lithuanian copy on home, services, and contact, plus a dedicated **`/pitch`** page and rebrand notes in this repo. Contact includes a full **vizito užklausa** flow; the site uses env-driven clinic config, SEO-friendly structure, and a mobile-first layout. Documentation here is for rebrand and deployment, not for forwarding as a sales PDF substitute.

**Local URLs** (after `composer run serve` from `dentists_templates/first_pitch`, default port **8125**):

- Home: `http://127.0.0.1:8125/`
- Services: `http://127.0.0.1:8125/paslaugos`
- Contact: `http://127.0.0.1:8125/kontaktai`
- Pitch: `http://127.0.0.1:8125/pitch`

**Target clinics** (Vilnius) for live outreach — **Draugystės klinika**, **LA Klinika**, **RG Klinika** — use your hosted **`/pitch`** URL in conversation; do **not** ship this folder as the pitch.

---

<!-- SOURCE: website_templates/dentists_templates/first_pitch/docs/first_pitch_handover.md -->

## website_templates/dentists_templates/first_pitch/docs/first_pitch_handover.md

# „Premium odontologijos svetainės šablonas“

**⚠️ Vidinė medžiaga.** Visas šis katalogas (`docs/`) ir `.md` failai čia — **tik operatoriui / kūrėjui**. **Klientams nesiųskite, neįdėkite į pasiūlymų paketus ir nejuokite kaip „gatavo produkto“ dokumentacijos.** Tai būtent tas turinys, kurį **nereikia** pristatyti klientui kaip deliverable — pristatymui naudokite **tik gyvą svetainę** ir naršyklėje atidaromą **`/pitch`**.

**Būsena:** ✅ Užbaigta (šablonas)

**Kaina (nuoroda iš `/pitch`, ne šis failas):** 690 € + PVM (pirmoms 3 klinikoms – 590 €)

## Kas įgyvendinta (techninė santrauka)

- 4 puslapiai lietuvių kalba (namai, paslaugos, kontaktai su registracijos forma, pitch)
- Profesionalus, švarus dizainas, konkuruojantis su [rivervalleyendo.com](https://rivervalleyendo.com)
- Viskas konfigūruojama per `.env` + `config/clinic.php`
- Pilnas rebranding guide + statuso dokumentacija (žr. kitus failus šiame kataloge)

## Kaip naudoti (viduje)

- Atidaryti **`/pitch`** naršyklėje (ne šį `.md`)
- Parodyti gyvą demo: `composer run serve`
- Rebrand / handoff: `first_pitch_rebrand_guide.md` — **tik kūrėjo darbui**, ne kliento siuntimui

---

Draugystės klinika, LA Klinika, RG Klinika — **kontaktai ir įspūdis per live demo / `/pitch`**, ne per šį dokumentų rinkinį.

---

<!-- SOURCE: website_templates/dentists_templates/first_pitch/docs/first_pitch_rebrand_guide.md -->

## website_templates/dentists_templates/first_pitch/docs/first_pitch_rebrand_guide.md

# First pitch template — rebranding guide

## Quick start — operators (this file is **not** the client handout)

- **What clients actually see:** the **running site**, especially **`/pitch`** — e.g. `http://127.0.0.1:8125/pitch` locally, or `https://your-domain.lt/pitch` in production. **Do not** email this Markdown to prospects as “the pitch”; it is **internal** rebrand and technical documentation.
- **Full demo site:** home **`/`**, services **`/paslaugos`**, contact (appointment form) **`/kontaktai`**.

---

This document explains how to take **`dentists_templates/first_pitch/`** (Laravel + Blade + Tailwind) and rebrand it for a real clinic — for example when **you** are implementing or delivering for **draugystes.lt**, **laklinika.lt**, **rgklinika.lt**, or any other practice. **Share URLs and the built site, not this file.**

**Stack reminder:** Laravel 12, Vite, Tailwind v4. After content changes, run `npm run build` (or `npm run dev` while developing). Clear cached views if you use `php artisan view:cache` in production: `php artisan view:clear`.

---

## 1. Change the clinic / site name

The visible site title in the header and footer comes from **`config('app.name')`**, which reads **`APP_NAME`** from **`.env`**.

1. Open **`.env`** (copy from **`.env.example`** if you are setting up a new clone).
2. Set:

```env
   APP_NAME="Your Clinic Name"
   ```

3. Optional but recommended: keep **`config/clinic.php`** in sync by setting **`CLINIC_NAME`** to the same string (used as the default when other code references the clinic config):

```env
   CLINIC_NAME="Your Clinic Name"
   ```

4. **`VITE_APP_NAME`** in **`.env`** is usually `"${APP_NAME}"` — it will follow **`APP_NAME`** automatically.
5. **Search and replace hardcoded titles** in Blade files: several pages still put the demo name in **`@section('title', ...)`** meta titles. From the project root, search for the old name (e.g. `Šypsenos`) and update:
   - `resources/views/welcome.blade.php`
   - `resources/views/services.blade.php`
   - `resources/views/contact.blade.php` (including the map **`iframe`** `title` attribute, which may still contain the demo name — change it to match the new clinic or use `{{ config('app.name') }}` / `{{ config('clinic.name') }}` in Blade).

6. Update **`config/clinic.php`** key **`default_meta_description`** if you want the fallback **`<meta name="description">`** (used when a page does not set **`@section('description')`**) to mention the new clinic.

7. Align email branding: **`MAIL_FROM_ADDRESS`** and **`MAIL_FROM_NAME`** in **`.env`** (see **`.env.example`**) so outgoing mail matches the new domain and name.

---

## 2. Update phone, email, address, and WhatsApp

All of these are centralized in **`config/clinic.php`**, with values overridden via **`.env`**.

| Purpose | `.env` key | Notes |
|--------|------------|--------|
| Display phone (human-readable) | `CLINIC_PHONE` | Example: `+370 600 12345` |
| `tel:` link (no spaces) | `CLINIC_PHONE_TEL` | Example: `+37060012345` |
| Email | `CLINIC_EMAIL` | Shown in contact blocks and `mailto:` |
| Postal address | `CLINIC_ADDRESS` | One line is enough for the template |
| WhatsApp chat URL | `CLINIC_WHATSAPP_URL` | Use `https://wa.me/<countrycode><number>` without `+` (e.g. Lithuanian mobile: `https://wa.me/37060012345`) |
| Google Maps search string | `CLINIC_MAP_QUERY` | Full address or place name; drives the embed URL (see section 3) |

**Steps:**

1. Add or edit these keys in **`.env`** (see defaults and commented examples in **`.env.example`**).
2. Run **`php artisan config:clear`** after changing **`.env`** so Laravel picks up new values (or **`php artisan optimize:clear`** during development).
3. The floating WhatsApp button reads **`config('clinic.whatsapp_url')`** from **`resources/views/partials/whatsapp-float.blade.php`** — no code change needed if **`.env`** is correct.

---

## 3. Replace hero image, About banner, and map location

### 3.1 Hero image (home page)

- **File:** `resources/views/welcome.blade.php`
- **What to change:** the **`<img>`** inside the hero column: **`src`**, **`alt`**, and optionally **`width` / `height`** if you switch aspect ratio.
- **Options:**
  - **Remote URL:** keep using Unsplash or another HTTPS URL (fastest for a pitch).
  - **Local asset:** put files in **`public/images/`** (e.g. `public/images/hero.jpg`) and set **`src="{{ asset('images/hero.jpg') }}"`**.

Keep the existing wrapper **`div`** classes (`aspect-[4/5]`, rounded corners, shadow) unless you intentionally change layout.

### 3.2 About section banner (home page)

- **File:** `resources/views/welcome.blade.php`
- **Section:** “Apie kliniką” — the wide image above the text.
- **What to change:** same as hero: **`src`**, **`alt`**, dimensions on **`<img>`** if needed.

### 3.3 Map (not a static image file)

The contact page does **not** use a bitmap for the map. It embeds Google Maps via an **iframe** whose query string is built from **`CLINIC_MAP_QUERY`**.

- **File:** `resources/views/contact.blade.php`
- **Behavior:** `src` uses `config('clinic.map_embed_query')` (URL-encoded) in a standard Google Maps embed URL.
- **Steps:**
  1. Set **`CLINIC_MAP_QUERY`** in **`.env`** to the full clinic address (or “Clinic Name, City, Lithuania”) until the pin looks correct in the embed.
  2. If you need a custom embed (exact lat/lng from Google Maps “Share” → “Embed a map”), replace the **`iframe`** `src` in **`contact.blade.php`** with Google’s HTML snippet — and document that in your deployment notes so the next rebrand knows to look there.

Also update the **`iframe`** **`title`** attribute for accessibility (it may still reference the demo name).

---

## 4. Customize prices and services list

- **Homepage teaser (four rows):** `resources/views/welcome.blade.php` — section “Paslaugos ir kainos”.
- **Full list:** `resources/views/services.blade.php` — all service cards with prices and “Trukmė” lines.

**Practice:**

1. Edit copy, **`nuo …,00 €`** amounts, and duration lines so they stay consistent between home and services pages for the same procedure.
2. If you add or remove services on the home strip, mirror the structure in **`services.blade.php`** so messaging does not conflict.
3. After edits, run **`npm run build`** if you changed nothing in CSS/JS (optional but harmless); always clear view cache if you use **`php artisan view:cache`** in production.

---

## 5. Change colors (dental palette)

Brand teals are defined as **CSS variables** under **`@theme`** in:

- **`resources/css/app.css`**

Current tokens:

- `--color-dental-50`
- `--color-dental-100`
- `--color-dental-500`
- `--color-dental-600`
- `--color-dental-700`

**Steps:**

1. Adjust **`oklch(...)`** values (or replace with **`#hex`** if you prefer) so buttons, borders, and headings that use **`dental-*`** Tailwind classes match the new brand.
2. Run **`npm run build`** (or **`npm run dev`**) so Vite recompiles CSS.
3. Scan for one-off colors (e.g. WhatsApp green in **`partials/whatsapp-float.blade.php`**) — change only if the client wants a different treatment.

---

## 6. Update testimonials with real client quotes

- **File:** `resources/views/welcome.blade.php`
- **Section:** “Atsiliepimai” — three **`<li>`** cards.

**For each card, update:**

1. **Name and area** (e.g. city district) — plain text in the card header.
2. **Quote body** — Lithuanian copy in the paragraph with quotation marks.
3. **Avatar images:** each card has a circular **`<img src="https://images.unsplash.com/...">`**. Replace with:
   - stock photos that match your consent model, or
   - **`{{ asset('images/testimonials/....jpg') }}`** if you host real (permissioned) portraits in **`public/images/testimonials/`**.

Use realistic, professional tone; avoid claiming specific medical outcomes unless the clinic approves the wording.

---

## 7. Appointment form (vizito užklausa)

The contact page includes a full **appointment request** form implemented as a Blade component.

| Item | Location |
|------|----------|
| Component markup + demo JS | `resources/views/components/appointment-form.blade.php` |
| Used on | `resources/views/contact.blade.php` via `<x-appointment-form />` |
| Anchor id | Form id defaults to **`contact-form`** — links such as **`/kontaktai#contact-form`** (e.g. from the mobile CTA on **`services.blade.php`**) scroll to this block |

**Fields (Lithuanian labels):** vardas ir pavardė, telefonas, el. paštas, pageidaujama data (native date picker), pageidaujamas laikas, paslauga (dropdown aligned with common services). The demo uses **HTML5 validation** plus **`.is-invalid`** styling (rose border/ring) after blur or failed submit.

**Current demo behavior:** submit is handled in the browser — **`event.preventDefault()`**, **`form.reportValidity()`**, then **`alert('Jūsų užklausa gauta. Susisieksime per 24 val.')`** and the form resets. Nothing is posted to the server yet.

### Connecting to a real backend later

1. **Route** — Add a `POST` route, e.g. `Route::post('/kontaktai/uzklausa', [AppointmentController::class, 'store'])->name('appointment.store');` (or nest under your API prefix).
2. **Controller** — Validate input (Laravel **Form Request**): `name`, `phone`, `email`, `preferred_date`, `preferred_time`, `service`. Enforce date/time rules (e.g. weekdays only, inside clinic hours) in the request or controller.
3. **Form action** — In **`appointment-form.blade.php`**, set **`action="{{ route('appointment.store') }}"`** (or `url(...)`), keep **`method="post"`**. The template already includes **`@csrf`**.
4. **Remove or replace the demo script** — Delete the inline `<script>` that calls **`preventDefault`** and **`alert`**, or replace it with **`fetch`** to the same route that returns JSON and show a flash/toast message instead of **`alert`**.
5. **Side effects** — Persist to **`appointments`** table, send mail to **`config('clinic.email')`** via **`Mail::`** / notifications, optionally notify Slack or CRM webhook.
6. **Spam** — Add rate limiting (`ThrottleRequests`), honeypot field, or CAPTCHA for production.
7. **Success UX** — Prefer **`redirect()->back()->with('success', '...')`** and a Blade **`@if(session('success'))`** banner on **`contact.blade.php`** instead of **`alert()`**.

After wiring the backend, run **`php artisan route:list`** and test CSRF + validation end to end.

---

## 8. Recommended structure: new clinic folder from this template

Use one of these approaches depending on whether you maintain one repo per client or one monorepo.

### Option A — Copy the folder (simplest for separate deployments)

1. Copy the entire **`dentists_templates/first_pitch/`** directory to a new sibling folder, e.g. **`dentists_templates/draugystes_pitch/`**.
2. In the new folder:
   - Copy **`.env.example`** → **`.env`**, set **`APP_KEY`** with **`php artisan key:generate`**.
   - Set **`APP_NAME`**, **`APP_URL`**, all **`CLINIC_*`** variables, and mail settings.
3. Run **`composer install`** (no **`--no-dev`** until you are ready for production).
4. Run **`npm install`** then **`npm run build`**.
5. Rebrand content using sections 1–8 above.
6. Optionally add the new folder to git as its own subtree or separate repository.

### Option B — Git branch per clinic (same repo)

1. Create a branch **`clinic/draugystes`** (or per client).
2. Apply **`.env`** changes only on the server or use **`.env.draugystes`** + deployment symlink — never commit secrets.
3. Commit only template/code changes (Blade, assets, **`config/clinic.php`** defaults if you want shared fallbacks).

### Option B2 — Laravel “multi-site” (advanced)

Not included out of the box. For multiple clinics in one codebase you would introduce per-domain config or a database — only if product scope grows beyond a single-site template.

### Checklist before handoff

| Step | Action |
|------|--------|
| 1 | **`.env`** complete: **`APP_NAME`**, **`CLINIC_*`**, **`MAIL_*`**, **`APP_URL`** |
| 2 | Blade **`@section('title')`** / **`description`** updated on all pages |
| 3 | Hero + About images + map query tested in browser |
| 4 | **`npm run build`** run; **`public/build/`** present on the server |
| 5 | **`php artisan config:cache`** / **`view:cache`** in production if you use them |

---

## Quick reference — files touched most often

| Task | Primary files |
|------|----------------|
| Name, contact, map query | **`.env`**, **`config/clinic.php`** (defaults) |
| Meta titles per page | **`welcome.blade.php`**, **`services.blade.php`**, **`contact.blade.php`** |
| Hero & About images | **`welcome.blade.php`** |
| Map embed | **`contact.blade.php`**, **`CLINIC_MAP_QUERY`** |
| Prices | **`welcome.blade.php`**, **`services.blade.php`** |
| Testimonials | **`welcome.blade.php`** |
| Vizito užklausa (contact form) | **`components/appointment-form.blade.php`**, **`contact.blade.php`** |
| Colors | **`resources/css/app.css`** |
| Header/footer site name | Uses **`config('app.name')`** — **`APP_NAME`** |

This is enough for a developer (or you) to rebrand quickly for **draugystes.lt**, **laklinika.lt**, **rgklinika.lt**, or any similar clinic pitch.

---

<!-- SOURCE: website_templates/dentists_templates/first_pitch/README.md -->

## website_templates/dentists_templates/first_pitch/README.md

# First pitch — dental clinic marketing site (Laravel)

**Purpose:** A production-ready Lithuanian marketing template (Blade + Tailwind) for dental clinics, with a dedicated **`/pitch`** page on the **deployed site** for sales conversations. **`docs/` in this project is internal** (developer / operator) — **not** something you forward to clients as the pitch package.

## Run locally

1. `composer install` and `npm install` (first time).
2. Copy `.env.example` to `.env`, run `php artisan key:generate`, then `npm run build` (or `npm run dev` while editing assets).
3. Start the app:

```bash
   composer run serve
   ```

The app listens on **`http://127.0.0.1:8125`** (see `composer.json` → `scripts.serve`).

## Pitch page

Open **`http://127.0.0.1:8125/pitch`** — one-page offer (pricing, benefits, CTA). Share the same path on your deployed domain (e.g. `https://example.lt/pitch`). Footer link **Demo pitch** also points here.

## Rebranding for a real clinic

See **[`docs/first_pitch_rebrand_guide.md`](docs/first_pitch_rebrand_guide.md)** — env vars, contact data, images, colors, appointment form, and folder handoff (operator-facing).

## Client-facing surface

**Live `/pitch` + hosted demo** — not the `docs/*.md` files. Template targets **Draugystės klinika**, **LA Klinika**, and **RG Klinika** (Vilnius) as reference positioning; rebrand per client using the guide above **internally**, then ship the **site**.

---
