@php
    $portfolio = rtrim((string) config('vissai.portfolio_url'), '/');
    $platform = rtrim((string) config('vissai.platform_url'), '/');
@endphp
<a href="{{ $portfolio }}/about" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-red-500 focus:px-4 focus:py-2 focus:text-ink focus:outline-none">Skip to playground</a>

{{-- Classes mirror portfolio/*.html header — grid column key portfolio-nav in tailwind.config.js --}}
<header id="vissai-portfolio-shell-header" class="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-xl">
    <nav class="mx-auto grid max-w-6xl grid-cols-1 gap-y-3 px-5 py-4 text-sm font-medium text-zinc-400 md:grid-cols-portfolio-nav md:items-center md:gap-x-6 md:gap-y-0" aria-label="Primary">
        <div class="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 uppercase md:justify-end">
            <a href="{{ $portfolio }}/about" class="rounded-md px-3 py-1.5 transition hover:bg-white/5 hover:text-red-300">About</a>
            <a href="{{ $portfolio }}/contact.html" class="rounded-md px-3 py-1.5 transition hover:bg-white/5 hover:text-red-300">Contact</a>
            <a href="{{ $portfolio }}/media" class="rounded-md px-3 py-1.5 transition hover:bg-white/5 hover:text-red-300">Coaching</a>
        </div>
        <a href="{{ $portfolio }}/hub.html" class="group justify-self-center whitespace-nowrap font-mono text-sm tracking-tight">
            <span class="font-semibold text-red-600 vissai-shell-brand-ai">VissAI</span>
        </a>
        <div class="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 uppercase md:justify-start">
            <a href="{{ url('/websites') }}" class="rounded-md px-3 py-1.5 text-red-300 transition hover:bg-white/5 hover:text-red-200" aria-current="page">Websites</a>
            <a href="{{ $portfolio }}/live-projects.html" class="rounded-md px-3 py-1.5 transition hover:bg-white/5 hover:text-red-300">Automations</a>
            <a href="{{ $portfolio }}/agents.html" class="rounded-md px-3 py-1.5 transition hover:bg-white/5 hover:text-red-300">Agents</a>
        </div>
    </nav>
</header>
