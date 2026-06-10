<div class="flex min-h-screen bg-zinc-950 text-zinc-100 antialiased">
    <aside class="hidden w-64 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-900/40 lg:flex">
        <div class="flex h-14 items-center gap-2 border-b border-zinc-800 px-4">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-lg shadow-cyan-500/20">P</span>
            <span class="text-sm font-bold tracking-tight text-white">Pulse<span class="text-cyan-400">Ops</span></span>
        </div>
        <nav class="flex-1 space-y-0.5 p-3">
            @php
                $nav = [
                    ['Overview', true, '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />'],
                    ['Projects', false, '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44 2.12-2.12a1.5 1.5 0 0 1 2.12 0L21.75 12M4.5 9.75v10.125a1.125 1.125 0 0 0 1.125 1.125h12.75a1.125 1.125 0 0 0 1.125-1.125V9.75" />'],
                    ['Customers', false, '<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />'],
                    ['Billing', false, '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v5.25M3.75 4.5h-.75a3 3 0 0 0-3 3h11.25m-11.25 0h11.25m-11.25 0v5.25m16.5-13.5v9.75m0 0a3 3 0 0 0-3 3h-9.75m9.75 0h-9.75m0 0a3 3 0 0 1-3-3V3.75m12 0v5.25m0 0V9.75m0 0h4.5m-4.5 0h4.5" />'],
                    ['Settings', false, '<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.281Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />'],
                ];
            @endphp
            @foreach ($nav as [$label, $active, $pathInner])
                <a
                    href="#"
                    class="{{ $active ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white' }} flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition"
                >
                    <span class="flex h-8 w-8 items-center justify-center rounded-md {{ $active ? 'bg-cyan-500/15 text-cyan-400' : 'bg-zinc-800/50 text-zinc-500' }}">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">{!! $pathInner !!}</svg>
                    </span>
                    {{ $label }}
                </a>
            @endforeach
        </nav>
        <div class="border-t border-zinc-800 p-3">
            <div class="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-3 py-2.5 ring-1 ring-white/5">
                <div class="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 ring-2 ring-zinc-700"></div>
                <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-semibold text-white">V. Mantas</p>
                    <p class="truncate text-[11px] text-zinc-500">Admin · Engineering</p>
                </div>
                <button type="button" class="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-white" aria-label="Account menu">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg>
                </button>
            </div>
        </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex h-14 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur sm:px-6">
            <div class="flex items-center gap-3 lg:hidden">
                <span class="text-sm font-bold text-white">PulseOps</span>
            </div>
            <div class="hidden min-w-0 flex-1 items-center gap-4 lg:flex">
                <nav class="flex items-center gap-1 text-xs text-zinc-500">
                    <span>Workspace</span>
                    <span class="text-zinc-600">/</span>
                    <span class="font-medium text-zinc-300">Production</span>
                    <span class="text-zinc-600">/</span>
                    <span class="text-white">Overview</span>
                </nav>
                <div class="relative max-w-md flex-1">
                    <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                    </span>
                    <input type="search" placeholder="Search projects, IDs, customers…" class="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40" />
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button type="button" class="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Notifications">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                    <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-zinc-950"></span>
                </button>
                <button type="button" class="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800">Export</button>
                <button type="button" class="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-cyan-400">New</button>
            </div>
        </header>

        <main class="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div class="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-white">Overview</h1>
                    <p class="mt-1 text-sm text-zinc-500">Last 30 days · <span class="text-emerald-400">Production</span> · Europe-West</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button type="button" class="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800">Compare</button>
                    <button type="button" class="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800">Last 90d</button>
                </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                @foreach ([
                    ['MRR', '$48.2k', '+12.4%', 'vs prior period', 'text-emerald-400'],
                    ['Active users', '2,840', '+4.1%', 'weekly active', 'text-emerald-400'],
                    ['Churn', '1.2%', '−0.3pp', 'logo churn', 'text-cyan-400'],
                    ['Latency p95', '182ms', '−8ms', 'edge POP', 'text-emerald-400'],
                ] as [$label, $value, $delta, $sub, $color])
                    <div class="rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-5">
                        <div class="flex items-start justify-between gap-2">
                            <p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">{{ $label }}</p>
                            <span class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">Live</span>
                        </div>
                        <p class="mt-3 text-3xl font-bold tabular-nums text-white">{{ $value }}</p>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-xs font-semibold {{ $color }}">{{ $delta }}</span>
                            <span class="text-xs text-zinc-600">{{ $sub }}</span>
                        </div>
                    </div>
                @endforeach
            </div>

            <div class="mt-8 grid gap-6 lg:grid-cols-3">
                <div class="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 class="text-sm font-semibold text-white">API requests</h2>
                            <p class="text-xs text-zinc-500">Millions · 7-day rolling</p>
                        </div>
                        <div class="flex gap-2">
                            <span class="rounded-md bg-cyan-500/15 px-2 py-1 text-[10px] font-medium text-cyan-300">API</span>
                            <span class="rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-500">Webhooks</span>
                        </div>
                    </div>
                    <div class="relative h-52 overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/50">
                        <svg class="h-full w-full" viewBox="0 0 480 160" preserveAspectRatio="none" aria-hidden="true">
                            <defs>
                                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="rgb(34 211 238)" stop-opacity="0.35" />
                                    <stop offset="100%" stop-color="rgb(34 211 238)" stop-opacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0 120 L40 100 L80 110 L120 70 L160 85 L200 55 L240 65 L280 40 L320 50 L360 35 L400 45 L440 30 L480 25 L480 160 L0 160 Z" fill="url(#chartFill)" />
                            <path d="M0 120 L40 100 L80 110 L120 70 L160 85 L200 55 L240 65 L280 40 L320 50 L360 35 L400 45 L440 30 L480 25" fill="none" stroke="rgb(34 211 238)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
                            @foreach ([40, 120, 200, 280, 360, 440] as $x)
                                <line x1="{{ $x }}" y1="0" x2="{{ $x }}" y2="160" stroke="rgb(39 39 42)" stroke-width="1" stroke-dasharray="4 4" />
                            @endforeach
                        </svg>
                        <div class="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-zinc-600">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                    <h2 class="text-sm font-semibold text-white">Recent activity</h2>
                    <ul class="mt-4 space-y-2">
                        @foreach ([
                            ['bg-emerald-500', 'Deploy', 'v2.14.0 → production', '2h ago'],
                            ['bg-amber-500', 'Alert', 'EU traffic +34% vs baseline', 'Yesterday'],
                            ['bg-zinc-500', 'Billing', 'Invoice #1042 paid · $12,400', '3d ago'],
                            ['bg-cyan-500', 'Access', 'New SSO login · Okta', '4d ago'],
                        ] as [$dotClass, $tag, $line, $time])
                            <li class="flex gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-3">
                                <span class="mt-1 h-2 w-2 shrink-0 rounded-full {{ $dotClass }}"></span>
                                <div class="min-w-0 flex-1">
                                    <p class="text-xs font-medium text-zinc-400">{{ $tag }}</p>
                                    <p class="truncate text-sm text-zinc-200">{{ $line }}</p>
                                    <p class="text-[11px] text-zinc-600">{{ $time }}</p>
                                </div>
                            </li>
                        @endforeach
                    </ul>
                </div>
            </div>

            <div class="mt-8 grid gap-6 lg:grid-cols-2">
                <div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                    <div class="mb-4 flex items-center justify-between">
                        <h2 class="text-sm font-semibold text-white">Top customers</h2>
                        <a href="#" class="text-xs font-medium text-cyan-400 hover:text-cyan-300">View all</a>
                    </div>
                    <div class="overflow-hidden rounded-lg border border-zinc-800">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-500">
                                <tr>
                                    <th class="px-4 py-3 font-medium">Customer</th>
                                    <th class="px-4 py-3 font-medium">MRR</th>
                                    <th class="px-4 py-3 font-medium">Health</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-zinc-800">
                                @foreach ([['Northwind Labs', '$8,400', '92'], ['Orbit Media', '$5,100', '88'], ['Harbor AI', '$3,750', '76']] as [$name, $mrr, $h])
                                    <tr class="hover:bg-zinc-800/40">
                                        <td class="px-4 py-3 font-medium text-zinc-200">{{ $name }}</td>
                                        <td class="px-4 py-3 tabular-nums text-zinc-400">{{ $mrr }}</td>
                                        <td class="px-4 py-3">
                                            <span class="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">{{ $h }}</span>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                    <h2 class="text-sm font-semibold text-white">System status</h2>
                    <ul class="mt-4 space-y-3">
                        @foreach ([['Edge API', 'Operational', 'text-emerald-400'], ['Ingest workers', 'Degraded · queue 2m', 'text-amber-400'], ['Billing webhooks', 'Operational', 'text-emerald-400']] as [$sys, $st, $tc])
                            <li class="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3">
                                <span class="text-sm text-zinc-300">{{ $sys }}</span>
                                <span class="text-xs font-medium {{ $tc }}">{{ $st }}</span>
                            </li>
                        @endforeach
                    </ul>
                    <p class="mt-4 text-center text-[11px] text-zinc-600">Status page · status.pulseops.io</p>
                </div>
            </div>
        </main>
    </div>
</div>
