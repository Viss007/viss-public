/**
 * Template Playground: admin chrome lives outside Livewire morph (layout).
 * Login: Admin on the grid opens a modal; correct credentials set sessionStorage + Livewire select.
 * Template view: Logout only when logged in; no login form on the template chrome.
 */
(function () {
    const ROOT_ID = 'template-preview-root';
    /** Must match `TemplatePlayground::ADMIN_STORAGE_KEY` (PHP sessionStorage dispatch). */
    const ADMIN_STORAGE_KEY = 'vissai_website_templates_admin';
    const WIRE_ROOT_ID = 'template-playground-wire-root';
    const USER_EXPECT = 'admin';
    const PASS_EXPECT = 'demo';

    const EDIT_OUTLINE = ['outline', 'outline-2', 'outline-dashed', 'outline-amber-400/60', 'rounded-sm'];

    let morphHooked = false;
    let uiBound = false;
    let gridModalBound = false;
    let pendingTemplate = null;

    function getRoot() {
        return document.getElementById(ROOT_ID);
    }

    function getAdminUi() {
        return document.getElementById('template-admin-ui');
    }

    function isLoggedIn() {
        try {
            return sessionStorage.getItem(ADMIN_STORAGE_KEY) === '1';
        } catch {
            return false;
        }
    }

    function setLoggedIn(on) {
        try {
            if (on) {
                sessionStorage.setItem(ADMIN_STORAGE_KEY, '1');
            } else {
                sessionStorage.removeItem(ADMIN_STORAGE_KEY);
            }
        } catch {
            /* ignore */
        }
    }

    /** Show fixed admin bar only on template preview AND when logged in (Logout). */
    function syncAdminVisibility() {
        const admin = getAdminUi();
        const root = getRoot();
        if (!admin) {
            return;
        }
        if (root && isLoggedIn()) {
            admin.classList.remove('hidden');
            admin.style.setProperty('display', 'flex', 'important');
            admin.style.setProperty('visibility', 'visible', 'important');
            admin.style.setProperty('opacity', '1', 'important');
            admin.style.setProperty('pointer-events', 'auto', 'important');
            admin.style.setProperty('z-index', '2147483647', 'important');
            admin.style.setProperty('position', 'fixed', 'important');
            admin.style.setProperty('bottom', '1rem', 'important');
            admin.style.setProperty('left', '1rem', 'important');
        } else {
            admin.classList.add('hidden');
            admin.style.removeProperty('display');
            admin.style.removeProperty('visibility');
            admin.style.removeProperty('opacity');
            admin.style.removeProperty('pointer-events');
            admin.style.removeProperty('z-index');
            admin.style.removeProperty('position');
            admin.style.removeProperty('bottom');
            admin.style.removeProperty('left');
        }
    }

    function shouldSkipEl(el) {
        if (!el || el.nodeType !== 1) {
            return true;
        }
        if (el.closest('header') || el.closest('footer') || el.closest('nav') || el.closest('aside')) {
            return true;
        }
        if (el.closest('button') || el.closest('label') || el.closest('[data-admin-skip]')) {
            return true;
        }
        const tag = el.tagName;
        if (tag !== 'H1' && tag !== 'H2' && tag !== 'H3' && tag !== 'P') {
            return true;
        }
        return false;
    }

    function clearEditable() {
        const root = getRoot();
        if (!root) {
            return;
        }
        root.querySelectorAll('[data-admin-editable="1"]').forEach(function (el) {
            el.removeAttribute('contenteditable');
            el.removeAttribute('data-admin-editable');
            el.removeAttribute('spellcheck');
            EDIT_OUTLINE.forEach(function (c) {
                el.classList.remove(c);
            });
        });
    }

    function applyAdminMode() {
        clearEditable();
        if (!isLoggedIn()) {
            return;
        }
        const root = getRoot();
        if (!root) {
            return;
        }
        root.querySelectorAll('h1, h2, h3, p').forEach(function (el) {
            if (shouldSkipEl(el)) {
                return;
            }
            el.setAttribute('data-admin-editable', '1');
            el.setAttribute('contenteditable', 'true');
            el.setAttribute('spellcheck', 'true');
            EDIT_OUTLINE.forEach(function (c) {
                el.classList.add(c);
            });
        });
    }

    function syncChrome() {
        syncAdminVisibility();
        const logoutBtn = document.getElementById('template-admin-logout-btn');
        const loggedIn = isLoggedIn();
        if (logoutBtn) {
            logoutBtn.classList.toggle('hidden', !loggedIn || !getRoot());
        }
        if (loggedIn) {
            applyAdminMode();
        } else {
            clearEditable();
        }
    }

    function wireLivewire() {
        if (morphHooked || typeof Livewire === 'undefined' || !Livewire.hook) {
            return;
        }
        morphHooked = true;
        Livewire.hook('morph.updated', function () {
            syncChrome();
            if (isLoggedIn()) {
                requestAnimationFrame(function () {
                    applyAdminMode();
                });
            }
        });
    }

    function getGridModal() {
        return document.getElementById('template-grid-admin-modal');
    }

    function showGridError(msg) {
        const err = document.getElementById('template-grid-admin-error');
        if (!err) {
            return;
        }
        if (msg) {
            err.textContent = msg;
            err.classList.remove('hidden');
        } else {
            err.textContent = '';
            err.classList.add('hidden');
        }
    }

    function openGridAdminModal(templateKey) {
        pendingTemplate = templateKey;
        const modal = getGridModal();
        if (!modal) {
            return;
        }
        showGridError('');
        const user = document.getElementById('template-grid-admin-user');
        const pass = document.getElementById('template-grid-admin-pass');
        if (user) {
            user.value = USER_EXPECT;
        }
        if (pass) {
            pass.value = PASS_EXPECT;
        }
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        requestAnimationFrame(function () {
            if (user) {
                user.focus();
                user.select();
            }
        });
    }

    function closeGridAdminModal() {
        pendingTemplate = null;
        const modal = getGridModal();
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        showGridError('');
    }

    function findLivewireComponent() {
        const wireRoot = document.getElementById(WIRE_ROOT_ID);
        if (!wireRoot || typeof window.Livewire === 'undefined') {
            return null;
        }
        const wireId = wireRoot.getAttribute('wire:id');
        if (!wireId) {
            return null;
        }
        return window.Livewire.find(wireId);
    }

    function callLivewireSelect(templateKey) {
        const comp = findLivewireComponent();
        if (comp && typeof comp.call === 'function') {
            comp.call('select', templateKey);
        }
    }

    function closeGridAdminModalViaLivewire() {
        const comp = findLivewireComponent();
        if (comp && typeof comp.call === 'function') {
            comp.call('closeGridAdminModal');
        }
    }

    function bindGridAdminModal() {
        if (gridModalBound) {
            return;
        }
        gridModalBound = true;
        document.addEventListener('keydown', function (e) {
            const m = getGridModal();
            if (!m || m.classList.contains('hidden')) {
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                closeGridAdminModalViaLivewire();
            }
        });
    }

    function bindUi() {
        if (uiBound) {
            return;
        }
        uiBound = true;
        bindGridAdminModal();
        const logoutBtn = document.getElementById('template-admin-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                setLoggedIn(false);
                syncChrome();
            });
        }
    }

    window.__vissaiOpenGridAdminModal = openGridAdminModal;

    /** Called from Livewire resetToDefault() so server + sessionStorage stay aligned. */
    window.__vissaiTemplatePlaygroundClearAdmin = function () {
        setLoggedIn(false);
        syncChrome();
    };

    function boot() {
        bindUi();
        syncChrome();
        wireLivewire();
    }

    document.addEventListener('livewire:init', function () {
        wireLivewire();
        if (isLoggedIn()) {
            requestAnimationFrame(applyAdminMode);
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    if (typeof window.Livewire !== 'undefined') {
        wireLivewire();
    }
})();
