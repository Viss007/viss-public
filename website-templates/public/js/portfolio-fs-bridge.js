/** Portfolio iframe fullscreen exit — parent posts enter/exit; child shows #portfolio-exit-fs */
(function () {
  var exitBtn = document.getElementById("portfolio-exit-fs");
  if (!exitBtn) return;

  function setExitVisible(show) {
    exitBtn.hidden = !show;
  }

  if (new URLSearchParams(window.location.search).get("portfolio_fs") === "1") {
    setExitVisible(true);
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || typeof data !== "object" || data.type !== "vissai-portfolio-fs") return;
    if (data.action === "enter") setExitVisible(true);
    if (data.action === "exit") setExitVisible(false);
  });

  exitBtn.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { type: "vissai-portfolio-fs", action: "exit-request" },
        window.location.origin
      );
    }
  });
})();
