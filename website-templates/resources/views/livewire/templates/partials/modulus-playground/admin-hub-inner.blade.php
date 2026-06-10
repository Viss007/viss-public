@php
        $adminViewParam = (string) request()->query('view', '');
        $adminShowOverview = ! in_array($adminViewParam, ['agent', 'connections'], true);
        $adminShowConnections = $adminViewParam === 'connections';
        $adminShowAgent = $adminViewParam === 'agent';
    @endphp
    <section data-modulus-admin-hub="1" data-agent-url="{{ route('playground.modulus.agent.dashboard') }}" class="mod-admin-dashboard flex min-h-0 flex-1 flex-col" id="top">
        <div class="mod-admin-shell flex min-h-0 flex-1 overflow-hidden bg-zinc-950 text-zinc-100 antialiased">
            <aside
                id="mod-admin-sidebar"
                class="mod-admin-sidebar hidden w-64 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-900/40 transition-[width] duration-200 ease-out lg:flex"
            >
                <div class="mod-admin-sidebar-header flex h-14 items-center justify-between gap-2 border-b border-zinc-800 px-4">
                    <span class="mod-admin-sidebar-label min-w-0 text-sm font-bold tracking-tight text-white">Modulus<span class="text-cyan-400">Admin</span></span>
                    <button
                        type="button"
                        id="mod-admin-sidebar-toggle"
                        class="mod-admin-sidebar-toggle inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white p-0 text-zinc-950 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400/40"
                        aria-controls="mod-admin-sidebar"
                        aria-expanded="true"
                        aria-label="Collapse sidebar"
                    >
                        <svg class="mod-admin-sidebar-icon-expanded h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.25" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        <svg class="mod-admin-sidebar-icon-collapsed hidden h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.25" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>
                <nav class="mod-admin-sidebar-nav flex-1 space-y-0.5 p-3" aria-label="Admin">
                    @php
                        $nav = [
                            ['HOME', false, $modulusUrls['home']],
                            ['ABOUT', false, $modulusUrls['about']],
                            ['PROCESS', false, $modulusUrls['process']],
                            ['GALLERY', false, $modulusUrls['gallery']],
                            ['PRICING', false, $modulusUrls['pricing']],
                            ['REACH OUT', false, $modulusUrls['reach_out']],
                            ['ONLINE BOOKING', false, $modulusUrls['booking']],
                            ['ADMIN BOOKING', false, $modulusUrls['booking']],
                        ];
                    @endphp
                    @foreach ($nav as [$label, $active, $url])
                        <a
                            href="{{ $url }}"
                            title="{{ $label }}"
                            class="{{ $active ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white' }} mod-admin-sidebar-nav-link flex items-center rounded-lg px-3 py-2 text-sm font-medium transition"
                        >
                            <span class="mod-admin-sidebar-label mod-admin-sidebar-nav-link__label truncate">{{ $label }}</span>
                        </a>
                    @endforeach
                </nav>
                <div class="mod-admin-sidebar-footer border-t border-zinc-800 p-3">
                    <div class="mod-admin-sidebar-profile flex items-center gap-3 rounded-lg bg-zinc-800/50 px-3 py-2.5 ring-1 ring-white/5">
                        <div class="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-700" role="img" aria-label="Profile">
                            <svg class="h-full w-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <defs>
                                    <linearGradient id="mod-admin-avatar-bg" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
                                        <stop stop-color="#e4e4e7" />
                                        <stop offset="1" stop-color="#9ca3af" />
                                    </linearGradient>
                                </defs>
                                <circle cx="24" cy="24" r="24" fill="url(#mod-admin-avatar-bg)" />
                                <circle cx="24" cy="17" r="7.5" fill="#0f172a" />
                                <ellipse cx="24" cy="37" rx="13" ry="10" fill="#0f172a" />
                            </svg>
                        </div>
                        <div class="mod-admin-sidebar-label min-w-0 flex-1">
                            <p class="truncate text-xs font-semibold text-white">Erika Amerika</p>
                        </div>
                        <form action="{{ route('playground.modulus.logout') }}" method="post" class="mod-admin-sidebar-profile-signout shrink-0">
                            @csrf
                            <button type="submit" class="rounded-lg bg-cyan-500 px-2 py-1.5 text-[10px] font-semibold text-zinc-950 hover:bg-cyan-400 sm:px-3 sm:text-xs">Sign out</button>
                        </form>
                    </div>
                </div>
            </aside>

            <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <header class="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur sm:px-6">
                    <div class="flex w-full min-w-0 flex-1 items-center justify-between gap-3 lg:hidden">
                        <span class="text-sm font-bold text-white">ModulusAdmin</span>
                        <form action="{{ route('playground.modulus.logout') }}" method="post">
                            @csrf
                            <button type="submit" class="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-cyan-400">Sign out</button>
                        </form>
                    </div>
                    <div class="mod-admin-header-toolbar hidden min-h-0 min-w-0 w-full max-w-none flex-1 items-center justify-between gap-4 lg:flex">
                        <div class="flex min-w-0 flex-1 items-center gap-3">
                            <div class="relative min-w-0 flex-1 max-w-md">
                                <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">
                                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                                </span>
                                <input type="search" aria-label="Search" class="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-zinc-200 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40" />
                            </div>
                            <button
                                type="button"
                                title="Overview"
                                id="mod-admin-overview-link"
                                data-admin-view="overview"
                                aria-current="{{ $adminShowOverview ? 'page' : 'false' }}"
                                class="mod-admin-header-overview inline-flex shrink-0 items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 shadow-sm transition hover:bg-cyan-500/20 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                            >
                                Overview
                            </button>
                            <button
                                type="button"
                                title="Connection's"
                                id="mod-admin-connections-link"
                                data-admin-view="connections"
                                aria-current="{{ $adminShowConnections ? 'page' : 'false' }}"
                                class="mod-admin-header-connections inline-flex shrink-0 items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 shadow-sm transition hover:bg-cyan-500/20 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                            >
                                Connection's
                            </button>
                        </div>
                        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
                            <p class="mod-sim__ai-note whitespace-nowrap">
                                Powered by <span class="mod-sim__ai-note-highlight">VissAI</span>
                            </p>
                            <button
                                type="button"
                                id="mod-admin-ai-chat-toggle"
                                data-admin-view="agent"
                                aria-current="{{ $adminShowAgent ? 'page' : 'false' }}"
                                class="mod-admin-ai-agent inline-flex shrink-0 items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold tracking-wide text-cyan-300 shadow-sm transition hover:bg-cyan-500/20 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                title="Voice agent chat in this page (full-page panel still available via open in new tab)"
                            >
                                AGENT'S
                            </button>
                        </div>
                    </div>
                </header>

                <main
                    id="mod-admin-main"
                    @class([
                        'flex min-h-0 flex-1 flex-col overflow-auto p-4 sm:p-6 lg:p-8',
                        'mod-admin-main--connections' => $adminShowConnections,
                    ])
                >
                    <div id="mod-admin-dashboard-view" @class(['hidden' => ! $adminShowOverview])>
                        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            @foreach ([
                                ['Bookings', (string) count($bookings ?? []), 'Live', 'latest submissions', 'text-cyan-400'],
                                ['Pending', (string) count($bookings ?? []), 'Needs review', 'new requests', 'text-amber-400'],
                                ['Contacts', (string) count($bookings ?? []), 'Synced', 'email + phone', 'text-emerald-400'],
                                ['Latency p95', '182ms', 'Stable', 'edge POP', 'text-emerald-400'],
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

                        <div class="mt-8">
                            <div class="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                                <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h2 class="text-sm font-semibold text-white">Booking flow activity</h2>
                                        <p class="text-xs text-zinc-500">Demo trend · 7-day rolling</p>
                                    </div>
                                    <div class="flex gap-2">
                                        <span class="rounded-md bg-cyan-500/15 px-2 py-1 text-[10px] font-medium text-cyan-300">Booking</span>
                                        <span class="rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-500">Contact</span>
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
                                    </svg>
                                    <div class="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-zinc-600">
                                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="mod-admin-connections-view" @class(['flex flex-col gap-6', 'hidden' => ! $adminShowConnections]) aria-label="API &amp; connections">
                        <div class="flex flex-wrap items-end justify-between gap-4">
                            <div class="min-w-0">
                                <div class="flex shrink-0 flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        id="mod-admin-conn-expand-all"
                                        class="inline-flex shrink-0 items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 shadow-sm transition hover:bg-cyan-500/20 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                    >
                                        Expand all
                                    </button>
                                    <button
                                        type="button"
                                        id="mod-admin-conn-collapse-all"
                                        class="inline-flex shrink-0 items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 shadow-sm transition hover:bg-cyan-500/20 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                    >
                                        Collapse all
                                    </button>
                                </div>
                            </div>
                        </div>

                        @php
                            $modAdminConnectors = [
                                [
                                    'group' => 'Payments & billing',
                                    'name' => 'Stripe',
                                    'purpose' => 'Card payments, Billing, Connect',
                                    'api_shape' => 'REST + webhooks',
                                    'secret_type' => 'api_key',
                                    'secret_hint' => 'Publishable + secret keys; webhook signing secret',
                                ],
                                [
                                    'group' => 'Payments & billing',
                                    'name' => 'PayPal',
                                    'purpose' => 'Checkout, subscriptions, payouts',
                                    'api_shape' => 'REST + webhooks',
                                    'secret_type' => 'client_secret',
                                    'secret_hint' => 'Client ID/secret or partner credentials',
                                ],
                                [
                                    'group' => 'Payments & billing',
                                    'name' => 'Square',
                                    'purpose' => 'POS + online payments',
                                    'api_shape' => 'REST + webhooks',
                                    'secret_type' => 'signing_secret',
                                    'secret_hint' => 'Application secret + webhook signature key',
                                ],
                                [
                                    'group' => 'Email & messaging',
                                    'name' => 'SendGrid',
                                    'purpose' => 'Transactional & marketing email',
                                    'api_shape' => 'HTTP API',
                                    'secret_type' => 'api_key',
                                    'secret_hint' => 'Full-access or scoped API key',
                                ],
                                [
                                    'group' => 'Email & messaging',
                                    'name' => 'Amazon SES / SMTP',
                                    'purpose' => 'High-volume email via AWS',
                                    'api_shape' => 'SMTP or AWS SDK',
                                    'secret_type' => 'api_key',
                                    'secret_hint' => 'SMTP password or IAM access key + secret',
                                ],
                                [
                                    'group' => 'Email & messaging',
                                    'name' => 'Postmark',
                                    'purpose' => 'Transactional email API',
                                    'api_shape' => 'REST',
                                    'secret_type' => 'api_key',
                                    'secret_hint' => 'Server API token per environment',
                                ],
                                [
                                    'group' => 'Email & messaging',
                                    'name' => 'Twilio',
                                    'purpose' => 'SMS, voice, WhatsApp business',
                                    'api_shape' => 'REST + webhooks',
                                    'secret_type' => 'api_key',
                                    'secret_hint' => 'Account SID + auth token or API key',
                                ],
                                [
                                    'group' => 'Analytics & product',
                                    'name' => 'Google Analytics 4',
                                    'purpose' => 'Traffic, funnels, attribution',
                                    'api_shape' => 'Measurement Protocol / Admin API',
                                    'secret_type' => 'api_key',
                                    'secret_hint' => 'Measurement ID + API secret; OAuth for admin',
                                ],
                                [
                                    'group' => 'Analytics & product',
                                    'name' => 'PostHog',
                                    'purpose' => 'Product analytics, feature flags',
                                    'api_shape' => 'REST + event capture',
                                    'secret_type' => 'api_key',
                                    'secret_hint' => 'Project API key (public vs server)',
                                ],
                                [
                                    'group' => 'Analytics & product',
                                    'name' => 'Mixpanel',
                                    'purpose' => 'Event analytics, cohorts',
                                    'api_shape' => 'Ingest + REST',
                                    'secret_type' => 'api_key',
                                    'secret_hint' => 'Project token + secret for exports',
                                ],
                                [
                                    'group' => 'Identity & access',
                                    'name' => 'OIDC / Enterprise SSO',
                                    'purpose' => 'Staff & admin sign-in (SAML/OIDC)',
                                    'api_shape' => 'OAuth 2.0 / OIDC',
                                    'secret_type' => 'client_secret',
                                    'secret_hint' => 'Client secret + IdP metadata / JWKS',
                                ],
                                [
                                    'group' => 'Identity & access',
                                    'name' => 'Auth0',
                                    'purpose' => 'Hosted auth, rules, MFA',
                                    'api_shape' => 'Management + Authentication API',
                                    'secret_type' => 'client_secret',
                                    'secret_hint' => 'Client ID/secret; M2M client for Management API',
                                ],
                                [
                                    'group' => 'Identity & access',
                                    'name' => 'Google Sign-In (OAuth)',
                                    'purpose' => 'Social / workforce Google login',
                                    'api_shape' => 'OAuth 2.0',
                                    'secret_type' => 'oauth_refresh',
                                    'secret_hint' => 'Web client secret + authorized redirect URIs',
                                ],
                                [
                                    'group' => 'Identity & access',
                                    'name' => 'Microsoft Entra ID',
                                    'purpose' => 'Azure AD / Microsoft 365 SSO',
                                    'api_shape' => 'Microsoft Graph + OIDC',
                                    'secret_type' => 'client_secret',
                                    'secret_hint' => 'App registration client secret or certificate',
                                ],
                                [
                                    'group' => 'Webhooks & automation',
                                    'name' => 'Outbound webhooks',
                                    'purpose' => 'Events from Modulus to your stack',
                                    'api_shape' => 'Signed HTTPS POST',
                                    'secret_type' => 'signing_secret',
                                    'secret_hint' => 'HMAC (e.g. SHA-256) shared signing secret per endpoint',
                                ],
                                [
                                    'group' => 'Webhooks & automation',
                                    'name' => 'Inbound webhook receiver',
                                    'purpose' => 'Verify callbacks from Stripe, Twilio, etc.',
                                    'api_shape' => 'Provider-specific signatures',
                                    'secret_type' => 'signing_secret',
                                    'secret_hint' => 'Vendor webhook secret for signature validation',
                                ],
                                [
                                    'group' => 'Webhooks & automation',
                                    'name' => 'Slack',
                                    'purpose' => 'Channel notifications, slash commands',
                                    'api_shape' => 'Web API + Events API',
                                    'secret_type' => 'bearer_token',
                                    'secret_hint' => 'Bot token; signing secret for interactive payloads',
                                ],
                                [
                                    'group' => 'Maps & geo',
                                    'name' => 'Google Maps Platform',
                                    'purpose' => 'Places, Geocoding, Routes',
                                    'api_shape' => 'HTTP APIs',
                                    'secret_type' => 'api_key',
                                    'secret_hint' => 'Key restricted by API + HTTP referrer / IP',
                                ],
                                [
                                    'group' => 'Maps & geo',
                                    'name' => 'Mapbox',
                                    'purpose' => 'Maps, geocoding, navigation',
                                    'api_shape' => 'REST + tile endpoints',
                                    'secret_type' => 'api_key',
                                    'secret_hint' => 'Default public token + secret for server-side',
                                ],
                                [
                                    'group' => 'Cloud & infrastructure',
                                    'name' => 'Cloudflare',
                                    'purpose' => 'DNS, WAF, Workers, cache purge',
                                    'api_shape' => 'REST (Accounts, Zone)',
                                    'secret_type' => 'bearer_token',
                                    'secret_hint' => 'API token with least-privilege scopes',
                                ],
                                [
                                    'group' => 'Cloud & infrastructure',
                                    'name' => 'S3-compatible storage',
                                    'purpose' => 'Uploads, exports, assets (AWS S3, R2, MinIO)',
                                    'api_shape' => 'SDK / REST (SigV4)',
                                    'secret_type' => 'api_key',
                                    'secret_hint' => 'Access key + secret key; optional session token',
                                ],
                            ];
                        @endphp

                        <div class="flex flex-col gap-6">
                            @php $modAdminConnGroup = null; @endphp
                            @foreach ($modAdminConnectors as $connector)
                                @if ($modAdminConnGroup !== $connector['group'])
                                    @php $modAdminConnGroup = $connector['group']; @endphp
                                    <div class="mod-admin-conn-group">
                                        <h2 class="border-b border-cyan-500/20 pb-2 text-xs font-semibold uppercase tracking-wider text-cyan-200/70">
                                            {{ $connector['group'] }}
                                        </h2>
                                    </div>
                                @endif
                                <details class="mod-admin-conn-details rounded-xl border border-cyan-500/40 bg-zinc-900/45 shadow-sm ring-1 ring-cyan-500/15 open:border-cyan-500/55 open:bg-zinc-900/55 open:ring-cyan-500/25">
                                    <summary class="mod-admin-conn-summary flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5">
                                        <div class="min-w-0 flex-1 text-left">
                                            <div class="flex flex-wrap items-center gap-2">
                                                <span class="text-sm font-semibold text-white">{{ $connector['name'] }}</span>
                                                <span class="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">Not connected</span>
                                            </div>
                                            <p class="mt-1 text-xs text-zinc-500">{{ $connector['purpose'] }}</p>
                                            <p class="mt-2 text-[11px] uppercase tracking-wide text-zinc-600">API shape: {{ $connector['api_shape'] }}</p>
                                        </div>
                                        <svg
                                            class="mod-admin-conn-chevron h-5 w-5 shrink-0 text-cyan-400/60 transition-transform duration-200"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            aria-hidden="true"
                                        >
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </summary>
                                    <div class="border-t border-cyan-500/15 px-4 pb-6 pt-4 sm:px-5">
                                        <div class="space-y-3">
                                            <div>
                                                <label class="block text-[11px] font-medium uppercase tracking-wide text-zinc-500" for="mod-conn-secret-type-{{ $loop->index }}">
                                                    Secret type
                                                </label>
                                                <select
                                                    id="mod-conn-secret-type-{{ $loop->index }}"
                                                    class="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                                                    disabled
                                                >
                                                    <option value="{{ $connector['secret_type'] }}" selected>{{ str_replace('_', ' ', $connector['secret_type']) }}</option>
                                                    <option value="oauth_refresh">OAuth refresh token</option>
                                                    <option value="basic_auth">Basic auth</option>
                                                    <option value="jwt">JWT private key</option>
                                                </select>
                                                <p class="mt-1 text-xs text-zinc-600">{{ $connector['secret_hint'] }}</p>
                                            </div>
                                            <div>
                                                <label class="block text-[11px] font-medium uppercase tracking-wide text-zinc-500" for="mod-conn-secret-val-{{ $loop->index }}">
                                                    Credential (masked)
                                                </label>
                                                <input
                                                    id="mod-conn-secret-val-{{ $loop->index }}"
                                                    type="password"
                                                    readonly
                                                    value="••••••••••••••••"
                                                    class="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 font-mono text-sm text-zinc-500"
                                                    autocomplete="off"
                                                />
                                            </div>
                                            <div class="flex flex-wrap gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    class="inline-flex items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 opacity-60 shadow-sm"
                                                    disabled
                                                    title="Wire backend to enable"
                                                >
                                                    Connect
                                                </button>
                                                <button
                                                    type="button"
                                                    class="inline-flex items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200/70 opacity-60 shadow-sm"
                                                    disabled
                                                >
                                                    Test
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            @endforeach
                        </div>
                    </div>

                    <div id="mod-admin-agent-view" @class(['mod-admin-agent-view min-h-0 flex-1 flex-col', 'flex' => $adminShowAgent, 'hidden' => ! $adminShowAgent])>
                        <div
                            id="mod-admin-agent-host"
                            class="mod-admin-agent-host relative w-full min-h-0 flex-1 overflow-hidden bg-zinc-950"
                            aria-live="polite"
                        >
                            <div class="flex h-full min-h-[16rem] items-center justify-center text-xs text-zinc-500">
                                Open AGENT'S to load chat
                            </div>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    </section>
    <link rel="stylesheet" href="{{ asset('modulus-booking-build/assets/booking-Cy4Kn6p4.css') }}" />
    <style>
        /* Admin hub: cap layout <main> so inner shell can use 100dvh without growing the document. */
        body.dvele-clone main.mod-admin-root-main {
            display: flex;
            flex-direction: column;
            min-height: 0;
            height: 100dvh;
            max-height: 100dvh;
            overflow: hidden;
        }

        /* Connections tab: same cyan accent family as AGENT'S — light wash at top of <main> */
        #mod-admin-main.mod-admin-main--connections {
            background: linear-gradient(180deg, rgb(6 182 212 / 0.07) 0%, transparent 14rem);
        }

        /* Inactive panes must not participate in layout (avoids stacked overview + connections height). */
        #mod-admin-main #mod-admin-dashboard-view.hidden,
        #mod-admin-main #mod-admin-connections-view.hidden,
        #mod-admin-main #mod-admin-agent-view.hidden {
            display: none !important;
        }

        #mod-admin-sidebar-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            padding: 0;
            line-height: 0;
            border-radius: 9999px;
            background: #fff;
            color: rgb(0 0 0);
        }

        #mod-admin-sidebar-toggle:hover {
            background: rgb(244 244 245); /* zinc-100 */
            color: rgb(0 0 0);
        }

        /* Explicit stroke so global styles can’t wash out the icon on white */
        #mod-admin-sidebar-toggle svg {
            display: block;
            width: 1rem;
            height: 1rem;
            flex-shrink: 0;
        }

        #mod-admin-sidebar-toggle svg path {
            stroke: rgb(0 0 0);
            fill: none;
        }

        #mod-admin-sidebar-toggle:hover svg path {
            stroke: rgb(0 0 0);
        }

        /* Chevron paths sit slightly left of optical center in a 24×24 box */
        #mod-admin-sidebar-toggle .mod-admin-sidebar-icon-expanded {
            transform: translateX(1px);
        }

        #mod-admin-sidebar-toggle .mod-admin-sidebar-icon-collapsed {
            transform: translateX(-0.5px);
        }

        /* .mod-sim__ai-note uses uppercase; allow mixed-case brand in header */
        .mod-admin-header-toolbar .mod-sim__ai-note-highlight {
            text-transform: none;
            letter-spacing: 0.06em;
        }

        .mod-admin-header-overview,
        .mod-admin-header-connections {
            transition: box-shadow 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, color 0.22s ease;
        }

        .mod-admin-header-overview[aria-current='page'],
        .mod-admin-header-connections[aria-current='page'] {
            border-color: rgb(34 211 238 / 0.55);
            background-color: rgb(6 182 212 / 0.22);
            color: rgb(207 250 254);
            box-shadow:
                0 0 0 1px rgb(34 211 238 / 0.2),
                0 0 14px rgb(34 211 238 / 0.12);
        }

        .mod-admin-header-overview[aria-current='page']:hover,
        .mod-admin-header-connections[aria-current='page']:hover {
            border-color: rgb(34 211 238 / 0.7);
            background-color: rgb(6 182 212 / 0.3);
        }

        /* Native collapsible rows (integrations list) */
        #mod-admin-connections-view .mod-admin-conn-details > summary::-webkit-details-marker {
            display: none;
        }

        #mod-admin-connections-view .mod-admin-conn-details > summary {
            list-style: none;
        }

        #mod-admin-connections-view .mod-admin-conn-summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            cursor: pointer;
            padding: 1rem 1.25rem;
        }

        #mod-admin-connections-view .mod-admin-conn-summary > div {
            min-width: 0;
            flex: 1 1 auto;
            text-align: left;
        }

        #mod-admin-connections-view .mod-admin-conn-chevron {
            width: 1.25rem;
            height: 1.25rem;
            flex: 0 0 1.25rem;
        }

        #mod-admin-connections-view .mod-admin-conn-details[open] .mod-admin-conn-chevron {
            transform: rotate(180deg);
        }

        #mod-admin-connections-view .mod-admin-conn-group + .mod-admin-conn-details {
            margin-top: 0;
        }

        .mod-admin-ai-agent {
            transition: box-shadow 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, color 0.22s ease;
        }

        .mod-admin-ai-agent[aria-current='page'] {
            border-color: rgb(34 211 238 / 0.55);
            background-color: rgb(6 182 212 / 0.22);
            color: rgb(207 250 254);
            box-shadow:
                0 0 0 1px rgb(34 211 238 / 0.2),
                0 0 14px rgb(34 211 238 / 0.12);
        }

        .mod-admin-ai-agent[aria-current='page']:hover {
            border-color: rgb(34 211 238 / 0.7);
            background-color: rgb(6 182 212 / 0.3);
        }

        .mod-admin-agent-host > script {
            display: none !important;
        }

        .mod-admin-agent-host #modulusAdminHubBack {
            display: none !important;
        }

        #mod-admin-main.mod-admin-main--agent {
            overflow: hidden;
            padding: 0 !important;
            height: calc(100vh - 3.5rem);
            max-height: calc(100vh - 3.5rem);
        }

        #mod-admin-main.mod-admin-main--agent #mod-admin-agent-view {
            min-height: 0;
            height: 100%;
            width: 100%;
            flex: 1 1 auto;
        }

        /* Full-bleed agent panel: no rounded card, no inset border — uses entire main below header. */
        #mod-admin-main.mod-admin-main--agent .mod-admin-agent-host {
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
        }

        /*
         * Voice dashboard defaults add horizontal padding + a 24px-radius composer “card”.
         * In Modulus admin, pull the chat column and composer flush to the host edges.
         */
        .mod-admin-agent-host #appRoot .chat-main {
            padding-left: 0 !important;
            padding-right: 0 !important;
        }

        .mod-admin-agent-host #appRoot .chat-toolbar {
            padding-left: 14px !important;
            padding-right: 14px !important;
        }

        .mod-admin-agent-host #appRoot .chat-composer-wrap {
            padding-left: 0 !important;
            padding-right: 0 !important;
            padding-bottom: 0 !important;
        }

        .mod-admin-agent-host #appRoot .chat-composer {
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-bottom: none !important;
            border-top: 1px solid rgba(148, 163, 184, 0.28) !important;
            box-shadow: none !important;
            animation: none !important;
        }

        .mod-admin-agent-host #appRoot .chat-composer:focus-within {
            animation: none !important;
            box-shadow: none !important;
            border-top-color: rgba(148, 163, 184, 0.4) !important;
        }

        .mod-admin-agent-host,
        .mod-admin-agent-host #appRoot {
            min-height: 0 !important;
            height: 100% !important;
            max-height: 100% !important;
        }

        .mod-admin-agent-host #appRoot {
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
            --drawer-w: min(360px, 42vw) !important;
        }

        .mod-admin-agent-host #appRoot .workspace-row,
        .mod-admin-agent-host #appRoot .chat-shell,
        .mod-admin-agent-host #appRoot .chat-main {
            min-height: 0 !important;
        }

        .mod-admin-agent-host #appRoot .workspace-row {
            flex: 1 1 auto !important;
            overflow: hidden !important;
            padding-right: var(--drawer-w) !important;
        }

        .mod-admin-agent-host #appRoot.sidebar-collapsed .workspace-row {
            padding-right: 0 !important;
        }

        .mod-admin-agent-host #appRoot .chat-shell,
        .mod-admin-agent-host #appRoot .chat-main,
        .mod-admin-agent-host #appRoot #section-log,
        .mod-admin-agent-host #appRoot #section-log-body {
            display: flex !important;
            flex-direction: column !important;
            flex: 1 1 auto !important;
            min-height: 0 !important;
            max-height: 100% !important;
            overflow: hidden !important;
        }

        .mod-admin-agent-host #appRoot #log {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            max-height: 100% !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            overscroll-behavior: contain !important;
        }

        /*
         * Voice agent: “expand composer” sets #appRoot.chat-composer-expanded-v (hides feed, grows textarea).
         * Base rules above use !important on #section-log and .chat-main flex — same specificity as the
         * dashboard’s non-important toggles, so the expand control appeared to do nothing in-panel.
         */
        .mod-admin-agent-host #appRoot.chat-composer-expanded-v .chat-shell > .chat-main {
            flex: 0 0 auto !important;
        }

        .mod-admin-agent-host #appRoot.chat-composer-expanded-v #section-log {
            display: none !important;
        }

        .mod-admin-agent-host #appRoot.chat-composer-expanded-v .chat-shell > .chat-composer-wrap {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            display: flex !important;
            flex-direction: column !important;
        }

        .mod-admin-agent-host #appRoot .sidebar-stack {
            position: absolute !important;
            top: 56px !important;
            right: 0 !important;
            width: var(--drawer-w) !important;
            max-width: var(--drawer-w) !important;
            height: calc(100% - 56px) !important;
            max-height: calc(100% - 56px) !important;
            z-index: 40 !important;
        }

        body.mod-admin-agent-open #top .mod-admin-shell {
            height: 100%;
            max-height: 100%;
            min-height: 0;
            overflow: hidden;
        }

        #mod-admin-sidebar.mod-admin-sidebar--collapsed {
            width: 4rem;
            min-width: 4rem;
        }

        #mod-admin-sidebar.mod-admin-sidebar--collapsed .mod-admin-sidebar-header {
            justify-content: center;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
        }

        #mod-admin-sidebar.mod-admin-sidebar--collapsed .mod-admin-sidebar-profile-signout {
            display: none;
        }

        #mod-admin-sidebar.mod-admin-sidebar--collapsed .mod-admin-sidebar-header .mod-admin-sidebar-label,
        #mod-admin-sidebar.mod-admin-sidebar--collapsed .mod-admin-sidebar-profile > .mod-admin-sidebar-label,
        #mod-admin-sidebar.mod-admin-sidebar--collapsed .mod-admin-sidebar-icon-expanded {
            display: none;
        }

        #mod-admin-sidebar.mod-admin-sidebar--collapsed .mod-admin-sidebar-icon-collapsed {
            display: block;
        }

        #mod-admin-sidebar.mod-admin-sidebar--collapsed .mod-admin-sidebar-nav {
            display: none;
        }

        #mod-admin-sidebar.mod-admin-sidebar--collapsed .mod-admin-sidebar-footer {
            margin-top: auto;
        }

        #mod-admin-sidebar.mod-admin-sidebar--collapsed .mod-admin-sidebar-profile {
            justify-content: center;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
        }

    </style>

