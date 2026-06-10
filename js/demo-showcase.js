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

  var liveFsOverlay = null;

  function portfolioFsUrl(iframeSrc) {
    var url = new URL(
      iframeSrc.indexOf("http") === 0 ? iframeSrc : origin + iframeSrc
    );
    url.searchParams.set("portfolio_fs", "1");
    return url.toString();
  }

  function portfolioNormalUrl(iframeSrc) {
    var url = new URL(
      iframeSrc.indexOf("http") === 0 ? iframeSrc : origin + iframeSrc
    );
    url.searchParams.delete("portfolio_fs");
    return url.toString();
  }

  function postPortfolioFs(iframeWrap, action) {
    var iframe = iframeWrap && iframeWrap.querySelector("iframe");
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(
        { type: "vissai-portfolio-fs", action: action },
        "*"
      );
    } catch (e) {
      /* ignore */
    }
  }

  function onPortfolioFsMessage(e) {
    if (!liveFsOverlay) return;
    var d = e.data;
    if (!d || d.type !== "vissai-portfolio-fs" || d.action !== "exit-request") return;
    var ctx = liveFsOverlay.__demoCtx;
    var iframe =
      ctx &&
      ctx.iframeWrap &&
      ctx.iframeWrap.querySelector("iframe");
    if (iframe && iframe.contentWindow && e.source !== iframe.contentWindow) return;
    closeLiveFullscreen();
  }

  function closeLiveFullscreen() {
    if (!liveFsOverlay) return;
    var ctx = liveFsOverlay.__demoCtx;
    if (!ctx) return;
    var panel = ctx.panel;
    var toggle = ctx.toggle;
    var iframeWrap = ctx.iframeWrap;
    postPortfolioFs(iframeWrap, "exit");
    var panelBody = panel.querySelector("[data-demo-panel-body]");
    if (panelBody && iframeWrap) panelBody.appendChild(iframeWrap);
    liveFsOverlay.remove();
    liveFsOverlay = null;
    document.body.classList.remove("demo-showcase-fs-open");
    document.removeEventListener("keydown", onLiveFsEscape);
    window.removeEventListener("message", onPortfolioFsMessage);
    var wasCollapsed = !!ctx.savedCollapsed;
    panel.classList.toggle("is-collapsed", wasCollapsed);
    toggle.setAttribute("aria-expanded", wasCollapsed ? "false" : "true");
    toggle.setAttribute(
      "aria-label",
      (wasCollapsed ? "Expand" : "Collapse") + " live demo"
    );
    try {
      localStorage.setItem(ctx.storageKey, wasCollapsed ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
  }

  function onLiveFsEscape(e) {
    if (e.key === "Escape") closeLiveFullscreen();
  }

  function wireLiveFullscreenButton(section, panel, toggle, storageKey) {
    if (panel.querySelector("[data-demo-live-fs]")) return;
    var bar = document.createElement("div");
    bar.className = "demo-showcase__panel-bar";
    panel.insertBefore(bar, toggle);
    bar.appendChild(toggle);
    var fsBtn = document.createElement("button");
    fsBtn.type = "button";
    fsBtn.className = "demo-showcase__live-fs";
    fsBtn.setAttribute("data-demo-live-fs", "");
    fsBtn.setAttribute("aria-label", "Expand demo to fill browser");
    fsBtn.textContent = "Full screen";
    fsBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (liveFsOverlay) closeLiveFullscreen();
      else openLiveFullscreen(section, panel, toggle, storageKey);
    });
    bar.appendChild(fsBtn);
  }

  function openLiveFullscreen(section, panel, toggle, storageKey) {
    if (liveFsOverlay) return;
    var iframeWrap = panel.querySelector(".demo-showcase__iframe-wrap");
    if (!iframeWrap) return;

    var savedCollapsed = panel.classList.contains("is-collapsed");
    if (savedCollapsed) {
      panel.classList.remove("is-collapsed");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Collapse live demo");
      panel.dispatchEvent(new CustomEvent("demo-panel-expand", { bubbles: false }));
    }

    var overlay = document.createElement("div");
    overlay.className = "demo-showcase__fs";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute(
      "aria-label",
      section.getAttribute("data-demo-title") || "Live demo"
    );

    var stage = document.createElement("div");
    stage.className = "demo-showcase__fs-stage";
    stage.appendChild(iframeWrap);
    overlay.appendChild(stage);
    overlay.__demoCtx = {
      panel: panel,
      toggle: toggle,
      iframeWrap: iframeWrap,
      storageKey: storageKey,
      savedCollapsed: savedCollapsed,
      iframeSrc: section.getAttribute("data-iframe-src"),
    };
    document.body.appendChild(overlay);
    liveFsOverlay = overlay;
    document.body.classList.add("demo-showcase-fs-open");
    document.addEventListener("keydown", onLiveFsEscape);
    window.addEventListener("message", onPortfolioFsMessage);

    var iframeSrc = section.getAttribute("data-iframe-src");
    var iframe = iframeWrap.querySelector("iframe");
    if (iframe && iframeSrc) {
      iframe.addEventListener(
        "load",
        function () {
          postPortfolioFs(iframeWrap, "enter");
        },
        { once: true }
      );
      iframe.src = portfolioFsUrl(iframeSrc);
    }
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
    var liveWithIframe =
      panelName === "live" && !!section.getAttribute("data-iframe-src");

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
      if (liveFsOverlay) return;
      setCollapsed(toggle.getAttribute("aria-expanded") === "true");
    });

    setCollapsed(readCollapsed(storageKey, legacyKey), false);

    if (liveWithIframe) {
      wireLiveFullscreenButton(section, panel, toggle, storageKey);
    }
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

  function wireListenButton(section) {
    var head = section.querySelector(".demo-showcase__head");
    if (!head || head.querySelector("[data-demo-listen]")) return;

    var title = section.getAttribute("data-demo-title") || "this project";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "demo-showcase__listen";
    btn.setAttribute("data-demo-listen", "");
    btn.setAttribute("aria-label", "Listen to explanation for " + title);
    btn.textContent = "Listen";
    btn.addEventListener("click", function () {
      var text = section.getAttribute("data-listen-text");
      if (!text || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var utter = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utter);
    });
    head.appendChild(btn);
  }

  function wireSection(section) {
    wireListenButton(section);

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

    var landingSoonMsg =
      "Demo walkthrough video — recorded via cloud agent, landing here soon.";

    function showPlaceholder(msg) {
      if (placeholderEl) {
        placeholderEl.textContent = msg;
        placeholderEl.hidden = false;
      }
      if (videoEl) videoEl.hidden = true;
    }

    function revealVideo() {
      if (placeholderEl) placeholderEl.hidden = true;
      if (videoEl) videoEl.hidden = false;
    }

    if (videoEl && videoSrc) {
      var fullVideo =
        videoSrc.indexOf("http") === 0 ? videoSrc : origin + videoSrc;
      var demoTitle =
        section.getAttribute("data-demo-title") || "Demo walkthrough";

      showPlaceholder("Checking walkthrough video…");
      videoEl.addEventListener("error", function () {
        showPlaceholder(landingSoonMsg);
      });
      videoEl.addEventListener("loadeddata", revealVideo);

      fetch(fullVideo, { method: "HEAD", credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) {
            showPlaceholder(landingSoonMsg);
            return;
          }
          showPlaceholder("Loading walkthrough…");
          videoEl.preload = "auto";
          videoEl.title = demoTitle;
          videoEl.src = fullVideo;
          videoEl.load();
        })
        .catch(function () {
          showPlaceholder(landingSoonMsg);
        });
    } else if (placeholderEl) {
      showPlaceholder(landingSoonMsg);
    }

    if (!statusEl) return;

    var staticStatus = section.getAttribute("data-demo-status-text");
    if (!healthPath) {
      if (staticStatus) statusEl.textContent = staticStatus;
      return;
    }

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
