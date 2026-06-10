(function () {
  var proto = location.protocol === "https:" ? "wss:" : "ws:";
  var url = proto + "//" + location.host + "/__dev/ws";
  var ws = new WebSocket(url);
  ws.onopen = function () {
    console.log("[portfolio dev] live reload + terminal bridge: " + url);
  };
  ws.onmessage = function (e) {
    try {
      var m = JSON.parse(e.data);
      if (m.type === "reload") location.reload();
    } catch (_) { }
  };
  ws.onclose = function () {
    console.warn("[portfolio dev] WebSocket closed — reload the page after restarting the dev server");
  };
  window.__VISSAI_DEV_LOG = function (line, isErr) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "log", line: line, isErr: !!isErr }));
      } catch (_) { }
    }
  };
})();
