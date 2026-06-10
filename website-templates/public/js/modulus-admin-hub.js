(function () {
  function bindAdminHub() {
    var root = document.querySelector('[data-modulus-admin-hub]');
    if (!root || root.dataset.vissaiAdminHubBound === '1') return;
    root.dataset.vissaiAdminHubBound = '1';
    var agentUrl = root.getAttribute('data-agent-url') || '';
(function () {
            var aside = document.getElementById('mod-admin-sidebar');
            var toggle = document.getElementById('mod-admin-sidebar-toggle');
            if (!aside || !toggle) return;
            var KEY = 'modulus-admin-sidebar-collapsed';
            function setCollapsed(collapsed) {
                aside.classList.toggle('mod-admin-sidebar--collapsed', collapsed);
                toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
                toggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
                try {
                    localStorage.setItem(KEY, collapsed ? '1' : '0');
                } catch (e) {}
            }
            var initial = false;
            try {
                initial = localStorage.getItem(KEY) === '1';
            } catch (e) {}
            setCollapsed(initial);
            toggle.addEventListener('click', function () {
                setCollapsed(!aside.classList.contains('mod-admin-sidebar--collapsed'));
            });
        })();

        (function () {
            var overview = document.getElementById('mod-admin-overview-link');
            var connectionsBtn = document.getElementById('mod-admin-connections-link');
            var agentBtn = document.getElementById('mod-admin-ai-chat-toggle');
            var adminMain = document.getElementById('mod-admin-main');
            var dash = document.getElementById('mod-admin-dashboard-view');
            var connectionsView = document.getElementById('mod-admin-connections-view');
            var agentView = document.getElementById('mod-admin-agent-view');
            var agentHost = document.getElementById('mod-admin-agent-host');
            if (!overview || !connectionsBtn || !agentBtn || !adminMain || !dash || !connectionsView || !agentView || !agentHost) return;

            var agentLoaded = false;

            function executeEmbeddedScripts(root) {
                var scripts = root.querySelectorAll('script');
                scripts.forEach(function (oldScript) {
                    var s = document.createElement('script');
                    Array.prototype.forEach.call(oldScript.attributes, function (attr) {
                        s.setAttribute(attr.name, attr.value);
                    });
                    s.text = oldScript.text || oldScript.textContent || '';
                    oldScript.parentNode.replaceChild(s, oldScript);
                });
            }

            async function loadAgentInPanel() {
                if (agentLoaded) return;
                agentHost.innerHTML = '<div class="flex h-full min-h-[16rem] items-center justify-center text-xs text-zinc-500">Loading agent chat…</div>';
                try {
                    var response = await fetch(agentUrl, {
                        credentials: 'same-origin',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    });
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    var html = await response.text();
                    var doc = new DOMParser().parseFromString(html, 'text/html');
                    var appRoot = doc.getElementById('appRoot');
                    if (!appRoot) throw new Error('Missing app root');

                    agentHost.innerHTML = '';
                    doc.querySelectorAll('style').forEach(function (styleNode) {
                        agentHost.appendChild(styleNode.cloneNode(true));
                    });
                    agentHost.appendChild(appRoot.cloneNode(true));

                    doc.querySelectorAll('script').forEach(function (scriptNode) {
                        agentHost.appendChild(scriptNode.cloneNode(true));
                    });
                    executeEmbeddedScripts(agentHost);
                    agentLoaded = true;
                } catch (error) {
                    agentHost.innerHTML =
                        '<div class="flex h-full min-h-[16rem] flex-col items-center justify-center gap-3 p-4 text-center">' +
                        '<p class="text-sm text-rose-300">Could not load in-panel agent chat.</p>' +
                        '<a class="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-white" href="' +
                        agentUrl +
                        '" target="_blank" rel="noopener noreferrer">Open full page</a>' +
                        '</div>';
                }
            }

            function syncUrl(which) {
                try {
                    var u = new URL(window.location.href);
                    if (u.hash === '#agent') {
                        u.hash = '';
                    }
                    if (which === 'agent') {
                        u.searchParams.set('view', 'agent');
                    } else if (which === 'connections') {
                        u.searchParams.set('view', 'connections');
                    } else {
                        u.searchParams.delete('view');
                    }
                    history.replaceState(null, '', u.pathname + u.search + u.hash);
                } catch (e) {}
            }

            function setView(which) {
                var isOverview = which === 'overview';
                var isConnections = which === 'connections';
                var isAgent = which === 'agent';
                dash.classList.toggle('hidden', !isOverview);
                connectionsView.classList.toggle('hidden', !isConnections);
                agentView.classList.toggle('hidden', !isAgent);
                dash.hidden = !isOverview;
                connectionsView.hidden = !isConnections;
                agentView.hidden = !isAgent;
                adminMain.classList.toggle('mod-admin-main--agent', isAgent);
                document.body.classList.toggle('mod-admin-agent-open', isAgent);
                overview.setAttribute('aria-current', isOverview ? 'page' : 'false');
                connectionsBtn.setAttribute('aria-current', isConnections ? 'page' : 'false');
                agentBtn.setAttribute('aria-current', isAgent ? 'page' : 'false');
                if (isAgent) {
                    void loadAgentInPanel();
                }
                syncUrl(which);
            }

            overview.addEventListener('click', function () {
                setView('overview');
            });
            connectionsBtn.addEventListener('click', function () {
                setView('connections');
            });
            agentBtn.addEventListener('click', function () {
                setView('agent');
            });

            try {
                var params = new URLSearchParams(window.location.search);
                var v = params.get('view');
                if (v === 'agent' || window.location.hash === '#agent') {
                    setView('agent');
                } else if (v === 'connections') {
                    setView('connections');
                } else {
                    setView('overview');
                }
            } catch (e) {
                setView('overview');
            }

            var connRoot = document.getElementById('mod-admin-connections-view');
            var expandAllBtn = document.getElementById('mod-admin-conn-expand-all');
            var collapseAllBtn = document.getElementById('mod-admin-conn-collapse-all');
            if (connRoot && expandAllBtn && collapseAllBtn) {
                expandAllBtn.addEventListener('click', function () {
                    connRoot.querySelectorAll('details.mod-admin-conn-details').forEach(function (d) {
                        d.open = true;
                    });
                });
                collapseAllBtn.addEventListener('click', function () {
                    connRoot.querySelectorAll('details.mod-admin-conn-details').forEach(function (d) {
                        d.open = false;
                    });
                });
            }
        })();
  }
  window.vissaiModulusAdminHubBoot = bindAdminHub;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAdminHub, { once: true });
  } else {
    bindAdminHub();
  }
})();
