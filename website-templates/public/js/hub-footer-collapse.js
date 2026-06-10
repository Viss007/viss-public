(function () {
  function syncFooter(footer) {
    var btn = footer.querySelector(".vissai-hub-footer-toggle");
    if (!btn) return;
    var collapsed = footer.classList.contains("is-collapsed");
    btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    btn.setAttribute("aria-label", collapsed ? "Expand footer" : "Collapse footer");
  }

  function syncAll() {
    document.querySelectorAll("footer.vissai-hub-footer--collapsible").forEach(syncFooter);
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest(".vissai-hub-footer-toggle") : null;
    if (!btn) return;
    var footer = btn.closest("footer.vissai-hub-footer--collapsible");
    if (!footer) return;
    footer.classList.toggle("is-collapsed");
    syncFooter(footer);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncAll);
  } else {
    syncAll();
  }

  document.addEventListener("livewire:navigated", syncAll);
  document.addEventListener("livewire:init", function () {
    if (typeof Livewire === "undefined" || !Livewire.hook) return;
    Livewire.hook("morph.updated", function () {
      requestAnimationFrame(syncAll);
    });
  });
})();
