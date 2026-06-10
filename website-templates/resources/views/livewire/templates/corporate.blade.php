<div id="corporate-template-root" class="min-h-screen scroll-smooth bg-white font-sans text-slate-900 antialiased">
    <header class="sticky top-0 z-50 overflow-visible bg-white">
        <div class="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-6">
            <div class="corporate-header-brand -ml-2 flex min-w-0 items-center gap-2.5 sm:gap-3">
                <details id="corporate-nav-menu" class="corporate-nav-menu relative shrink-0">
                    <summary
                        class="corporate-nav-trigger list-none flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200/90 bg-white text-corporate-accent shadow-sm transition duration-200 ease-out hover:-translate-y-px hover:border-corporate-accent/25 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-accent/35 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
                        aria-label="Open page navigation"
                    >
                        <svg class="corporate-nav-chevron h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </summary>
                    <div
                        class="corporate-nav-panel absolute left-0 top-full z-[60] mt-2 min-w-[14rem] max-w-[min(100vw-2rem,18rem)] origin-top overflow-hidden rounded-xl border border-slate-200/90 bg-white py-2 shadow-xl ring-1 ring-black/5"
                        role="navigation"
                        aria-label="Sections on this page"
                    >
                        <a href="#top" class="block px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-corporate-mist hover:text-corporate-ink">Home</a>
                        <a href="#services" class="block px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-corporate-mist hover:text-corporate-ink">Capabilities</a>
                        <a href="#about" class="block px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-corporate-mist hover:text-corporate-ink">About</a>
                        <a href="#insights" class="block px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-corporate-mist hover:text-corporate-ink">Insights</a>
                        <a href="#testimonials" class="block px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-corporate-mist hover:text-corporate-ink">Client voices</a>
                        <a href="#contact" class="block px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-corporate-mist hover:text-corporate-ink">Contact</a>
                    </div>
                </details>
                <a
                    href="#top"
                    class="corporate-brand-pill corporate-brand-name min-w-0 font-display text-[15px] font-medium leading-tight tracking-tight text-corporate-ink no-underline transition duration-200 ease-out hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-accent/30 focus-visible:ring-offset-2"
                    aria-label="Apex — home"
                >
                    Apex
                </a>
            </div>
            {{-- Log in: ~2x at sm+ enforced in app.css (#corporate-template-root .corporate-header-login) so key + SVG cannot disappear if Tailwind build is stale --}}
            <button
                type="button"
                class="corporate-header-login -mr-2 inline-flex shrink-0 items-center gap-2 text-slate-800 transition hover:text-corporate-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-accent/35 focus-visible:ring-offset-2"
                aria-label="Log in"
            >
                <span class="corporate-login-text hidden text-[13px] font-medium uppercase tracking-normal underline decoration-1 decoration-current underline-offset-2 sm:inline sm:tracking-tight sm:underline-offset-[0.2em]">Log in</span>
                <span class="corporate-login-key flex h-9 w-9 shrink-0 items-center justify-center" aria-hidden="true">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                    </svg>
                </span>
            </button>
        </div>
    </header>

    {{-- Homepage fold: tall hero (vertical presence) + staggered gallery --}}
    <section id="top" class="corporate-hero-top flex flex-col border-b border-slate-200/80 bg-white pb-0">
        {{-- flex-1 fills space below header so the gallery row can sit on the bottom of the min-height fold --}}
        <div class="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col justify-center px-4 pt-12 text-center sm:px-6 sm:pt-16 lg:pt-20">
            <h1 class="mx-auto mt-0 flex max-w-4xl flex-col items-center gap-4 font-display text-[1.75rem] font-normal leading-[1.2] tracking-tight text-slate-900 sm:gap-5 md:gap-6 sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                <span class="block">We're Building Tomorrow</span>
                <span class="block font-sans text-2xl font-normal leading-none tracking-[0.08em] text-slate-600 sm:text-3xl md:text-[1.875rem] lg:text-[2.125rem]">&amp;</span>
                <span class="block">Unlocking the Potential</span>
            </h1>
        </div>

        <div class="corporate-hero-gallery-strip relative mx-auto mt-auto w-full max-w-[100rem] shrink-0 px-2 sm:px-4 lg:px-8">
            <div class="flex items-end justify-center gap-1 sm:gap-2 md:gap-3">
                <div class="hidden h-40 w-[11%] shrink-0 overflow-hidden rounded-sm bg-slate-200 sm:block md:h-48">
                    <img src="https://picsum.photos/seed/corp1/320/400" alt="" class="h-full w-full object-cover" width="320" height="400" loading="lazy" />
                </div>
                <div class="hidden h-44 w-[13%] shrink-0 overflow-hidden rounded-sm bg-slate-200 md:block lg:h-52">
                    <img src="https://picsum.photos/seed/corp2/360/440" alt="" class="h-full w-full object-cover" width="360" height="440" loading="lazy" />
                </div>
                <div class="relative h-72 w-full max-w-xl shrink-0 overflow-hidden rounded-sm bg-slate-200 sm:h-64 sm:w-[30%] sm:max-w-none md:h-80 lg:h-96 lg:w-[28%]">
                    <img src="https://picsum.photos/seed/corp3/600/800" alt="" class="h-full w-full object-cover" width="600" height="800" loading="lazy" />
                </div>
                <div class="hidden h-44 w-[13%] shrink-0 overflow-hidden rounded-sm bg-slate-200 md:block lg:h-52">
                    <img src="https://picsum.photos/seed/corp4/360/440" alt="" class="h-full w-full object-cover" width="360" height="440" loading="lazy" />
                </div>
                <div class="hidden h-40 w-[11%] shrink-0 overflow-hidden rounded-sm bg-slate-200 sm:block md:h-48">
                    <img src="https://picsum.photos/seed/corp5/320/400" alt="" class="h-full w-full object-cover" width="320" height="400" loading="lazy" />
                </div>
            </div>
        </div>
    </section>

    {{-- Services --}}
    <section id="services" class="border-b border-corporate-line bg-white py-24 sm:py-28">
        <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div class="mx-auto max-w-2xl text-center">
                <p class="text-sm font-semibold uppercase tracking-[0.2em] text-corporate-accent">Capabilities</p>
                <h2 class="mt-4 font-display text-3xl font-semibold tracking-tight text-corporate-ink sm:text-4xl">What we deliver, end to end</h2>
                <p class="mt-4 text-lg text-slate-600">Six practices—each led by partners who stay accountable through delivery, not handoffs.</p>
            </div>

            @php
                $services = [
                    [
                        'title' => 'Corporate strategy',
                        'body' => 'Portfolio choices, capital allocation, and governance design your investors and regulators can follow.',
                        'icon' => 'chart',
                    ],
                    [
                        'title' => 'Operating model',
                        'body' => 'Org design, shared services, and process architecture that match how work actually flows.',
                        'icon' => 'layers',
                    ],
                    [
                        'title' => 'Technology & data',
                        'body' => 'Roadmaps, vendor selection, and program management—without boiling the ocean.',
                        'icon' => 'cpu',
                    ],
                    [
                        'title' => 'Transformation delivery',
                        'body' => 'Embedded teams with clear milestones, RAID discipline, and executive-ready reporting.',
                        'icon' => 'rocket',
                    ],
                    [
                        'title' => 'Risk & resilience',
                        'body' => 'Controls modernization, third-party risk, and scenario planning your audit committee expects.',
                        'icon' => 'shield',
                    ],
                    [
                        'title' => 'People & change',
                        'body' => 'Leadership alignment, capability building, and adoption metrics that prove adoption—not attendance.',
                        'icon' => 'users',
                    ],
                ];
                $serviceIconTones = [
                    'border-corporate-line bg-corporate-mist text-corporate-accent',
                    'border-corporate-line bg-white text-corporate-accent',
                ];
            @endphp

            <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ($services as $svc)
                    <article class="group relative flex flex-col overflow-hidden border border-corporate-line bg-white p-8 transition hover:border-slate-300">
                        <div class="flex h-14 w-14 items-center justify-center border {{ $serviceIconTones[$loop->index % 2] }}">
                            @if ($svc['icon'] === 'chart')
                                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v7.875C7.5 21.496 6.996 22 6.375 22h-2.25A1.125 1.125 0 0 1 3 20.875v-7.875ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v17.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
                            @elseif ($svc['icon'] === 'layers')
                                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 9.75m4.179 2.25L12 14.25l5.571-3m0 0 4.179-2.25M12 14.25l-4.179 2.25M12 14.25V21m0 0 4.179-2.25M12 21l-4.179-2.25M12 21V14.25m0-6.75V9.75" /></svg>
                            @elseif ($svc['icon'] === 'cpu')
                                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V6.375a1.5 1.5 0 0 0-1.5-1.5H6.375a1.5 1.5 0 0 0-1.5 1.5v12.75a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
                            @elseif ($svc['icon'] === 'rocket')
                                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m7.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1-.06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>
                            @elseif ($svc['icon'] === 'shield')
                                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                            @else
                                <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                            @endif
                        </div>
                        <h3 class="mt-6 font-display text-xl font-semibold text-corporate-ink">{{ $svc['title'] }}</h3>
                        <p class="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{{ $svc['body'] }}</p>
                        <a href="#contact" class="mt-6 inline-flex items-center text-sm font-semibold text-corporate-accent transition group-hover:gap-2">
                            Discuss this practice
                            <svg class="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                        </a>
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    {{-- About --}}
    <section id="about" class="border-b border-corporate-line bg-corporate-mist py-24 sm:py-28">
        <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div class="grid items-center gap-16 lg:grid-cols-12">
                <div class="lg:col-span-6">
                    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">About Apex</p>
                    <h2 class="mt-4 font-display text-3xl font-semibold tracking-tight text-corporate-ink sm:text-4xl">Partners who stay past the kickoff deck</h2>
                    <p class="mt-6 text-lg leading-relaxed text-slate-600">
                        Apex was founded by former Big Four engagement leaders and operators who have carried P&amp;L responsibility. We do not rotate in junior teams after the signature—your named partner runs the work weekly.
                    </p>
                    <p class="mt-4 text-lg leading-relaxed text-slate-600">
                        That is why our clients invite us into sensitive programs: post-merger integration, core system replacement, and enterprise cost restructuring where credibility matters as much as methodology.
                    </p>
                    <ul class="mt-10 space-y-4">
                        @foreach ([
                            'Partner-led delivery: same leader from diagnostic through stabilization',
                            'Fixed-fee phases with exit criteria—no open-ended time and materials',
                            'Cross-functional pods: strategy, technology, and change in one rhythm',
                        ] as $bullet)
                            <li class="flex gap-3 text-slate-700">
                                <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-corporate-accent">
                                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75 9 17.25l10.5-10.5" /></svg>
                                </span>
                                <span class="text-[15px] leading-relaxed">{{ $bullet }}</span>
                            </li>
                        @endforeach
                    </ul>
                </div>
                <div class="lg:col-span-6">
                    <div class="relative">
                        <div class="relative aspect-[4/5] overflow-hidden border border-corporate-line bg-corporate-mist">
                            <div class="absolute inset-0 bg-[linear-gradient(160deg,rgba(10,95,92,0.04),transparent_45%)]"></div>
                            <div class="absolute inset-0 flex items-center justify-center p-10">
                                <blockquote class="text-center">
                                    <p class="font-display text-xl font-medium italic leading-snug text-corporate-ink sm:text-2xl">“We stopped reporting activity and started reporting decisions.”</p>
                                    <footer class="mt-6 text-sm font-semibold text-slate-600">— CFO, global diversified industrials</footer>
                                </blockquote>
                            </div>
                        </div>
                        <div class="mt-6 grid grid-cols-3 gap-4">
                            <div class="border border-corporate-line bg-white p-5 text-center">
                                <p class="font-display text-3xl font-medium text-corporate-ink">480+</p>
                                <p class="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">Professionals</p>
                            </div>
                            <div class="border border-corporate-line bg-white p-5 text-center">
                                <p class="font-display text-3xl font-medium text-corporate-ink">28</p>
                                <p class="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">Countries</p>
                            </div>
                            <div class="border border-corporate-line bg-white p-5 text-center">
                                <p class="font-display text-3xl font-medium text-corporate-ink">11 yr</p>
                                <p class="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">Avg. tenure</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {{-- Insights teaser --}}
    <section id="insights" class="border-b border-corporate-line bg-white py-20 sm:py-24">
        <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div>
                    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-corporate-accent">Insights</p>
                    <h2 class="mt-3 font-display text-3xl font-semibold text-corporate-ink sm:text-4xl">What we are writing about</h2>
                </div>
                <a href="#contact" class="inline-flex items-center text-sm font-semibold text-corporate-accent hover:text-teal-700">
                    View all articles
                    <svg class="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </a>
            </div>
            <div class="mt-12 grid gap-6 md:grid-cols-3">
                @foreach ([
                    ['Making transformation budgets board-proof', 'How to tie initiative spend to trailing KPIs your finance committee already tracks.', '8 min read'],
                    ['When to centralize IT—and when not to', 'A decision framework we use with CIOs before any vendor bake-off.', '6 min read'],
                    ['Change management that survives the first audit', 'Adoption metrics that stand up to internal audit sampling.', '5 min read'],
                ] as [$t, $d, $meta])
                    <article class="flex flex-col border border-corporate-line bg-corporate-mist/30 p-7 transition hover:border-slate-300 hover:bg-white">
                        <h3 class="font-display text-lg font-semibold text-corporate-ink">{{ $t }}</h3>
                        <p class="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{{ $d }}</p>
                        <p class="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">{{ $meta }}</p>
                    </article>
                @endforeach
            </div>
        </div>
    </section>

    {{-- Testimonials --}}
    <section id="testimonials" class="border-b border-corporate-line bg-corporate-mist py-24 sm:py-28">
        <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-corporate-accent">Client voices</p>
                    <h2 class="mt-4 font-display text-3xl font-semibold text-corporate-ink sm:text-4xl">Where the work shows up in the numbers</h2>
                    <p class="mt-3 max-w-xl text-slate-600">References available under NDA. Quotes reflect recent engagements across our key sectors.</p>
                </div>
                <div class="flex items-center gap-2">
                    @foreach (range(1, 5) as $i)
                        <svg class="h-6 w-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    @endforeach
                    <span class="ml-2 text-sm font-medium text-slate-600">4.9 on independent reviews</span>
                </div>
            </div>

            <div class="mt-14 grid gap-8 lg:grid-cols-3">
                @foreach ([
                    ['JW', 'James Whitford', 'Chief Financial Officer', 'Harrow Freight Systems', 'They replaced our three-year roadmap with a funded sequence we could explain to the rating agencies in one page.'],
                    ['EV', 'Dr. Elena Voss', 'Chief Operating Officer', 'Valebrook Medical Group', 'Our clinical directors adopted the workflow changes because Apex embedded with frontline staff—not slideware.'],
                    ['MR', 'Marcus Reid', 'Chief Technology Officer', 'Ashcroft Capital Partners', 'Engineering finally had delivery leads who spoke their language. That trust cut our integration risk sharply.'],
                ] as [$initials, $name, $role, $co, $quote])
                    <blockquote class="flex flex-col border border-corporate-line bg-white p-8">
                        <div class="flex items-center gap-4">
                            <span class="flex h-12 w-12 items-center justify-center border border-corporate-line bg-corporate-mist text-sm font-semibold text-corporate-ink">{{ $initials }}</span>
                            <div>
                                <p class="font-semibold text-corporate-ink">{{ $name }}</p>
                                <p class="text-sm text-slate-500">{{ $role }}</p>
                                <p class="text-xs font-medium text-slate-400">{{ $co }}</p>
                            </div>
                        </div>
                        <p class="mt-6 flex-1 text-[15px] leading-relaxed text-slate-700">“{{ $quote }}”</p>
                    </blockquote>
                @endforeach
            </div>
        </div>
    </section>

    {{-- CTA --}}
    <section id="contact" class="border-t border-corporate-line bg-corporate-mist py-24 sm:py-28">
        <div class="mx-auto max-w-3xl px-5 text-center sm:px-8 lg:px-10">
            <h2 class="font-display text-3xl font-medium tracking-tight text-corporate-ink sm:text-4xl">Tell us what “done” looks like on your scorecard</h2>
            <p class="mt-5 text-lg leading-relaxed text-slate-600">We will respond with a short agenda and the right partner—not a generic capabilities deck.</p>
            <div class="mt-12 flex flex-wrap justify-center gap-4">
                <a href="mailto:briefings@apexconsulting.com" class="inline-flex items-center justify-center bg-corporate-accent px-8 py-3.5 text-sm font-medium text-white transition hover:bg-corporate-accent-bright">
                    Email the briefings desk
                </a>
                <a href="tel:+442045892100" class="inline-flex items-center justify-center border border-corporate-line bg-white px-8 py-3.5 text-sm font-medium text-corporate-ink transition hover:border-slate-300">
                    Call +44 20 4589 2100
                </a>
            </div>
        </div>
    </section>

    <footer class="border-t border-corporate-line bg-white">
        <div class="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
            <div class="grid gap-12 lg:grid-cols-12">
                <div class="lg:col-span-4">
                    <div class="flex items-center gap-3">
                        <span class="flex h-10 w-10 items-center justify-center border border-corporate-line bg-white text-xs font-semibold text-corporate-accent">AC</span>
                        <span class="font-display text-lg font-medium text-corporate-ink">Apex Consulting</span>
                    </div>
                    <p class="mt-5 max-w-sm text-sm leading-relaxed text-slate-600">Independent advisory and delivery for enterprises that need outcomes on the income statement—not another transformation label.</p>
                    <div class="mt-6 flex gap-3">
                        <a href="#contact" class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-corporate-ink" aria-label="LinkedIn">
                            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.058-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        </a>
                        <a href="#contact" class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-corporate-ink" aria-label="X">
                            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-4">
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Firm</p>
                        <ul class="mt-4 space-y-3 text-sm text-slate-600">
                            <li><a href="#about" class="transition hover:text-corporate-ink">About us</a></li>
                            <li><a href="#contact" class="transition hover:text-corporate-ink">Leadership</a></li>
                            <li><a href="#contact" class="transition hover:text-corporate-ink">Careers</a></li>
                            <li><a href="#contact" class="transition hover:text-corporate-ink">Diversity &amp; inclusion</a></li>
                        </ul>
                    </div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Services</p>
                        <ul class="mt-4 space-y-3 text-sm text-slate-600">
                            <li><a href="#services" class="transition hover:text-corporate-ink">Capabilities</a></li>
                            <li><a href="#contact" class="transition hover:text-corporate-ink">Engage us</a></li>
                            <li><a href="#contact" class="transition hover:text-corporate-ink">Case studies</a></li>
                        </ul>
                    </div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Resources</p>
                        <ul class="mt-4 space-y-3 text-sm text-slate-600">
                            <li><a href="#insights" class="transition hover:text-corporate-ink">Insights</a></li>
                            <li><a href="#contact" class="transition hover:text-corporate-ink">Events &amp; webcasts</a></li>
                            <li><a href="#contact" class="transition hover:text-corporate-ink">Subscribe</a></li>
                        </ul>
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Legal</p>
                        <ul class="mt-4 space-y-3 text-sm text-slate-600">
                            <li><a href="#contact" class="transition hover:text-corporate-ink">Privacy notice</a></li>
                            <li><a href="#contact" class="transition hover:text-corporate-ink">Terms of use</a></li>
                            <li><a href="#contact" class="transition hover:text-corporate-ink">Cookie settings</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="mt-14 flex flex-col items-center justify-between gap-4 border-t border-corporate-line pt-8 sm:flex-row">
                <p class="text-center text-sm text-slate-500 sm:text-left">© {{ date('Y') }} Apex Consulting Group LLP. All rights reserved.</p>
                <p class="text-sm text-slate-400">Registered offices: United Kingdom · United States · Singapore</p>
            </div>
        </div>
    </footer>
    <script>
        (function () {
            var menu = document.getElementById('corporate-nav-menu');
            if (!menu) return;
            menu.querySelectorAll('a[href^="#"]').forEach(function (a) {
                a.addEventListener('click', function () {
                    menu.removeAttribute('open');
                });
            });
        })();
    </script>
</div>
