# Slack — deep research dossier

**Research round date:** 2026-04-20
**Primary sources:** [slack.com](https://slack.com/) (English: [slack.com/intl/en-us/](https://slack.com/intl/en-us/)), [slack.com/pricing](https://slack.com/pricing), [api.slack.com](https://api.slack.com/), [slack.dev](https://slack.dev/) (developer hub), public marketing and product pages.
**Corporate:** Slack is marketed as **Slack Technologies, LLC, a Salesforce company** (footer on [slack.com](https://slack.com/)).

---

## 1. Executive summary

**Slack** is a **team collaboration and “AI work platform”** combining **channels**, **direct messaging**, **huddles** (audio/video), **Slack Connect** (external collaboration), **Canvas** (docs), **Lists** (project tracking), **Workflow Builder**, a large **app marketplace**, and a growing **AI layer**: **Slackbot** (personal AI agent), **AI search and summaries**, integrations with **Claude**, **GitHub Copilot**, **Salesforce / Agentforce**, and **enterprise search** across connected systems. Positioning: *“All your people and AI agents working together”* — *“Slack connects your team. Slackbot multiplies what they can do.”* ([English homepage](https://slack.com/intl/en-us/))

**Developers** build on the **Slack Platform** via **Web API**, **Bolt** (JS/Java/Python), **Slack CLI**, **Block Kit**, and agent-focused docs (e.g. [Agent quickstart](https://docs.slack.dev/ai/agent-quickstart) linked from [slack.dev](https://slack.dev/)).

**Pricing** is **per user per month** with tiers **Free**, **Pro**, **Business+**, and **Enterprise+** (contact sales); the public pricing page also lists promotional discounts (e.g. “50% off for 3 months”) — treat dollar figures as **marketing snapshots**, not a quote ([pricing](https://slack.com/pricing)).

---

## 2. Product surface map

### 2.1 Marketing taxonomy (Features mega-menu)

From the public site structure ([slack.com](https://slack.com/)):

| Area | Examples |
|------|----------|
| **Collaboration** | Channels, Slack Connect, Messaging, Huddles, Clips |
| **CRM** | Salesforce in Slack, Slack CRM for small business |
| **Project management** | Templates, Canvas, Lists, File sharing |
| **Platform** | Agentic Platform, Apps & integrations, Workflow Builder |
| **Intelligence** | AI in Slack, Slackbot, Agentforce, Enterprise Search |
| **Admin & security** | Security, Enterprise Key Management, Slack Atlas (profiles/org charts) |

### 2.2 Core collaboration (what the product *is*)

- **Channels** — shared spaces for teams, projects, and (in the AI narrative) **AI assistants and agents** ([homepage](https://slack.com/intl/en-us/)).
- **Slack Connect** — work with external orgs; homepage cites **4M** Slack Connect users working with external teams weekly (footnote 3).
- **Huddles** — lightweight meetings; **AI note-taking** in huddles is advertised on the homepage.
- **Canvas & Lists** — docs and task tracking inside Slack ([pricing comparison](https://slack.com/pricing)).
- **Clips** — audio/video snippets ([site nav](https://slack.com/)).

### 2.3 AI & agents (differentiation narrative)

Homepage examples of AI-assisted work ([slack.com/intl/en-us/](https://slack.com/intl/en-us/)):

- Update deals via **Slackbot**
- Summarize missed conversations
- **Claude** for fast answers
- AI notes in **huddles**
- **GitHub Copilot** for code review
- **Agentforce** for customer data lookup

**Slackbot** is described as a **personal agent** that coordinates across apps and agents, not a generic chatbot ([homepage](https://slack.com/intl/en-us/)).

**Knowledge / search:** “AI-powered search” and **enterprise search** (higher tiers) to query conversations, files, and connected systems ([homepage](https://slack.com/intl/en-us/), [pricing](https://slack.com/pricing)).

**Salesforce alignment:** Deep CRM integration — e.g. bringing **Salesforce records** into channels; **Slack CRM** and **Agentforce** positioned for sales workflows ([pricing feature lists](https://slack.com/pricing)).

---

## 3. Developer & agent platform

### 3.1 Slack API & getting started

Official developer entry: [api.slack.com](https://api.slack.com/) — docs for **interactive apps**, **automation**, and making Slack a **platform**. Quickstart pattern:

1. Install **Slack CLI** (`curl … slack-cli/install.sh | bash`)
2. `slack login`
3. `slack create` (Bolt project from template)
4. `slack run`

### 3.2 Tools (from [api.slack.com](https://api.slack.com/) and [slack.dev](https://slack.dev/))

| Tool | Role |
|------|------|
| **Slack CLI** | Create/manage apps, lifecycle, deployment ([docs.slack.dev/tools/slack-cli](https://docs.slack.dev/tools/slack-cli/)) |
| **Bolt** | JavaScript, Python, Java frameworks for Slack apps |
| **Slack SDKs** | Node, Python, Java SDKs |
| **Block Kit** | Structured message UI ([Block Kit Builder](https://api.slack.com/block-kit-builder)) |
| **GitHub Action** | CI/CD integration |

### 3.3 “Agentic era” content

[slack.dev](https://slack.dev/) highlights posts such as **“Slack Platform Reimagined for the Agentic Era”**, **Block Kit for agents**, **“Make your AI agent think out loud in Slack”**, plus **agent quickstart** and **Bolt AI / assistant templates** (e.g. [bolt-js-assistant-template](https://github.com/slack-samples/bolt-js-assistant-template)). This signals Slack’s bet on **in-client agents** and **first-party + third-party AI apps**.

---

## 4. Pricing & packaging (public, marketing page)

Source: [slack.com/pricing](https://slack.com/pricing) (2026-04-20 fetch). **Prices below appeared alongside “50% off for 3 months*”** on Pro/Business+ — confirm live page and contract for current numbers.

| Tier | Positioning | Notable limits / features (abridged) |
|------|-------------|-------------------------------------|
| **Free** | Simple chat & collaboration | **90 days** message history; up to **10 apps**; **2,600+** App Directory apps cited; 1:1 huddles; 1:1 Slack Connect DMs; “Basic AI” (summaries, Slackbot, AI workflow generation, AI search, recaps, file summaries) |
| **Pro** | Productivity hub | **Unlimited** history & app integrations; group huddles; broader Slack Connect; **Basic AI**; SSO/SCIM/DLP listed |
| **Business+** | Scale with AI | **Advanced AI** (expanded Slackbot description, workflow generation from prompt); **SAML** (12 SSO options cited); Slackbot **plan limits** may apply |
| **Enterprise+** | Full “work OS” | **Contact sales**; **Enterprise-Grade AI**; **enterprise search** across apps/databases; **multiple SAML**; EMM; enhanced DLP for Slack Connect; Salesforce channel connections; **Slack CRM** / deal tracking features in copy |

**Free vs paid:** Free tier’s **90-day** searchable history is a key upsell lever; paid tiers emphasize **unlimited history** and richer **AI** and **governance**.

---

## 5. Scale & proof points (Slack-cited)

Homepage statistics ([slack.com/intl/en-us/](https://slack.com/intl/en-us/)) with footnotes as presented by Slack:

| Metric | Value | Footnote |
|--------|-------|----------|
| Weekly time saved with AI in Slack | **97 min** average | (1) Internal pilot analysis |
| Time saved from automations | **35%** increase | (2) FY24 Customer Success Metrics |
| Messages per day | **700M** | (3) FY25 internal product data |
| Slack Connect external users / week | **4M** | (3) |
| Daily workflows | **3M** | (3) |
| Apps actively used weekly | **1.7M** | (3) |
| Users feeling more connected | **90%** | (4) Survey |
| Avg apps per team | **43** | (3) |
| Collaborate more efficiently | **87%** | (4) Survey |
| G2 leadership | **314+** market reports | (5) G2 Winter 2026 |

*Footnotes (1)–(5) are summarized on the homepage; methodology is Slack-internal or third-party as stated there.*

---

## 6. Business & competitive lens (factual + labeled inference)

**Value proposition:** Central **conversation layer** for humans + **bots + AI agents**, with strong **integrations** and **Salesforce**-driven CRM story for revenue teams.

**ICP:** SMB to enterprise teams that outgrow email; **developers** embedding workflows; **Salesforce** customers for CRM-in-Slack.

**Competition (market reality, not Slack copy):** Microsoft **Teams**, Google **Chat**, **Zoom** Team Chat, async tools (**Notion**, **Asana**, etc.). Slack’s differentiation is historically **ecosystem + UX + developer platform**; **Teams** bundles deeply with Microsoft 365.

**Go-to-market:** Self-serve Free → Pro/Business+; **Enterprise+** and **Salesforce** field motion for large deals; content on [slack.dev](https://slack.dev/), **Slack Marketplace**, demos, templates.

---

## 7. Security & compliance (marketing level)

Homepage: *“If it’s shared in Slack, it’s safe. Our security program protects your data at every layer.”* ([slack.com/intl/en-us/](https://slack.com/intl/en-us/))

Pricing tier lists include **SAML/SSO**, **SCIM**, **EMM**, **native DLP**, **Enterprise Key Management** (site features — see [Features → Security](https://slack.com/) for detail).

*For audits, subprocessors, and certifications, use Slack’s **Trust** / compliance pages (not fully captured in this pass) — verify for procurement.*

---

## 8. Integration with external agent stacks (workspace context)

Third-party **agent toolkits** (e.g. **Composio**’s Slack tools such as `SLACK_LIST_CHANNELS`, messaging actions) treat Slack as **one of many** OAuth-connected surfaces; Slack’s **own** platform is the **first-party** app + Block Kit + Events API model. For a Composio overview see `docs/chatgpt_composio/composio/composio.md`.

---

## 9. Open questions / data gaps

1. **Exact list price** after promotional periods — pricing page showed time-limited discounts.
2. **AI usage limits** per tier (“Plan limits apply” on Slackbot in places) — need admin docs or SKU sheet.
3. **Regional** pricing and data residency — not detailed in this fetch.
4. **Agentforce** SKUs and packaging — Salesforce-led; Slack.com references it but enterprise packaging is cross-product.
5. **Trust center** artifacts (SOC 2, ISO, etc.) — pull from official compliance pages for diligence.

---

## 10. URL index

| Resource | URL |
|----------|-----|
| Marketing (EN-US) | https://slack.com/intl/en-us/ |
| Pricing | https://slack.com/pricing |
| Get started | https://slack.com/get-started |
| Contact sales / demo | https://slack.com/contact-sales |
| Developer docs (API) | https://api.slack.com/ |
| Developer hub | https://slack.dev/ |
| Slack CLI docs | https://docs.slack.dev/tools/slack-cli/ |
| Agent quickstart (docs) | https://docs.slack.dev/ai/agent-quickstart |
| Features: Slackbot | https://slack.com/features/slackbot |
| Features: AI | https://slack.com/features/ai |
| Features: CRM / Salesforce | https://slack.com/features/crm |
| Slack Connect | https://slack.com/connect |
| Block Kit Builder | https://api.slack.com/block-kit-builder |

---

*End of dossier. Re-validate pricing and AI feature names on live pages before proposals or builds.*
