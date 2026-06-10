/** Websites page — local site only; no template playground iframe wiring. */
(function () {
  const iframe = document.getElementById("template-playground-iframe");
  if (iframe) iframe.removeAttribute("src");
})();
