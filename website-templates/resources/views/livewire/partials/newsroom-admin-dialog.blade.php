{{-- Outside #template-preview-root so position:fixed / modal aren’t clipped by Livewire transition stacking. --}}
@isset($newsCrudEmbed['admin_url'])
    <div wire:ignore>
        <dialog
            id="newsroom-admin-dialog"
            data-newsroom-admin-url="{{ $newsCrudEmbed['admin_url'] }}"
            class="max-h-[92vh] w-[min(100vw-1.5rem,56rem)] max-w-none rounded-2xl border border-stone-300 bg-[#faf8f5] p-0 text-stone-900 shadow-2xl [&::backdrop]:bg-stone-900/50"
        >
            <div class="flex items-center justify-between gap-3 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-5">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-amber-900">Demo backend</p>
                    <p class="text-sm text-stone-600">Posts CRUD (same credentials as playground demo).</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <a
                        href="{{ $newsCrudEmbed['admin_url'] }}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
                    >
                        Open tab
                    </a>
                    <button
                        type="button"
                        id="newsroom-admin-close"
                        class="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
                    >
                        Close
                    </button>
                </div>
            </div>

            <div id="newsroom-admin-login" class="space-y-4 px-5 py-6 sm:px-8">
                <p class="text-sm text-stone-600">Sign in to load the live Laravel news panel in-frame.</p>
                <label class="block text-xs font-medium text-stone-700">Username</label>
                <input
                    type="text"
                    id="newsroom-admin-user"
                    value="admin"
                    autocomplete="username"
                    class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
                <label class="block text-xs font-medium text-stone-700">Password</label>
                <input
                    type="password"
                    id="newsroom-admin-pass"
                    value="demo"
                    autocomplete="current-password"
                    class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
                <p id="newsroom-admin-err" class="hidden text-xs font-medium text-red-700"></p>
                <div class="flex flex-wrap gap-2 pt-1">
                    <button
                        type="button"
                        id="newsroom-admin-submit"
                        class="rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
                    >
                        Sign in &amp; load panel
                    </button>
                    <button
                        type="button"
                        id="newsroom-admin-cancel"
                        class="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            <div id="newsroom-admin-panel" class="hidden h-[min(70vh,640px)] w-full flex-col">
                <div class="flex items-center justify-between gap-2 border-t border-stone-200 bg-stone-100/80 px-4 py-2">
                    <p class="text-xs text-stone-600">Signed in (demo). This iframe talks to the separate Laravel demo origin.</p>
                    <button
                        type="button"
                        id="newsroom-admin-signout"
                        class="rounded-lg border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-800 transition hover:bg-white"
                    >
                        Sign out
                    </button>
                </div>
                <iframe
                    id="newsroom-admin-iframe"
                    title="News CRUD admin"
                    class="min-h-0 w-full flex-1 border-0 bg-white"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                    loading="lazy"
                ></iframe>
            </div>
        </dialog>
    </div>
@endisset
