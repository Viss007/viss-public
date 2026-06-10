<div
    id="template-playground-wire-root"
    @class([
        'relative flex flex-col',
        'min-h-screen' => ! $activeTemplate,
        'min-h-0 flex-1' => $activeTemplate,
        'bg-ink' => ! $activeTemplate,
        'bg-transparent' => $activeTemplate,
    ])
    wire:key="playground-root"
>
    @unless ($activeTemplate)
        @include('layouts.partials.portfolio-shell-nav')
    @endunless
    @if ($activeTemplate)
        <div class="fixed bottom-4 right-4 z-[100] flex flex-wrap justify-end gap-2 sm:bottom-6 sm:right-8">
            @if ($activeTemplate === 'blog' && ! empty(($newsCrudEmbed ?? [])['admin_url'] ?? null))
                <button
                    type="button"
                    id="newsroom-admin-open"
                    class="inline-flex items-center gap-2 rounded-full border border-amber-300/90 bg-amber-50/95 px-5 py-2.5 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-900/10 backdrop-blur-sm transition hover:border-amber-400 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                    News admin
                </button>
            @endif
            <a
                href="{{ route('playground.home') }}"
                wire:navigate
                class="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-900/10 backdrop-blur-sm transition hover:border-indigo-200 hover:bg-white hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                RETURN
            </a>
        </div>

        <div
            id="template-preview-root"
            @class([
                'flex flex-1 flex-col',
                'min-h-screen overflow-y-auto' => $activeTemplate === 'modulus',
                'min-h-0' => $activeTemplate !== 'modulus',
            ])
            wire:key="preview-{{ $activeTemplate }}-{{ $modulusPage ?? 'home' }}-{{ $externalPreviewAdmin ? 'admin' : 'visitor' }}"
            @unless ($iframeSrc || $activeTemplate === 'modulus')
                wire:transition.opacity.duration.200ms
            @endunless
        >
            @if ($iframeSrc)
                @include('livewire.templates.external-frame', ['iframeSrc' => $iframeSrc])
            @else
                @include('livewire.templates.' . $activeTemplate)
            @endif
        </div>

        @if ($activeTemplate === 'blog' && ! empty(($newsCrudEmbed ?? [])['admin_url'] ?? null))
            @include('livewire.partials.newsroom-admin-dialog', ['newsCrudEmbed' => $newsCrudEmbed])
        @endif
    @else
        <div class="flex min-h-0 w-full flex-1 flex-col">
        <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pt-24">
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                <div
                    class="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-white/[0.04] to-transparent p-8 text-center shadow-none transition hover:border-red-500/25 hover:shadow-glow focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500/40"
                >
                    <a
                        href="{{ route('playground.template', 'corporate') }}"
                        wire:navigate
                        class="relative flex flex-1 cursor-pointer flex-col items-center text-center"
                    >
                        <div class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-zinc-100 shadow-inner ring-1 ring-white/10">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                            </svg>
                        </div>
                        <h2 class="relative mt-6 font-mono text-base font-medium uppercase tracking-[0.18em] text-red-500/90 md:text-lg">Corporate</h2>
                        <p class="relative mt-3 flex-1 text-sm font-semibold leading-relaxed tracking-tight text-white text-balance">
                            Professional business site built for trust and clarity.
                        </p>
                    </a>
                </div>

                <div
                    class="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-white/[0.04] to-transparent p-8 text-center shadow-none transition hover:border-red-500/25 hover:shadow-glow focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500/40"
                >
                    <a
                        href="{{ route('playground.template', 'product') }}"
                        wire:navigate
                        class="relative flex flex-1 cursor-pointer flex-col items-center text-center"
                    >
                        <div class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600/90 to-violet-700/90 text-white shadow-lg ring-1 ring-white/15">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>
                        </div>
                        <h2 class="relative mt-6 font-mono text-base font-medium uppercase tracking-[0.18em] text-red-500/90 md:text-lg">Product</h2>
                        <p class="relative mt-3 flex-1 text-sm font-semibold leading-relaxed tracking-tight text-white text-balance">
                            Strong landing for new products and feature launches.
                        </p>
                    </a>
                </div>

                <div
                    class="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-white/[0.04] to-transparent p-8 text-center shadow-none transition hover:border-red-500/25 hover:shadow-glow focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500/40"
                >
                    <a
                        href="{{ route('playground.template', 'blog') }}"
                        wire:navigate
                        class="relative flex flex-1 cursor-pointer flex-col items-center text-center"
                    >
                        <div class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/25">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v4.5H6v-4.5Z" /></svg>
                        </div>
                        <h2 class="relative mt-6 font-mono text-base font-medium uppercase tracking-[0.18em] text-red-500/90 md:text-lg">Newsroom</h2>
                        <p class="relative mt-3 flex-1 text-sm font-semibold leading-relaxed tracking-tight text-white text-balance">
                            Editorial layout plus demo CRUD admin (sign-in inside the preview).
                        </p>
                    </a>
                </div>

                <div
                    class="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-white/[0.04] to-transparent p-8 text-center shadow-none transition hover:border-red-500/25 hover:shadow-glow focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500/40"
                >
                    <a
                        href="{{ route('playground.template', 'saas') }}"
                        wire:navigate
                        class="relative flex flex-1 cursor-pointer flex-col items-center text-center"
                    >
                        <div class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-200 shadow-inner ring-1 ring-cyan-400/20">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
                        </div>
                        <h2 class="relative mt-6 font-mono text-base font-medium uppercase tracking-[0.18em] text-red-500/90 md:text-lg">SaaS</h2>
                        <p class="relative mt-3 flex-1 text-sm font-semibold leading-relaxed tracking-tight text-white text-balance">
                            Modern dashboard for software businesses.
                        </p>
                    </a>
                </div>

                <div
                    class="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-white/[0.04] to-transparent p-8 text-center shadow-none transition hover:border-red-500/25 hover:shadow-glow focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500/40"
                >
                    <a
                        href="{{ route('playground.template', 'dentists') }}"
                        wire:navigate
                        class="relative flex flex-1 cursor-pointer flex-col items-center text-center"
                    >
                        <div class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600/80 text-white shadow-lg ring-1 ring-white/15">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21c-4.5 0-8-3.5-8-8 0-4 3-7 7-7.5V5a5 5 0 0 1 10 0v.5c4 .5 7 3.5 7 7.5 0 4.5-3.5 8-8 8Zm0-3c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5Z" />
                            </svg>
                        </div>
                        <h2 class="relative mt-6 font-mono text-base font-medium uppercase tracking-[0.18em] text-red-500/90 md:text-lg">Dental practice</h2>
                        <p class="relative mt-3 flex-1 text-sm font-semibold leading-relaxed tracking-tight text-white text-balance">
                            Lithuanian marketing site starter — pages, services, gallery, pitch.
                        </p>
                    </a>
                </div>

                <div
                    class="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-white/[0.04] to-transparent p-8 text-center shadow-none transition hover:border-red-500/25 hover:shadow-glow focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500/40"
                >
                    <a
                        href="{{ route('playground.template', 'modulus') }}"
                        wire:navigate
                        class="relative flex flex-1 cursor-pointer flex-col items-center text-center"
                    >
                        <div class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700/90 text-white shadow-lg ring-1 ring-white/15">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                            </svg>
                        </div>
                        <h2 class="relative mt-6 font-mono text-base font-medium uppercase tracking-[0.18em] text-red-500/90 md:text-lg">Modulus</h2>
                        <p class="relative mt-3 flex-1 text-sm font-semibold leading-relaxed tracking-tight text-white text-balance">
                            Testing-ground Laravel site — booking flows and admin hub.
                        </p>
                    </a>
                </div>

                <div
                    class="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-white/[0.04] to-transparent p-8 text-center shadow-none transition hover:border-red-500/25 hover:shadow-glow focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500/40"
                >
                    <a
                        href="{{ route('playground.template', 'booking') }}"
                        wire:navigate
                        class="relative flex flex-1 cursor-pointer flex-col items-center text-center"
                    >
                        <div class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600/25 text-sky-100 shadow-inner ring-1 ring-sky-400/30">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-18 0h18M12 12.75h.008v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <h2 class="relative mt-6 font-mono text-base font-medium uppercase tracking-[0.18em] text-red-500/90 md:text-lg">Online booking</h2>
                        <p class="relative mt-3 flex-1 text-sm font-semibold leading-relaxed tracking-tight text-white text-balance">
                            Calendar-style booking demo — open full-screen in the playground preview.
                        </p>
                    </a>
                </div>

            </div>

            <div
                id="template-grid-admin-modal"
                wire:click.self="closeGridAdminModal"
                @class([
                    'fixed inset-0 z-[200] items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm',
                    'hidden' => ! $showGridAdminModal,
                    'flex' => $showGridAdminModal,
                ])
                role="dialog"
                aria-modal="true"
                aria-labelledby="template-grid-admin-title"
            >
                <form wire:submit.prevent="submitGridAdminLogin" class="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" wire:click.stop>
                    <h2 id="template-grid-admin-title" class="text-lg font-semibold text-slate-900">Admin sign-in</h2>
                    <p class="mt-1 text-sm text-slate-500">Demo credentials are prefilled. Sign in to open this template in edit mode.</p>
                    <label class="mt-4 block text-xs font-medium text-slate-700">Username</label>
                    <input
                        type="text"
                        id="template-grid-admin-user"
                        wire:model="gridAdminUser"
                        autocomplete="username"
                        class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <label class="mt-3 block text-xs font-medium text-slate-700">Password</label>
                    <input
                        type="password"
                        id="template-grid-admin-pass"
                        wire:model="gridAdminPass"
                        autocomplete="current-password"
                        class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    @if ($gridAdminError)
                        <p id="template-grid-admin-error" class="mt-2 text-xs text-rose-600">{{ $gridAdminError }}</p>
                    @else
                        <p id="template-grid-admin-error" class="mt-2 hidden text-xs text-rose-600"></p>
                    @endif
                    <div class="mt-5 flex gap-2">
                        <button
                            type="submit"
                            id="template-grid-admin-submit"
                            wire:loading.attr="disabled"
                            class="flex-1 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                        >
                            <span wire:loading.remove wire:target="submitGridAdminLogin">Sign in &amp; open</span>
                            <span wire:loading wire:target="submitGridAdminLogin">Signing in…</span>
                        </button>
                        <button
                            type="button"
                            id="template-grid-admin-cancel"
                            wire:click.prevent="closeGridAdminModal"
                            class="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <footer id="vissai-platform-footer-stripe" class="shrink-0 border-t border-line vissai-hub-footer--collapsible is-collapsed">
            <div class="vissai-hub-footer-shell mx-auto max-w-6xl px-5">
                <button type="button" class="vissai-hub-footer-toggle" aria-expanded="false" aria-controls="playground-footer-panel" aria-label="Expand footer">
                    <svg class="vissai-hub-footer-toggle-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div id="playground-footer-panel" class="vissai-hub-footer-panel flex flex-col items-center justify-center gap-2 pb-4 pt-6 text-center text-sm text-zinc-500">
                    <p class="font-mono text-xs vissai-platform-footer-line">© {{ now()->year }} VissAI</p>
                    <nav class="vissai-platform-footer-legal" aria-label="Legal">
                        <a href="/privacy.html">Privacy</a>
                        <span class="vissai-platform-footer-legal-sep" aria-hidden="true">·</span>
                        <a href="/terms.html">Terms</a>
                        <span class="vissai-platform-footer-legal-sep" aria-hidden="true">·</span>
                        <a href="/cookies.html">Cookies</a>
                    </nav>
                </div>
            </div>
        </footer>
        </div>
    @endif
</div>
