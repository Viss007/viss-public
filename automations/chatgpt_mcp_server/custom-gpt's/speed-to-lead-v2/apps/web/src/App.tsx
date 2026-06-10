import React, { useEffect, useMemo, useState } from "react";
import { getJSON, postJSON } from "./api";

type SessionView = {
  ok: boolean;
  session?: unknown;
  messages?: MessageRow[];
  leads?: unknown[];
  drafts?: unknown[];
  error?: string;
};

type MessageRow = {
  message_id: string;
  raw_text: string;
  created_at: string;
};

type Screen = "inbox" | "read";

const nowKey = () => `k_${Date.now()}`;

function initials(name: string, fallback = "?"): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return fallback.slice(0, 2).toUpperCase();
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function snippet(text: string, max = 90): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function EmailMark({ size = 40 }: { size?: number }) {
  return (
    <svg className="gh-email-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M8 38V12l16 12 16-12v26H8z" />
      <path fill="#FBBC04" d="M40 12v3L24 24 8 15v-3l16 9 16-9z" />
      <path fill="#4285F4" d="M40 10L24 19 8 10V8h32v2z" />
    </svg>
  );
}

type DemoNavIconId = "sheets" | "gcal" | "gdrive";

function DemoNavIcon({ id, size = 16 }: { id: DemoNavIconId; size?: number }) {
  const c = "gh-demo-nav-icon";
  switch (id) {
    case "sheets":
      return (
        <svg className={c} viewBox="0 0 24 24" width={size} height={size} aria-hidden>
          <path
            fill="#0f9d58"
            d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14H7v-2h5v2zm0-4H7v-2h5v2zm0-4H7V7h5v2zm6 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V7h4v2z"
          />
        </svg>
      );
    case "gcal":
      return (
        <svg className={c} viewBox="0 0 24 24" width={size} height={size} aria-hidden>
          <path fill="#fff" d="M4 4h16v16H4z" />
          <path fill="#4285F4" d="M4 4h5v5H4zm6 0h5v5h-5zm6 0h4v5h-4z" />
          <path fill="#EA4335" d="M4 10h5v4H4zm6 0h5v4h-5zm6 0h4v4h-4z" />
          <path fill="#FBBC04" d="M4 15h5v5H4zm6 0h5v5h-5zm6 0h4v5h-4z" />
          <path fill="#34A853" d="M4 20h5v2H4zm6 0h5v2h-5zm6 0h4v2h-4z" />
          <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="#dadce0" strokeWidth="1" />
        </svg>
      );
    case "gdrive":
      return (
        <svg className={c} viewBox="0 0 24 24" width={size} height={size} aria-hidden>
          <path fill="#0066DA" d="M8 2L2 12h6l6-10H8z" />
          <path fill="#00AC47" d="M16 2H8l6 10h6L16 2z" />
          <path fill="#EA4335" d="M2 12l4 8h6l-4-8H2zm10 0l4 8h6l-4-8h-6z" />
          <path fill="#FFBA00" d="M8 12l2 4h4l2-4H8z" />
        </svg>
      );
    default:
      return null;
  }
}

let didAutoSession = false;

/** Mock workspace tools ChatGPT Actions would drive — Sheets / Calendar / Drive only; no extra app chrome in the strip. */
const DEMO_NAV_ITEMS: ReadonlyArray<{ label: string; icon: DemoNavIconId }> = [
  { label: "Sheets", icon: "sheets" },
  { label: "Calendar", icon: "gcal" },
  { label: "Drive", icon: "gdrive" },
];

const MOCK_PANEL_TITLE: Record<DemoNavIconId, string> = {
  sheets: "Sheets",
  gcal: "Calendar",
  gdrive: "Drive",
};

function DemoMockPanelBody({ id }: { id: DemoNavIconId }) {
  switch (id) {
    case "sheets":
      return (
        <>
          <p className="gh-mock-lead">
            Canned grid—your Action would POST a row here. No Google Sheets API.
          </p>
          <table className="gh-mock-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Stage</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>A. Kim</td>
                <td>New</td>
                <td>ChatGPT</td>
              </tr>
              <tr>
                <td>J. Ortiz</td>
                <td>Qualified</td>
                <td>Web form</td>
              </tr>
            </tbody>
          </table>
        </>
      );
    case "gcal":
      return (
        <>
          <p className="gh-mock-lead">Placeholder agenda—Calendar API not called.</p>
          <ul className="gh-mock-events">
            <li>
              <time>10:00</time> Follow-up · A. Kim
            </li>
            <li>
              <time>14:30</time> Demo · Fleet wrap
            </li>
            <li>
              <time>16:00</time> Internal · SLA review
            </li>
          </ul>
        </>
      );
    case "gdrive":
      return (
        <>
          <p className="gh-mock-lead">Static file list—Drive never mounts.</p>
          <ul className="gh-mock-files">
            <li>
              <span className="gh-mock-file-icon sheet" aria-hidden />
              Leads_export_demo.csv
            </li>
            <li>
              <span className="gh-mock-file-icon doc" aria-hidden />
              Proposal_draft.pdf
            </li>
            <li>
              <span className="gh-mock-file-icon img" aria-hidden />
              Moodboard.png
            </li>
          </ul>
        </>
      );
    default:
      return null;
  }
}

export default function App() {
  const [sessionId, setSessionId] = useState<string>("");
  const [view, setView] = useState<SessionView | null>(null);
  const [screen, setScreen] = useState<Screen>("inbox");
  const [opened, setOpened] = useState<MessageRow | null>(null);
  const [mockPanelOpen, setMockPanelOpen] = useState<DemoNavIconId | null>(null);

  const senderLabel = "Lead inbox";

  async function refresh(sid = sessionId) {
    if (!sid) return;
    const data = await getJSON<SessionView>(`/session/${sid}`);
    setView(data);
  }

  async function startSession() {
    const r = await postJSON<{ ok: boolean; session_id: string }>(
      "/start_session",
      { idempotency_key: nowKey() }
    );
    if (r.ok) {
      setSessionId(r.session_id);
      setOpened(null);
      setScreen("inbox");
      await refresh(r.session_id);
    }
  }

  useEffect(() => {
    if (!sessionId) return;
    void getJSON<SessionView>(`/session/${sessionId}`).then(setView);
  }, [sessionId]);

  useEffect(() => {
    if (didAutoSession) return;
    didAutoSession = true;
    void startSession();
  }, []);

  useEffect(() => {
    if (!mockPanelOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMockPanelOpen(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mockPanelOpen]);

  const messagesDesc = useMemo(() => {
    const list = view?.messages || [];
    return [...list].reverse();
  }, [view?.messages]);

  function goInbox() {
    setMockPanelOpen(null);
    setScreen("inbox");
    setOpened(null);
  }

  function openMessage(m: MessageRow) {
    setOpened(m);
    setScreen("read");
  }

  return (
    <div className="gmail-app">
      <header className="gh-header">
        <div className="gh-left">
          <button type="button" className="gh-icon-btn" aria-label="Main menu">
            ☰
          </button>
          <button
            type="button"
            className="gh-brand-link"
            style={{ border: "none", cursor: "pointer", font: "inherit" }}
            onClick={() => goInbox()}
          >
            <EmailMark size={40} />
            <span className="gh-brand-title">Email</span>
          </button>
        </div>

        <nav className="gh-demo-nav" aria-label="Simulated integrations (demo only)">
          {DEMO_NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`gh-demo-nav-link${mockPanelOpen === item.icon ? " is-mock-open" : ""}`}
              title={`Simulated ${item.label} — fills the main workspace (not the real app)`}
              onClick={() => {
                setMockPanelOpen(item.icon);
                setScreen("inbox");
                setOpened(null);
              }}
            >
              <DemoNavIcon id={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="gh-header-actions">
          <div className="gh-avatar" aria-hidden>
            {initials("Operator")}
          </div>
        </div>
      </header>

      <div className="gh-shell">
        <main className="gh-main gh-main-full">
          {mockPanelOpen ? (
            <div className={`gh-tool-mock gh-tool-mock--${mockPanelOpen}`}>
              <div className="gh-toolbar gh-toolbar-mock">
                <DemoNavIcon id={mockPanelOpen} size={22} />
                <span className="gh-toolbar-label">{MOCK_PANEL_TITLE[mockPanelOpen]}</span>
                <span className="gh-mock-badge">Simulation</span>
                <span className="gh-toolbar-spacer" />
              </div>
              <div className="gh-tool-mock-scroll">
                <DemoMockPanelBody id={mockPanelOpen} />
              </div>
            </div>
          ) : screen === "inbox" ? (
            <>
              <div className="gh-toolbar">
                <span className="gh-cb" aria-hidden />
                <button
                  type="button"
                  className="gh-tool-btn"
                  aria-label="Refresh"
                  onClick={() => void refresh()}
                  disabled={!sessionId}
                >
                  ↻
                </button>
                <span className="gh-toolbar-spacer" />
                <span className="gh-toolbar-label">Inbox</span>
              </div>

              <div className="gh-thread-scroll">
                {!sessionId ? (
                  <div className="gh-empty-inbox">Loading inbox…</div>
                ) : messagesDesc.length === 0 ? (
                  <div className="gh-empty-inbox">No messages yet.</div>
                ) : (
                  messagesDesc.map((m) => (
                    <div
                      key={m.message_id}
                      role="button"
                      tabIndex={0}
                      className={`gh-row${opened?.message_id === m.message_id ? " selected" : ""}`}
                      onClick={() => openMessage(m)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openMessage(m);
                        }
                      }}
                    >
                      <span className="gh-cb" aria-hidden />
                      <button
                        type="button"
                        className="gh-star"
                        aria-label="Star"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ☆
                      </button>
                      <span className="gh-sender">{senderLabel}</span>
                      <span className="gh-subject-snippet">
                        <span className="subj">Message · </span>
                        <span className="snip">{snippet(m.raw_text)}</span>
                      </span>
                      <span className="gh-date">{m.created_at}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : null}

          {!mockPanelOpen && screen === "read" && opened ? (
            <div className="gh-read">
              <div className="gh-toolbar">
                <button type="button" className="gh-tool-btn gh-back" onClick={() => goInbox()} aria-label="Back to inbox">
                  ←
                </button>
                <span className="gh-toolbar-label">Message</span>
                <span className="gh-toolbar-spacer" />
                <span className="gh-date">{opened.created_at}</span>
              </div>
              <div className="gh-read-body">
                <p className="gh-read-meta">{senderLabel}</p>
                <pre className="gh-read-pre">{opened.raw_text}</pre>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
