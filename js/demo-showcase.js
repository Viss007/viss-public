/** Portfolio demo blocks: collapsible video + live iframe panels, health, GitHub. */
(function () {
  var origin = window.location.origin || "http://127.0.0.1:3333";

  function demoId(section) {
    return section.getAttribute("data-demo-id") || section.getAttribute("data-demo-title") || "demo";
  }

  function readCollapsed(storageKey, legacyKey) {
    try {
      var v = localStorage.getItem(storageKey);
      if (v === "1" || v === "0") return v === "1";
      if (legacyKey) {
        var legacy = localStorage.getItem(legacyKey);
        if (legacy === "1" || legacy === "0") return legacy === "1";
      }
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function wireCollapsiblePanel(section, panel) {
    var panelName = panel.getAttribute("data-demo-panel");
    var toggle = panel.querySelector("[data-demo-panel-toggle]");
    var body = panel.querySelector("[data-demo-panel-body]");
    if (!toggle || !body || !panelName) return;

    var id = demoId(section);
    var storageKey = "vissai-demo-panel:" + id + ":" + panelName;
    var legacyKey =
      panelName === "live" ? "vissai-demo-live-collapsed:" + id : null;

    function setCollapsed(collapsed, persist) {
      panel.classList.toggle("is-collapsed", collapsed);
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      var label =
        panelName === "video" ? " walkthrough video" : " live demo";
      toggle.setAttribute(
        "aria-label",
        (collapsed ? "Expand" : "Collapse") + label
      );
      if (persist !== false) {
        try {
          localStorage.setItem(storageKey, collapsed ? "1" : "0");
        } catch (e) {
          /* ignore */
        }
      }
      if (!collapsed) {
        panel.dispatchEvent(
          new CustomEvent("demo-panel-expand", { bubbles: false })
        );
      }
    }

    toggle.addEventListener("click", function () {
      setCollapsed(toggle.getAttribute("aria-expanded") === "true");
    });

    setCollapsed(readCollapsed(storageKey, legacyKey), false);
  }

  function wireLiveIframe(section) {
    var iframeSrc = section.getAttribute("data-iframe-src");
    var iframeEl = section.querySelector("[data-demo-iframe]");
    var livePanel = section.querySelector('[data-demo-panel="live"]');
    if (!iframeSrc || !iframeEl || !livePanel) return;

    var loaded = false;
    livePanel.addEventListener("demo-panel-expand", function () {
      if (loaded) return;
      var url =
        iframeSrc.indexOf("http") === 0 ? iframeSrc : origin + iframeSrc;
      iframeEl.src = url;
      iframeEl.title = section.getAttribute("data-demo-title") || "Live demo";
      loaded = true;
    });

    if (!livePanel.classList.contains("is-collapsed")) {
      livePanel.dispatchEvent(new CustomEvent("demo-panel-expand"));
    }
  }

  function wireSection(section) {
    var videoSrc = section.getAttribute("data-video-src");
    var github = section.getAttribute("data-github");
    var healthPath = section.getAttribute("data-health");
    var videoEl = section.querySelector("[data-demo-video]");
    var placeholderEl = section.querySelector("[data-demo-video-placeholder]");
    var statusEl = section.querySelector("[data-demo-status]");
    var githubEl = section.querySelector("[data-demo-github]");

    section.querySelectorAll("[data-demo-panel]").forEach(function (panel) {
      wireCollapsiblePanel(section, panel);
    });
    wireLiveIframe(section);

    if (githubEl && github) {
      githubEl.href = github;
      githubEl.hidden = false;
    }

    function showPlaceholder(msg) {
      if (placeholderEl) {
        placeholderEl.textContent = msg;
        placeholderEl.hidden = false;
      }
      if (videoEl) videoEl.hidden = true;
    }

    if (videoEl && videoSrc) {
      var fullVideo =
        videoSrc.indexOf("http") === 0 ? videoSrc : origin + videoSrc;
      showPlaceholder(
        "Demo walkthrough video — recorded via cloud agent, landing here soon."
      );
      videoEl.addEventListener("error", function () {
        showPlaceholder(
          "Demo walkthrough video — recorded via cloud agent, landing here soon."
        );
      });
      videoEl.addEventListener("loadeddata", function () {
        if (placeholderEl) placeholderEl.hidden = true;
        videoEl.hidden = false;
      });
      videoEl.src = fullVideo;
      videoEl.load();
    } else if (placeholderEl) {
      showPlaceholder(
        "Demo walkthrough video — recorded via cloud agent, landing here soon."
      );
    }

    if (!statusEl || !healthPath) return;

    fetch(origin + healthPath, { credentials: "same-origin" })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (x) {
        if (x.ok && x.j && x.j.ok) {
          statusEl.textContent = section.getAttribute("data-iframe-src")
            ? "Live — expand panels below to watch or try it"
            : "Connector online";
          statusEl.className = "demo-showcase__status is-live";
        } else {
          statusEl.textContent = "Demo starting — refresh in a moment";
          statusEl.className = "demo-showcase__status";
        }
      })
      .catch(function () {
        statusEl.textContent = "Demo starting — refresh in a moment";
        statusEl.className = "demo-showcase__status";
      });
  }

  document.querySelectorAll("[data-demo-showcase]").forEach(wireSection);
})();
