(function () {
  function readMeta(name, fallback) {
    const meta = document.querySelector(`meta[name="${name}"]`);
    const c = meta && meta.getAttribute("content");
    if (c && c.trim()) return c.trim().replace(/\/?$/, "/");
    return fallback;
  }

  function speedLeadDemoUrl() {
    try {
      const w = typeof window !== "undefined" && window.__VISSAI_SPEED_LEAD_DEMO_URL__;
      if (typeof w === "string" && w.trim()) return w.trim().replace(/\/?$/, "/");
    } catch {
      /* ignore */
    }
    return readMeta("vissai-speed-lead-demo-url", "");
  }

  /** live-projects.html — same UX as js/main.js invoice MP3; only one clip plays at a time. */
  const liveProjectsMp3Registry = [];

  function wireLiveProjectsDemoMp3(audioId, btnId, playAria, stopAria) {
    const audio = document.getElementById(audioId);
    const btn = document.getElementById(btnId);
    if (!audio || !btn) return;

    function setPlaying(playing) {
      btn.classList.toggle("is-playing", playing);
      btn.setAttribute("aria-pressed", playing ? "true" : "false");
      btn.setAttribute("aria-label", playing ? stopAria : playAria);
      btn.title = playing ? "Stop narration" : "Play narration (MP3)";
    }

    function stopThis() {
      if (!audio.paused) {
        audio.pause();
      }
      audio.currentTime = 0;
      setPlaying(false);
    }

    function stopOthers() {
      liveProjectsMp3Registry.forEach(function (inst) {
        if (inst.audio !== audio) {
          inst.stop();
        }
      });
    }

    liveProjectsMp3Registry.push({ audio: audio, stop: stopThis });

    btn.addEventListener("click", function () {
      if (audio.paused) {
        stopOthers();
        const p = audio.play();
        if (p && typeof p.catch === "function") {
          p.catch(function () {
            setPlaying(false);
          });
        }
      } else {
        stopThis();
      }
    });

    audio.addEventListener("play", function () {
      setPlaying(true);
    });
    audio.addEventListener("ended", function () {
      audio.currentTime = 0;
      setPlaying(false);
    });
  }

  /**
   * Collapse body, storage, lazy iframe on expand + viewport intersection (live-projects cards).
   */
  function wireEmbeddableDemo(opts) {
    const { cardId, toggleId, panelId, iframeId, storageKey, ariaName, url } = opts;
    const card = document.getElementById(cardId);
    const toggle = document.getElementById(toggleId);
    const panel = document.getElementById(panelId);
    const iframe = document.getElementById(iframeId);
    if (!card || !toggle || !panel || !iframe) return;

    let loaded = false;
    function loadIframe() {
      if (loaded) return;
      const src = url();
      if (!src) return;
      iframe.src = src;
      loaded = true;
    }

    function refreshLabel(collapsed) {
      const verb = collapsed ? "Expand" : "Collapse";
      const label = `${verb} ${ariaName} demo`;
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
    }

    function setCollapsed(collapsed) {
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      refreshLabel(collapsed);
      if (collapsed) {
        card.classList.add("is-collapsed");
        panel.hidden = true;
      } else {
        card.classList.remove("is-collapsed");
        panel.hidden = false;
        loadIframe();
      }
      try {
        localStorage.setItem(storageKey, collapsed ? "1" : "0");
      } catch {
        /* ignore */
      }
    }

    toggle.addEventListener("click", function () {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      setCollapsed(expanded);
    });

    try {
      if (localStorage.getItem(storageKey) === "1") {
        setCollapsed(true);
      } else {
        refreshLabel(false);
      }
    } catch {
      refreshLabel(false);
    }

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        function (entries) {
          for (const e of entries) {
            if (e.isIntersecting && !panel.hidden) {
              loadIframe();
              io.disconnect();
              break;
            }
          }
        },
        { rootMargin: "120px 0px", threshold: 0 }
      );
      io.observe(iframe);
    } else {
      loadIframe();
    }
  }

  wireLiveProjectsDemoMp3(
    "section1-invoice-demo-audio",
    "btn-section1-invoice-demo-audio",
    "Play invoice demo narration",
    "Stop invoice demo narration"
  );
  wireLiveProjectsDemoMp3(
    "speed-lead-demo-audio",
    "btn-speed-lead-demo-audio",
    "Play Speed to lead demo narration",
    "Stop Speed to lead demo narration"
  );

  wireEmbeddableDemo({
    cardId: "speed-lead-demo-card",
    toggleId: "btn-speed-lead-demo-panel-toggle",
    panelId: "speed-lead-demo-panel-body",
    iframeId: "speed-lead-demo-iframe",
    storageKey: "vissai-portfolio-live-projects-speed-lead-collapsed",
    ariaName: "Speed to lead",
    url: speedLeadDemoUrl,
  });
})();
