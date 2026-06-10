/** Agents page — card health + optional agent-desk iframe when meta is set. */
(function () {
  var origin = window.location.origin || "http://127.0.0.1:3333";

  function agentDeskUrl() {
    try {
      var w = typeof window !== "undefined" && window.__VISSAI_AGENT_DESK_URL__;
      if (typeof w === "string" && w.trim()) return w.trim().replace(/\/?$/, "/");
    } catch (e) {
      /* ignore */
    }
    var meta = document.querySelector('meta[name="vissai-agent-desk-url"]');
    var c = meta && meta.getAttribute("content");
    if (c && c.trim()) return c.trim().replace(/\/?$/, "/");
    return "";
  }

  var iframe = document.getElementById("agent-desk-iframe");
  if (iframe) {
    var url = agentDeskUrl();
    if (url) iframe.src = url;
  }

  var docsUrlEl = document.getElementById("docs-agent-url");
  var docsStatusEl = document.getElementById("docs-agent-status");
  var slackStatusEl = document.getElementById("slack-agent-status");

  if (docsUrlEl) docsUrlEl.textContent = origin + "/agents/docs-agent/";

  if (!docsStatusEl) return;

  fetch(origin + "/agents/docs-agent/health", { credentials: "same-origin" })
    .then(function (r) {
      return r.json().then(function (j) {
        return { ok: r.ok, j: j };
      });
    })
    .then(function (x) {
      if (x.ok && x.j && x.j.ok) {
        docsStatusEl.textContent = "Live now — open the demo and try a sample PDF";
        docsStatusEl.className = "font-mono text-sm text-emerald-400";
        if (slackStatusEl) {
          slackStatusEl.textContent = "Site running — Slack bot active when workspace tokens are set";
          slackStatusEl.className = "font-mono text-sm text-emerald-400";
        }
      } else {
        docsStatusEl.textContent = "Demo unavailable — refresh in a moment";
        docsStatusEl.className = "font-mono text-sm text-amber-400";
        if (slackStatusEl) {
          slackStatusEl.textContent = "Unavailable while the site is starting";
          slackStatusEl.className = "font-mono text-sm text-amber-400";
        }
      }
    })
    .catch(function () {
      docsStatusEl.textContent = "Demo unavailable — refresh in a moment";
      docsStatusEl.className = "font-mono text-sm text-amber-400";
      if (slackStatusEl) {
        slackStatusEl.textContent = "Unavailable while the site is starting";
        slackStatusEl.className = "font-mono text-sm text-amber-400";
      }
    });
})();
