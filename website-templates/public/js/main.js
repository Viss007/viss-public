(function () {
  const narrationEl = document.getElementById("narration");
  const storySection = document.getElementById("story");
  const storyToggle = document.getElementById("btn-story-toggle");
  const storyPanelBody = document.getElementById("story-panel-body");
  const section1El = document.getElementById("section1");
  const section1Toggle = document.getElementById("btn-section1-toggle");
  const section1PanelBody = document.getElementById("section1-panel-body");
  const sectionLiveWorkEl = document.getElementById("section-live-work");
  const sectionLiveWorkToggle = document.getElementById("btn-section-live-work-toggle");
  const sectionLiveWorkPanelBody = document.getElementById("section-live-work-panel-body");
  const section3El = document.getElementById("work-with-me");
  const section3Toggle = document.getElementById("btn-section3-toggle");
  const section3PanelBody = document.getElementById("section3-panel-body");
  const section1HeadingEl = document.getElementById("section1-heading");
  const sectionLiveWorkHeadingEl = document.getElementById("section-live-work-heading");
  const section1DemoNested = document.getElementById("section1-demo-nested");
  const section1DemoToggle = document.getElementById("btn-section1-demo-toggle");
  const section1DemoBody = document.getElementById("section1-demo-body");
  const section1InvoicesIframe = document.getElementById("section1-invoices-iframe");
  const section1InvoiceDemoAudio = document.getElementById("section1-invoice-demo-audio");
  const btnSection1InvoiceDemoAudio = document.getElementById("btn-section1-invoice-demo-audio");
  const section3HeadingEl = document.getElementById("section3-heading");
  const defaultTpl = document.getElementById("narration-default");

  const storageKey =
    (narrationEl && narrationEl.getAttribute("data-storage-key")) ||
    "vissai-portfolio-narration-html";

  const storyCollapsedKey = "vissai-portfolio-story-collapsed";
  const sectionLiveWorkCollapsedKey = "vissai-portfolio-section-live-work-collapsed";
  const section3CollapsedKey = "vissai-portfolio-section3-collapsed";
  const section1CollapsedKey = "vissai-portfolio-section1-collapsed";
  const section1DemoCollapsedKey = "vissai-portfolio-section1-demo-collapsed";
  const defaultSection1Heading = "What I Build";
  const defaultSectionLiveWorkHeading = "Live Work";
  const defaultSection3Heading = "Work with me";

  function calendarSectionName(headingEl, fallback) {
    const t = headingEl && headingEl.innerText.replace(/\s+/g, " ").trim();
    return t || fallback;
  }

  function refreshSectionToggleLabel(toggleEl, headingEl, defaultName) {
    if (!toggleEl || !headingEl) return;
    const collapsed = toggleEl.getAttribute("aria-expanded") === "false";
    const verb = collapsed ? "Expand" : "Collapse";
    const name = calendarSectionName(headingEl, defaultName);
    toggleEl.setAttribute("aria-label", `${verb} ${name} section`);
    toggleEl.title = `${verb} ${name} section`;
  }

  function setSection1Collapsed(collapsed) {
    if (!section1El || !section1Toggle || !section1PanelBody) return;
    section1Toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    const verb = collapsed ? "Expand" : "Collapse";
    const name = calendarSectionName(section1HeadingEl, defaultSection1Heading);
    section1Toggle.setAttribute("aria-label", `${verb} ${name} section`);
    section1Toggle.title = `${verb} ${name} section`;
    if (collapsed) {
      section1El.classList.add("is-collapsed");
      section1PanelBody.hidden = true;
    } else {
      section1El.classList.remove("is-collapsed");
      section1PanelBody.hidden = false;
    }
    try {
      localStorage.setItem(section1CollapsedKey, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function loadSection1Collapsed() {
    if (!section1Toggle || !section1PanelBody) return;
    try {
      if (localStorage.getItem(section1CollapsedKey) === "1") {
        setSection1Collapsed(true);
      }
    } catch {
      /* ignore */
    }
  }

  section1Toggle?.addEventListener("click", function () {
    const expanded = section1Toggle.getAttribute("aria-expanded") === "true";
    setSection1Collapsed(expanded);
  });

  function setSectionLiveWorkCollapsed(collapsed) {
    if (!sectionLiveWorkEl || !sectionLiveWorkToggle || !sectionLiveWorkPanelBody) return;
    sectionLiveWorkToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    const verb = collapsed ? "Expand" : "Collapse";
    const name = calendarSectionName(sectionLiveWorkHeadingEl, defaultSectionLiveWorkHeading);
    sectionLiveWorkToggle.setAttribute("aria-label", `${verb} ${name} section`);
    sectionLiveWorkToggle.title = `${verb} ${name} section`;
    if (collapsed) {
      sectionLiveWorkEl.classList.add("is-collapsed");
      sectionLiveWorkPanelBody.hidden = true;
    } else {
      sectionLiveWorkEl.classList.remove("is-collapsed");
      sectionLiveWorkPanelBody.hidden = false;
    }
    try {
      localStorage.setItem(sectionLiveWorkCollapsedKey, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function loadSectionLiveWorkCollapsed() {
    if (!sectionLiveWorkToggle || !sectionLiveWorkPanelBody) return;
    try {
      if (localStorage.getItem(sectionLiveWorkCollapsedKey) === "1") {
        setSectionLiveWorkCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }

  sectionLiveWorkToggle?.addEventListener("click", function () {
    const expanded = sectionLiveWorkToggle.getAttribute("aria-expanded") === "true";
    setSectionLiveWorkCollapsed(expanded);
  });

  function setSection3Collapsed(collapsed) {
    if (!section3El || !section3Toggle || !section3PanelBody) return;
    section3Toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    const verb = collapsed ? "Expand" : "Collapse";
    const name = calendarSectionName(section3HeadingEl, defaultSection3Heading);
    section3Toggle.setAttribute("aria-label", `${verb} ${name} section`);
    section3Toggle.title = `${verb} ${name} section`;
    if (collapsed) {
      section3El.classList.add("is-collapsed");
      section3PanelBody.hidden = true;
    } else {
      section3El.classList.remove("is-collapsed");
      section3PanelBody.hidden = false;
    }
    try {
      localStorage.setItem(section3CollapsedKey, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function loadSection3Collapsed() {
    if (!section3Toggle || !section3PanelBody) return;
    try {
      if (localStorage.getItem(section3CollapsedKey) === "1") {
        setSection3Collapsed(true);
      }
    } catch {
      /* ignore */
    }
  }

  section3Toggle?.addEventListener("click", function () {
    const expanded = section3Toggle.getAttribute("aria-expanded") === "true";
    setSection3Collapsed(expanded);
  });

  function setStoryCollapsed(collapsed) {
    if (!storySection || !storyToggle || !storyPanelBody) return;
    storyToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    storyToggle.setAttribute("aria-label", collapsed ? "Expand opening section" : "Collapse opening section");
    storyToggle.title = collapsed ? "Expand opening section" : "Collapse opening section";
    if (collapsed) {
      storySection.classList.add("is-collapsed");
      storyPanelBody.hidden = true;
    } else {
      storySection.classList.remove("is-collapsed");
      storyPanelBody.hidden = false;
    }
    try {
      localStorage.setItem(storyCollapsedKey, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function loadStoryCollapsed() {
    if (!storyToggle || !storyPanelBody) return;
    try {
      if (localStorage.getItem(storyCollapsedKey) === "1") {
        setStoryCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }

  storyToggle?.addEventListener("click", function () {
    const expanded = storyToggle.getAttribute("aria-expanded") === "true";
    setStoryCollapsed(expanded);
  });

  loadStoryCollapsed();

  function defaultNarrationHTML() {
    if (!defaultTpl) return "";
    return defaultTpl.innerHTML.trim();
  }

  function applyDefaultNarration() {
    if (!narrationEl) return;
    narrationEl.innerHTML = defaultNarrationHTML();
  }

  function loadNarration() {
    if (!narrationEl) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && saved.trim()) {
        narrationEl.innerHTML = saved;
        return;
      }
    } catch {
      /* ignore */
    }
    applyDefaultNarration();
  }

  let saveTimer;
  function scheduleSave() {
    if (!narrationEl) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(storageKey, narrationEl.innerHTML);
      } catch {
        /* quota / private mode */
      }
    }, 250);
  }

  if (narrationEl) {
    loadNarration();
    narrationEl.addEventListener("input", scheduleSave);
    narrationEl.addEventListener("blur", scheduleSave);
  }

  function wireEditableHtml(el, templateId, storageKeyInner) {
    if (!el) return;
    const tpl = document.getElementById(templateId);
    function defaultHtml() {
      return tpl ? tpl.innerHTML.trim() : "";
    }
    try {
      const saved = localStorage.getItem(storageKeyInner);
      if (saved != null && saved.trim()) {
        el.innerHTML = saved;
      } else {
        el.innerHTML = defaultHtml();
      }
    } catch {
      el.innerHTML = defaultHtml();
    }
    let ledeTimer;
    function scheduleLedeSave() {
      clearTimeout(ledeTimer);
      ledeTimer = setTimeout(function () {
        try {
          localStorage.setItem(storageKeyInner, el.innerHTML);
        } catch {
          /* quota / private mode */
        }
      }, 250);
    }
    el.addEventListener("input", scheduleLedeSave);
    el.addEventListener("blur", scheduleLedeSave);
  }

  wireEditableHtml(
    document.getElementById("section3-lede"),
    "section3-lede-default",
    "vissai-portfolio-section3-lede-html-v4"
  );

  refreshSectionToggleLabel(section1Toggle, section1HeadingEl, defaultSection1Heading);
  refreshSectionToggleLabel(
    sectionLiveWorkToggle,
    sectionLiveWorkHeadingEl,
    defaultSectionLiveWorkHeading
  );
  refreshSectionToggleLabel(section3Toggle, section3HeadingEl, defaultSection3Heading);

  function invoiceDemoUrl() {
    try {
      const w = typeof window !== "undefined" && window.__VISSAI_INVOICE_DEMO_URL__;
      if (typeof w === "string" && w.trim()) return w.trim().replace(/\/?$/, "/");
    } catch {
      /* ignore */
    }
    const meta = document.querySelector('meta[name="vissai-invoice-demo-url"]');
    const c = meta && meta.getAttribute("content");
    if (c && c.trim()) return c.trim().replace(/\/?$/, "/");
    return "";
  }

  /** Optional platform base (no trailing slash). Empty when not wired. */
  function vissaiPlatformBase() {
    try {
      const w = typeof window !== "undefined" && window.__VISSAI_PLATFORM_URL__;
      if (typeof w === "string" && w.trim()) return w.trim().replace(/\/$/, "");
    } catch {
      /* ignore */
    }
    const meta = document.querySelector('meta[name="vissai-platform-url"]');
    const c = meta && meta.getAttribute("content");
    if (c && c.trim()) return c.trim().replace(/\/$/, "");
    return "";
  }
  if (typeof window !== "undefined") {
    window.vissaiPlatformBase = vissaiPlatformBase;
  }

  let section1InvoiceIframeSrcSet = false;
  function ensureInvoiceIframeSrc() {
    if (!section1InvoicesIframe || section1InvoiceIframeSrcSet) return;
    const url = invoiceDemoUrl();
    if (!url) return;
    section1InvoicesIframe.src = url;
    section1InvoiceIframeSrcSet = true;
  }

  function refreshSection1DemoToggleLabel(collapsed) {
    if (!section1DemoToggle) return;
    const verb = collapsed ? "Expand" : "Collapse";
    const label = `${verb} Invoice to Excel Converter demo`;
    section1DemoToggle.setAttribute("aria-label", label);
    section1DemoToggle.title = label;
  }

  function setSection1DemoCollapsed(collapsed) {
    if (!section1DemoNested || !section1DemoToggle || !section1DemoBody) return;
    section1DemoToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    refreshSection1DemoToggleLabel(collapsed);
    if (collapsed) {
      section1DemoNested.classList.add("is-collapsed");
      section1DemoBody.hidden = true;
    } else {
      section1DemoNested.classList.remove("is-collapsed");
      section1DemoBody.hidden = false;
      ensureInvoiceIframeSrc();
    }
    try {
      localStorage.setItem(section1DemoCollapsedKey, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function loadSection1DemoCollapsed() {
    if (!section1DemoToggle || !section1DemoBody) return;
    try {
      if (localStorage.getItem(section1DemoCollapsedKey) === "0") {
        setSection1DemoCollapsed(false);
      } else {
        setSection1DemoCollapsed(true);
      }
    } catch {
      setSection1DemoCollapsed(true);
    }
  }

  section1DemoToggle?.addEventListener("click", function () {
    const expanded = section1DemoToggle.getAttribute("aria-expanded") === "true";
    setSection1DemoCollapsed(expanded);
  });

  loadSection1Collapsed();
  loadSectionLiveWorkCollapsed();
  loadSection3Collapsed();
  loadSection1DemoCollapsed();

  function setInvoiceDemoMp3Playing(playing) {
    const btn = btnSection1InvoiceDemoAudio;
    if (!btn) return;
    btn.classList.toggle("is-playing", playing);
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      playing ? "Stop invoice demo narration" : "Play invoice demo narration"
    );
    btn.title = playing ? "Stop narration" : "Play narration (MP3)";
  }

  function stopInvoiceDemoMp3() {
    if (!section1InvoiceDemoAudio) return;
    if (!section1InvoiceDemoAudio.paused) {
      section1InvoiceDemoAudio.pause();
    }
    section1InvoiceDemoAudio.currentTime = 0;
    setInvoiceDemoMp3Playing(false);
  }

  function wireInvoiceDemoMp3() {
    const audio = section1InvoiceDemoAudio;
    const btn = btnSection1InvoiceDemoAudio;
    if (!audio || !btn) return;

    btn.addEventListener("click", function () {
      if (audio.paused) {
        const p = audio.play();
        if (p && typeof p.catch === "function") {
          p.catch(function () {
            setInvoiceDemoMp3Playing(false);
          });
        }
      } else {
        stopInvoiceDemoMp3();
      }
    });

    audio.addEventListener("play", function () {
      setInvoiceDemoMp3Playing(true);
    });
    audio.addEventListener("ended", function () {
      audio.currentTime = 0;
      setInvoiceDemoMp3Playing(false);
    });
  }

  wireInvoiceDemoMp3();
})();
