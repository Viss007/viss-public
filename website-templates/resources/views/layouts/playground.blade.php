<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-smooth">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Template Playground' }} — {{ config('app.name') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    {{-- Wordmark paint must survive stale public/build (see app.css same selector); artisan-only flows skip vite build --}}
    <style id="vissai-playground-shell-brand-pin">
        #vissai-portfolio-shell-header .vissai-shell-brand-ai{color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;display:inline-block;font-weight:600;letter-spacing:-0.025em;line-height:1.25;vertical-align:baseline}
    </style>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <link rel="stylesheet" href="{{ asset('css/hub-footer.css') }}">
    @livewireStyles
</head>
<body class="flex min-h-screen min-h-[100dvh] flex-col bg-ink text-zinc-100 antialiased selection:bg-red-500/30 selection:text-red-50">
    <div class="flex min-h-0 flex-1 flex-col">
        {{ $slot }}
    </div>
    @include('layouts.partials.template-admin')
    {{-- Modulus boot must live outside morphed template HTML — inline/morphed <script src> does not execute. --}}
    <script src="{{ asset('js/modulus-admin-hub.js') }}?v=1"></script>
    <script src="{{ asset('js/modulus-playground-boot.js') }}?v=5"></script>
    <script src="{{ asset('js/hub-footer-collapse.js') }}" defer></script>
    @livewireScripts
    {{-- Visibility must not depend only on Vite bundle (stale public/build); Livewire morph + MutationObserver. --}}
    <script>
        (function () {
            var ROOT_ID = 'template-preview-root';
            var ADMIN_ID = 'template-admin-ui';
            var ADMIN_STORAGE_KEY = @json(\App\Livewire\TemplatePlayground::ADMIN_STORAGE_KEY);
            var pollId = null;
            var pollUntil = 0;

            /** Newsroom admin: open button is outside wire:ignore + Livewire skips inline scripts on morph — delegate once from layout. */
            function newsroomAdminEls() {
                return {
                    dlg: document.getElementById('newsroom-admin-dialog'),
                    loginEl: document.getElementById('newsroom-admin-login'),
                    panelEl: document.getElementById('newsroom-admin-panel'),
                    iframe: document.getElementById('newsroom-admin-iframe'),
                    userEl: document.getElementById('newsroom-admin-user'),
                    passEl: document.getElementById('newsroom-admin-pass'),
                    errEl: document.getElementById('newsroom-admin-err'),
                };
            }

            function newsroomAdminResetPanel() {
                var e = newsroomAdminEls();
                if (!e.iframe || !e.panelEl || !e.loginEl) {
                    return;
                }
                e.iframe.removeAttribute('src');
                e.panelEl.classList.add('hidden');
                e.panelEl.classList.remove('flex');
                e.loginEl.classList.remove('hidden');
                if (e.errEl) {
                    e.errEl.textContent = '';
                    e.errEl.classList.add('hidden');
                }
            }

            function newsroomAdminOpenDlg() {
                var e = newsroomAdminEls();
                if (!e.dlg || typeof e.dlg.showModal !== 'function') {
                    return;
                }
                newsroomAdminResetPanel();
                e.dlg.showModal();
            }

            function newsroomAdminCloseDlg() {
                var e = newsroomAdminEls();
                newsroomAdminResetPanel();
                if (e.dlg && typeof e.dlg.close === 'function') {
                    e.dlg.close();
                }
            }

            function wireNewsroomAdminDelegationOnce() {
                if (window.__vissaiNewsroomAdminDelegationBound) {
                    return;
                }
                window.__vissaiNewsroomAdminDelegationBound = true;
                document.addEventListener(
                    'click',
                    function (ev) {
                        var t = ev.target;
                        if (!t || typeof t.closest !== 'function') {
                            return;
                        }
                        if (t.closest('#newsroom-admin-open')) {
                            ev.preventDefault();
                            newsroomAdminOpenDlg();
                            return;
                        }
                        if (t.closest('#newsroom-admin-close') || t.closest('#newsroom-admin-cancel')) {
                            ev.preventDefault();
                            newsroomAdminCloseDlg();
                            return;
                        }
                        if (t.closest('#newsroom-admin-submit')) {
                            ev.preventDefault();
                            var el = newsroomAdminEls();
                            var url = el.dlg ? el.dlg.getAttribute('data-newsroom-admin-url') : '';
                            if (!el.loginEl || !el.panelEl || !el.iframe || !el.userEl || !el.passEl || !el.errEl || !url) {
                                return;
                            }
                            el.errEl.textContent = '';
                            el.errEl.classList.add('hidden');
                            var u = (el.userEl.value || '').trim();
                            var p = el.passEl.value || '';
                            if (u !== 'admin' || p !== 'demo') {
                                el.errEl.textContent = 'Invalid username or password.';
                                el.errEl.classList.remove('hidden');
                                return;
                            }
                            el.loginEl.classList.add('hidden');
                            el.panelEl.classList.remove('hidden');
                            el.panelEl.classList.add('flex');
                            el.iframe.src = url;
                            return;
                        }
                        if (t.closest('#newsroom-admin-signout')) {
                            ev.preventDefault();
                            newsroomAdminResetPanel();
                        }
                    },
                    false
                );
            }

            function syncNewsroomAdminDialogHooks() {
                var dlg = document.getElementById('newsroom-admin-dialog');
                if (!dlg || dlg.dataset.vissaiNewsroomDialogHooks === '1') {
                    return;
                }
                dlg.dataset.vissaiNewsroomDialogHooks = '1';
                dlg.addEventListener('cancel', function (e) {
                    e.preventDefault();
                    newsroomAdminCloseDlg();
                });
                dlg.addEventListener('close', function () {
                    newsroomAdminResetPanel();
                });
            }

            function syncAdminBarVisibility() {
                var root = document.getElementById(ROOT_ID);
                var admin = document.getElementById(ADMIN_ID);
                if (!admin) {
                    return;
                }
                var loggedIn = false;
                try {
                    loggedIn = sessionStorage.getItem(ADMIN_STORAGE_KEY) === '1';
                } catch (e) {}
                if (root && loggedIn) {
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

            function wireLivewireHooks() {
                if (window.__vissaiTemplateAdminMorphHooked) {
                    return;
                }
                if (typeof Livewire === 'undefined' || !Livewire.hook) {
                    return;
                }
                window.__vissaiTemplateAdminMorphHooked = true;
                Livewire.hook('morph.updated', function () {
                    requestAnimationFrame(function () {
                        syncAdminBarVisibility();
                        syncNewsroomAdminDialogHooks();
                    });
                });
            }

            function startAggressivePoll() {
                pollUntil = Date.now() + 8000;
                if (pollId !== null) {
                    return;
                }
                pollId = window.setInterval(function () {
                    syncAdminBarVisibility();
                    if (Date.now() > pollUntil) {
                        window.clearInterval(pollId);
                        pollId = null;
                    }
                }, 120);
            }

            function boot() {
                wireNewsroomAdminDelegationOnce();
                syncNewsroomAdminDialogHooks();
                syncAdminBarVisibility();
                wireLivewireHooks();
                try {
                    var mo = new MutationObserver(function () {
                        syncAdminBarVisibility();
                    });
                    mo.observe(document.documentElement, { childList: true, subtree: true });
                } catch (e) {}
                startAggressivePoll();
            }

            function bootModulusAfterMorph() {
                if (!document.querySelector('.tpl-modulus')) {
                    return;
                }
                if (typeof window.vissaiModulusPlaygroundBoot === 'function') {
                    window.vissaiModulusPlaygroundBoot();
                }
            }

            document.addEventListener('livewire:init', function () {
                wireNewsroomAdminDelegationOnce();
                wireLivewireHooks();
                Livewire.hook('morph.updated', function () {
                    requestAnimationFrame(bootModulusAfterMorph);
                });
                requestAnimationFrame(function () {
                    syncAdminBarVisibility();
                    syncNewsroomAdminDialogHooks();
                    bootModulusAfterMorph();
                });
            });

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', boot);
            } else {
                boot();
            }

            if (typeof Livewire !== 'undefined') {
                wireLivewireHooks();
            }
            requestAnimationFrame(function () {
                syncAdminBarVisibility();
                syncNewsroomAdminDialogHooks();
            });
        })();
    </script>
</body>
</html>
