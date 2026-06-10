<div class="min-h-screen bg-[#faf8f5] text-stone-900 antialiased">
    {{-- Top announcement --}}
    <div class="border-b border-stone-200/80 bg-amber-900 text-center text-xs font-medium text-amber-50">
        <div class="mx-auto max-w-6xl px-4 py-2">
            New long read: <span class="underline decoration-amber-300/80 underline-offset-2">The quiet cost of infinite dashboards</span> — out now.
        </div>
    </div>

    <header class="border-b border-stone-200 bg-[#faf8f5]/90 backdrop-blur-md">
        <div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
                <a href="#" class="font-serif text-2xl font-bold tracking-tight text-stone-900">The Ledger</a>
                <p class="mt-0.5 text-sm text-stone-600">Culture, craft, and code — for people who still read slowly.</p>
            </div>
            <div class="flex flex-wrap items-center gap-4">
                <nav class="flex flex-wrap gap-6 text-sm font-medium text-stone-700">
                    <a href="#" class="text-stone-900 underline decoration-amber-700 decoration-2 underline-offset-4">Latest</a>
                    <a href="#" class="transition hover:text-stone-900">Essays</a>
                    <a href="#" class="transition hover:text-stone-900">Interviews</a>
                    <a href="#" class="transition hover:text-stone-900">Newsletter</a>
                </nav>
                <button type="button" class="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm transition hover:bg-stone-50">
                    Subscribe
                </button>
            </div>
        </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {{-- Category filters --}}
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Browse</p>
            <div class="flex flex-wrap gap-2">
                @foreach (['All', 'Design', 'Engineering', 'Strategy', 'Culture'] as $cat)
                    <button
                        type="button"
                        class="@if ($cat === 'All') border-stone-900 bg-stone-900 text-white @else border-stone-200 bg-white text-stone-700 hover:border-stone-300 @endif rounded-full border px-4 py-1.5 text-sm font-medium shadow-sm transition"
                    >
                        {{ $cat }}
                    </button>
                @endforeach
            </div>
        </div>

        {{-- Featured --}}
        <article class="mt-10 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_2px_40px_-12px_rgba(0,0,0,0.12)]">
            <div class="grid lg:grid-cols-2">
                <div class="relative aspect-[16/11] min-h-[220px] bg-gradient-to-br from-amber-100 via-stone-200 to-stone-400 lg:aspect-auto lg:min-h-full">
                    <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23787169\' fill-opacity=\'0.08\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E')]"></div>
                    <span class="absolute left-6 top-6 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900 shadow-sm backdrop-blur">Featured</span>
                </div>
                <div class="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                    <p class="text-xs font-semibold uppercase tracking-widest text-amber-800">Essay · Design</p>
                    <h1 class="mt-4 font-serif text-3xl font-bold leading-tight tracking-tight text-stone-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                        What we lose when everything becomes a dashboard
                    </h1>
                    <p class="mt-5 text-lg leading-relaxed text-stone-600">
                        Editorial hierarchy is not decoration—it is how readers know what matters. On rhythm, restraint, and the return of the slow web.
                    </p>
                    <div class="mt-8 flex flex-wrap items-center gap-4 border-t border-stone-100 pt-8">
                        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-stone-300 text-sm font-bold text-stone-800">MC</div>
                        <div>
                            <p class="font-semibold text-stone-900">Mira Chen</p>
                            <p class="text-sm text-stone-500">{{ now()->format('M j, Y') }} · 8 min read</p>
                        </div>
                        <a href="#" class="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-amber-900 hover:underline">
                            Read story
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                        </a>
                    </div>
                </div>
            </div>
        </article>

        {{-- Grid --}}
        <div class="mt-16">
            <div class="flex items-end justify-between gap-4">
                <h2 class="font-serif text-2xl font-bold text-stone-900">Recent stories</h2>
                <a href="#" class="hidden text-sm font-semibold text-amber-900 hover:underline sm:inline">View archive</a>
            </div>
            <div class="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ([
                    ['Composable stacks without the chaos', 'Patterns for small teams shipping big surfaces—without a platform tax.', 'Build', 'from-rose-100 to-orange-100', '6'],
                    ['Review cycles that respect deep work', 'Fewer meetings, clearer artifacts. What we stole from newsrooms.', 'Process', 'from-sky-100 to-indigo-100', '9'],
                    ['Pricing pages that do not feel like a spreadsheet', 'When tables work—and when they betray trust.', 'Strategy', 'from-emerald-100 to-teal-100', '7'],
                    ['Letters from a former performance marketer', 'Confessions after a decade of CTR worship.', 'Culture', 'from-violet-100 to-purple-100', '11'],
                    ['The API is not your brand', 'Why developer-first companies still need editors.', 'Essay', 'from-amber-100 to-yellow-100', '8'],
                    ['What we learned shipping in public', 'Quarterly retros, warts and all.', 'Engineering', 'from-slate-200 to-stone-300', '5'],
                ] as [$title, $excerpt, $cat, $grad, $mins])
                    <article class="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div class="aspect-[16/10] bg-gradient-to-br {{ $grad }}"></div>
                        <div class="flex flex-1 flex-col p-6">
                            <p class="text-[11px] font-bold uppercase tracking-widest text-stone-500">{{ $cat }}</p>
                            <h3 class="mt-2 font-serif text-lg font-bold leading-snug text-stone-900 group-hover:text-amber-950">{{ $title }}</h3>
                            <p class="mt-3 flex-1 text-sm leading-relaxed text-stone-600">{{ $excerpt }}</p>
                            <div class="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-xs text-stone-500">
                                <span>{{ $mins }} min read</span>
                                <span class="font-medium text-amber-900 opacity-0 transition group-hover:opacity-100">Read →</span>
                            </div>
                        </div>
                    </article>
                @endforeach
            </div>
        </div>

        {{-- Newsletter band --}}
        <section class="mt-20 rounded-3xl border border-stone-200 bg-stone-900 px-6 py-12 text-center sm:px-12">
            <h2 class="font-serif text-2xl font-bold text-white sm:text-3xl">Saturday essays in your inbox</h2>
            <p class="mx-auto mt-3 max-w-lg text-sm text-stone-400">One thoughtful piece. No growth hacks. Unsubscribe anytime—we are not a funnel.</p>
            <form class="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" onsubmit="return false;">
                <input type="email" placeholder="you@domain.com" class="flex-1 rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 text-sm text-white placeholder-stone-500 focus:border-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-600/50" />
                <button type="button" class="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-stone-900 transition hover:bg-amber-400">
                    Join 24,000 readers
                </button>
            </form>
        </section>
    </main>

    <footer class="border-t border-stone-200 bg-stone-100">
        <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
                <div class="text-center sm:text-left">
                    <p class="font-serif text-lg font-bold text-stone-900">The Ledger</p>
                    <p class="mt-1 text-sm text-stone-600">Published in Vancouver · ISSN 0000-0000</p>
                </div>
                <div class="flex gap-6 text-sm text-stone-600">
                    <a href="#" class="hover:text-stone-900">About</a>
                    <a href="#" class="hover:text-stone-900">Mastodon</a>
                    <a href="#" class="hover:text-stone-900">RSS</a>
                </div>
            </div>
            <p class="mt-8 text-center text-xs text-stone-500">© {{ date('Y') }} The Ledger Media Ltd. All rights reserved.</p>
        </div>
    </footer>
</div>
