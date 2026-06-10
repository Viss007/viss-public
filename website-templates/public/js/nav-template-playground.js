(function () {
  /** Nav "Websites" stays on portfolio :3333; product loads in websites.html iframe. */
  function wireNavTemplatePlaygroundLinks() {
    document.querySelectorAll("[data-nav-template-playground]").forEach(function (el) {
      el.href = "/websites";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireNavTemplatePlaygroundLinks);
  } else {
    wireNavTemplatePlaygroundLinks();
  }
})();
