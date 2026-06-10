/** Portfolio demo blocks: video + collapsible live iframe + health + GitHub. */
(function () {
  var origin = window.location.origin || "http://127.0.0.1:3333";

  function wireLivePanel(section) {
    var iframeSrc = section.getAttribute("data-iframe-src");
    var toggle = section.querySelector("[data-demo-live-toggle]");
    var iframeWrap = section.querySelector("[data-demo-iframe-wrap]");
    var iframeEl = section.querySelector("[data-demo-iframe]");
    if (!toggle || !iframeWrap || !iframeEl || !iframeSrc) return;

    var demoId = section.getAttribute("data-demo-id") || section.getAttribute("data-demo-title") || "demo";
    var storageKey = "vissai-demo-live-collapsed:" + demoId;
    var iframeLoaded = false;

    function loadIframe() {
      if (iframeLoaded) return;
      var url = iframeSrc.indexOf("http") === 0 ? iframeSrc : origin + iframeSrc;
      iframeEl.src = url;
      iframeEl.title = section.getAttribute("data-demo-title") || "Live demo";
      iframeLoaded = true;
    }

    function setCollapsed(collapsed, persist) {
      section.classList.toggle("is-live-collapsed", collapsed);
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.setAttribute("aria-label", (collapsed ? "Expand" : "Collapse") + " live demo");
      if (!collapsed) loadIframe();
      if (persist !== false) {
        try {
          localStorage.setItem(storageKey, collapsed ? "1" : "0");
        } catch (e) {
          /* ignore */
        }
      }
    }

    toggle.addEventListener("click", function () {
      setCollapsed(toggle.getAttribute("aria-expanded") === "true");
    });

    var startCollapsed = false;
    try {
      startCollapsed = localStorage.getItem(storageKey) === "1";
    } catch (e) {
      /* ignore */
    }
    setCollapsed(startCollapsed, false);
    if (!startCollapsed) loadIframe();
  }

  function wireSection(section) {
    var videoSrc = section.getAttribute("data-video-src");
    var github = section.getAttribute("data-github");
    var healthPath = section.getAttribute("data-health");
    var videoEl = section.querySelector("[data-demo-video]");
    var placeholderEl = section.querySelector("[data-demo-video-placeholder]");
    var statusEl = section.querySelector("[data-demo-status]");
    var githubEl = section.querySelector("[data-demo-github]");

    wireLivePanel(section);

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
      var fullVideo = videoSrc.indexOf("http") === 0 ? videoSrc : origin + videoSrc;
      showPlaceholder("Demo walkthrough video — recorded via cloud agent, landing here soon.");
      videoEl.addEventListener("error", function () {
        showPlaceholder("Demo walkthrough video — recorded via cloud agent, landing here soon.");
      });
      videoEl.addEventListener("loadeddata", function () {
        if (placeholderEl) placeholderEl.hidden = true;
        videoEl.hidden = false;
      });
      videoEl.src = fullVideo;
      videoEl.load();
    } else if (placeholderEl) {
      showPlaceholder("Demo walkthrough video — recorded via cloud agent, landing here soon.");
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
          statusEl.textContent = "Live — expand the frame below to try it";
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
